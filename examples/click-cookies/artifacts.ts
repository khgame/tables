/** this file is auto generated */
import * as TableContext from "./context";

export type ArtifactsTID = TableContext.KHTableID;
export const toArtifactsTID = (value: string): ArtifactsTID => value as ArtifactsTID;

export interface IArtifacts {
  _tid: ArtifactsTID;
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  effectType: "ArtifactEffectType";
  effectValue: number;
  costPoints: number;
  desc: string;
  icon: string;
}

export type ArtifactsRaw = {
  tids: string[]
  result: Record<string, IArtifacts>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ArtifactsRepo {
  static fromRaw(data: ArtifactsRaw): ArtifactsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toArtifactsTID(tid), value as IArtifacts])) as Record<ArtifactsTID, IArtifacts>
    return new ArtifactsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ArtifactsTID, IArtifacts>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ArtifactsTID): IArtifacts {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ArtifactsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IArtifacts[] {
    return Object.values(this.records) as IArtifacts[]
  }

  entries(): Array<[ArtifactsTID, IArtifacts]> {
    return Object.entries(this.records).map(([tid, value]) => [toArtifactsTID(tid as string), value as IArtifacts])
  }
}

