/**
 * AI性能监控模块
 *
 * 功能:
 * - 监控API调用延迟和成功率
 * - 监控本地引擎性能
 * - 收集决策时间分布
 * - 提供性能指标统计
 */

import { aiLog } from './logger';
import type { AiScenario } from './openAiClient';
import type { LocalMoveSuggestion } from './local';

// 性能指标类型定义
export interface PerformanceMetrics {
  // API相关指标
  apiCalls: {
    total: number;
    success: number;
    timeout: number;
    error: number;
    byScenario: Record<AiScenario['kind'], {
      total: number;
      success: number;
      avgLatency: number;
      maxLatency: number;
      minLatency: number;
    }>;
  };

  // 本地引擎指标
  localEngine: {
    totalCalls: number;
    avgCandidateCount: number;
    avgEvaluationTime: number;
    maxEvaluationTime: number;
    autoPlayCount: number;
    confidenceDistribution: Record<string, number>; // 置信度区间分布
  };

  // 智能路由指标
  routing: {
    localOnly: number;
    remoteOnly: number;
    localThenRemote: number;
    totalRoutingDecisions: number;
  };

  // 时间戳
  sessionStartTime: number;
  lastResetTime: number;
}

// 单次调用的性能追踪
export interface PerformanceTrace {
  id: string;
  scenario: AiScenario['kind'];
  startTime: number;
  endTime?: number;
  phase: 'local' | 'remote' | 'routing' | 'complete';

  // 本地引擎数据
  localMetrics?: {
    candidateCount: number;
    evaluationTime: number;
    suggestion: LocalMoveSuggestion | null;
    autoPlayed: boolean;
  };

  // 远程API数据
  remoteMetrics?: {
    latency: number;
    success: boolean;
    errorType?: 'timeout' | 'network' | 'parse' | 'validation';
    retryCount: number;
  };

  // 路由决策
  routingDecision?: {
    strategy: 'local-only' | 'remote-only' | 'local-then-remote' | 'smart-fallback';
    reason: string;
    confidence: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private activeTraces: Map<string, PerformanceTrace> = new Map();
  private traceHistory: PerformanceTrace[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.metrics = this.createEmptyMetrics();
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      apiCalls: {
        total: 0,
        success: 0,
        timeout: 0,
        error: 0,
        byScenario: {
          stone: { total: 0, success: 0, avgLatency: 0, maxLatency: 0, minLatency: Infinity },
          skill: { total: 0, success: 0, avgLatency: 0, maxLatency: 0, minLatency: Infinity },
          mulligan: { total: 0, success: 0, avgLatency: 0, maxLatency: 0, minLatency: Infinity },
          card_targeting: { total: 0, success: 0, avgLatency: 0, maxLatency: 0, minLatency: Infinity },
          counter_window: { total: 0, success: 0, avgLatency: 0, maxLatency: 0, minLatency: Infinity }
        }
      },
      localEngine: {
        totalCalls: 0,
        avgCandidateCount: 0,
        avgEvaluationTime: 0,
        maxEvaluationTime: 0,
        autoPlayCount: 0,
        confidenceDistribution: {}
      },
      routing: {
        localOnly: 0,
        remoteOnly: 0,
        localThenRemote: 0,
        totalRoutingDecisions: 0
      },
      sessionStartTime: Date.now(),
      lastResetTime: Date.now()
    };
  }

