/** this file is auto generated */
import * as TableContext from "./context";
        
export type SkillTreeTID = string & { readonly __SkillTreeTID: unique symbol };

export interface ISkillTree {
  sector: number;
  branch: number;
  node: number;
  name: string;
  branchName: "SkillBranch";
  tier: number;
  parent: string;
  effects: string;
  requirements: string;
  tooltip: string;
  icon: string;
}
