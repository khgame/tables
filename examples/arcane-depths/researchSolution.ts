/** this file is auto generated */
import * as TableContext from "./context";
import { IResearch, ResearchTID, toResearchTID, ResearchRepo } from "./research";
        
const raw = {
  "tids": [
    "71010000",
    "71020000",
    "71030000",
    "71040000",
    "71050000"
  ],
  "result": {
    "71010000": {
      "_tid": "71010000",
      "familyCode": 71,
      "researchCode": 1,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "name": "熔心防御矩阵",
      "costResource": "Crystal",
      "costAmount": 120,
      "rewardType": "UnlockFacility",
      "rewardValue": "70010100"
    },
    "71020000": {
      "_tid": "71020000",
      "familyCode": 71,
      "researchCode": 2,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 2,
      "name": "余烬护盾调制",
      "parent": 71010000,
      "costResource": "Arcane",
      "costAmount": 90,
      "rewardType": "Passive",
      "rewardValue": "护盾效率+10%"
    },
    "71030000": {
      "_tid": "71030000",
      "familyCode": 71,
      "researchCode": 3,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 3,
      "name": "蔓生复苏术",
      "costResource": "Provision",
      "costAmount": 100,
      "rewardType": "UnlockFacility",
      "rewardValue": "70040100"
    },
    "71040000": {
      "_tid": "71040000",
      "familyCode": 71,
      "researchCode": 4,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 4,
      "name": "星界注能",
      "parent": 71020000,
      "costResource": "Arcane",
      "costAmount": 140,
      "rewardType": "Passive",
      "rewardValue": "能量回复+0.2"
    },
    "71050000": {
      "_tid": "71050000",
      "familyCode": 71,
      "researchCode": 5,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 5,
      "name": "熔炉终极构筑",
      "parent": 71040000,
      "costResource": "Crystal",
      "costAmount": 160,
      "rewardType": "UnlockSkill",
      "rewardValue": "30990100"
    }
  },
  "collisions": []
}

export const researchRaw = raw;
export const researchTids: ResearchTID[] = raw.tids.map(toResearchTID);
export const researchRecords: Record<ResearchTID, IResearch> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toResearchTID(tid), value as IResearch])
);
export const research = researchRecords;
export const researchRepo = ResearchRepo.fromRaw(raw);
