import React from 'react';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import type { GameStatus, Player, RawCard } from '../types';
import { CardView } from './CardView';

export interface PendingCardPanelProps {
  pendingCard: GameStatus['pendingAction'];
  responder: Player | null;
  availableCounters: RawCard[];
  selectedCounter: RawCard | null;
  setSelectedCounter: (card: RawCard | null) => void;
  onResolve: (countered: boolean, counterCard: RawCard | null) => void;
  aiEnabled: boolean;
}

export const PendingCardPanel: React.FC<PendingCardPanelProps> = ({
  pendingCard,
  responder,
  availableCounters,
  selectedCounter,
  setSelectedCounter,
  onResolve,
  aiEnabled
}) => {
  if (!pendingCard) return null;
  const actingPlayer = pendingCard.player;
  const isResponderAI = aiEnabled && responder === PlayerEnum.WHITE;
  const canCounter = responder === PlayerEnum.BLACK && availableCounters.length > 0;

  const baseButtonClasses =
    'rounded-full px-4 py-2 text-xs font-semibold tracking-[0.22em] uppercase transition-transform duration-150';

  return (
    <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-gradient-to-br from-amber-100/95 via-amber-50/95 to-amber-200/90 p-5 shadow-[0_20px_45px_rgba(120,53,15,0.25)] ring-1 ring-amber-500/30">
      <header className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.26em] text-amber-900">
        <span className="rounded-full bg-rose-200/60 px-3 py-1 text-rose-700 shadow-sm">
          {PLAYER_NAMES[actingPlayer]}
        </span>
        <span>发动技能</span>
      </header>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
        <div className="w-full max-w-[9.5rem] shrink-0">
          <CardView card={pendingCard.card} variant="list" style={{ width: '9rem' }} />
        </div>
        <p className="flex-1 text-sm leading-relaxed text-amber-900/90">
          {pendingCard.card.effect || '该技能暂无效果描述'}
        </p>
      </div>

      {canCounter ? (
        <div className="mt-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-900/80">
            {PLAYER_NAMES[responder!]} 可用反击卡
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableCounters.map(card => {
              const tid = card._tid ?? card.tid;
              const isSelected = selectedCounter && (selectedCounter._tid ?? selectedCounter.tid) === tid;
              return (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setSelectedCounter(card)}
                  className={`rounded-2xl border border-amber-200/60 bg-white/60 p-2 shadow-sm transition duration-150 hover:-translate-y-1 hover:border-amber-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isSelected ? 'border-indigo-400 bg-indigo-50/80 shadow-lg' : ''
                  }`}
                >
                  <CardView card={card} variant="list" style={{ width: '7.2rem' }} />
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={!selectedCounter}
              onClick={() => selectedCounter && onResolve(true, selectedCounter)}
              className={`${baseButtonClasses} bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none`}
            >
              使用反击卡
            </button>
            <button
              type="button"
              onClick={() => {
                onResolve(false, null);
                setSelectedCounter(null);
              }}
              className={`${baseButtonClasses} bg-slate-700/90 text-slate-100 shadow-md shadow-slate-800/30 hover:-translate-y-0.5`}
            >
              放弃反击
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={isResponderAI ? undefined : () => onResolve(false, null)}
            disabled={isResponderAI}
            className={`${baseButtonClasses} bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none`}
          >
            确认生效
          </button>
        </div>
      )}
    </div>
  );
};
