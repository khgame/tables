import type { AiScenario } from './openAiClient';
import type { GameStatus, Player, RawCard } from '../types';
import type { LocalMoveSuggestion } from './local';
import { PlayerEnum } from '../core/constants';
import { pickBestCandidate, collectEmptyCells, analyzeBoardForPlayer } from '../core/analysis';
import { SkillEffect } from '../skills/effects';
import { formatCardIdentifier } from './decisions';
import { aiLog } from './logger';

export type AiActionHandlers = {
  playCard: (index: number) => void;
  placeStone: (row: number, col: number) => void;
  resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
  selectTarget: (selection: { row: number; col: number } | { id: string }) => void;
};

export const fallbackDecision = (
  scenario: AiScenario,
  state: GameStatus,
  actions: AiActionHandlers,
  localSuggestion?: LocalMoveSuggestion | null
) => {
  switch (scenario.kind) {
    case 'stone':
      fallbackPlaceStone(state, actions, localSuggestion ?? null);
      break;
    case 'skill':
      if (scenario.skills.length === 0) { fallbackPlaceStone(state, actions, null); break; }

      const mySkills = scenario.skills;
      // 永不使用“时光倒流”（本地AI禁用）
      const noTimeRewind = mySkills.filter(s => s.card.effectId !== SkillEffect.TimeRewind);
      // Heuristics for 力拔山兮（假设 effectId=remove-to-shichahai 或名称包含该词）
      const isLiBaShanXi = (card: RawCard) =>
        (card.effectId === SkillEffect.RemoveToShichahai) || /力拔山兮/.test(card.nameZh ?? '');

      const oppHand = (state.hands[PlayerEnum.BLACK] ?? []).length; // 黑方=对手

      // 对手手牌很多：谨慎使用力拔山兮，除非局面无解（对手有即将成五）
      const blackThreat = analyzeBoardForPlayer(state.board, PlayerEnum.BLACK);
      const noSolution = blackThreat.winMoves.length > 0;

      let pick = (noTimeRewind[0] ?? mySkills[0]);
      if (oppHand >= 3 && !noSolution) {
        // 避免立刻用 力拔山兮，择优选其他技能
        const nonLiCandidates = (noTimeRewind.length > 0 ? noTimeRewind : mySkills).filter(s => !isLiBaShanXi(s.card));
        if (nonLiCandidates.length > 0) pick = nonLiCandidates[0];
      } else if (oppHand === 0) {
        // 对手空手：优先使用主动强力技能，尤其 力拔山兮
        const liFirst = (noTimeRewind.length > 0 ? noTimeRewind : mySkills).find(s => isLiBaShanXi(s.card));
        if (liFirst) pick = liFirst;
      }

      // 若仍然只剩时光倒流可用，则放弃技能，直接落子
      if (pick.card.effectId === SkillEffect.TimeRewind) {
        fallbackPlaceStone(state, actions, localSuggestion ?? null);
        break;
      }

      aiLog.info(`[fallback:skill] pick ${formatCardIdentifier(pick.card)} (hand ${pick.handIndex})`, { oppHand, noSolution });
      actions.playCard(pick.handIndex);
      break;
    case 'card_targeting':
      if (scenario.request.type === 'cell') {
        const target = scenario.request.cells?.[0];
        if (target) actions.selectTarget({ row: target.row, col: target.col });
      } else if (scenario.request.type === 'snapshot') {
        const option = scenario.request.options?.[0];
        if (option) actions.selectTarget({ id: option.id });
      }
      break;
    case 'counter_window':
      actions.resolveCard(false, null);
      break;
  }
};

export const fallbackPlaceStone = (
  state: GameStatus,
  actions: AiActionHandlers,
  localSuggestion: LocalMoveSuggestion | null
) => {
  if (localSuggestion) {
    actions.placeStone(localSuggestion.row, localSuggestion.col);
    return;
  }
  const empties = collectEmptyCells(state.board);
  const focus = Math.floor(state.board.size / 2);
  const pickWhite = pickBestCandidate(state.board, empties, PlayerEnum.WHITE, focus);
  const pickBlack = pickBestCandidate(state.board, empties, PlayerEnum.BLACK, focus);
  const pick = pickWhite.score >= pickBlack.score ? pickWhite : pickBlack;
  if (pick.cell) actions.placeStone(pick.cell.row, pick.cell.col);
};

// 模拟时光倒流的效果（各撤回一手）并评估黑方是否因此出现危险形（活四/双三）
const wouldTimeRewindCreateOpponentDanger = (state: GameStatus): boolean => {
  try {
    const clone = state.board.clone();
    const history = (clone as any).history as Array<{ row: number; col: number; player: Player }>;
    if (!Array.isArray(history) || history.length === 0) return false;

    const removeLastOf = (player: Player) => {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].player === player) {
          const { row, col } = history[i];
          clone.remove(row, col);
          history.splice(i, 1);
          return true;
        }
      }
      return false;
    };

    removeLastOf(PlayerEnum.WHITE);
    removeLastOf(PlayerEnum.BLACK);

    const black = analyzeBoardForPlayer(clone, PlayerEnum.BLACK);
    const danger = (black.openFours.length > 0) || (black.doubleThrees.length > 0);
    return danger;
  } catch {
    return false;
  }
};
