import React, { useEffect, useRef } from 'react';
import type { GameLogEntry } from '../types';
import { GameIcon, type IconName } from './IconLibrary';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

type LogType = 'start' | 'move' | 'card' | 'effect' | 'counter' | 'draw' | 'summon' | 'win' | 'error';

const TYPE_STYLES: Record<LogType, { class: string; icon: IconName }> = {
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
  onPositionHover?: (position: { row: number; col: number } | null) => void;
  turnCount: number;
  currentPlayer: number;
  playerNames: Record<number, string>;
}

export const GameLog: React.FC<GameLogProps> = ({ logs, onPositionHover, turnCount, currentPlayer, playerNames }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className="flex flex-col rounded-xl p-3 shadow-xl mb-3 h-[280px] min-h-[280px] max-h-[280px]" // 固定高度，不超过屏幕
      style={{
        background: 'linear-gradient(145deg, #374151 0%, #4b5563 8%, #6b7280 92%, #4b5563 100%)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="mb-3 flex items-center justify-between border-b border-slate-600/30 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-amber-100 drop-shadow-sm tracking-[0.18em]">棋谱纪要</h3>
          <p className="mt-0.5 text-[0.65rem] text-slate-200/70">记录每一次攻守与落子</p>
        </div>
        <span className="rounded-full border border-amber-200/40 bg-white/10 px-3 py-0.5 text-[0.65rem] font-semibold text-amber-100/90">
          第 {turnCount + 1} 手 - {playerNames[currentPlayer]}回合
        </span>
      </div>
      <div ref={ref} className="flex-1 space-y-1 overflow-y-auto pr-1 text-xs scrollbar-thin scrollbar-track-slate-700/40 scrollbar-thumb-slate-500/60 hover:scrollbar-thumb-slate-400/80">
        {logs.map((log, idx) => {
          const typeInfo = TYPE_STYLES[(log.type as LogType)] || TYPE_STYLES.move;
          const hasPosition = log.position && typeof log.position.row === 'number' && typeof log.position.col === 'number';

          return (
            <div
              key={idx}
              className={cx(
                'flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-150',
                typeInfo.class
              )}
            >
              <GameIcon name={typeInfo.icon} size="xs" className="shrink-0 opacity-80" />
              <span className="flex-1">{log.message}</span>
              {hasPosition && (
                <span
                  className="shrink-0 cursor-pointer rounded border border-amber-200/40 bg-white/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-amber-100/90 transition-all hover:bg-amber-200/20 hover:border-amber-200/60 hover:shadow-sm"
                  onMouseEnter={() => {
                    if (onPositionHover) {
                      onPositionHover(log.position!);
                    }
                  }}
                  onMouseLeave={() => {
                    if (onPositionHover) {
                      onPositionHover(null);
                    }
                  }}
                  title={`位置: ${log.position!.row + 1}, ${log.position!.col + 1}`}
                >
                  {log.position!.row + 1},{log.position!.col + 1}
                </span>
              )}
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
