/** this file is auto generated */
import * as TableContext from "./context";

export type ResearchTID = TableContext.KHTableID;
export const toResearchTID = (value: string): ResearchTID => value as ResearchTID;

export interface IResearch {
  _tid: ResearchTID;
  familyCode: number;
  researchCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  name: string;
  parent: number|undefined;
  costResource: "ResourceType";
  costAmount: number;
  rewardType: string;
  rewardValue: string;
}

export type ResearchRaw = {
  tids: string[]
  result: Record<string, IResearch>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ResearchRepo {
  static fromRaw(data: ResearchRaw): ResearchRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toResearchTID(tid), value as IResearch])) as Record<ResearchTID, IResearch>
    return new ResearchRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ResearchTID, IResearch>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ResearchTID): IResearch {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ResearchRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IResearch[] {
    return Object.values(this.records) as IResearch[]
  }

  entries(): Array<[ResearchTID, IResearch]> {
    return Object.entries(this.records).map(([tid, value]) => [toResearchTID(tid as string), value as IResearch])
  }
}

