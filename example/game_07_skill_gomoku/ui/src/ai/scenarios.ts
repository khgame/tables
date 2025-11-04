import type { AiScenario } from './openAiClient';
import type { GameStatus, Player, RawCard } from '../types';
import { PlayerEnum } from '../core/constants';
import { parseTags, getTidString } from '../core/utils';
import { analyzeBoardForPlayer, buildStoneAnalysis, isSkillCardPlayable } from '../core/analysis';
import { suggestLocalMove, formatLocalSuggestion } from './local';

export function deriveScenarios(state: GameStatus): AiScenario[] {
  if (!state.aiEnabled) return [];
  if (state.draft) return [];

  if (state.phase === 'card_targeting') {
    const request = state.targetRequest;
    if (request && request.actingPlayer === PlayerEnum.WHITE) {
      return [
        {
          kind: 'card_targeting',
          player: PlayerEnum.WHITE,
          request,
          game: state,
        },
      ];
    }
    return [];
  }

  if (state.phase === 'counter_window') {
    if (!state.pendingAction) return [];
    const window = state.counterWindow;
    if (window?.responder !== PlayerEnum.WHITE) return [];
    return [
      {
        kind: 'counter_window',
        player: PlayerEnum.WHITE,
        game: state,
        pendingCard: state.pendingAction,
        availableCounters: collectCounterOptions(state, PlayerEnum.WHITE),
      },
    ];
  }

  if (state.phase === 'playing') {
    if (state.currentPlayer !== PlayerEnum.WHITE) return [];
    if (state.pendingAction || state.pendingCounter || state.targetRequest) return [];
    const note = summariseBoardUrgency(state.board);
    const skills = collectPlayableSkills(state, PlayerEnum.WHITE);
    const stoneAnalysis = buildStoneAnalysis(state.board);
    const localSuggestion = suggestLocalMove(state);
    const analysisParts = [
      stoneAnalysis,
      localSuggestion ? `本地分析：${formatLocalSuggestion(localSuggestion)}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    const scenarios: AiScenario[] = [];
    if (skills.length > 0) {
      scenarios.push({
        kind: 'skill',
        player: PlayerEnum.WHITE,
        game: state,
        skills,
        contextNote: note ?? undefined,
      });
    }
    scenarios.push({
      kind: 'stone',
      player: PlayerEnum.WHITE,
      game: state,
      contextNote: note ?? (skills.length === 0 ? '当前无可发动技能，需选择落子方案。' : undefined),
      analysis: analysisParts || undefined,
      localSuggestion: localSuggestion ?? undefined,
    });
    return scenarios;
  }

  return [];
}

export function buildScenarioKey(scenario: AiScenario, state: GameStatus): string {
  switch (scenario.kind) {
    case 'card_targeting':
      return `target:${state.targetRequest?.id ?? 'none'}`;
    case 'counter_window':
      return `counter:${state.pendingAction?.id ?? 'none'}:${state.counterWindow?.id ?? 'none'}:${scenario.availableCounters
        .map((item) => item.handIndex)
        .join(',')}`;
    case 'skill':
      return `skill:${state.turnCount}:${scenario.skills.map((item) => item.handIndex).join(',')}`;
    case 'stone':
      return `stone:${state.turnCount}:${state.board.history.length}`;
    default:
      return `${scenario.kind}:${state.turnCount}`;
  }
}

export function collectPlayableSkills(state: GameStatus, player: Player): Array<{ handIndex: number; card: RawCard }> {
  if (state.turnCount + 1 < 8 /* SKILL_UNLOCK_MOVE */) return [];
  if (state.statuses.freeze[player] > 0) return [];
  const hand = state.hands[player] ?? [];
  const fusionLockTurn = state.statuses.fusionLock[player] ?? 0;
  const activeCharacter = state.characters[player];
  const activeCharacterId = activeCharacter ? String(activeCharacter._tid ?? activeCharacter.tid) : null;

  return hand.reduce<Array<{ handIndex: number; card: RawCard }>>((acc, card, index) => {
    const timing = (card.timing ?? '').toLowerCase();
    if (timing.includes('reaction') && !timing.includes('anytime')) {
      return acc;
    }
    const tags = parseTags(card.tags);
    if (tags.has('Fusion') && fusionLockTurn > state.turnCount) {
      return acc;
    }
    if (card.requiresCharacter) {
      const requiredId = String(card.requiresCharacter);
      if (!activeCharacterId || activeCharacterId !== requiredId) {
        return acc;
      }
    }
    if (isSkillCardPlayable(state, player, card)) {
      acc.push({ handIndex: index, card });
    }
    return acc;
  }, []);
}

export function summariseBoardUrgency(board: GameStatus['board']): string | null {
  const whitePatterns = analyzeBoardForPlayer(board, PlayerEnum.WHITE);
  const blackPatterns = analyzeBoardForPlayer(board, PlayerEnum.BLACK);
  const notes: string[] = [];
  if (whitePatterns.winMoves.length > 0) {
    const cell = whitePatterns.winMoves[0];
    notes.push(`白方在 (${cell.row + 1}, ${cell.col + 1}) 落子即可形成五连。`);
  }
  if (blackPatterns.winMoves.length > 0) {
    const cell = blackPatterns.winMoves[0];
    notes.push(`黑方若在 (${cell.row + 1}, ${cell.col + 1}) 落子将成五，需立即阻挡。`);
  }
  if (blackPatterns.openFours.length > 0) {
    const cell = blackPatterns.openFours[0];
    notes.push(`黑方存在活四威胁，代表位置 (${cell.row + 1}, ${cell.col + 1})。`);
  }
  if (notes.length === 0 && whitePatterns.openFours.length > 0) {
    const cell = whitePatterns.openFours[0];
    notes.push(`白方可在 (${cell.row + 1}, ${cell.col + 1}) 构建活四。`);
  }
  return notes.length > 0 ? notes.join(' ') : null;
}

export function collectCounterOptions(state: GameStatus, responder: Player): Array<{ handIndex: number; card: RawCard }> {
  if (!state.pendingAction) return [];
  const idsRaw = state.pendingAction.card.counteredBy;
  const idList = (() => {
    if (Array.isArray(idsRaw)) return idsRaw.map((v) => String(v).trim()).filter(Boolean);
    if (typeof idsRaw === 'string') return idsRaw.split('|').map((s) => s.trim()).filter(Boolean);
    if (idsRaw == null) return [] as string[];
    return [String(idsRaw).trim()].filter(Boolean);
  })();
  if (idList.length === 0) return [];
  const hand = state.hands[responder] ?? [];
  return hand
    .map((card, i) => ({ handIndex: i, card }))
    .filter(({ card }) => idList.includes(getTidString(card)));
}
