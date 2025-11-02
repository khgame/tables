/**
 * AI智能路由决策器
 *
 * 功能:
 * - 根据场景复杂度和置信度选择最优策略
 * - 本地快速决策 vs 远程精确决策的智能选择
 * - 基于历史性能数据的动态调整
 * - 支持降级和容错机制
 */

import type { AiScenario, AiSettings } from './openAiClient';
import type { LocalMoveSuggestion } from './local';
import type { GameStatus } from '../types';
import { performanceMonitor } from './performance';
import { aiLog } from './logger';

// 路由策略类型
export type RoutingStrategy =
  | 'local-only'        // 仅使用本地引擎
  | 'remote-only'       // 仅使用远程API
  | 'local-then-remote' // 先本地再远程验证
  | 'smart-fallback';   // 智能降级

// 路由决策结果
export interface RoutingDecision {
  strategy: RoutingStrategy;
  reason: string;
  confidence: number;
  expectedLatency: number;
  fallbackStrategy?: RoutingStrategy;
}

// 场景复杂度评估
interface ScenarioComplexity {
  level: 'simple' | 'medium' | 'complex';
  factors: string[];
  score: number; // 0-100
}

// 路由配置
interface RoutingConfig {
  // 本地引擎信任阈值
  localConfidenceThreshold: number;
  localAutoPlayThreshold: number;

  // API调用控制
  maxApiLatency: number;
  apiSuccessRateThreshold: number;

  // 场景特定配置
  scenarioPreferences: Record<AiScenario['kind'], {
    defaultStrategy: RoutingStrategy;
    allowLocalOnly: boolean;
    maxComplexity: number;
  }>;

  // 性能阈值
  performanceThresholds: {
    fastResponse: number;    // 快速响应时间阈值(ms)
    slowResponse: number;    // 慢响应时间阈值(ms)
    highConfidence: number;  // 高置信度阈值
    lowConfidence: number;   // 低置信度阈值
  };
}

class SmartRouter {
  private config: RoutingConfig;

  constructor() {
    this.config = {
      localConfidenceThreshold: 0.85,
      localAutoPlayThreshold: 0.82,
      maxApiLatency: 8000, // 8秒最大延迟
      apiSuccessRateThreshold: 0.8,

      scenarioPreferences: {
        stone: {
          defaultStrategy: 'local-then-remote',
          allowLocalOnly: true,
          maxComplexity: 70
        },
        skill: {
          defaultStrategy: 'remote-only',
          allowLocalOnly: false,
          maxComplexity: 90
        },
        mulligan: {
          defaultStrategy: 'remote-only',
          allowLocalOnly: false,
          maxComplexity: 60
        },
        card_targeting: {
          defaultStrategy: 'remote-only',
          allowLocalOnly: false,
          maxComplexity: 80
        },
        counter_window: {
          defaultStrategy: 'smart-fallback',
          allowLocalOnly: true,
          maxComplexity: 75
        }
      },

      performanceThresholds: {
        fastResponse: 1000,
        slowResponse: 5000,
        highConfidence: 0.85,
        lowConfidence: 0.65
      }
    };
  }

  // 主要路由决策方法
  async makeRoutingDecision(
    scenario: AiScenario,
    aiSettings: AiSettings,
    localSuggestion?: LocalMoveSuggestion | null
  ): Promise<RoutingDecision> {
    const startTime = performance.now();

    // 1. 评估场景复杂度
    const complexity = this.assessScenarioComplexity(scenario);

    // 2. 评估本地建议质量
    const localQuality = this.assessLocalSuggestionQuality(localSuggestion);

    // 3. 检查API可用性和性能历史
    const apiHealth = this.assessApiHealth(scenario.kind);

    // 4. 获取场景偏好
    const preference = this.config.scenarioPreferences[scenario.kind];

    // 5. 综合决策
    const decision = this.computeOptimalStrategy(
      scenario.kind,
      complexity,
      localQuality,
      apiHealth,
      preference
    );

    const decisionTime = performance.now() - startTime;

    aiLog.info('[router:decision]', {
      scenario: scenario.kind,
      strategy: decision.strategy,
      reason: decision.reason,
      confidence: decision.confidence,
      decisionTime: `${decisionTime.toFixed(2)}ms`,
      complexity: complexity.level,
      localQuality: localQuality.quality
    });

    return decision;
  }

