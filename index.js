module.exports = function (bot, options) {
    var disabled = false

    bot.autoEat = {}

    bot.autoEat.disable = function disable() {
        disabled = true
    }

    bot.autoEat.enable = function enable() {
        disabled = false
    }

    bot.autoEat.eat = eat;

    bot.autoEat.options = {}
    bot.autoEat.options.priority = options.priority || 'foodPoints'
    bot.autoEat.options.startAt = options.startAt || 14
    bot.autoEat.options.bannedFood = options.bannedFood || []

    var isEating = false

    const lodash = require('lodash')
    const mcData = require('minecraft-data')(bot.version)

    function callbackHandle(err) {
	if (err) console.error(err)
    }

    function eat(callback) {
        isEating = true

        var data = mcData.foodsArray
        var names = data.map((item) => item.name)

        var found_food = bot.inventory
            .items()
            .filter((item) => names.includes(item.name))

        if (found_food.length === 0 || !found_food) {
            isEating = false
            return callback(new Error('No food found.'))
        }

        var available_food = []

        bot.inventory.items().forEach((element) => {
            if (names.includes(element.name)) available_food.push(element)
        })

        if (bot.autoEat.options.bannedFood.length >= 0) {
            available_food = available_food.filter(
                (item) => !bot.autoEat.options.bannedFood.includes(item.name)
            )
        }

        var best_food

        if (bot.autoEat.options.priority === 'foodPoints')
            best_food = available_food.find(
                (item) =>
                    item.foodPoints ===
                    lodash.maxBy(available_food, 'foodPoints')
            )
        else
            best_food = available_food.find(
                (item) =>
                    item.saturation ===
                    lodash.maxBy(available_food, 'saturation')
            )

        if (!best_food) {
            isEating = false
            return callback(new Error('No best food has been found.'))
        }

        bot.emit('autoeat_started')

        bot.equip(best_food, 'hand', function (error) {
            if (error) {
                console.error(error)
                bot.emit('autoeat_stopped')
                isEating = false
            } else {
                bot.consume(function (err) {
                    if (err) {
                        console.error(err)
                        bot.emit('autoeat_stopped') 
                        isEating = false
                        return callback(err)
                    } else {
                        isEating = false
                        bot.emit('autoeat_stopped')
                        callback(null)
                        if (!bot.food === 20) eat(callbackHandle)
                    }
                })
            }
        })
    }

    bot.on('health', () => {
        if (bot.pathfinder) {
            if (
                bot.food < bot.autoEat.options.startAt &&
                !(bot.pathfinder.isMining() || bot.pathfinder.isBuilding()) &&
                isEating === false &&
                disabled === false
            ) {
                eat(callbackHandle)
            }
        } else {
            if (
                bot.food < bot.autoEat.options.startAt &&
                isEating === false &&
                disabled === false
            ) {
                eat(callbackHandle)
            }
        }
    })

    bot.on('spawn', () => {
        isEating = false // to prevent the plugin from breaking if the bot gets killed while eating btw
    })
}
