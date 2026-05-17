/** this file is auto generated */
import * as TableContext from "./context";
import { ISkillTree, SkillTreeTID, toSkillTreeTID, SkillTreeRepo } from "./skill_tree";
        
const raw = {
  "tids": [
    "70010001",
    "70010002",
    "70010003",
    "70020001",
    "70020002",
    "70020003",
    "70030001",
    "70030002",
    "70030003",
    "70040001",
    "70040002",
    "70040003"
  ],
  "result": {
    "70010001": {
      "_tid": "70010001",
      "sector": 70,
      "branch": 1,
      "node": 1,
      "name": "裂变弹匣",
      "branchName": "弹道",
      "tier": 1,
      "parent": "",
      "effects": "multiShot:2|damage:+6",
      "requirements": "level:3",
      "tooltip": "触发时连续射出两轮弹幕。",
      "icon": "icons/skill/ballistic-tier1.svg"
    },
    "70010002": {
      "_tid": "70010002",
      "sector": 70,
      "branch": 1,
      "node": 2,
      "name": "轨迹稳流",
      "branchName": "弹道",
      "tier": 2,
      "parent": "skill:70010001",
      "effects": "multiShot:3|stability:+12|projectileSize:+12|multiShotAngle:4",
      "requirements": "level:6",
      "tooltip": "连续三轮射击并稳定弹道。",
      "icon": "icons/skill/ballistic-tier2.svg"
    },
    "70010003": {
      "_tid": "70010003",
      "sector": 70,
      "branch": 1,
      "node": 3,
      "name": "深域贯穿",
      "branchName": "弹道",
      "tier": 3,
      "parent": "skill:70010002",
      "effects": "multiShot:4|pierce:+1|ricochet:+1",
      "requirements": "level:9",
      "tooltip": "连续四轮射击并令子弹贯穿弹射。",
      "icon": "icons/skill/ballistic-tier3.svg"
    },
    "70020001": {
      "_tid": "70020001",
      "sector": 70,
      "branch": 2,
      "node": 1,
      "name": "棱镜导光",
      "branchName": "能量",
      "tier": 1,
      "parent": "",
      "effects": "damage:+6|sanityDrain:-6|projectileSize:+18",
      "requirements": "level:4|weaponAttack:BEAM",
      "tooltip": "棱镜束缚能量消耗，同时扩大光束宽度。",
      "icon": "icons/skill/energy-tier1.svg"
    },
    "70020002": {
      "_tid": "70020002",
      "sector": 70,
      "branch": 2,
      "node": 2,
      "name": "谐振折叠",
      "branchName": "能量",
      "tier": 2,
      "parent": "skill:70020001",
      "effects": "damageMultiplier:+8|projectileSpeed:+14|stability:+8",
      "requirements": "level:7|weaponAttack:BEAM",
      "tooltip": "折叠振镜提高能量聚焦与射速。",
      "icon": "icons/skill/energy-tier2.svg"
    },
    "70020003": {
      "_tid": "70020003",
      "sector": 70,
      "branch": 2,
      "node": 3,
      "name": "相干放射",
      "branchName": "能量",
      "tier": 3,
      "parent": "skill:70020002",
      "effects": "ricochet:+1|crit:+6|damage:+12",
      "requirements": "level:10|weaponAttack:BEAM",
      "tooltip": "相干腔反复震荡，使光束可在敌间折射。",
      "icon": "icons/skill/energy-tier3.svg"
    },
    "70030001": {
      "_tid": "70030001",
      "sector": 70,
      "branch": 3,
      "node": 1,
      "name": "相位壁垒",
      "branchName": "护卫",
      "tier": 1,
      "parent": "",
      "effects": "shield:+60|contactResist:+25|sanityRegen:+3",
      "requirements": "level:4",
      "tooltip": "展开相位护壁，降低接触伤害并补充理智。",
      "icon": "icons/skill/guardian-tier1.svg"
    },
    "70030002": {
      "_tid": "70030002",
      "sector": 70,
      "branch": 3,
      "node": 2,
      "name": "护盾崩击",
      "branchName": "护卫",
      "tier": 2,
      "parent": "skill:70030001",
      "effects": "meleeDamage:+70|meleeRadius:+20|meleeInterval:-0.5",
      "requirements": "level:7",
      "tooltip": "护盾冲击形成短距爆发，持续清理近身威胁。",
      "icon": "icons/skill/guardian-tier2.svg"
    },
    "70030003": {
      "_tid": "70030003",
      "sector": 70,
      "branch": 3,
      "node": 3,
      "name": "寂光回响",
      "branchName": "护卫",
      "tier": 3,
      "parent": "skill:70030002",
      "effects": "beamReflect:20%|shieldRegen:+16|invulnTime:+0.4",
      "requirements": "level:10",
      "tooltip": "护盾折射寂光，可短暂反弹能量。",
      "icon": "icons/skill/guardian-tier3.svg"
    },
    "70040001": {
      "_tid": "70040001",
      "sector": 70,
      "branch": 4,
      "node": 1,
      "name": "术式镀层",
      "branchName": "工坊",
      "tier": 1,
      "parent": "",
      "effects": "projectileSize:+24|elementSlow:+18|elementSlowDuration:+1.2",
      "requirements": "level:5",
      "tooltip": "在弹体上刻蚀术式，对命中目标施加霜蚀减速。",
      "icon": "icons/skill/workshop-tier1.svg"
    },
    "70040002": {
      "_tid": "70040002",
      "sector": 70,
      "branch": 4,
      "node": 2,
      "name": "弹道精铸",
      "branchName": "工坊",
      "tier": 2,
      "parent": "skill:70040001",
      "effects": "split:+1|splitAngle:+4|pierce:+1",
      "requirements": "level:8",
      "tooltip": "精铸枪管令术弹再次分裂并保持贯穿。",
      "icon": "icons/skill/workshop-tier2.svg"
    },
    "70040003": {
      "_tid": "70040003",
      "sector": 70,
      "branch": 4,
      "node": 3,
      "name": "秘火迸流",
      "branchName": "工坊",
      "tier": 3,
      "parent": "skill:70040002",
      "effects": "damageMultiplier:+12|luckBonus:+12|projectileSpeed:+16",
      "requirements": "level:11",
      "tooltip": "秘火符文强化弹速与掉落运势。",
      "icon": "icons/skill/workshop-tier3.svg"
    }
  },
  "collisions": []
}

export const skillTreeRaw = raw;
export const skillTreeTids: SkillTreeTID[] = raw.tids.map(toSkillTreeTID);
export const skillTreeRecords: Record<SkillTreeTID, ISkillTree> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toSkillTreeTID(tid), value as ISkillTree])
);
export const skillTree = skillTreeRecords;
export const skillTreeRepo = SkillTreeRepo.fromRaw(raw);
