/** this file is auto generated */
import * as TableContext from "./context";
        
export type AchievementsTID = string & { readonly __AchievementsTID: unique symbol };

export interface IAchievements {
  familyCode: number;
  achievementCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  title: string;
  description: string;
  trigger: string;
  rewardType: "RewardType";
  rewardValue: string;
}
