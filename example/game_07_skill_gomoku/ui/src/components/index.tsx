import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import type { GameLogEntry, Player, RawCard, TargetRequest, GameStatus, GraveyardEntry, ShichahaiEntry, VisualEffectEvent } from '../types';
import { chooseRemovalTarget, chooseRetrievalPlacement } from '../ai/gomokuAi';
import { SkillEffect } from '../skills/effects';
import { CardFrame, CardBadges, CARD_TYPE_PALETTES } from './CardFrame';
import { CardArtwork } from './CardArtwork';

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
    <div className={['gomoku-board', className ?? ''].join(' ')} style={style}>
      <div className="gomoku-board__surface">
        <div className="gomoku-board__grid" style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}>
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
              const classes = ['gomoku-board__cell'];
              if (!value && !highlight) classes.push('gomoku-board__cell--interactive');
              if (isLast) classes.push('gomoku-board__cell--last');
              if (highlight === 'target') classes.push('gomoku-board__cell--target');
              if (highlight === 'origin') classes.push('gomoku-board__cell--origin');

              return (
                <button
                  key={key}
                  type="button"
                  className={classes.join(' ')}
                  onClick={() => handleClick(rowIdx, colIdx)}
                  disabled={Boolean(value) && !highlight}
                >
                  {value === PlayerEnum.BLACK && <div className="gomoku-stone gomoku-stone--black" />}
                  {value === PlayerEnum.WHITE && <div className="gomoku-stone gomoku-stone--white" />}
                </button>
              );
            })
          )}
        </div>
        <div className="gomoku-board__decor gomoku-board__decor--top" />
        <div className="gomoku-board__decor gomoku-board__decor--bottom" />
      </div>
    </div>
  );
};

type CardVariant = 'hand' | 'list' | 'showcase';

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    accent: string;
  }
> = {
  Attack: {
    label: '进攻',
    accent: 'from-orange-400 to-amber-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M21 3L14 10V14L10 18L6 14L3 11L7 7L11 11L18 4L21 3Z"
          fill="currentColor"
        />
      </svg>
    )
  },
  Control: {
    label: '控制',
    accent: 'from-sky-400 to-blue-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  },
  Counter: {
    label: '反击',
    accent: 'from-purple-400 to-fuchsia-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M12 3L4 7V17L12 21L20 17V7L12 3ZM12 5.2L17.5 8L12 10.8L6.5 8L12 5.2ZM6 10.2L11 12.7V17.8L6 15.3V10.2ZM13 17.8V12.7L18 10.2V15.3L13 17.8Z"
          fill="currentColor"
        />
      </svg>
    )
  },
  Support: {
    label: '特殊',
    accent: 'from-cyan-400 to-sky-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  }
};

const TIMING_META: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
  }
> = {
  PreMove: {
    label: '落子前',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M5 12L19 5V19L5 12Z" fill="currentColor" />
      </svg>
    )
  },
  Reaction: {
    label: '反应',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M6 3L3 9H11L8 21L21 7H13L17 3H6Z" fill="currentColor" />
      </svg>
    )
  },
  Anytime: {
    label: '任意时',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M12 2L14.2 8.2L20 9L15.2 12.8L16.4 19L12 15.8L7.6 19L8.8 12.8L4 9L9.8 8.2L12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  }
};

const RARITY_LABEL: Record<string, string> = {
  Common: '普通',
  Rare: '稀有',
  Legendary: '传奇'
};

const SPEED_LABEL: Record<string, string> = {
  Instant: '瞬发',
  Normal: '常规'
};

interface CardViewProps {
  card: RawCard;
  onClick?: () => void;
  disabled?: boolean;
  revealBack?: boolean;
  variant?: CardVariant;
  style?: React.CSSProperties;
}

