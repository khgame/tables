/** this file is auto generated */
import * as TableContext from "./context";
        
export type EnemiesTID = string & { readonly __EnemiesTID: unique symbol };

export interface IEnemies {
  categoryCode: number;
  subtypeCode: number;
  sequenceCode: number;
  sequence: number;
  name: string;
  element: "HeroElement";
  role: string;
  hp: number;
  attack: number;
  defense: number;
  skill: string;
  weakness: string;
  rewardExp: number;
  portrait: string;
}
