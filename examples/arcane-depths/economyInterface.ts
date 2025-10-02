/** this file is auto generated */
import * as TableContext from "./context";
        
export type EconomyTID = string & { readonly __EconomyTID: unique symbol };

export interface IEconomy {
  familyCode: number;
  economyCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  scope: string;
  resource: "ResourceType";
  stage: number;
  rewardAmount: number;
  consumption: number|undefined;
  notes: string|undefined;
}
