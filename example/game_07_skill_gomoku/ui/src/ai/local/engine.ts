import { PlayerEnum } from '../../core/constants';
import type { GameStatus, Player } from '../../types';

const DIRECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

const SCORE = {
  WIN: 1_000_000,
  BLOCK_WIN: 900_000,
  OPEN_FOUR: 60_000,
  MULTI_FOUR: 20_000,
  CLOSED_FOUR: 12_000,
  DOUBLE_THREE: 14_000,
  OPEN_THREE: 4_000,
  CLOSED_THREE: 900,
  OPEN_TWO: 350,
  LINE_STRENGTH: 160,
  ADJ_FRIENDLY: 280,
  ADJ_OPPONENT: 90,
  CENTER_BASE: 1_200,
  CENTER_FALLOFF: 220
} as const;

const MAX_NEIGHBOR_DISTANCE = 2;

type SuggestionCategory =
  | 'win'
  | 'block-win'
  | 'open-four'
  | 'block-open-four'
  | 'double-threat'
  | 'block-double-three'
  | 'closed-four'
  | 'block-three'
  | 'build-three'
  | 'pressure';

interface ThreatSummary {
  five: boolean;
  openFours: number;
  closedFours: number;
  openThrees: number;
  closedThrees: number;
  openTwos: number;
  doubleThree: boolean;
  lineStrength: number;
  adjacencyFriendly: number;
  adjacencyOpponent: number;
  centerWeight: number;
  rawScore: number;
}

export interface LocalMoveSuggestion {
  row: number;
  col: number;
  score: number;
  attack: ThreatSummary;
  defense: ThreatSummary;
  category: SuggestionCategory;
  confidence: number;
  reason: string;
}

const CATEGORY_REASON: Record<SuggestionCategory, string> = {
  win: '本地引擎检测到立即成五机会',
  'block-win': '本地引擎检测到对手下一手即可成五，优先阻挡',
  'open-four': '本地引擎建议形成活四压制',
  'block-open-four': '本地引擎建议封锁黑方的活四威胁',
  'double-threat': '本地引擎构建双三/双线威胁以争取先手',
  'block-double-three': '本地引擎建议拆解黑方双三连击',
  'closed-four': '本地引擎建议制造冲四迫使应对',
  'block-three': '本地引擎建议限制黑方的活三发展',
  'build-three': '本地引擎建议铺垫活三，为后续攻势做准备',
  pressure: '本地引擎建议稳健落子保持盘面压力'
};

const CATEGORY_CONFIDENCE: Record<SuggestionCategory, number> = {
  win: 1,
  'block-win': 0.95,
  'open-four': 0.88,
  'block-open-four': 0.86,
  'double-threat': 0.84,
  'block-double-three': 0.82,
  'closed-four': 0.78,
  'block-three': 0.72,
  'build-three': 0.68,
  pressure: 0.6
};

interface DirectionalCounts {
  total: number;
  openEnds: number;
  forward: number;
  backward: number;
  forwardOpen: boolean;
  backwardOpen: boolean;
}

const opponentOf = (player: Player): Player =>
  player === PlayerEnum.WHITE ? PlayerEnum.BLACK : PlayerEnum.WHITE;

