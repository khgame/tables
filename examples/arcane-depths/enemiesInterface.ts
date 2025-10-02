/** this file is auto generated */
import * as TableContext from "./context";
        
export type EnemiesTID = string & { readonly __EnemiesTID: unique symbol };

export interface IEnemies {
  familyCode: number;
  enemyFamily: number;
  subtypeCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  family: "EnemyFamily";
  rarity: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  resistance: number;
  lootTable: string;
  signatureSkill: number|undefined;
  behaviorProfile: string;
  bossPhaseCount: number|undefined;
}
