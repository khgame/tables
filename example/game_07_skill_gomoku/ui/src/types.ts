export type Player = 0 | 1;

export interface RawCard {
  _tid?: string;
  tid?: number;
  nameZh: string;
  nameEn?: string;
  type: string;
  subtype?: string;
  rarity: string;
  cost?: number;
  timing: string;
  effect: string;
  effectId?: string;
  effectParams?: string;
  counteredBy?: string;
  requiresCharacter?: string | number;
  requiresCards?: string;
  tags?: string;
  quote?: string;
  artwork?: string;
}

export interface RawCharacter {
  _tid?: string;
  tid?: number;
  name: string;
  entryEffect?: string;
  exitEffect?: string;
  enablesCards?: string;
  notes?: string;
  defeatCondition?: string;
  quote?: string;
  artwork?: string;
}

export interface ShichahaiEntry {
  id: string;
  owner: Player;
  cardTid?: string | number;
  cardName?: string;
  row: number;
  col: number;
  turn: number;
  board: BoardSnapshot;
  timestamp: number;
}

export interface GraveyardEntry {
  id: string;
  cardTid?: string | number;
  cardName: string;
  player: Player;
  reason: string;
  turn: number;
  timestamp: number;
}

export interface BoardSnapshot {
  size: number;
  grid: (Player | null)[][];
  history: Array<{ row: number; col: number; player: Player }>;
}

export interface GameLogEntry {
  message: string;
  type: string;
  time: number;
}

export interface PendingAction {
  id: string;
  card: RawCard;
  player: Player;
  effectId?: string;
  params: Record<string, string | number>;
  selection: any;
  metadata: Record<string, any>;
  status: 'pending' | 'awaiting-target' | 'ready';
  targetAction?: PendingAction;
}

export interface TargetRequest {
  id: string;
  type: 'cell' | 'snapshot';
  title: string;
  description?: string;
  player: Player;
  cells?: Array<{ row: number; col: number }>;
  origin?: { row: number; col: number };
  options?: Array<{ id: string; turn: number; player: Player | null; move?: { row: number; col: number } }>;
  source: 'card' | 'counter';
  actingPlayer: Player;
  cardTid?: string | number;
}

export interface CounterWindow {
  id: string;
  responder: Player;
  startedAt: number;
  expiresAt: number;
}

export interface GameStatus {
  phase: GamePhase;
  board: GomokuBoard;
  currentPlayer: Player;
  turnCount: number;
  moveCount: [number, number];
  decks: Array<CardDeck | null>;
  hands: RawCard[][];
  graveyards: [GraveyardEntry[], GraveyardEntry[]];
  shichahai: ShichahaiEntry[];
  characters: Record<Player, RawCharacter | null>;
  statuses: {
    freeze: [number, number];
    skip: [number, number];
    fusionLock: [number, number];
  };
  pendingAction: PendingAction | null;
  pendingCounter: PendingAction | null;
  targetRequest: TargetRequest | null;
  counterWindow: CounterWindow | null;
  logs: GameLogEntry[];
  timeline: Array<{ id: string; turn: number; player: Player | null; move?: { row: number; col: number }; board: BoardSnapshot; shichahai: ShichahaiEntry[]; characters: Record<Player, RawCharacter | null> }>;
  winner: Player | null;
  aiEnabled: boolean;
  mulligan: {
    stage: 'idle' | 'active' | 'completed';
    current: Player | null;
    resolved: [boolean, boolean];
    replaced: [boolean, boolean];
  };
}

// Forward declarations to avoid circular imports in type file
export interface GomokuBoard {
  size: number;
  history: Array<{ row: number; col: number; player: Player }>;
  clone(): GomokuBoard;
  toSnapshot(): BoardSnapshot;
  restore(snapshot: BoardSnapshot): void;
  get(row: number, col: number): Player | null;
  place(row: number, col: number, player: Player): boolean;
  remove(row: number, col: number): Player | null;
  forEachCell(cb: (row: number, col: number, value: Player | null) => void): void;
  checkWin(player: Player): boolean;
}

export interface CardDeck {
  draw(count?: number): RawCard[];
  discard(card: RawCard): void;
}

export type GamePhase = 'setup' | 'mulligan' | 'playing' | 'card_targeting' | 'counter_window' | 'game_over';
