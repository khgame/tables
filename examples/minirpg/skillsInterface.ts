/** this file is auto generated */
import * as TableContext from "./context";
        
export type SkillsTID = string & { readonly __SkillsTID: unique symbol };

export interface ISkills {
  categoryCode: number;
  skillCode: number;
  levelCode: number;
  level: number;
  name: string;
  target: "SkillTarget";
  cooldown: number;
  power: number;
  scaling: number;
  energyCost: number;
  unlockStage: number;
  desc: string;
}
