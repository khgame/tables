/** this file is auto generated */
import * as TableContext from "./context";
        
export type SkillLinksTID = string & { readonly __SkillLinksTID: unique symbol };

export interface ISkillLinks {
  familyCode: number;
  linkCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  skillId: number;
  triggerTrait: "TraitType"|undefined;
  condition: string;
  stepOrder: number;
  stepSkill: number;
  chance: number;
  remark: string|undefined;
}
