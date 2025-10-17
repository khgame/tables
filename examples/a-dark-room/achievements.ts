/** this file is auto generated */
import * as TableContext from "./context";

export type AchievementsTID = TableContext.KHTableID;
export const toAchievementsTID = (value: string): AchievementsTID => value as AchievementsTID;

export interface IAchievements {
  _tid: AchievementsTID;
  tid: number;
  key: string;
  label: string;
  description: string;
  trigger: {
    resource: string|undefined;
    min: number|undefined;
    max: number|undefined;
    villagers: number|undefined;
    building: number|undefined;
    buildingCount: number|undefined;
  };
  effects: Array<{
      type: string|undefined;
      resource: string|undefined;
      amount: number|undefined;
      building: number|undefined;
      job: number|undefined;
      action: number|undefined;
      event: number|undefined;
      message: string|undefined;
    }>;
}

export type AchievementsRaw = {
  tids: string[]
  result: Record<string, IAchievements>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class AchievementsRepo {
  static fromRaw(data: AchievementsRaw): AchievementsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toAchievementsTID(tid), value as IAchievements])) as Record<AchievementsTID, IAchievements>
    return new AchievementsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<AchievementsTID, IAchievements>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: AchievementsTID): IAchievements {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[AchievementsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IAchievements[] {
    return Object.values(this.records) as IAchievements[]
  }

  entries(): Array<[AchievementsTID, IAchievements]> {
    return Object.entries(this.records).map(([tid, value]) => [toAchievementsTID(tid as string), value as IAchievements])
  }
}

