/** this file is auto generated */
import * as TableContext from "./context";

export type OperatorsTID = TableContext.KHTableID;
export const toOperatorsTID = (value: string): OperatorsTID => value as OperatorsTID;

export interface IOperators {
  _tid: OperatorsTID;
  sector: number;
  category: number;
  serial: number;
  codename: string;
  role: string;
  startWeapon: string;
  startRelic: string;
  hp: number;
  moveSpeed: number;
  sanityCap: number;
  reloadBonus: number;
  critBonus: number;
  signaturePassive: string;
  portraitArt: string;
  sprite: string;
  spriteScale: number;
  themeTrack: string;
}

export type OperatorsRaw = {
  tids: string[]
  result: Record<string, IOperators>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class OperatorsRepo {
  static fromRaw(data: OperatorsRaw): OperatorsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toOperatorsTID(tid), value as IOperators])) as Record<OperatorsTID, IOperators>
    return new OperatorsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<OperatorsTID, IOperators>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: OperatorsTID): IOperators {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[OperatorsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IOperators[] {
    return Object.values(this.records) as IOperators[]
  }

  entries(): Array<[OperatorsTID, IOperators]> {
    return Object.entries(this.records).map(([tid, value]) => [toOperatorsTID(tid as string), value as IOperators])
  }
}

