/** this file is auto generated */
import * as TableContext from "./context";

export type GlobalConfigTID = TableContext.KHTableID;
export const toGlobalConfigTID = (value: string): GlobalConfigTID => value as GlobalConfigTID;

export interface IGlobalConfig {
  _tid: GlobalConfigTID;
  categoryCode: number;
  sectionCode: number;
  sequenceCode: number;
  sequence: number;
  key: string;
  valueType: "GlobalValueType";
  value: any;
  description: string;
}

export type GlobalConfigRaw = {
  tids: string[]
  result: Record<string, IGlobalConfig>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class GlobalConfigRepo {
  static fromRaw(data: GlobalConfigRaw): GlobalConfigRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toGlobalConfigTID(tid), value as IGlobalConfig])) as Record<GlobalConfigTID, IGlobalConfig>
    return new GlobalConfigRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<GlobalConfigTID, IGlobalConfig>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: GlobalConfigTID): IGlobalConfig {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[GlobalConfigRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IGlobalConfig[] {
    return Object.values(this.records) as IGlobalConfig[]
  }

  entries(): Array<[GlobalConfigTID, IGlobalConfig]> {
    return Object.entries(this.records).map(([tid, value]) => [toGlobalConfigTID(tid as string), value as IGlobalConfig])
  }
}

