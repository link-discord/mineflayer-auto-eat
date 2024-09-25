import { Bot } from "mineflayer";
import { EatUtil } from "./new.js";
import utilPlugin from "@nxg-org/mineflayer-util-plugin";

declare module "mineflayer" {
    interface Bot {
        autoEat: EatUtil;
    }
}

export function loader(bot: Bot) {
    if (!bot.hasPlugin(utilPlugin.default)) bot.loadPlugin(utilPlugin.default)
    bot.autoEat = new EatUtil(bot);
}
