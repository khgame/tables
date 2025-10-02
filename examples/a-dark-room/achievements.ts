/** this file is auto generated */
import * as TableContext from "./context";
        
export interface IAchievements {
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

type AchievementsTID = string & { readonly __AchievementsTID: unique symbol };
const toAchievementsTID = (value: string): AchievementsTID => value as AchievementsTID;

const raw = {
  "tids": [
    "60000001",
    "60000002"
  ],
  "result": {
    "60000001": {
      "tid": 60000001,
      "key": "spark_shelter",
      "label": "火势渐旺",
      "description": "将炉火升至 60 以上，村民提议搭建棚屋。",
      "trigger": {
        "resource": "warmth",
        "min": 60
      },
      "effects": [
        {
          "type": "unlockBuilding",
          "resource": "",
          "building": 30000001,
          "message": ""
        },
        {
          "type": "log",
          "resource": "",
          "message": "篝火驱散寒意，大家提议搭起棚屋。"
        }
      ]
    },
    "60000002": {
      "tid": 60000002,
      "key": "village_awakens",
      "label": "村落初成",
      "description": "建造至少两座棚屋，小村庄开始成形。",
      "trigger": {
        "resource": "",
        "building": 30000001,
        "buildingCount": 3
      },
      "effects": [
        {
          "type": "unlockBuilding",
          "resource": "",
          "building": 30000003,
          "message": ""
        },
        {
          "type": "unlockBuilding",
          "resource": "",
          "building": 30000004,
          "message": ""
        },
        {
          "type": "log",
          "resource": "",
          "message": "村民们规划起烟房和工坊，为未来做准备。"
        }
      ]
    }
  },
  "collisions": []
}

export const achievementsTids: AchievementsTID[] = raw.tids.map(toAchievementsTID);
export const achievements: Record<AchievementsTID, IAchievements> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toAchievementsTID(tid), value as IAchievements])
);
