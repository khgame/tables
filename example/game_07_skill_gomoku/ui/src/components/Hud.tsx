import React from 'react';
import type { GameStatus, Player, RawCard } from '../types';
import type { AiScenario } from '../ai/openAiClient';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import { CardFrame } from './CardFrame';
import { HandPanel } from './HandPanel';
import { CardView } from './CardView';

const AVATAR_GLYPHS: React.ReactNode[] = [
  (
    <svg viewBox="0 0 120 120" className="avatar-badge__glyph" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="avatar-black-core" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="70%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#0b1220" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#avatar-black-core)" />
      <path d="M38 80C50 66 54 50 60 32C66 50 70 66 82 80C70 90 50 90 38 80Z" fill="#93c5fd" opacity="0.85" />
      <circle cx="68" cy="46" r="12" fill="#bfdbfe" opacity="0.8" />
    </svg>
  ),
  (
    <svg viewBox="0 0 120 120" className="avatar-badge__glyph" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="avatar-white-core" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="70%" stopColor="#be185d" />
          <stop offset="100%" stopColor="#2b0618" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#avatar-white-core)" />
      <path d="M52 32L68 32L82 70L60 92L38 70L52 32Z" fill="#fbcfe8" opacity="0.9" />
      <circle cx="60" cy="46" r="10" fill="#fecdd3" opacity="0.85" />
    </svg>
  )
];

const statsMeta = [
  { key: 'hand', label: '手牌' },
  { key: 'move', label: '落子' },
  { key: 'stones', label: '棋子' },
  { key: 'grave', label: '墓地' },
  { key: 'sea', label: '什刹海' }
] as const;

type StatsItem = (typeof statsMeta)[number]['key'];

type StatsMap = Record<StatsItem, number>;

const buildStats = (partial: Partial<StatsMap>): StatsMap => ({
  hand: partial.hand ?? 0,
  move: partial.move ?? 0,
  stones: partial.stones ?? 0,
  grave: partial.grave ?? 0,
  sea: partial.sea ?? 0
});

const StatsPills: React.FC<{ stats: StatsMap }> = ({ stats }) => (
  <div className="stats-pills">
    {statsMeta.map(item => (
      <span key={item.key} className="stats-pills__item">
        <span className="stats-pills__label">{item.label}</span>
        <span className="stats-pills__value">{stats[item.key]}</span>
      </span>
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
  const palette =
    player === PlayerEnum.BLACK
      ? { base: 'rgba(30,64,175,0.65)', glow: 'rgba(96,165,250,0.55)' }
      : { base: 'rgba(190,18,60,0.65)', glow: 'rgba(248,113,113,0.55)' };
  const character = characters[player];
  const freeze = statuses.freeze[player];
  const skip = statuses.skip[player];

  return (
    <div className={`avatar-badge avatar-badge--${player === PlayerEnum.BLACK ? 'player' : 'opponent'} ${isCurrent ? 'avatar-badge--active' : ''}`}>
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
        <div className="avatar-badge__character">{character ? `角色：${character.name}` : '未召唤角色'}</div>
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

export interface OpponentHudProps {
  handCount: number;
  graveyardCount: number;
  shichahaiCount: number;
  moveCount: number;
  stonesCount: number;
  characters: GameStatus['characters'];
  statuses: GameStatus['statuses'];
  isCurrent: boolean;
  aiStatus?: { scenario: AiScenario['kind'] | null; message: string; reason?: string };
}

export const OpponentHUD: React.FC<OpponentHudProps> = ({
  handCount,
  graveyardCount,
  shichahaiCount,
  moveCount,
  stonesCount,
  characters,
  statuses,
  isCurrent,
  aiStatus
}) => {
  const showStatus = Boolean(aiStatus?.scenario);
  const scenario = aiStatus?.scenario ?? 'idle';
  return (
  <div className="hud-strip hud-strip--opponent">
    <div className="hud-strip__avatar">
      <AvatarBadge player={PlayerEnum.WHITE} characters={characters} statuses={statuses} isCurrent={isCurrent} />
      <StatsPills stats={buildStats({ hand: handCount, move: moveCount, stones: stonesCount, grave: graveyardCount, sea: shichahaiCount })} />
    </div>
    <div className="hud-strip__cards">
      <OpponentDeckFan count={handCount} />
      {showStatus && (
        <div className={`opponent-status-badge opponent-status-badge--${scenario}`}>
          <span className="opponent-status-badge__spinner" aria-hidden />
          <span className="opponent-status-badge__text">
            <span>{aiStatus?.message}</span>
            {aiStatus?.reason && <span className="opponent-status-badge__reason">{aiStatus.reason}</span>}
          </span>
        </div>
      )}
    </div>
  </div>
  );
};

export interface PlayerHudProps {
  handCards: RawCard[];
  disabled: boolean;
  statuses: GameStatus['statuses'];
  moveCount: number;
  stonesCount: number;
  characters: GameStatus['characters'];
  graveyardCount: number;
  shichahaiCount: number;
  confirmDisabled: boolean;
  onConfirm: () => void;
  onCardHover?: (card: RawCard | null) => void;
  onCardDragStart?: (index: number) => void;
  onCardDragEnd?: () => void;
  isCurrent: boolean;
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
  confirmDisabled,
  onConfirm,
  onCardHover,
  onCardDragStart,
  onCardDragEnd,
  isCurrent
}) => (
  <div className="player-hud">
    <div className="player-hud__avatar">
      <AvatarBadge player={PlayerEnum.BLACK} characters={characters} statuses={statuses} isCurrent={isCurrent} />
      <StatsPills stats={buildStats({ hand: handCards.length, move: moveCount, stones: stonesCount, grave: graveyardCount, sea: shichahaiCount })} />
    </div>
    <div className="player-hud__hand">
      <div className="player-hand-meta">
        <div className={`player-hand-meta__hint ${disabled ? 'player-hand-meta__hint--disabled' : ''}`}>拖拽技能卡到棋盘中央即可发动</div>
        <div className="player-hand-meta__actions">
          <ConfirmButton disabled={confirmDisabled} onClick={onConfirm} />
        </div>
      </div>
      <HandPanel
        className="player-hand-meta__cards"
        cards={handCards}
        disabled={disabled}
        onCardHover={onCardHover}
        onCardDragStart={onCardDragStart}
        onCardDragEnd={onCardDragEnd}
      />
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
          <div key={idx} className="card-back-fan__item" style={{ transform: `translateX(${translate}px) rotate(${angle}deg)` }}>
            <CardFrame type="Counter" variant="back" width={size} height={size * 1.618} />
          </div>
        );
      })}
    </div>
  );
};

export const OpponentDeckFan: React.FC<{ count: number }> = ({ count }) => (
  <div className="opponent-deck-stack">
    <CardBackFan count={count} size={96} />
  </div>
);

export const ConfirmButton: React.FC<{ disabled: boolean; onClick: () => void }> = ({ disabled, onClick }) => (
  <button type="button" onClick={disabled ? undefined : onClick} className={`confirm-button ${disabled ? 'confirm-button--disabled' : ''}`}>
    <span>确认</span>
  </button>
);

export const CardPreviewOverlay: React.FC<{ card: RawCard }> = ({ card }) => (
  <div className="card-preview-overlay">
    <CardView card={card} variant="showcase" revealBack={false} disabled />
  </div>
);
