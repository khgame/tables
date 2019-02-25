export interface Inft_building{
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
  arr: any // todo;
  map: any // todo;
  nest: ((number)[])|(((boolean)[])[])[];

}