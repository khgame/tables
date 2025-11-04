import type { AiDecision, AiPlayingDecision, AiScenario } from './openAiClient';
import type { GameStatus, Player, RawCard } from '../types';
import { PlayerEnum } from '../core/constants';
import { isWithinBoard, isCellAllowed } from '../core/analysis';

export type AiActionHandlers = {
  playCard: (index: number) => void;
  placeStone: (row: number, col: number) => void;
  resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
  selectTarget: (selection: { row: number; col: number } | { id: string }) => void;
};

export function applyDecision(
  decision: AiDecision | null,
  scenario: AiScenario,
  state: GameStatus,
  actions: AiActionHandlers
): { success: boolean; reason?: string; detail?: string } {
  if (!decision) return { success: false, reason: '决策为空' };
  if (!('kind' in decision)) return { success: false, reason: '非法决策格式' };

  if (scenario.kind === 'stone') {
    const move = resolveMoveFromDecision(decision as Extract<AiDecision, { kind: 'place_stone' }>, state.board, PlayerEnum.WHITE);
    if (!move) return { success: false, reason: '未提供有效落子' };
    actions.placeStone(move.row, move.col);
    return { success: true, detail: `place (${move.row + 1}, ${move.col + 1})` };
  }

  if (scenario.kind === 'skill') {
    const idx = resolveHandIndexForDecision(
      decision as { handIndex?: number; cardId?: string },
      scenario.skills.map((s) => s.card)
    );
    let handIndex: number | null = null;
    const d1 = decision as { handIndex?: number; cardId?: string };
    if (typeof d1.handIndex === 'number') {
      handIndex = d1.handIndex;
    } else if (d1.cardId) {
      const targetId = d1.cardId.trim().toLowerCase();
      const i = scenario.skills.findIndex((s) => matchesCardIdentifier(s.card, targetId));
      handIndex = i >= 0 ? scenario.skills[i].handIndex : null;
    } else if (idx != null) {
      const mapped = scenario.skills.find((s) => s.card === scenario.skills.map((x) => x.card)[idx]);
      handIndex = mapped ? mapped.handIndex : null;
    }
    if (handIndex == null) return { success: false, reason: '未解析到技能手牌索引' };
    actions.playCard(handIndex);
    return { success: true, detail: `play hand[${handIndex}]` };
  }

  if (scenario.kind === 'card_targeting') {
    if (scenario.request.type === 'cell') {
      const move = (decision as { target?: { row: number; col: number }; selection?: { row: number; col: number } }).target
        ?? (decision as { target?: { row: number; col: number }; selection?: { row: number; col: number } }).selection;
      const row = Number(move?.row);
      const col = Number(move?.col);
      if (
        Number.isInteger(row) &&
        Number.isInteger(col) &&
        isWithinBoard(state.board, row, col) &&
        (!scenario.request.cells || isCellAllowed(scenario.request.cells, row, col))
      ) {
        actions.selectTarget({ row, col });
        return { success: true, detail: `select (${row + 1}, ${col + 1})` };
      }
      return { success: false, reason: '未给出有效目标格' };
    }
    if (scenario.request.type === 'snapshot') {
      const d2 = decision as { id?: string; snapshotId?: string; targetId?: string };
      const id = d2.id ?? d2.snapshotId ?? d2.targetId;
      if (id != null) {
        actions.selectTarget({ id });
        return { success: true, detail: `select snapshot ${id}` };
      }
      return { success: false, reason: '未给出时间节点' };
    }
    return { success: false, reason: '未知目标类型' };
  }

  if (scenario.kind === 'counter_window') {
    const options = scenario.availableCounters ?? [];
    const idx = resolveCounterIndex(decision as { handIndex?: number; cardId?: string }, options);
    if (idx == null) return { success: false, reason: '未解析到反击卡' };
    const pick = options[idx];
    actions.resolveCard(true, pick.card);
    return { success: true, detail: `counter with ${formatCardIdentifier(pick.card)}` };
  }

  return { success: false, reason: '未知决策场景' };
}

export const deriveMoveFromBoardMatrix = (
  matrix: number[][],
  board: GameStatus['board'],
  player: Player
): { row: number; col: number } | null => {
  if (!Array.isArray(matrix) || matrix.length !== board.size) return null;
  let candidate: { row: number; col: number } | null = null;
  for (let row = 0; row < board.size; row++) {
    const matrixRow = matrix[row];
    if (!Array.isArray(matrixRow) || matrixRow.length !== board.size) return null;
    for (let col = 0; col < board.size; col++) {
      const current = board.get(row, col);
      const encoded = current === null ? 0 : current === PlayerEnum.BLACK ? 1 : 2;
      const target = Number(matrixRow[col]);
      if (!Number.isFinite(target) || ![0, 1, 2].includes(target)) return null;
      if (encoded === target) continue;
      const expectedPlayerValue = player === PlayerEnum.WHITE ? 2 : 1;
      if (encoded === 0 && target === expectedPlayerValue) {
        if (candidate) {
          return null; // 多于一个落子
        }
        candidate = { row, col };
        continue;
      }
      return null; // 非法变动
    }
  }
  return candidate;
};

type PlaceStoneDecision = Extract<AiPlayingDecision, { kind: 'place_stone' }>;

export const resolveMoveFromDecision = (
  decision: PlaceStoneDecision,
  board: GameStatus['board'],
  player: Player
): { row: number; col: number } | null => {
  if ('board' in decision && decision.board) {
    return deriveMoveFromBoardMatrix(decision.board, board, player);
  }
  if ('row' in decision && 'col' in decision) {
    const dc = decision as { row?: number; col?: number };
    const row = Number(dc.row);
    const col = Number(dc.col);
    if (Number.isInteger(row) && Number.isInteger(col) && isWithinBoard(board, row, col)) {
      if (board.get(row, col) === null) return { row, col };
    }
  }
  return null;
};

export const resolveHandIndexForDecision = (
  decision: { handIndex?: number; cardId?: string },
  hand: RawCard[]
): number | null => {
  if (typeof decision.handIndex === 'number') {
    const idx = decision.handIndex;
    if (idx >= 0 && idx < hand.length) return idx;
  }
  if (decision.cardId) {
    const targetId = decision.cardId.trim().toLowerCase();
    const index = hand.findIndex((card) => matchesCardIdentifier(card, targetId));
    if (index >= 0) return index;
  }
  return null;
};

export const resolveCounterIndex = (
  decision: { handIndex?: number; cardId?: string },
  options: Array<{ handIndex: number; card: RawCard }>
): number | null => {
  if (typeof decision.handIndex === 'number') {
    const idx = options.findIndex((option) => option.handIndex === decision.handIndex);
    if (idx >= 0) return idx;
  }
  if (decision.cardId) {
    const targetId = decision.cardId.trim().toLowerCase();
    const idx = options.findIndex((option) => matchesCardIdentifier(option.card, targetId));
    if (idx >= 0) return idx;
  }
  return null;
};

export const matchesCardIdentifier = (card: RawCard, identifier: string): boolean => {
  const candidates = [card._tid, card.tid, card.effectId, card.nameZh, card.nameEn]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
  return candidates.includes(identifier);
};

export const formatCardIdentifier = (card: RawCard): string => {
  const id = card._tid ?? card.tid ?? card.effectId;
  if (card.nameZh) return `${card.nameZh}${id ? ` (#${id})` : ''}`;
  if (card.nameEn) return `${card.nameEn}${id ? ` (#${id})` : ''}`;
  return id ? `卡牌 ${id}` : '未知卡牌';
};
