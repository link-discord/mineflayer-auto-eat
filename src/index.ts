import mineflayer from 'mineflayer'
import mcData from 'minecraft-data'
import { Item } from 'prismarine-item'
import { setTimeout as sleep } from 'timers/promises'

interface Options {
    priority: 'saturation' | 'foodPoints'
    startAt: number
    bannedFood: string[]
    eatingTimeout: number
    ignoreInventoryCheck: boolean
    checkOnItemPickup: boolean
    offhand: boolean
    equipOldItem: boolean
}

declare module 'mineflayer' {
    interface Bot {
        registry: mcData.IndexedData
        autoEat: {
            disabled: boolean
            isEating: boolean
            options: Options
            eat: (offhand?: boolean) => Promise<boolean>
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

export function plugin(bot: mineflayer.Bot) {
    // @ts-ignore - Initializations
    bot.autoEat = {}

    bot.autoEat.disabled = false
    bot.autoEat.isEating = false

    bot.autoEat.options = {
        priority: 'saturation',
        startAt: 16,
        eatingTimeout: 3000,
        bannedFood: [
            // puffer fish - only gives negative effects
            'pufferfish',
            // spider eye - gives poison effect
            'spider_eye',
            // poisonous potato - gives poison effect
            'poisonous_potato',
            // rotten flesh - gives hunger effect
            'rotten_flesh',
            // chorus fruit - randomly teleports you
            'chorus_fruit',
            // raw chicken - 30% chance of getting hunger effect
            'chicken',
            // suspicious stew - gives random effects (including hunger)
            'suspicious_stew',
            // enchanted golden apple - shouldn't be eaten unless the user wants to
            'enchanted_golden_apple',
            // golden apple - shouldn't be eaten unless the user wants to
            'golden_apple'
        ],
        ignoreInventoryCheck: false,
        checkOnItemPickup: true,
        offhand: true,
        equipOldItem: true
    }

    bot.autoEat.disable = () => {
        bot.autoEat.disabled = true
    }

    bot.autoEat.enable = () => {
        bot.autoEat.disabled = false
    }

    bot.autoEat.eat = async (useOffhand = bot.autoEat.options.offhand) => {
        if (
            bot.autoEat.isEating ||
            bot.autoEat.disabled ||
            bot.food > bot.autoEat.options.startAt ||
            bot.food > 19
        )
            return false
        bot.autoEat.isEating = true

        const canOffhand = !bot.supportFeature('doesntHaveOffHandSlot')
        const priority = bot.autoEat.options.priority
        const banned = bot.autoEat.options.bannedFood
        const food = bot.registry.foodsByName
        const items = bot.inventory.items()
        const offhandItem = bot.inventory.slots[45]
        const offhand = useOffhand && canOffhand

        if (offhandItem && canOffhand) items.push(offhandItem)

        const bestChoices = items
            .filter((item) => item.name in bot.registry.foodsByName)
            .filter((item) => !banned.includes(item.name))
            .sort((a, b) => food[b.name][priority] - food[a.name][priority])

        if (bestChoices.length === 0) {
            bot.autoEat.isEating = false
            throw new Error('No food found.')
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

        return true
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
        if (
            packet.entityId === bot.entity.id &&
            packet.entityStatus === 9 &&
            bot.autoEat.isEating
        ) {
            bot.autoEat.isEating = false
        }
    })
}
