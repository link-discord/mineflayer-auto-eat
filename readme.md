<h1 align="center">mineflayer-auto-eat</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
</p>

> An auto eat plugin for mineflayer

## Install

```sh
npm install mineflayer-auto-eat
```

## Usage

```js
const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-auto-eat');

const bot = mineflayer.createBot({
	host: process.argv[2],
	port: process.argv[3],
	username: process.argv[4],
	password: process.argv[5]
});

bot.loadPlugin(autoeat); // Load the plugin

bot.autoEat = {
	priority: 'foodPoints', // What the bot should prioritize (options: "foodPoints" or "saturation").
	startAt: 14, // If the bot reaches this amount of food points the auto eat plugin will start eating.
	bannedFood: ['golden_apple', 'enchanted_golden_apple'] // Food which the bot should not eat.
};

// The bot eats food automatically and emits these events when it starts eating and stops eating.

bot.on('autoeat_started', () => {
	console.log('Auto Eat started!');
});

bot.on('autoeat_stopped', () => {
	console.log('Auto Eat stopped!');
});
```

## Author

👤 **Link#0069**

- Github: [@LINKdiscordd](https://github.com/LINKdiscordd)

## Show your support

Give a ⭐️ if this plugin helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
