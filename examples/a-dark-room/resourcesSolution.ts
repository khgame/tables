/** this file is auto generated */
import * as TableContext from "./context";
import { IResources, ResourcesTID, toResourcesTID, ResourcesRepo } from "./resources";
        
const raw = {
  "tids": [
    "10000001",
    "10000002",
    "10000003",
    "10000004",
    "10000005",
    "10000006",
    "10000007",
    "10000008",
    "10000009",
    "10000010"
  ],
  "result": {
    "10000001": {
      "_tid": "10000001",
      "tid": 10000001,
      "key": "warmth",
      "label": "炉火",
      "description": "保持营地温暖，会随时间缓慢衰减。",
      "baseRate": 0,
      "decayRate": -0.08,
      "baseCapacity": 120,
      "maxCapacity": 200,
      "sequence": 1,
      "displayOrder": 1
    },
    "10000002": {
      "_tid": "10000002",
      "tid": 10000002,
      "key": "wood",
      "label": "木材",
      "description": "点燃营火与建造结构的基础资源。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 400,
      "maxCapacity": 800,
      "sequence": 2,
      "displayOrder": 2
    },
    "10000003": {
      "_tid": "10000003",
      "tid": 10000003,
      "key": "fur",
      "label": "兽皮",
      "description": "来自捕猎，用于取暖与制作皮革。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 240,
      "maxCapacity": 480,
      "sequence": 3,
      "displayOrder": 3
    },
    "10000004": {
      "_tid": "10000004",
      "tid": 10000004,
      "key": "meat",
      "label": "肉类",
      "description": "猎物带回的肉，可供烹煮或换取口粮。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 240,
      "maxCapacity": 480,
      "sequence": 4,
      "displayOrder": 4
    },
    "10000005": {
      "_tid": "10000005",
      "tid": 10000005,
      "key": "leather",
      "label": "皮革",
      "description": "经处理的兽皮，可加工装备与建筑材料。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 180,
      "maxCapacity": 360,
      "sequence": 5,
      "displayOrder": 5
    },
    "10000006": {
      "_tid": "10000006",
      "tid": 10000006,
      "key": "charcoal",
      "label": "木炭",
      "description": "高温冶炼所需，由木材闷烧而成。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 180,
      "maxCapacity": 360,
      "sequence": 6,
      "displayOrder": 6
    },
    "10000007": {
      "_tid": "10000007",
      "tid": 10000007,
      "key": "iron",
      "label": "生铁",
      "description": "从荒野搜集的铁料，可进一步冶炼。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 140,
      "maxCapacity": 280,
      "sequence": 7,
      "displayOrder": 7
    },
    "10000008": {
      "_tid": "10000008",
      "tid": 10000008,
      "key": "steel",
      "label": "精钢",
      "description": "冶炼后的优质钢材，可制作利器与建筑。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 120,
      "maxCapacity": 240,
      "sequence": 8,
      "displayOrder": 8
    },
    "10000009": {
      "_tid": "10000009",
      "tid": 10000009,
      "key": "villagers",
      "label": "村民",
      "description": "愿意留下的幸存者，可分配至各项工作。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 4,
      "maxCapacity": 60,
      "sequence": 9,
      "displayOrder": 0
    },
    "10000010": {
      "_tid": "10000010",
      "tid": 10000010,
      "key": "supplies",
      "label": "口粮",
      "description": "远征与商队所需的补给。",
      "baseRate": 0,
      "decayRate": 0,
      "baseCapacity": 120,
      "maxCapacity": 240,
      "sequence": 10,
      "displayOrder": 9
    }
  },
  "collisions": []
}

export const resourcesRaw = raw;
export const resourcesTids: ResourcesTID[] = raw.tids.map(toResourcesTID);
export const resourcesRecords: Record<ResourcesTID, IResources> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toResourcesTID(tid), value as IResources])
);
export const resources = resourcesRecords;
export const resourcesRepo = ResourcesRepo.fromRaw(raw);
