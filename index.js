module.exports = function (bot, options) {
	var disabled = false

	bot.autoEat = {}

	bot.autoEat.disable = function disable() {
		disabled = true
	}

	bot.autoEat.enable = function enable() {
		disabled = false
	}

	bot.autoEat.eat = eat

	bot.autoEat.options = {}
	bot.autoEat.options.priority = options.priority || 'foodPoints'
	bot.autoEat.options.startAt = options.startAt || 14
	bot.autoEat.options.bannedFood = options.bannedFood || []

	var isEating = false

	const mcData = require('minecraft-data')(bot.version)

	const foodData = mcData.foodsArray
	const foodNames = foodData.map((item) => item.name)

	function callbackHandle(err) {
		if (err) console.error(err)
	}

	function eat(callback, manual = false) {
		if (isEating) return callback(Error("Already eating"))

		isEating = true

		var best_food = null
		var best_points = -1

		var priorityProperty = bot.autoEat.options.priority === 'foodPoints' ? 'foodPoints' : 'saturation'

		for (const item of bot.inventory.items()) {
			if (best_points < item[priorityProperty]) {
				if (foodNames.includes(item.name) && !bot.autoEat.options.bannedFood.includes(item.name)) {
					best_food = item
					best_points = item[priorityProperty];
				}
			}
		}

		if (!best_food) {
			isEating = false
			if (!manual) return callback(null)
			else return callback(new Error('No Food found.'))
		}

		bot.emit('autoeat_started')

		bot.equip(best_food, 'hand', function (error) {
			if (error) {
				console.error(error)
				bot.emit('autoeat_stopped')
				isEating = false
				return callback(error)
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
						if (bot.food !== 20) eat(callbackHandle)
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
				disabled === false
			) {
				eat(callbackHandle)
			}
		} else {
			if (bot.food < bot.autoEat.options.startAt && disabled === false) {
				eat(callbackHandle)
			}
		}
	})

	bot.on('spawn', () => {
		isEating = false // to prevent the plugin from breaking if the bot gets killed while eating btw
	})

	bot.on('death', () => {
		isEating = false // to prevent the plugin from breaking if the bot gets killed while eating btw
	})
}