/** this file is auto generated */
import * as TableContext from "./context";
        
export type RelicsTID = string & { readonly __RelicsTID: unique symbol };

export interface IRelics {
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  effectType: "RelicEffectType";
  effectValue: number;
  unlockStage: number|undefined;
  desc: string;
  icon: string;
}