  // 开始一个新的性能追踪
  startTrace(scenario: AiScenario['kind']): string {
    const id = `${scenario}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trace: PerformanceTrace = {
      id,
      scenario,
      startTime: performance.now(),
      phase: 'routing'
    };

    this.activeTraces.set(id, trace);
    aiLog.info('[perf:trace_start]', { id, scenario });
    return id;
  }

  // 记录路由决策
  recordRoutingDecision(traceId: string, decision: PerformanceTrace['routingDecision']) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    trace.routingDecision = decision;
    trace.phase = 'routing';

    // 更新路由统计
    this.metrics.routing.totalRoutingDecisions++;
    switch (decision?.strategy) {
      case 'local-only':
        this.metrics.routing.localOnly++;
        break;
      case 'remote-only':
        this.metrics.routing.remoteOnly++;
        break;
      case 'local-then-remote':
        this.metrics.routing.localThenRemote++;
        break;
    }

    aiLog.info('[perf:routing]', { traceId, decision });
  }

  // 记录本地引擎性能
  recordLocalMetrics(traceId: string, metrics: PerformanceTrace['localMetrics']) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    trace.localMetrics = metrics;
    trace.phase = 'local';

    // 更新本地引擎统计
    const local = this.metrics.localEngine;
    local.totalCalls++;

    if (metrics) {
      // 候选点数量统计
      const newAvgCandidates = (local.avgCandidateCount * (local.totalCalls - 1) + metrics.candidateCount) / local.totalCalls;
      local.avgCandidateCount = newAvgCandidates;

      // 评估时间统计
      const newAvgTime = (local.avgEvaluationTime * (local.totalCalls - 1) + metrics.evaluationTime) / local.totalCalls;
      local.avgEvaluationTime = newAvgTime;
      local.maxEvaluationTime = Math.max(local.maxEvaluationTime, metrics.evaluationTime);

      // 自动执行统计
      if (metrics.autoPlayed) {
        local.autoPlayCount++;
      }

      // 置信度分布统计
      if (metrics.suggestion) {
        const confidenceRange = this.getConfidenceRange(metrics.suggestion.confidence);
        local.confidenceDistribution[confidenceRange] = (local.confidenceDistribution[confidenceRange] || 0) + 1;
      }
    }

    aiLog.info('[perf:local]', { traceId, metrics });
  }

  // 记录远程API性能
  recordRemoteMetrics(traceId: string, metrics: PerformanceTrace['remoteMetrics']) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    trace.remoteMetrics = metrics;
    trace.phase = 'remote';

    // 更新API统计
    const api = this.metrics.apiCalls;
    api.total++;

    if (metrics?.success) {
      api.success++;
    } else if (metrics?.errorType === 'timeout') {
      api.timeout++;
    } else {
      api.error++;
    }

    // 按场景统计
    const scenarioStats = api.byScenario[trace.scenario];
    scenarioStats.total++;

    if (metrics?.success) {
      scenarioStats.success++;

      // 延迟统计
      if (metrics.latency) {
        const total = scenarioStats.total;
        const newAvg = (scenarioStats.avgLatency * (total - 1) + metrics.latency) / total;
        scenarioStats.avgLatency = newAvg;
        scenarioStats.maxLatency = Math.max(scenarioStats.maxLatency, metrics.latency);
        scenarioStats.minLatency = Math.min(scenarioStats.minLatency, metrics.latency);
      }
    }

    aiLog.info('[perf:remote]', { traceId, metrics });
  }

  // 完成追踪
  finishTrace(traceId: string) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    trace.endTime = performance.now();
    trace.phase = 'complete';

    // 移到历史记录
    this.traceHistory.push({ ...trace });
    if (this.traceHistory.length > this.maxHistorySize) {
      this.traceHistory.shift();
    }

    this.activeTraces.delete(traceId);

    const totalTime = trace.endTime - trace.startTime;
    aiLog.info('[perf:trace_finish]', {
      traceId,
      totalTime: `${totalTime.toFixed(2)}ms`,
      scenario: trace.scenario
    });
  }

  // 获取当前性能指标
  getMetrics(): PerformanceMetrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  // 获取追踪历史
  getTraceHistory(): PerformanceTrace[] {
    return [...this.traceHistory];
  }

  // 获取性能报告
  getPerformanceReport(): string {
    const report = [];
    const metrics = this.metrics;
    const sessionDuration = (Date.now() - metrics.sessionStartTime) / 1000;

    report.push('=== AI性能监控报告 ===');
    report.push(`会话时长: ${sessionDuration.toFixed(1)}秒`);
    report.push('');

    // API性能
    report.push('📡 API调用统计:');
    const api = metrics.apiCalls;
    const successRate = api.total > 0 ? (api.success / api.total * 100).toFixed(1) : '0';
    report.push(`  总调用: ${api.total}, 成功: ${api.success} (${successRate}%)`);
    report.push(`  超时: ${api.timeout}, 错误: ${api.error}`);

    report.push('  按场景统计:');
    Object.entries(api.byScenario).forEach(([scenario, stats]) => {
      if (stats.total > 0) {
        const rate = (stats.success / stats.total * 100).toFixed(1);
        const avgLatency = stats.avgLatency.toFixed(0);
        report.push(`    ${scenario}: ${stats.success}/${stats.total} (${rate}%) 平均${avgLatency}ms`);
      }
    });
    report.push('');

    // 本地引擎性能
    report.push('🔧 本地引擎统计:');
    const local = metrics.localEngine;
    report.push(`  总调用: ${local.totalCalls}, 自动执行: ${local.autoPlayCount}`);
    report.push(`  平均候选点: ${local.avgCandidateCount.toFixed(1)}`);
    report.push(`  平均评估时间: ${local.avgEvaluationTime.toFixed(2)}ms`);
    report.push(`  最大评估时间: ${local.maxEvaluationTime.toFixed(2)}ms`);

    if (Object.keys(local.confidenceDistribution).length > 0) {
      report.push('  置信度分布:');
      Object.entries(local.confidenceDistribution)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([range, count]) => {
          report.push(`    ${range}: ${count}次`);
        });
    }
    report.push('');

    // 智能路由统计
    report.push('🧠 智能路由统计:');
    const routing = metrics.routing;
    if (routing.totalRoutingDecisions > 0) {
      const localOnlyPct = (routing.localOnly / routing.totalRoutingDecisions * 100).toFixed(1);
      const remotePct = (routing.remoteOnly / routing.totalRoutingDecisions * 100).toFixed(1);
      const hybridPct = (routing.localThenRemote / routing.totalRoutingDecisions * 100).toFixed(1);

      report.push(`  总决策: ${routing.totalRoutingDecisions}`);
      report.push(`  仅本地: ${routing.localOnly} (${localOnlyPct}%)`);
      report.push(`  仅远程: ${routing.remoteOnly} (${remotePct}%)`);
      report.push(`  混合: ${routing.localThenRemote} (${hybridPct}%)`);
    } else {
      report.push('  暂无路由决策数据');
    }

    return report.join('\n');
  }

  // 重置统计
  reset() {
    this.metrics = this.createEmptyMetrics();
    this.activeTraces.clear();
    this.traceHistory = [];
    aiLog.info('[perf:reset]', 'Performance metrics reset');
  }

  // 私有辅助方法
  private getConfidenceRange(confidence: number): string {
    if (confidence >= 0.9) return '0.90-1.00';
    if (confidence >= 0.8) return '0.80-0.89';
    if (confidence >= 0.7) return '0.70-0.79';
    if (confidence >= 0.6) return '0.60-0.69';
    return '0.00-0.59';
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 导出工具函数
export const logPerformanceReport = () => {
  const report = performanceMonitor.getPerformanceReport();
  aiLog.info('[perf:report]', '\n' + report);
  console.log(report);
};

// 在开发环境下暴露到全局
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).aiPerformance = {
    monitor: performanceMonitor,
    report: logPerformanceReport,
    reset: () => performanceMonitor.reset()
  };
}