export const CardView: React.FC<CardViewProps> = ({ card, onClick, disabled, revealBack, variant = 'hand', style }) => {
  const tags = new Set((card.tags ?? '').split('|').map(tag => tag.trim()).filter(Boolean));
  const fusion = tags.has('Fusion');
  const legend = card.rarity === 'Legendary';
  const interactive = !disabled && variant !== 'showcase';
  const hoverClass = interactive && variant !== 'hand' ? 'hover:scale-[1.03] hover:drop-shadow-xl' : '';
  const typeInfo = TYPE_META[card.type] ?? TYPE_META.Support;
  const timingInfo = TIMING_META[card.timing ?? 'Anytime'] ?? TIMING_META.Anytime;
  const palette = CARD_TYPE_PALETTES[card.type] ?? CARD_TYPE_PALETTES.Support;
  const rarityLabel = RARITY_LABEL[card.rarity ?? ''] ?? card.rarity ?? '普通';
  const speedLabel = SPEED_LABEL[card.speed ?? 'Normal'] ?? (card.speed ?? '常规');
  const costValue = card.cost ?? 0;
  const baseWidth = (() => {
    if (style?.width) return undefined;
    if (variant === 'list') return '8.6rem';
    if (variant === 'showcase') return '13.2rem';
    return '11.4rem';
  })();

  const typeAccentClass = typeInfo.accent;
  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={disabled}
      className={[
        'relative',
        variant !== 'showcase' ? 'transition-transform duration-200' : '',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        hoverClass
      ].filter(Boolean).join(' ')}
      style={{ width: baseWidth, aspectRatio: '1 / 1.618', ...style }}
    >
      <CardFrame type={card.type} variant={revealBack ? 'back' : 'front'} className="absolute inset-0 w-full h-full" />
      {!revealBack && (
        <>
          <CardBadges fusion={fusion} legend={legend} />
          <div className="card-overlay">
            <div
              className="card-cost-gem"
              style={{
                background: `radial-gradient(circle at 50% 30%, rgba(255,255,255,0.92), rgba(255,255,255,0.1)), radial-gradient(circle at 50% 120%, ${palette.core}, ${palette.back})`
              }}
            >
              <span>{costValue}</span>
            </div>
            <div className="card-type-banner">
              <div className={`card-type-banner__inner bg-gradient-to-r ${typeAccentClass}`}>
                <span className="card-type-banner__icon">{typeInfo.icon}</span>
                <span>{typeInfo.label}</span>
              </div>
            </div>
            <div className="card-meta-chip">
              <span className="card-meta-chip__icon">{timingInfo.icon}</span>
              <span className="card-meta-chip__text">{timingInfo.label}</span>
              <span className="card-meta-chip__divider" />
              <span className="card-meta-chip__speed">{speedLabel}</span>
            </div>
            <div className="card-art-frame">
              <CardArtwork card={card} />
            </div>
            <div className="card-title-block">
              <h4 className="card-title">{card.nameZh}</h4>
              {card.nameEn && <span className="card-subtitle">{card.nameEn}</span>}
            </div>
            <p className="card-effect-text">{card.effect}</p>
            <div className="card-ribbon">
              <span>{rarityLabel}</span>
              {fusion && <span>张兴朝在场</span>}
              {legend && <span>稀有能力</span>}
            </div>
            <div className="card-quote">
              {card.quote ? `“${card.quote}”` : '——'}
            </div>
          </div>
        </>
      )}
    </button>
  );
};

interface HandPanelProps {
  cards: RawCard[];
  onCardClick: (index: number) => void;
  disabled: boolean;
}

