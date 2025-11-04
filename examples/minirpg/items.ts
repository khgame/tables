/** this file is auto generated */
import * as TableContext from "./context";

export type ItemsTID = TableContext.KHTableID;
export const toItemsTID = (value: string): ItemsTID => value as ItemsTID;

export interface IItems {
  _tid: ItemsTID;
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  slot: "ItemSlot";
  rarity: number;
  currency: "RewardCurrency";
  amount: number;
  attack: number;
  defense: number;
  bonusHp: number;
  effect: string;
  sourceStage: number;
  flavor: string;
}

export type ItemsRaw = {
  tids: string[]
  result: Record<string, IItems>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ItemsRepo {
  static fromRaw(data: ItemsRaw): ItemsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toItemsTID(tid), value as IItems])) as Record<ItemsTID, IItems>
    return new ItemsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ItemsTID, IItems>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ItemsTID): IItems {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ItemsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IItems[] {
    return Object.values(this.records) as IItems[]
  }

  entries(): Array<[ItemsTID, IItems]> {
    return Object.entries(this.records).map(([tid, value]) => [toItemsTID(tid as string), value as IItems])
  }
}

