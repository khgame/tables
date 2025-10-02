/** this file is auto generated */
import * as TableContext from "./context";
        
export type ActionsTID = string & { readonly __ActionsTID: unique symbol };

export interface IActions {
  tid: number;
  key: string;
  label: string;
  description: string;
  cooldown: number;
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
  reward: {
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
  unlock: {
    building: number|undefined;
    resource: string|undefined;
    min: number|undefined;
    villagers: number|undefined;
    event: number|undefined;
  };
  logStart: string;
  logResult: string;
  offline: boolean;
}