export const HandPanel: React.FC<HandPanelProps> = ({ cards, onCardClick, disabled }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredCard = hovered !== null ? cards[hovered] : null;

  if (cards.length === 0) {
    return <div className="h-40 flex items-center justify-center text-amber-200/70 text-sm italic">暂无手牌</div>;
  }

  const total = cards.length;
  const mid = (total - 1) / 2;
  const angleRange = Math.min(55, 24 + total * 4);
  const angleStep = total > 1 ? angleRange / (total - 1) : 0;
  const baseWidth = total >= 5 ? 9.6 : 10.5;

  return (
    <div className="relative h-52">
      <div className="absolute inset-x-0 bottom-2 h-32 bg-gradient-to-t from-amber-500/30 via-amber-300/10 to-transparent blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
        <div className="w-[80%] h-40 bg-gradient-to-t from-[#14243a]/70 via-transparent to-transparent rounded-full" />
      </div>
      {hoveredCard && (
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 drop-shadow-2xl pointer-events-none">
          <CardView card={hoveredCard} variant="showcase" style={{ width: '13rem' }} />
        </div>
      )}
      <div className="relative h-full">
        {cards.map((card, idx) => {
          const offset = idx - mid;
          const angle = total > 1 ? (idx - mid) * angleStep - angleRange / 2 : 0;
          const translateX = offset * 70;
          const isHovered = hovered === idx;
          const translateY = isHovered ? -28 : -Math.abs(angle) * 0.6;
          const zIndex = 100 + idx + (isHovered ? 50 : 0);

          return (
            <div
              key={card._tid ?? `${card.nameZh}-${idx}`}
              className="absolute left-1/2 bottom-0 origin-bottom"
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg) ${isHovered ? 'scale(1.08)' : 'scale(0.95)'}`,
                transformOrigin: 'center bottom',
                zIndex
              }}
            >
              <div
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => !disabled && onCardClick(idx)}
                className="cursor-pointer"
              >
                <CardView card={card} variant="hand" disabled={disabled} style={{ width: `${baseWidth}rem` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


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

  const typeClasses: Record<string, string> = {
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

  return (
    <div className="battle-log">
      <div className="battle-log__header">
        <h3 className="battle-log__title">对局记录</h3>
      </div>
      <div ref={ref} className="battle-log__body">
        {logs.map((log, idx) => (
          <div key={idx} className={`battle-log__entry ${typeClasses[log.type] ?? ''}`}>
            <span>{log.message}</span>
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
    <div className="pending-panel">
      <div className="pending-panel__glass">
        <div className="pending-panel__title">
          <span className="pending-panel__tag">{PLAYER_NAMES[actingPlayer]}</span>
          <span>发动技能</span>
        </div>
        <div className="pending-panel__content">
          <div className="pending-panel__primary-card">
            <CardView card={pendingCard.card} variant="list" style={{ width: '8.4rem' }} />
          </div>
          <p className="pending-panel__effect">{pendingCard.card.effect}</p>
        </div>
        {canCounter ? (
          <Fragment>
            <div className="pending-panel__subtitle">
              {PLAYER_NAMES[responder!]} 可用反击卡
            </div>
            <div className="pending-panel__counter-grid">
              {availableCounters.map(card => {
                const tid = card._tid ?? card.tid;
                const isSelected = selectedCounter && (selectedCounter._tid ?? selectedCounter.tid) === tid;
                const handleSelect = () => setSelectedCounter(card);
                return (
                  <div
                    key={tid}
                    className={`pending-panel__counter-card ${isSelected ? 'pending-panel__counter-card--active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={handleSelect}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelect();
                      }
                    }}
                  >
                    <CardView card={card} variant="list" style={{ width: '6.6rem' }} />
                  </div>
                );
              })}
            </div>
            <div className="pending-panel__actions">
              <button
                type="button"
                disabled={!selectedCounter}
                onClick={() => selectedCounter && onResolve(true, selectedCounter)}
                className="pending-panel__button pending-panel__button--counter"
              >
                使用反击卡
              </button>
              <button
                type="button"
                onClick={() => {
                  onResolve(false, null);
                  setSelectedCounter(null);
                }}
                className="pending-panel__button pending-panel__button--pass"
              >
                放弃反击
              </button>
            </div>
          </Fragment>
        ) : (
          <div className="pending-panel__actions">
            <button
              type="button"
              onClick={() => onResolve(false, null)}
              className="pending-panel__button pending-panel__button--confirm"
            >
              确认生效
            </button>
          </div>
        )}
      </div>
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
  variant?: 'player' | 'opponent';
}

