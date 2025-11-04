import { useEffect, useRef } from 'react';
import type { AiSettings, AiScenario } from './openAiClient';
import { hasValidSettings, requestAiDecision } from './openAiClient';
import type { LocalMoveSuggestion } from './local';
import { suggestLocalMove, formatLocalSuggestion, shouldAutoplaySuggestion } from './local';
import { aiLog } from './logger';
import { formatCardIdentifier } from './decisions';
import { GamePhaseEnum, PlayerEnum } from '../core/constants';
import type { GameStatus, RawCard, TargetSelection } from '../types';
import { applyDecision } from './decisions';
import { deriveScenarios, buildScenarioKey, collectCounterOptions } from './scenarios';
import { fallbackDecision } from './fallbacks';
import { SkillEffect } from '../skills/effects';

// Progress messaging
const DEFAULT_PROGRESS_MESSAGES = ['持续分析局势', '推演后续回合', '评估风险收益'];
const PROGRESS_MESSAGES: Record<AiScenario['kind'], string[]> = {
  stone: ['扫描棋型威胁', '推演双方落子', '验证占位收益'],
  skill: ['梳理技能组合', '模拟效果连锁', '评估反制风险'],
  card_targeting: ['对比目标优先级', '校验可选范围', '预估技能结果'],
  counter_window: ['检测可用反击牌', '判断对手威胁', '计算反击收益'],
  mulligan: ['评估初始手牌', '权衡重抽价值', '预测开局走势']
};
const PROGRESS_UPDATE_INTERVAL = 10000;

const getScenarioMeta = (kind: AiScenario['kind']) => {
  switch (kind) {
    case 'card_targeting':
      return {
        message: '白方 AI 正在选择技能目标…',
        startLog: '白方 AI 正在计算技能目标',
        successLog: (detail?: string) => detail ?? '白方 AI 完成目标选择',
        fallbackLog: '白方 AI 目标选择使用默认选项'
      };
    case 'counter_window':
      return {
        message: '白方 AI 判定是否反击…',
        startLog: '白方 AI 正在评估反击窗口',
        successLog: (detail?: string) => detail ?? '白方 AI 完成反击判定',
        fallbackLog: '白方 AI 反击窗口使用保底策略'
      };
    case 'skill':
      return {
        message: '白方 AI 评估技能动作…',
        startLog: '白方 AI 正在筛选可发动技能',
        successLog: (detail?: string) => detail ?? '白方 AI 完成技能判定',
        fallbackLog: '白方 AI 使用默认技能策略'
      };
    case 'stone':
    default:
      return {
        message: '白方 AI 规划落子…',
        startLog: '白方 AI 正在计算落子位置',
        successLog: (detail?: string) => detail ?? '白方 AI 完成落子决策',
        fallbackLog: '白方 AI 落子使用默认策略'
      };
  }
};

