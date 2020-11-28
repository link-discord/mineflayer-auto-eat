<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [mineflayer-auto-eat](#mineflayer-auto-eat)
  - [Install](#install)
  - [Usage](#usage)
  - [API](#api)
    - [Properties](#properties)
      - [bot.autoEat](#botautoeat)
      - [bot.autoEat.options](#botautoeatoptions)
      - [bot.autoEat.options.priority](#botautoeatoptionspriority)
      - [bot.autoEat.options.startAt](#botautoeatoptionsstartat)
      - [bot.autoEat.options.bannedFood](#botautoeatoptionsbannedfood)
    - [Methods](#methods)
      - [bot.autoEat.enable()](#botautoeatenable)
      - [bot.autoEat.disable()](#botautoeatdisable)
      - [bot.autoEat.eat()](#botautoeateat)
  - [Author](#author)
  - [Show your support](#show-your-support)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<h1 align="center">mineflayer-auto-eat</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.2.0-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
</p>

> An auto eat plugin for mineflayer

## Install

```sh
npm install mineflayer-auto-eat
```

## Example

```js
const mineflayer = require("mineflayer")
const autoeat = require("mineflayer-auto-eat")

const bot = mineflayer.createBot({
  host: process.argv[2],
  port: process.argv[3],
  username: process.argv[4],
  password: process.argv[5],
})

// Load the plugin
bot.loadPlugin(autoeat)

bot.once("spawn", () => {
  bot.autoEat.options = {
    priority: "foodPoints",
    startAt: 14,
    bannedFood: [],
  }
})
// The bot eats food automatically and emits these events when it starts eating and stops eating.

bot.on("autoeat_started", () => {
  console.log("Auto Eat started!")
})

bot.on("autoeat_stopped", () => {
  console.log("Auto Eat stopped!")
})

bot.on("health", () => {
  if (bot.food === 20) bot.autoEat.disable()
  // Disable the plugin if the bot is at 20 food points
  else bot.autoEat.enable() // Else enable the plugin again
})
```

## API

### Properties

#### bot.autoEat

Includes Objects

#### bot.autoEat.options

Can be changed to change the settings for the auto eat plugin
(Can only be changed when the bot has spawned or else you get an Error)

Example

```js
bot.once("spawn", () => {
  bot.autoEat.options = {
    priority: "saturation",
    startAt: 16,
    bannedFood: ["golden_apple", "enchanted_golden_apple", "rotten_flesh"],
  }
})
```

#### bot.autoEat.options.priority
Acceptable Values are "saturation" or "foodPoints"
When choosing "saturation" the bot will search for the food with the highest saturation instead of highest food points

default: "foodPoints"

#### bot.autoEat.options.startAt
If the bot reaches that number of food points the bot will start to eat

default: 14

#### bot.autoEat.options.bannedFood
The bot will not eat the items in the array unless they are the only items available

default: []

### Methods

#### bot.autoEat.enable()
Calling this function will enable the plugin
(its enabled by default ofc)

#### bot.autoEat.disable()
Calling this function will disable the plugin

### bot.autoEat.eat()
If you want to for some ever reason want to call the eat function manually 
you can do it like this below
```js
bot.autoEat.eat(function (err) {
    if (err) {
      console.error(err)
    } else {
      console.log('Success!')
    }
})
```

## Author

👤 **Link#0069**

- Github: [@LINKdiscordd](https://github.com/LINKdiscordd)

## Show your support

Give a ⭐️ if this plugin helped you!

***

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
