/** this file is auto generated */
import * as TableContext from "./context";
        
export type HeroesTID = string & { readonly __HeroesTID: unique symbol };

export interface IHeroes {
  familyCode: number;
  classCode: number;
  heroCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  classTid: number;
  role: "HeroRole";
  rarity: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  signatureSkill: number;
  supportSkill: number;
  ultimateSkill: number;
  unlockChapter: number;
  primaryTrait: "TraitType";
  secondaryTrait: "TraitType"|undefined;
  portrait: string;
}
