/** this file is auto generated */
import * as TableContext from "./context";
        
export type ChaptersTID = string & { readonly __ChaptersTID: unique symbol };

export interface IChapters {
  familyCode: number;
  chapterCode: number;
  difficultyCode: number;
  variantCode: number;
  sequence: number;
  name: string;
  tagline: string;
  summary: string;
  passiveEffect: string;
  startArcane: number;
  startCrystal: number;
  startProvision: number;
  bossEnemy: number;
  featureRooms: string;
  unlockFacility: number;
}
