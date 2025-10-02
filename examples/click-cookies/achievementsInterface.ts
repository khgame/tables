/** this file is auto generated */
import * as TableContext from "./context";
        
export type AchievementsTID = string & { readonly __AchievementsTID: unique symbol };

export interface IAchievements {
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  requirementType: "AchievementType";
  requirementValue: number;
  flavor: string;
  icon: string;
}
