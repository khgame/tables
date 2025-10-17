import React from 'react';

type CardFrameVariant = 'front' | 'back';

export const CARD_TYPE_PALETTES: Record<
  string,
  {
    core: string;
    edge: string;
    glow: string;
    rune: string;
    back: string;
  }
> = {
  Attack: {
    core: '#f97316',
    edge: '#fbbf24',
    glow: '#fde68a',
    rune: '#fb923c',
    back: '#6b3710'
  },
  Control: {
    core: '#2563eb',
    edge: '#60a5fa',
    glow: '#bfdbfe',
    rune: '#1d4ed8',
    back: '#0b1e55'
  },
  Counter: {
    core: '#8b5cf6',
    edge: '#c4b5fd',
    glow: '#ede9fe',
    rune: '#6d28d9',
    back: '#2b1053'
  },
  Support: {
    core: '#0ea5e9',
    edge: '#67e8f9',
    glow: '#cffafe',
    rune: '#0284c7',
    back: '#083c5c'
  }
};

const TYPE_TINTS: Record<string, { glow: string; rim: string }> = {
  Attack: {
    glow: 'rgba(249, 115, 22, 0.48)',
    rim: 'rgba(236, 72, 30, 0.45)'
  },
  Control: {
    glow: 'rgba(59, 130, 246, 0.46)',
    rim: 'rgba(37, 99, 235, 0.42)'
  },
  Counter: {
    glow: 'rgba(168, 85, 247, 0.48)',
    rim: 'rgba(139, 92, 246, 0.4)'
  },
  Support: {
    glow: 'rgba(14, 165, 233, 0.46)',
    rim: 'rgba(8, 145, 178, 0.4)'
  }
};

interface CardFrameProps {
  type: string;
  width?: number;
  height?: number;
  variant?: CardFrameVariant;
  className?: string;
}

const FRAME_IMAGE_SRC = '/card_bg_002.png';

export const CardFrame: React.FC<CardFrameProps> = ({
  type,
  width = 236,
  height = 382,
  variant = 'front',
  className
}) => {
  const tint = TYPE_TINTS[type] ?? TYPE_TINTS.Support;
  const inlineSize = className ? undefined : ({ width, height } as React.CSSProperties);

  return (
    <div
      className={[
        'card-frame',
        `card-frame--${variant}`,
        className ?? ''
      ].filter(Boolean).join(' ')}
      style={inlineSize}
    >
      <img src={FRAME_IMAGE_SRC} alt="" className="card-frame__bg" draggable={false} />
      <div className="card-frame__mask" />
      <div className="card-frame__shine" />
      <div
        className="card-frame__tint"
        style={{
          background:
            variant === 'front'
              ? `radial-gradient(125% 125% at 50% 38%, ${tint.glow} 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.68) 100%)`
              : 'linear-gradient(155deg, rgba(14, 18, 28, 0.88) 0%, rgba(10, 14, 22, 0.95) 65%, rgba(5, 7, 12, 0.98) 100%)',
          mixBlendMode: variant === 'front' ? 'soft-light' : 'normal'
        }}
      />
      <div
        className="card-frame__rim"
        style={{
          boxShadow: `inset 0 0 0 2px ${tint.rim}, inset 0 0 18px ${tint.rim}`
        }}
      />
      {variant === 'back' && <div className="card-frame__back-emblem" />}
    </div>
  );
};

interface CardBadgeProps {
  fusion?: boolean;
  legend?: boolean;
}

export const CardBadges: React.FC<CardBadgeProps> = ({ fusion, legend }) => (
  <div className="absolute inset-x-0 top-0 pointer-events-none flex justify-between px-5 pt-4 text-[0.65rem] uppercase tracking-[0.2em] font-semibold text-white drop-shadow-md">
    {fusion ? <span className="card-badge card-badge--fusion">合体技</span> : <span />}
    {legend ? <span className="card-badge card-badge--legend">传奇</span> : <span />}
  </div>
);
