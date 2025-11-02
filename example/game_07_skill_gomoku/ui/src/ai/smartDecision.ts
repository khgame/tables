/**
 * 智能AI决策统一接口
 *
 * 集成了智能路由、性能监控和错误处理的完整AI决策系统
 */

import type { AiScenario, AiSettings, AiDecision } from './openAiClient';
import { requestAiDecision } from './openAiClient';
import type { LocalMoveSuggestion } from './local';
import { suggestLocalMove, shouldAutoplaySuggestion } from './local';
import { smartRouter, type RoutingDecision } from './smartRouter';
import { performanceMonitor } from './performance';
import { aiLog } from './logger';
import type { GameStatus } from '../types';

// 决策结果类型
export interface SmartAiDecisionResult {
  decision: AiDecision | null;
  source: 'local' | 'remote' | 'fallback';
  routing: RoutingDecision;
  performance: {
    totalTime: number;
    localTime?: number;
    remoteTime?: number;
    routingTime: number;
  };
  localSuggestion?: LocalMoveSuggestion | null;
  error?: string;
}

// 决策选项
export interface SmartAiDecisionOptions {
  // 超时设置
  timeout?: number;
  // 是否允许本地回退
  allowLocalFallback?: boolean;
  // 强制策略（用于测试）
  forceStrategy?: RoutingDecision['strategy'];
  // 反馈信息
  feedback?: string;
}

/**
 * 智能AI决策主函数
 *
 * 根据场景智能选择本地/远程决策，包含完整的性能监控和错误处理
 */
export async function makeSmartAiDecision(
  scenario: AiScenario,
  aiSettings: AiSettings,
  options: SmartAiDecisionOptions = {}
): Promise<SmartAiDecisionResult> {
  const startTime = performance.now();
  const traceId = performanceMonitor.startTrace(scenario.kind);

  let localSuggestion: LocalMoveSuggestion | null = null;
  let routing: RoutingDecision;
  let decision: AiDecision | null = null;
  let source: SmartAiDecisionResult['source'] = 'remote';
  let error: string | undefined;

  try {
    // 1. 对于落子场景，先获取本地建议
    if (scenario.kind === 'stone') {
      const localStart = performance.now();

      try {
        localSuggestion = suggestLocalMove(scenario.game);
        const localTime = performance.now() - localStart;

        // 记录本地引擎性能 (从控制台获取详细数据)
        const candidateCount = scenario.game.board.history.length > 0
          ? Math.min(25, scenario.game.board.history.length * 5) // 估算候选点数
          : 1;

        performanceMonitor.recordLocalMetrics(traceId, {
          candidateCount,
          evaluationTime: localTime,
          suggestion: localSuggestion,
          autoPlayed: localSuggestion ? shouldAutoplaySuggestion(localSuggestion) : false
        });

        aiLog.info('[smart_ai:local_suggestion]', {
          traceId,
          suggestion: localSuggestion ? {
            row: localSuggestion.row,
            col: localSuggestion.col,
            confidence: localSuggestion.confidence,
            category: localSuggestion.category
          } : null,
          evaluationTime: `${localTime.toFixed(2)}ms`
        });

      } catch (localError) {
        aiLog.warn('[smart_ai:local_error]', { traceId, error: localError });
      }
    }

    // 2. 智能路由决策
    const routingStart = performance.now();

    routing = options.forceStrategy
      ? {
          strategy: options.forceStrategy,
          reason: '强制指定策略',
          confidence: 1.0,
          expectedLatency: 0
        }
      : await smartRouter.makeRoutingDecision(scenario, aiSettings, localSuggestion);

    const routingTime = performance.now() - routingStart;

    // 记录路由决策
    performanceMonitor.recordRoutingDecision(traceId, routing);

    aiLog.info('[smart_ai:routing_decision]', {
      traceId,
      strategy: routing.strategy,
      confidence: routing.confidence,
      reason: routing.reason,
      expectedLatency: routing.expectedLatency
    });

    // 3. 根据路由策略执行决策
    switch (routing.strategy) {
      case 'local-only':
        decision = await executeLocalOnlyStrategy(scenario, localSuggestion, traceId);
        source = 'local';
        break;

      case 'remote-only':
        decision = await executeRemoteOnlyStrategy(scenario, aiSettings, options, traceId);
        source = 'remote';
        break;

      case 'local-then-remote':
        decision = await executeLocalThenRemoteStrategy(scenario, aiSettings, localSuggestion, options, traceId);
        source = decision ? 'remote' : 'local'; // 根据实际使用的决策源
        break;

      case 'smart-fallback':
        decision = await executeSmartFallbackStrategy(scenario, aiSettings, localSuggestion, options, traceId);
        source = decision ? 'remote' : 'local';
        break;
    }

    // 4. 如果没有决策且允许本地回退，尝试本地决策
    if (!decision && options.allowLocalFallback !== false && localSuggestion) {
      aiLog.info('[smart_ai:fallback_to_local]', { traceId });
      decision = convertLocalSuggestionToDecision(localSuggestion);
      source = 'fallback';
    }

  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    aiLog.error('[smart_ai:error]', { traceId, error });

    // 错误情况下的本地回退
    if (options.allowLocalFallback !== false && localSuggestion) {
      decision = convertLocalSuggestionToDecision(localSuggestion);
      source = 'fallback';
    }
  }

  // 5. 完成性能追踪
  const totalTime = performance.now() - startTime;
  performanceMonitor.finishTrace(traceId);

  const result: SmartAiDecisionResult = {
    decision,
    source,
    routing: routing!,
    performance: {
      totalTime,
      routingTime: routingTime!
    },
    localSuggestion,
    error
  };

  aiLog.info('[smart_ai:result]', {
    traceId,
    hasDecision: !!decision,
    source,
    totalTime: `${totalTime.toFixed(2)}ms`,
    strategy: routing?.strategy
  });

  return result;
}

