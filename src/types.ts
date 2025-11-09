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
  indexes?: Record<string, Record<string, string | string[]>>;
  aliases?: Record<string, {
    field: string;
    map: Record<string, string>;
  }>;
  meta?: {
    idSegments: number[];
    markCols: string[];
    indexes?: Record<string, {
      path: string[];
      mode: 'unique' | 'multi';
      collisions?: Array<{ key: string; tids: string[] }>;
      skipped?: string;
    }>;
    alias?: {
      field: string;
      column: string;
      values: string[];
    };
  };
}

export type ValidationLocation = {
  sheetName?: string;
  row?: number;
  column?: string;
  fieldPath?: string;
}

export type ValidationErrorContext = {
  location?: ValidationLocation;
  details?: Record<string, unknown>;
}

export type ValidationMessage = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  location?: ValidationLocation;
  diagnosticPath?: string;
  details?: Record<string, unknown>;
}

export type Table = {
  cols: string[];
  data: Record<string, Record<string, Cell> | any>;
  getValue: (table: Table, row: number | string, col: string) => any;
  sheetName?: string;
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
