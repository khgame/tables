/** this file is auto generated */
import * as TableContext from "./context";
        
export type WavesTID = string & { readonly __WavesTID: unique symbol };

export interface IWaves {
  sector: number;
  category: number;
  serial: number;
  timestamp: number;
  duration: number;
  enemyId: number;
  count: number;
  spawnRadius: number;
  formation: string;
  notes: string;
}
