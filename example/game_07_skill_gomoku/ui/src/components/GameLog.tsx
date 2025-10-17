import React, { useEffect, useRef } from 'react';
import type { GameLogEntry } from '../types';

const LOG_TYPE_CLASSES: Record<string, string> = {
  start: 'battle-log__entry--start',
  move: 'battle-log__entry--move',
  card: 'battle-log__entry--card',
  effect: 'battle-log__entry--effect',
  counter: 'battle-log__entry--counter',
  draw: 'battle-log__entry--draw',
  summon: 'battle-log__entry--summon',
  win: 'battle-log__entry--win',
  error: 'battle-log__entry--error'
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
    <div className="battle-log">
      <div className="battle-log__header">
        <h3 className="battle-log__title">对局记录</h3>
      </div>
      <div ref={ref} className="battle-log__body">
        {logs.map((log, idx) => (
          <div key={idx} className={`battle-log__entry ${LOG_TYPE_CLASSES[log.type] ?? ''}`}>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

