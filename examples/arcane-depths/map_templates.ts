/** this file is auto generated */
import * as TableContext from "./context";

export type MapTemplatesTID = TableContext.KHTableID;
export const toMapTemplatesTID = (value: string): MapTemplatesTID => value as MapTemplatesTID;

export interface IMapTemplates {
  _tid: MapTemplatesTID;
  familyCode: number;
  chapterCode: number;
  layerCode: number;
  nodeCode: number;
  order: number;
  chapterId: number;
  layer: number;
  roomType: "RoomType";
  rewardHint: string|undefined;
  edgeLeft: number|undefined;
  edgeRight: number|undefined;
  weightMod: number|undefined;
  specialRule: string|undefined;
}

export type MapTemplatesRaw = {
  tids: string[]
  result: Record<string, IMapTemplates>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class MapTemplatesRepo {
  static fromRaw(data: MapTemplatesRaw): MapTemplatesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toMapTemplatesTID(tid), value as IMapTemplates])) as Record<MapTemplatesTID, IMapTemplates>
    return new MapTemplatesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<MapTemplatesTID, IMapTemplates>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: MapTemplatesTID): IMapTemplates {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[MapTemplatesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IMapTemplates[] {
    return Object.values(this.records) as IMapTemplates[]
  }

  entries(): Array<[MapTemplatesTID, IMapTemplates]> {
    return Object.entries(this.records).map(([tid, value]) => [toMapTemplatesTID(tid as string), value as IMapTemplates])
  }
}

