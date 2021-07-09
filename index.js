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

		const priority = bot.autoEat.options.priority
		const banned = bot.autoEat.options.bannedFood
		const food = bot.autoEat.foodsByName

		const bestChoices = bot.inventory.items()
			.filter((it) => it.name in bot.autoEat.foodsByName)
			.filter((it) => !banned.includes(it.name))
			.sort((a, b) => food[b.name][priority] - food[a.name][priority])

		if (bestChoices.length === 0) {
			bot.autoEat.isEating = false
			if (!manual) return callback(null)
			else return callback(new Error('No Food found.'))
		}

		const bestFood = bestChoices[0]

		bot.emit('autoeat_started', bestFood);

		(async () => {
			try {
				await bot.equip(bestFood, 'hand')
				await bot.consume()
			} catch (error) {
				bot.emit('autoeat_stopped', error)
				bot.autoEat.isEating = false
				return callback(error)
			}
		})()
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
