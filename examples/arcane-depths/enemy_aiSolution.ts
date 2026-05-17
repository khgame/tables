/** this file is auto generated */
import * as TableContext from "./context";
import { IEnemyAi, EnemyAiTID, toEnemyAiTID, EnemyAiRepo } from "./enemy_ai";
        
const raw = {
  "tids": [
    "41010100",
    "41010200",
    "41010300",
    "41010400",
    "41020100",
    "41020200",
    "41030100",
    "41030200",
    "41030300"
  ],
  "result": {
    "41010100": {
      "_tid": "41010100",
      "familyCode": 41,
      "enemyCode": 1,
      "behaviorCode": 1,
      "variantCode": 0,
      "sequence": 1,
      "enemyId": 40010100,
      "priority": 1,
      "condition": "OnTurnStart",
      "action": "AttackFront",
      "param": "burn",
      "cooldown": 0
    },
    "41010200": {
      "_tid": "41010200",
      "familyCode": 41,
      "enemyCode": 1,
      "behaviorCode": 2,
      "variantCode": 0,
      "sequence": 2,
      "enemyId": 40010100,
      "priority": 2,
      "condition": "HpBelow50",
      "action": "ApplyDebuff",
      "param": "ignite",
      "cooldown": 3
    },
    "41010300": {
      "_tid": "41010300",
      "familyCode": 41,
      "enemyCode": 1,
      "behaviorCode": 3,
      "variantCode": 0,
      "sequence": 3,
      "enemyId": 40010300,
      "priority": 1,
      "condition": "OnTurnStart",
      "action": "SummonMinion",
      "param": "emberling",
      "cooldown": 4
    },
    "41010400": {
      "_tid": "41010400",
      "familyCode": 41,
      "enemyCode": 1,
      "behaviorCode": 4,
      "variantCode": 0,
      "sequence": 4,
      "enemyId": 40010300,
      "priority": 2,
      "condition": "OnAllyDown",
      "action": "AttackLowestHp",
      "param": "execute",
      "cooldown": 0
    },
    "41020100": {
      "_tid": "41020100",
      "familyCode": 41,
      "enemyCode": 2,
      "behaviorCode": 1,
      "variantCode": 0,
      "sequence": 1,
      "enemyId": 40020300,
      "priority": 1,
      "condition": "OnTurnStart",
      "action": "ApplyDebuff",
      "param": "root",
      "cooldown": 2
    },
    "41020200": {
      "_tid": "41020200",
      "familyCode": 41,
      "enemyCode": 2,
      "behaviorCode": 2,
      "variantCode": 0,
      "sequence": 2,
      "enemyId": 40020300,
      "priority": 2,
      "condition": "OnPlayerHeal",
      "action": "SummonMinion",
      "param": "sporeling",
      "cooldown": 3
    },
    "41030100": {
      "_tid": "41030100",
      "familyCode": 41,
      "enemyCode": 3,
      "behaviorCode": 1,
      "variantCode": 0,
      "sequence": 1,
      "enemyId": 40030300,
      "priority": 1,
      "condition": "OnTurnStart",
      "action": "AttackFront",
      "param": "meteor",
      "cooldown": 0
    },
    "41030200": {
      "_tid": "41030200",
      "familyCode": 41,
      "enemyCode": 3,
      "behaviorCode": 2,
      "variantCode": 0,
      "sequence": 2,
      "enemyId": 40030300,
      "priority": 2,
      "condition": "HpBelow50",
      "action": "SummonMinion",
      "param": "forge_construct",
      "cooldown": 2
    },
    "41030300": {
      "_tid": "41030300",
      "familyCode": 41,
      "enemyCode": 3,
      "behaviorCode": 3,
      "variantCode": 0,
      "sequence": 3,
      "enemyId": 40030300,
      "priority": 3,
      "condition": "OnAllyDown",
      "action": "ApplyDebuff",
      "param": "frailty",
      "cooldown": 3
    }
  },
  "collisions": []
}

export const enemyAiRaw = raw;
export const enemyAiTids: EnemyAiTID[] = raw.tids.map(toEnemyAiTID);
export const enemyAiRecords: Record<EnemyAiTID, IEnemyAi> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toEnemyAiTID(tid), value as IEnemyAi])
);
export const enemyAi = enemyAiRecords;
export const enemyAiRepo = EnemyAiRepo.fromRaw(raw);
