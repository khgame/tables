import { useCallback, useMemo, useState } from 'react';
import { GomokuBoardImpl } from './board';
import { buildCardDeck } from './deck';
import {
  BOARD_SIZE,
  DRAW_INTERVAL,
  INITIAL_HAND_SIZE,
  SKILL_UNLOCK_MOVE,
  COUNTER_WINDOW_MS,
  GamePhaseEnum,
  PlayerEnum,
  PLAYER_NAMES,
  getOpponent
} from './constants';
import { deepClone, generateId, parseEffectParams, parseTags } from './utils';
import {
  prepareCardEffect,
  resolveCardEffect,
  prepareCounterEffect,
  resolveCounterEffect,
  SkillEffect
} from '../skills/effects';
import { skillPerformanceManager } from './skillPerformance';
import type {
  GameStatus,
  RawCard,
  RawCharacter,
  Player,
  PendingAction,
  CounterWindow,
  TargetRequest,
  TargetSelection,
  CardDraftOption,
  BoardSnapshot
} from '../types';
import type { EffectContext, EffectHelpers } from '../skills/effects';

interface GameData {
  cards?: { result: Record<string, RawCard> };
  characters?: { result: Record<string, RawCharacter> };
}

interface UseGameEngineResult {
  gameState: GameStatus;
  startGame: (enableAI?: boolean) => void;
  placeStone: (row: number, col: number) => void;
  playCard: (index: number) => void;
  selectTarget: (selection: TargetSelection) => void;
  resolveCard: (countered?: boolean, counterCard?: RawCard | null) => void;
  cancelPending: () => void;
  selectDraftOption: (optionId: string) => void;
  advanceTurnIfBlocked: () => void;
}

export const useGameEngine = (data: GameData): UseGameEngineResult => {
  const [gameState, setGameState] = useState<GameStatus>(() => createInitialState());

  const context = useMemo<EffectContext>(() => buildDataContext(data), [data]);

  const startGame = useCallback(
    (enableAI = false) => {
      setGameState(() => createGameStartState(context, enableAI));
    },
    [context]
  );

  const placeStone = useCallback((row: number, col: number) => {
    setGameState(prev => applyStonePlacement(prev, row, col));
  }, []);

  const playCard = useCallback(
    (index: number) => {
      setGameState(prev => applyPlayCard(prev, index, context));
    },
    [context]
  );

  const selectTarget = useCallback(
    (selection: TargetSelection) => {
      setGameState(prev => applyTargetSelection(prev, selection, context));
    },
    [context]
  );

  const resolveCard = useCallback(
    (countered = false, counterCard: RawCard | null = null) => {
      setGameState(prev => applyResolveCard(prev, countered, counterCard, context));
    },
    [context]
  );

  const cancelPending = useCallback(() => {
    setGameState(prev => applyCancelPending(prev));
  }, []);

  const selectDraftOption = useCallback((optionId: string) => {
    setGameState(prev => applyDraftSelection(prev, optionId));
  }, []);

  const advanceTurnIfBlocked = useCallback(() => {
    setGameState(prev => applyAdvanceTurnIfBlocked(prev));
  }, []);

  return { gameState, startGame, placeStone, playCard, selectTarget, resolveCard, cancelPending, selectDraftOption, advanceTurnIfBlocked };
};

const createInitialState = (): GameStatus => ({
  phase: GamePhaseEnum.SETUP,
  board: new GomokuBoardImpl(BOARD_SIZE),
  currentPlayer: PlayerEnum.BLACK,
  turnCount: 0,
  aiTurnId: 0,
  moveCount: [0, 0],
  decks: [null, null],
  hands: [[], []],
  graveyards: [[], []],
  shichahai: [],
  characters: {
    0: null,
    1: null
  } as Record<Player, RawCharacter | null>,
  statuses: {
    freeze: [0, 0],
    skip: [0, 0],
    fusionLock: [0, 0],
    sealedCells: [null, null]
  },
  pendingAction: null,
  pendingCounter: null,
  targetRequest: null,
  counterWindow: null,
  logs: [],
  timeline: [],
  winner: null,
  aiEnabled: false,
  visuals: [],
  draft: null,
  mulligan: {
    stage: 'completed',
    current: null,
    resolved: [true, true],
    replaced: [false, false]
  }
});

