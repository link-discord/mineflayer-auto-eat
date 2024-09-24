import { Bot } from "mineflayer";
import { EatUtil } from "./new";
declare module "mineflayer" {
    interface Bot {
        autoEat: EatUtil;
    }
}
export declare function loader(bot: Bot): void;
