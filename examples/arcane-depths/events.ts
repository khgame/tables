/** this file is auto generated */
import * as TableContext from "./context";

export type EventsTID = TableContext.KHTableID;
export const toEventsTID = (value: string): EventsTID => value as EventsTID;

export interface IEvents {
  _tid: EventsTID;
  familyCode: number;
  eventCode: number;
  variantCode: number;
  subCode: number;
  sequence: number;
  chapterId: number|undefined;
  title: string;
  summary: string;
  option1Text: string;
  option1Requirement: "RequirementType"|undefined;
  option1RewardType: "RewardType"|undefined;
  option1RewardValue: string|undefined;
  option1PenaltyType: "PenaltyType"|undefined;
  option1PenaltyValue: string|undefined;
  option2Text: string|undefined;
  option2Requirement: "RequirementType"|undefined;
  option2RewardType: "RewardType"|undefined;
  option2RewardValue: string|undefined;
  option2PenaltyType: "PenaltyType"|undefined;
  option2PenaltyValue: string|undefined;
  followUp: number|undefined;
}

export type EventsRaw = {
  tids: string[]
  result: Record<string, IEvents>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class EventsRepo {
  static fromRaw(data: EventsRaw): EventsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toEventsTID(tid), value as IEvents])) as Record<EventsTID, IEvents>
    return new EventsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<EventsTID, IEvents>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: EventsTID): IEvents {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[EventsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IEvents[] {
    return Object.values(this.records) as IEvents[]
  }

  entries(): Array<[EventsTID, IEvents]> {
    return Object.entries(this.records).map(([tid, value]) => [toEventsTID(tid as string), value as IEvents])
  }
}

