import React from 'react';
import type { VisualEffectEvent } from '../types';
import { PlayerEnum } from '../core/constants';
import { SkillEffect } from '../skills/effects';
import { skillPerformanceManager } from '../core/skillPerformance';

const EFFECT_COLORS: Record<string, { primary: string; secondary: string; stroke: string }> = {
  [SkillEffect.RemoveToShichahai]: { primary: '#fbbf24', secondary: '#f59e0b', stroke: '#451a03' },
  [SkillEffect.FreezeOpponent]: { primary: '#60a5fa', secondary: '#3b82f6', stroke: '#1e3a8a' },
  [SkillEffect.InstantWin]: { primary: '#fde047', secondary: '#eab308', stroke: '#422006' },
  [SkillEffect.CleanSweep]: { primary: '#22d3ee', secondary: '#06b6d4', stroke: '#164e63' },
  [SkillEffect.TimeRewind]: { primary: '#2dd4bf', secondary: '#14b8a6', stroke: '#134e4a' },
  [SkillEffect.SkipNextTurn]: { primary: '#c084fc', secondary: '#a855f7', stroke: '#581c87' },
  [SkillEffect.SummonCharacter]: { primary: '#4ade80', secondary: '#22c55e', stroke: '#14532d' },
  [SkillEffect.ForceExit]: { primary: '#f87171', secondary: '#ef4444', stroke: '#7f1d1d' },
  [SkillEffect.CounterCancelFusion]: { primary: '#ec4899', secondary: '#db2777', stroke: '#831843' },
  [SkillEffect.CounterReverseWin]: { primary: '#ec4899', secondary: '#db2777', stroke: '#831843' },
  [SkillEffect.CounterRetrieve]: { primary: '#ec4899', secondary: '#db2777', stroke: '#831843' },
  [SkillEffect.CounterPreventRemoval]: { primary: '#ec4899', secondary: '#db2777', stroke: '#831843' },
  [SkillEffect.CounterThaw]: { primary: '#ec4899', secondary: '#db2777', stroke: '#831843' },
  [SkillEffect.CounterRestoreBoard]: { primary: '#ec4899', secondary: '#db2777', stroke: '#831843' },
  [SkillEffect.CounterPunish]: { primary: '#ec4899', secondary: '#db2777', stroke: '#831843' }
};

const getEffectColor = (effectId?: string) => {
  return EFFECT_COLORS[effectId ?? ''] ?? { primary: '#60a5fa', secondary: '#3b82f6', stroke: '#1e3a8a' };
};

export interface SkillEffectLayerProps {
  events: VisualEffectEvent[];
}

