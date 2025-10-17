import React from 'react';
import type { RawCard } from '../types';
import { CardFrame, CardBadges, CARD_TYPE_PALETTES } from './CardFrame';
import { CardArtwork } from './CardArtwork';

export type CardVariant = 'hand' | 'list' | 'showcase';

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
        <path d="M21 3L14 10V14L10 18L6 14L3 11L7 7L11 11L18 4L21 3Z" fill="currentColor" />
      </svg>
    )
  },
  Control: {
    label: '控制',
    accent: 'from-sky-400 to-blue-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" fill="currentColor" />
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
        <path d="M12 2L14.2 8.2L20 9L15.2 12.8L16.4 19L12 15.8L7.6 19L8.8 12.8L4 9L9.8 8.2L12 2Z" fill="currentColor" />
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

export interface CardViewProps {
  card: RawCard;
  onClick?: () => void;
  disabled?: boolean;
  revealBack?: boolean;
  variant?: CardVariant;
  style?: React.CSSProperties;
  onHover?: (card: RawCard) => void;
  onHoverEnd?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  onClick,
  disabled,
  revealBack,
  variant = 'hand',
  style,
  onHover,
  onHoverEnd,
  onDragStart,
  onDragEnd
}) => {
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
  const enableClick = !disabled && variant !== 'hand' && typeof onClick === 'function';
  const baseWidth = (() => {
    if (style?.width) return undefined;
    if (variant === 'list') return '8.6rem';
    if (variant === 'showcase') return '13.2rem';
    return '11.4rem';
  })();

  const typeAccentClass = typeInfo.accent;
  const cursorClass = disabled ? 'cursor-not-allowed' : enableClick ? 'cursor-pointer' : '';

  return (
    <button
      type="button"
      onClick={enableClick ? onClick : undefined}
      disabled={disabled}
      className={[
        'card-view',
        `card-view--${variant}`,
        variant !== 'showcase' ? 'transition-transform duration-200' : '',
        disabled ? 'card-view--petrified cursor-not-allowed' : '',
        cursorClass,
        hoverClass
      ].filter(Boolean).join(' ')}
      style={{ width: baseWidth, aspectRatio: '1 / 1.618', ...style }}
      data-type={card.type}
      data-variant={variant}
      data-disabled={disabled ? 'true' : 'false'}
      onMouseEnter={() => onHover?.(card)}
      onMouseLeave={() => onHoverEnd?.()}
      onFocus={() => onHover?.(card)}
      onBlur={() => onHoverEnd?.()}
      draggable={interactive && variant === 'hand' && Boolean(onDragStart)}
      onDragStart={event => {
        if (!interactive || variant !== 'hand') return;
        event.dataTransfer.effectAllowed = 'move';
        onDragStart?.(event);
      }}
      onDragEnd={() => {
        if (!interactive || variant !== 'hand') return;
        onDragEnd?.();
      }}
    >
      <CardFrame type={card.type} variant={revealBack ? 'back' : 'front'} className="absolute inset-0 w-full h-full" />
      {!revealBack && (
        <>
          <CardBadges fusion={fusion} legend={legend} />
          <div className="card-overlay pointer-events-none flex h-full flex-col px-4 py-4 text-left text-amber-100">
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${typeAccentClass} px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-900 shadow-md`}>
                  <span className="h-3.5 w-3.5 text-slate-800">{typeInfo.icon}</span>
                  <span>{typeInfo.label}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-800 shadow-sm">
                  <span className="h-3.5 w-3.5 text-slate-700">{timingInfo.icon}</span>
                  <span>{speedLabel}</span>
                </span>
              </div>
              <div className="pointer-events-auto">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 text-lg font-black text-slate-900 shadow-lg"
                  style={{ boxShadow: '0 10px 18px rgba(251, 191, 36, 0.28)' }}
                >
                  {costValue}
                </div>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl shadow-inner">
              <CardArtwork card={card} />
            </div>
            <div className="mt-3 flex-1 overflow-y-auto pr-1 text-[13px] leading-relaxed">
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-bold tracking-[0.1em] text-amber-100">{card.nameZh}</h4>
                  {card.nameEn && <p className="mt-0.5 text-[10px] uppercase tracking-[0.28em] text-amber-300">{card.nameEn}</p>}
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
                {card.triggerCondition && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-[0.26em] text-amber-300">触发条件</p>
                    <p className="whitespace-pre-line text-[13px] text-amber-50">{card.triggerCondition}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-[0.26em] text-amber-300">技能效果</p>
                  <p className="whitespace-pre-line text-[13px] text-amber-50">{card.effect}</p>
                </div>
                {(rarityLabel || fusion || legend) && (
                  <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[0.24em] text-amber-200">
                    {rarityLabel && <span className="rounded-full border border-amber-300/40 px-2 py-0.5">{rarityLabel}</span>}
                    {fusion && <span className="rounded-full border border-amber-300/40 px-2 py-0.5">张兴朝在场</span>}
                    {legend && <span className="rounded-full border border-amber-300/40 px-2 py-0.5">稀有能力</span>}
                  </div>
                )}
                {card.quote && (
                  <p className="text-[11px] italic text-amber-200/75">— {card.quote}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </button>
  );
};
