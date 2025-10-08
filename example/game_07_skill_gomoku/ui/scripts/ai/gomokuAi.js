import { GamePhase, Player, SKILL_UNLOCK_MOVE } from '../core/constants.js';
import { SkillEffect } from '../skills/effects.js';

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

const MAX_DEPTH = 3;
const NEIGHBOR_RADIUS = 2;
const MAX_SCORE = 1_000_000;
const MIN_SCORE = -MAX_SCORE;

const PATTERN_SCORES = {
  five: 100000,
  openFour: 12000,
  closedFour: 3500,
  openThree: 1500,
  closedThree: 400,
  openTwo: 80,
  closedTwo: 20
};

export function findBestMove(board, player) {
  const opponent = getOpponent(player);
  const immediate = findImmediateWinningMove(board, player);
  if (immediate) return immediate;
  const block = findImmediateWinningMove(board, opponent);
  if (block) return block;

  const candidates = generateCandidateMoves(board);
  if (candidates.length === 0) {
    const center = Math.floor(board.size / 2);
    return { row: center, col: center };
  }

  let bestMove = candidates[0];
  let alpha = MIN_SCORE;
  let beta = MAX_SCORE;
  let bestScore = MIN_SCORE;

  const ordered = orderMoves(board, candidates, player);
  const limit = Math.min(ordered.length, 14);

  for (let i = 0; i < limit; i++) {
    const move = ordered[i];
    const sandbox = board.clone();
    sandbox.place(move.row, move.col, player);
    const score = -alphaBeta(sandbox, MAX_DEPTH - 1, MIN_SCORE, -bestScore, opponent, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      alpha = Math.max(alpha, score);
    }
    if (bestScore >= MAX_SCORE) {
      break;
    }
    if (alpha >= beta) {
      break;
    }
  }

  return bestMove;
}

export function aiShouldPlayCard(gameState) {
  const { currentPlayer, turnCount, hands, board, characters, statuses } = gameState;
  if (turnCount + 1 < SKILL_UNLOCK_MOVE || gameState.phase !== GamePhase.PLAYING) return null;

  const hand = hands[currentPlayer] || [];
  if (hand.length === 0) return null;

  const opponent = getOpponent(currentPlayer);
  const boardScore = evaluateBoard(board, currentPlayer) - evaluateBoard(board, opponent);
  const opponentThreat = detectStrongThreat(board, opponent);
  const selfThreat = detectStrongThreat(board, currentPlayer);

  const hasFusionCards = hand.some(card => includesTag(card, 'Fusion'));
  const summonCard = hand.find(card => card.effectId === SkillEffect.SummonCharacter);

  if (summonCard && !characters[currentPlayer] && hasFusionCards) {
    return { index: hand.indexOf(summonCard) };
  }

  if (opponentThreat >= 4) {
    const prevention = hand.find(card => includesTag(card, 'Removal'));
    if (prevention) {
      return { index: hand.indexOf(prevention) };
    }
    const freeze = hand.find(card => card.effectId === SkillEffect.FreezeOpponent);
    if (freeze) {
      return { index: hand.indexOf(freeze) };
    }
  }

  if (boardScore < -2000) {
    const rewind = hand.find(card => card.effectId === SkillEffect.TimeRewind);
    if (rewind) return { index: hand.indexOf(rewind) };
    const sweep = hand.find(card => card.effectId === SkillEffect.CleanSweep);
    if (sweep) return { index: hand.indexOf(sweep) };
  }

  const directWin = hand.find(card => card.effectId === SkillEffect.InstantWin);
  if (directWin && boardScore > 1200) {
    return { index: hand.indexOf(directWin) };
  }

  const skipTurn = hand.find(card => card.effectId === SkillEffect.SkipNextTurn);
  if (skipTurn && opponentThreat === 3) {
    return { index: hand.indexOf(skipTurn) };
  }

  const forceExit = hand.find(card => card.effectId === SkillEffect.ForceExit);
  if (forceExit && characters[opponent]) {
    return { index: hand.indexOf(forceExit) };
  }

  if (selfThreat >= 4) {
    const boost = hand.find(card => includesTag(card, 'DirectWin'));
    if (boost) return { index: hand.indexOf(boost) };
  }

  if (statuses.freeze[currentPlayer] > 0 || statuses.skip[currentPlayer] > 0) {
    return null;
  }

  return null;
}

export function aiSelectCounterCard(gameState, pendingCard) {
  const { counterWindow, hands } = gameState;
  if (!counterWindow) return null;
  const responder = counterWindow.responder;
  const hand = hands[responder] || [];
  const effectId = pendingCard.card?.effectId;
  if (!effectId) return null;

  const findByEffect = effect =>
    hand.find(card => card.effectId === effect);

  if (effectId === SkillEffect.InstantWin) {
    return findByEffect(SkillEffect.CounterReverseWin) || findByEffect(SkillEffect.CounterRestoreBoard);
  }

  if (effectId === SkillEffect.RemoveToShichahai) {
    const unstoppable = pendingCard.card?.params?.ignoreSeize;
    if (!unstoppable) {
      const seize = findByEffect(SkillEffect.CounterPreventRemoval);
      if (seize) return seize;
    }
    const retrieve = findByEffect(SkillEffect.CounterRetrieve);
    if (retrieve) return retrieve;
  }

  if (effectId === SkillEffect.CleanSweep || includesTag(pendingCard.card, 'Fusion')) {
    const shout = findByEffect(SkillEffect.CounterCancelFusion);
    if (shout) return shout;
  }

  if (includesTag(pendingCard.card, 'SkipTurn')) {
    const thaw = findByEffect(SkillEffect.CounterThaw);
    if (thaw) return thaw;
  }

  return null;
}

