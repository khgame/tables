/** this file is auto generated */
import * as TableContext from "./context";
        
export type SynergyCardsTID = string & { readonly __SynergyCardsTID: unique symbol };

export interface ISynergyCards {
  sector: number;
  category: number;
  serial: number;
  name: string;
  tier: "SynergyTier";
  prerequisites: string;
  effects: string;
  trigger: string;
  icon: string;
}
