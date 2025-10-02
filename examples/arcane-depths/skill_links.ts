/** this file is auto generated */
import * as TableContext from "./context";
        
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

type SkillLinksTID = string & { readonly __SkillLinksTID: unique symbol };
const toSkillLinksTID = (value: string): SkillLinksTID => value as SkillLinksTID;

const raw = {
  "tids": [
    "31010000",
    "31020000",
    "31030000"
  ],
  "result": {
    "31010000": {
      "familyCode": 31,
      "linkCode": 1,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "skillId": 30010100,
      "triggerTrait": "Resolve",
      "condition": "队伍护盾总量>=200",
      "stepOrder": 1,
      "stepSkill": 30010200,
      "chance": 1,
      "remark": "Molten Bulwark 触发升级"
    },
    "31020000": {
      "familyCode": 31,
      "linkCode": 2,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "skillId": 30020100,
      "triggerTrait": "Resonance",
      "condition": "目标处于易伤",
      "stepOrder": 1,
      "stepSkill": 30030100,
      "chance": 0.85,
      "remark": "星辉共鸣追加终结一击"
    },
    "31030000": {
      "familyCode": 31,
      "linkCode": 3,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "skillId": 30040100,
      "triggerTrait": "Instinct",
      "condition": "自身持有动量",
      "stepOrder": 1,
      "stepSkill": 30990100,
      "chance": 0.7,
      "remark": "Echo Barrage 触发穿透强击"
    }
  },
  "collisions": []
}

export const skillLinksTids: SkillLinksTID[] = raw.tids.map(toSkillLinksTID);
export const skillLinks: Record<SkillLinksTID, ISkillLinks> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toSkillLinksTID(tid), value as ISkillLinks])
);
