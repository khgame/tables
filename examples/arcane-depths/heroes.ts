/** this file is auto generated */
import * as TableContext from "./context";

export type HeroesTID = TableContext.KHTableID;
export const toHeroesTID = (value: string): HeroesTID => value as HeroesTID;

export interface IHeroes {
  _tid: HeroesTID;
  familyCode: number;
  classCode: number;
  heroCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  classTid: number;
  role: "HeroRole";
  rarity: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  signatureSkill: number;
  supportSkill: number;
  ultimateSkill: number;
  unlockChapter: number;
  primaryTrait: "TraitType";
  secondaryTrait: "TraitType"|undefined;
  portrait: string;
}

export type HeroesRaw = {
  tids: string[]
  result: Record<string, IHeroes>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class HeroesRepo {
  static fromRaw(data: HeroesRaw): HeroesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toHeroesTID(tid), value as IHeroes])) as Record<HeroesTID, IHeroes>
    return new HeroesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<HeroesTID, IHeroes>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: HeroesTID): IHeroes {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[HeroesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IHeroes[] {
    return Object.values(this.records) as IHeroes[]
  }

  entries(): Array<[HeroesTID, IHeroes]> {
    return Object.entries(this.records).map(([tid, value]) => [toHeroesTID(tid as string), value as IHeroes])
  }
}

