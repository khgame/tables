/** this file is auto generated */
import * as TableContext from "./context";
import { IAchievements, AchievementsTID, toAchievementsTID, AchievementsRepo } from "./achievements";
        
const raw = {
  "tids": [
    "80000001",
    "80000002",
    "80000003",
    "80000004",
    "80000005",
    "80000006",
    "80000007",
    "80000008"
  ],
  "result": {
    "80000001": {
      "_tid": "80000001",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 1,
      "sequence": 1,
      "name": "Getting Started",
      "requirementType": "totalCookies",
      "requirementValue": 100,
      "flavor": "做出第一百块饼干。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36a.png"
    },
    "80000002": {
      "_tid": "80000002",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 2,
      "sequence": 2,
      "name": "Grandma Hive",
      "requirementType": "buildingCount:60000002",
      "requirementValue": 5,
      "flavor": "招募 5 位奶奶。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9da.png"
    },
    "80000003": {
      "_tid": "80000003",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 3,
      "sequence": 3,
      "name": "Industrial Revolution",
      "requirementType": "buildingCount:60000005",
      "requirementValue": 3,
      "flavor": "建成 3 座工厂。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3ed.png"
    },
    "80000004": {
      "_tid": "80000004",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 4,
      "sequence": 4,
      "name": "Cookie Tycoon",
      "requirementType": "totalCookies",
      "requirementValue": 10000,
      "flavor": "烘焙 1 万块饼干。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b0.png"
    },
    "80000005": {
      "_tid": "80000005",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 5,
      "sequence": 5,
      "name": "Millionaire Baker",
      "requirementType": "totalCookies",
      "requirementValue": 1000000,
      "flavor": "烘焙 100 万饼干。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f911.png"
    },
    "80000006": {
      "_tid": "80000006",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 6,
      "sequence": 6,
      "name": "Temple Choir",
      "requirementType": "buildingCount:60000007",
      "requirementValue": 5,
      "flavor": "运营 5 座庙宇。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3db.png"
    },
    "80000007": {
      "_tid": "80000007",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 7,
      "sequence": 7,
      "name": "Space Entrepreneur",
      "requirementType": "buildingCount:60000009",
      "requirementValue": 3,
      "flavor": "拥有 3 艘宇宙运输舰。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f680.png"
    },
    "80000008": {
      "_tid": "80000008",
      "categoryCode": 80,
      "subtypeCode": 0,
      "sequenceCode": 8,
      "sequence": 8,
      "name": "Temporal Lord",
      "requirementType": "buildingCount:60000011",
      "requirementValue": 1,
      "flavor": "购入第一台时间机器。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f2.png"
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
