/** this file is auto generated */
import * as TableContext from "./context";

export type RelicsTID = TableContext.KHTableID;
export const toRelicsTID = (value: string): RelicsTID => value as RelicsTID;

export interface IRelics {
  _tid: RelicsTID;
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  key: string;
  name: string;
  effectType: "RelicEffectType";
  effectValue: number;
  unlockStage: number|undefined;
  desc: string;
  icon: string;
}

export const RelicsProtocol = ["aegisMirror", "crystalPrism", "everburningEmber", "frostbrandSigil", "moonlitCompass", "scholarChronicle"] as const;
export type RelicsProtocol = typeof RelicsProtocol[number];
export type RelicsRaw = {
  tids: string[]
  result: Record<string, IRelics>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class RelicsRepo {
  static fromRaw(data: RelicsRaw): RelicsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toRelicsTID(tid), value as IRelics])) as Record<RelicsTID, IRelics>
    return new RelicsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<RelicsTID, IRelics>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: RelicsTID): IRelics {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[RelicsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IRelics[] {
    return Object.values(this.records) as IRelics[]
  }

  entries(): Array<[RelicsTID, IRelics]> {
    return Object.entries(this.records).map(([tid, value]) => [toRelicsTID(tid as string), value as IRelics])
  }
  getByKey(key: RelicsProtocol): IRelics {
    const index = this.indexes["key"] || {}
    const bucket = index[key as keyof typeof index]
    if (!bucket) {
      throw new Error(
        `[RelicsRepo] no entry for key '${String(key)}'`
      )
    }
    const tid = Array.isArray(bucket) ? bucket[0] : bucket
    return this.get(toRelicsTID(tid as string))
  }
}

