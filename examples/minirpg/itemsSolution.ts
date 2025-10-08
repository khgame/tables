/** this file is auto generated */
import * as TableContext from "./context";
import { IItems, ItemsTID, toItemsTID, ItemsRepo } from "./items";
        
const raw = {
  "tids": [
    "30010001",
    "30020001",
    "30030001",
    "30040001",
    "30050001",
    "30050002"
  ],
  "result": {
    "30010001": {
      "_tid": "30010001",
      "categoryCode": 30,
      "subtypeCode": 1,
      "sequenceCode": 1,
      "sequence": 1,
      "name": "Iron Sword",
      "slot": "Weapon",
      "rarity": 1,
      "currency": "gold",
      "amount": 400,
      "attack": 35,
      "defense": 0,
      "bonusHp": 0,
      "effect": "基础长剑，增加物理伤害。",
      "sourceStage": 40000002,
      "flavor": "大量量产的骑士制式武器。"
    },
    "30020001": {
      "_tid": "30020001",
      "categoryCode": 30,
      "subtypeCode": 2,
      "sequenceCode": 1,
      "sequence": 2,
      "name": "Apprentice Robe",
      "slot": "Armor",
      "rarity": 1,
      "currency": "gold",
      "amount": 350,
      "attack": 0,
      "defense": 20,
      "bonusHp": 120,
      "effect": "提升法术抗性并加快回蓝。",
      "sourceStage": 40000003,
      "flavor": "学院学徒的制服，附带细微的魔力纹路。"
    },
    "30030001": {
      "_tid": "30030001",
      "categoryCode": 30,
      "subtypeCode": 3,
      "sequenceCode": 1,
      "sequence": 3,
      "name": "Mana Potion",
      "slot": "Consumable",
      "rarity": 1,
      "currency": "gold",
      "amount": 50,
      "attack": 0,
      "defense": 0,
      "bonusHp": 0,
      "effect": "立即恢复 60 点能量。",
      "sourceStage": 40000001,
      "flavor": "香甜的蓝莓味，深受学徒欢迎。"
    },
    "30040001": {
      "_tid": "30040001",
      "categoryCode": 30,
      "subtypeCode": 4,
      "sequenceCode": 1,
      "sequence": 4,
      "name": "Knight Emblem",
      "slot": "Trinket",
      "rarity": 2,
      "currency": "guild",
      "amount": 15,
      "attack": 0,
      "defense": 40,
      "bonusHp": 200,
      "effect": "强化护盾技能效果。",
      "sourceStage": 40000001,
      "flavor": "象征坚守的徽章，镶嵌寒霜之石。"
    },
    "30050001": {
      "_tid": "30050001",
      "categoryCode": 30,
      "subtypeCode": 5,
      "sequenceCode": 1,
      "sequence": 5,
      "name": "Ember Ring",
      "slot": "Accessory",
      "rarity": 3,
      "currency": "gold",
      "amount": 800,
      "attack": 25,
      "defense": 10,
      "bonusHp": 80,
      "effect": "释放技能时追加灼烧伤害。",
      "sourceStage": 40000002,
      "flavor": "炙热的火焰石戒指，不断散发余温。"
    },
    "30050002": {
      "_tid": "30050002",
      "categoryCode": 30,
      "subtypeCode": 5,
      "sequenceCode": 2,
      "sequence": 6,
      "name": "Moonlight Charm",
      "slot": "Accessory",
      "rarity": 3,
      "currency": "honor",
      "amount": 120,
      "attack": 18,
      "defense": 25,
      "bonusHp": 60,
      "effect": "夜间战斗时提升闪避与暴击。",
      "sourceStage": 40000004,
      "flavor": "由月神祭司编织的护符，散发柔和光芒。"
    }
  },
  "collisions": []
}

export const itemsRaw = raw;
export const itemsTids: ItemsTID[] = raw.tids.map(toItemsTID);
export const itemsRecords: Record<ItemsTID, IItems> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toItemsTID(tid), value as IItems])
);
export const items = itemsRecords;
export const itemsRepo = ItemsRepo.fromRaw(raw);
