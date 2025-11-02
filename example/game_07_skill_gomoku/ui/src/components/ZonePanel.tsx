import React from 'react';
import type { GraveyardEntry, ShichahaiEntry } from '../types';
import { PLAYER_NAMES } from '../core/constants';
import { CardFrame } from './CardFrame';
import { GraveIcon, SeaIcon } from './IconLibrary';

export interface ZonePanelProps {
  title: string;
  graveyard: GraveyardEntry[];
  shichahai: ShichahaiEntry[];
  variant?: 'player' | 'opponent';
  onPositionHover?: (position: { row: number; col: number } | null) => void; // 添加位置悬停回调
}

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const variantStyles: Record<'player' | 'opponent', { borderGlow: string; accentColor: string; bgPattern: string; bgSolid: string }> = {
  player: {
    borderGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    accentColor: 'rgb(59, 130, 246)',
    bgPattern: 'from-slate-900/98 via-blue-950/90 to-slate-900/98',
    bgSolid: 'rgba(15, 23, 42, 0.95)' // 深色半透明背景
  },
  opponent: {
    borderGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    accentColor: 'rgb(239, 68, 68)',
    bgPattern: 'from-slate-900/98 via-red-950/90 to-slate-900/98',
    bgSolid: 'rgba(20, 8, 26, 0.95)' // 深色半透明背景
  }
};

