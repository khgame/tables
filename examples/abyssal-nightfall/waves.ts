/** this file is auto generated */
import * as TableContext from "./context";

export type WavesTID = TableContext.KHTableID;
export const toWavesTID = (value: string): WavesTID => value as WavesTID;

export interface IWaves {
  _tid: WavesTID;
  sector: number;
  category: number;
  serial: number;
  timestamp: number;
  duration: number;
  enemyId: number;
  count: number;
  spawnRadius: number;
  formation: string;
  notes: string;
}

export type WavesRaw = {
  tids: string[]
  result: Record<string, IWaves>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class WavesRepo {
  static fromRaw(data: WavesRaw): WavesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toWavesTID(tid), value as IWaves])) as Record<WavesTID, IWaves>
    return new WavesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<WavesTID, IWaves>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: WavesTID): IWaves {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[WavesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IWaves[] {
    return Object.values(this.records) as IWaves[]
  }

  entries(): Array<[WavesTID, IWaves]> {
    return Object.entries(this.records).map(([tid, value]) => [toWavesTID(tid as string), value as IWaves])
  }
}

