/** this file is auto generated */
import * as TableContext from "./context";
        
export type ResearchTID = string & { readonly __ResearchTID: unique symbol };

export interface IResearch {
  familyCode: number;
  researchCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  name: string;
  parent: number|undefined;
  costResource: "ResourceType";
  costAmount: number;
  rewardType: string;
  rewardValue: string;
}
