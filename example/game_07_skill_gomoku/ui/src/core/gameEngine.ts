import { useCallback, useMemo, useState } from 'react';
import { GomokuBoardImpl } from './board';
import { CardDeckImpl } from './deck';
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
import { generateId, parseEffectParams, parseTags } from './utils';
import {
  prepareCardEffect,
  resolveCardEffect,
  prepareCounterEffect,
  resolveCounterEffect
} from '../skills/effects';
import type {
  GameStatus,
  RawCard,
  RawCharacter,
  Player,
  PendingAction,
  CounterWindow,
  TargetRequest,
  EffectContext,
  EffectHelpers
} from '../types';

interface GameData {
  cards?: { result: Record<string, RawCard> };
  characters?: { result: Record<string, RawCharacter> };
}

interface UseGameEngineResult {
  gameState: GameStatus;
  startGame: (enableAI?: boolean) => void;
  completeMulligan: (decision: { replace: boolean }) => void;
  placeStone: (row: number, col: number) => void;
  playCard: (index: number) => void;
  selectTarget: (selection: any) => void;
  resolveCard: (countered?: boolean, counterCard?: RawCard | null) => void;
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

  const completeMulligan = useCallback((decision: { replace: boolean }) => {
    setGameState(prev => applyMulliganDecision(prev, decision));
  }, []);

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
    (selection: any) => {
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

  return { gameState, startGame, completeMulligan, placeStone, playCard, selectTarget, resolveCard };
};

const createInitialState = (): GameStatus => ({
  phase: GamePhaseEnum.SETUP,
  board: new GomokuBoardImpl(BOARD_SIZE),
  currentPlayer: PlayerEnum.BLACK,
  turnCount: 0,
  moveCount: [0, 0],
  decks: [null, null],
  hands: [[], []],
  graveyards: [[], []],
  shichahai: [],
  characters: {
    [PlayerEnum.BLACK]: null,
    [PlayerEnum.WHITE]: null
  },
  statuses: {
    freeze: [0, 0],
    skip: [0, 0],
    fusionLock: [0, 0]
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
  mulligan: {
    stage: 'idle',
    current: null,
    resolved: [false, false],
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
  const deck0 = new CardDeckImpl(context.allCards);
  const deck1 = new CardDeckImpl(context.allCards);
  const hands: RawCard[][] = [deck0.draw(INITIAL_HAND_SIZE), deck1.draw(INITIAL_HAND_SIZE)];

  state.phase = GamePhaseEnum.MULLIGAN;
  state.decks = [deck0, deck1];
  state.hands = hands;
  state.aiEnabled = enableAI;
  state.mulligan = {
    stage: 'active',
    current: PlayerEnum.BLACK,
    resolved: [false, false],
    replaced: [false, false]
  };
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

  return state;
};

const applyMulliganDecision = (prev: GameStatus, decision: { replace: boolean }): GameStatus => {
  if (prev.phase !== GamePhaseEnum.MULLIGAN) return prev;
  const current = prev.mulligan.current;
  if (current === null || prev.mulligan.stage !== 'active') return prev;

  const replace = decision.replace;
  const hands = cloneHands(prev.hands);
  const graveyards = cloneGraveyards(prev.graveyards);
  const logs = [...prev.logs];
  const resolved = [...prev.mulligan.resolved] as [boolean, boolean];
  const replaced = [...prev.mulligan.replaced] as [boolean, boolean];

  const hand = hands[current];
  if (replace && hand.length > 0) {
    const [card] = hand;
    graveyards[current].push(createGraveyardEntry(card, current, 'mulligan', prev.turnCount));
    const deck = prev.decks[current];
    const drawn = deck?.draw(1) ?? [];
    hands[current] = drawn.length > 0 ? drawn : [];
    logs.push(createLog(`${PLAYER_NAMES[current]} 更换初始手牌`, 'mulligan'));
    replaced[current] = true;
  } else {
    logs.push(createLog(`${PLAYER_NAMES[current]} 保留初始手牌`, 'mulligan'));
  }

  resolved[current] = true;
  let nextStage: GameStatus['mulligan']['stage'] = 'active';
  let nextCurrent: Player | null = null;
  let nextPhase = prev.phase;
  let nextCurrentPlayer = prev.currentPlayer;

  const other = getOpponent(current);
  if (!resolved[other]) {
    nextCurrent = other;
    if (prev.aiEnabled && other === PlayerEnum.WHITE) {
      nextCurrent = other;
    }
  } else {
    nextStage = 'completed';
    nextPhase = GamePhaseEnum.PLAYING;
    nextCurrentPlayer = PlayerEnum.BLACK;
    logs.push(createLog('黑方先手，开始落子', 'info'));
  }

  return {
    ...prev,
    phase: nextPhase,
    currentPlayer: nextCurrentPlayer,
    hands,
    graveyards,
    logs,
    mulligan: {
      stage: nextStage,
      current: nextCurrent,
      resolved,
      replaced
    }
  };
};

const applyStonePlacement = (prev: GameStatus, row: number, col: number): GameStatus => {
  if (prev.phase !== GamePhaseEnum.PLAYING) return prev;
  if (prev.pendingAction || prev.pendingCounter || prev.targetRequest) return prev;

  const player = prev.currentPlayer;
  const opponent = getOpponent(player);
  const logs = [...prev.logs];
  const statuses = cloneStatuses(prev.statuses);

  if (statuses.freeze[player] > 0) {
    statuses.freeze[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因冻结效果跳过回合`, 'effect'));
    return {
      ...prev,
      currentPlayer: opponent,
      statuses,
      logs
    };
  }
  if (statuses.skip[player] > 0) {
    statuses.skip[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因技能效果跳过回合`, 'effect'));
    return {
      ...prev,
      currentPlayer: opponent,
      statuses,
      logs
    };
  }

  if (prev.board.get(row, col) !== null) return prev;

  const board = prev.board.clone();
  if (!board.place(row, col, player)) return prev;

  const moveCount: [number, number] = [...prev.moveCount] as [number, number];
  moveCount[player]++;
  const timeline = [...prev.timeline, createTimelineEntry(board, prev, player, row, col)];
  logs.push(createLog(`${PLAYER_NAMES[player]} 落子 (${row}, ${col})`, 'move'));

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
  if (totalMoves % DRAW_INTERVAL === 0) {
    const deck = prev.decks[opponent];
    const drawn = deck?.draw(1) ?? [];
    if (drawn.length > 0) {
      hands[opponent] = [...hands[opponent], ...drawn];
      logs.push(createLog(`${PLAYER_NAMES[opponent]} 抽取 1 张卡牌`, 'draw'));
    }
  }

  return {
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
};

const applyPlayCard = (prev: GameStatus, index: number, context: EffectContext): GameStatus => {
  if (prev.phase !== GamePhaseEnum.PLAYING) return prev;
  if (prev.pendingAction || prev.targetRequest || prev.pendingCounter) return prev;

  const player = prev.currentPlayer;
  const hand = prev.hands[player] ?? [];
  const card = hand[index];
  if (!card) return prev;

  if (prev.turnCount + 1 < SKILL_UNLOCK_MOVE) {
    return appendLog(prev, createLog(`第 ${SKILL_UNLOCK_MOVE} 步后才能使用技能！`, 'error'));
  }

  if (prev.statuses.freeze[player] > 0) {
    return appendLog(prev, createLog('被冻结无法使用技能！', 'error'));
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
    prev.decks[player]?.discard(card);
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

const applyTargetSelection = (prev: GameStatus, selection: any, context: EffectContext): GameStatus => {
  const request = prev.targetRequest;
  if (!request) return prev;
  const logs = [...prev.logs];

  if (request.source === 'card' && prev.pendingAction) {
    const pending = { ...prev.pendingAction, selection, status: 'ready' as const };
    const counterWindow = createCounterWindow(prev.pendingAction.player);
    logs.push(createLog(`${PLAYER_NAMES[prev.pendingAction.player]} 选择了技能目标`, 'effect'));
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
    resolveCounterEffect(nextState, nextState.pendingCounter as any, context, helpers);
    finalizeCounter(nextState, helpers);
    return nextState;
  }

  return prev;
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
    const deck = prev.decks[responder];
    const logs = [...prev.logs, createLog(`${PLAYER_NAMES[responder]} 使用 ${counterCard.nameZh}`, 'counter')];

    const card = hand[index];
    hands[responder] = hand.filter((_, idx) => idx !== index);
    deck?.discard(card);

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
    } as any;

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
    nextState.pendingCounter = pendingCounter as any;

    const helpers = createEffectHelpers(nextState);
    resolveCounterEffect(nextState, nextState.pendingCounter as any, context, helpers);
    finalizeCounter(nextState, helpers);
    return nextState;
  }

  const nextState = cloneStateForEffect(prev);
  const helpers = createEffectHelpers(nextState);
  resolveCardEffect(nextState, nextState.pendingAction as any, context, helpers);
  finalizeCardResolution(nextState, nextState.pendingAction as any, helpers);
  return nextState;
};

const finalizeCounter = (state: GameStatus, helpers: EffectHelpers) => {
  if (!state.pendingCounter) return;
  const responder = state.pendingCounter.player;
  helpers.enqueueVisual({ effectId: state.pendingCounter.card.effectId, card: state.pendingCounter.card, player: responder });
  addCardToGraveyard(state, responder, state.pendingCounter.card, 'counter');
  helpers.log(`${PLAYER_NAMES[responder]} 的反击结算完成`, 'counter');
  if (state.pendingAction) {
    const owner = state.pendingAction.player;
    addCardToGraveyard(state, owner, state.pendingAction.card, 'countered');
    state.decks[owner]?.discard(state.pendingAction.card);
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
  state.decks[player]?.discard(pending.card);
  state.pendingAction = null;
  state.pendingCounter = null;
  state.targetRequest = null;
  state.counterWindow = null;
  if (state.phase !== GamePhaseEnum.GAME_OVER) {
    state.phase = GamePhaseEnum.PLAYING;
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

const createLog = (message: string, type = 'info') => ({
  message,
  type,
  time: Date.now()
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
  snapshot: { turn: number; board: any }
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
  fusionLock: [...statuses.fusionLock] as [number, number]
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
  enqueueVisual: ({ effectId, card, player }) => {
    const event = {
      id: generateId('visual'),
      effectId,
      cardName: card.nameZh,
      player,
      createdAt: Date.now()
    };
    state.visuals = [...state.visuals, event].slice(-10);
  }
});
