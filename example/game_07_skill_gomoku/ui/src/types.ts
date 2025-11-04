export type Player = 0 | 1;

export interface RawCard {
  _tid?: string;
  tid?: number;
  instanceId?: string;
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
  triggerCondition?: string;
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
  cardType?: string;
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
  cardType?: string;
  rarity?: string;
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
  position?: { row: number; col: number }; // 添加位置信息用于 hover 高亮
}

export interface TimelineEntry {
  id: string;
  turn: number;
  player: Player | null;
  move?: { row: number; col: number };
  board: BoardSnapshot;
  shichahai: ShichahaiEntry[];
  characters: Record<Player, RawCharacter | null>;
}

export interface VisualEffectEvent {
  id: string;
  effectId?: string;
  cardName: string;
  player: Player;
  createdAt: number;
  sequence?: number; // 序列号，用于确保相同时间戳的事件按正确顺序排列
  role?: 'attacker' | 'counter' | 'normal'; // 角色：攻击方、反击方或普通
  // 可选：用于棋盘定点动画（例如移除棋子飞入什刹海）
  cell?: { row: number; col: number };
  owner?: Player;
}

export type EffectMetadata = {
  uiInstant?: boolean;
  uiSource?: 'prepare' | 'targeting';
  preWinSnapshot?: PreWinSnapshot;
  original?: { row: number; col: number };
} & Record<string, unknown>;

export interface PreWinSnapshot {
  board: BoardSnapshot;
  shichahai: ShichahaiEntry[];
  timeline: TimelineEntry[];
  moveCount: [number, number];
  turnCount: number;
  currentPlayer: Player;
}

export interface PendingAction {
  id: string;
  card: RawCard;
  player: Player;
  effectId?: string;
  params: Record<string, string | number>;
  selection: TargetSelection | null;
  metadata: EffectMetadata;
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

// Selection payloads the UI/AI can pass back to the engine when fulfilling a TargetRequest
export type TargetSelection =
  | { row: number; col: number } // for type === 'cell'
  | { id: string }; // for type === 'snapshot'

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
  /**
   * AI 可行动回合的唯一令牌（每次轮转/开始可行动的回合时递增）。
   * 供调度/防重用，比仅看 turnCount/历史长度更鲁棒。
   */
  aiTurnId: number;
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
    sealedCells: [
      { row: number; col: number; expiresAtTurn: number } | null,
      { row: number; col: number; expiresAtTurn: number } | null
    ];
  };
  pendingAction: PendingAction | null;
  pendingCounter: PendingAction | null;
  targetRequest: TargetRequest | null;
  counterWindow: CounterWindow | null;
  logs: GameLogEntry[];
  timeline: TimelineEntry[];
  // prefer using TimelineEntry from now on; keep above for back-compat in code until refactor finishes
  winner: Player | null;
  aiEnabled: boolean;
  visuals: VisualEffectEvent[];
  draft: DraftState | null;
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
  remaining(): number;
  drawOptions(count: number): CardDraftOption[];
  take(optionId: string): RawCard | null;
}

export type GamePhase = 'setup' | 'mulligan' | 'playing' | 'card_targeting' | 'counter_window' | 'game_over';

export interface CardDraftOption {
  id: string;
  card: RawCard;
  remaining: number;
}

export interface DraftState {
  player: Player;
  options: CardDraftOption[];
  source: 'initial' | 'draw';
}
