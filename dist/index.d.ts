import { Bot } from 'mineflayer';
import { Item } from 'prismarine-item';
interface Options {
    priority: 'saturation' | 'foodPoints';
    startAt: number;
    bannedFood: string[];
    eatingTimeout: number;
    ignoreInventoryCheck: boolean;
    checkOnItemPickup: boolean;
    offhand: boolean;
    equipOldItem: boolean;
}
declare module 'mineflayer' {
    interface Bot {
        autoEat: {
            disabled: boolean;
            isEating: boolean;
            options: Options;
            eat: (offhand?: boolean) => Promise<boolean>;
            disable: () => void;
            enable: () => void;
        };
    }
    interface BotEvents {
        autoeat_started: (eatenItem: Item, usedOffhand: boolean) => void;
        autoeat_finished: (eatenItem: Item, usedOffhand: boolean) => void;
        autoeat_error: (error: Error) => void;
    }
}
export declare function plugin(bot: Bot): void;
export {};
