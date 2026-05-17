/** this file is auto generated */
import * as TableContext from "./context";
import { IBuildings, BuildingsTID, toBuildingsTID, BuildingsRepo } from "./buildings";
        
const raw = {
  "tids": [
    "30000001",
    "30000002",
    "30000003",
    "30000004",
    "30000005",
    "30000006"
  ],
  "result": {
    "30000001": {
      "_tid": "30000001",
      "tid": 30000001,
      "key": "hut",
      "label": "棚屋",
      "description": "粗糙却温暖的住所，可吸引更多幸存者。",
      "cost": {
        "wood": 40,
        "fur": 15
      },
      "costScaling": 0.28,
      "effects": [
        {
          "type": "storage",
          "resource": "villagers",
          "amount": 2,
          "message": ""
        },
        {
          "type": "jobCap",
          "resource": "",
          "amount": 1,
          "job": 20000001,
          "message": ""
        },
        {
          "type": "jobCap",
          "resource": "",
          "amount": 0.5,
          "job": 20000003,
          "message": ""
        },
        {
          "type": "event",
          "resource": "",
          "event": 50000002,
          "message": ""
        }
      ],
      "unlock": {
        "resource": "warmth",
        "min": 60
      },
      "buildTime": 18,
      "repeatable": true,
      "maxCount": 12
    },
    "30000002": {
      "_tid": "30000002",
      "tid": 30000002,
      "key": "trap",
      "label": "陷阱",
      "description": "散落在林中的陷阱，提供稳定的猎物。",
      "cost": {
        "wood": 25
      },
      "costScaling": 0.22,
      "effects": [
        {
          "type": "storage",
          "resource": "meat",
          "amount": 20,
          "message": ""
        },
        {
          "type": "storage",
          "resource": "fur",
          "amount": 20,
          "message": ""
        },
        {
          "type": "jobCap",
          "resource": "",
          "amount": 1,
          "job": 20000002,
          "message": ""
        },
        {
          "type": "unlockJob",
          "resource": "",
          "job": 20000002,
          "message": ""
        }
      ],
      "unlock": {
        "building": 30000001,
        "resource": "",
        "event": 50000001
      },
      "buildTime": 12,
      "repeatable": true,
      "maxCount": 16
    },
    "30000003": {
      "_tid": "30000003",
      "tid": 30000003,
      "key": "smokehouse",
      "label": "熏肉房",
      "description": "处理肉类，提高口粮储备。",
      "cost": {
        "wood": 65,
        "fur": 10,
        "meat": 20
      },
      "costScaling": 0.18,
      "effects": [
        {
          "type": "storage",
          "resource": "supplies",
          "amount": 60,
          "message": ""
        },
        {
          "type": "jobCap",
          "resource": "",
          "amount": 1,
          "job": 20000003,
          "message": ""
        },
        {
          "type": "unlockAction",
          "resource": "",
          "action": 40000004,
          "message": ""
        }
      ],
      "unlock": {
        "building": 30000002,
        "resource": ""
      },
      "buildTime": 22,
      "repeatable": false,
      "maxCount": 2
    },
    "30000004": {
      "_tid": "30000004",
      "tid": 30000004,
      "key": "workshop",
      "label": "工坊",
      "description": "装备工具的工坊，开启加工工艺。",
      "cost": {
        "wood": 110,
        "fur": 50,
        "leather": 8
      },
      "costScaling": 0.2,
      "effects": [
        {
          "type": "jobCap",
          "resource": "",
          "amount": 2,
          "job": 20000004,
          "message": ""
        },
        {
          "type": "jobCap",
          "resource": "",
          "amount": 1.5,
          "job": 20000005,
          "message": ""
        },
        {
          "type": "unlockJob",
          "resource": "",
          "job": 20000004,
          "message": ""
        },
        {
          "type": "unlockJob",
          "resource": "",
          "job": 20000005,
          "message": ""
        },
        {
          "type": "unlockAction",
          "resource": "",
          "action": 40000005,
          "message": ""
        }
      ],
      "unlock": {
        "building": 30000001,
        "resource": "",
        "villagers": 4
      },
      "buildTime": 28,
      "repeatable": false,
      "maxCount": 2
    },
    "30000005": {
      "_tid": "30000005",
      "tid": 30000005,
      "key": "foundry",
      "label": "铸炉",
      "description": "用于冶炼钢材的高温炉。",
      "cost": {
        "wood": 140,
        "charcoal": 50,
        "iron": 35
      },
      "costScaling": 0.22,
      "effects": [
        {
          "type": "jobCap",
          "resource": "",
          "amount": 2,
          "job": 20000006,
          "message": ""
        },
        {
          "type": "storage",
          "resource": "steel",
          "amount": 60,
          "message": ""
        },
        {
          "type": "unlockJob",
          "resource": "",
          "job": 20000006,
          "message": ""
        },
        {
          "type": "unlockAction",
          "resource": "",
          "action": 40000006,
          "message": ""
        }
      ],
      "unlock": {
        "building": 30000004,
        "resource": ""
      },
      "buildTime": 36,
      "repeatable": false,
      "maxCount": 2
    },
    "30000006": {
      "_tid": "30000006",
      "tid": 30000006,
      "key": "caravanserai",
      "label": "商旅驿站",
      "description": "接引游商，可交换稀缺物资。",
      "cost": {
        "wood": 160,
        "leather": 25,
        "steel": 10
      },
      "costScaling": 0.18,
      "effects": [
        {
          "type": "storage",
          "resource": "supplies",
          "amount": 120,
          "message": ""
        },
        {
          "type": "jobCap",
          "resource": "",
          "amount": 1,
          "job": 20000003,
          "message": ""
        },
        {
          "type": "unlockAction",
          "resource": "",
          "action": 40000007,
          "message": ""
        },
        {
          "type": "event",
          "resource": "",
          "event": 50000004,
          "message": ""
        }
      ],
      "unlock": {
        "building": 30000001,
        "resource": "supplies",
        "min": 40
      },
      "buildTime": 32,
      "repeatable": false,
      "maxCount": 1
    }
  },
  "collisions": []
}

export const buildingsRaw = raw;
export const buildingsTids: BuildingsTID[] = raw.tids.map(toBuildingsTID);
export const buildingsRecords: Record<BuildingsTID, IBuildings> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toBuildingsTID(tid), value as IBuildings])
);
export const buildings = buildingsRecords;
export const buildingsRepo = BuildingsRepo.fromRaw(raw);
