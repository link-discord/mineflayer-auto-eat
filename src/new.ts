import { EventEmitter } from "events";
import { Bot } from "mineflayer";
import { Food as MdFood } from "minecraft-data";
import { Item } from "prismarine-item";
import { StrictEventEmitter } from "strict-event-emitter-types";

type FoodSelection = MdFood | Item | number | string
type FoodPriority = "foodPoints" | "saturation" | "effectiveQuality" | "saturationRatio"

export interface IEatUtilOpts {
  priority: FoodPriority;
  minHunger: number;
  minHealth: number;
  bannedFood: string[];
  returnToLastItem: boolean;
  offhand: boolean;
  eatingTimeout: number;
  strictErrors: boolean;
}

export interface EatOpts {
  food?: FoodSelection;
  offhand?: boolean;
  equipOldItem?: boolean;
  priority?: FoodPriority;
}

export interface SanitizedEatOpts {
    food: Item;
    offhand: boolean;
    equipOldItem: boolean;
}
  
const DefaultOpts: IEatUtilOpts = {
  eatingTimeout: 3000,
  minHealth: 14,
  minHunger: 15,
  returnToLastItem: true,
  offhand: false,
  priority: "foodPoints",
  bannedFood: ["rotten_flesh", "pufferfish", "chorus_fruit", "poisonous_potato", "spider_eye"],
  strictErrors: true
};

export interface EatUtilEvents {
  eatStart: (opts: SanitizedEatOpts) => void;
  eatFail: (error: Error) => void;
  eatFinish: (opts: SanitizedEatOpts) => void;
}

export class EatUtil extends (EventEmitter as {new(): StrictEventEmitter<EventEmitter, EatUtilEvents>}) {
  public opts: IEatUtilOpts;
  private _eating = false;
  private _enabled = false;
  private _rejectionBinding?: (error: Error) => void;
  
  public get foods() {
    return this.bot.registry.foods;
  }

  public get foodsArray() {
    return this.bot.registry.foodsArray;
  }

  public get foodsByName() {
    return this.bot.registry.foodsByName;
  }

  public get isEating() {
    return this._eating;
  }

  public get enabled() {
    return this._enabled;
  }

  constructor(private readonly bot: Bot, opts: Partial<IEatUtilOpts> = {}) {
    super();
    this.opts = Object.assign({}, DefaultOpts, opts) as IEatUtilOpts;
  }

  public setOpts(opts: Partial<IEatUtilOpts>) {
    Object.assign(this.opts, opts)
  }

  public cancelEat() {
    if (this._rejectionBinding == null) return;
    this._rejectionBinding(new Error('Eating manually canceled!'))
    this.bot.deactivateItem();
  }


  /**
   * Given a list of items, determine which food is optimal.
   * @param items 
   * @returns Optimal item.
   */
  public findBestChoices(items: Item[], priority: FoodPriority): Item[] {
    return items
      .filter(i => i.name in this.foodsByName)
      .filter(i => !this.opts.bannedFood.includes(i.name))
      .sort((a, b) => this.foodsByName[b.name][priority] - this.foodsByName[a.name][priority]);
  }


  /**
   * Handle different typings of a food selection.
   * Used in {@link sanitizeOpts}.
   * @param sel A variety of types that refer to a wanted food item.
   * @returns The wanted item in bot's inventory, or nothing.
   */
  private normalizeFoodChoice(sel?: FoodSelection): Item | undefined {
    if (sel == null) return undefined;  
    if (sel instanceof String) {
        return this.bot.util.inv
            .getAllItems()
            .find(i=>i.name===sel) 
    } 
    if (sel instanceof Number) {
        return this.bot.util.inv
            .getAllItems()
            .find(i=>i.type===sel)
    }
    if (sel instanceof Item) {
        return sel
    } 
    const fsel = sel as MdFood;
    return this.bot.util.inv
        .getAllItems()
        .find(i=>i.type===fsel.id)
  }

  /**
   * Sanitize options provided to eat function,
   * normalizing them to plugin options.
   * @param opts 
   * @returns {boolean} whether opts is correctly sanitized.
   */
  private sanitizeOpts(opts: EatOpts): opts is SanitizedEatOpts { 
    opts.equipOldItem = opts.equipOldItem === undefined ? this.opts.returnToLastItem : opts.equipOldItem;
    opts.offhand = opts.offhand === undefined ? this.opts.offhand : opts.offhand;
    opts.priority = opts.priority === undefined ? this.opts.priority : opts.priority;
    
    let choice = this.normalizeFoodChoice(opts.food)
    if (choice != null) opts.food = choice    
    else {
        const allItems = this.bot.util.inv.getAllItems();
        const choices = this.findBestChoices(allItems, opts.priority);
        if (choices.length == 0) return false;
        opts.food = choices[0];
    }
    return true;
  }

