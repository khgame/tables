/** this file is auto generated */
import * as TableContext from "./context";

export type SkillTreeTID = TableContext.KHTableID;
export const toSkillTreeTID = (value: string): SkillTreeTID => value as SkillTreeTID;

export interface ISkillTree {
  _tid: SkillTreeTID;
  sector: number;
  branch: number;
  node: number;
  name: string;
  branchName: "SkillBranch";
  tier: number;
  parent: string;
  effects: string;
  requirements: string;
  tooltip: string;
  icon: string;
}

export type SkillTreeRaw = {
  tids: string[]
  result: Record<string, ISkillTree>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class SkillTreeRepo {
  static fromRaw(data: SkillTreeRaw): SkillTreeRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toSkillTreeTID(tid), value as ISkillTree])) as Record<SkillTreeTID, ISkillTree>
    return new SkillTreeRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<SkillTreeTID, ISkillTree>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: SkillTreeTID): ISkillTree {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[SkillTreeRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): ISkillTree[] {
    return Object.values(this.records) as ISkillTree[]
  }

  entries(): Array<[SkillTreeTID, ISkillTree]> {
    return Object.entries(this.records).map(([tid, value]) => [toSkillTreeTID(tid as string), value as ISkillTree])
  }
}