// 仅本地策略执行
async function executeLocalOnlyStrategy(
  scenario: AiScenario,
  localSuggestion: LocalMoveSuggestion | null,
  traceId: string
): Promise<AiDecision | null> {
  if (scenario.kind === 'stone' && localSuggestion) {
    return convertLocalSuggestionToDecision(localSuggestion);
  }

  // 非落子场景的本地决策（简化实现）
  aiLog.warn('[smart_ai:local_only_limited]', {
    traceId,
    scenario: scenario.kind,
    message: '本地引擎对此场景支持有限'
  });

  return null;
}

// 仅远程策略执行
async function executeRemoteOnlyStrategy(
  scenario: AiScenario,
  aiSettings: AiSettings,
  options: SmartAiDecisionOptions,
  traceId: string
): Promise<AiDecision | null> {
  const remoteStart = performance.now();

  try {
    const decision = await requestAiDecision(aiSettings, scenario, {
      feedback: options.feedback
    });

    const remoteTime = performance.now() - remoteStart;

    // 记录远程API性能
    performanceMonitor.recordRemoteMetrics(traceId, {
      latency: remoteTime,
      success: !!decision,
      retryCount: 0
    });

    return decision;

  } catch (error) {
    const remoteTime = performance.now() - remoteStart;

    // 记录失败的远程API调用
    performanceMonitor.recordRemoteMetrics(traceId, {
      latency: remoteTime,
      success: false,
      errorType: error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'network',
      retryCount: 0
    });

    throw error;
  }
}

// 本地后远程策略执行
async function executeLocalThenRemoteStrategy(
  scenario: AiScenario,
  aiSettings: AiSettings,
  localSuggestion: LocalMoveSuggestion | null,
  options: SmartAiDecisionOptions,
  traceId: string
): Promise<AiDecision | null> {
  // 如果本地建议质量很高且可以自动执行，直接使用
  if (scenario.kind === 'stone' && localSuggestion && shouldAutoplaySuggestion(localSuggestion)) {
    aiLog.info('[smart_ai:local_autoplay]', {
      traceId,
      confidence: localSuggestion.confidence,
      category: localSuggestion.category
    });
    return convertLocalSuggestionToDecision(localSuggestion);
  }

  // 否则尝试远程决策
  try {
    return await executeRemoteOnlyStrategy(scenario, aiSettings, options, traceId);
  } catch (error) {
    // 远程失败，回退到本地
    aiLog.info('[smart_ai:remote_failed_fallback_local]', { traceId, error });

    if (scenario.kind === 'stone' && localSuggestion) {
      return convertLocalSuggestionToDecision(localSuggestion);
    }

    return null;
  }
}

// 智能回退策略执行
async function executeSmartFallbackStrategy(
  scenario: AiScenario,
  aiSettings: AiSettings,
  localSuggestion: LocalMoveSuggestion | null,
  options: SmartAiDecisionOptions,
  traceId: string
): Promise<AiDecision | null> {
  // 设置较短的超时时间
  const shortTimeout = Math.min(options.timeout || 5000, 3000);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Smart fallback timeout')), shortTimeout);
  });

  try {
    // 竞争执行：远程API vs 超时
    const decision = await Promise.race([
      executeRemoteOnlyStrategy(scenario, aiSettings, options, traceId),
      timeoutPromise
    ]);

    return decision;

  } catch (error) {
    // 超时或失败，使用本地决策
    aiLog.info('[smart_ai:fallback_timeout]', { traceId, timeout: shortTimeout });

    if (scenario.kind === 'stone' && localSuggestion) {
      return convertLocalSuggestionToDecision(localSuggestion);
    }

    return null;
  }
}

// 将本地建议转换为AI决策
function convertLocalSuggestionToDecision(suggestion: LocalMoveSuggestion): AiDecision {
  return {
    kind: 'place_stone',
    row: suggestion.row,
    col: suggestion.col
  };
}

// 简化的调用接口（保持向后兼容）
export async function requestSmartAiDecision(
  aiSettings: AiSettings,
  scenario: AiScenario,
  options?: { feedback?: string }
): Promise<AiDecision | null> {
  const result = await makeSmartAiDecision(scenario, aiSettings, {
    feedback: options?.feedback,
    allowLocalFallback: true
  });

  return result.decision;
}