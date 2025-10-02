/** this file is auto generated */
import * as TableContext from "./context";
        
export type BuildingsTID = string & { readonly __BuildingsTID: unique symbol };

export interface IBuildings {
  tid: number;
  key: string;
  label: string;
  description: string;
  cost: {
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
  costScaling: number|undefined;
  effects: Array<{
      type: string|undefined;
      resource: string|undefined;
      amount: number|undefined;
      building: number|undefined;
      job: number|undefined;
      action: number|undefined;
      event: number|undefined;
      message: string|undefined;
    }>;
  unlock: {
    building: number|undefined;
    resource: string|undefined;
    min: number|undefined;
    max: number|undefined;
    villagers: number|undefined;
    event: number|undefined;
  };
  buildTime: number;
  repeatable: boolean;
  maxCount: number;
}
