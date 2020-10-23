module.exports = function (bot, options) {
	var disabled = false;

	bot.autoEat = {}

	bot.autoEat.disable = function disable() {
		disabled = true;
	}

	bot.autoEat.enable = function enable() {
		disabled = false;
	}

	bot.autoEat.options = {}
	bot.autoEat.options.priority = options.priority || 'foodPoints',
	bot.autoEat.options.startAt = options.startAt || 14
	bot.autoEat.options.bannedFood = options.bannedFood || []

	var isEating = false;

	const lodash = require('lodash');
	const mcData = require('minecraft-data')(bot.version);

	function eat() {
		isEating = true;

		var data = mcData.foodsArray;
		var names = data.map((item) => item.name);

		var found_food = bot.inventory.items().filter((item) => names.includes(item.name));

		if (found_food.length === 0 || !found_food) {
			isEating = false;
			return;
		}

		var available_food = [];

		bot.inventory.items().forEach((element) => {
			if (names.includes(element.name)) available_food.push(element);
		});

		if (bot.autoEat.bannedFood.length >= 0) {
			lodash.filter(available_food, function (item) {
				return !bot.autoEat.bannedFood.includes(item.name);
			});
		}

		var best_food;

		if (bot.autoEat.priority === 'foodPoints')
			best_food = available_food.find((item) => item.foodPoints === lodash.maxBy(available_food, 'foodPoints'));
		else best_food = available_food.find((item) => item.saturation === lodash.maxBy(available_food, 'saturation'));

		if (!best_food) {
			isEating = false;
			return;
		}

		bot.emit('autoeat_started');

		bot.equip(best_food, 'hand', function (error) {
			if (error) {
				console.error(error);
				bot.emit('autoeat_stopped');
				isEating = false;
			} else {
				bot.consume(function (err) {
					if (err) {
						console.error(err);
						bot.emit('autoeat_stopped');
						isEating = false;
					} else {
						isEating = false;
						bot.emit('autoeat_stopped');
					}
				});
			}
		});
	}

	bot.on('physicTick', () => {
		if (bot.pathfinder) {
			if (
				bot.food < bot.autoEat.startAt &&
				!(bot.pathfinder.isMining() || bot.pathfinder.isBuilding()) &&
				isEating === false &&
				disabled === false
			) {
				eat();
			}
		} else {
			if (bot.food < bot.autoEat.startAt && isEating === false && disabled === false) {
				eat();
			}
		}
	});

	bot.on('spawn', () => {
		isEating = false;
	});
};
