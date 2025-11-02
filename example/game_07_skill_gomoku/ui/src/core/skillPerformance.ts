/**
 * 技能表演系统
 *
 * 负责管理技能视觉效果的创建、排序和生命周期
 * 确保在反击场景下，攻击方技能先播放，反击方技能后播放
 */

import type { RawCard, VisualEffectEvent, Player } from '../types';
import { generateId } from './utils';

/**
 * 技能表演管理器
 * 使用单例模式，维护全局的技能序列号
 */
class SkillPerformanceManager {
  private sequenceCounter = 0;

  /**
   * 创建一个新的视觉效果事件
   * @param effectId 技能效果 ID
   * @param card 卡牌信息
   * @param player 玩家
   * @param role 角色：'attacker' 表示攻击方，'counter' 表示反击方
   * @returns 视觉效果事件
   */
  createVisualEvent(
    effectId: string,
    card: RawCard,
    player: Player,
    role: 'attacker' | 'counter' | 'normal' = 'normal'
  ): VisualEffectEvent {
    const sequence = this.sequenceCounter++;
    const now = Date.now();

    // 为确保顺序，反击方的事件在时间戳上加 1ms
    // 同时使用 sequence 作为第二排序键
    const timestamp = role === 'counter' ? now + 1 : now;

    return {
      id: generateId('visual'),
      effectId,
      cardName: card.nameZh,
      player,
      createdAt: timestamp,
      sequence,
      role
    };
  }

  /**
   * 对视觉效果事件进行排序
   * 优先按照 createdAt 排序，如果时间戳相同则按 sequence 排序
   * @param events 事件列表
   * @returns 排序后的事件列表
   */
  sortEvents(events: VisualEffectEvent[]): VisualEffectEvent[] {
    return [...events].sort((a, b) => {
      // 先按时间戳排序
      if (a.createdAt !== b.createdAt) {
        return a.createdAt - b.createdAt;
      }
      // 时间戳相同时按序列号排序（攻击方在前，反击方在后）
      const seqA = a.sequence ?? 0;
      const seqB = b.sequence ?? 0;
      return seqA - seqB;
    });
  }

  /**
   * 重置序列计数器
   * 通常在新游戏开始时调用
   */
  reset(): void {
    this.sequenceCounter = 0;
  }
}

// 导出单例实例
export const skillPerformanceManager = new SkillPerformanceManager();