  // 评估场景复杂度
  private assessScenarioComplexity(scenario: AiScenario): ScenarioComplexity {
    const factors: string[] = [];
    let score = 0;

    switch (scenario.kind) {
      case 'stone':
        // 棋盘状态复杂度
        const moveCount = scenario.game?.board?.history?.length || 0;
        if (moveCount < 5) {
          factors.push('开局阶段');
          score += 20;
        } else if (moveCount < 20) {
          factors.push('中局阶段');
          score += 40;
        } else {
          factors.push('残局阶段');
          score += 60;
        }

        // 技能卡影响
        const activeSkills = scenario.game?.players?.WHITE?.hand?.length || 0;
        if (activeSkills > 3) {
          factors.push('多技能卡环境');
          score += 20;
        }

        // 禁手情况
        const hasBans = scenario.game?.players?.WHITE?.bannedCells?.length > 0;
        if (hasBans) {
          factors.push('存在禁手限制');
          score += 15;
        }
        break;

      case 'skill':
        // 可选技能数量
        const skillOptions = scenario.skills?.length || 0;
        score += Math.min(skillOptions * 10, 40);
        factors.push(`${skillOptions}个技能选择`);

        // 目标选择复杂度
        if (scenario.contextNote?.includes('目标')) {
          factors.push('需要选择目标');
          score += 25;
        }
        break;

      case 'counter_window':
        // 反击窗口时间敏感
        factors.push('时间敏感决策');
        score += 30;

        const counterOptions = scenario.availableCounters?.length || 0;
        score += Math.min(counterOptions * 15, 45);
        factors.push(`${counterOptions}个反击选择`);
        break;

      case 'mulligan':
        factors.push('开局调度');
        score += 30;
        break;

      case 'card_targeting':
        factors.push('目标选择');
        score += 40;
        break;
    }

    // 确定复杂度等级
    let level: ScenarioComplexity['level'];
    if (score <= 30) level = 'simple';
    else if (score <= 60) level = 'medium';
    else level = 'complex';

    return { level, factors, score };
  }

  // 评估本地建议质量
  private assessLocalSuggestionQuality(suggestion: LocalMoveSuggestion | null | undefined): {
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    confidence: number;
    autoPlayable: boolean;
  } {
    if (!suggestion) {
      return { quality: 'none', confidence: 0, autoPlayable: false };
    }

    const confidence = suggestion.confidence;
    const category = suggestion.category;

    // 基于类别判断质量
    const excellentCategories = ['win', 'block-win'];
    const goodCategories = ['open-four', 'block-open-four', 'double-threat'];
    const fairCategories = ['block-double-three', 'closed-four', 'block-three'];

    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (excellentCategories.includes(category)) {
      quality = 'excellent';
    } else if (goodCategories.includes(category)) {
      quality = 'good';
    } else if (fairCategories.includes(category)) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    // 置信度修正
    if (confidence >= this.config.performanceThresholds.highConfidence) {
      // 高置信度保持或提升质量
    } else if (confidence <= this.config.performanceThresholds.lowConfidence) {
      // 低置信度降级
      if (quality === 'excellent') quality = 'good';
      else if (quality === 'good') quality = 'fair';
      else if (quality === 'fair') quality = 'poor';
    }

    const autoPlayable = confidence >= this.config.localAutoPlayThreshold;

    return { quality, confidence, autoPlayable };
  }

