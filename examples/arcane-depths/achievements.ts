/** this file is auto generated */
import * as TableContext from "./context";
        
export interface IAchievements {
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

type AchievementsTID = string & { readonly __AchievementsTID: unique symbol };
const toAchievementsTID = (value: string): AchievementsTID => value as AchievementsTID;

const raw = {
  "tids": [
    "91010000",
    "91020000",
    "91030000"
  ],
  "result": {
    "91010000": {
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

export const achievementsTids: AchievementsTID[] = raw.tids.map(toAchievementsTID);
export const achievements: Record<AchievementsTID, IAchievements> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toAchievementsTID(tid), value as IAchievements])
);