const AVATAR_GLYPHS: Record<Player, React.ReactNode> = {
  [PlayerEnum.BLACK]: (
    <svg viewBox="0 0 120 120" className="avatar-badge__glyph" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="avatar-black-core" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="70%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#0b1220" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#avatar-black-core)" />
      <path
        d="M38 80C50 66 54 50 60 32C66 50 70 66 82 80C70 90 50 90 38 80Z"
        fill="#93c5fd"
        opacity="0.85"
      />
      <circle cx="68" cy="46" r="12" fill="#bfdbfe" opacity="0.8" />
    </svg>
  ),
  [PlayerEnum.WHITE]: (
    <svg viewBox="0 0 120 120" className="avatar-badge__glyph" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="avatar-white-core" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="70%" stopColor="#be185d" />
          <stop offset="100%" stopColor="#2b0618" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#avatar-white-core)" />
      <path
        d="M52 32L68 32L82 70L60 92L38 70L52 32Z"
        fill="#fbcfe8"
        opacity="0.9"
      />
      <circle cx="60" cy="46" r="10" fill="#fecdd3" opacity="0.85" />
    </svg>
  )
};

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  player,
  handCount,
  moveCount,
  stonesCount,
  characters,
  statuses,
  isCurrent,
  variant = 'player'
}) => {
  const palette =
    player === PlayerEnum.BLACK
      ? { base: 'rgba(30,64,175,0.65)', glow: 'rgba(96,165,250,0.55)' }
      : { base: 'rgba(190,18,60,0.65)', glow: 'rgba(248,113,113,0.55)' };
  const character = characters[player];
  const freeze = statuses.freeze[player];
  const skip = statuses.skip[player];

  return (
    <div className={`avatar-badge avatar-badge--${variant} ${isCurrent ? 'avatar-badge--active' : ''}`}>
      <div
        className="avatar-badge__portrait"
        style={{
          background: `radial-gradient(circle at 50% 35%, rgba(255,255,255,0.65), rgba(255,255,255,0)), radial-gradient(circle at 50% 80%, ${palette.glow}, ${palette.base})`
        }}
      >
        {AVATAR_GLYPHS[player]}
      </div>
      <div className="avatar-badge__body">
        <div className="avatar-badge__row">
          {PLAYER_NAMES[player]}
          {isCurrent && <span className="avatar-badge__tag">当前行动</span>}
        </div>
        <div className="avatar-badge__character">
          {character ? `角色：${character.name}` : '未召唤角色'}
        </div>
        <div className="avatar-badge__stats">
          <span>手牌 {handCount}</span>
          <span>落子 {moveCount}</span>
          <span>棋子 {stonesCount}</span>
        </div>
      </div>
      {(freeze > 0 || skip > 0) && (
        <div className="avatar-badge__status">
          {freeze > 0 && <span className="avatar-status avatar-status--freeze">冻结 {freeze}</span>}
          {skip > 0 && <span className="avatar-status avatar-status--skip">跳过 {skip}</span>}
        </div>
      )}
    </div>
  );
};

interface ZonePanelProps {
  title: string;
  graveyard: GraveyardEntry[];
  shichahai: ShichahaiEntry[];
  variant?: 'player' | 'opponent';
}

const GraveIcon = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path
      d="M12 2C7.58 2 4 5.58 4 10V20H20V10C20 5.58 16.42 2 12 2ZM12 4C15.31 4 18 6.69 18 10V18H6V10C6 6.69 8.69 4 12 4ZM11 6V8H9V10H11V18H13V10H15V8H13V6H11Z"
      fill="currentColor"
    />
  </svg>
);

const SeaIcon = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path
      d="M4 6C6 6 7 8 9 8C11 8 12 6 14 6C16 6 18 8 20 8V10C18 10 16 8 14 8C12 8 11 10 9 10C7 10 6 8 4 8V6ZM4 12C6 12 7 14 9 14C11 14 12 12 14 12C16 12 18 14 20 14V16C18 16 16 14 14 14C12 14 11 16 9 16C7 16 6 14 4 14V12ZM4 18C6 18 7 20 9 20C11 20 12 18 14 18C16 18 18 20 20 20V22C18 22 16 20 14 20C12 20 11 22 9 22C7 22 6 20 4 20V18Z"
      fill="currentColor"
    />
  </svg>
);