const buildDataContext = (data: GameData): EffectContext => {
  const cardsResult = data.cards?.result ?? {};
  const charactersResult = data.characters?.result ?? {};

  const cardsByTid = new Map<string, RawCard>();
  Object.values(cardsResult).forEach(card => {
    const key = String(card._tid ?? card.tid);
    cardsByTid.set(key, card);
  });

  const charactersByTid = new Map<string, RawCharacter>();
  Object.values(charactersResult).forEach(character => {
    const key = String(character._tid ?? character.tid);
    charactersByTid.set(key, character);
  });

  return {
    cardsByTid,
    charactersByTid,
    allCards: Object.values(cardsResult)
  };
};

const createGameStartState = (context: EffectContext, enableAI: boolean): GameStatus => {
  const state = createInitialState();
  const deck0 = buildCardDeck(context.cardsByTid);
  const deck1 = buildCardDeck(context.cardsByTid);
  const hands: RawCard[][] = [[], []];

  state.phase = GamePhaseEnum.PLAYING;
  state.decks = [deck0, deck1];
  state.hands = hands;
  state.aiEnabled = enableAI;
  state.logs = [createLog(`对局开始！黑方将率先落子。${enableAI ? ' (AI 对战模式)' : ''}`, 'start')];
  state.timeline = [
    {
      id: generateId('turn'),
      turn: 0,
      player: null,
      board: state.board.toSnapshot(),
      shichahai: [],
      characters: { ...state.characters }
    }
  ];

  // Initial draw for both players (AI自动选, 玩家手动选)
  triggerCardDraft(state, PlayerEnum.WHITE, 'initial');
  triggerCardDraft(state, PlayerEnum.BLACK, 'initial');

  // 留作未来：初始调度（目前草案不启用 Mulligan 流程）

  return state;
};

const applyStonePlacement = (prev: GameStatus, row: number, col: number): GameStatus => {
  if (prev.phase !== GamePhaseEnum.PLAYING) return prev;
  if (prev.draft) return prev;
  if (prev.pendingAction || prev.pendingCounter || prev.targetRequest) return prev;

  const player = prev.currentPlayer;
  const opponent = getOpponent(player);
  const logs = [...prev.logs];
  const statuses = cloneStatuses(prev.statuses);

  if (statuses.freeze[player] > 0) {
    statuses.freeze[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因冻结效果跳过回合`, 'effect'));
    const skippedState: GameStatus = { ...prev, statuses, logs } as GameStatus;
    return beginTurnMut(skippedState, opponent);
  }
  if (statuses.skip[player] > 0) {
    statuses.skip[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因技能效果跳过回合`, 'effect'));
    const skippedState: GameStatus = { ...prev, statuses, logs } as GameStatus;
    return beginTurnMut(skippedState, opponent);
  }

  const sealedCell = statuses.sealedCells[player];
  if (sealedCell) {
    if (prev.turnCount >= sealedCell.expiresAtTurn) {
      statuses.sealedCells[player] = null;
    } else if (sealedCell.row === row && sealedCell.col === col) {
      logs.push(createLog('该位置暂时被风沙封禁，本回合无法在此落子', 'error'));
      return {
        ...prev,
        logs
      };
    }
  }

  if (prev.board.get(row, col) !== null) return prev;

  const board = prev.board.clone();
  if (!board.place(row, col, player)) return prev;

  const moveCount: [number, number] = [...prev.moveCount] as [number, number];
  moveCount[player]++;
  const timeline = [...prev.timeline, createTimelineEntry(board, prev, player, row, col)];
  logs.push(createLog(`${PLAYER_NAMES[player]} 落子`, 'move', { row, col }));

  const turnCount = prev.turnCount + 1;

  if (board.checkWin(player)) {
    logs.push(createLog(`${PLAYER_NAMES[player]} 获胜！`, 'win'));
    return {
      ...prev,
      board,
      moveCount,
      turnCount,
      timeline,
      logs,
      statuses,
      phase: GamePhaseEnum.GAME_OVER,
      winner: player
    };
  }

  const totalMoves = moveCount[0] + moveCount[1];
  const hands = cloneHands(prev.hands);

  // 回合结束时检查并清除当前玩家的封禁（如果已到期）
  const ownSealedCell = statuses.sealedCells[player];
  if (ownSealedCell && turnCount >= ownSealedCell.expiresAtTurn) {
    statuses.sealedCells[player] = null;
  }

  let nextState: GameStatus = {
    ...prev,
    board,
    moveCount,
    turnCount,
    hands,
    timeline,
    logs,
    statuses,
    currentPlayer: opponent
  };
  // 开启对手回合（统一处理冻结/跳过/抽牌/AI令牌）
  nextState = beginTurnMut(nextState, opponent);
  return nextState;
};

