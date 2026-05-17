/** this file is auto generated */
import * as TableContext from "./context";

export type SkillLinksTID = TableContext.KHTableID;
export const toSkillLinksTID = (value: string): SkillLinksTID => value as SkillLinksTID;

export interface ISkillLinks {
  _tid: SkillLinksTID;
  familyCode: number;
  linkCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  skillId: number;
  triggerTrait: "TraitType"|undefined;
  condition: string;
  stepOrder: number;
  stepSkill: number;
  chance: number;
  remark: string|undefined;
}

export type SkillLinksRaw = {
  tids: string[]
  result: Record<string, ISkillLinks>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class SkillLinksRepo {
  static fromRaw(data: SkillLinksRaw): SkillLinksRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toSkillLinksTID(tid), value as ISkillLinks])) as Record<SkillLinksTID, ISkillLinks>
    return new SkillLinksRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<SkillLinksTID, ISkillLinks>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: SkillLinksTID): ISkillLinks {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[SkillLinksRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): ISkillLinks[] {
    return Object.values(this.records) as ISkillLinks[]
  }

  entries(): Array<[SkillLinksTID, ISkillLinks]> {
    return Object.entries(this.records).map(([tid, value]) => [toSkillLinksTID(tid as string), value as ISkillLinks])
  }
}

