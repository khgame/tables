/** this file is auto generated */
import * as TableContext from "./context";
        
export type JobsTID = string & { readonly __JobsTID: unique symbol };

export interface IJobs {
  tid: number;
  key: string;
  label: string;
  description: string;
  produces: {
    wood: number|undefined;
    fur: number|undefined;
    meat: number|undefined;
    leather: number|undefined;
    charcoal: number|undefined;
    iron: number|undefined;
    steel: number|undefined;
    warmth: number|undefined;
    supplies: number|undefined;
  };
  consumes: {
    wood: number|undefined;
    fur: number|undefined;
    meat: number|undefined;
    leather: number|undefined;
    charcoal: number|undefined;
    iron: number|undefined;
    steel: number|undefined;
    warmth: number|undefined;
    supplies: number|undefined;
  };
  baseRate: number;
  baseCap: number;
  unlock: {
    building: number|undefined;
    buildingCount: number|undefined;
    resource: string|undefined;
    min: number|undefined;
    max: number|undefined;
    villagers: number|undefined;
    event: number|undefined;
  };
}
