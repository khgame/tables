/** this file is auto generated */
import * as TableContext from "./context";
        
export type EnemyAiTID = string & { readonly __EnemyAiTID: unique symbol };

export interface IEnemyAi {
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
