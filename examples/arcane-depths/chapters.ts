/** this file is auto generated */
import * as TableContext from "./context";

export type ChaptersTID = TableContext.KHTableID;
export const toChaptersTID = (value: string): ChaptersTID => value as ChaptersTID;

export interface IChapters {
  _tid: ChaptersTID;
  familyCode: number;
  chapterCode: number;
  difficultyCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  tagline: string;
  summary: string;
  passiveEffect: string;
  startArcane: number;
  startCrystal: number;
  startProvision: number;
  bossEnemy: number;
  featureRooms: string;
  unlockFacility: number;
}

export type ChaptersRaw = {
  tids: string[]
  result: Record<string, IChapters>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ChaptersRepo {
  static fromRaw(data: ChaptersRaw): ChaptersRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toChaptersTID(tid), value as IChapters])) as Record<ChaptersTID, IChapters>
    return new ChaptersRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ChaptersTID, IChapters>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ChaptersTID): IChapters {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ChaptersRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IChapters[] {
    return Object.values(this.records) as IChapters[]
  }

  entries(): Array<[ChaptersTID, IChapters]> {
    return Object.entries(this.records).map(([tid, value]) => [toChaptersTID(tid as string), value as IChapters])
  }
}

