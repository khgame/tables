/** this file is auto generated */
import * as TableContext from "./context";
import { IHeroes, HeroesTID, toHeroesTID, HeroesRepo } from "./heroes";
        
const raw = {
  "tids": [
    "10000001",
    "10000002",
    "10000003",
    "10010001"
  ],
  "result": {
    "10000001": {
      "_tid": "10000001",
      "categoryCode": 10,
      "subtypeCode": 0,
      "sequenceCode": 1,
      "sequence": 1,
      "name": "Aerin Frostshield",
      "class": "Knight",
      "element": "Frost",
      "rarity": 2,
      "maxLevel": 30,
      "baseHp": 1200,
      "baseAtk": 85,
      "baseDef": 150,
      "signatureItem": 30000004,
      "primarySkill": 20001001,
      "supportSkill": 20002001,
      "ultimateSkill": 20006001,
      "unlockStage": 40000001,
      "role": "Vanguard",
      "region": "Elder Peaks",
      "story": "守护北境的年轻骑士，擅长用盾形构筑防线。",
      "portrait": "https://images.unsplash.com/photo-1526272560260-5b1c131dea52?auto=format&fit=crop&w=600&q=80"
    },
    "10000002": {
      "_tid": "10000002",
      "categoryCode": 10,
      "subtypeCode": 0,
      "sequenceCode": 2,
      "sequence": 2,
      "name": "Mira Silverquill",
      "class": "Mage",
      "element": "Arcane",
      "rarity": 3,
      "maxLevel": 40,
      "baseHp": 900,
      "baseAtk": 110,
      "baseDef": 95,
      "signatureItem": 30000005,
      "primarySkill": 20003001,
      "supportSkill": 20001002,
      "ultimateSkill": 20009001,
      "unlockStage": 40000002,
      "role": "Burst",
      "region": "Lumina Academy",
      "story": "天赋异禀的法师，对古代秘术痴迷，善于远程压制。",
      "portrait": "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=600&q=80"
    },
    "10000003": {
      "_tid": "10000003",
      "categoryCode": 10,
      "subtypeCode": 0,
      "sequenceCode": 3,
      "sequence": 3,
      "name": "Roth Dusktrail",
      "class": "Rogue",
      "element": "Shadow",
      "rarity": 2,
      "maxLevel": 32,
      "baseHp": 1000,
      "baseAtk": 95,
      "baseDef": 105,
      "signatureItem": 30000001,
      "primarySkill": 20004001,
      "supportSkill": 20005001,
      "ultimateSkill": 20005001,
      "unlockStage": 40000003,
      "role": "Assassin",
      "region": "Freeports",
      "story": "雇佣兵出身的游侠，行动迅捷，擅长毒刃。",
      "portrait": "https://images.unsplash.com/photo-1529245019870-59a6d1ef7c86?auto=format&fit=crop&w=600&q=80"
    },
    "10010001": {
      "_tid": "10010001",
      "categoryCode": 10,
      "subtypeCode": 1,
      "sequenceCode": 1,
      "sequence": 4,
      "name": "Nyx Moonweaver",
      "class": "Assassin",
      "element": "Lunar",
      "rarity": 4,
      "maxLevel": 45,
      "baseHp": 1050,
      "baseAtk": 120,
      "baseDef": 115,
      "signatureItem": 30000006,
      "primarySkill": 20007001,
      "supportSkill": 20002001,
      "ultimateSkill": 20008001,
      "unlockStage": 40000004,
      "role": "Skirmisher",
      "region": "Nightfall Enclave",
      "story": "掌握月影之术的刺客，能在暗夜中穿梭并施展幻舞。",
      "portrait": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80"
    }
  },
  "collisions": []
}

export const heroesRaw = raw;
export const heroesTids: HeroesTID[] = raw.tids.map(toHeroesTID);
export const heroesRecords: Record<HeroesTID, IHeroes> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toHeroesTID(tid), value as IHeroes])
);
export const heroes = heroesRecords;
export const heroesRepo = HeroesRepo.fromRaw(raw);
