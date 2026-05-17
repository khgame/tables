/** this file is auto generated */
import * as TableContext from "./context";
import { ISkills, SkillsTID, toSkillsTID, SkillsRepo } from "./skills";
        
const raw = {
  "tids": [
    "20001001",
    "20001002",
    "20002001",
    "20003001",
    "20004001",
    "20005001",
    "20006001",
    "20007001",
    "20008001",
    "20009001"
  ],
  "result": {
    "20001001": {
      "_tid": "20001001",
      "categoryCode": 20,
      "skillCode": 1,
      "levelCode": 1,
      "level": 1,
      "name": "Shield Bash",
      "target": "Enemy",
      "cooldown": 8,
      "power": 120,
      "scaling": 1,
      "energyCost": 20,
      "unlockStage": 40000001,
      "desc": "挥动盾牌造成伤害，并短暂眩晕敌人。"
    },
    "20001002": {
      "_tid": "20001002",
      "categoryCode": 20,
      "skillCode": 1,
      "levelCode": 2,
      "level": 2,
      "name": "Shield Bash",
      "target": "Enemy",
      "cooldown": 7,
      "power": 150,
      "scaling": 1.15,
      "energyCost": 20,
      "unlockStage": 40000002,
      "desc": "强化版盾击，提升伤害并延长控制。"
    },
    "20002001": {
      "_tid": "20002001",
      "categoryCode": 20,
      "skillCode": 2,
      "levelCode": 1,
      "level": 1,
      "name": "Guardian Aura",
      "target": "AllyTeam",
      "cooldown": 12,
      "power": 0,
      "scaling": 0,
      "energyCost": 25,
      "unlockStage": 40000001,
      "desc": "为全队提供护盾并缓慢回复生命。"
    },
    "20003001": {
      "_tid": "20003001",
      "categoryCode": 20,
      "skillCode": 3,
      "levelCode": 1,
      "level": 1,
      "name": "Arcane Nova",
      "target": "EnemyAll",
      "cooldown": 10,
      "power": 180,
      "scaling": 1.25,
      "energyCost": 30,
      "unlockStage": 40000002,
      "desc": "释放大范围法术，造成高额爆发伤害。"
    },
    "20004001": {
      "_tid": "20004001",
      "categoryCode": 20,
      "skillCode": 4,
      "levelCode": 1,
      "level": 1,
      "name": "Shadowstep",
      "target": "Self",
      "cooldown": 6,
      "power": 90,
      "scaling": 1.1,
      "energyCost": 10,
      "unlockStage": 40000002,
      "desc": "迅速闪至目标背后并提升下次攻击。"
    },
    "20005001": {
      "_tid": "20005001",
      "categoryCode": 20,
      "skillCode": 5,
      "levelCode": 1,
      "level": 1,
      "name": "Poisoned Blade",
      "target": "Enemy",
      "cooldown": 9,
      "power": 110,
      "scaling": 1.05,
      "energyCost": 18,
      "unlockStage": 40000003,
      "desc": "附加毒素的攻击，会在后续造成持续伤害。"
    },
    "20006001": {
      "_tid": "20006001",
      "categoryCode": 20,
      "skillCode": 6,
      "levelCode": 1,
      "level": 1,
      "name": "Celestial Lance",
      "target": "Boss",
      "cooldown": 14,
      "power": 240,
      "scaling": 1.4,
      "energyCost": 40,
      "unlockStage": 40000004,
      "desc": "召唤星辉长枪贯穿敌人，造成巨额伤害。"
    },
    "20007001": {
      "_tid": "20007001",
      "categoryCode": 20,
      "skillCode": 7,
      "levelCode": 1,
      "level": 1,
      "name": "Umbral Veil",
      "target": "Self",
      "cooldown": 11,
      "power": 0,
      "scaling": 0,
      "energyCost": 22,
      "unlockStage": 40000003,
      "desc": "化作影子躲避伤害，并在现身时造成穿刺。"
    },
    "20008001": {
      "_tid": "20008001",
      "categoryCode": 20,
      "skillCode": 8,
      "levelCode": 1,
      "level": 1,
      "name": "Moonfall Waltz",
      "target": "EnemyAll",
      "cooldown": 15,
      "power": 260,
      "scaling": 1.5,
      "energyCost": 45,
      "unlockStage": 40000004,
      "desc": "月光化作刀舞横扫全场，附带易伤效果。"
    },
    "20009001": {
      "_tid": "20009001",
      "categoryCode": 20,
      "skillCode": 9,
      "levelCode": 1,
      "level": 1,
      "name": "Crystal Bloom",
      "target": "Enemy",
      "cooldown": 13,
      "power": 210,
      "scaling": 1.35,
      "energyCost": 35,
      "unlockStage": 40000003,
      "desc": "凝聚水晶爆炸，造成范围伤害并减速。"
    }
  },
  "collisions": []
}

export const skillsRaw = raw;
export const skillsTids: SkillsTID[] = raw.tids.map(toSkillsTID);
export const skillsRecords: Record<SkillsTID, ISkills> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toSkillsTID(tid), value as ISkills])
);
export const skills = skillsRecords;
export const skillsRepo = SkillsRepo.fromRaw(raw);
