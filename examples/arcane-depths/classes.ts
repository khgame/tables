/** this file is auto generated */
import * as TableContext from "./context";

export type ClassesTID = TableContext.KHTableID;
export const toClassesTID = (value: string): ClassesTID => value as ClassesTID;

export interface IClasses {
  _tid: ClassesTID;
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

export type ClassesRaw = {
  tids: string[]
  result: Record<string, IClasses>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ClassesRepo {
  static fromRaw(data: ClassesRaw): ClassesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toClassesTID(tid), value as IClasses])) as Record<ClassesTID, IClasses>
    return new ClassesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ClassesTID, IClasses>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ClassesTID): IClasses {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ClassesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IClasses[] {
    return Object.values(this.records) as IClasses[]
  }

  entries(): Array<[ClassesTID, IClasses]> {
    return Object.entries(this.records).map(([tid, value]) => [toClassesTID(tid as string), value as IClasses])
  }
}

