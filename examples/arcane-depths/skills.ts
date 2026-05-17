/** this file is auto generated */
import * as TableContext from "./context";

export type SkillsTID = TableContext.KHTableID;
export const toSkillsTID = (value: string): SkillsTID => value as SkillsTID;

export interface ISkills {
  _tid: SkillsTID;
  familyCode: number;
  skillCode: number;
  levelCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  tag: "SkillTag";
  target: "SkillTarget";
  cooldown: number;
  energyCost: number;
  formula: "DamageFormula";
  power: number;
  description: string;
}

export type SkillsRaw = {
  tids: string[]
  result: Record<string, ISkills>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class SkillsRepo {
  static fromRaw(data: SkillsRaw): SkillsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toSkillsTID(tid), value as ISkills])) as Record<SkillsTID, ISkills>
    return new SkillsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<SkillsTID, ISkills>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: SkillsTID): ISkills {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[SkillsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): ISkills[] {
    return Object.values(this.records) as ISkills[]
  }

  entries(): Array<[SkillsTID, ISkills]> {
    return Object.entries(this.records).map(([tid, value]) => [toSkillsTID(tid as string), value as ISkills])
  }
}

