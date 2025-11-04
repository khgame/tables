import React from 'react';
import type { Player, RawCard } from '../types';
import { PLAYER_NAMES } from '../core/constants';
import { CardView } from './CardView';

export interface MulliganPanelProps {
  player: Player;
  card: RawCard | null;
  onKeep: () => void;
  onReplace: () => void;
  hidden?: boolean;
}

export const MulliganPanel: React.FC<MulliganPanelProps> = ({ player, card, onKeep, onReplace, hidden }) => (
  <div className="relative max-w-[540px] w-full mx-auto rounded-2xl p-5 bg-gradient-to-br from-white/90 to-slate-50/95 text-slate-800 shadow-[0_20px_44px_rgba(15,23,42,0.18)]">
    <div className="grid gap-4 text-center">
      <h2 className="text-xl font-bold tracking-[0.08em] text-amber-700">{PLAYER_NAMES[player]} 的调度阶段</h2>
      {hidden ? (
        <p className="text-sm text-rose-700">{PLAYER_NAMES[player]} 正在调整手牌…</p>
      ) : (
        <>
          <p className="text-sm text-slate-600 leading-relaxed">你可以保留当前手牌或将其置入墓地并抽取新牌，回合结束后将自动继续。</p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={onKeep}
              className="rounded-full px-7 py-2 text-sm font-semibold tracking-[0.12em] uppercase text-white transition hover:-translate-y-[1px] shadow-[0_12px_24px_rgba(16,185,129,0.18)] bg-gradient-to-r from-emerald-500/85 to-emerald-600/90"
            >
              保留手牌
            </button>
            <button
              type="button"
              onClick={onReplace}
              className="rounded-full px-7 py-2 text-sm font-semibold tracking-[0.12em] uppercase text-white transition hover:-translate-y-[1px] shadow-[0_12px_24px_rgba(244,63,94,0.18)] bg-gradient-to-r from-rose-500/85 to-pink-600/90"
            >
              换一张
            </button>
          </div>
        </>
      )}
    </div>
    {!hidden && (
      <div className="absolute top-1/2 right-[-5.5rem] -translate-y-1/2 pointer-events-none drop-shadow-[0_24px_38px_rgba(8,17,35,0.3)]">
        {card ? <CardView card={card} disabled variant="showcase" style={{ width: '10rem' }} /> : <div className="text-sm italic text-gray-400">无手牌</div>}
      </div>
    )}
  </div>
);
