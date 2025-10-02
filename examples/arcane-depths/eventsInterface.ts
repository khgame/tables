/** this file is auto generated */
import * as TableContext from "./context";
        
export type EventsTID = string & { readonly __EventsTID: unique symbol };

export interface IEvents {
  familyCode: number;
  eventCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  chapterId: number|undefined;
  title: string;
  summary: string;
  option1Text: string;
  option1Requirement: "RequirementType"|undefined;
  option1RewardType: "RewardType"|undefined;
  option1RewardValue: string|undefined;
  option1PenaltyType: "PenaltyType"|undefined;
  option1PenaltyValue: string|undefined;
  option2Text: string|undefined;
  option2Requirement: "RequirementType"|undefined;
  option2RewardType: "RewardType"|undefined;
  option2RewardValue: string|undefined;
  option2PenaltyType: "PenaltyType"|undefined;
  option2PenaltyValue: string|undefined;
  followUp: number|undefined;
}
