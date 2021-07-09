module.exports = function (bot, options) {
	bot.autoEat = { disabled: false, isEating: false }

	bot.autoEat.disable = function disable() {
		bot.autoEat.disabled = true
	}

	bot.autoEat.enable = function enable() {
		bot.autoEat.disabled = false
	}

	bot.autoEat.eat = eat

	bot.autoEat.options = {}
	bot.autoEat.options.priority = options.priority || 'foodPoints'
	bot.autoEat.options.startAt = options.startAt || 14
	bot.autoEat.options.bannedFood = options.bannedFood || []

	bot.autoEat.foodsByName = {}

	bot.once('spawn', () => {
		bot.autoEat.foodsByName = require('minecraft-data')(bot.version).foodsByName
	})

	function eat(callback, manual = false) {
		callback = callback || ((e) => { }) // fallback callback that does nothing
		if (bot.autoEat.isEating) return callback(Error("Already eating"))

		bot.autoEat.isEating = true

		var best_food = null
		var best_points = -1
		const priorityProperty = bot.autoEat.options.priority

		for (const item of bot.inventory.items()) {
			if (!(item.name in bot.autoEat.foodsByName))
				continue // Skip non-food items
			if (bot.autoEat.options.bannedFood.includes(item.name))
				continue // Skip banned food
			const props = bot.autoEat.foodsByName[item.name]
			if (best_points < props[priorityProperty]) {
				best_points = props[priorityProperty]
				best_food = item
			}
		}

		if (!best_food) {
			bot.autoEat.isEating = false
			if (!manual) return callback(null)
			else return callback(new Error('No Food found.'))
		}

		bot.emit('autoeat_started', best_food)

		bot.equip(best_food, 'hand', (error) => {
			if (error) {
				bot.emit('autoeat_stopped', error)
				bot.autoEat.isEating = false
				return callback(error)
			}
			bot.consume((err) => {
				bot.emit('autoeat_stopped', err)
				bot.autoEat.isEating = false
				if (err) {
					return callback(err)
				} else {
					callback(null)
					if (bot.food !== 20) eat()
				}
			})
		})
	}

	bot.on('health', () => {
		if (bot.autoEat.disabled) return
		if (bot.food >= bot.autoEat.options.startAt) return
		if (bot.pathfinder) {
			if (bot.pathfinder.isMining() || bot.pathfinder.isBuilding())
				return
		}
		bot.autoEat.eat()
	})

	bot.on('spawn', () => {
		bot.autoEat.isEating = false // Eating status is reset on spawn/death
	})

	bot.on('death', () => {
		bot.autoEat.isEating = false
	})
}
