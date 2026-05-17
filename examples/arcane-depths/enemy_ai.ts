/** this file is auto generated */
import * as TableContext from "./context";

export type EnemyAiTID = TableContext.KHTableID;
export const toEnemyAiTID = (value: string): EnemyAiTID => value as EnemyAiTID;

export interface IEnemyAi {
  _tid: EnemyAiTID;
  familyCode: number;
  enemyCode: number;
  behaviorCode: number;
  variantCode: number;
  sequence: number;
  enemyId: number;
  priority: number;
  condition: "BehaviorCondition";
  action: "BehaviorAction";
  param: string|undefined;
  cooldown: number|undefined;
}

export type EnemyAiRaw = {
  tids: string[]
  result: Record<string, IEnemyAi>
  indexes?: Record<string, Record<string, string | string[]>>
}

export class EnemyAiRepo {
  static fromRaw(data: EnemyAiRaw): EnemyAiRepo {
    const entries = Object.entries(data.result || {})
    const records = Object.fromEntries(entries.map(([tid, value]) => [toEnemyAiTID(tid), value as IEnemyAi])) as Record<EnemyAiTID, IEnemyAi>
    return new EnemyAiRepo(records, data.indexes ?? {})
  }

  constructor(
    private readonly records: Record<EnemyAiTID, IEnemyAi>,
    private readonly indexes: Record<string, Record<string, string | string[]>> = {}
  ) {}

  get(tid: EnemyAiTID): IEnemyAi {
    const hit = this.records[tid]
    if (!hit) {
      throw new Error(`[EnemyAiRepo] tid ${tid} not found`)
    }
    return hit
  }

  values(): IEnemyAi[] {
    return Object.values(this.records) as IEnemyAi[]
  }

  entries(): Array<[EnemyAiTID, IEnemyAi]> {
    return Object.entries(this.records).map(([tid, value]) => [toEnemyAiTID(tid as string), value as IEnemyAi])
  }
}

