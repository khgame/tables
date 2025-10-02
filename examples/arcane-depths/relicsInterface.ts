/** this file is auto generated */
import * as TableContext from "./context";
        
export type RelicsTID = string & { readonly __RelicsTID: unique symbol };

export interface IRelics {
  familyCode: number;
  relicCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  name: string;
  rarity: number;
  slot: string;
  effectSummary: string;
  triggerCondition: string|undefined;
  triggerEffect: string;
  synergyTrait: "TraitType"|undefined;
}
