import type { GameStatus, Player, RawCard } from '../types';
import { PlayerEnum, getOpponent } from '../core/constants';
import { SkillEffect } from '../skills/effects';
import { parseEffectParams } from '../core/utils';

export type EmptyCell = { row: number; col: number };

const LINE_DIRECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

export interface StonePatternSummary {
  winMoves: EmptyCell[];
  openFours: EmptyCell[];
  doubleThrees: Array<{ cell: EmptyCell; count: number }>;
  openThrees: EmptyCell[];
}

interface LineEvaluation {
  total: number;
  openEnds: number;
  isWin: boolean;
  isOpenFour: boolean;
  isOpenThree: boolean;
}

export function analyzeBoardForPlayer(board: GameStatus['board'], player: Player): StonePatternSummary {
  const winMoves: EmptyCell[] = [];
  const openFours: EmptyCell[] = [];
  const doubleThrees: Array<{ cell: EmptyCell; count: number }> = [];
  const openThrees: EmptyCell[] = [];
  const empties = collectEmptyCells(board);

  empties.forEach(cell => {
    let isWin = false;
    let hasOpenFour = false;
    let openThreeCount = 0;

    LINE_DIRECTIONS.forEach(([dr, dc]) => {
      const evaluation = evaluateLine(board, cell, player, dr, dc);
      if (evaluation.isWin) isWin = true;
      if (evaluation.isOpenFour) hasOpenFour = true;
      if (evaluation.isOpenThree) openThreeCount += 1;
    });

    if (isWin) {
      winMoves.push(cell);
      return;
    }

    if (hasOpenFour) {
      openFours.push(cell);
    }

    if (openThreeCount >= 2) {
      doubleThrees.push({ cell, count: openThreeCount });
    } else if (openThreeCount === 1) {
      openThrees.push(cell);
    }
  });

  return { winMoves, openFours, doubleThrees, openThrees };
}

function evaluateLine(
  board: GameStatus['board'],
  cell: EmptyCell,
  player: Player,
  dr: number,
  dc: number
): LineEvaluation {
  let forward = 0;
  let backward = 0;
  let r = cell.row + dr;
  let c = cell.col + dc;
  while (isWithinBoard(board, r, c) && board.get(r, c) === player) {
    forward += 1;
    r += dr;
    c += dc;
  }
  const forwardOpen = isWithinBoard(board, r, c) && board.get(r, c) === null;

  r = cell.row - dr;
  c = cell.col - dc;
  while (isWithinBoard(board, r, c) && board.get(r, c) === player) {
    backward += 1;
    r -= dr;
    c -= dc;
  }
  const backwardOpen = isWithinBoard(board, r, c) && board.get(r, c) === null;

  const total = 1 + forward + backward;
  const openEnds = (forwardOpen ? 1 : 0) + (backwardOpen ? 1 : 0);

  const isWin = total >= 5;
  const isOpenFour = total === 4 && openEnds === 2;
  const isOpenThree = total === 3 && openEnds === 2;

  return { total, openEnds, isWin, isOpenFour, isOpenThree };
}

export function buildStoneAnalysis(board: GameStatus['board']): string | null {
  const white = analyzeBoardForPlayer(board, PlayerEnum.WHITE);
  const black = analyzeBoardForPlayer(board, PlayerEnum.BLACK);
  const lines: string[] = [
    '现在你是白方，需要在以下目标之间选择：形成五连、阻止黑方成五、构建活四 / 活三 / 双三。'
  ];

  lines.push(formatPatternLine('白方成五机会', white.winMoves));
  lines.push(formatPatternLine('白方活四机会', white.openFours));
  lines.push(formatPatternLine('白方双三机会', white.doubleThrees.map(item => item.cell)));
  lines.push(formatPatternLine('白方活三铺垫', white.openThrees));

  lines.push(formatPatternLine('黑方成五威胁', black.winMoves));
  lines.push(formatPatternLine('黑方活四威胁', black.openFours));
  lines.push(formatPatternLine('黑方双三威胁', black.doubleThrees.map(item => item.cell)));
  lines.push(formatPatternLine('黑方活三铺垫', black.openThrees));

  const meaningful = lines.filter(Boolean);
  if (meaningful.length <= 1) return meaningful[0] ?? null;
  return meaningful.join('\n');
}