export const suggestLocalMove = (
  game: GameStatus,
  player: Player = PlayerEnum.WHITE
): LocalMoveSuggestion | null => {
  const startTime = performance.now();
  const board = game.board;
  const candidates = generateCandidateCells(board);
  if (candidates.length === 0) return null;

  let best: LocalMoveSuggestion | null = null;
  const center = Math.floor(board.size / 2);
  const sealed = game.statuses.sealedCells[player];
  const sealedActive = sealed && game.turnCount < sealed.expiresAtTurn ? sealed : null;

  // 性能监控：记录候选点数量
  let evaluatedCells = 0;

  for (const cell of candidates) {
    if (sealedActive && cell.row === sealedActive.row && cell.col === sealedActive.col) {
      continue;
    }
    evaluatedCells++;
    const attack = analyzePlacement(board, cell.row, cell.col, player, center);
    const defense = analyzePlacement(board, cell.row, cell.col, opponentOf(player), center);

    const combinedScore = attack.rawScore + defense.rawScore * 0.92;
    const category = determineCategory(attack, defense);
    const confidence = CATEGORY_CONFIDENCE[category];
    const reason = buildReason(category, attack, defense, cell);
    const suggestion: LocalMoveSuggestion = {
      row: cell.row,
      col: cell.col,
      score: combinedScore,
      attack,
      defense,
      category,
      confidence,
      reason
    };

    if (!best) {
      best = suggestion;
      continue;
    }

    if (betterSuggestion(suggestion, best, center)) {
      best = suggestion;
    }
  }

  // 性能监控：记录评估时间和候选点数量
  const evaluationTime = performance.now() - startTime;
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.debug('[local_engine:performance]', {
      candidateCount: candidates.length,
      evaluatedCells,
      evaluationTime: `${evaluationTime.toFixed(2)}ms`,
      suggestion: best ? {
        row: best.row,
        col: best.col,
        confidence: best.confidence,
        category: best.category
      } : null
    });
  }

  return best;
};

export const formatLocalSuggestion = (suggestion: LocalMoveSuggestion): string => {
  const attackScore = Math.round(suggestion.attack.rawScore);
  const defenseScore = Math.round(suggestion.defense.rawScore);
  return `本地引擎建议落子 (${suggestion.row + 1}, ${suggestion.col + 1}) —— ${suggestion.reason}。攻势评分 ${attackScore}，防守评分 ${defenseScore}。`;
};

export const shouldAutoplaySuggestion = (suggestion: LocalMoveSuggestion): boolean => {
  if (!suggestion) return false;
  const forceCategories: SuggestionCategory[] = [
    'win',
    'block-win',
    'open-four',
    'block-open-four',
    'double-threat',
    'block-double-three'
  ];
  if (forceCategories.includes(suggestion.category)) return true;
  if (suggestion.attack.five || suggestion.defense.five) return true;
  if (suggestion.attack.openFours >= 1 && suggestion.defense.openFours >= 1) return true;
  return suggestion.confidence >= 0.82 && suggestion.score > 12_000;
};

const betterSuggestion = (
  current: LocalMoveSuggestion,
  best: LocalMoveSuggestion,
  center: number
): boolean => {
  if (current.score > best.score + 500) return true;
  if (Math.abs(current.score - best.score) <= 500) {
    if (current.confidence > best.confidence + 0.05) return true;
    if (Math.abs(current.confidence - best.confidence) <= 0.05) {
      const curDist = Math.max(Math.abs(current.row - center), Math.abs(current.col - center));
      const bestDist = Math.max(Math.abs(best.row - center), Math.abs(best.col - center));
      if (curDist < bestDist) return true;
    }
  }
  return false;
};

const generateCandidateCells = (board: GameStatus['board']): Array<{ row: number; col: number }> => {
  const occupied: Array<{ row: number; col: number }> = [];
  board.forEachCell((row, col, value) => {
    if (value !== null) {
      occupied.push({ row, col });
    }
  });

  if (occupied.length === 0) {
    const center = Math.floor(board.size / 2);
    return [{ row: center, col: center }];
  }

  const candidates = new Map<string, { row: number; col: number }>();

  occupied.forEach(cell => {
    for (let dr = -MAX_NEIGHBOR_DISTANCE; dr <= MAX_NEIGHBOR_DISTANCE; dr += 1) {
      for (let dc = -MAX_NEIGHBOR_DISTANCE; dc <= MAX_NEIGHBOR_DISTANCE; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const row = cell.row + dr;
        const col = cell.col + dc;
        if (!isInside(board, row, col)) continue;
        if (board.get(row, col) !== null) continue;
        const key = `${row}:${col}`;
        if (!candidates.has(key)) {
          candidates.set(key, { row, col });
        }
      }
    }
  });

  if (candidates.size === 0) {
    const fallback: Array<{ row: number; col: number }> = [];
    board.forEachCell((row, col, value) => {
      if (value === null) fallback.push({ row, col });
    });
    return fallback;
  }

  return Array.from(candidates.values());
};

