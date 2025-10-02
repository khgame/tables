/** this file is auto generated */
import * as TableContext from "./context";
        
export type BossesTID = string & { readonly __BossesTID: unique symbol };

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
