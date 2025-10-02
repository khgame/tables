/** this file is auto generated */
import * as TableContext from "./context";
        
export type ItemsTID = string & { readonly __ItemsTID: unique symbol };

export interface IItems {
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  slot: "ItemSlot";
  rarity: number;
  currency: "RewardCurrency";
  amount: number;
  attack: number;
  defense: number;
  bonusHp: number;
  effect: string;
  sourceStage: number;
  flavor: string;
}
