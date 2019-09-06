/** this file is auto generated */
import * from "./context"
        
export interface IHeroAdvance {
  system: number;
  id: number;
  star: number;
  str: number;
  agi: number;
  int: number;
  attr: Array<number>;
  type: HERO_TYPE|"temp";
}


const data = {
  "tids": [
    "10400100",
    "10400101",
    "10500101",
    "10600101"
  ],
  "result": {
    "10400100": {
      "system": 104,
      "id": 1,
      "star": 0,
      "str": 1,
      "agi": 1,
      "int": 1,
      "attr": [
        0,
        4,
        0,
        4,
        0,
        4
      ],
      "type": 1
    },
    "10400101": {
      "system": 104,
      "id": 1,
      "star": 1,
      "str": 2,
      "agi": 2,
      "int": 2,
      "attr": [
        2,
        6,
        2,
        6,
        2,
        6
      ],
      "type": 2
    },
    "10500101": {
      "system": 105,
      "id": 1,
      "star": 1,
      "str": 2,
      "agi": 2,
      "int": 2,
      "attr": [
        2,
        6,
        2,
        6,
        2
      ],
      "type": "three"
    },
    "10600101": {
      "system": 106,
      "id": 1,
      "star": 1,
      "str": 2,
      "agi": 2,
      "int": 2,
      "attr": [
        2,
        6,
        2,
        6,
        2
      ],
      "type": "temp"
    }
  }
}

export const heroAdvance: { [tid: string] : IHeroAdvance } = data.result ;
