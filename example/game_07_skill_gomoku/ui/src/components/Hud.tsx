import React from 'react';
import type { GameStatus, Player, RawCard } from '../types';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import { CardFrame } from './CardFrame';
import { HandPanel } from './HandPanel';
import { CardView } from './CardView';
import { GameIcon, FreezeIcon, SkipIcon, CurrentTurnIcon } from './IconLibrary';
import { ComicBubble } from './ComicBubble';
import standPng from '../assets/stand.png';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const AVATAR_GLYPHS: React.ReactNode[] = [
  (
    // 黑方 - 小黑龙
    <svg viewBox="0 0 120 120" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="dragon-body" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>
      </defs>
      {/* 龙身 */}
      <ellipse cx="60" cy="70" rx="35" ry="28" fill="url(#dragon-body)" />
      {/* 龙头 */}
      <ellipse cx="60" cy="45" rx="25" ry="20" fill="url(#dragon-body)" />
      {/* 龙角 */}
      <polygon points="45,35 50,25 55,35" fill="#fbbf24" />
      <polygon points="65,35 70,25 75,35" fill="#fbbf24" />
      {/* 眼睛 */}
      <circle cx="52" cy="42" r="4" fill="#dc2626" />
      <circle cx="68" cy="42" r="4" fill="#dc2626" />
      <circle cx="52" cy="40" r="2" fill="#ffffff" />
      <circle cx="68" cy="40" r="2" fill="#ffffff" />
      {/* 鼻孔 */}
      <ellipse cx="58" cy="50" rx="1.5" ry="2" fill="#000000" />
      <ellipse cx="62" cy="50" rx="1.5" ry="2" fill="#000000" />
      {/* 翅膀 */}
      <ellipse cx="35" cy="65" rx="12" ry="18" fill="#4b5563" transform="rotate(-20 35 65)" />
      <ellipse cx="85" cy="65" rx="12" ry="18" fill="#4b5563" transform="rotate(20 85 65)" />
      {/* 肚子 */}
      <ellipse cx="60" cy="75" rx="20" ry="15" fill="#6b7280" />
    </svg>
  ),
  (
    // 白方 - 小白狐
    <svg viewBox="0 0 120 120" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fox-body" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f9fafb" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </radialGradient>
      </defs>
      {/* 狐狸身体 */}
      <ellipse cx="60" cy="75" rx="28" ry="25" fill="url(#fox-body)" />
      {/* 狐狸头 */}
      <ellipse cx="60" cy="50" rx="22" ry="18" fill="url(#fox-body)" />
      {/* 狐狸耳朵 */}
      <ellipse cx="48" cy="35" rx="8" ry="12" fill="url(#fox-body)" />
      <ellipse cx="72" cy="35" rx="8" ry="12" fill="url(#fox-body)" />
      <ellipse cx="48" cy="35" rx="4" ry="6" fill="#fbbf24" />
      <ellipse cx="72" cy="35" rx="4" ry="6" fill="#fbbf24" />
      {/* 眼睛 */}
      <circle cx="53" cy="46" r="3" fill="#000000" />
      <circle cx="67" cy="46" r="3" fill="#000000" />
      <circle cx="54" cy="44" r="1" fill="#ffffff" />
      <circle cx="68" cy="44" r="1" fill="#ffffff" />
      {/* 鼻子 */}
      <ellipse cx="60" cy="52" rx="2" ry="1.5" fill="#000000" />
      {/* 嘴巴 */}
      <path d="M60 54 Q56 57 54 55 M60 54 Q64 57 66 55" stroke="#000000" strokeWidth="1" fill="none" />
      {/* 尾巴 */}
      <ellipse cx="85" cy="80" rx="15" ry="8" fill="url(#fox-body)" transform="rotate(45 85 80)" />
      <ellipse cx="85" cy="80" rx="8" ry="4" fill="#fbbf24" transform="rotate(45 85 80)" />
      {/* 胸前白毛 */}
      <ellipse cx="60" cy="70" rx="15" ry="12" fill="#ffffff" />
    </svg>
  )
];

const statsMeta = [
  { key: 'hand', label: '手牌', icon: 'hand' },
  { key: 'move', label: '落子', icon: 'move' },
  { key: 'stones', label: '棋子', icon: 'stones' }
] as const;

