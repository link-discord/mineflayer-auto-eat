"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
function plugin(bot) {
    // @ts-ignore - Initializations
    bot.autoEat = {};
    bot.autoEat.disabled = false;
    bot.autoEat.isEating = false;
    bot.autoEat.options = {
        priority: 'foodPoints',
        startAt: 14,
        eatingTimeout: 3000,
        bannedFood: [],
        ignoreInventoryCheck: false,
        checkOnItemPickup: true,
        useOffhand: false,
        equipOldItem: true
    };
    bot.autoEat.disable = () => {
        bot.autoEat.disabled = true;
    };
    bot.autoEat.enable = () => {
        bot.autoEat.disabled = false;
    };
    bot.autoEat.eat = async (offhand = bot.autoEat.options.useOffhand) => {
        if (bot.autoEat.isEating || bot.food > bot.autoEat.options.startAt)
            return;
        bot.autoEat.isEating = true;
        const priority = bot.autoEat.options.priority;
        const banned = bot.autoEat.options.bannedFood;
        const food = bot.registry.foodsByName;
        const bestChoices = bot.inventory
            .items()
            .filter((item) => item.name in bot.registry.foodsByName)
            .filter((item) => !banned.includes(item.name))
            .sort((a, b) => food[b.name][priority] - food[a.name][priority]);
        if (bestChoices.length === 0) {
            bot.autoEat.isEating = false;
            bot.emit('autoeat_error', new Error('No Food found.'));
            return;
        }
        const bestFood = bestChoices[0];
        const usedHand = offhand ? 'off-hand' : 'hand';
        async function waitEating() {
            const time = performance.now();
            while (bot.autoEat.isEating &&
                performance.now() - time < bot.autoEat.options.eatingTimeout &&
                bot.inventory.slots[bot.getEquipmentDestSlot(usedHand)]?.name === bestFood.name) {
                await sleep();
            }
        }
        bot.emit('autoeat_started', bestFood, offhand);
        const requiresConfirmation = bot.inventory.requiresConfirmation;
        if (bot.autoEat.options.ignoreInventoryCheck)
            bot.inventory.requiresConfirmation = false;
        const oldItem = bot.inventory.slots[bot.getEquipmentDestSlot(usedHand)];
        await bot.equip(bestFood, usedHand);
        bot.inventory.requiresConfirmation = requiresConfirmation;
        bot.deactivateItem();
        bot.activateItem(offhand);
        await waitEating();
        if (bot.autoEat.options.equipOldItem && oldItem && oldItem.name !== bestFood.name) {
            await bot.equip(oldItem, usedHand);
        }
        bot.autoEat.isEating = false;
        bot.emit('autoeat_finished', bestFood, offhand);
    };
    bot.on('playerCollect', async (who, entity) => {
        const itemName = entity.getDroppedItem()?.name;
        if (!itemName ||
            !bot.registry.foodsByName[itemName] ||
            !bot.autoEat.options.checkOnItemPickup ||
            who.username !== bot.username ||
            bot.autoEat.disabled)
            return;
        try {
            await bot.waitForTicks(1);
            await bot.autoEat.eat();
        }
        catch (error) {
            bot.emit('autoeat_error', error);
        }
    });
    bot.on('health', async () => {
        if (bot.autoEat.isEating)
            return;
        try {
            await bot.autoEat.eat();
        }
        catch (error) {
            bot.emit('autoeat_error', error);
        }
    });
    bot.on('spawn', () => {
        bot.autoEat.isEating = false;
    });
    bot.on('death', () => {
        bot.autoEat.isEating = false;
    });
    bot._client.on('entity_status', (packet) => {
        if (packet.entityId === bot.entity.id && packet.entityStatus === 9 && bot.autoEat.isEating) {
            bot.autoEat.isEating = false;
        }
    });
}
exports.default = plugin;