export function chooseRemovalTarget(board, player) {
  const opponent = getOpponent(player);
  let best = null;
  let bestScore = -Infinity;
  board.forEachCell((row, col, value) => {
    if (value !== opponent) return;
    const threat = evaluateThreatAt(board, opponent, row, col);
    if (threat > bestScore) {
      bestScore = threat;
      best = { row, col };
    }
  });
  return best;
}

export function chooseRetrievalPlacement(board, player) {
  const candidates = generateCandidateMoves(board);
  if (candidates.length === 0) {
    return { row: Math.floor(board.size / 2), col: Math.floor(board.size / 2) };
  }
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const move of candidates) {
    const clone = board.clone();
    clone.place(move.row, move.col, player);
    const score = evaluateBoard(clone, player);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function alphaBeta(board, depth, alpha, beta, player, isMaximizing) {
  const opponent = getOpponent(player);
  const selfScore = evaluateBoard(board, player);
  const opponentScore = evaluateBoard(board, opponent);

  if (selfScore >= MAX_SCORE || opponentScore >= MAX_SCORE || depth === 0) {
    return selfScore - opponentScore * 1.05;
  }

  const candidates = generateCandidateMoves(board);
  if (candidates.length === 0) {
    return 0;
  }

  const ordered = orderMoves(board, candidates, player);
  const limit = depth === MAX_DEPTH - 1 ? Math.min(ordered.length, 12) : Math.min(ordered.length, 8);

  if (isMaximizing) {
    let value = MIN_SCORE;
    for (let i = 0; i < limit; i++) {
      const move = ordered[i];
      const clone = board.clone();
      clone.place(move.row, move.col, player);
      value = Math.max(value, alphaBeta(clone, depth - 1, alpha, beta, opponent, false));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = MAX_SCORE;
    for (let i = 0; i < limit; i++) {
      const move = ordered[i];
      const clone = board.clone();
      clone.place(move.row, move.col, player);
      value = Math.min(value, alphaBeta(clone, depth - 1, alpha, beta, opponent, true));
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

function evaluateBoard(board, player) {
  let score = 0;
  board.forEachCell((row, col, value) => {
    if (value !== player) return;
    for (const [dr, dc] of DIRECTIONS) {
      if (board.get(row - dr, col - dc) === player) continue;
      const { count, openEnds } = countSequence(board, row, col, dr, dc, player);
      score += scorePattern(count, openEnds);
    }
  });
  return score;
}

function scorePattern(count, openEnds) {
  if (count >= 5) return PATTERN_SCORES.five;
  if (count === 4) {
    return openEnds === 2 ? PATTERN_SCORES.openFour : PATTERN_SCORES.closedFour;
  }
  if (count === 3) {
    return openEnds === 2 ? PATTERN_SCORES.openThree : PATTERN_SCORES.closedThree;
  }
  if (count === 2) {
    return openEnds === 2 ? PATTERN_SCORES.openTwo : PATTERN_SCORES.closedTwo;
  }
  return 2;
}

function countSequence(board, row, col, dr, dc, player) {
  let count = 0;
  let r = row;
  let c = col;
  while (board.get(r, c) === player) {
    count++;
    r += dr;
    c += dc;
  }
  let openEnds = 0;
  if (board.get(r, c) === null) openEnds++;
  r = row - dr;
  c = col - dc;
  while (board.get(r, c) === player) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (board.get(r, c) === null) openEnds++;
  return { count, openEnds };
}

function generateCandidateMoves(board) {
  const candidates = new Set();
  let hasStone = false;
  board.forEachCell((row, col, value) => {
    if (value !== null) {
      hasStone = true;
      for (let dr = -NEIGHBOR_RADIUS; dr <= NEIGHBOR_RADIUS; dr++) {
        for (let dc = -NEIGHBOR_RADIUS; dc <= NEIGHBOR_RADIUS; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (board.get(r, c) === null) {
            candidates.add(`${r},${c}`);
          }
        }
      }
    }
  });
  if (!hasStone) {
    const center = Math.floor(board.size / 2);
    return [{ row: center, col: center }];
  }
  return Array.from(candidates).map(key => {
    const [r, c] = key.split(',').map(Number);
    return { row: r, col: c };
  });
}

function orderMoves(board, moves, player) {
  return moves
    .map(move => {
      const clone = board.clone();
      clone.place(move.row, move.col, player);
      const score = evaluateBoard(clone, player);
      return { move, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.move);
}

function evaluateThreatAt(board, player, row, col) {
  let score = 0;
  for (const [dr, dc] of DIRECTIONS) {
    if (board.get(row - dr, col - dc) === player) continue;
    const { count, openEnds } = countSequence(board, row, col, dr, dc, player);
    score = Math.max(score, scorePattern(count, openEnds));
  }
  return score;
}

function detectStrongThreat(board, player) {
  let best = 0;
  board.forEachCell((row, col, value) => {
    if (value !== player) return;
    for (const [dr, dc] of DIRECTIONS) {
      if (board.get(row - dr, col - dc) === player) continue;
      const { count, openEnds } = countSequence(board, row, col, dr, dc, player);
      if (count >= 5) return 5;
      if (count === 4 && openEnds > 0) best = Math.max(best, 4);
      if (count === 3 && openEnds === 2) best = Math.max(best, 3);
    }
  });
  return best;
}

function findImmediateWinningMove(board, player) {
  const candidates = generateCandidateMoves(board);
  for (const move of candidates) {
    const sandbox = board.clone();
    sandbox.place(move.row, move.col, player);
    if (sandbox.checkWin(player)) {
      return move;
    }
  }
  return null;
}

function includesTag(card, tag) {
  return (card.tags || '').split('|').includes(tag);
}

function getOpponent(player) {
  return player === Player.BLACK ? Player.WHITE : Player.BLACK;
}
