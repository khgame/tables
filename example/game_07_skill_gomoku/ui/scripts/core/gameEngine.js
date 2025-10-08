import { useState, useCallback, useMemo } from '../utils/react.js';
import { GomokuBoard } from './board.js';
import { CardDeck } from './deck.js';
import {
  GamePhase,
  Player,
  PLAYER_NAMES,
  DRAW_INTERVAL,
  SKILL_UNLOCK_MOVE,
  INITIAL_HAND_SIZE,
  COUNTER_WINDOW_MS,
  getOpponent
} from './constants.js';
import { generateId, parseEffectParams } from './utils.js';
import {
  prepareCardEffect,
  resolveCardEffect,
  prepareCounterEffect,
  resolveCounterEffect
} from '../skills/effects.js';

export function useGameEngine(gameData) {
  const [gameState, setGameState] = useState(() => createInitialState());

  const dataContext = useMemo(() => buildDataContext(gameData), [gameData]);

  const startGame = useCallback(
    (enableAI = false) => {
      setGameState(() => createGameStartState(dataContext, enableAI));
    },
    [dataContext]
  );

  const completeMulligan = useCallback(
    decision => {
      setGameState(prev => applyMulliganDecision(prev, decision));
    },
    []
  );

  const placeStone = useCallback((row, col) => {
    setGameState(prev => applyStonePlacement(prev, row, col));
  }, []);

  const playCard = useCallback(
    cardIndex => {
      setGameState(prev => applyPlayCard(prev, cardIndex, dataContext));
    },
    [dataContext]
  );

  const selectTarget = useCallback(
    selection => {
      setGameState(prev => applyTargetSelection(prev, selection, dataContext));
    },
    [dataContext]
  );

  const resolveCard = useCallback(
    (countered = false, counterCard = null) => {
      setGameState(prev => applyResolveCard(prev, countered, counterCard, dataContext));
    },
    [dataContext]
  );

  return {
    gameState,
    startGame,
    completeMulligan,
    placeStone,
    playCard,
    selectTarget,
    resolveCard
  };
}

