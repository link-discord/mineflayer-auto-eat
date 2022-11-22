import mineflayer from 'mineflayer'
import mcData from 'minecraft-data'
import { Item } from 'prismarine-item'

interface Options {
    priority: 'saturation' | 'foodPoints'
    startAt: number
    bannedFood: string[]
    eatingTimeout: number
    ignoreInventoryCheck: boolean
    checkOnItemPickup: boolean
    useOffhand: boolean
    equipOldItem: boolean
}

declare module 'mineflayer' {
    interface Bot {
        registry: mcData.IndexedData
        autoEat: {
            disabled: boolean
            isEating: boolean
            options: Options
            eat: (offhand?: boolean) => Promise<void>
            disable: () => void
            enable: () => void
        }
    }

    interface BotEvents {
        autoeat_started: (eatenItem: Item, usedOffhand: boolean) => void
        autoeat_finished: (eatenItem: Item, usedOffhand: boolean) => void
        autoeat_error: (error?: Error) => void
    }
}

const sleep = (ms = 0) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export default function plugin(bot: mineflayer.Bot) {
    // @ts-ignore - Initializations
    bot.autoEat = {}

    bot.autoEat.disabled = false
    bot.autoEat.isEating = false

    bot.autoEat.options = {
        priority: 'foodPoints',
        startAt: 14,
        eatingTimeout: 3000,
        bannedFood: ['pufferfish', 'spider_eye', 'poisonous_potato', 'rotten_flesh'],
        ignoreInventoryCheck: false,
        checkOnItemPickup: true,
        useOffhand: false,
        equipOldItem: true
    }

    bot.autoEat.disable = () => {
        bot.autoEat.disabled = true
    }

    bot.autoEat.enable = () => {
        bot.autoEat.disabled = false
    }

    bot.autoEat.eat = async (offhand = bot.autoEat.options.useOffhand) => {
        if (bot.autoEat.isEating || bot.autoEat.disabled || bot.food > bot.autoEat.options.startAt) return
        bot.autoEat.isEating = true

        const priority = bot.autoEat.options.priority
        const banned = bot.autoEat.options.bannedFood
        const food = bot.registry.foodsByName

        const items = bot.inventory.items()
        const offhandItem = bot.inventory.slots[45]

        if (offhandItem) items.push(offhandItem)

        const bestChoices = items
            .filter((item) => item.name in bot.registry.foodsByName)
            .filter((item) => !banned.includes(item.name))
            .sort((a, b) => food[b.name][priority] - food[a.name][priority])

        if (bestChoices.length === 0) {
            bot.autoEat.isEating = false
            bot.emit('autoeat_error', new Error('No Food found.'))
            return
        }

        const bestFood = bestChoices[0]
        const usedHand: mineflayer.EquipmentDestination = offhand ? 'off-hand' : 'hand'

        bot.emit('autoeat_started', bestFood, offhand)

        const requiresConfirmation = bot.inventory.requiresConfirmation

        if (bot.autoEat.options.ignoreInventoryCheck) bot.inventory.requiresConfirmation = false

        const oldItem = bot.inventory.slots[bot.getEquipmentDestSlot(usedHand)]

        await bot.equip(bestFood, usedHand)

        bot.inventory.requiresConfirmation = requiresConfirmation

        bot.deactivateItem()
        bot.activateItem(offhand)

        const time = performance.now()

        while (
            bot.autoEat.isEating &&
            performance.now() - time < bot.autoEat.options.eatingTimeout &&
            bot.inventory.slots[bot.getEquipmentDestSlot(usedHand)]?.name === bestFood.name
        ) {
            await sleep()
        }

        if (bot.autoEat.options.equipOldItem && oldItem && oldItem.name !== bestFood.name) {
            await bot.equip(oldItem, usedHand)
        }

        bot.autoEat.isEating = false
        bot.emit('autoeat_finished', bestFood, offhand)
    }

    bot.on('playerCollect', async (who) => {
        if (!bot.autoEat.options.checkOnItemPickup || who.username !== bot.username) return

        try {
            await bot.waitForTicks(1)
            await bot.autoEat.eat()
        } catch (error) {
            bot.emit('autoeat_error', error as Error)
        }
    })

    bot.on('health', async () => {
        try {
            await bot.autoEat.eat()
        } catch (error) {
            bot.emit('autoeat_error', error as Error)
        }
    })

    bot.on('spawn', () => {
        bot.autoEat.isEating = false
    })

    bot.on('death', () => {
        bot.autoEat.isEating = false
    })

    bot._client.on('entity_status', (packet: any) => {
        if (packet.entityId === bot.entity.id && packet.entityStatus === 9 && bot.autoEat.isEating) {
            bot.autoEat.isEating = false
        }
    })
}
