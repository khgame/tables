/** this file is auto generated */
import * as TableContext from "./context";

export type FacilitiesTID = TableContext.KHTableID;
export const toFacilitiesTID = (value: string): FacilitiesTID => value as FacilitiesTID;

export interface IFacilities {
  _tid: FacilitiesTID;
  familyCode: number;
  facilityCode: number;
  levelCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  type: "FacilityType";
  level: number;
  unlockResource: "ResourceType";
  unlockAmount: number;
  effectSummary: string;
  unlockRequirement: string|undefined;
}

export type FacilitiesRaw = {
  tids: string[]
  result: Record<string, IFacilities>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class FacilitiesRepo {
  static fromRaw(data: FacilitiesRaw): FacilitiesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toFacilitiesTID(tid), value as IFacilities])) as Record<FacilitiesTID, IFacilities>
    return new FacilitiesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<FacilitiesTID, IFacilities>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: FacilitiesTID): IFacilities {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[FacilitiesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IFacilities[] {
    return Object.values(this.records) as IFacilities[]
  }

  entries(): Array<[FacilitiesTID, IFacilities]> {
    return Object.entries(this.records).map(([tid, value]) => [toFacilitiesTID(tid as string), value as IFacilities])
  }
}

