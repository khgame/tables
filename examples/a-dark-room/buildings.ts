/** this file is auto generated */
import * as TableContext from "./context";

export type BuildingsTID = TableContext.KHTableID;
export const toBuildingsTID = (value: string): BuildingsTID => value as BuildingsTID;

export interface IBuildings {
  _tid: BuildingsTID;
  tid: number;
  key: string;
  label: string;
  description: string;
  cost: {
    wood: number|undefined;
    fur: number|undefined;
    meat: number|undefined;
    leather: number|undefined;
    charcoal: number|undefined;
    iron: number|undefined;
    steel: number|undefined;
    warmth: number|undefined;
    supplies: number|undefined;
  };
  costScaling: number|undefined;
  effects: Array<{
      type: string|undefined;
      resource: string|undefined;
      amount: number|undefined;
      building: number|undefined;
      job: number|undefined;
      action: number|undefined;
      event: number|undefined;
      message: string|undefined;
    }>;
  unlock: {
    building: number|undefined;
    resource: string|undefined;
    min: number|undefined;
    max: number|undefined;
    villagers: number|undefined;
    event: number|undefined;
  };
  buildTime: number;
  repeatable: boolean;
  maxCount: number;
}

export type BuildingsRaw = {
  tids: string[]
  result: Record<string, IBuildings>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class BuildingsRepo {
  static fromRaw(data: BuildingsRaw): BuildingsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toBuildingsTID(tid), value as IBuildings])) as Record<BuildingsTID, IBuildings>
    return new BuildingsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<BuildingsTID, IBuildings>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: BuildingsTID): IBuildings {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[BuildingsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IBuildings[] {
    return Object.values(this.records) as IBuildings[]
  }

  entries(): Array<[BuildingsTID, IBuildings]> {
    return Object.entries(this.records).map(([tid, value]) => [toBuildingsTID(tid as string), value as IBuildings])
  }
}

