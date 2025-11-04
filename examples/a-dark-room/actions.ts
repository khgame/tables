/** this file is auto generated */
import * as TableContext from "./context";

export type ActionsTID = TableContext.KHTableID;
export const toActionsTID = (value: string): ActionsTID => value as ActionsTID;

export interface IActions {
  _tid: ActionsTID;
  tid: number;
  key: string;
  label: string;
  description: string;
  cooldown: number;
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
  reward: {
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
  unlock: {
    building: number|undefined;
    resource: string|undefined;
    min: number|undefined;
    villagers: number|undefined;
    event: number|undefined;
  };
  logStart: string;
  logResult: string;
  offline: boolean;
}

export type ActionsRaw = {
  tids: string[]
  result: Record<string, IActions>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class ActionsRepo {
  static fromRaw(data: ActionsRaw): ActionsRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toActionsTID(tid), value as IActions])) as Record<ActionsTID, IActions>
    return new ActionsRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<ActionsTID, IActions>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: ActionsTID): IActions {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[ActionsRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IActions[] {
    return Object.values(this.records) as IActions[]
  }

  entries(): Array<[ActionsTID, IActions]> {
    return Object.entries(this.records).map(([tid, value]) => [toActionsTID(tid as string), value as IActions])
  }
}

