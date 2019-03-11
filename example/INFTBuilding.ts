export interface INftBuilding {
  ctype: number;
  building: number;
  level: number;
  name: string;
  upgrage: {
    to: number;
    dependency: number[];
  };
  product: Array<{
      tid: number;
      num: number;
    }>;
  cost: Array<{key: string, val: number}>;
  arr: number[];
  pair: {key: string, val: number};
  map: Array<{key: string, val: any}>;
  nest: Array<number[]|boolean[][]>;
  stars: Array<number|boolean|{key: string, val: number}>;
  nestedArray: Array<{data: number}|({data: number}|undefined)>;
  ax: number|string;
}
