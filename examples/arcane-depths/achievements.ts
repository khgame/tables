/** this file is auto generated */
import * as TableContext from "./context";

export type AchievementsTID = TableContext.KHTableID;
export const toAchievementsTID = (value: string): AchievementsTID => value as AchievementsTID;

export interface IAchievements {
  _tid: AchievementsTID;
  familyCode: number;
  achievementCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  title: string;
  description: string;
  trigger: string;
  rewardType: "RewardType";
  rewardValue: string;
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

