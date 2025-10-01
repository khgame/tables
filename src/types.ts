export type Cell = {
  t: string;
  v: any;
  w: string;
}

export type Marks = {
  row: number;
  col: string;
}

export type ConvertResult = {
  tids: string[];
  result: Record<string, any>;
  collisions?: Array<{ id: string; first: any; incoming: any }>;
  meta?: {
    idSegments: number[];
    markCols: string[];
  };
}

export type Table = {
  cols: string[];
  data: Record<string, Record<string, Cell> | any>;
  getValue: (table: Table, row: number | string, col: string) => any;
  rows?: number[];
  erows?: number[];
  colMap?: Record<string, number>;
  marks?: Marks;
  markCols?: string[];
  markLine?: Record<string, string>;
  descLine?: Record<string, string>;
  schema?: any;
  convert?: ConvertResult;
  __plain?: boolean;
  __expand?: boolean;
}

export type Context = any;

export type Plugin = (table: Table, context?: Context) => Table;

export type Serializer = {
  plugins?: Plugin[];
  file: (data: Table, fileName: string, imports: string, context?: Context) => string;
  contextDealer?: (context: Context) => string;
}
