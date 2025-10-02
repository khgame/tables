export type CardinalDirection = 'n' | 'e' | 's' | 'w';
export type DiagonalDirection = 'ne' | 'se' | 'sw' | 'nw';
export type Direction = CardinalDirection | DiagonalDirection;

export const CARDINAL_DIRECTIONS: CardinalDirection[] = ['n', 'e', 's', 'w'];
export const DIAGONAL_DIRECTIONS: DiagonalDirection[] = ['ne', 'se', 'sw', 'nw'];
export const ALL_DIRECTIONS: Direction[] = [...CARDINAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];

export type TileRole = 'neutral' | 'road' | 'area' | 'decor';
export const TILE_ROLES: TileRole[] = ['neutral', 'road', 'area', 'decor'];

export type TileLayer = string;
export const TILE_LAYERS: TileLayer[] = ['ground', 'overlay', 'ceiling'];

export interface TileMeta {
  passable: boolean;
  passableFor: string[];
  layer: TileLayer;
  tags: string[];
}

export interface RoadTopology {
  connections: Record<CardinalDirection, boolean>;
  diagonals: Record<DiagonalDirection, boolean>;
}

export interface AreaTopology {
  center: string | null;
  edges: Partial<Record<CardinalDirection, string>>;
  corners: Partial<Record<DiagonalDirection, string>>;
}

export interface TileSlice {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  role: TileRole;
  groupId: string | null;
  meta: TileMeta;
  road?: RoadTopology;
  area?: AreaTopology;
}

export interface BoardState {
  cols: number;
  rows: number;
  cells: (string | null)[][];
}

export interface TilesetState {
  image: HTMLImageElement | null;
  imageUrl: string;
  imageUrlIsObject: boolean;
  tiles: TileSlice[];
  selectedIndex: number | null;
  hoverIndex: number | null;
  groups: Set<string>;
  board: BoardState;
}

export interface RegenerateOptions {
  tileWidth: number;
  tileHeight: number;
  margin: number;
  spacing: number;
  idPrefix: string;
  startIndex: number;
}

export interface TilesetMetaExport {
  source: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  margin: number;
  spacing: number;
  count: number;
  schemaVersion: number;
}

export interface RoadTopologyExport {
  connections: string;
  diagonals?: string;
}

export interface TilesetTileExport extends Omit<TileSlice, 'road' | 'area' | 'meta' | 'groupId'> {
  groupId?: string;
  meta?: Partial<TileMeta>;
  road?: RoadTopologyExport;
  area?: AreaTopology;
}

export interface TilesetExportData {
  meta: TilesetMetaExport;
  tiles: TilesetTileExport[];
  groups: string[];
}

export interface BoardExportData {
  cols: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  cells: (string | null)[][];
}

export interface TilesetImportData {
  meta?: Partial<TilesetMetaExport>;
  tiles?: Partial<TilesetTileExport>[];
  groups?: string[];
  board?: BoardExportData;
}

export interface BoardImportResult {
  missing: number;
  total: number;
  hasTiles: boolean;
}
