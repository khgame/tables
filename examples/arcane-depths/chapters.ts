/** this file is auto generated */
import * as TableContext from "./context";
        
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

type ChaptersTID = string & { readonly __ChaptersTID: unique symbol };
const toChaptersTID = (value: string): ChaptersTID => value as ChaptersTID;

const raw = {
  "tids": [
    "10010100",
    "10020100",
    "10030100"
  ],
  "result": {
    "10010100": {
      "familyCode": 10,
      "chapterCode": 1,
      "difficultyCode": 1,
      "variantCode": 0,
      "sequence": 1,
      "name": "余烬裂隙（Ember Rift）",
      "tagline": "熔心锋芒",
      "summary": "坠入熔岩裂谷，净化觉醒的余烬巨灵。",
      "passiveEffect": "战斗开始时全体获得1点技能能量。",
      "startArcane": 6,
      "startCrystal": 25,
      "startProvision": 40,
      "bossEnemy": 40010300,
      "featureRooms": "Combat|Event|Merchant",
      "unlockFacility": 70010100
    },
    "10020100": {
      "familyCode": 10,
      "chapterCode": 2,
      "difficultyCode": 1,
      "variantCode": 0,
      "sequence": 1,
      "name": "蔓生穹顶（Verdant Spire）",
      "tagline": "翠潮回响",
      "summary": "穿越失控的植物穹顶，解除深根巨树的束缚。",
      "passiveEffect": "每层结束额外获得5点Arcane。",
      "startArcane": 4,
      "startCrystal": 18,
      "startProvision": 55,
      "bossEnemy": 40020300,
      "featureRooms": "Combat|Event|Rest",
      "unlockFacility": 70020100
    },
    "10030100": {
      "familyCode": 10,
      "chapterCode": 3,
      "difficultyCode": 1,
      "variantCode": 0,
      "sequence": 1,
      "name": "星界熔炉（Astral Crucible）",
      "tagline": "星辉洪流",
      "summary": "深入星火熔炉，阻止星界熔铸的异界兵团。",
      "passiveEffect": "极限技能冷却缩短1回合。",
      "startArcane": 5,
      "startCrystal": 30,
      "startProvision": 35,
      "bossEnemy": 40030300,
      "featureRooms": "Combat|Elite|Boss",
      "unlockFacility": 70030100
    }
  },
  "collisions": []
}

export const chaptersTids: ChaptersTID[] = raw.tids.map(toChaptersTID);
export const chapters: Record<ChaptersTID, IChapters> = Object.fromEntries(
  Object.entries(raw.result).map(([tid, value]) => [toChaptersTID(tid), value as IChapters])
);