  /**
   * Utility function to handle potential changes in inventory and eating status.
   * Immediately handles events on a subscriber basis instead of polling.
   * @param relevantItem 
   * @param timeout 
   * @returns 
   */
  private buildEatingListener(relevantItem: Item, timeout: number) {
    return new Promise<void>((res, rej) => {
      const eatingListener = (packet: any) => {
        if (packet.entityId === this.bot.entity.id && packet.entityStatus === 9) {
          this.bot._client.off('entity_status', eatingListener);
          this.bot.inventory.off('updateSlot', itemListener);
          res();
        }
      };

      const itemListener = (oldItem: Item | null, newItem: Item | null) => {
        if (oldItem?.slot === relevantItem.slot) 
          if (newItem?.type !== relevantItem.type) {
            this.bot._client.off('entity_status', eatingListener);
            this.bot.inventory.off('updateSlot', itemListener);
            rej(new Error(`Item switched early to: ${newItem?.name}!\nItem: ${newItem}`))
          }
      }
      this.bot._client.on('entity_status', eatingListener);
      this.bot.inventory.on('updateSlot', itemListener);

      this._rejectionBinding = (error) => {
        this.bot._client.off('entity_status', eatingListener);
        this.bot.inventory.off('updateSlot', itemListener);
        rej(error)
      };

      setTimeout(() => {
        rej(new Error(`Eating timed out with a time of ${timeout} milliseconds!`))
      }, timeout)
    })
  }

  /**
   * Call this to eat an item.
   * @param opts 
   */
  public async eat(opts: EatOpts = {}) {
    
    // if we are already eating, throw error.
    if (this._eating) 
        throw new Error("Already eating!")

    this._eating = true;

    // Sanitize options; if not valid, throw error.
    if (!this.sanitizeOpts(opts)) 
        throw new Error("No food specified and couldn't find a choice in inventory!");

    // get current item in hand + wanted hand
    const currentItem = this.bot.util.inv.getHandWithItem(opts.offhand);
    const switchedItems = currentItem != opts.food;
    const wantedHand = this.bot.util.inv.getHand(opts.offhand)

    // if not already holding item, equip item
    if (switchedItems) {
        const equipped = await this.bot.util.inv.customEquip(opts.food, wantedHand)

        // if fail to equip, throw error.
        if (!equipped) 
            throw new Error(`Failed to equip: ${opts.food.name}!\nItem: ${opts.food}`)
    }
       
    
    // ! begin eating item
    
    // sanitize by deactivating beforehand
    this.bot.deactivateItem();

    // trigger use state based on hand
    this.bot.activateItem(opts.offhand)

    this.emit('eatStart', opts);

    // Wait for eating to finish, handle errors gracefully if there are, and perform cleanup.
    try { 
      await this.buildEatingListener(opts.food, this.opts.eatingTimeout); 
    } 
    catch (e) {
      if (this.opts.strictErrors) throw e; // expose e to outer environment
      else console.error(e);
      this.emit('eatFail', e as Error);
    } 
    finally {
      if (opts.equipOldItem && switchedItems && currentItem) 
        this.bot.util.inv.customEquip(currentItem, wantedHand) 
      delete this._rejectionBinding;
      this._eating = false;
      this.emit('eatFinish', opts);

    }
  }


  /**
   * Utility function to to eat whenever under health or hunger.
   */
  private statusCheck = async () => {
    if (this.bot.food < this.opts.minHunger || this.bot.health < this.opts.minHealth) {
      if (this._eating) return;
      try { await this.eat(); } catch (e) { }
    }

  };


  /**
   * Using timer to desync from physicsTick (attempt to work with mcproxy)
   * 
   * Note: did not change anything.
   */
  enableAuto() {
    if (this._enabled) return;
    this._enabled = true;
    this.bot.on('physicsTick', this.statusCheck);
  }

  disableAuto() {
    if (!this._enabled) return;
    this._enabled = false;
    this.bot.off('physicsTick', this.statusCheck);
  }
}
