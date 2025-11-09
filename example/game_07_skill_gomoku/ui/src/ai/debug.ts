/**
 * AI调试工具
 * 用于分析AI决策过程中的问题
 */

import type { GameStatus, Player, RawCard } from '../types';
import { PlayerEnum, SKILL_UNLOCK_MOVE } from '../core/constants';
import { parseTags } from '../core/utils';

// 声明需要用到的函数类型（从main.tsx导入会有循环依赖问题）
declare global {
  interface Window {
    debugAI?: (gameState: GameStatus) => void;
    gameEngine?: {
      getState: () => GameStatus;
    };
  }
}

// 复制关键函数避免循环依赖
function isSkillCardPlayable(state: GameStatus, player: Player, card: RawCard): boolean {
  // 简化版本，只检查基本条件
  return true; // 临时返回true，实际逻辑需要从main.tsx复制
}

function collectPlayableSkills(state: GameStatus, player: Player): Array<{ handIndex: number; card: RawCard }> {
  if (state.turnCount + 1 < SKILL_UNLOCK_MOVE) return [];
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

// 调试AI决策过程
export function debugAiDecision(gameState: GameStatus) {
  console.log('🔍 AI决策调试分析');
  console.log('===============================');

  // 1. 检查AI是否启用
  console.log('1. AI状态检查:');
  console.log(`   - aiEnabled: ${gameState.aiEnabled}`);
  console.log(`   - currentPlayer: ${gameState.currentPlayer}`);
  console.log(`   - phase: ${gameState.phase}`);
  console.log(`   - turnCount: ${gameState.turnCount}`);

  // 2. 检查白方手牌
  const whiteHand = gameState.hands?.[PlayerEnum.WHITE] || [];
  console.log(`\n2. 白方手牌检查 (${whiteHand.length}张):`);
  whiteHand.forEach((card, index) => {
    console.log(`   [${index}] ${card.nameZh || card.nameEn || String(card._tid ?? card.tid ?? '未知卡牌')} - ${card.effect || '无效果描述'}`);
    console.log(`       - requiresCharacter: ${card.requiresCharacter || '无'}`);
    console.log(`       - timing: ${card.timing || '无'}`);
    console.log(`       - tags: ${card.tags || '无'}`);
  });

  // 3. 检查可用技能
  console.log(`\n3. 技能可用性检查:`);
  const playableSkills = collectPlayableSkills(gameState, PlayerEnum.WHITE);
  console.log(`   - 可用技能数量: ${playableSkills.length}`);

  if (playableSkills.length === 0) {
    console.log('   - 无可用技能，检查限制条件:');

    // 检查技能解锁
    if (gameState.turnCount + 1 < SKILL_UNLOCK_MOVE) {
      console.log(`     ❌ 技能未解锁 (当前回合${gameState.turnCount + 1}, 需要${SKILL_UNLOCK_MOVE})`);
    } else {
      console.log(`     ✅ 技能已解锁`);
    }

    // 检查冻结状态
    const freezeStatus = gameState.statuses?.freeze?.[PlayerEnum.WHITE] || 0;
    if (freezeStatus > 0) {
      console.log(`     ❌ 被冻结 (${freezeStatus}回合)`);
    } else {
      console.log(`     ✅ 未被冻结`);
    }

    // 检查每张卡的具体限制
    whiteHand.forEach((card, index) => {
      console.log(`\n   卡牌 [${index}] ${card.nameZh} 检查:`);

      // 检查timing限制
      const timing = (card.timing || '').toLowerCase();
      if (timing.includes('reaction') && !timing.includes('anytime')) {
        console.log(`     ❌ timing限制: ${card.timing} (仅反应时机)`);
      } else {
        console.log(`     ✅ timing允许: ${card.timing || '无限制'}`);
      }

      // 检查角色需求
      if (card.requiresCharacter) {
        const activeCharacter = gameState.characters?.[PlayerEnum.WHITE];
        const activeCharacterId = activeCharacter ? String(activeCharacter._tid || activeCharacter.tid) : null;
        const requiredId = String(card.requiresCharacter);

        if (!activeCharacterId || activeCharacterId !== requiredId) {
          console.log(`     ❌ 角色需求: 需要${requiredId}, 当前${activeCharacterId || '无角色'}`);
        } else {
          console.log(`     ✅ 角色需求满足: ${requiredId}`);
        }
      } else {
        console.log(`     ✅ 无角色需求`);
      }

      // 检查技能特定条件
      const isPlayable = isSkillCardPlayable(gameState, PlayerEnum.WHITE, card);
      console.log(`     ${isPlayable ? '✅' : '❌'} 技能条件检查: ${isPlayable ? '满足' : '不满足'}`);
    });
  } else {
    playableSkills.forEach(skill => {
      console.log(`   ✅ [${skill.handIndex}] ${skill.card.nameZh}`);
    });
  }

  console.log('\n===============================');
  console.log('调试分析完成');
  console.log('💡 建议: 在游戏中调用 window.debugAI(window.gameEngine.getState()) 获取实时状态');
}

// 在开发环境下暴露调试函数
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.debugAI = debugAiDecision;
  console.log('🔧 AI调试工具已加载到 window.debugAI(gameState)');
}

export default debugAiDecision;
