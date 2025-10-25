import React, { useEffect, useRef } from 'react';
import type { GameLogEntry } from '../types';
import { GameIcon } from './IconLibrary';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const TYPE_STYLES: Record<string, { class: string; icon: string }> = {
  start: { class: 'hearthstone-log-item hearthstone-log-item--blue', icon: 'start' },
  move: { class: 'hearthstone-log-item hearthstone-log-item--gray', icon: 'move' },
  card: { class: 'hearthstone-log-item hearthstone-log-item--purple', icon: 'card' },
  effect: { class: 'hearthstone-log-item hearthstone-log-item--orange', icon: 'effect' },
  counter: { class: 'hearthstone-log-item hearthstone-log-item--red', icon: 'counter' },
  draw: { class: 'hearthstone-log-item hearthstone-log-item--blue', icon: 'draw' },
  summon: { class: 'hearthstone-log-item hearthstone-log-item--green', icon: 'summon' },
  win: { class: 'hearthstone-log-item hearthstone-log-item--gold', icon: 'win' },
  error: { class: 'hearthstone-log-item hearthstone-log-item--red-bold', icon: 'error' }
};

export interface GameLogProps {
  logs: GameLogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl p-3 shadow-xl"
      style={{
        background: 'linear-gradient(145deg, #374151 0%, #4b5563 8%, #6b7280 92%, #4b5563 100%)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="mb-3 flex items-center justify-between border-b border-slate-600/30 pb-2">
        <h3 className="text-sm font-bold text-slate-200 drop-shadow-sm">对局记录</h3>
        <span className="text-xs font-medium text-slate-300/70">LOG</span>
      </div>
      <div ref={ref} className="flex-1 space-y-1 overflow-y-auto pr-1 text-xs">
        {logs.map((log, idx) => {
          const typeInfo = TYPE_STYLES[log.type] || TYPE_STYLES.move;
          return (
            <div
              key={idx}
              className={cx('flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-150', typeInfo.class)}
            >
              <GameIcon name={typeInfo.icon} size="xs" className="shrink-0 opacity-80" />
              <span className="flex-1">{log.message}</span>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="flex h-full items-center justify-center text-amber-200/60">
            暂无记录
          </div>
        )}
      </div>
    </div>
  );
};
