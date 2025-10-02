/** this file is auto generated */
import * as TableContext from "./context";
        
export type RelicsTID = string & { readonly __RelicsTID: unique symbol };

export interface IRelics {
  sector: number;
  category: number;
  serial: number;
  name: string;
  school: string;
  activationStyle: "AttackStyle";
  cooldown: number;
  duration: number;
  radius: number;
  sanityDrain: number;
  effects: string;
  vfxSprite: string;
  sfxCue: string;
}
