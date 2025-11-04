/** this file is auto generated */
import * as TableContext from "./context";

export type EventsTID = TableContext.KHTableID;
export const toEventsTID = (value: string): EventsTID => value as EventsTID;

export interface IEvents {
  _tid: EventsTID;
  tid: number;
  key: string;
  label: string;
  description: string;
  trigger: {
    resource: string|undefined;
    building: number|undefined;
    event: number|undefined;
    villagers: number|undefined;
    min: number|undefined;
    max: number|undefined;
    supplies: number|undefined;
  };
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
  cooldown: number;
  once: boolean;
  log: string;
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