const applyPlayCard = (prev: GameStatus, index: number, context: EffectContext): GameStatus => {
  if (prev.phase !== GamePhaseEnum.PLAYING) return prev;
  if (prev.draft) return prev;
  if (prev.pendingAction || prev.targetRequest || prev.pendingCounter) return prev;

  const player = prev.currentPlayer;
  const hand = prev.hands[player] ?? [];
  const card = hand[index];
  if (!card) return prev;

  const timing = (card.timing ?? '').toLowerCase();
  const reactingAsResponder =
    prev.phase === GamePhaseEnum.COUNTER_WINDOW && prev.counterWindow?.responder === player;
  if (timing === 'reaction' && !reactingAsResponder) {
    return appendLog(prev, createLog('这张卡只能在反击窗口使用', 'error'));
  }

  if (prev.turnCount + 1 < SKILL_UNLOCK_MOVE) {
    return appendLog(prev, createLog(`第 ${SKILL_UNLOCK_MOVE} 步后才能使用技能！`, 'error'));
  }

  if (prev.statuses.freeze[player] > 0) {
    // 冻结期间仍允许反击卡（Reaction）在反击窗口内使用；其余技能禁止
    const timingLower = (card.timing ?? '').toLowerCase();
    const isReactionTiming = timingLower.includes('reaction');
    if (!isReactionTiming) {
      return appendLog(prev, createLog('被冻结无法使用技能！', 'error'));
    }
  }

  const tags = parseTags(card.tags);
  if (tags.has('Fusion') && prev.statuses.fusionLock[player] > prev.turnCount) {
    return appendLog(prev, createLog('刚召唤完成，本回合无法发动合体技', 'error'));
  }

  if (card.requiresCharacter) {
    const character = prev.characters[player];
    const required = String(card.requiresCharacter);
    if (!character || String(character._tid ?? character.tid) !== required) {
      return appendLog(prev, createLog(`需要 ${required} 在场才能发动`, 'error'));
    }
  }

  const hands = cloneHands(prev.hands);
  hands[player] = hand.filter((_, idx) => idx !== index);

  const logs = [...prev.logs, createLog(`${PLAYER_NAMES[player]} 使用 ${card.nameZh}`, 'card')];

  const pending: PendingAction = {
    id: generateId('effect'),
    card,
    player,
    effectId: card.effectId,
    params: parseEffectParams(card.effectParams),
    selection: null,
    metadata: {},
    status: 'pending'
  };

  const prepareResult = prepareCardEffect(prev, pending, context);
  if (prepareResult.logs) logs.push(...prepareResult.logs);
  if (prepareResult.metadata) {
    pending.metadata = { ...pending.metadata, ...prepareResult.metadata };
  }
  if (prepareResult.cancelled) {
    const graveyards = cloneGraveyards(prev.graveyards);
    graveyards[player].push(createGraveyardEntry(card, player, 'fizzled', prev.turnCount));
    return {
      ...prev,
      hands,
      graveyards,
      logs,
      pendingAction: null
    };
  }

  if (prepareResult.request) {
    const targetRequest: TargetRequest = {
      id: generateId('request'),
      source: 'card',
      actingPlayer: player,
      cardTid: card._tid ?? card.tid,
      ...prepareResult.request
    } as TargetRequest;
    pending.status = 'awaiting-target';
    // 标记为“非瞬发”（需要选择目标）
    pending.metadata = { ...(pending.metadata || {}), uiInstant: false, uiSource: 'prepare' };
    return {
      ...prev,
      hands,
      pendingAction: pending,
      targetRequest,
      logs,
      phase: GamePhaseEnum.CARD_TARGETING
    };
  }

  pending.status = 'ready';
  // 标记为“瞬发”（无需选择目标）
  pending.metadata = { ...(pending.metadata || {}), uiInstant: true, uiSource: 'prepare' };
  const counterWindow = createCounterWindow(player);

  return {
    ...prev,
    hands,
    pendingAction: pending,
    counterWindow,
    logs,
    phase: GamePhaseEnum.COUNTER_WINDOW
  };
};

