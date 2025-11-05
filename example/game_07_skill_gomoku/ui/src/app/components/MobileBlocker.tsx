import React from 'react';

export const MobileBlocker: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200000] flex items-center justify-center p-6 bg-slate-950/92 text-slate-100">
      <div className="max-w-[28rem] w-full text-center space-y-4">
        <div className="text-2xl font-extrabold tracking-wide">暂不支持手机端</div>
        <p className="text-sm text-slate-300">请使用电脑或平板（Pad）打开本 Demo，以获得完整的拖拽与交互体验。</p>
        <div className="text-xs text-slate-400">提示：本页面会自动适配触控设备的点击释放，但在手机尺寸下不开放游戏。</div>
      </div>
    </div>
  );
};

export default MobileBlocker;

