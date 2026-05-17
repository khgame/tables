/** this file is auto generated */
import * as TableContext from "./context";
import { ITasks, TasksTID, toTasksTID, TasksRepo } from "./tasks";
        
const raw = {
  "tids": [
    "90010000",
    "90020000",
    "90030000",
    "90040000"
  ],
  "result": {
    "90010000": {
      "_tid": "90010000",
      "familyCode": 90,
      "taskCode": 1,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "scope": "章节",
      "name": "余烬净化I",
      "condition": "在余烬裂隙中3回合内击败Boss",
      "rewardType": "Resource",
      "rewardValue": "Crystal:20",
      "linkedChapter": 10010100
    },
    "90020000": {
      "_tid": "90020000",
      "familyCode": 90,
      "taskCode": 2,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 2,
      "scope": "章节",
      "name": "蔓生守护I",
      "condition": "救出2位旅者并完成休整房间",
      "rewardType": "Trait",
      "rewardValue": "Synergy",
      "linkedChapter": 10020100
    },
    "90030000": {
      "_tid": "90030000",
      "familyCode": 90,
      "taskCode": 3,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 3,
      "scope": "周目",
      "name": "熔炉之眼",
      "condition": "累计造成30000点星火伤害",
      "rewardType": "Relic",
      "rewardValue": "60030000"
    },
    "90040000": {
      "_tid": "90040000",
      "familyCode": 90,
      "taskCode": 4,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 4,
      "scope": "周目",
      "name": "共鸣守护者",
      "condition": "任意一局中保持护盾不破3场战斗",
      "rewardType": "Resource",
      "rewardValue": "Arcane:24"
    }
  },
  "collisions": []
}

export const tasksRaw = raw;
export const tasksTids: TasksTID[] = raw.tids.map(toTasksTID);
export const tasksRecords: Record<TasksTID, ITasks> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toTasksTID(tid), value as ITasks])
);
export const tasks = tasksRecords;
export const tasksRepo = TasksRepo.fromRaw(raw);
