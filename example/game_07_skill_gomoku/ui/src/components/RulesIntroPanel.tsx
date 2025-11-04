import React from 'react';
import { SKILL_UNLOCK_MOVE } from '../core/constants';

export interface RulesIntroPanelProps {
  hasConfig: boolean;
  onStartAi: () => void;
}

/**
 * 规则介绍面板（贴近游戏内风格）
 * - 带有发光装饰、边框描边与微粒动画的卡片式介绍
 * - 底部提供“开始 AI 对战”与“AI 设置”入口
 */
export const RulesIntroPanel: React.FC<RulesIntroPanelProps> = ({ hasConfig, onStartAi }) => {
  return (
    <div className="relative mx-auto w-[min(880px,92vw)]">
      {/* 背后渐变光圈 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[640px] rounded-full blur-3xl opacity-40"
             style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.35), rgba(59,130,246,0.35))' }} />
        <div className="absolute -bottom-20 right-12 h-60 w-60 rounded-full blur-2xl opacity-30"
             style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.45), rgba(0,0,0,0))' }} />
      </div>

      {/* 主卡片 */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-800/85 shadow-[0_26px_58px_rgba(6,8,21,0.55)] ring-1 ring-white/10">
        {/* 装饰条纹 */}
        <div className="pointer-events-none absolute -top-8 -left-8 h-40 w-[140%] rotate-[-8deg] opacity-20"
             style={{ background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 6px, rgba(255,255,255,0.03) 6px 14px)' }} />

        {/* 顶部标题区 */}
        <header className="relative flex items-start px-6 pt-6">
          <div className="mr-auto">
            <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-wide text-amber-200 drop-shadow-[0_6px_18px_rgba(245,158,11,0.35)]">
              技能五子棋
            </h1>
            <p className="mt-1 text-sm text-amber-100/80">Gomoku + Skill Cards</p>
          </div>
        </header>

        {/* 规则列表 */}
        <section className="relative px-6 pb-6">
          <div className="mt-5 grid gap-3 text-[15px] text-slate-100/95">
            {[
              '棋盘 15×15，连成五子即获胜。',
              '黑先白后，白方由 AI 控制（开启对战后）。',
              `第 ${SKILL_UNLOCK_MOVE} 步起解锁技能卡（冻结/跳过会影响回合）。`,
              '什刹海记录被移除的棋子，墓地记录使用过的卡。',
              '合体技需“张兴朝”在场，召唤当回合不可立刻使用合体技。'
            ].map((line, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_0_2px_rgba(255,255,255,0.15)]" />
                <span className="leading-relaxed">{line}</span>
              </div>
            ))}
          </div>

          {/* 分割饰条 */}
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* 行动区 */}
          <div className="mt-5 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="text-sm text-slate-300/90">提示：AI 设置已移至右上角齿轮按钮。</p>
            <button
              type="button"
              onClick={onStartAi}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-[15px] font-extrabold tracking-[0.18em] text-slate-900 shadow-[0_16px_36px_rgba(6,12,28,0.55)] transition-transform hover:scale-[1.03]"
            >
              开始 AI 对战
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RulesIntroPanel;
