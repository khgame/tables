/** this file is auto generated */
import * as TableContext from "./context";
import { ISynergyCards, SynergyCardsTID, toSynergyCardsTID, SynergyCardsRepo } from "./synergy_cards";
        
const raw = {
  "tids": [
    "71020001",
    "71020002",
    "71020003",
    "71020004"
  ],
  "result": {
    "71020001": {
      "_tid": "71020001",
      "sector": 71,
      "category": 2,
      "serial": 1,
      "name": "深渊利维坦矛",
      "tier": "MYTHIC",
      "prerequisites": "weapon:20020002|relic:30050003",
      "effects": "damage:+24|pullStrength:+20",
      "trigger": "sanity:<40",
      "icon": "icons/synergy/leviathan.png"
    },
    "71020002": {
      "_tid": "71020002",
      "sector": 71,
      "category": 2,
      "serial": 2,
      "name": "奇点圆舞",
      "tier": "EPIC",
      "prerequisites": "weapon:20020001|relic:30050001",
      "effects": "projectileSpeed:+18|split:+1|crit:+6",
      "trigger": "after:reload",
      "icon": "icons/synergy/singularity.png"
    },
    "71020003": {
      "_tid": "71020003",
      "sector": 71,
      "category": 2,
      "serial": 3,
      "name": "炽天潮汐",
      "tier": "RARE",
      "prerequisites": "relic:30050002|skill:70030002",
      "effects": "slow:+12%|shield:+30|duration:+2",
      "trigger": "killstreak:15@20s",
      "icon": "icons/synergy/seraph_tide.png"
    },
    "71020004": {
      "_tid": "71020004",
      "sector": 71,
      "category": 2,
      "serial": 4,
      "name": "逆潮蓄能阵",
      "tier": "EPIC",
      "prerequisites": "weapon:20020003|skill:70040002",
      "effects": "damageMultiplier:+12|ricochet:+1",
      "trigger": "after:maelstrom",
      "icon": "icons/synergy/undertow_battery.png"
    }
  },
  "collisions": []
}

export const synergyCardsRaw = raw;
export const synergyCardsTids: SynergyCardsTID[] = raw.tids.map(toSynergyCardsTID);
export const synergyCardsRecords: Record<SynergyCardsTID, ISynergyCards> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toSynergyCardsTID(tid), value as ISynergyCards])
);
export const synergyCards = synergyCardsRecords;
export const synergyCardsRepo = SynergyCardsRepo.fromRaw(raw);
