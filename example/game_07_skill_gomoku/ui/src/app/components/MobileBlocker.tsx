import React from 'react';

export const MobileBlocker: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-[2147483647] text-slate-100"
      role="dialog"
      aria-modal="true"
      onTouchMove={e => { try { e.preventDefault(); } catch {} }}
    >
      {/* solid scrim */}
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" />
      {/* center card */}
      <div className="relative h-full w-full flex items-center justify-center p-6">
        <div className="max-w-[28rem] w-full text-center space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] px-6 py-8">
          <div className="text-2xl font-extrabold tracking-wide">暂不支持手机端</div>
          <p className="text-sm text-slate-300">请使用电脑或平板（Pad）打开本 Demo，以获得完整的拖拽与交互体验。</p>
          <div className="text-xs text-slate-400">提示：Pad 上可通过“轻点手牌”发动技能；手机尺寸下暂不开放。</div>
        </div>
      </div>
    </div>
  );
};

export default MobileBlocker;
