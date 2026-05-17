import React from 'react';
import type { ShichahaiEntry } from '../types';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import { SeaIcon } from './IconLibrary';

export interface CombinedShichahaiPanelProps {
  shichahai: ShichahaiEntry[];
  onPositionHover?: (position: { row: number; col: number } | null) => void;
}

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export const CombinedShichahaiPanel: React.FC<CombinedShichahaiPanelProps> = ({
  shichahai,
  onPositionHover
}) => {
  // 按回合排序，最新的在最后
  const sortedShichahai = [...shichahai].sort((a, b) => a.turn - b.turn);

  return (
    <div
      className="relative z-[40] flex flex-col rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.25)]"
      style={{
        height: 'clamp(100px, 13vh, 140px)',
        minHeight: '100px',
        maxHeight: 'clamp(120px, 15vh, 160px)',
        background: 'linear-gradient(145deg, #1f2937 0%, #374151 8%, #374151 92%, #1f2937 100%)',
        border: `1px solid rgba(6, 182, 212, 0.3)`,
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
          background: `linear-gradient(90deg, transparent, rgb(6, 182, 212), transparent)`,
          filter: 'blur(0.5px)'
        }}
      />

      {/* 侧边光效 */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[1px] opacity-60"
        style={{
          background: `linear-gradient(180deg, transparent, rgb(6, 182, 212), transparent)`
        }}
      />

      <header
        className="relative mb-1 flex items-center justify-between border-b pb-1 px-2 pt-1.5"
        style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-1.5">
          <SeaIcon size="xs" />
          <h3 className="text-xs font-bold text-slate-100 tracking-wide">什刹海</h3>
        </div>
        <div
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.6rem] font-medium text-slate-200 backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}
        >
          <span>{shichahai.length} 枚棋子</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col text-xs overflow-hidden min-h-0 px-2 pb-1.5">
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

          <div className="relative overflow-x-auto overflow-y-hidden h-full scrollbar-thin scrollbar-track-slate-800/40 scrollbar-thumb-cyan-600/60 hover:scrollbar-thumb-cyan-500/80 py-1 px-2">
            <div className="flex items-start gap-2 pr-2 h-full">
              {sortedShichahai.length > 0 ? (
                sortedShichahai.map(entry => (
                  <div
                    key={entry.id}
                    className="shrink-0 flex flex-col min-w-[90px] max-w-[110px] items-center gap-1 rounded-lg px-2 py-1.5 shadow-sm hover:ring-2 hover:ring-cyan-400/60 transition-all duration-200 cursor-pointer group"
                    style={{
                      background: 'rgba(8, 47, 73, 0.95)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                    onMouseEnter={() => {
                      if (onPositionHover) {
                        onPositionHover({ row: entry.row, col: entry.col });
                      }
                    }}
                    onMouseLeave={() => {
                      if (onPositionHover) {
                        onPositionHover(null);
                      }
                    }}
                    title={`${PLAYER_NAMES[entry.owner]}: (${entry.row + 1}, ${entry.col + 1}) · 第 ${entry.turn + 1} 手`}
                  >
                    {/* 棋子 */}
                    <div className="flex items-center justify-center h-7 w-7 flex-shrink-0">
                      <div
                        className="rounded-full w-full h-full"
                        style={entry.owner === (PlayerEnum.BLACK as any)
                          ? {
                              background: 'radial-gradient(circle at 30% 30%, #4b5563 0%, #1f2937 60%, #0b0f17 100%)',
                              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6)'
                            }
                          : {
                              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f3f4f6 60%, #e5e7eb 100%)',
                              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.6)'
                            }}
                      />
                    </div>
                    {/* 信息 */}
                    <div className="min-w-0 flex-1 text-center">
                      <div className="truncate text-[0.62rem] font-semibold text-slate-100 leading-tight">
                        {PLAYER_NAMES[entry.owner]}
                      </div>
                      <div className="text-[0.5rem] text-cyan-300/70 leading-tight mt-0.5">
                        ({entry.row + 1},{entry.col + 1})
                      </div>
                      <div className="text-[0.5rem] text-slate-400 leading-tight">
                        T{entry.turn + 1}
                      </div>
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
    </div>
  );
};
