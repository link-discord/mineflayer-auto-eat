import { Bot } from 'mineflayer'
import { EatUtil } from './new.js'
import utilPlugin from '@nxg-org/mineflayer-util-plugin'

declare module 'mineflayer' {
    interface Bot {
        autoEat: EatUtil
    }
}

export function loader(bot: Bot) {
    if (!bot.hasPlugin(utilPlugin.default)) {
        /**
         * Fixed by Github@AkagawaTsurunaki
         *
         * [Issue](https://github.com/link-discord/mineflayer-auto-eat/issues/80):
         *      AssertionError [ERR_ASSERTION]: plugin needs to be a function
         *      occurred when loading this plugin.
         *
         * Analysis:
         *      utilPlugin.default is not a `function` but `undefined`
         *
         * Solution:
         *      load `utilPlugin` if `utilPlugin.default` is `undefined`.
         *
         */
        if (utilPlugin.default) {
            bot.loadPlugin(utilPlugin.default);
        } else {
            bot.loadPlugin(utilPlugin)
        }
    }
    bot.autoEat = new EatUtil(bot)
}
