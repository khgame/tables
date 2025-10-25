/** this file is auto generated */
import * as TableContext from "./context";
import { IJobs, JobsTID, toJobsTID, JobsRepo } from "./jobs";
        
const raw = {
  "tids": [
    "20000001",
    "20000002",
    "20000003",
    "20000004",
    "20000005",
    "20000006"
  ],
  "result": {
    "20000001": {
      "_tid": "20000001",
      "tid": 20000001,
      "key": "gatherer",
      "label": "采集者",
      "description": "在废墟间拾取木材。",
      "produces": {
        "wood": 0.6
      },
      "consumes": {},
      "baseRate": 1,
      "baseCap": 2,
      "unlock": {
        "resource": ""
      }
    },
    "20000002": {
      "_tid": "20000002",
      "tid": 20000002,
      "key": "trapper",
      "label": "设陷者",
      "description": "布设陷阱，零星获取肉与兽皮。",
      "produces": {
        "fur": 0.2,
        "meat": 0.25
      },
      "consumes": {},
      "baseRate": 1,
      "baseCap": 0,
      "unlock": {
        "building": 30000002,
        "resource": ""
      }
    },
    "20000003": {
      "_tid": "20000003",
      "tid": 20000003,
      "key": "hunter",
      "label": "猎人",
      "description": "与猎犬出行，稳定带回肉与皮毛。",
      "produces": {
        "fur": 0.3,
        "meat": 0.45
      },
      "consumes": {
        "warmth": 0.02
      },
      "baseRate": 1,
      "baseCap": 0,
      "unlock": {
        "building": 30000001,
        "resource": "warmth",
        "min": 80
      }
    },
    "20000004": {
      "_tid": "20000004",
      "tid": 20000004,
      "key": "charcoal_burner",
      "label": "烧炭者",
      "description": "消耗木材以制得木炭。",
      "produces": {
        "charcoal": 0.55
      },
      "consumes": {
        "wood": 1.1
      },
      "baseRate": 1,
      "baseCap": 0,
      "unlock": {
        "building": 30000004,
        "resource": ""
      }
    },
    "20000005": {
      "_tid": "20000005",
      "tid": 20000005,
      "key": "tanner",
      "label": "制革匠",
      "description": "处理兽皮，制得皮革。",
      "produces": {
        "leather": 0.28
      },
      "consumes": {
        "fur": 0.6
      },
      "baseRate": 1,
      "baseCap": 0,
      "unlock": {
        "building": 30000004,
        "resource": ""
      }
    },
    "20000006": {
      "_tid": "20000006",
      "tid": 20000006,
      "key": "smelter",
      "label": "熔炼师",
      "description": "燃烧木炭冶炼钢材。",
      "produces": {
        "steel": 0.12
      },
      "consumes": {
        "charcoal": 0.5,
        "iron": 0.25
      },
      "baseRate": 1,
      "baseCap": 0,
      "unlock": {
        "building": 30000005,
        "resource": ""
      }
    }
  },
  "collisions": []
}

export const jobsRaw = raw;
export const jobsTids: JobsTID[] = raw.tids.map(toJobsTID);
export const jobsRecords: Record<JobsTID, IJobs> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toJobsTID(tid), value as IJobs])
);
export const jobs = jobsRecords;
export const jobsRepo = JobsRepo.fromRaw(raw);
