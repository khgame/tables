/** this file is auto generated */
import * as TableContext from "./context";
        
export type ClassesTID = string & { readonly __ClassesTID: unique symbol };

export interface IClasses {
  familyCode: number;
  classCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  classKey: "HeroClass";
  name: string;
  role: "HeroRole";
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  energyRegen: number;
  signatureTrait: "TraitType";
  gearSlots: string;
}
