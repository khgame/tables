/** this file is auto generated */
import * as TableContext from "./context";

export type BossesTID = TableContext.KHTableID;
export const toBossesTID = (value: string): BossesTID => value as BossesTID;

export interface IBosses {
  _tid: BossesTID;
  sector: number;
  category: number;
  serial: number;
  name: string;
  hp: number;
  armor: number;
  moveSpeed: number;
  enrageSpeed: number;
  signatureAttack: string;
  attackInterval: number;
  projectileLifetime: number;
  telegraphSprite: string;
  arenaModifier: string;
  sprite: string;
  spriteScale: number;
  deathSprite: string;
  deathSfx: string;
  themeTrack: string;
}

export type BossesRaw = {
  tids: string[]
  result: Record<string, IBosses>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class BossesRepo {
  static fromRaw(data: BossesRaw): BossesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toBossesTID(tid), value as IBosses])) as Record<BossesTID, IBosses>
    return new BossesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<BossesTID, IBosses>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: BossesTID): IBosses {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[BossesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IBosses[] {
    return Object.values(this.records) as IBosses[]
  }

  entries(): Array<[BossesTID, IBosses]> {
    return Object.entries(this.records).map(([tid, value]) => [toBossesTID(tid as string), value as IBosses])
  }
}

