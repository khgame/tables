/** this file is auto generated */
import * as TableContext from "./context";
import { IRelics, RelicsTID, toRelicsTID, RelicsRepo } from "./relics";
        
const raw = {
  "tids": [
    "30050001",
    "30050002",
    "30050003",
    "30050004",
    "30050005"
  ],
  "result": {
    "30050001": {
      "_tid": "30050001",
      "sector": 30,
      "category": 5,
      "serial": 1,
      "name": "虚空环轨矩阵",
      "school": "熵能",
      "activationStyle": "AUTO",
      "cooldown": 24,
      "duration": 6,
      "radius": 4.5,
      "sanityDrain": 12,
      "effects": "轨道体:+3|每秒伤害:+22虚空",
      "vfxSprite": "fx/relics/void_orbit.png",
      "sfxCue": "ui/assets/sfx/relics/void_hum.wav"
    },
    "30050002": {
      "_tid": "30050002",
      "sector": 30,
      "category": 5,
      "serial": 2,
      "name": "圣徽光域",
      "school": "辉耀",
      "activationStyle": "CHANNEL",
      "cooldown": 32,
      "duration": 8,
      "radius": 6,
      "sanityDrain": 18,
      "effects": "减速:+35%|持续:+8s",
      "vfxSprite": "fx/relics/sigil_halo.png",
      "sfxCue": "ui/assets/sfx/relics/halo_chime.wav"
    },
    "30050003": {
      "_tid": "30050003",
      "sector": 30,
      "category": 5,
      "serial": 3,
      "name": "潮汐漩核",
      "school": "潮汐",
      "activationStyle": "BURST",
      "cooldown": 28,
      "duration": 5,
      "radius": 5.5,
      "sanityDrain": 15,
      "effects": "拉拽强度:+100|爆裂伤害:+88霜寒",
      "vfxSprite": "fx/relics/maelstrom.png",
      "sfxCue": "ui/assets/sfx/relics/maelstrom.wav"
    },
    "30050004": {
      "_tid": "30050004",
      "sector": 30,
      "category": 5,
      "serial": 4,
      "name": "炽天光塔",
      "school": "辉耀",
      "activationStyle": "AUTO",
      "cooldown": 18,
      "duration": 4,
      "radius": 3,
      "sanityDrain": 10,
      "effects": "射速:0.6s|伤害:+16光耀",
      "vfxSprite": "fx/relics/seraph_beacon.png",
      "sfxCue": "ui/assets/sfx/relics/beacon_loop.wav"
    },
    "30050005": {
      "_tid": "30050005",
      "sector": 30,
      "category": 5,
      "serial": 5,
      "name": "护域绽放",
      "school": "护盾",
      "activationStyle": "BURST",
      "cooldown": 36,
      "duration": 4,
      "radius": 4,
      "sanityDrain": 20,
      "effects": "护盾:+60|持续:+8s",
      "vfxSprite": "fx/relics/aegis_bloom.png",
      "sfxCue": "ui/assets/sfx/relics/aegis.wav"
    }
  },
  "collisions": []
}

export const relicsRaw = raw;
export const relicsTids: RelicsTID[] = raw.tids.map(toRelicsTID);
export const relicsRecords: Record<RelicsTID, IRelics> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toRelicsTID(tid), value as IRelics])
);
export const relics = relicsRecords;
export const relicsRepo = RelicsRepo.fromRaw(raw);
