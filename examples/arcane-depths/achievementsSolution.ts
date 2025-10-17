/** this file is auto generated */
import * as TableContext from "./context";
import { IAchievements, AchievementsTID, toAchievementsTID, AchievementsRepo } from "./achievements";
        
const raw = {
  "tids": [
    "91010000",
    "91020000",
    "91030000"
  ],
  "result": {
    "91010000": {
      "_tid": "91010000",
      "familyCode": 91,
      "achievementCode": 1,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "title": "余烬守望",
      "description": "完成余烬裂隙所有难度。",
      "trigger": "chapter:10010100:all",
      "rewardType": "Relic",
      "rewardValue": "60010000"
    },
    "91020000": {
      "_tid": "91020000",
      "familyCode": 91,
      "achievementCode": 2,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 2,
      "title": "翠潮庇佑",
      "description": "在蔓生穹顶无伤通关。",
      "trigger": "chapter:10020100:perfect",
      "rewardType": "Resource",
      "rewardValue": "Crystal:60"
    },
    "91030000": {
      "_tid": "91030000",
      "familyCode": 91,
      "achievementCode": 3,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 3,
      "title": "星火熔铸师",
      "description": "解锁所有星界熔炉装备。",
      "trigger": "equipment:all:crucible",
      "rewardType": "Resource",
      "rewardValue": "Arcane:80"
    }
  },
  "collisions": []
}

export const achievementsRaw = raw;
export const achievementsTids: AchievementsTID[] = raw.tids.map(toAchievementsTID);
export const achievementsRecords: Record<AchievementsTID, IAchievements> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toAchievementsTID(tid), value as IAchievements])
);
export const achievements = achievementsRecords;
export const achievementsRepo = AchievementsRepo.fromRaw(raw);
