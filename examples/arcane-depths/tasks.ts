/** this file is auto generated */
import * as TableContext from "./context";

export type TasksTID = TableContext.KHTableID;
export const toTasksTID = (value: string): TasksTID => value as TasksTID;

export interface ITasks {
  _tid: TasksTID;
  familyCode: number;
  taskCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  scope: string;
  name: string;
  condition: string;
  rewardType: "RewardType";
  rewardValue: string;
  linkedChapter: number|undefined;
}

export type TasksRaw = {
  tids: string[]
  result: Record<string, ITasks>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class TasksRepo {
  static fromRaw(data: TasksRaw): TasksRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toTasksTID(tid), value as ITasks])) as Record<TasksTID, ITasks>
    return new TasksRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<TasksTID, ITasks>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: TasksTID): ITasks {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[TasksRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): ITasks[] {
    return Object.values(this.records) as ITasks[]
  }

  entries(): Array<[TasksTID, ITasks]> {
    return Object.entries(this.records).map(([tid, value]) => [toTasksTID(tid as string), value as ITasks])
  }
}

