/** this file is auto generated */
import * as TableContext from "./context";
        
export type TasksTID = string & { readonly __TasksTID: unique symbol };

export interface ITasks {
  familyCode: number;
  taskCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  scope: string;
  name: string;
  condition: string;
  rewardType: "RewardType";
  rewardValue: string;
  linkedChapter: number|undefined;
}
