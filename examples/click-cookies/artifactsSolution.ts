/** this file is auto generated */
import * as TableContext from "./context";
import { IArtifacts, ArtifactsTID, toArtifactsTID, ArtifactsRepo } from "./artifacts";
        
const raw = {
  "tids": [
    "95000001",
    "95000002",
    "95000003",
    "95000004",
    "95010001"
  ],
  "result": {
    "95000001": {
      "_tid": "95000001",
      "categoryCode": 95,
      "subtypeCode": 0,
      "sequenceCode": 1,
      "sequence": 1,
      "name": "Golden Oven Mitts",
      "effectType": "globalMultiplier",
      "effectValue": 1.6,
      "costPoints": 30,
      "desc": "所有 CPS 乘以 1.6。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9b5.png"
    },
    "95000002": {
      "_tid": "95000002",
      "categoryCode": 95,
      "subtypeCode": 0,
      "sequenceCode": 2,
      "sequence": 2,
      "name": "Sugar Rush",
      "effectType": "clickMultiplier",
      "effectValue": 3,
      "costPoints": 25,
      "desc": "点击产量翻至 3 倍，并更快上浮。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36c.png"
    },
    "95000003": {
      "_tid": "95000003",
      "categoryCode": 95,
      "subtypeCode": 0,
      "sequenceCode": 3,
      "sequence": 3,
      "name": "Pocket Chronometer",
      "effectType": "offlineMultiplier",
      "effectValue": 2,
      "costPoints": 35,
      "desc": "离线收益翻倍，归来即可收割。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f1.png"
    },
    "95000004": {
      "_tid": "95000004",
      "categoryCode": 95,
      "subtypeCode": 0,
      "sequenceCode": 4,
      "sequence": 4,
      "name": "Quantum Ledger",
      "effectType": "costReduction",
      "effectValue": 0.15,
      "costPoints": 40,
      "desc": "所有建筑成本降低 15%。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b0.png"
    },
    "95010001": {
      "_tid": "95010001",
      "categoryCode": 95,
      "subtypeCode": 1,
      "sequenceCode": 1,
      "sequence": 5,
      "name": "Starfarer Compass",
      "effectType": "prestigeBonus",
      "effectValue": 0.25,
      "costPoints": 45,
      "desc": "声望重置额外 +25% 神器点。",
      "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f320.png"
    }
  },
  "collisions": []
}

export const artifactsRaw = raw;
export const artifactsTids: ArtifactsTID[] = raw.tids.map(toArtifactsTID);
export const artifactsRecords: Record<ArtifactsTID, IArtifacts> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toArtifactsTID(tid), value as IArtifacts])
);
export const artifacts = artifactsRecords;
export const artifactsRepo = ArtifactsRepo.fromRaw(raw);
