/** this file is auto generated */
import * as TableContext from "./context";

export type SynergyCardsTID = TableContext.KHTableID;
export const toSynergyCardsTID = (value: string): SynergyCardsTID => value as SynergyCardsTID;

export interface ISynergyCards {
  _tid: SynergyCardsTID;
  sector: number;
  category: number;
  serial: number;
  name: string;
  tier: "SynergyTier";
  prerequisites: string;
  effects: string;
  trigger: string;
  icon: string;
}

export type SynergyCardsRaw = {
  tids: string[]
  result: Record<string, ISynergyCards>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class SynergyCardsRepo {
  static fromRaw(data: SynergyCardsRaw): SynergyCardsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toSynergyCardsTID(tid), value as ISynergyCards])) as Record<SynergyCardsTID, ISynergyCards>
    return new SynergyCardsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<SynergyCardsTID, ISynergyCards>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: SynergyCardsTID): ISynergyCards {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[SynergyCardsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): ISynergyCards[] {
    return Object.values(this.records) as ISynergyCards[]
  }

  entries(): Array<[SynergyCardsTID, ISynergyCards]> {
    return Object.entries(this.records).map(([tid, value]) => [toSynergyCardsTID(tid as string), value as ISynergyCards])
  }
}