const analyzePlacement = (
  board: GameStatus['board'],
  row: number,
  col: number,
  player: Player,
  center: number
): ThreatSummary => {
  const opponent = opponentOf(player);
  const summary: ThreatSummary = {
    five: false,
    openFours: 0,
    closedFours: 0,
    openThrees: 0,
    closedThrees: 0,
    openTwos: 0,
    doubleThree: false,
    lineStrength: 0,
    adjacencyFriendly: 0,
    adjacencyOpponent: 0,
    centerWeight: 0,
    rawScore: 0
  };

  let openThreeDirections = 0;

  for (const [dr, dc] of DIRECTIONS) {
    const counts = countInDirection(board, row, col, dr, dc, player, opponent);
    summary.lineStrength += counts.total * counts.total;
    if (counts.total >= 5) {
      summary.five = true;
    }
    if (counts.total === 4) {
      if (counts.openEnds === 2) {
        summary.openFours += 1;
      } else if (counts.openEnds === 1) {
        summary.closedFours += 1;
      }
    }
    if (counts.total === 3) {
      if (counts.openEnds === 2) {
        summary.openThrees += 1;
        openThreeDirections += 1;
      } else if (counts.openEnds === 1) {
        summary.closedThrees += 1;
      }
    }
    if (counts.total === 2 && counts.openEnds === 2) {
      summary.openTwos += 1;
    }
  }

  summary.doubleThree = openThreeDirections >= 2;

  const adjacency = countAdjacency(board, row, col, player, opponent);
  summary.adjacencyFriendly = adjacency.friendly;
  summary.adjacencyOpponent = adjacency.opponent;

  const centerDistance = Math.max(Math.abs(row - center), Math.abs(col - center));
  summary.centerWeight = Math.max(0, SCORE.CENTER_BASE - centerDistance * SCORE.CENTER_FALLOFF);

  let score = 0;
  if (summary.five) {
    score += SCORE.WIN;
  }
  if (summary.openFours > 0) {
    score += SCORE.OPEN_FOUR * summary.openFours;
    if (summary.openFours >= 2) {
      score += SCORE.MULTI_FOUR;
    }
  }
  if (summary.closedFours > 0) {
    score += SCORE.CLOSED_FOUR * summary.closedFours;
  }
  if (summary.doubleThree) {
    score += SCORE.DOUBLE_THREE;
  }
  if (summary.openThrees > 0) {
    score += SCORE.OPEN_THREE * summary.openThrees;
  }
  if (summary.closedThrees > 0) {
    score += SCORE.CLOSED_THREE * summary.closedThrees;
  }
  if (summary.openTwos > 0) {
    score += SCORE.OPEN_TWO * summary.openTwos;
  }
  score += summary.lineStrength * SCORE.LINE_STRENGTH;
  score += summary.adjacencyFriendly * SCORE.ADJ_FRIENDLY;
  score += summary.adjacencyOpponent * SCORE.ADJ_OPPONENT;
  score += summary.centerWeight;

  summary.rawScore = score;
  return summary;
};

const countAdjacency = (
  board: GameStatus['board'],
  row: number,
  col: number,
  player: Player,
  opponent: Player
): { friendly: number; opponent: number } => {
  let friendly = 0;
  let opponentCount = 0;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (!isInside(board, r, c)) continue;
      const value = board.get(r, c);
      if (value === player) friendly += 1;
      if (value === opponent) opponentCount += 1;
    }
  }
  return { friendly, opponent: opponentCount };
};

