/** this file is auto generated */
import * as TableContext from "./context";
        
export type StagesTID = string & { readonly __StagesTID: unique symbol };

export interface IStages {
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
