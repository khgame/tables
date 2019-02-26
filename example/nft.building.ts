export interface INftBuilding{
  ctype: number;
  building: number;
  level: number;
  name: string;
  upgrage: {
    to: number;
    dependency: (number)[];
  };
  product: ({
      tid: number;
      num: number;
    })[];
  arr: number[];
  map: {key: string, val: number};
  nest: ((number)[])|(((boolean)[])[])[];

}