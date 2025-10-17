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
  <div className="max-w-xl mx-auto bg-white/95 rounded-3xl shadow-2xl p-6 space-y-4 border-4 border-amber-400 text-stone-900">
    <h2 className="text-2xl font-bold text-amber-700 text-center">{PLAYER_NAMES[player]} 的调度阶段</h2>
    {hidden ? (
      <p className="text-center text-sm text-amber-600">{PLAYER_NAMES[player]} 正在调整手牌…</p>
    ) : (
      <>
        <p className="text-sm text-gray-600 text-center">你可以保留当前手牌或将其置入墓地并抽取新牌。</p>
        <div className="flex justify-center">
          {card ? <CardView card={card} disabled variant="showcase" style={{ width: '10.5rem' }} /> : <div className="text-gray-500 italic">无手牌</div>}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={onKeep}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            保留手牌
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            换一张
          </button>
        </div>
      </>
    )}
  </div>
);