export const SkillEffectLayer: React.FC<SkillEffectLayerProps> = ({ events }) => {
  // 使用技能表演管理器进行排序，确保攻击方技能先播放，反击方技能后播放
  const sortedEvents = skillPerformanceManager.sortEvents(events);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
      {sortedEvents.map((event, index) => {
        const isPlayerSkill = event.player === PlayerEnum.BLACK;
        const colors = getEffectColor(event.effectId);
        const playerPrefix = isPlayerSkill ? '黑方发动' : '白方发动';
        const skillText = `${playerPrefix} ${event.cardName}!!`;

        // 判断是否为反击技能（基于 role 字段）
        const isCounterSkill = event.role === 'counter';

        // 如果是反击技能，添加延迟，让攻击技能先展示
        const baseDelay = 0;
        const counterDelay = 1.2; // 反击技能延迟 1.2 秒播放
        const delayOffset = isCounterSkill ? counterDelay : baseDelay;

        const totalDuration = 2.8; // 单个技能总持续时间

        // 白方（AI）技能显示在上半部分，黑方（玩家）技能显示在下半部分
        // 这样反击时可以同时看到双方技能
        const verticalPosition = isPlayerSkill ? 'items-end' : 'items-start';
        const verticalPadding = isPlayerSkill ? 'pb-16' : 'pt-16';

        return (
          <div
            key={event.id}
            className={`absolute inset-0 flex justify-center ${verticalPosition} ${verticalPadding}`}
            style={{
              animation: `graffiti-skill-sequence ${totalDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delayOffset}s forwards`,
              opacity: 0 // 初始透明，通过动画控制显示
            }}
          >
          {/* 背景光晕效果 */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${colors.primary}40, transparent 70%)`,
              animation: `skill-glow-pulse 1.5s ease-out ${delayOffset + 0.2}s forwards`
            }}
          />

          {/* 反击联动特效：当反击技能播放时，在中间显示碰撞效果 */}
          {isCounterSkill && (
            <>
              {/* 中央碰撞光晕 */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  animation: `counter-clash-glow 1.2s ease-out ${delayOffset - 0.3}s forwards`,
                  opacity: 0
                }}
              >
                <div
                  className="w-32 h-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${colors.primary}dd, ${colors.secondary}66, transparent)`,
                    boxShadow: `0 0 80px ${colors.primary}aa, 0 0 120px ${colors.secondary}66`
                  }}
                />
              </div>
              {/* 碰撞冲击波 */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  animation: `counter-clash-wave 1s ease-out ${delayOffset - 0.2}s forwards`,
                  opacity: 0
                }}
              >
                <div
                  className="w-24 h-24 rounded-full border-4"
                  style={{
                    borderColor: colors.primary
                  }}
                />
              </div>
            </>
          )}

          {/* 主要文字 - 涂鸦风格，增加一些随机性 */}
          <div
            className="relative text-center"
            style={{
              transform: `rotate(${isPlayerSkill ? -2 + index * 0.5 : 2 - index * 0.5}deg)`,
              animation: `graffiti-text-fly-in 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${delayOffset + 0.1}s forwards, graffiti-text-fly-out 1.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) ${delayOffset + 1.3}s forwards`
            }}
          >
            {/* 外描边 - 黑色厚边 */}
            <div
              className="absolute inset-0 text-6xl font-black select-none"
              style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                color: colors.stroke,
                textShadow: `
                  -3px -3px 0 ${colors.stroke},
                  3px -3px 0 ${colors.stroke},
                  -3px 3px 0 ${colors.stroke},
                  3px 3px 0 ${colors.stroke},
                  -4px 0 0 ${colors.stroke},
                  4px 0 0 ${colors.stroke},
                  0 -4px 0 ${colors.stroke},
                  0 4px 0 ${colors.stroke}
                `,
                transform: 'translateX(2px) translateY(2px)'
              }}
            >
              {skillText}
            </div>

            {/* 中间描边 - 渐变色 */}
            <div
              className="absolute inset-0 text-6xl font-black select-none"
              style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `
                  -2px -2px 0 ${colors.stroke}aa,
                  2px -2px 0 ${colors.stroke}aa,
                  -2px 2px 0 ${colors.stroke}aa,
                  2px 2px 0 ${colors.stroke}aa
                `,
                transform: 'translateX(1px) translateY(1px)'
              }}
            >
              {skillText}
            </div>

            {/* 主文字 - 白色高亮 */}
            <div
              className="relative text-6xl font-black select-none"
              style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                color: '#ffffff',
                textShadow: `
                  0 0 20px ${colors.primary}aa,
                  0 0 40px ${colors.primary}66,
                  0 2px 4px rgba(0,0,0,0.8)
                `,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
              }}
            >
              {skillText}
            </div>

            {/* 装饰性元素 - 星花四溅，位置稍微错开 */}
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4"
                  style={{
                    left: `${25 + i * 8 + (index % 2) * 5}%`,
                    top: `${35 + (i % 3) * 15 + (index % 2) * 10}%`,
                    color: colors.primary,
                    animation: `graffiti-sparkle 1s ${delayOffset + 0.3 + i * 0.1}s ease-out forwards`,
                    fontSize: '1.5rem'
                  }}
                >
                  ★
                </div>
              ))}
            </div>
          </div>

          {/* 冲击波效果，延迟触发 */}
          <div
            className="absolute inset-0 rounded-full border-4 opacity-80"
            style={{
              borderColor: colors.primary,
              animation: `graffiti-shockwave 1.8s ease-out ${delayOffset + 0.4}s forwards`
            }}
          />
        </div>
      );
    })}
  </div>
  );
};
