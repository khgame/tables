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
}

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const variantStyles: Record<'player' | 'opponent', { gradient: string; shadow: string }> = {
  player: {
    gradient: 'from-blue-800/60 to-indigo-900/80',
    shadow: 'shadow-blue-500/10'
  },
  opponent: {
    gradient: 'from-rose-800/60 to-pink-900/80',
    shadow: 'shadow-rose-500/10'
  }
};

export const ZonePanel: React.FC<ZonePanelProps> = ({ title, graveyard, shichahai, variant = 'player' }) => {
  const palette = variantStyles[variant];

  return (
    <div
      className={cx(
        'flex h-full max-h-[280px] flex-col rounded-xl bg-gradient-to-br px-3 py-2.5 shadow-lg backdrop-blur-sm',
        palette.gradient,
        palette.shadow
      )}
    >
      <header className="mb-2 flex items-center justify-between border-b border-slate-500/20 pb-1.5">
        <h3 className="text-xs font-bold text-slate-100">{title}</h3>
        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center gap-1 rounded-md bg-slate-700/60 px-1.5 py-0.5 text-[0.6rem] font-medium text-slate-200">
            <GraveIcon size="xs" />
            <span>{graveyard.length}</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-md bg-slate-700/60 px-1.5 py-0.5 text-[0.6rem] font-medium text-slate-200">
            <SeaIcon size="xs" />
            <span>{shichahai.length}</span>
          </div>
        </div>
      </header>
      <div className="flex-1 space-y-1.5 overflow-y-auto text-xs">
        {graveyard.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[0.6rem] font-medium text-slate-300">
              <GraveIcon size="xs" />
              <span>墓地</span>
            </div>
            {graveyard.slice(-3).map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-1.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700/60 text-[0.6rem] font-bold text-amber-200">
                  T{item.turn}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.65rem] font-semibold text-slate-100">{item.cardName}</div>
                  <div className="text-[0.55rem] text-slate-400">{describeReason(item.reason)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {shichahai.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[0.6rem] font-medium text-slate-300">
              <SeaIcon size="xs" />
              <span>什刹海</span>
            </div>
            {shichahai.slice(-2).map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-1.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700/60 text-[0.55rem] font-bold text-cyan-200">
                  {entry.row + 1},{entry.col + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.65rem] font-semibold text-slate-100">{PLAYER_NAMES[entry.owner]}</div>
                  <div className="text-[0.55rem] text-slate-400">T{entry.turn}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {graveyard.length === 0 && shichahai.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-400">
            暂无记录
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
