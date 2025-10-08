/** this file is auto generated */
import * as TableContext from "./context";

export type ProducersTID = TableContext.KHTableID;
export const toProducersTID = (value: string): ProducersTID => value as ProducersTID;

export interface IProducers {
  _tid: ProducersTID;
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  desc: string;
  baseCost: number;
  costGrowth: number;
  baseCps: number;
  icon: string;
  unlockCookies: number;
}

export type ProducersRaw = {
  tids: string[]
  result: Record<string, IProducers>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ProducersRepo {
  static fromRaw(data: ProducersRaw): ProducersRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toProducersTID(tid), value as IProducers])) as Record<ProducersTID, IProducers>
    return new ProducersRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ProducersTID, IProducers>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ProducersTID): IProducers {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ProducersRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IProducers[] {
    return Object.values(this.records) as IProducers[]
  }

  entries(): Array<[ProducersTID, IProducers]> {
    return Object.entries(this.records).map(([tid, value]) => [toProducersTID(tid as string), value as IProducers])
  }
}

