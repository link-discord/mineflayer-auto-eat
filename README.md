<h1 align="center">mineflayer-auto-eat</h1>

![npm](https://img.shields.io/npm/v/mineflayer-auto-eat)
![npm bundle size](https://img.shields.io/bundlephobia/min/mineflayer-auto-eat)
![GitHub](https://img.shields.io/github/license/link-discord/mineflayer-auto-eat?color=red)

> A customizable and flexible auto-eat utility plugin for Mineflayer bots

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Install](#install)
-   [Example](#example)
-   [API](#api)
    -   [Properties](#properties)
        -   [bot.autoEat.enabled](#botautoeatenabled)
        -   [bot.autoEat.isEating](#botautoeatiseating)
        -   [bot.autoEat.opts](#botautoeatopts)
        -   [bot.autoEat.foods](#botautoeatfoods)
        -   [bot.autoEat.foodsArray](#botautoeatfoodsarray)
        -   [bot.autoEat.foodsByName](#botautoeatfoodsbyname)
    -   [Methods](#methods)
        -   [bot.autoEat.setOpts(opts: Partial\<IEatUtilOpts\>)](#botautoeatsetoptsopts-partialieatutilopts)
        -   [bot.autoEat.eat(opts: EatOptions)](#botautoeateatopts-eatoptions)
        -   [bot.autoEat.enableAuto()](#botautoeatenableauto)
        -   [bot.autoEat.disableAuto()](#botautoeatdisableauto)
        -   [bot.autoEat.cancelEat()](#botautoeatcanceleat)
    -   [Settings](#settings)
        -   [IEatUtilOpts](#ieatutilopts)
        -   [EatOpts](#eatopts)
    -   [Events](#events)
-   [Authors](#authors)
-   [Show your support](#show-your-support)

## Install

```sh
npm install mineflayer-auto-eat
```

## Example

```js
import { createBot } from 'mineflayer'
import { loader as autoEat } from 'mineflayer-auto-eat'

const bot = createBot({
    host: process.argv[2] || 'localhost',
    port: process.argv[3] || 25565,
    username: process.argv[4] || 'bot',
    auth: process.argv[5] || 'microsoft'
})

bot.once('spawn', async () => {
    bot.loadPlugin(autoEat)
    bot.autoEat.enableAuto()

    bot.autoEat.on('eatStart', (opts) => {
        console.log(`Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`)
    })

    bot.autoEat.on('eatFinish', (opts) => {
        console.log(`Finished eating ${opts.food.name}`)
    })

    bot.autoEat.on('eatFail', (error) => {
        console.error('Eating failed:', error)
    })
})
```

Run this with `node <file>.js [host] [port] [username] [auth]`.

## API

### Properties

#### bot.autoEat.enabled

Boolean value indicating whether the auto-eat utility is enabled or disabled.

#### bot.autoEat.isEating

Boolean value indicating whether the bot is currently eating or not. This value should not be manually set.

#### bot.autoEat.opts

This object holds the configurable options for the auto-eat utility.

```js
{
  priority: "foodPoints",
  minHunger: 15,
  minHealth: 14,
  returnToLastItem: true,
  offhand: false,
  eatingTimeout: 3000,
  bannedFood: ["rotten_flesh", "pufferfish", "chorus_fruit", "poisonous_potato", "spider_eye"],
  strictErrors: true
}
```

#### bot.autoEat.foods

Returns the `foods` registry from the bot, which contains all food-related information from the Minecraft data.

#### bot.autoEat.foodsArray

Returns an array of all available foods in Minecraft from the bot's registry.

#### bot.autoEat.foodsByName

Returns an object mapping food item names to their properties (e.g., saturation, foodPoints).

### Methods

#### bot.autoEat.setOpts(opts: Partial\<IEatUtilOpts\>)

Allows you to modify the configuration options for the auto-eat utility dynamically.

```js
bot.autoEat.setOpts({
    minHunger: 10,
    priority: 'saturation'
})
```

#### bot.autoEat.eat(opts: EatOptions)

Manually triggers the eating function. If options are not provided, it will automatically pick the best food based on the current options.

```js
bot.autoEat
    .eat({
        food: 'apple', // optional
        offhand: true, // optional
        equipOldItem: false, // optional
        priority: 'saturation' // optional
    })
    .then(() => {
        console.log('Successfully ate the food!')
    })
    .catch((err) => {
        console.error('Failed to eat:', err)
    })
```

#### bot.autoEat.enableAuto()

Enables automatic eating based on the bot's hunger and health levels. The bot will automatically check if it needs to eat during each `physicsTick`.

```js
bot.autoEat.enableAuto()
```

#### bot.autoEat.disableAuto()

Disables the automatic eating functionality.

```js
bot.autoEat.disableAuto()
```

#### bot.autoEat.cancelEat()

Cancels the current eating action if the bot is in the process of eating.

```js
bot.autoEat.cancelEat()
```

### Settings

#### IEatUtilOpts

These options define how the `EatUtil` behaves:

-   **priority** (`FoodPriority`): Defines the priority for choosing food. Acceptable values are `"foodPoints"`, `"saturation"`, `"effectiveQuality"`, and `"saturationRatio"`. Default is `"foodPoints"`.
-   **minHunger** (`number`): If the bot's hunger is less than or equal to this value, the bot will attempt to eat. Default is `15`.
-   **minHealth** (`number`): If the bot's health is less than or equal to this value, the bot will prioritize eating food with higher saturation. Default is `14`.
-   **bannedFood** (`string[]`): An array of food names that the bot is not allowed to eat. Default includes `"rotten_flesh"`, `"pufferfish"`, `"chorus_fruit"`, `"poisonous_potato"`, `"spider_eye"`.
-   **returnToLastItem** (`boolean`): If `true`, the bot will re-equip the previous item after eating. Default is `true`.
-   **offhand** (`boolean`): If `true`, the bot will use the offhand to eat. Default is `false`.
-   **eatingTimeout** (`number`): The timeout (in milliseconds) for completing the eating action. Default is `3000`.
-   **strictErrors** (`boolean`): If `true`, errors during the eating process will be thrown. Otherwise, they will be logged to the console. Default is `true`.

#### EatOpts

These options are provided to the `eat` method to override default behavior.:

-   **food** (`FoodSelection`): The food item to eat. If not provided, the bot will automatically choose the best food based on the current options.
-   **offhand** (`boolean`): If `true`, the bot will use the offhand to eat. Default is `false`.
-   **equipOldItem** (`boolean`): If `true`, the bot will re-equip the previous item after eating. Default is `true`.
-   **priority** (`FoodPriority`): Defines the priority for choosing food. Acceptable values are `"foodPoints"`, `"saturation"`, `"effectiveQuality"`, and `"saturationRatio"`. Default is `"foodPoints"`.

### Events

-   **eatStart**: Emitted when the bot starts eating an item.

```js
bot.autoEat.on('eatStart', (opts) => {
    console.log(`Started eating ${opts.food.name}`)
})
```

-   **eatFinish**: Emitted when the bot finishes eating.

```js
bot.autoEat.on('eatFinish', (opts) => {
    console.log(`Finished eating ${opts.food.name}`)
})
```

-   **eatFail**: Emitted when the bot fails to eat due to an error.

```js
bot.autoEat.on('eatFail', (error) => {
    console.error('Eating failed:', error)
})
```

## Authors

👤 **Rocco A**

-   Github: https://github.com/GenerelSchwerz

👤 **Link**

-   Github: https://github.com/link-discord
-   Twitter: https://twitter.com/link0069
-   Website: https://linkdiscord.xyz/
-   Discord: @link0069

## Show your support

Give a ⭐️ if this plugin helped you!
