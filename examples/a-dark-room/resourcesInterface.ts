/** this file is auto generated */
import * as TableContext from "./context";
        
export type ResourcesTID = string & { readonly __ResourcesTID: unique symbol };

export interface IResources {
  tid: number;
  key: string;
  label: string;
  description: string;
  baseRate: number;
  decayRate: number;
  baseCapacity: number;
  maxCapacity: number;
  sequence: number;
  displayOrder: number;
}
