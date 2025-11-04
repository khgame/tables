import React, { useEffect, useState } from 'react';
import standPng from '../assets/stand.png';
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
  onReact?: (text: string) => void;
  onCancel?: () => void;
  // UI: 是否瞬发（无需选择目标）→ 显示确认倒计时；否则不显示倒计时
  isInstant?: boolean;
  // 瞬发确认时间（毫秒）
  confirmMs?: number;
}

export const PendingCardPanel: React.FC<PendingCardPanelProps> = ({
  pendingCard,
  responder,
  availableCounters,
  selectedCounter,
  setSelectedCounter,
  onResolve,
  aiEnabled,
  onReact,
  onCancel,
  isInstant = false,
  confirmMs = 7000
}) => {
  if (!pendingCard) return null;
  const [appear, setAppear] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setAppear(true), 16);
    return () => window.clearTimeout(t);
  }, []);
  const actingPlayer = pendingCard.player;
  const isResponderAI = aiEnabled && responder === PlayerEnum.WHITE;
  const canCounter = responder === PlayerEnum.BLACK && availableCounters.length > 0;

  return (
    <div className="pointer-events-auto relative">
      <div
        className="relative rounded-2xl bg-slate-900/95 ring-2 ring-white/25 ring-offset-1 ring-offset-white/5 border border-white/10 shadow-[0_20px_48px_rgba(6,12,28,0.55)] p-4 w-[clamp(22rem,32vw,32rem)]"
        style={{ transform: appear ? 'translateX(0)' : 'translateX(12px)', opacity: appear ? 1 : 0, transition: 'all 260ms ease' }}
      >
        {/* White-side stand illustration in panel top-left (place stand.png in /public) */}
        {pendingCard.player === PlayerEnum.WHITE && (
          <img
            src={standPng}
            alt="White caster"
            className="pointer-events-none select-none absolute bottom-16 right-2 w-[172px] h-auto z-[10] drop-shadow-[0_12px_26px_rgba(33,150,243,0.38)]"
            style={{ opacity: appear ? 1 : 0, transform: appear ? 'translateY(0)' : 'translateY(4px)', transition: 'all 220ms ease' }}
          />
        )}
        {/* Persona-like header stripes */}
        <div className="relative mb-3 overflow-hidden rounded-xl">
          <div className="h-10 w-full" style={{
            background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 6px, rgba(255,255,255,0.04) 6px 12px), linear-gradient(135deg, rgba(236,72,153,0.35), rgba(59,130,246,0.35))'
          }} />
          <div className="pointer-events-none absolute inset-0" style={{
            background: 'radial-gradient(60% 120% at 90% 20%, rgba(251,191,36,0.25), transparent), radial-gradient(70% 140% at 0% 100%, rgba(14,165,233,0.18), transparent)'
          }} />
          <div className="absolute inset-0 ring-1 ring-white/10 rounded-xl" />
          <div className="absolute left-3 top-1 text-xs font-extrabold tracking-[0.28em] text-slate-950 uppercase mix-blend-overlay">Skill Cast</div>
        </div>
        {/* 卡牌名称 + 玩家标识 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-amber-300/90 flex items-center justify-center shadow">
            <span className="text-slate-900 text-xs font-extrabold">{PLAYER_NAMES[actingPlayer][0]}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-amber-100 font-bold text-sm tracking-wide">{pendingCard.card.nameZh || pendingCard.card.nameEn || '技能卡'}</h3>
            <div className="text-amber-200/80 text-[0.7rem]">发动技能</div>
          </div>
        </div>

        {canCounter ? (
          <div className="space-y-2">
            <div className="text-amber-100 text-xs font-semibold">
              {PLAYER_NAMES[responder!]} 可以反击：
            </div>
            <div className="flex flex-wrap gap-1">
              {availableCounters.map((card, idx) => {
                const tid = card._tid ?? card.tid;
                const key = card.instanceId ?? `${tid}-${idx}`;
                const isSelected = selectedCounter && ((selectedCounter.instanceId && selectedCounter.instanceId === card.instanceId) || (selectedCounter._tid ?? selectedCounter.tid) === tid);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCounter(card)}
                    className={`px-2 py-1 text-xs rounded transition-all duration-150 font-semibold ring-1 ${
                      isSelected
                        ? 'bg-fuchsia-600/90 text-white ring-white/20 shadow'
                        : 'bg-slate-800/70 text-amber-100 ring-white/10 hover:bg-fuchsia-600/60 hover:text-white'
                    }`}
                  >
                    {card.nameZh || card.nameEn || `卡${idx + 1}`}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={!selectedCounter}
                onClick={() => selectedCounter && onResolve(true, selectedCounter)}
                className="px-3 py-1 bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white text-xs font-bold rounded-full shadow shadow-rose-500/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                反击！
              </button>
              <button
                type="button"
                onClick={() => {
                  onResolve(false, null);
                  setSelectedCounter(null);
                }}
                className="px-3 py-1 bg-slate-700/80 text-white text-xs font-bold rounded-full shadow"
              >
                放弃
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            {pendingCard.player === PlayerEnum.WHITE && responder === PlayerEnum.BLACK ? (
              // 敌方技能，无可反击：给出情绪化按钮等价"放弃反击"
              <div className="flex items-center gap-2">
                {['可恶', '我知道了', '竟然'].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { onReact?.(label); onResolve(false, null); }}
                    className={[
                      'px-3 py-1 rounded-full text-xs font-bold text-white shadow transition-colors duration-150',
                      i === 0
                        ? 'bg-rose-600/90 hover:bg-rose-600'
                        : i === 1
                        ? 'bg-slate-700/90 hover:bg-slate-700'
                        : 'bg-amber-600/90 hover:bg-amber-600'
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : pendingCard.player === PlayerEnum.BLACK ? (
              // 我方技能：瞬发显示倒计时+"发动"，非瞬发不显示倒计时，仅允许取消
              isInstant ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onResolve(false, null)}
                    className="px-4 py-2 bg-fuchsia-600/90 text-white font-bold text-sm rounded-full shadow hover:bg-fuchsia-600"
                  >
                    发动
                  </button>
                  <CountdownCancel onCancel={onCancel} onTimeout={() => onResolve(false, null)} ms={confirmMs} />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onCancel?.()}
                    className="px-4 py-2 bg-slate-700/90 text-white font-bold text-sm rounded-full shadow hover:bg-slate-700"
                  >
                    取消
                  </button>
                  <span className="text-[0.7rem] text-slate-300">等待对手是否反击…</span>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

const CountdownCancel: React.FC<{ onCancel?: () => void; onTimeout: () => void; ms?: number }> = ({ onCancel, onTimeout, ms = 3000 }) => {
  const [remain, setRemain] = useState(Math.max(1, Math.round(ms / 1000)));
  const cancelledRef = React.useRef(false);
  const firedRef = React.useRef(false);
  useEffect(() => {
    const t1 = window.setInterval(() => {
      setRemain(prev => {
        if (prev <= 1) {
          window.clearInterval(t1);
          if (!cancelledRef.current && !firedRef.current) {
            firedRef.current = true;
            onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(t1);
  }, [onTimeout, ms]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          cancelledRef.current = true;
          onCancel?.();
        }}
        className="px-4 py-2 bg-slate-700/90 text-white font-bold text-sm rounded-full shadow hover:bg-slate-700"
      >
        取消
      </button>
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/90 text-white font-extrabold text-sm ring-1 ring-white/10">
        {remain}
      </span>
    </div>
  );
};
