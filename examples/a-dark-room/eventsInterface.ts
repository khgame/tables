/** this file is auto generated */
import * as TableContext from "./context";
        
export type EventsTID = string & { readonly __EventsTID: unique symbol };

export interface IEvents {
  tid: number;
  key: string;
  label: string;
  description: string;
  trigger: {
    resource: string|undefined;
    building: number|undefined;
    event: number|undefined;
    villagers: number|undefined;
    min: number|undefined;
    max: number|undefined;
    supplies: number|undefined;
  };
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
  cooldown: number;
  once: boolean;
  log: string;
}