export const useAIActions = (
  gameState: GameStatus,
  actions: {
    playCard: (index: number) => void;
    placeStone: (row: number, col: number) => void;
    resolveCard: (countered: boolean, counterCard?: RawCard | null) => void;
    selectTarget: (selection: TargetSelection) => void;
    advanceTurnIfBlocked: () => void;
  },
  aiSettings: AiSettings,
  updateAiStatus: (status: { scenario: AiScenario['kind'] | null; message: string; reason?: string }) => void,
  visualsActive?: boolean
) => {
  const { playCard, placeStone, resolveCard, selectTarget, advanceTurnIfBlocked } = actions;
  const processedRef = useRef<Set<string>>(new Set());
  const activeKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  // 全局每-key 尝试计数（防止无限思考），超过 3 次直接回退
  const attemptsPerKeyRef = useRef<Map<string, number>>(new Map());
  const prevSnapshotRef = useRef<{ len: number; turn: number }>({ len: gameState.board.history.length, turn: gameState.turnCount });

  // 清理 processed key 的时机（回合或历史回退）
  useEffect(() => {
    if (visualsActive) {
      // 暂停调度并清理所有已挂起的定时器，直至动画结束
      activeKeyRef.current = null;
      if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null; }
      if (progressTimerRef.current !== null) { window.clearTimeout(progressTimerRef.current); progressTimerRef.current = null; }
      return;
    }
    // 如果白方被冻结/跳过：用虚拟落子快速推进
    if (
      gameState.aiEnabled &&
      gameState.phase === GamePhaseEnum.PLAYING &&
      gameState.currentPlayer === PlayerEnum.WHITE &&
      !gameState.pendingAction && !gameState.pendingCounter && !gameState.targetRequest && !gameState.draft
    ) {
      const frozen = (gameState.statuses.freeze[PlayerEnum.WHITE] ?? 0) > 0;
      const skip = (gameState.statuses.skip[PlayerEnum.WHITE] ?? 0) > 0;
      if (frozen || skip) {
        const key = `auto-skip:${gameState.turnCount}`;
        if (!processedRef.current.has(key)) {
          processedRef.current.add(key);
          try { advanceTurnIfBlocked(); } catch {}
          return;
        }
      }
    }

    if (gameState.turnCount === 0 && gameState.board.history.length === 0) {
      processedRef.current.clear();
      activeKeyRef.current = null;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    const prev = prevSnapshotRef.current;
    if (gameState.board.history.length < prev.len || gameState.turnCount < prev.turn) {
      processedRef.current.clear();
      activeKeyRef.current = null;
    }
    prevSnapshotRef.current = { len: gameState.board.history.length, turn: gameState.turnCount };
  }, [gameState.turnCount, gameState.board.history.length]);

  useEffect(() => {
    const stopProgressUpdates = () => {
      if (progressTimerRef.current !== null) {
        window.clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };

    const cycleProgressMessage = (
      scenario: AiScenario,
      baseMessage: string,
      reason?: string
    ) => {
      stopProgressUpdates();
      const source = PROGRESS_MESSAGES[scenario.kind] ?? DEFAULT_PROGRESS_MESSAGES;
      const phrases = source.length > 0 ? source : DEFAULT_PROGRESS_MESSAGES;
      let index = 0;
      const tick = () => {
        const suffix = phrases[index % phrases.length];
        index += 1;
        const message = suffix ? `${baseMessage} · ${suffix}` : baseMessage;
        updateAiStatus({ scenario: scenario.kind, message, reason });
        progressTimerRef.current = window.setTimeout(tick, PROGRESS_UPDATE_INTERVAL);
      };
      tick();
    };

    const clearRunningTask = (resetStatus = true, extra?: { reason?: string }) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      stopProgressUpdates();
      activeKeyRef.current = null;
      if (resetStatus) updateAiStatus({ scenario: null, message: '', reason: extra?.reason });
    };

    const startScenario = (scenario: AiScenario, key: string) => {
      if (processedRef.current.has(key)) return;

      let scenarioPayload: AiScenario = scenario;
      let cachedLocalSuggestion: LocalMoveSuggestion | null = null;

      // counter window：优先本地策略
      if (scenario.kind === 'counter_window') {
        const targetEffect = scenario.pendingCard?.effectId ?? '';
        const targetParams = (scenario.pendingCard?.params ?? {}) as Record<string, any>;
        const counters = scenario.availableCounters ?? [];

        const autoResolve = (picked: { handIndex: number; card: RawCard }, reason: string) => {
          aiLog.info('[counter:auto]', { against: targetEffect, pick: formatCardIdentifier(picked.card), reason });
          processedRef.current.add(key);
          const AUTO_COUNTER_DELAY = 650;
          timerRef.current = window.setTimeout(() => {
            clearRunningTask();
            actions.resolveCard(true, picked.card);
          }, AUTO_COUNTER_DELAY);
        };

        if (targetEffect === SkillEffect.InstantWin) {
          const pick = counters.find(opt => opt.card.effectId === SkillEffect.CounterRestoreBoard);
          if (pick) { autoResolve(pick, 'instant-win -> counter-restore-board'); return; }
        }
        if (targetEffect === SkillEffect.RemoveToShichahai) {
          const isBaseballImmune = String(targetParams.ignoreSeize ?? '').toLowerCase() === 'true';
          if (!isBaseballImmune) {
            const pick = counters.find(opt => opt.card.effectId === SkillEffect.CounterPreventRemoval);
            if (pick) { autoResolve(pick, 'remove-to-shichahai -> counter-prevent-removal'); return; }
          }
        }
        if (targetEffect === SkillEffect.FreezeOpponent) {
          const pick = counters.find(opt => opt.card.effectId === SkillEffect.CounterThaw);
          if (pick) { autoResolve(pick, 'freeze -> thaw'); return; }
        }
      }

      if (scenario.kind === 'stone') {
        const localSuggestion = scenario.localSuggestion ?? suggestLocalMove(scenario.game);
        cachedLocalSuggestion = localSuggestion ?? null;
        if (localSuggestion && shouldAutoplaySuggestion(localSuggestion)) {
          aiLog.info('[local:auto]', formatLocalSuggestion(localSuggestion));
          processedRef.current.add(key);
          const pos = { row: localSuggestion.row, col: localSuggestion.col };
          timerRef.current = window.setTimeout(() => {
            clearRunningTask();
            actions.placeStone(pos.row, pos.col);
          }, 520);
          return;
        }
      }

      const descriptor = getScenarioMeta(scenario.kind);
      let attempts = attemptsPerKeyRef.current.get(key) ?? 0;
      const schedule = (reason?: string) => {
        if (processedRef.current.has(key)) return;
        // 尝试次数上限：3 次
        if (attempts >= 3) {
          aiLog.warn(`[${scenarioPayload.kind}] 尝试超过 3 次，使用保底逻辑并标记完成`);
          processedRef.current.add(key);
          clearRunningTask(true, { reason: 'max-attempts' });
          fallbackDecision(scenarioPayload, gameState, actions, cachedLocalSuggestion);
          return;
        }

        attempts += 1;
        attemptsPerKeyRef.current.set(key, attempts);
        const baseDelay = (() => {
          switch (scenarioPayload.kind) {
            case 'counter_window':
              return 600;
            case 'skill':
              return 680;
            case 'stone':
              return 520;
            default:
              return 750;
          }
        })();
        const delay = reason ? 600 : baseDelay;
        cycleProgressMessage(scenarioPayload, descriptor.message, reason);
        aiLog.info(
          `[${scenarioPayload.kind}][attempt=${attempts}] ${descriptor.startLog}${reason ? `（原因：${reason}）` : ''}`
        );

        activeKeyRef.current = key;
        timerRef.current = window.setTimeout(async () => {
          if (activeKeyRef.current !== key) return;

          const feedbackMessage = reason;

          aiLog.info('[request_prepared]', {
            scenario: scenarioPayload.kind,
            attempt: attempts,
            feedback: feedbackMessage
          });

          const finalize = (extra?: { reason?: string }) => {
            processedRef.current.add(key);
            clearRunningTask(true, extra);
          };

          const rerun = (failReason: string) => {
            clearRunningTask(false);
            schedule(failReason);
          };

          const runFallback = () => {
            aiLog.warn(`[${scenarioPayload.kind}] 默认回退策略`);
            fallbackDecision(scenarioPayload, gameState, actions, cachedLocalSuggestion);
            finalize();
          };

          if (!hasValidSettings(aiSettings)) {
            aiLog.warn('AI 设置未配置，使用保底逻辑');
            runFallback();
            return;
          }

          try {
            const decision = await requestAiDecision(aiSettings, scenarioPayload, { feedback: feedbackMessage });
            aiLog.info('[response_json]', decision);
            const outcome = decision
              ? applyDecision(decision, scenarioPayload, gameState, actions)
              : { success: false, reason: '未提供有效决策' };
            if (!outcome.success) {
              const reasonText = outcome.reason ?? '技能执行失败，需要重新决策';
              aiLog.warn(reasonText);
              rerun(reasonText);
              return;
            }
            aiLog.info(descriptor.successLog(outcome.detail));
            finalize();
          } catch (err) {
            aiLog.error('决策调用失败', err);
            runFallback();
          }
        }, delay);
      };

      schedule();
    };

    if (!gameState.aiEnabled) {
      clearRunningTask();
      return;
    }

    const scenarios = deriveScenarios(gameState);
    if (scenarios.length === 0) {
      clearRunningTask();
      return;
    }

    const pickNext = (): { scenario: AiScenario; key: string } | null => {
      for (const scenario of scenarios) {
        const key = buildScenarioKey(scenario, gameState);
        if (!processedRef.current.has(key) && activeKeyRef.current !== key) {
          return { scenario, key };
        }
      }
      return null;
    };

    const next = pickNext();
    if (!next) {
      clearRunningTask();
      return;
    }

    if (activeKeyRef.current && activeKeyRef.current !== next.key) {
      clearRunningTask(false);
    }

    startScenario(next.scenario, next.key);

    return () => {
      clearRunningTask(false);
    };
  }, [gameState, aiSettings, playCard, placeStone, resolveCard, selectTarget, updateAiStatus]);

  useEffect(() => () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressTimerRef.current !== null) {
      window.clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);
};

export default useAIActions;