const applyTargetSelection = (prev: GameStatus, selection: TargetSelection, context: EffectContext): GameStatus => {
  const request = prev.targetRequest;
  if (!request) return prev;
  const logs = [...prev.logs];

  if (request.source === 'card' && prev.pendingAction) {
    const pending: PendingAction = { ...prev.pendingAction, selection, status: 'ready' } as PendingAction;
    // 来自目标选择 -> 非瞬发
    pending.metadata = { ...(pending.metadata || {}), uiInstant: false, uiSource: 'targeting' };
    const counterWindow = createCounterWindow(prev.pendingAction.player);
    const pos = (selection && 'row' in selection && 'col' in selection && typeof selection.row === 'number' && typeof selection.col === 'number')
      ? ` (${selection.row}, ${selection.col})`
      : '';
    logs.push(createLog(`${PLAYER_NAMES[prev.pendingAction.player]} 选择了技能目标${pos}`, 'effect'));
    return {
      ...prev,
      pendingAction: pending,
      counterWindow,
      targetRequest: null,
      logs,
      phase: GamePhaseEnum.COUNTER_WINDOW
    };
  }

  if (request.source === 'counter' && prev.pendingCounter) {
    const nextState = cloneStateForEffect(prev);
    nextState.pendingCounter = { ...prev.pendingCounter, selection };
    nextState.targetRequest = null;
    const helpers = createEffectHelpers(nextState);
    resolveCounterEffect(nextState, nextState.pendingCounter, context, helpers);
    finalizeCounter(nextState, helpers);
    return nextState;
  }

  return prev;
};

const applyDraftSelection = (prev: GameStatus, optionId: string): GameStatus => {
  const draft = prev.draft;
  if (!draft) return prev;
  const deck = prev.decks[draft.player];
  if (!deck) return prev;

  const card = deck.take(optionId);
  if (!card) return prev;

  const hands = cloneHands(prev.hands);
  hands[draft.player] = [...hands[draft.player], card];
  const logs = [...prev.logs, createLog(`${PLAYER_NAMES[draft.player]} 选择了 ${card.nameZh}`, 'draw')];

  const nextState: GameStatus = {
    ...prev,
    hands,
    logs,
    draft: null
  };

  return nextState;
};

const applyResolveCard = (
  prev: GameStatus,
  countered: boolean,
  counterCard: RawCard | null,
  context: EffectContext
): GameStatus => {
  if (prev.phase !== GamePhaseEnum.COUNTER_WINDOW) return prev;
  const pending = prev.pendingAction;
  if (!pending) return prev;

  if (countered && counterCard) {
    const responder = getOpponent(pending.player);
    const hand = prev.hands[responder] ?? [];
    const index = hand.findIndex(item => matchCardTid(item, counterCard));
    if (index === -1) return prev;

    const hands = cloneHands(prev.hands);
    const logs = [...prev.logs, createLog(`${PLAYER_NAMES[responder]} 使用 ${counterCard.nameZh}`, 'counter')];

    const card = hand[index];
    hands[responder] = hand.filter((_, idx) => idx !== index);

    const pendingCounter: PendingAction = {
      id: generateId('counter'),
      card,
      player: responder,
      effectId: card.effectId,
      params: parseEffectParams(card.effectParams),
      selection: null,
      metadata: {},
      status: 'pending',
      targetAction: pending
    };

    const prepareResult = prepareCounterEffect(prev, pendingCounter, context);
    if (prepareResult.logs) logs.push(...prepareResult.logs);
    if (prepareResult.metadata) {
      pendingCounter.metadata = { ...pendingCounter.metadata, ...prepareResult.metadata };
    }

    if (prepareResult.request) {
      const targetRequest: TargetRequest = {
        id: generateId('request'),
        source: 'counter',
        actingPlayer: responder,
        cardTid: card._tid ?? card.tid,
        ...prepareResult.request
      } as TargetRequest;
      return {
        ...prev,
        hands,
        pendingCounter,
        targetRequest,
        logs,
        counterWindow: null,
        phase: GamePhaseEnum.CARD_TARGETING
      };
    }

    const nextState = cloneStateForEffect(prev);
    nextState.hands = hands;
    nextState.logs = logs;
    nextState.counterWindow = null;
    nextState.pendingCounter = pendingCounter;

    const helpers = createEffectHelpers(nextState);
    resolveCounterEffect(nextState, nextState.pendingCounter, context, helpers);
    finalizeCounter(nextState, helpers);
    return nextState;
  }

  const nextState = cloneStateForEffect(prev);
  const helpers = createEffectHelpers(nextState);
  resolveCardEffect(nextState, nextState.pendingAction, context, helpers);
  finalizeCardResolution(nextState, nextState.pendingAction, helpers);
  return nextState;
};

