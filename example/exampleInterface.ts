export interface IExample {
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
  nest: Array<Array<number>|boolean[][]>;
  stars: Array<number|boolean|{key: string, val: number}>;
  nestedArray: [
    {data: number},
    {data: number}|undefined,
    Array<number|{1: string}>
  ];
  ax: number|string;
}