export function formatPatternLine(label: string, cells: EmptyCell[]): string {
  if (cells.length === 0) return '';
  const formatted = formatCells(cells);
  return `${label}: ${formatted}`;
}

export function formatCells(cells: EmptyCell[], limit = 5): string {
  const picks = cells.slice(0, limit).map(cell => `(${cell.row + 1}, ${cell.col + 1})`);
  if (cells.length > limit) {
    picks.push(`... 共 ${cells.length} 处`);
  }
  return picks.join(' / ');
}

export function isSkillCardPlayable(state: GameStatus, player: Player, card: RawCard): boolean {
  const effectId = card.effectId ? String(card.effectId) : '';
  switch (effectId) {
    case SkillEffect.RemoveToShichahai:
      return hasBoardMatch(state.board, cellPlayer => cellPlayer === getOpponent(player));
    case SkillEffect.CleanSweep:
      return hasBoardMatch(state.board, cellPlayer => cellPlayer !== null);
    case SkillEffect.TimeRewind:
      return state.timeline.some(entry => entry.turn > 0);
    case SkillEffect.SummonCharacter: {
      const params = parseEffectParams(card.effectParams);
      const targetId = params.character != null ? String(params.character) : null;
      const current = state.characters[player];
      if (!targetId) return !current;
      const currentId = current ? String(current._tid ?? current.tid) : null;
      return currentId !== targetId;
    }
    case SkillEffect.ForceExit: {
      const params = parseEffectParams(card.effectParams);
      const targetId = params.target != null ? String(params.target) : null;
      const opponentChar = state.characters[getOpponent(player)];
      if (!opponentChar) return false;
      if (!targetId) return true;
      const opponentId = String(opponentChar._tid ?? opponentChar.tid);
      return opponentId === targetId;
    }
    default:
      return true;
  }
}

export function hasBoardMatch(board: GameStatus['board'], predicate: (cellPlayer: Player | null) => boolean): boolean {
  let matched = false;
  board.forEachCell((_row, _col, value) => {
    if (!matched && predicate(value)) {
      matched = true;
    }
  });
  return matched;
}

export function collectEmptyCells(board: GameStatus['board']): EmptyCell[] {
  const cells: EmptyCell[] = [];
  board.forEachCell((row, col, value) => {
    if (value === null) cells.push({ row, col });
  });
  return cells;
}

export function scorePlacement(board: GameStatus['board'], cell: EmptyCell, player: Player): number {
  let best = 1;
  LINE_DIRECTIONS.forEach(([dr, dc]) => {
    let count = 1;
    let r = cell.row + dr;
    let c = cell.col + dc;
    while (r >= 0 && r < board.size && c >= 0 && c < board.size && board.get(r, c) === player) {
      count += 1;
      r += dr;
      c += dc;
    }
    r = cell.row - dr;
    c = cell.col - dc;
    while (r >= 0 && r < board.size && c >= 0 && c < board.size && board.get(r, c) === player) {
      count += 1;
      r -= dr;
      c -= dc;
    }
    if (count > best) best = count;
  });
  return best;
}

export function pickBestCandidate(
  board: GameStatus['board'],
  empties: EmptyCell[],
  player: Player,
  focus: number
): { cell: EmptyCell | null; score: number } {
  let bestScore = 0;
  let bestCell: EmptyCell | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  empties.forEach(cell => {
    const score = scorePlacement(board, cell, player);
    if (score === 0) return;
    const distance = Math.abs(cell.row - focus) + Math.abs(cell.col - focus);
    if (score > bestScore || (score === bestScore && distance < bestDistance)) {
      bestScore = score;
      bestCell = cell;
      bestDistance = distance;
    }
  });

  return { cell: bestCell, score: bestScore };
}

export const isWithinBoard = (board: GameStatus['board'], row: number, col: number) =>
  Number.isInteger(row) && Number.isInteger(col) && row >= 0 && col >= 0 && row < board.size && col < board.size;

export const isCellAllowed = (cells: Array<{ row: number; col: number }>, row: number, col: number) =>
  cells.some(cell => cell.row === row && cell.col === col);