export const ZonePanel: React.FC<ZonePanelProps> = ({ title, graveyard, shichahai, variant = 'player', onPositionHover }) => {
  const palette = variantStyles[variant];

  return (
    <div
      className={cx(
        'relative z-[40] flex flex-col rounded-xl overflow-hidden',
        'h-[320px] min-h-[320px] max-h-[320px]', // 固定高度，确保面板大小稳定
        palette.borderGlow
      )}
      style={{
        background: palette.bgSolid, // 使用纯色半透明背景，不使用毛玻璃
        border: `1px solid rgba(255,255,255,0.15)`, // 增强边框可见度
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.1),
          inset 0 -1px 0 rgba(0,0,0,0.2),
          0 0 0 1px rgba(0,0,0,0.1),
          0 4px 12px rgba(0,0,0,0.3)
        `
      }}
    >
      {/* 科技感顶部光条 */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${palette.accentColor}, transparent)`,
          filter: 'blur(0.5px)'
        }}
      />

      {/* 侧边光效 */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[1px] opacity-60"
        style={{
          background: `linear-gradient(180deg, transparent, ${palette.accentColor}, transparent)`
        }}
      />

      <header
        className="relative mb-2 flex items-center justify-between border-b pb-1.5 px-3 pt-2.5"
        style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}
      >
        <h3 className="text-xs font-bold text-slate-100 tracking-wide">{title}</h3>
        <div className="flex items-center gap-1.5">
          <div
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.6rem] font-medium text-slate-200 backdrop-blur-sm"
            style={{
              background: 'rgba(0,0,0,0.6)', // 增加背景不透明度
              border: '1px solid rgba(255,255,255,0.2)' // 增强边框
            }}
          >
            <GraveIcon size="xs" />
            <span>{graveyard.length}</span>
          </div>
          <div
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.6rem] font-medium text-slate-200 backdrop-blur-sm"
            style={{
              background: 'rgba(0,0,0,0.6)', // 增加背景不透明度
              border: '1px solid rgba(255,255,255,0.2)' // 增强边框
            }}
          >
            <SeaIcon size="xs" />
            <span>{shichahai.length}</span>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col gap-2 text-xs overflow-hidden min-h-0 px-3 pb-3">
        {/* 墓地：横向滚动卡片，固定高度 */}
        <div className="flex flex-col h-[110px] min-h-[110px]">
          <div className="flex items-center gap-1 text-[0.6rem] font-medium text-slate-300 mb-1 flex-shrink-0">
            <GraveIcon size="xs" />
            <span>墓地</span>
            <div
              className="flex-1 h-px ml-2"
              style={{
                background: `linear-gradient(90deg, ${palette.accentColor}40, transparent)`
              }}
            />
          </div>
          <div className="relative flex-1 min-h-0">
            {/* 科技感边框 */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            />
            <div className="absolute inset-y-0 left-0 w-6 pointer-events-none bg-gradient-to-r from-slate-900/60 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-6 pointer-events-none bg-gradient-to-l from-slate-900/60 to-transparent z-10" />
            <div className="relative overflow-x-auto overflow-y-hidden h-full scrollbar-thin scrollbar-track-slate-800/40 scrollbar-thumb-slate-600/60 hover:scrollbar-thumb-slate-500/80 py-1 px-2">
              <div className="flex items-start gap-2 pr-2 h-full">
                {graveyard.length > 0 ? (
                  graveyard.map(item => (
                    <div
                      key={item.id}
                      className="shrink-0 flex flex-col min-w-[100px] max-w-[120px] h-[80px] items-center gap-1 rounded-lg px-2 py-1.5 shadow-sm hover:ring-1 hover:ring-amber-400/50 transition-all duration-200 cursor-pointer group"
                      style={{
                        background: 'rgba(30, 27, 23, 0.95)', // 深色不透明背景
                        border: '1px solid rgba(245, 158, 11, 0.25)', // 琥珀色边框
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}
                      onMouseEnter={() => {
                        // 显示卡牌详情或在棋盘上高亮位置（墓地记录通常没有位置信息）
                      }}
                      onMouseLeave={() => {
                        // 清除高亮
                      }}
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[0.55rem] font-bold text-amber-200 flex-shrink-0"
                        style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        T{item.turn}
                      </div>
                      <div className="min-w-0 flex-1 text-center">
                        <div className="truncate text-[0.62rem] font-semibold text-slate-100 leading-tight">{item.cardName}</div>
                        <div className="text-[0.5rem] text-slate-400 leading-tight mt-0.5">{describeReason(item.reason)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <GraveIcon size="md" className="opacity-30" />
                      <div className="text-[0.65rem] font-medium">暂无墓地记录</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 什刹海：横向滚动卡片，固定高度 */}
        <div className="flex flex-col h-[110px] min-h-[110px]">
          <div className="flex items-center gap-1 text-[0.6rem] font-medium text-slate-300 mb-1 flex-shrink-0">
            <SeaIcon size="xs" />
            <span>什刹海</span>
            <div
              className="flex-1 h-px ml-2"
              style={{
                background: `linear-gradient(90deg, ${palette.accentColor}40, transparent)`
              }}
            />
          </div>
          <div className="relative flex-1 min-h-0">
            {/* 科技感边框 */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            />
            <div className="absolute inset-y-0 left-0 w-6 pointer-events-none bg-gradient-to-r from-slate-900/60 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-6 pointer-events-none bg-gradient-to-l from-slate-900/60 to-transparent z-10" />
            <div className="relative overflow-x-auto overflow-y-hidden h-full scrollbar-thin scrollbar-track-slate-800/40 scrollbar-thumb-slate-600/60 hover:scrollbar-thumb-slate-500/80 py-1 px-2">
              <div className="flex items-start gap-2 pr-2 h-full">
                {shichahai.length > 0 ? (
                  shichahai.map(entry => (
                    <div
                      key={entry.id}
                      className="shrink-0 flex flex-col min-w-[100px] max-w-[120px] h-[80px] items-center gap-1 rounded-lg px-2 py-1.5 shadow-sm hover:ring-1 hover:ring-cyan-400/50 transition-all duration-200 cursor-pointer group"
                      style={{
                        background: 'rgba(8, 47, 73, 0.95)', // 深青色不透明背景
                        border: '1px solid rgba(6, 182, 212, 0.3)', // 青色边框
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}
                      onMouseEnter={() => {
                        // 在棋盘上高亮这个位置
                        if (onPositionHover) {
                          onPositionHover({ row: entry.row, col: entry.col });
                        }
                      }}
                      onMouseLeave={() => {
                        // 清除高亮
                        if (onPositionHover) {
                          onPositionHover(null);
                        }
                      }}
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[0.5rem] font-bold text-cyan-200 flex-shrink-0"
                        style={{
                          background: 'rgba(6, 182, 212, 0.2)',
                          border: '1px solid rgba(6, 182, 212, 0.3)'
                        }}
                      >
                        {entry.row + 1},{entry.col + 1}
                      </div>
                      <div className="min-w-0 flex-1 text-center">
                        <div className="truncate text-[0.62rem] font-semibold text-slate-100 leading-tight">{PLAYER_NAMES[entry.owner]}</div>
                        <div className="text-[0.5rem] text-slate-400 leading-tight mt-0.5">T{entry.turn}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <SeaIcon size="md" className="opacity-30" />
                      <div className="text-[0.65rem] font-medium">暂无什刹海记录</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {graveyard.length === 0 && shichahai.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${palette.accentColor}20, transparent)`,
                  border: `1px solid ${palette.accentColor}30`
                }}
              >
                <div className="w-6 h-6 rounded-full" style={{ background: `${palette.accentColor}40` }} />
              </div>
              <span className="text-sm font-medium">暂无记录</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const describeReason = (reason: string) => {
  switch (reason) {
    case 'played':
      return '已使用';
    case 'counter':
      return '用于反击';
    case 'countered':
      return '被反击打出';
    case 'mulligan':
      return '调度阶段换牌';
    case 'fizzled':
      return '未命中目标';
    default:
      return reason;
  }
};