const applyCancelPending = (prev: GameStatus): GameStatus => {
  // 允许在反击窗口阶段取消自己的技能
  if (prev.phase !== GamePhaseEnum.COUNTER_WINDOW) return prev;
  if (!prev.pendingAction) return prev;
  const actor = prev.pendingAction.player;
  // 仅允许行动方取消自身技能
  if (actor !== prev.currentPlayer) return prev;

  const next = cloneStateForEffect(prev);
  const helpers = createEffectHelpers(next);

  // 将卡牌退回到手牌（不进入墓地，不消耗回合）
  const card = next.pendingAction!.card;
  const hands = cloneHands(next.hands);
  hands[actor] = [...(hands[actor] ?? []), card];
  next.hands = hands;

  helpers.log(`${PLAYER_NAMES[actor]} 取消了技能释放（卡牌已退回手牌）`, 'effect');

  next.pendingAction = null;
  next.pendingCounter = null;
  next.targetRequest = null;
  next.counterWindow = null;
  next.phase = GamePhaseEnum.PLAYING;
  return next;
};

// 仅用于 AI 自动推进：当当前行动方被冻结/跳过时，直接进入对手回合（不落子）
const applyAdvanceTurnIfBlocked = (prev: GameStatus): GameStatus => {
  if (prev.phase !== GamePhaseEnum.PLAYING) return prev;
  if (prev.draft || prev.pendingAction || prev.pendingCounter || prev.targetRequest) return prev;

  const player = prev.currentPlayer;
  const statuses = cloneStatuses(prev.statuses);
  const logs = [...prev.logs];
  let blocked = false;

  if (statuses.freeze[player] > 0) {
    statuses.freeze[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因冻结效果跳过回合`, 'effect'));
    blocked = true;
  } else if (statuses.skip[player] > 0) {
    statuses.skip[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因技能效果跳过回合`, 'effect'));
    blocked = true;
  }

  if (!blocked) return prev;
  const opponent = getOpponent(player);
  const skipped: GameStatus = { ...prev, statuses, logs } as GameStatus;
  return beginTurnMut(skipped, opponent);
};

const finalizeCounter = (state: GameStatus, helpers: EffectHelpers) => {
  if (!state.pendingCounter) return;
  const responder = state.pendingCounter.player;

  // 先显示攻击方的技能视觉效果（明确标记为 attacker）
  if (state.pendingAction) {
    const attacker = state.pendingAction.player;
    helpers.enqueueVisual({
      effectId: state.pendingAction.card.effectId,
      card: state.pendingAction.card,
      player: attacker,
      role: 'attacker' // 明确标记为攻击方
    });
  }

  // 再显示反击方的技能视觉效果（明确标记为 counter）
  helpers.enqueueVisual({
    effectId: state.pendingCounter.card.effectId,
    card: state.pendingCounter.card,
    player: responder,
    role: 'counter' // 明确标记为反击方
  });

  addCardToGraveyard(state, responder, state.pendingCounter.card, 'counter');
  helpers.log(`${PLAYER_NAMES[responder]} 的反击结算完成`, 'counter');
  if (state.pendingAction) {
    const owner = state.pendingAction.player;
    addCardToGraveyard(state, owner, state.pendingAction.card, 'countered');
  }
  state.pendingAction = null;
  state.pendingCounter = null;
  state.targetRequest = null;
  state.counterWindow = null;
  if (state.phase !== GamePhaseEnum.GAME_OVER) {
    state.phase = GamePhaseEnum.PLAYING;
  }
};

const finalizeCardResolution = (
  state: GameStatus,
  pending: PendingAction,
  helpers: EffectHelpers
) => {
  const player = pending.player;
  helpers.enqueueVisual({ effectId: pending.card.effectId, card: pending.card, player });
  addCardToGraveyard(state, player, pending.card, 'played');
  state.pendingAction = null;
  state.pendingCounter = null;
  state.targetRequest = null;
  state.counterWindow = null;
  if (state.phase !== GamePhaseEnum.GAME_OVER) {
    state.phase = GamePhaseEnum.PLAYING;
  }

  // 若技能效果消耗本回合落子（例如飞沙走石/棒球），自动结束该玩家回合
  const effectId = String(pending.effectId ?? '');
  if (effectId === SkillEffect.RemoveToShichahai) {
    const opponent = getOpponent(player);
    beginTurnMut(state, opponent);
  }
};

