import utilPlugin from "@nxg-org/mineflayer-util-plugin";
import { EatUtil } from "./new";
export function loader(bot) {
    if (!bot.hasPlugin(utilPlugin))
        bot.loadPlugin(utilPlugin);
    bot.autoEat = new EatUtil(bot);
}
