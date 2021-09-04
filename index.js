// @ts-nocheck
module.exports = function (bot, options) {
    bot.autoEat = { disabled: false, isEating: false }

    bot.autoEat.disable = function disable() {
        bot.autoEat.disabled = true
    }

    bot.autoEat.enable = function enable() {
        bot.autoEat.disabled = false
    }

    bot.autoEat.eat = eat

    bot.autoEat.options = {
        priority: options.priority || 'foodPoints',
        startAt: options.startAt || 14,
        bannedFood: options.bannedFood || [],
        ignoreInventoryCheck: options.ignoreInventoryCheck || false,
        checkOnItemPickup: options.checkOnItemPickup || false,
        eatingTimeout: options.eatingTimeout || 3
    }

    bot.autoEat.foodsByName = {}

    bot.once('spawn', () => {
        bot.autoEat.foodsByName = require('minecraft-data')(bot.version).foodsByName
    })

    function timeoutAfter(time, message) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(message))
            }, time)
        })
    }

    function eat(callback, manual = false) {
        callback = callback || ((e) => {}) // fallback callback that does nothing
        if (bot.autoEat.isEating) return callback(Error('Already eating'))

        bot.autoEat.isEating = true

        const priority = bot.autoEat.options.priority
        const banned = bot.autoEat.options.bannedFood
        const food = bot.autoEat.foodsByName

        const bestChoices = bot.inventory
            .items()
            .filter((item) => item.name in bot.autoEat.foodsByName)
            .filter((item) => !banned.includes(item.name))
            .sort((a, b) => food[b.name][priority] - food[a.name][priority])

        if (bestChoices.length === 0) {
            bot.autoEat.isEating = false

            if (!manual) return callback(null)
            else return callback(new Error('No Food found.'))
        }

        const bestFood = bestChoices[0]

        bot.emit('autoeat_started', bestFood)
        ;(async () => {
            try {
                const requiresConfirmation = bot.inventory.requiresConfirmation

                if (bot.autoEat.options.ignoreInventoryCheck) bot.inventory.requiresConfirmation = false

                await bot.equip(bestFood, 'hand')

                bot.inventory.requiresConfirmation = requiresConfirmation

                if (bot.autoEat.options.eatingTimeout !== null && bot.autoEat.options.eatingTimeout > 0) {
                    const timeout = bot.autoEat.options.eatingTimeout * 1000

                    await Promise.race([bot.consume(), timeoutAfter(timeout, 'Eating took too long')])
                } else {
                    await bot.consume()
                }
            } catch (error) {
                bot.emit('autoeat_stopped', error)
                bot.autoEat.isEating = false
                return callback(error)
            }

            bot.emit('autoeat_stopped')
            bot.autoEat.isEating = false

            callback(null)

            if (bot.food < bot.autoEat.options.startAt + 1) eat()
        })()
    }

    bot.on('health', () => {
        if (bot.autoEat.disabled || bot.food >= bot.autoEat.options.startAt) return
        else if (bot.pathfinder && (bot.pathfinder.isMining() || bot.pathfinder.isBuilding())) return

        try {
            bot.autoEat.eat()
        } catch (e) {}
    })

    bot.on('playerCollect', async (who) => {
        if (who.username !== bot.username || !bot.autoEat.options.checkOnItemPickup) return

        try {
            await bot.waitForTicks(1)
            bot.autoEat.eat()
        } catch (e) {}
    })

    bot.on('spawn', () => {
        bot.autoEat.isEating = false // Eating status is reset on spawn/death
    })

    bot.on('death', () => {
        bot.autoEat.isEating = false
    })
}
