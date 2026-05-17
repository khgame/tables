/** this file is auto generated */
import * as TableContext from "./context";

export type JobsTID = TableContext.KHTableID;
export const toJobsTID = (value: string): JobsTID => value as JobsTID;

export interface IJobs {
  _tid: JobsTID;
  tid: number;
  key: string;
  label: string;
  description: string;
  produces: {
    wood: number|undefined;
    fur: number|undefined;
    meat: number|undefined;
    leather: number|undefined;
    charcoal: number|undefined;
    iron: number|undefined;
    steel: number|undefined;
    warmth: number|undefined;
    supplies: number|undefined;
  };
  consumes: {
    wood: number|undefined;
    fur: number|undefined;
    meat: number|undefined;
    leather: number|undefined;
    charcoal: number|undefined;
    iron: number|undefined;
    steel: number|undefined;
    warmth: number|undefined;
    supplies: number|undefined;
  };
  baseRate: number;
  baseCap: number;
  unlock: {
    building: number|undefined;
    buildingCount: number|undefined;
    resource: string|undefined;
    min: number|undefined;
    max: number|undefined;
    villagers: number|undefined;
    event: number|undefined;
  };
}

export type JobsRaw = {
  tids: string[]
  result: Record<string, IJobs>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class JobsRepo {
  static fromRaw(data: JobsRaw): JobsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toJobsTID(tid), value as IJobs])) as Record<JobsTID, IJobs>
    return new JobsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<JobsTID, IJobs>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: JobsTID): IJobs {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[JobsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IJobs[] {
    return Object.values(this.records) as IJobs[]
  }

  entries(): Array<[JobsTID, IJobs]> {
    return Object.entries(this.records).map(([tid, value]) => [toJobsTID(tid as string), value as IJobs])
  }
}

