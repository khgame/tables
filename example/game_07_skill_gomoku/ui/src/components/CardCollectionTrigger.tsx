import React from 'react';

export interface CardCollectionTriggerProps {
  onClick: () => void;
}

export const CardCollectionTrigger: React.FC<CardCollectionTriggerProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group fixed right-4 top-20 z-[100] w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)',
        border: '2px solid rgba(245, 158, 11, 0.4)',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}
      title="查看卡牌图鉴"
    >
      {/* 图标 - 卡牌堆叠效果 */}
      <div className="relative w-7 h-7">
        {/* 背景卡片 */}
        <div
          className="absolute inset-0 rounded-md transform -rotate-6 translate-x-1 translate-y-1 opacity-40 group-hover:rotate-[-8deg] transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.6) 0%, rgba(217, 119, 6, 0.6) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.6)'
          }}
        />
        <div
          className="absolute inset-0 rounded-md transform rotate-3 opacity-60 group-hover:rotate-6 transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.7) 0%, rgba(217, 119, 6, 0.7) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.7)'
          }}
        />
        {/* 前景卡片 */}
        <div
          className="absolute inset-0 rounded-md flex items-center justify-center transform group-hover:scale-105 transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.9) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.9)'
          }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>

      {/* 发光效果 */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.3), transparent 70%)',
          filter: 'blur(8px)'
        }}
      />
    </button>
  );
};
