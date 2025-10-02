/** this file is auto generated */
import * as TableContext from "./context";
        
export type SkillsTID = string & { readonly __SkillsTID: unique symbol };

export interface ISkills {
  familyCode: number;
  skillCode: number;
  levelCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  tag: "SkillTag";
  target: "SkillTarget";
  cooldown: number;
  energyCost: number;
  formula: "DamageFormula";
  power: number;
  description: string;
}
