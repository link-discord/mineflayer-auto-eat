import { EatUtil } from "./new.js";
import utilPlugin from "@nxg-org/mineflayer-util-plugin";
export function loader(bot) {
    if (!bot.hasPlugin(utilPlugin))
        bot.loadPlugin(utilPlugin);
    bot.autoEat = new EatUtil(bot);
}
