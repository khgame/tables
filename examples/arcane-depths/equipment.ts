/** this file is auto generated */
import * as TableContext from "./context";

export type EquipmentTID = TableContext.KHTableID;
export const toEquipmentTID = (value: string): EquipmentTID => value as EquipmentTID;

export interface IEquipment {
  _tid: EquipmentTID;
  familyCode: number;
  itemCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  name: string;
  slot: "EquipmentSlot";
  rarity: number;
  craftCost: number;
  craftResource: "ResourceType";
  upgradeLevel: number;
  upgradeBonus: string;
  linkedRelic: number|undefined;
}

export type EquipmentRaw = {
  tids: string[]
  result: Record<string, IEquipment>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class EquipmentRepo {
  static fromRaw(data: EquipmentRaw): EquipmentRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toEquipmentTID(tid), value as IEquipment])) as Record<EquipmentTID, IEquipment>
    return new EquipmentRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<EquipmentTID, IEquipment>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: EquipmentTID): IEquipment {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[EquipmentRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IEquipment[] {
    return Object.values(this.records) as IEquipment[]
  }

  entries(): Array<[EquipmentTID, IEquipment]> {
    return Object.entries(this.records).map(([tid, value]) => [toEquipmentTID(tid as string), value as IEquipment])
  }
}

