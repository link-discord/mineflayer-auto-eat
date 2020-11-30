const mineflayer = require('mineflayer')
const autoeat = require('../index')

const bot = mineflayer.createBot({
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
    username: 'autoeat-test',
})

bot.loadPlugin(autoeat)

bot.once('spawn', () => {
    bot.autoEat.options = {
        priority: 'foodPoints',
        startAt: -1,
        bannedFood: [],
    }

    bot.chat('/kill')

    setTimeout(() => {
        bot.chat('/effect clear @s')
        bot.chat('/clear')
    }, 1 * 1000);

    setTimeout(() => {
        bot.chat('/effect give @s resistance 100 255')
        bot.chat('/effect give @s regeneration 100 3')
        bot.chat('/effect give @s saturation 100 3')
    }, 3 * 1000);

    setTimeout(() => {
        bot.chat('/give @s minecraft:dirt 64')
        bot.chat('/give @s minecraft:cooked_beef 64')
        bot.chat('/give @s minecraft:golden_carrot 64')
        bot.chat('/effect give @s hunger 10 255')
    }, 6 * 1000);

    setTimeout(() => {
        bot.autoEat.eat(function (err) {
            if (err) {
                console.log('Error occured! exiting with status code 1')
                console.error(err)
                process.exit(1)
            } else {
                setTimeout(() => {
                    console.log('Success! exiting with status code 0')
                    process.exit(0)
                }, 1000);
            }
        })
    }, 12 * 1000) 
})

bot.on('chat', (username, message) => {
    console.log(`<${username}> ${message}`)
})
