/** this file is auto generated */
import * as TableContext from "./context";

export type EconomyTID = TableContext.KHTableID;
export const toEconomyTID = (value: string): EconomyTID => value as EconomyTID;

export interface IEconomy {
  _tid: EconomyTID;
  familyCode: number;
  economyCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  scope: string;
  resource: "ResourceType";
  stage: number;
  rewardAmount: number;
  consumption: number|undefined;
  notes: string|undefined;
}

export type EconomyRaw = {
  tids: string[]
  result: Record<string, IEconomy>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class EconomyRepo {
  static fromRaw(data: EconomyRaw): EconomyRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toEconomyTID(tid), value as IEconomy])) as Record<EconomyTID, IEconomy>
    return new EconomyRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<EconomyTID, IEconomy>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: EconomyTID): IEconomy {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[EconomyRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IEconomy[] {
    return Object.values(this.records) as IEconomy[]
  }

  entries(): Array<[EconomyTID, IEconomy]> {
    return Object.entries(this.records).map(([tid, value]) => [toEconomyTID(tid as string), value as IEconomy])
  }
}

