/** this file is auto generated */
import * as TableContext from "./context";
        
export interface IClasses {
  familyCode: number;
  classCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  classKey: "HeroClass";
  name: string;
  role: "HeroRole";
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  energyRegen: number;
  signatureTrait: "TraitType";
  gearSlots: string;
}

type ClassesTID = string & { readonly __ClassesTID: unique symbol };
const toClassesTID = (value: string): ClassesTID => value as ClassesTID;

const raw = {
  "tids": [
    "21010000",
    "21020000",
    "21030000",
    "21040000"
  ],
  "result": {
    "21010000": {
      "familyCode": 21,
      "classCode": 1,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "classKey": "Vanguard",
      "name": "先锋 - 炽焰守望者",
      "role": "Tank",
      "baseHp": 1150,
      "baseAtk": 90,
      "baseDef": 160,
      "baseSpd": 98,
      "energyRegen": 1.1,
      "signatureTrait": "Resolve",
      "gearSlots": "Weapon|Armor|Accessory"
    },
    "21020000": {
      "familyCode": 21,
      "classCode": 2,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "classKey": "Mystic",
      "name": "咒术师 - 星文织者",
      "role": "Burst",
      "baseHp": 900,
      "baseAtk": 125,
      "baseDef": 95,
      "baseSpd": 104,
      "energyRegen": 1.4,
      "signatureTrait": "Resonance",
      "gearSlots": "Weapon|Accessory"
    },
    "21030000": {
      "familyCode": 21,
      "classCode": 3,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "classKey": "Gunner",
      "name": "神射手 - 轨道猎手",
      "role": "Specialist",
      "baseHp": 980,
      "baseAtk": 135,
      "baseDef": 90,
      "baseSpd": 110,
      "energyRegen": 1.2,
      "signatureTrait": "Instinct",
      "gearSlots": "Weapon|Armor|Accessory"
    },
    "21040000": {
      "familyCode": 21,
      "classCode": 4,
      "variantCode": 0,
      "subCode": 0,
      "sequence": 1,
      "classKey": "Warden",
      "name": "守望者 - 森野使徒",
      "role": "Support",
      "baseHp": 1020,
      "baseAtk": 105,
      "baseDef": 130,
      "baseSpd": 100,
      "energyRegen": 1.3,
      "signatureTrait": "Synergy",
      "gearSlots": "Weapon|Armor|Accessory"
    }
  },
  "collisions": []
}

export const classesTids: ClassesTID[] = raw.tids.map(toClassesTID);
export const classes: Record<ClassesTID, IClasses> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toClassesTID(tid), value as IClasses])
);
