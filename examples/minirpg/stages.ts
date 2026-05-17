/** this file is auto generated */
import * as TableContext from "./context";

export type StagesTID = TableContext.KHTableID;
export const toStagesTID = (value: string): StagesTID => value as StagesTID;

export interface IStages {
  _tid: StagesTID;
  categoryCode: number;
  routeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  stageType: "StageSubtype";
  environment: "StageEnvironment";
  requiredPower: number;
  recommendedLevel: number;
  duration: number;
  bossSkill: number;
  bossEnemy: number;
  unlockHero: number;
  rewardItem1: number;
  rewardQty1: number;
  rewardItem2: number;
  rewardQty2: number;
  rewardItem3: number;
  rewardQty3: number;
  firstClearSkill: number;
  prerequisiteStage: number;
  backdrop: string;
  narrative: string;
}

export type StagesRaw = {
  tids: string[]
  result: Record<string, IStages>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class StagesRepo {
  static fromRaw(data: StagesRaw): StagesRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toStagesTID(tid), value as IStages])) as Record<StagesTID, IStages>
    return new StagesRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<StagesTID, IStages>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: StagesTID): IStages {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[StagesRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IStages[] {
    return Object.values(this.records) as IStages[]
  }

  entries(): Array<[StagesTID, IStages]> {
    return Object.entries(this.records).map(([tid, value]) => [toStagesTID(tid as string), value as IStages])
  }
}

