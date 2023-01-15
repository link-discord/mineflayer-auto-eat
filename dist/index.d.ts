import mineflayer from 'mineflayer';
import mcData from 'minecraft-data';
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
        registry: mcData.IndexedData;
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
        autoeat_error: (error?: Error) => void;
    }
}
export declare function plugin(bot: mineflayer.Bot): void;
export {};