function createInitialState() {
  return {
    phase: GamePhase.SETUP,
    board: new GomokuBoard(),
    currentPlayer: Player.BLACK,
    turnCount: 0,
    moveCount: [0, 0],
    decks: [null, null],
    hands: [[], []],
    graveyards: [[], []],
    shichahai: [],
    characters: {
      [Player.BLACK]: null,
      [Player.WHITE]: null
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
    mulligan: {
      stage: 'idle',
      current: null,
      resolved: [false, false],
      replaced: [false, false]
    }
  };
}

function buildDataContext(gameData) {
  const cardsResult = (gameData && gameData.cards && gameData.cards.result) || {};
  const charactersResult = (gameData && gameData.characters && gameData.characters.result) || {};

  const cardsByTid = new Map();
  for (const value of Object.values(cardsResult)) {
    const key = String(value._tid || value.tid);
    cardsByTid.set(key, value);
  }

  const charactersByTid = new Map();
  for (const value of Object.values(charactersResult)) {
    const key = String(value._tid || value.tid);
    charactersByTid.set(key, value);
  }

  return {
    cardsByTid,
    charactersByTid,
    allCards: Object.values(cardsResult)
  };
}

function createGameStartState(dataContext, enableAI) {
  const state = createInitialState();
  const allCards = dataContext.allCards || [];
  const deck0 = new CardDeck(allCards);
  const deck1 = new CardDeck(allCards);
  const hands = [
    deck0.draw(INITIAL_HAND_SIZE),
    deck1.draw(INITIAL_HAND_SIZE)
  ];

  state.phase = GamePhase.MULLIGAN;
  state.decks = [deck0, deck1];
  state.hands = hands;
  state.aiEnabled = enableAI;
  state.mulligan = {
    stage: 'active',
    current: Player.BLACK,
    resolved: [false, false],
    replaced: [false, false]
  };
  state.logs = [
    createLog(
      `对局开始！黑方将率先落子。${enableAI ? ' (AI 对战模式)' : ''}`,
      'start'
    )
  ];
  state.timeline = [
    {
      id: generateId('turn'),
      turn: 0,
      player: null,
      board: state.board.toSnapshot(),
      shichahai: [],
      description: '对局开始'
    }
  ];
  return state;
}

function applyMulliganDecision(prevState, decision) {
  if (prevState.phase !== GamePhase.MULLIGAN) return prevState;
  const { mulligan } = prevState;
  const player = mulligan.current;
  if (player === null || mulligan.stage !== 'active') return prevState;

  const replace = Boolean(decision && decision.replace);
  const hands = cloneHands(prevState.hands);
  const graveyards = cloneGraveyards(prevState.graveyards);
  const logs = [...prevState.logs];
  const resolved = [...mulligan.resolved];
  const replaced = [...mulligan.replaced];

  const hand = hands[player];
  if (replace && hand.length > 0) {
    const [card] = hand;
    graveyards[player].push(createGraveyardEntry(card, player, 'mulligan', prevState.turnCount));
    const deck = prevState.decks[player];
    const drawn = deck.draw(1);
    hands[player] = drawn.length > 0 ? drawn : [];
    logs.push(createLog(`${PLAYER_NAMES[player]} 更换初始手牌`, 'mulligan'));
    replaced[player] = true;
  } else {
    logs.push(createLog(`${PLAYER_NAMES[player]} 保留初始手牌`, 'mulligan'));
  }

  resolved[player] = true;
  let nextStage = 'active';
  let nextCurrent = null;
  let nextPhase = prevState.phase;
  let nextCurrentPlayer = prevState.currentPlayer;

  const other = getOpponent(player);
  if (!resolved[other]) {
    nextCurrent = other;
  } else {
    nextStage = 'completed';
    nextPhase = GamePhase.PLAYING;
    nextCurrentPlayer = Player.BLACK;
    logs.push(createLog('黑方先手，开始落子', 'info'));
  }

  return {
    ...prevState,
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
}

function applyStonePlacement(prevState, row, col) {
  if (prevState.phase !== GamePhase.PLAYING) return prevState;
  if (prevState.pendingAction || prevState.pendingCounter || prevState.targetRequest) return prevState;

  const player = prevState.currentPlayer;
  const opponent = getOpponent(player);
  const logs = [...prevState.logs];

  // Handle turn locks (freeze/skip)
  const freeze = [...prevState.statuses.freeze];
  const skip = [...prevState.statuses.skip];
  if (freeze[player] > 0) {
    freeze[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因冻结效果跳过回合`, 'effect'));
    return {
      ...prevState,
      currentPlayer: opponent,
      statuses: {
        freeze,
        skip,
        fusionLock: [...prevState.statuses.fusionLock]
      },
      logs
    };
  }
  if (skip[player] > 0) {
    skip[player] -= 1;
    logs.push(createLog(`${PLAYER_NAMES[player]} 因技能效果跳过回合`, 'effect'));
    return {
      ...prevState,
      currentPlayer: opponent,
      statuses: {
        freeze,
        skip,
        fusionLock: [...prevState.statuses.fusionLock]
      },
      logs
    };
  }

  if (prevState.board.get(row, col) !== null) return prevState;

  const board = prevState.board.clone();
  board.place(row, col, player);

  const moveCount = [...prevState.moveCount];
  moveCount[player]++;

  const timeline = [...prevState.timeline, createTimelineEntry(board, prevState, player, row, col)];
  logs.push(createLog(`${PLAYER_NAMES[player]} 落子 (${row}, ${col})`, 'move'));

  const turnCount = prevState.turnCount + 1;

  if (board.checkWin(player)) {
    logs.push(createLog(`${PLAYER_NAMES[player]} 获胜！`, 'win'));
    return {
      ...prevState,
      board,
      moveCount,
      turnCount,
      timeline,
      logs,
      phase: GamePhase.GAME_OVER,
      winner: player
    };
  }

  const totalMoves = moveCount[0] + moveCount[1];
  const hands = cloneHands(prevState.hands);
  if (totalMoves % DRAW_INTERVAL === 0) {
    const deck = prevState.decks[opponent];
    const drawn = deck.draw(1);
    if (drawn.length > 0) {
      hands[opponent] = [...hands[opponent], ...drawn];
      logs.push(createLog(`${PLAYER_NAMES[opponent]} 抽取 1 张卡牌`, 'draw'));
    }
  }

  return {
    ...prevState,
    board,
    moveCount,
    turnCount,
    hands,
    timeline,
    logs,
    statuses: {
      freeze,
      skip,
      fusionLock: [...prevState.statuses.fusionLock]
    },
    currentPlayer: opponent
  };
}

function applyPlayCard(prevState, cardIndex, dataContext) {
  if (prevState.phase !== GamePhase.PLAYING) return prevState;
  if (prevState.pendingAction || prevState.targetRequest || prevState.pendingCounter) return prevState;

  const player = prevState.currentPlayer;
  const hand = prevState.hands[player] || [];
  const card = hand[cardIndex];
  if (!card) return prevState;

  if (prevState.turnCount + 1 < SKILL_UNLOCK_MOVE) {
    return appendLog(prevState, createLog('第 6 步后才能使用技能！', 'error'));
  }

  if (prevState.statuses.freeze[player] > 0) {
    return appendLog(prevState, createLog('被冻结无法使用技能！', 'error'));
  }

  const tags = parseTags(card.tags);
  if (tags.has('Fusion') && prevState.statuses.fusionLock[player] > prevState.turnCount) {
    return appendLog(prevState, createLog('刚召唤完成，本回合无法发动合体技', 'error'));
  }

  if (card.requiresCharacter) {
    const character = prevState.characters[player];
    const requiredTid = String(card.requiresCharacter);
    if (!character || String(character._tid || character.tid) !== requiredTid) {
      return appendLog(prevState, createLog(`需要 ${requiredTid} 在场才能发动`, 'error'));
    }
  }

  const hands = cloneHands(prevState.hands);
  hands[player] = hands[player].filter((_, idx) => idx !== cardIndex);

  const logs = [...prevState.logs, createLog(`${PLAYER_NAMES[player]} 使用 ${card.nameZh}`, 'card')];
  const pendingAction = {
    id: generateId('effect'),
    card,
    player,
    effectId: card.effectId,
    params: parseEffectParams(card.effectParams || ''),
    selection: null,
    metadata: {},
    status: 'pending'
  };

  const prepareResult = prepareCardEffect(prevState, pendingAction, dataContext);
  if (prepareResult && prepareResult.metadata) {
    pendingAction.metadata = { ...pendingAction.metadata, ...prepareResult.metadata };
  }
  if (prepareResult && prepareResult.logs) {
    logs.push(...prepareResult.logs);
  }
  if (prepareResult && prepareResult.metadata && prepareResult.metadata.cancelled) {
    const graveyards = cloneGraveyards(prevState.graveyards);
    graveyards[player].push(createGraveyardEntry(card, player, 'fizzled', prevState.turnCount));
    prevState.decks[player].discard(card);
    logs.push(createLog(`${card.nameZh} 未能找到目标`, 'effect'));
    return {
      ...prevState,
      hands,
      graveyards,
      logs,
      pendingAction: null,
      phase: GamePhase.PLAYING
    };
  }

  if (prepareResult && prepareResult.request) {
    const targetRequest = {
      ...prepareResult.request,
      id: generateId('request'),
      source: 'card',
      actingPlayer: player,
      cardTid: pendingAction.card._tid || pendingAction.card.tid
    };
    pendingAction.status = 'awaiting-target';
    return {
      ...prevState,
      hands,
      pendingAction,
      targetRequest,
      logs,
      phase: GamePhase.CARD_TARGETING
    };
  }

  pendingAction.status = 'ready';
  const counterWindow = createCounterWindow(player);

  return {
    ...prevState,
    hands,
    pendingAction,
    counterWindow,
    logs,
    phase: GamePhase.COUNTER_WINDOW
  };
}

function applyTargetSelection(prevState, selection, dataContext) {
  if (!prevState.targetRequest) return prevState;
  const request = prevState.targetRequest;
  const logs = [...prevState.logs];

  if (request.source === 'card') {
    const action = prevState.pendingAction;
    if (!action) return prevState;

    const pendingAction = { ...action, selection, status: 'ready' };
    const counterWindow = createCounterWindow(action.player);
    logs.push(createLog(`${PLAYER_NAMES[action.player]} 选择了技能目标`, 'effect'));

    return {
      ...prevState,
      pendingAction,
      counterWindow,
      targetRequest: null,
      logs,
      phase: GamePhase.COUNTER_WINDOW
    };
  }

  if (request.source === 'counter') {
    const pendingCounter = prevState.pendingCounter;
    if (!pendingCounter) return prevState;

    const nextState = cloneStateForEffect(prevState);
    nextState.pendingCounter = { ...pendingCounter, selection };
    nextState.targetRequest = null;

    const helpers = createEffectHelpers(nextState);
    resolveCounterEffect(nextState, nextState.pendingCounter, dataContext, helpers);

    finalizeCounter(nextState, helpers);
    return nextState;
  }

  return prevState;
}

function applyResolveCard(prevState, countered, counterCard, dataContext) {
  if (prevState.phase !== GamePhase.COUNTER_WINDOW) return prevState;
  const pendingAction = prevState.pendingAction;
  if (!pendingAction) return prevState;

  if (countered && counterCard) {
    const responder = getOpponent(pendingAction.player);
    const hand = prevState.hands[responder] || [];
    const index = hand.findIndex(item => matchCardTid(item, counterCard));
    if (index === -1) return prevState;

    const hands = cloneHands(prevState.hands);
    const deck = prevState.decks[responder];
    const logs = [...prevState.logs, createLog(`${PLAYER_NAMES[responder]} 使用 ${counterCard.nameZh}`, 'counter')];

    const card = hand[index];
    hands[responder] = hand.filter((_, idx) => idx !== index);
    deck.discard(card);

    const pendingCounter = {
      id: generateId('counter'),
      card,
      player: responder,
      effectId: card.effectId,
      params: parseEffectParams(card.effectParams || ''),
      selection: null,
      metadata: {},
      status: 'pending',
      targetAction: pendingAction
    };

    const prepareResult = prepareCounterEffect(prevState, pendingCounter, dataContext);
    if (prepareResult && prepareResult.metadata) {
      pendingCounter.metadata = { ...pendingCounter.metadata, ...prepareResult.metadata };
    }
    if (prepareResult && prepareResult.logs) {
      logs.push(...prepareResult.logs);
    }

    if (prepareResult && prepareResult.request) {
      const targetRequest = {
        ...prepareResult.request,
        id: generateId('request'),
        source: 'counter',
        actingPlayer: responder,
        cardTid: pendingCounter.card._tid || pendingCounter.card.tid
      };
      return {
        ...prevState,
        hands,
        pendingCounter,
        targetRequest,
        logs,
        counterWindow: null,
        phase: GamePhase.CARD_TARGETING
      };
    }

    const nextState = cloneStateForEffect(prevState);
    nextState.hands = hands;
    nextState.logs = logs;
    nextState.counterWindow = null;
    nextState.pendingCounter = pendingCounter;

    const helpers = createEffectHelpers(nextState);
    resolveCounterEffect(nextState, pendingCounter, dataContext, helpers);
    finalizeCounter(nextState, helpers);
    return nextState;
  }

  const nextState = cloneStateForEffect(prevState);
  const helpers = createEffectHelpers(nextState);

  resolveCardEffect(nextState, pendingAction, dataContext, helpers);

  finalizeCardResolution(nextState, pendingAction, helpers);
  return nextState;
}

function finalizeCounter(state, helpers) {
  const responder = state.pendingCounter.player;
  addCardToGraveyard(state, responder, state.pendingCounter.card, 'counter');
  helpers.log(`${PLAYER_NAMES[responder]} 的反击结算完成`, 'counter');
  if (state.pendingAction) {
    const owner = state.pendingAction.player;
    addCardToGraveyard(state, owner, state.pendingAction.card, 'countered');
    const deck = state.decks[owner];
    deck.discard(state.pendingAction.card);
  }
  state.pendingAction = null;
  state.pendingCounter = null;
  state.targetRequest = null;
  state.counterWindow = null;
  if (state.phase !== GamePhase.GAME_OVER) {
    state.phase = GamePhase.PLAYING;
  }
}

function finalizeCardResolution(state, pendingAction, helpers) {
  const player = pendingAction.player;
  addCardToGraveyard(state, player, pendingAction.card, 'played');
  const deck = state.decks[player];
  deck.discard(pendingAction.card);
  state.pendingAction = null;
  state.pendingCounter = null;
  state.targetRequest = null;
  state.counterWindow = null;
  if (state.phase !== GamePhase.GAME_OVER) {
    state.phase = GamePhase.PLAYING;
  }
}

function addCardToGraveyard(state, player, card, reason) {
  const graveyards = cloneGraveyards(state.graveyards);
  graveyards[player].push(createGraveyardEntry(card, player, reason, state.turnCount));
  state.graveyards = graveyards;
}

function appendLog(state, logEntry) {
  return {
    ...state,
    logs: [...state.logs, logEntry]
  };
}

function createLog(message, type = 'info') {
  return { message, type, time: Date.now() };
}

function createGraveyardEntry(card, player, reason, turnCount) {
  return {
    id: generateId('grave'),
    cardTid: card._tid || card.tid,
    cardName: card.nameZh,
    player,
    reason,
    turn: turnCount,
    timestamp: Date.now()
  };
}

function createShichahaiEntry(player, card, row, col, snapshot) {
  return {
    id: generateId('sea'),
    owner: player,
    cardTid: card._tid || card.tid,
    cardName: card.nameZh || card.nameEn,
    row,
    col,
    turn: snapshot.turn,
    board: snapshot.board,
    timestamp: Date.now()
  };
}

function createTimelineEntry(board, state, player, row, col) {
  return {
    id: generateId('turn'),
    turn: state.turnCount + 1,
    player,
    move: { row, col },
    board: board.toSnapshot(),
    shichahai: state.shichahai.map(entry => ({ ...entry })),
    characters: {
      [Player.BLACK]: state.characters[Player.BLACK],
      [Player.WHITE]: state.characters[Player.WHITE]
    }
  };
}

function cloneHands(hands) {
  return hands.map(hand => hand.slice());
}

function cloneGraveyards(graveyards) {
  return graveyards.map(list => list.slice());
}

function cloneStateForEffect(state) {
  return {
    ...state,
    board: state.board.clone(),
    hands: cloneHands(state.hands),
    graveyards: cloneGraveyards(state.graveyards),
    shichahai: state.shichahai.map(entry => ({ ...entry })),
    characters: { ...state.characters },
    statuses: {
      freeze: state.statuses.freeze.slice(),
      skip: state.statuses.skip.slice(),
      fusionLock: state.statuses.fusionLock.slice()
    },
    logs: state.logs.slice(),
    timeline: state.timeline.slice(),
    targetRequest: null,
    counterWindow: null
  };
}

function createCounterWindow(player) {
  const responder = getOpponent(player);
  return {
    id: generateId('window'),
    responder,
    startedAt: Date.now(),
    expiresAt: Date.now() + COUNTER_WINDOW_MS
  };
}

function matchCardTid(cardA, cardB) {
  const tidA = cardA && (cardA._tid || cardA.tid);
  const tidB = cardB && (cardB._tid || cardB.tid);
  return String(tidA) === String(tidB);
}

function parseTags(tagString) {
  const tags = new Set();
  if (!tagString) return tags;
  String(tagString)
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
    .forEach(tag => tags.add(tag));
  return tags;
}

function createEffectHelpers(state) {
  return {
    log: (message, type = 'effect') => {
      state.logs.push(createLog(message, type));
    },
    addShichahai: (player, card, row, col, snapshot) => {
      const entry = createShichahaiEntry(player, card, row, col, snapshot);
      state.shichahai = [...state.shichahai, entry];
    },
    addTimelineEntry: entry => {
      state.timeline = [...state.timeline, entry];
    },
    setWinner: player => {
      state.phase = GamePhase.GAME_OVER;
      state.winner = player;
    },
    updateStatuses: updater => {
      const next = updater(state.statuses);
      state.statuses = {
        freeze: next.freeze.slice(),
        skip: next.skip.slice(),
        fusionLock: next.fusionLock.slice()
      };
    },
    setCharacters: chars => {
      state.characters = { ...chars };
    }
  };
}