type StatsItem = (typeof statsMeta)[number]['key'];

type StatsMap = Record<StatsItem, number>;

const buildStats = (partial: Partial<StatsMap>): StatsMap => ({
  hand: partial.hand ?? 0,
  move: partial.move ?? 0,
  stones: partial.stones ?? 0
});

const StatsPills: React.FC<{ stats: StatsMap }> = ({ stats }) => (
  <div className="flex flex-wrap items-center gap-1">
    {statsMeta.map(item => (
      <div
        key={item.key}
        className="flex items-center gap-1 rounded-sm bg-slate-600/40 px-1 py-1 text-xs backdrop-blur-sm"
      >
        <GameIcon name={item.icon} size="xs" className="text-slate-400" />
        <span className="text-slate-400 font-medium">{item.label}</span>
        <span className="text-slate-200 font-bold">{stats[item.key]}</span>
      </div>
    ))}
  </div>
);

export interface AvatarBadgeProps {
  player: Player;
  characters: GameStatus['characters'];
  statuses: GameStatus['statuses'];
  isCurrent: boolean;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({ player, characters, statuses, isCurrent }) => {
  const character = characters[player];
  const freeze = statuses.freeze[player];
  const skip = statuses.skip[player];

  const isBlack = player === PlayerEnum.BLACK;

  return (
    <div className={`relative flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 ${
      isCurrent
        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25'
        : 'bg-slate-700 shadow-md'
    }`}>

      {/* 当前回合指示器 */}
      {isCurrent && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 shadow-md">
          <CurrentTurnIcon size="xs" className="text-yellow-900" />
        </div>
      )}

      {/* 头像 */}
      <div className={`relative h-14 w-14 shrink-0 rounded-xl shadow-sm overflow-hidden ${isBlack ? 'bg-blue-500' : 'bg-pink-500'}`}>
        {isBlack ? (
          <div className="flex h-full w-full items-center justify-center">
            {AVATAR_GLYPHS[player]}
          </div>
        ) : (
          <img
            src={standPng}
            alt="White avatar"
            className="h-full w-full object-cover object-top select-none pointer-events-none origin-top"
            style={{ transform: 'scale(1.35)' }}
          />
        )}
      </div>

      {/* 玩家信息 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold truncate ${
            isCurrent ? 'text-white' : 'text-slate-200'
          }`}>
            {PLAYER_NAMES[player]}
          </span>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-1 py-0.5 text-[7px] font-medium text-white">
              回合中
            </span>
          )}
        </div>
        <div className={`text-sm truncate ${
          isCurrent ? 'text-emerald-100' : 'text-slate-400'
        }`}>
          {character ? character.name : '未召唤角色'}
        </div>
      </div>

      {/* 状态效果 */}
      {(freeze > 0 || skip > 0) && (
        <div className="flex shrink-0 flex-col gap-1">
          {freeze > 0 && (
            <div className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-2 py-1 text-xs font-medium text-white">
              <FreezeIcon size="xs" />
              冻结 {freeze}
            </div>
          )}
          {skip > 0 && (
            <div className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2 py-1 text-xs font-medium text-white">
              <SkipIcon size="xs" />
              跳过 {skip}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface OpponentHudProps {
  handCards: RawCard[];
  graveyardCount: number;
  shichahaiCount: number;
  moveCount: number;
  stonesCount: number;
  characters: GameStatus['characters'];
  statuses: GameStatus['statuses'];
  isCurrent: boolean;
  className?: string;
  animateThinking?: boolean;
  bubble?: { text: string; tone?: 'prompt' | 'praise' | 'taunt' | 'info' | 'frustrated' } | null;
}

export const OpponentHUD: React.FC<OpponentHudProps> = ({
  handCards,
  graveyardCount,
  shichahaiCount,
  moveCount,
  stonesCount,
  characters,
  statuses,
  isCurrent,
  className,
  animateThinking = false,
  bubble = null
}) => (
  <div className={cx('relative z-[50] flex w-full items-center gap-4', className)}>
    {/* 左侧玩家信息 - 固定宽度 */}
    <div className="relative flex items-center gap-4 rounded-xl p-4 shadow-lg flex-shrink-0 w-[320px] bg-slate-800/70 backdrop-blur-sm overflow-visible">
      <AvatarBadge player={PlayerEnum.WHITE} characters={characters} statuses={statuses} isCurrent={isCurrent} />
      {bubble && (
        <div className="pointer-events-none absolute top-[calc(100%+8px)] right-1">
          <ComicBubble text={bubble.text} tone={bubble.tone ?? 'info'} align="right" direction="up" size="md" />
        </div>
      )}
      <div className="flex flex-col gap-3">
        <StatsPills
          stats={buildStats({ hand: handCards.length, move: moveCount, stones: stonesCount })}
        />
      </div>
    </div>

    {/* 中央手牌区域 - 靠右对齐，避免与棋盘重叠 */}
    <div className="relative flex flex-1 items-start justify-end pr-2 h-[7.5rem] overflow-visible max-w-[560px] ml-auto">
      <HandPanel
        className="w-full"
        cards={handCards}
        disabled={true}
        isOpponent={true}
        animateThinking={animateThinking}
      />
    </div>
  </div>
);

export interface PlayerHudProps {
  handCards: RawCard[];
  disabled: boolean;
  statuses: GameStatus['statuses'];
  moveCount: number;
  stonesCount: number;
  characters: GameStatus['characters'];
  graveyardCount: number;
  shichahaiCount: number;
  onCardHover?: (card: RawCard | null) => void;
  onCardDragStart?: (index: number) => void;
  onCardDragEnd?: () => void;
  isCurrent: boolean;
  className?: string;
  bubble?: { text: string } | null;
}

export const PlayerHUD: React.FC<PlayerHudProps> = ({
  handCards,
  disabled,
  statuses,
  moveCount,
  stonesCount,
  characters,
  graveyardCount,
  shichahaiCount,
  onCardHover,
  onCardDragStart,
  onCardDragEnd,
  isCurrent,
  className,
  bubble = null
}) => (
  <div className={cx('flex w-full items-center gap-4', className)}>
    {/* 左侧玩家信息 - 紧凑设计 */}
    <div className="relative overflow-visible flex items-center gap-3 rounded-xl p-3 shadow-lg flex-shrink-0 w-[320px] bg-slate-800/70 backdrop-blur-sm">
      {bubble && (
        <div className="pointer-events-none absolute -top-16 left-2">
          <ComicBubble text={bubble.text} tone={'info'} align="left" direction="down" size="lg" />
        </div>
      )}
      <AvatarBadge player={PlayerEnum.BLACK} characters={characters} statuses={statuses} isCurrent={isCurrent} />
      <div className="flex flex-col gap-2">
        <span className={cx(
          'text-xs font-medium text-slate-300',
          disabled && 'opacity-60'
        )}>
          拖拽发动技能卡
        </span>
        <StatsPills
          stats={buildStats({ hand: handCards.length, move: moveCount, stones: stonesCount })}
        />
      </div>
    </div>

    {/* 中央手牌区域 - 完全居中 */}
    <div className="relative flex flex-1 items-end justify-center h-[9.5rem]">
      <HandPanel
        className="w-full"
        cards={handCards}
        disabled={disabled}
        onCardHover={onCardHover}
        onCardDragStart={onCardDragStart}
        onCardDragEnd={onCardDragEnd}
      />
    </div>
  </div>
);

const CardBackFan: React.FC<{ count: number; size?: number }> = ({ count, size = 88 }) => {
  const display = Math.min(count, 5);
  const cards = Array.from({ length: display }, (_, idx) => idx);
  const mid = (display - 1) / 2;

  return (
    <div className="flex items-end justify-center">
      {cards.map(idx => {
        const offset = idx - mid;
        const angle = offset * 9;
        const translate = offset * (size * 0.18);
        return (
          <div
            key={idx}
            className="transition-transform duration-150 ease-out"
            style={{ transform: `translateX(${translate}px) rotate(${angle}deg)` }}
          >
            <CardFrame type="Counter" variant="back" width={size} height={size * 1.618} />
          </div>
        );
      })}
    </div>
  );
};

export const OpponentDeckFan: React.FC<{ count: number }> = ({ count }) => (
  <div className="pointer-events-none">
    <CardBackFan count={count} />
  </div>
);
