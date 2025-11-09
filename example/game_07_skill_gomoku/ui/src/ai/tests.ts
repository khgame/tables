/**
 * 智能路由和性能监控测试
 *
 * 用于验证新功能的正确性和性能
 */

import { performanceMonitor, logPerformanceReport } from '../ai/performance';
import { smartRouter } from '../ai/smartRouter';
import { makeSmartAiDecision } from '../ai/smartDecision';
import type { AiScenario, AiSettings } from '../ai/openAiClient';
import type { GameStatus } from '../types';
import { PlayerEnum } from '../core/constants';

// 模拟的游戏状态
const mockGameState: Partial<GameStatus> = {
  board: {
    size: 15,
    history: [
      { player: PlayerEnum.BLACK, row: 7, col: 7 },
      { player: PlayerEnum.WHITE, row: 8, col: 8 }
    ],
    get: (row: number, col: number) => {
      if (row === 7 && col === 7) return PlayerEnum.BLACK;
      if (row === 8 && col === 8) return PlayerEnum.WHITE;
      return null;
    },
    forEachCell: (callback: (row: number, col: number, value: any) => void) => {
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          const value = (r === 7 && c === 7) ? PlayerEnum.BLACK
                       : (r === 8 && c === 8) ? PlayerEnum.WHITE
                       : null;
          callback(r, c, value);
        }
      }
    }
  } as any,
  hands: [[], []],
  statuses: {
    sealedCells: { [PlayerEnum.WHITE]: null, [PlayerEnum.BLACK]: null }
  } as any,
  turnCount: 2
};

// 模拟的AI设置
const mockAiSettings: AiSettings = {
  endpoint: 'http://localhost:3000/api/ai',
  apiKey: 'test-key',
  reasoningModel: 'gpt-4',
  fastModel: 'gpt-3.5-turbo'
};

// 测试函数
export async function testSmartRouting() {
  console.log('🧪 开始测试智能路由和性能监控');

  // 重置性能监控
  performanceMonitor.reset();

  try {
    // 测试1: 简单落子场景
    console.log('\n📍 测试1: 简单落子场景');
    const stoneScenario: AiScenario = {
      kind: 'stone',
      player: PlayerEnum.WHITE,
      game: mockGameState as GameStatus
    };

    const result1 = await makeSmartAiDecision(stoneScenario, mockAiSettings, {
      forceStrategy: 'local-only', // 强制本地策略用于测试
      timeout: 1000
    });

    console.log('结果1:', {
      hasDecision: !!result1.decision,
      source: result1.source,
      strategy: result1.routing.strategy,
      totalTime: `${result1.performance.totalTime.toFixed(2)}ms`
    });

    // 测试2: 技能场景（会路由到远程）
    console.log('\n🎴 测试2: 技能场景');
    const skillScenario: AiScenario = {
      kind: 'skill',
      player: PlayerEnum.WHITE,
      game: mockGameState as GameStatus,
      skills: [
        { handIndex: 0, card: { id: 'test-skill', name: '测试技能' } as any }
      ]
    };

    const result2 = await makeSmartAiDecision(skillScenario, mockAiSettings, {
      forceStrategy: 'remote-only',
      timeout: 2000,
      allowLocalFallback: true
    });

    console.log('结果2:', {
      hasDecision: !!result2.decision,
      source: result2.source,
      strategy: result2.routing.strategy,
      totalTime: `${result2.performance.totalTime.toFixed(2)}ms`,
      error: result2.error
    });

    // 测试3: 智能回退策略
    console.log('\n⚡ 测试3: 智能回退策略');
    const result3 = await makeSmartAiDecision(stoneScenario, mockAiSettings, {
      forceStrategy: 'smart-fallback',
      timeout: 500 // 很短的超时，测试回退
    });

    console.log('结果3:', {
      hasDecision: !!result3.decision,
      source: result3.source,
      strategy: result3.routing.strategy,
      totalTime: `${result3.performance.totalTime.toFixed(2)}ms`
    });

    // 测试4: 路由决策分析
    console.log('\n🧠 测试4: 路由决策分析');
    const routingDecision = await smartRouter.makeRoutingDecision(
      stoneScenario,
      mockAiSettings
    );

    console.log('路由决策:', {
      strategy: routingDecision.strategy,
      confidence: routingDecision.confidence,
      reason: routingDecision.reason,
      expectedLatency: routingDecision.expectedLatency
    });

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }

  // 输出性能报告
  console.log('\n📊 性能监控报告:');
  logPerformanceReport();

  console.log('\n✅ 智能路由和性能监控测试完成');
}

// 压力测试
export async function stressTestSmartRouting() {
  console.log('🔥 开始压力测试');

  performanceMonitor.reset();
  const startTime = Date.now();

  const promises = [];
  const testCount = 10;

  for (let i = 0; i < testCount; i++) {
    const scenario: AiScenario = {
      kind: 'stone',
      player: PlayerEnum.WHITE,
      game: mockGameState as GameStatus
    };

    promises.push(
      makeSmartAiDecision(scenario, mockAiSettings, {
        forceStrategy: i % 2 === 0 ? 'local-only' : 'local-then-remote',
        timeout: 1000
      })
    );
  }

  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();

    console.log(`\n📈 压力测试结果 (${testCount} 次并发调用):`);
    console.log(`总耗时: ${endTime - startTime}ms`);
    console.log(`成功率: ${results.filter(r => r.decision).length}/${testCount}`);

    const sources = results.reduce((acc, r) => {
      acc[r.source] = (acc[r.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('决策源分布:', sources);

    // 输出详细性能报告
    console.log('\n📊 压力测试性能报告:');
    logPerformanceReport();

  } catch (error) {
    console.error('❌ 压力测试失败:', error);
  }
}

// 在开发环境下暴露测试函数
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).aiTests = {
    testSmartRouting,
    stressTestSmartRouting,
    performance: performanceMonitor,
    router: smartRouter
  };

  console.log('🔧 AI测试工具已加载到 window.aiTests');
  console.log('使用方法:');
  console.log('- window.aiTests.testSmartRouting() // 基础功能测试');
  console.log('- window.aiTests.stressTestSmartRouting() // 压力测试');
  console.log('- window.aiTests.performance.getPerformanceReport() // 查看性能报告');
}