const addCardToGraveyard = (state: GameStatus, player: Player, card: RawCard, reason: string) => {
  const graveyards = cloneGraveyards(state.graveyards);
  graveyards[player].push(createGraveyardEntry(card, player, reason, state.turnCount));
  state.graveyards = graveyards;
};

const appendLog = (state: GameStatus, logEntry: { message: string; type: string; time: number }): GameStatus => ({
  ...state,
  logs: [...state.logs, logEntry]
});

const createLog = (message: string, type = 'info', position?: { row: number; col: number }) => ({
  message,
  type,
  time: Date.now(),
  ...(position && { position })
});

const createGraveyardEntry = (card: RawCard, player: Player, reason: string, turn: number) => ({
  id: generateId('grave'),
  cardTid: card._tid ?? card.tid,
  cardName: card.nameZh,
   cardType: card.type,
   rarity: card.rarity,
  player,
  reason,
  turn,
  timestamp: Date.now()
});

const createShichahaiEntry = (
  player: Player,
  card: RawCard,
  row: number,
  col: number,
  snapshot: { turn: number; board: BoardSnapshot }
) => ({
  id: generateId('sea'),
  owner: player,
  cardTid: card._tid ?? card.tid,
  cardName: card.nameZh ?? card.nameEn,
  cardType: card.type,
  row,
  col,
  turn: snapshot.turn,
  board: snapshot.board,
  timestamp: Date.now()
});

const createTimelineEntry = (
  board: GameStatus['board'],
  state: GameStatus,
  player: Player,
  row: number,
  col: number
) => ({
  id: generateId('turn'),
  turn: state.turnCount + 1,
  player,
  move: { row, col },
  board: board.toSnapshot(),
  shichahai: state.shichahai.map(entry => ({ ...entry })),
  characters: { ...state.characters }
});

const cloneHands = (hands: RawCard[][]): RawCard[][] => hands.map(hand => [...hand]);
const cloneGraveyards = (graveyards: GameStatus['graveyards']): GameStatus['graveyards'] =>
  graveyards.map(list => [...list]) as [any[], any[]];
const cloneStatuses = (statuses: GameStatus['statuses']): GameStatus['statuses'] => ({
  freeze: [...statuses.freeze] as [number, number],
  skip: [...statuses.skip] as [number, number],
  fusionLock: [...statuses.fusionLock] as [number, number],
  sealedCells: statuses.sealedCells.map(cell => (cell ? { ...cell } : null)) as [
    { row: number; col: number; expiresAtTurn: number } | null,
    { row: number; col: number; expiresAtTurn: number } | null
  ]
});

const cloneStateForEffect = (state: GameStatus): GameStatus => ({
  ...state,
  board: state.board.clone(),
  hands: cloneHands(state.hands),
  graveyards: cloneGraveyards(state.graveyards),
  shichahai: state.shichahai.map(entry => ({ ...entry })),
  characters: { ...state.characters },
  statuses: cloneStatuses(state.statuses),
  logs: [...state.logs],
  timeline: [...state.timeline],
  visuals: [...state.visuals],
  draft: state.draft
    ? {
        player: state.draft.player,
        source: state.draft.source,
        options: state.draft.options.map(option => ({
          id: option.id,
          card: deepClone(option.card),
          remaining: option.remaining
        }))
      }
    : null,
  targetRequest: null,
  counterWindow: null
});

const createCounterWindow = (player: Player): CounterWindow => ({
  id: generateId('window'),
  responder: getOpponent(player),
  startedAt: Date.now(),
  expiresAt: Date.now() + COUNTER_WINDOW_MS
});

const matchCardTid = (cardA: RawCard, cardB: RawCard): boolean => {
  const tidA = cardA?._tid ?? cardA?.tid;
  const tidB = cardB?._tid ?? cardB?.tid;
  return String(tidA) === String(tidB);
};

