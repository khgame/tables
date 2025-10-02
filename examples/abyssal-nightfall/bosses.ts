/** this file is auto generated */
import * as TableContext from "./context";
        
export interface IBosses {
  sector: number;
  category: number;
  serial: number;
  name: string;
  hp: number;
  armor: number;
  moveSpeed: number;
  enrageSpeed: number;
  signatureAttack: string;
  attackInterval: number;
  projectileLifetime: number;
  telegraphSprite: string;
  arenaModifier: string;
  sprite: string;
  spriteScale: number;
  deathSprite: string;
  deathSfx: string;
  themeTrack: string;
}

type BossesTID = string & { readonly __BossesTID: unique symbol };
const toBossesTID = (value: string): BossesTID => value as BossesTID;

const raw = {
  "tids": [
    "50070001",
    "50070002",
    "50070003"
  ],
  "result": {
    "50070001": {
      "sector": 50,
      "category": 7,
      "serial": 1,
      "name": "万口赞歌执政体",
      "hp": 9000,
      "armor": 25,
      "moveSpeed": 3,
      "enrageSpeed": 20,
      "signatureAttack": "旋转虚空光束配合赞歌轰炸",
      "attackInterval": 1.2,
      "projectileLifetime": 0.8,
      "telegraphSprite": "fx/telegraph/choir_circle.png",
      "arenaModifier": "每 20 秒累积 1 层恐惧。",
      "sprite": "ui/assets/topdown/top-down-shooter/characters/tank-cannon.png",
      "spriteScale": 1.1,
      "deathSprite": "ui/assets/topdown/top-down-shooter/effects/explosion.png",
      "deathSfx": "ui/assets/topdown/top-down-shooter/sounds/explosion-3.wav",
      "themeTrack": "ui/assets/topdown/top-down-shooter/music/theme-4.ogg"
    },
    "50070002": {
      "sector": 50,
      "category": 7,
      "serial": 2,
      "name": "潮汐引航巨像",
      "hp": 8200,
      "armor": 18,
      "moveSpeed": 2.4,
      "enrageSpeed": 18,
      "signatureAttack": "锁链钩拖将玩家拉入潮汐航道",
      "attackInterval": 2.1,
      "projectileLifetime": 1.1,
      "telegraphSprite": "fx/telegraph/tidal_lane.png",
      "arenaModifier": "每 15 秒海潮横扫战场边缘。",
      "sprite": "ui/assets/topdown/top-down-shooter/characters/tank-base.png",
      "spriteScale": 1.05,
      "deathSprite": "ui/assets/topdown/top-down-shooter/effects/5.png",
      "deathSfx": "ui/assets/topdown/top-down-shooter/sounds/explosion-2.wav",
      "themeTrack": "ui/assets/topdown/top-down-shooter/music/theme-4.ogg"
    },
    "50070003": {
      "sector": 50,
      "category": 7,
      "serial": 3,
      "name": "无名肃光灯塔",
      "hp": 9800,
      "armor": 32,
      "moveSpeed": 2.8,
      "enrageSpeed": 24,
      "signatureAttack": "监视立柱抽离理智能量",
      "attackInterval": 1.6,
      "projectileLifetime": 0.95,
      "telegraphSprite": "fx/telegraph/beacon_grid.png",
      "arenaModifier": "激活时视野压缩至 65%。",
      "sprite": "ui/assets/topdown/top-down-shooter/background/door.gif",
      "spriteScale": 1,
      "deathSprite": "ui/assets/topdown/top-down-shooter/effects/4.png",
      "deathSfx": "ui/assets/topdown/top-down-shooter/sounds/explosion-1.wav",
      "themeTrack": "ui/assets/topdown/top-down-shooter/music/theme-4.ogg"
    }
  },
  "collisions": []
}

export const bossesTids: BossesTID[] = raw.tids.map(toBossesTID);
export const bosses: Record<BossesTID, IBosses> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toBossesTID(tid), value as IBosses])
);