  // 评估API健康状况
  private assessApiHealth(scenario: AiScenario['kind']): {
    available: boolean;
    successRate: number;
    avgLatency: number;
    recommendation: 'prefer' | 'neutral' | 'avoid';
  } {
    const metrics = performanceMonitor.getMetrics();
    const scenarioStats = metrics.apiCalls.byScenario[scenario];
    const overall = metrics.apiCalls;

    // 计算成功率
    const successRate = scenarioStats.total > 0
      ? scenarioStats.success / scenarioStats.total
      : overall.total > 0
        ? overall.success / overall.total
        : 1; // 默认假设可用

    // 获取延迟
    const avgLatency = scenarioStats.avgLatency || 0;

    // 判断可用性
    const available = successRate >= this.config.apiSuccessRateThreshold
                   && avgLatency <= this.config.maxApiLatency;

    // 推荐等级
    let recommendation: 'prefer' | 'neutral' | 'avoid';
    if (successRate >= 0.95 && avgLatency <= this.config.performanceThresholds.fastResponse) {
      recommendation = 'prefer';
    } else if (successRate >= this.config.apiSuccessRateThreshold && avgLatency <= this.config.performanceThresholds.slowResponse) {
      recommendation = 'neutral';
    } else {
      recommendation = 'avoid';
    }

    return { available, successRate, avgLatency, recommendation };
  }

  // 计算最优策略
  private computeOptimalStrategy(
    scenarioKind: AiScenario['kind'],
    complexity: ScenarioComplexity,
    localQuality: ReturnType<typeof this.assessLocalSuggestionQuality>,
    apiHealth: ReturnType<typeof this.assessApiHealth>,
    preference: RoutingConfig['scenarioPreferences'][AiScenario['kind']]
  ): RoutingDecision {
    const reasons: string[] = [];
    let strategy: RoutingStrategy = preference.defaultStrategy;
    let confidence = 0.5;
    let expectedLatency = 0;

    // 场景特定逻辑
    switch (scenarioKind) {
      case 'stone':
        return this.decideStoneStrategy(complexity, localQuality, apiHealth, reasons);

      case 'counter_window':
        return this.decideCounterStrategy(complexity, localQuality, apiHealth, reasons);

      case 'skill':
      case 'mulligan':
      case 'card_targeting':
        return this.decideComplexStrategy(scenarioKind, complexity, apiHealth, reasons);
    }

    return {
      strategy,
      reason: reasons.join('; '),
      confidence,
      expectedLatency
    };
  }

  // 落子决策专用逻辑
  private decideStoneStrategy(
    complexity: ScenarioComplexity,
    localQuality: ReturnType<typeof this.assessLocalSuggestionQuality>,
    apiHealth: ReturnType<typeof this.assessApiHealth>,
    reasons: string[]
  ): RoutingDecision {
    // 本地建议质量极高 -> 仅本地
    if (localQuality.quality === 'excellent' && localQuality.autoPlayable) {
      reasons.push(`本地建议质量极高(${localQuality.confidence.toFixed(2)})`);
      return {
        strategy: 'local-only',
        reason: reasons.join('; '),
        confidence: 0.9,
        expectedLatency: 5,
        fallbackStrategy: 'remote-only'
      };
    }

    // API不可用或性能差 -> 仅本地
    if (!apiHealth.available || apiHealth.recommendation === 'avoid') {
      reasons.push(`API不可用或性能差(成功率${(apiHealth.successRate * 100).toFixed(1)}%)`);
      return {
        strategy: 'local-only',
        reason: reasons.join('; '),
        confidence: 0.7,
        expectedLatency: 5
      };
    }

    // 简单场景且本地建议不错 -> 仅本地
    if (complexity.level === 'simple' && localQuality.quality === 'good') {
      reasons.push('简单场景，本地建议质量良好');
      return {
        strategy: 'local-only',
        reason: reasons.join('; '),
        confidence: 0.8,
        expectedLatency: 5,
        fallbackStrategy: 'remote-only'
      };
    }

    // 复杂场景或本地建议质量一般 -> 混合策略
    if (complexity.level === 'complex' || localQuality.quality === 'fair') {
      reasons.push(`复杂度${complexity.level}，本地建议质量${localQuality.quality}`);
      return {
        strategy: 'local-then-remote',
        reason: reasons.join('; '),
        confidence: 0.85,
        expectedLatency: apiHealth.avgLatency + 50,
        fallbackStrategy: 'local-only'
      };
    }

    // 默认混合策略
    reasons.push('标准混合决策');
    return {
      strategy: 'local-then-remote',
      reason: reasons.join('; '),
      confidence: 0.75,
      expectedLatency: apiHealth.avgLatency + 30,
      fallbackStrategy: 'local-only'
    };
  }

