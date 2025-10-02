/** this file is auto generated */
import * as TableContext from "./context";
        
export type AchievementsTID = string & { readonly __AchievementsTID: unique symbol };

export interface IAchievements {
  tid: number;
  key: string;
  label: string;
  description: string;
  trigger: {
    resource: string|undefined;
    min: number|undefined;
    max: number|undefined;
    villagers: number|undefined;
    building: number|undefined;
    buildingCount: number|undefined;
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
}
