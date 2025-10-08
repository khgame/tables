import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import type { GameLogEntry, Player, RawCard, TargetRequest, GameStatus, GraveyardEntry, ShichahaiEntry } from '../types';
import { chooseRemovalTarget, chooseRetrievalPlacement } from '../ai/gomokuAi';
import { SkillEffect } from '../skills/effects';
import { CardFrame, CardBadges } from './CardFrame';

export interface BoardProps {
  board: GameStatus['board'];
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
  targetRequest: TargetRequest | null;
  onTargetSelect: (selection: { row: number; col: number }) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Board: React.FC<BoardProps> = ({ board, onCellClick, disabled, targetRequest, onTargetSelect, className, style }) => {
  const lastMove = board.history[board.history.length - 1];
  const inTargetMode = Boolean(targetRequest && targetRequest.type === 'cell');
  const targetCells = useMemo(() => {
    const set = new Set<string>();
    if (inTargetMode && targetRequest?.cells) {
      targetRequest.cells.forEach(cell => set.add(`${cell.row}-${cell.col}`));
    }
    return set;
  }, [inTargetMode, targetRequest]);
  const originKey = targetRequest?.origin ? `${targetRequest.origin.row}-${targetRequest.origin.col}` : null;

  const handleClick = (row: number, col: number) => {
    if (inTargetMode) {
      const key = `${row}-${col}`;
      if (!targetCells.has(key)) return;
      onTargetSelect({ row, col });
      return;
    }
    if (disabled) return;
    onCellClick(row, col);
  };

  return (
    <div
      className={['bg-board p-4 rounded-3xl shadow-2xl border border-amber-500/40', className ?? ''].join(' ')}
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(139,69,19,0.12) 35px, rgba(139,69,19,0.12) 36px), repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(139,69,19,0.12) 35px, rgba(139,69,19,0.12) 36px)',
        ...style
      }}
    >
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}>
        {Array.from({ length: board.size }).map((_, rowIdx) =>
          Array.from({ length: board.size }).map((_, colIdx) => {
            const key = `${rowIdx}-${colIdx}`;
            const highlight = inTargetMode
              ? targetCells.has(key)
                ? 'target'
                : originKey === key
                  ? 'origin'
                  : null
              : null;
            const value = board.get(rowIdx, colIdx);
            const isLast = Boolean(lastMove && lastMove.row === rowIdx && lastMove.col === colIdx);
            return (
              <button
                key={key}
                type="button"
                className={[
                  'relative w-full aspect-[1/1] border border-amber-800/30 transition-all',
                  !value && !highlight ? 'hover:bg-amber-200/40' : '',
                  value === PlayerEnum.BLACK ? 'bg-none' : '',
                  isLast ? 'ring-2 ring-amber-400' : '',
                  highlight === 'target' ? 'ring-2 ring-sky-300 animate-pulse' : '',
                  highlight === 'origin' ? 'ring-2 ring-rose-400' : ''
                ].join(' ')}
                onClick={() => handleClick(rowIdx, colIdx)}
                disabled={Boolean(value) && !highlight}
              >
                {value === PlayerEnum.BLACK && (
                  <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-slate-900 to-black shadow-inner" />
                )}
                {value === PlayerEnum.WHITE && (
                  <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-slate-100 to-white shadow-inner" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

interface CardViewProps {
  card: RawCard;
  onClick?: () => void;
  disabled?: boolean;
  revealBack?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({ card, onClick, disabled, revealBack }) => {
  const tags = new Set((card.tags ?? '').split('|').map(tag => tag.trim()).filter(Boolean));
  const fusion = tags.has('Fusion');
  const legend = card.rarity === 'Legendary';

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        'relative',
        'transition-transform duration-200',
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 hover:drop-shadow-xl'
      ].join(' ')}
      style={{ width: '11rem', aspectRatio: '1 / 1.618' }}
    >
      <CardFrame type={card.type} variant={revealBack ? 'back' : 'front'} className="absolute inset-0 w-full h-full" />
      {!revealBack && (
        <>
          <CardBadges fusion={fusion} legend={legend} />
          <div className="absolute inset-0 flex flex-col justify-between px-5 py-6 text-white pointer-events-none">
            <div className="flex items-start justify-between text-xs uppercase tracking-wide opacity-90">
              <span>{card.type}</span>
              {card.cost !== undefined && <span>Cost {card.cost}</span>}
            </div>
            <div className="flex-1 mt-2 flex flex-col">
              <h4 className="font-black text-lg leading-snug drop-shadow-sm line-clamp-2">{card.nameZh}</h4>
              <p className="mt-2 text-[0.7rem] leading-snug opacity-95 line-clamp-4 whitespace-pre-line">{card.effect}</p>
            </div>
            <div className="text-[0.65rem] opacity-80 italic border-t border-white/30 pt-2 mt-3">
              {fusion
                ? '合体条件：张兴朝在场'
                : card.quote
                  ? `“${card.quote}”`
                  : '——'}
            </div>
          </div>
          {card.artwork && (
            <div
              className="absolute inset-12 rounded-2xl overflow-hidden opacity-30"
              style={{
                backgroundImage: `url(${card.artwork})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}
        </>
      )}
    </button>
  );
};

interface HandPanelProps {
  cards: RawCard[];
  onCardClick: (index: number) => void;
  disabled: boolean;
  player: Player;
}

export const HandPanel: React.FC<HandPanelProps> = ({ cards, onCardClick, disabled, player }) => (
  <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-5 rounded-3xl shadow-2xl border border-amber-500/40 text-amber-100">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-lg tracking-wide text-amber-200">{PLAYER_NAMES[player]} 手牌</h3>
      <span className="text-xs text-amber-200/80">{cards.length} 张</span>
    </div>
    {cards.length === 0 ? (
      <div className="text-amber-200/70 text-sm italic">无手牌</div>
    ) : (
      <div className="flex gap-3 flex-wrap">
        {cards.map((card, idx) => (
          <CardView key={card._tid ?? `${card.nameZh}-${idx}`} card={card} onClick={() => onCardClick(idx)} disabled={disabled} />
        ))}
      </div>
    )}
  </div>
);

interface GameLogProps {
  logs: GameLogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  const typeColors: Record<string, string> = {
    start: 'text-emerald-300 font-bold',
    move: 'text-sky-300',
    card: 'text-violet-300 font-semibold',
    effect: 'text-amber-300',
    counter: 'text-rose-300',
    draw: 'text-teal-300',
    summon: 'text-pink-300 font-semibold',
    win: 'text-emerald-200 font-bold text-lg',
    error: 'text-red-300'
  };

  return (
    <div
      ref={ref}
      className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 rounded-3xl shadow-2xl h-72 overflow-y-auto border border-amber-500/40 text-amber-100"
    >
      <h3 className="font-semibold mb-3 text-lg sticky top-0 bg-stone-900/90 py-1 text-amber-200">对局记录</h3>
      <div className="space-y-1 text-sm">
        {logs.map((log, idx) => (
          <div key={idx} className={typeColors[log.type] ?? 'text-slate-200'}>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

interface PendingCardPanelProps {
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
  const canCounter = responder !== null && availableCounters.length > 0 && !aiEnabled;

  return (
    <div className="bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-500/70 p-4 rounded-3xl shadow-xl space-y-3 text-amber-900">
      <div className="font-semibold text-base">
        {PLAYER_NAMES[actingPlayer]} 使用: {pendingCard.card.nameZh}
      </div>
      <div className="text-sm text-amber-800 whitespace-pre-line">{pendingCard.card.effect}</div>
      {canCounter ? (
        <Fragment>
          <div className="text-sm font-semibold">{PLAYER_NAMES[responder!]} 可用反击卡:</div>
          <div className="flex gap-2 flex-wrap">
            {availableCounters.map(card => (
              <button
                key={card._tid ?? card.tid}
                type="button"
                onClick={() => setSelectedCounter(card)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  selectedCounter && (selectedCounter._tid ?? selectedCounter.tid) === (card._tid ?? card.tid)
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                {card.nameZh}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!selectedCounter}
              onClick={() => selectedCounter && onResolve(true, selectedCounter)}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-all"
            >
              使用反击卡
            </button>
            <button
              type="button"
              onClick={() => {
                onResolve(false, null);
                setSelectedCounter(null);
              }}
              className="bg-stone-700 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-all"
            >
              放弃反击
            </button>
          </div>
        </Fragment>
      ) : (
        <button
          type="button"
          onClick={() => onResolve(false, null)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all"
        >
          确认生效
        </button>
      )}
    </div>
  );
};

interface AvatarBadgeProps {
  player: Player;
  handCount: number;
  moveCount: number;
  stonesCount: number;
  characters: GameStatus['characters'];
  statuses: GameStatus['statuses'];
  isCurrent: boolean;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  player,
  handCount,
  moveCount,
  stonesCount,
  characters,
  statuses,
  isCurrent
}) => {
  const gradient = player === PlayerEnum.BLACK ? 'from-slate-900 via-slate-800 to-slate-700' : 'from-amber-300 via-amber-200 to-amber-100';
  const textColor = player === PlayerEnum.BLACK ? 'text-amber-100' : 'text-stone-900';
  const badge = player === PlayerEnum.BLACK ? '黑' : '白';
  const character = characters[player];
  const freeze = statuses.freeze[player];
  const skip = statuses.skip[player];

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3 rounded-3xl shadow-xl border border-amber-500/40 bg-gradient-to-br ${gradient} ${textColor} ${
        isCurrent ? 'ring-2 ring-amber-400' : 'opacity-90'
      }`}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-2xl font-bold text-stone-900 shadow-inner">
        {badge}
      </div>
      <div className="flex-1 space-y-1">
        <div className="text-xl font-semibold tracking-wide flex items-center gap-2">
          {PLAYER_NAMES[player]}
          {isCurrent && <span className="text-xs bg-amber-500/40 px-2 py-0.5 rounded-full">当前行动</span>}
        </div>
        <div className="text-sm opacity-90">
          {character ? `角色: ${character.name}` : '未召唤角色'}
        </div>
        <div className="text-xs flex gap-3 opacity-80">
          <span>手牌 {handCount}</span>
          <span>落子 {moveCount}</span>
          <span>棋子 {stonesCount}</span>
        </div>
      </div>
      {(freeze > 0 || skip > 0) && (
        <div className="text-xs flex flex-col items-end gap-1">
          {freeze > 0 && <span>冻结: {freeze}</span>}
          {skip > 0 && <span>跳过: {skip}</span>}
        </div>
      )}
    </div>
  );
};

interface ZonePanelProps {
  title: string;
  graveyard: GraveyardEntry[];
  shichahai: ShichahaiEntry[];
}

export const ZonePanel: React.FC<ZonePanelProps> = ({ title, graveyard, shichahai }) => (
  <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-amber-100 rounded-3xl shadow-2xl border border-amber-500/30 p-4 space-y-4 h-full">
    <h3 className="text-lg font-semibold tracking-wide uppercase text-amber-300">{title}</h3>
    <section className="space-y-2 text-sm">
      <header className="font-semibold text-amber-300">墓地</header>
      {graveyard.length === 0 ? (
        <p className="text-xs text-amber-200/70 italic">暂无卡牌</p>
      ) : (
        <ul className="max-h-32 overflow-y-auto pr-1 space-y-1">
          {graveyard.map(item => (
            <li key={item.id} className="flex justify-between gap-3 bg-stone-900/60 rounded-xl px-3 py-1.5">
              <span className="font-medium">{item.cardName}</span>
              <span className="text-xs text-amber-200/70">T{item.turn}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
    <section className="space-y-2 text-sm">
      <header className="font-semibold text-amber-300">什刹海</header>
      {shichahai.length === 0 ? (
        <p className="text-xs text-amber-200/70 italic">尚无被驱逐的棋子</p>
      ) : (
        <ul className="max-h-32 overflow-y-auto pr-1 space-y-1">
          {shichahai.map(entry => (
            <li key={entry.id} className="bg-stone-900/60 rounded-xl px-3 py-1.5 text-xs leading-snug">
              <div className="font-semibold">T{entry.turn} ({entry.row}, {entry.col})</div>
              <div className="opacity-80">来源: {entry.cardName ?? '技能效果'}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  </div>
);

interface MulliganPanelProps {
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
          {card ? <CardView card={card} disabled revealBack={false} /> : <div className="text-gray-500 italic">无手牌</div>}
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

interface SnapshotSelectorProps {
  request: TargetRequest;
  onSelect: (option: { id: string }) => void;
}

export const SnapshotSelector: React.FC<SnapshotSelectorProps> = ({ request, onSelect }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
      <h3 className="text-xl font-bold text-amber-700">{request.title ?? '选择时间节点'}</h3>
      <p className="text-sm text-gray-600">{request.description ?? ''}</p>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {(request.options ?? []).map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect({ id: option.id })}
            className="w-full text-left px-4 py-3 rounded-xl border border-amber-300 hover:bg-amber-50 transition-all"
          >
            第 {option.turn} 回合
            {option.player !== null && option.move ? ` · ${PLAYER_NAMES[option.player]} 落子 (${option.move.row}, ${option.move.col})` : ''}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const buildAIMulliganDecision = (state: GameStatus): { replace: boolean; target?: { row: number; col: number } } => {
  const player = state.mulligan.current;
  if (player === null) return { replace: false };
  const hand = state.hands[player] ?? [];
  if (hand.length === 0) return { replace: false };
  const card = hand[0];
  if (card.tags?.includes('Fusion')) return { replace: false };
  return { replace: Math.random() < 0.3 };
};

export const buildAITargetSelection = (state: GameStatus) => {
  const request = state.targetRequest;
  if (!request) return null;
  if (request.type === 'cell' && request.cells?.length) {
    if (state.pendingAction?.player === PlayerEnum.WHITE && state.pendingAction.card.effectId === SkillEffect.RemoveToShichahai) {
      return chooseRemovalTarget(state.board, PlayerEnum.WHITE);
    }
    if (state.pendingCounter?.player === PlayerEnum.WHITE && state.pendingCounter.card.effectId === SkillEffect.CounterRetrieve) {
      return chooseRetrievalPlacement(state.board, PlayerEnum.WHITE);
    }
    return request.cells[Math.floor(Math.random() * request.cells.length)];
  }
  if (request.type === 'snapshot' && request.options?.length) {
    return { id: request.options[0].id };
  }
  return null;
};