const determineCategory = (attack: ThreatSummary, defense: ThreatSummary): SuggestionCategory => {
  if (attack.five) return 'win';
  if (defense.five) return 'block-win';
  if (attack.openFours >= 1 && defense.openFours >= 1) {
    return attack.openFours >= defense.openFours ? 'open-four' : 'block-open-four';
  }
  if (attack.openFours >= 1) return 'open-four';
  if (defense.openFours >= 1) return 'block-open-four';
  if (attack.doubleThree) return 'double-threat';
  if (defense.doubleThree) return 'block-double-three';
  if (attack.closedFours >= 1) return 'closed-four';
  if (defense.openThrees >= 1) return 'block-three';
  if (attack.openThrees >= 1) return 'build-three';
  return 'pressure';
};

const buildReason = (
  category: SuggestionCategory,
  attack: ThreatSummary,
  defense: ThreatSummary,
  cell: { row: number; col: number }
): string => {
  switch (category) {
    case 'win':
      return '直接形成五连';
    case 'block-win':
      return `封堵对手在 (${cell.row + 1}, ${cell.col + 1}) 的必胜点`;
    case 'open-four':
      return attack.openFours >= 2 ? '形成多线活四压力' : '形成活四迫使对手应对';
    case 'block-open-four':
      return defense.openFours >= 2 ? '同时封堵对手复数活四' : '封堵对手活四威胁';
    case 'double-threat':
      return attack.doubleThree ? '构建双三，下一手即获主动' : CATEGORY_REASON[category];
    case 'block-double-three':
      return defense.doubleThree ? '拆解对手双三连击' : CATEGORY_REASON[category];
    case 'closed-four':
      return attack.closedFours >= 2 ? '制造连续冲四压制' : '制造冲四牵制对手';
    case 'block-three':
      return defense.openThrees >= 2 ? '削弱对手双活三威胁' : '限制对手活三拓展';
    case 'build-three':
      return attack.openThrees >= 2 ? '铺设双活三威胁' : '落点稳健，铺垫后续攻势';
    case 'pressure':
    default:
      return '保持中心压力与空间控制';
  }
};

const countInDirection = (
  board: GameStatus['board'],
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player,
  opponent: Player
): DirectionalCounts => {
  let forward = 0;
  let backward = 0;
  let r = row + dr;
  let c = col + dc;
  while (isInside(board, r, c) && board.get(r, c) === player) {
    forward += 1;
    r += dr;
    c += dc;
  }
  const forwardOpen = isInside(board, r, c) && board.get(r, c) === null;

  r = row - dr;
  c = col - dc;
  while (isInside(board, r, c) && board.get(r, c) === player) {
    backward += 1;
    r -= dr;
    c -= dc;
  }
  const backwardOpen = isInside(board, r, c) && board.get(r, c) === null;

  const blockingForward = isInside(board, row + dr * (forward + 1), col + dc * (forward + 1))
    ? board.get(row + dr * (forward + 1), col + dc * (forward + 1)) === opponent
    : true;
  const blockingBackward = isInside(board, row - dr * (backward + 1), col - dc * (backward + 1))
    ? board.get(row - dr * (backward + 1), col - dc * (backward + 1)) === opponent
    : true;

  const openEnds = (forwardOpen ? 1 : 0) + (backwardOpen ? 1 : 0);

  // Adjust for overlines in Renju? Not enforced here; we treat >=5 as win.
  const total = 1 + forward + backward;

  // Slightly favour lines that are not blocked on both ends even if openEnds === 0.
  const adjustedOpenEnds = openEnds === 0 && (!blockingForward || !blockingBackward) ? 1 : openEnds;

  return {
    total,
    openEnds: adjustedOpenEnds,
    forward,
    backward,
    forwardOpen,
    backwardOpen
  };
};

const isInside = (board: GameStatus['board'], row: number, col: number): boolean =>
  row >= 0 && row < board.size && col >= 0 && col < board.size;
