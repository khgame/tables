/** this file is auto generated */
import * as TableContext from "./context";

export type CardsTID = TableContext.KHTableID;
export const toCardsTID = (value: string): CardsTID => value as CardsTID;

export interface ICards {
  _tid: CardsTID;
  tid: number;
  type: TableContext.CardType;
  subtype: TableContext.CardSubtype|undefined;
  nameZh: string;
  nameEn: string;
  rarity: TableContext.CardRarity;
  cost: number;
  speed: TableContext.CardSpeed;
  timing: TableContext.CardTiming;
  effect: string;
  triggerCondition: string|undefined;
  effectId: TableContext.CardEffect;
  effectParams: string|undefined;
  counteredBy: "uint[]"|undefined;
  requiresCharacter: number|undefined;
  requiresCards: "uint[]"|undefined;
  failCondition: string|undefined;
  tags: string|undefined;
  notes: string|undefined;
  quote: string;
  artwork: string;
}

export type CardsRaw = {
  tids: string[]
  result: Record<string, ICards>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class CardsRepo {
  static fromRaw(data: CardsRaw): CardsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toCardsTID(tid), value as ICards])) as Record<CardsTID, ICards>
    return new CardsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<CardsTID, ICards>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: CardsTID): ICards {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[CardsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): ICards[] {
    return Object.values(this.records) as ICards[]
  }

  entries(): Array<[CardsTID, ICards]> {
    return Object.entries(this.records).map(([tid, value]) => [toCardsTID(tid as string), value as ICards])
  }
  getByByNameEn(key: string): ICards {
    const index = this.indexes["byNameEn"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CardsRepo] no entry for byNameEn '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCardsTID(tid as string))
  }

  getByByType(key: string): ICards {
    const index = this.indexes["byType"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CardsRepo] no entry for byType '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCardsTID(tid as string))
  }

  getByBySubtype(key: string): ICards {
    const index = this.indexes["bySubtype"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CardsRepo] no entry for bySubtype '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCardsTID(tid as string))
  }

  getByByRarity(key: string): ICards {
    const index = this.indexes["byRarity"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CardsRepo] no entry for byRarity '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCardsTID(tid as string))
  }

  getByByTiming(key: string): ICards {
    const index = this.indexes["byTiming"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CardsRepo] no entry for byTiming '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCardsTID(tid as string))
  }

  getByByEffect(key: string): ICards {
    const index = this.indexes["byEffect"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CardsRepo] no entry for byEffect '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCardsTID(tid as string))
  }

  getByByRequiresCharacter(key: string): ICards {
    const index = this.indexes["byRequiresCharacter"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[CardsRepo] no entry for byRequiresCharacter '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toCardsTID(tid as string))
  }

  getAllByByRequiresCards(key: string): ICards[] {
    const index = this.indexes["byRequiresCards"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) return []
    const tids = Array.isArray(bucket) ? bucket : [bucket as string]
    return tids.map(tid => this.get(toCardsTID(tid as string)))
  }

  getAllByByCounteredBy(key: string): ICards[] {
    const index = this.indexes["byCounteredBy"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) return []
    const tids = Array.isArray(bucket) ? bucket : [bucket as string]
    return tids.map(tid => this.get(toCardsTID(tid as string)))
  }

  getAllByByTags(key: string): ICards[] {
    const index = this.indexes["byTags"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) return []
    const tids = Array.isArray(bucket) ? bucket : [bucket as string]
    return tids.map(tid => this.get(toCardsTID(tid as string)))
  }
}