  // 反击窗口决策逻辑
  private decideCounterStrategy(
    complexity: ScenarioComplexity,
    localQuality: ReturnType<typeof this.assessLocalSuggestionQuality>,
    apiHealth: ReturnType<typeof this.assessApiHealth>,
    reasons: string[]
  ): RoutingDecision {
    // 时间敏感，优先考虑速度
    if (apiHealth.avgLatency > this.config.performanceThresholds.slowResponse) {
      reasons.push(`API延迟过高(${apiHealth.avgLatency.toFixed(0)}ms)，时间敏感场景优先本地`);
      return {
        strategy: 'local-only',
        reason: reasons.join('; '),
        confidence: 0.7,
        expectedLatency: 10
      };
    }

    // API快速且可靠
    if (apiHealth.recommendation === 'prefer') {
      reasons.push('API性能良好且反击决策需要精确判断');
      return {
        strategy: 'remote-only',
        reason: reasons.join('; '),
        confidence: 0.85,
        expectedLatency: apiHealth.avgLatency,
        fallbackStrategy: 'local-only'
      };
    }

    // 折中方案
    reasons.push('混合策略平衡速度和准确性');
    return {
      strategy: 'smart-fallback',
      reason: reasons.join('; '),
      confidence: 0.75,
      expectedLatency: Math.min(apiHealth.avgLatency, this.config.performanceThresholds.fastResponse),
      fallbackStrategy: 'local-only'
    };
  }

  // 复杂场景决策逻辑
  private decideComplexStrategy(
    scenarioKind: Exclude<AiScenario['kind'], 'stone' | 'counter_window'>,
    complexity: ScenarioComplexity,
    apiHealth: ReturnType<typeof this.assessApiHealth>,
    reasons: string[]
  ): RoutingDecision {
    // 这些场景通常需要远程API的逻辑推理能力
    if (!apiHealth.available) {
      reasons.push('API不可用，但此场景需要复杂推理');
      return {
        strategy: 'local-only', // 降级到本地，但置信度低
        reason: reasons.join('; '),
        confidence: 0.3,
        expectedLatency: 10
      };
    }

    reasons.push(`${scenarioKind}场景需要复杂逻辑推理`);
    return {
      strategy: 'remote-only',
      reason: reasons.join('; '),
      confidence: 0.9,
      expectedLatency: apiHealth.avgLatency,
      fallbackStrategy: 'local-only'
    };
  }

  // 更新配置
  updateConfig(updates: Partial<RoutingConfig>) {
    this.config = { ...this.config, ...updates };
    aiLog.info('[router:config_updated]', updates);
  }

  // 获取当前配置
  getConfig(): RoutingConfig {
    return { ...this.config };
  }
}

// 全局智能路由实例
export const smartRouter = new SmartRouter();

// 工具函数：简化的路由决策接口
export async function decideAiStrategy(
  scenario: AiScenario,
  aiSettings: AiSettings,
  localSuggestion?: LocalMoveSuggestion | null
): Promise<RoutingDecision> {
  return smartRouter.makeRoutingDecision(scenario, aiSettings, localSuggestion);
}

// 在开发环境下暴露到全局
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).aiRouter = {
    router: smartRouter,
    decide: decideAiStrategy
  };
}