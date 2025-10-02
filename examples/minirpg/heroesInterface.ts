/** this file is auto generated */
import * as TableContext from "./context";
        
export type HeroesTID = string & { readonly __HeroesTID: unique symbol };

export interface IHeroes {
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  class: "HeroClass";
  element: "HeroElement";
  rarity: number;
  maxLevel: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  signatureItem: number;
  primarySkill: number;
  supportSkill: number;
  ultimateSkill: number;
  unlockStage: number;
  role: "HeroRole";
  region: string;
  story: string;
  portrait: string;
}