const createEffectHelpers = (state: GameStatus): EffectHelpers => ({
  log: (message: string, type = 'effect') => {
    state.logs.push(createLog(message, type));
  },
  addShichahai: (player: Player, card: RawCard, row: number, col: number, snapshot) => {
    const entry = createShichahaiEntry(player, card, row, col, snapshot);
    state.shichahai = [...state.shichahai, entry];
  },
  addTimelineEntry: entry => {
    state.timeline = [...state.timeline, entry];
  },
  setWinner: (player: Player) => {
    state.phase = GamePhaseEnum.GAME_OVER;
    state.winner = player;
  },
  updateStatuses: updater => {
    state.statuses = cloneStatuses(updater(state.statuses));
  },
  setCharacters: characters => {
    state.characters = { ...characters };
  },
  enqueueVisual: ({ effectId, card, player, role = 'normal', cell, owner }: { effectId?: string; card: RawCard; player: Player; role?: 'attacker' | 'counter' | 'normal'; cell?: {row:number;col:number}; owner?: Player }) => {
    const event = skillPerformanceManager.createVisualEvent(effectId ?? '', card, player, role, { cell, owner });
    state.visuals = [...state.visuals, event].slice(-10);
  }
});

type DraftSource = 'initial' | 'draw';

function triggerCardDraft(state: GameStatus, player: Player, source: DraftSource): void {
  const deck = state.decks[player];
  if (!deck) return;
  if (state.draft) return;
  if (deck.remaining() <= 0) {
    state.logs.push(createLog(`${PLAYER_NAMES[player]} 的牌堆已耗尽，无法抽牌`, 'draw'));
    return;
  }

  const options = deck.drawOptions(Math.min(3, deck.remaining()));
  if (options.length === 0) {
    state.logs.push(createLog(`${PLAYER_NAMES[player]} 的牌堆已耗尽，无法抽牌`, 'draw'));
    return;
  }

  const isAI = state.aiEnabled && player === PlayerEnum.WHITE;
  if (isAI) {
    const choice = chooseOptionForAI(options, state);
    const card = deck.take(choice.id);
    if (!card) return;
    const updatedHands = cloneHands(state.hands);
    updatedHands[player] = [...updatedHands[player], card];
    state.hands = updatedHands;
    state.logs.push(createLog(`${PLAYER_NAMES[player]} 补充了一张手牌`, 'draw'));
    return;
  }

  state.draft = {
    player,
    options,
    source
  };
  state.logs.push(createLog(`${PLAYER_NAMES[player]} 可以从 ${options.length} 张卡中选择`, 'draw'));
}

// 统一的回合启动入口：处理冻结/跳过、抽牌、AI回合令牌递增
function beginTurnMut(state: GameStatus, player: Player): GameStatus {
  const logs = [...state.logs];
  let statuses = cloneStatuses(state.statuses);
  let current = player;
  // 折返处理：如果当前方被冻结/跳过，则切换对手并继续判断
  while (true) {
    if (statuses.freeze[current] > 0) {
      statuses.freeze[current] -= 1;
      logs.push(createLog(`${PLAYER_NAMES[current]} 因冻结效果跳过回合`, 'effect'));
      current = getOpponent(current);
      continue;
    }
    if (statuses.skip[current] > 0) {
      statuses.skip[current] -= 1;
      logs.push(createLog(`${PLAYER_NAMES[current]} 因技能效果跳过回合`, 'effect'));
      current = getOpponent(current);
      continue;
    }
    break;
  }

  // 抽牌：在新回合开始时按总手数间隔发起抽牌
  const totalMoves = (state.moveCount[0] ?? 0) + (state.moveCount[1] ?? 0);
  if (totalMoves % DRAW_INTERVAL === 0) {
    triggerCardDraft(state, current, 'draw');
  }

  state.statuses = statuses;
  state.logs = logs;
  state.currentPlayer = current;
  state.aiTurnId = (state.aiTurnId ?? 0) + 1;
  return state;
}

function chooseOptionForAI(options: CardDraftOption[], state: GameStatus): CardDraftOption {
  if (options.length === 0) {
    throw new Error('No options available for AI draft');
  }
  // 规则3：若手中没有“解 力拔山兮”的牌（擒拿：counter-prevent-removal），优先选择该类解牌
  const hasPreventRemoval = (state.hands[PlayerEnum.WHITE] ?? []).some(c => (c.effectId === SkillEffect.CounterPreventRemoval));
  if (!hasPreventRemoval) {
    const pick = options.find(opt => (opt.card.effectId === SkillEffect.CounterPreventRemoval));
    if (pick) return pick;
  }
  // 其余情况随机
  const index = Math.floor(Math.random() * options.length);
  return options[index];
}
