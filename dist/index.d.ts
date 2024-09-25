import { Bot } from "mineflayer";
import { EatUtil } from "./new.js";
declare module "mineflayer" {
    interface Bot {
        autoEat: EatUtil;
    }
}
export declare function loader(bot: Bot): void;
