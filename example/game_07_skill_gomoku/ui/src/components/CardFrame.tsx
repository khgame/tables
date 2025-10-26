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
    core: '#f97316CC',
    edge: '#fbbf24CC',
    glow: '#fde68a',
    rune: '#fb923c',
    back: '#6b3710'
  },
  Counter: {
    core: '#8b5cf6CC',
    edge: '#c4b5fdCC',
    glow: '#ede9fe',
    rune: '#6d28d9',
    back: '#2b1053'
  },
  Support: {
    core: '#2563ebCC',
    edge: '#60a5faCC',
    glow: '#bfdbfe',
    rune: '#1d4ed8',
    back: '#0b1e55'
  }
};

const TYPE_TINTS: Record<string, { glow: string; rim: string }> = {
  Attack: {
    glow: 'rgba(249, 115, 22, 0.48)',
    rim: 'rgba(236, 72, 30, 0.45)'
  },
  Counter: {
    glow: 'rgba(168, 85, 247, 0.48)',
    rim: 'rgba(139, 92, 246, 0.4)'
  },
  Support: {
    glow: 'rgba(59, 130, 246, 0.46)',
    rim: 'rgba(37, 99, 235, 0.42)'
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
const CARD_BACK_IMAGE_SRC = '/card_bg_2.png';

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
      className={['relative w-full h-full pointer-events-none overflow-visible', className ?? ''].join(' ')}
      style={inlineSize}
    >
      <img
        src={variant === 'back' ? CARD_BACK_IMAGE_SRC : FRAME_IMAGE_SRC}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover saturate-[1.05] contrast-[1.05]"
      />
      {variant === 'front' && (
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 0 2px ${tint.rim}, inset 0 0 18px ${tint.rim}`,
            mixBlendMode: 'screen' as const
          }}
        />
      )}
    </div>
  );
};
