/** this file is auto generated */
import * as TableContext from "./context";
import { IEconomy, EconomyTID, toEconomyTID, EconomyRepo } from "./economy";
        
const raw = {
  "tids": [
    "80010000",
    "80010001",
    "80020000",
    "80030000",
    "80040000",
    "80050000"
  ],
  "result": {
    "80010000": {
      "_tid": "80010000",
      "familyCode": 80,
      "economyCode": 1,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "scope": "章节结算",
      "resource": "Crystal",
      "stage": 1,
      "rewardAmount": 28,
      "notes": "通关获得基础水晶"
    },
    "80010001": {
      "_tid": "80010001",
      "familyCode": 80,
      "economyCode": 1,
      "variantCode": 0,
      "subCode": 1,
      "sequence": 2,
      "scope": "章节结算",
      "resource": "Crystal",
      "stage": 2,
      "rewardAmount": 36,
      "notes": "额外奖励来自任务"
    },
    "80020000": {
      "_tid": "80020000",
      "familyCode": 80,
      "economyCode": 2,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "scope": "战斗掉落",
      "resource": "Arcane",
      "stage": 1,
      "rewardAmount": 8,
      "notes": "精英战+4"
    },
    "80030000": {
      "_tid": "80030000",
      "familyCode": 80,
      "economyCode": 3,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "scope": "事件奖励",
      "resource": "Provision",
      "stage": 1,
      "rewardAmount": 15,
      "notes": "成功事件额外奖励"
    },
    "80040000": {
      "_tid": "80040000",
      "familyCode": 80,
      "economyCode": 4,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "scope": "商人交易",
      "resource": "Provision",
      "stage": 0,
      "rewardAmount": 0,
      "consumption": 12,
      "notes": "购买遗物或装备"
    },
    "80050000": {
      "_tid": "80050000",
      "familyCode": 80,
      "economyCode": 5,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "scope": "设施维护",
      "resource": "Arcane",
      "stage": 0,
      "rewardAmount": 0,
      "consumption": 6,
      "notes": "每回合维护消耗"
    }
  },
  "collisions": []
}

export const economyRaw = raw;
export const economyTids: EconomyTID[] = raw.tids.map(toEconomyTID);
export const economyRecords: Record<EconomyTID, IEconomy> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toEconomyTID(tid), value as IEconomy])
);
export const economy = economyRecords;
export const economyRepo = EconomyRepo.fromRaw(raw);
