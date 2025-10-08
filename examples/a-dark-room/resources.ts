/** this file is auto generated */
import * as TableContext from "./context";

export type ResourcesTID = TableContext.KHTableID;
export const toResourcesTID = (value: string): ResourcesTID => value as ResourcesTID;

export interface IResources {
  _tid: ResourcesTID;
  tid: number;
  key: string;
  label: string;
  description: string;
  baseRate: number;
  decayRate: number;
  baseCapacity: number;
  maxCapacity: number;
  sequence: number;
  displayOrder: number;
}

export type ResourcesRaw = {
  tids: string[]
  result: Record<string, IResources>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ResourcesRepo {
  static fromRaw(data: ResourcesRaw): ResourcesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toResourcesTID(tid), value as IResources])) as Record<ResourcesTID, IResources>
    return new ResourcesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ResourcesTID, IResources>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ResourcesTID): IResources {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ResourcesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IResources[] {
    return Object.values(this.records) as IResources[]
  }

  entries(): Array<[ResourcesTID, IResources]> {
    return Object.entries(this.records).map(([tid, value]) => [toResourcesTID(tid as string), value as IResources])
  }
}

