/** this file is auto generated */
import * as TableContext from "./context";

export type EnemiesTID = TableContext.KHTableID;
export const toEnemiesTID = (value: string): EnemiesTID => value as EnemiesTID;

export interface IEnemies {
  _tid: EnemiesTID;
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  element: "HeroElement";
  role: string;
  hp: number;
  attack: number;
  defense: number;
  skill: string;
  weakness: string;
  rewardExp: number;
  portrait: string;
}

export type EnemiesRaw = {
  tids: string[]
  result: Record<string, IEnemies>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class EnemiesRepo {
  static fromRaw(data: EnemiesRaw): EnemiesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toEnemiesTID(tid), value as IEnemies])) as Record<EnemiesTID, IEnemies>
    return new EnemiesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<EnemiesTID, IEnemies>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: EnemiesTID): IEnemies {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[EnemiesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IEnemies[] {
    return Object.values(this.records) as IEnemies[]
  }

  entries(): Array<[EnemiesTID, IEnemies]> {
    return Object.entries(this.records).map(([tid, value]) => [toEnemiesTID(tid as string), value as IEnemies])
  }
}

