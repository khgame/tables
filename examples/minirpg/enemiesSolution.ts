/** this file is auto generated */
import * as TableContext from "./context";
import { IEnemies, EnemiesTID, toEnemiesTID, EnemiesRepo } from "./enemies";
        
const raw = {
  "tids": [
    "50000001",
    "50000002",
    "50000003",
    "50010001"
  ],
  "result": {
    "50000001": {
      "_tid": "50000001",
      "categoryCode": 50,
      "subtypeCode": 0,
      "sequenceCode": 1,
      "sequence": 1,
      "name": "Frostfang Raider",
      "element": "Frost",
      "role": "Bruiser",
      "hp": 950,
      "attack": 80,
      "defense": 60,
      "skill": "冰霜冲撞",
      "weakness": "火焰",
      "rewardExp": 120,
      "portrait": "https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=600&q=80"
    },
    "50000002": {
      "_tid": "50000002",
      "categoryCode": 50,
      "subtypeCode": 0,
      "sequenceCode": 2,
      "sequence": 2,
      "name": "Obsidian Sentinel",
      "element": "Arcane",
      "role": "Guardian",
      "hp": 1200,
      "attack": 70,
      "defense": 90,
      "skill": "熔核护盾",
      "weakness": "毒素",
      "rewardExp": 160,
      "portrait": "https://images.unsplash.com/photo-1558980664-10ea1989d896?auto=format&fit=crop&w=600&q=80"
    },
    "50000003": {
      "_tid": "50000003",
      "categoryCode": 50,
      "subtypeCode": 0,
      "sequenceCode": 3,
      "sequence": 3,
      "name": "Marsh Wraith",
      "element": "Shadow",
      "role": "Caster",
      "hp": 850,
      "attack": 95,
      "defense": 45,
      "skill": "瘴雾缠绕",
      "weakness": "圣光",
      "rewardExp": 150,
      "portrait": "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=600&q=80"
    },
    "50010001": {
      "_tid": "50010001",
      "categoryCode": 50,
      "subtypeCode": 1,
      "sequenceCode": 1,
      "sequence": 4,
      "name": "Lunar Shade",
      "element": "Lunar",
      "role": "Assassin",
      "hp": 1000,
      "attack": 105,
      "defense": 70,
      "skill": "月蚀狂袭",
      "weakness": "雷电",
      "rewardExp": 200,
      "portrait": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80"
    }
  },
  "collisions": []
}

export const enemiesRaw = raw;
export const enemiesTids: EnemiesTID[] = raw.tids.map(toEnemiesTID);
export const enemiesRecords: Record<EnemiesTID, IEnemies> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toEnemiesTID(tid), value as IEnemies])
);
export const enemies = enemiesRecords;
export const enemiesRepo = EnemiesRepo.fromRaw(raw);