export const ZonePanel: React.FC<ZonePanelProps> = ({ title, graveyard, shichahai, variant = 'player' }) => (
  <div className={`zone-panel zone-panel--${variant}`}>
    <header className="zone-panel__header">
      <h3 className="zone-panel__title">{title}</h3>
      <div className="zone-panel__summary">
        <span className="zone-chip zone-chip--grave">
          {GraveIcon}
          <span>{graveyard.length}</span>
        </span>
        <span className="zone-chip zone-chip--sea">
          {SeaIcon}
          <span>{shichahai.length}</span>
        </span>
      </div>
    </header>
    <section className="zone-section">
      <div className="zone-section__title">
        <span className="zone-section__icon">{GraveIcon}</span>
        <span>墓地</span>
      </div>
      {graveyard.length === 0 ? (
        <div className="zone-empty">暂无卡牌</div>
      ) : (
        <div className="zone-scroll zone-scroll--grave">
          {graveyard.map(item => (
            <div key={item.id} className="zone-card">
              <div className="zone-card__frame">
                <CardFrame
                  type={item.cardType ?? 'Support'}
                  width={62}
                  height={100}
                  variant="front"
                />
                <span className="zone-card__badge">T{item.turn}</span>
              </div>
              <div className="zone-card__info">
                <div className="zone-card__name">{item.cardName}</div>
                <div className="zone-card__meta">{describeReason(item.reason)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
    <section className="zone-section">
      <div className="zone-section__title">
        <span className="zone-section__icon">{SeaIcon}</span>
        <span>什刹海</span>
      </div>
      {shichahai.length === 0 ? (
        <div className="zone-empty">暂无记录</div>
      ) : (
        <div className="zone-scroll zone-scroll--sea">
          {shichahai.map(entry => (
            <div key={entry.id} className="zone-token">
              <div className="zone-token__glyph">
                <span>{entry.row + 1}</span>
                <span>{entry.col + 1}</span>
              </div>
              <div className="zone-token__body">
                <div className="zone-token__title">{PLAYER_NAMES[entry.owner]} 的棋子</div>
                <div className="zone-token__meta">
                  第 {entry.turn} 回合 · {entry.cardName ?? '技能效果'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
);

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

const HUD_ICONS = {
  hand: (
    <svg viewBox="0 0 24 24" className="hud-chip__icon">
      <path
        d="M4 6H20V8L12 13L4 8V6ZM4 10L12 15L20 10V18H4V10Z"
        fill="currentColor"
      />
    </svg>
  ),
  move: (
    <svg viewBox="0 0 24 24" className="hud-chip__icon">
      <path d="M12 2L8 6H11V18H13V6H16L12 2ZM6 20V22H18V20H6Z" fill="currentColor" />
    </svg>
  ),
  stones: (
    <svg viewBox="0 0 24 24" className="hud-chip__icon">
      <path
        d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM12 6C14.21 6 16 7.79 16 10C16 12.21 14.21 14 12 14C9.79 14 8 12.21 8 10C8 7.79 9.79 6 12 6ZM12 16C14.67 16 17.31 17.19 18.94 19.69C17.27 21.14 14.79 22 12 22C9.21 22 6.73 21.14 5.06 19.69C6.69 17.19 9.33 16 12 16Z"
        fill="currentColor"
      />
    </svg>
  )
};

const HudChip: React.FC<{ icon: React.ReactNode; label: string; value: number; tone?: 'sky' | 'rose' | 'amber' | 'purple' }> = ({
  icon,
  label,
  value,
  tone = 'sky'
}) => (
  <div className={`hud-chip hud-chip--${tone}`}>
    {icon}
    <div className="hud-chip__meta">
      <span className="hud-chip__label">{label}</span>
      <span className="hud-chip__value">{value}</span>
    </div>
  </div>
);

const EFFECT_STYLE_MAP: Record<string, string> = {
  [SkillEffect.RemoveToShichahai]: 'skill-effect--sand',
  [SkillEffect.FreezeOpponent]: 'skill-effect--freeze',
  [SkillEffect.InstantWin]: 'skill-effect--win',
  [SkillEffect.CleanSweep]: 'skill-effect--sweep',
  [SkillEffect.TimeRewind]: 'skill-effect--rewind',
  [SkillEffect.SkipNextTurn]: 'skill-effect--skip',
  [SkillEffect.SummonCharacter]: 'skill-effect--summon',
  [SkillEffect.ForceExit]: 'skill-effect--banish',
  [SkillEffect.CounterCancelFusion]: 'skill-effect--counter',
  [SkillEffect.CounterReverseWin]: 'skill-effect--counter',
  [SkillEffect.CounterRetrieve]: 'skill-effect--counter',
  [SkillEffect.CounterPreventRemoval]: 'skill-effect--counter',
  [SkillEffect.CounterThaw]: 'skill-effect--counter',
  [SkillEffect.CounterRestoreBoard]: 'skill-effect--counter',
  [SkillEffect.CounterPunish]: 'skill-effect--counter'
};

export const SkillEffectLayer: React.FC<{ events: VisualEffectEvent[] }> = ({ events }) => (
  <div className="skill-effect-layer">
    {events.map(event => {
      const tone = event.player === PlayerEnum.BLACK ? 'player' : 'opponent';
      const styleClass = EFFECT_STYLE_MAP[event.effectId ?? ''] ?? 'skill-effect--default';
      return (
        <div key={event.id} className={`skill-effect ${styleClass} skill-effect--${tone}`}>
          <div className="skill-effect__burst" />
          <div className="skill-effect__label">{event.cardName}</div>
        </div>
      );
    })}
  </div>
);

interface OpponentHudProps {
  handCount: number;
  graveyardCount: number;
  shichahaiCount: number;
  moveCount: number;
  stonesCount: number;
  characters: GameStatus['characters'];
  statuses: GameStatus['statuses'];
  isCurrent: boolean;
}

export const OpponentHUD: React.FC<OpponentHudProps> = ({
  handCount,
  graveyardCount,
  shichahaiCount,
  moveCount,
  stonesCount,
  characters,
  statuses,
  isCurrent
}) => (
  <div className="hud-bar hud-bar--opponent">
    <AvatarBadge
      player={PlayerEnum.WHITE}
      handCount={handCount}
      moveCount={moveCount}
      stonesCount={stonesCount}
      characters={characters}
      statuses={statuses}
      isCurrent={isCurrent}
      variant="opponent"
    />
    <div className="hud-bar__chips">
      <HudChip icon={HUD_ICONS.hand} label="手牌" value={handCount} tone="sky" />
      <HudChip icon={HUD_ICONS.move} label="落子" value={moveCount} tone="amber" />
      <HudChip icon={HUD_ICONS.stones} label="棋子" value={stonesCount} tone="purple" />
      <HudChip icon={GraveIcon} label="墓地" value={graveyardCount} tone="rose" />
      <HudChip icon={SeaIcon} label="什刹海" value={shichahaiCount} tone="sky" />
    </div>
  </div>
);

interface PlayerHudProps {
  handCards: RawCard[];
  onPlayCard: (index: number) => void;
  disabled: boolean;
  statuses: GameStatus['statuses'];
  moveCount: number;
  stonesCount: number;
  characters: GameStatus['characters'];
  confirmDisabled: boolean;
  onConfirm: () => void;
}

export const PlayerHUD: React.FC<PlayerHudProps> = ({
  handCards,
  onPlayCard,
  disabled,
  statuses,
  moveCount,
  stonesCount,
  characters,
  confirmDisabled,
  onConfirm
}) => (
  <div className="player-hud">
    <div className="player-hud__header">
      <AvatarBadge
        player={PlayerEnum.BLACK}
        handCount={handCards.length}
        moveCount={moveCount}
        stonesCount={stonesCount}
        characters={characters}
        statuses={statuses}
        isCurrent
        variant="player"
      />
      <div className="player-hud__chips">
        <HudChip icon={HUD_ICONS.move} label="落子" value={moveCount} tone="amber" />
        <HudChip icon={HUD_ICONS.stones} label="棋子" value={stonesCount} tone="purple" />
        <HudChip icon={HUD_ICONS.hand} label="手牌" value={handCards.length} tone="sky" />
      </div>
    </div>
    <div className="player-hud__hand">
      <div className="player-hud__hand-canvas">
        <HandPanel cards={handCards} onCardClick={onPlayCard} disabled={disabled} />
      </div>
      <div className="player-hud__actions">
        <div className="player-hud__deck">
          <CardBackFan count={handCards.length} size={90} />
          <span className="player-hud__deck-label">牌库剩余</span>
        </div>
        <ConfirmButton disabled={confirmDisabled} onClick={onConfirm} />
      </div>
    </div>
  </div>
);

const CardBackFan: React.FC<{ count: number; className?: string; size?: number }> = ({ count, className, size = 88 }) => {
  const display = Math.min(count, 5);
  const cards = Array.from({ length: display }, (_, idx) => idx);
  const mid = (display - 1) / 2;

  return (
    <div className={['card-back-fan', className].filter(Boolean).join(' ')}>
      {cards.map(idx => {
        const offset = idx - mid;
        const angle = offset * 9;
        const translate = offset * (size * 0.18);
        return (
          <div
            key={idx}
            className="card-back-fan__item"
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
  <div className="opponent-deck-fan">
    <CardBackFan count={count} size={96} />
  </div>
);

export const ConfirmButton: React.FC<{ disabled: boolean; onClick: () => void }> = ({ disabled, onClick }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    className={`confirm-button ${disabled ? 'confirm-button--disabled' : ''}`}
  >
    <span>确认</span>
  </button>
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
          {card ? (
            <CardView card={card} disabled variant="showcase" style={{ width: '10.5rem' }} />
          ) : (
            <div className="text-gray-500 italic">无手牌</div>
          )}
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
