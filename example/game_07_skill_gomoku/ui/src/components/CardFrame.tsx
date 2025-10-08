import React, { useId } from 'react';

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

interface CardFrameProps {
  type: string;
  width?: number;
  height?: number;
  variant?: CardFrameVariant;
  className?: string;
}

export const CardFrame: React.FC<CardFrameProps> = ({
  type,
  width = 236,
  height = 382,
  variant = 'front',
  className
}) => {
  const palette = CARD_TYPE_PALETTES[type] ?? CARD_TYPE_PALETTES.Attack;
  const uniqueId = useId().replace(/:/g, '-');

  const gradEdgeId = `card-edge-${uniqueId}`;
  const gradCoreId = `card-core-${uniqueId}`;
  const gradGlassId = `card-glass-${uniqueId}`;
  const gradRuneId = `card-rune-${uniqueId}`;
  const gradBackId = `card-back-${uniqueId}`;
  const outerShadow = `card-shadow-${uniqueId}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 236 382"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradEdgeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.edge} />
          <stop offset="55%" stopColor={palette.core} />
          <stop offset="100%" stopColor={palette.back} />
        </linearGradient>
        <linearGradient id={gradCoreId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={`${palette.glow}CC`} />
          <stop offset="40%" stopColor={`${palette.core}F0`} />
          <stop offset="100%" stopColor={`${palette.back}F0`} />
        </linearGradient>
        <radialGradient id={gradGlassId} cx="50%" cy="25%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id={gradRuneId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`${palette.rune}AA`} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id={gradBackId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={`${palette.core}DD`} />
          <stop offset="60%" stopColor={`${palette.back}F5`} />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <filter id={outerShadow} x="-24%" y="-8%" width="148%" height="132%">
          <feOffset dx="0" dy="14" />
          <feGaussianBlur stdDeviation="18" result="shadow" />
          <feColorMatrix
            in="shadow"
            type="matrix"
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.35 0"
          />
          <feBlend in="SourceGraphic" mode="normal" />
        </filter>
      </defs>

      <g filter={`url(#${outerShadow})`}>
        <path
          d="M118 6C130 14 145 20 164 20H206C222 20 232 30 232 46V338C232 354 222 364 206 364H30C14 364 4 354 4 338V46C4 30 14 20 30 20H72C91 20 106 14 118 6Z"
          fill="#070b15"
        />
        <path
          d="M118 6C130 14 145 20 164 20H206C222 20 232 30 232 46V338C232 354 222 364 206 364H30C14 364 4 354 4 338V46C4 30 14 20 30 20H72C91 20 106 14 118 6Z"
          fill={`url(#${gradEdgeId})`}
          opacity={0.98}
        />
        <path
          d="M118 32C126 37 134 40 144 40H200C208 40 214 46 214 54V328C214 336 208 342 200 342H36C28 342 22 336 22 328V54C22 46 28 40 36 40H92C102 40 110 37 118 32Z"
          fill={`url(#${gradCoreId})`}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={2.5}
        />
        <path
          d="M118 32C126 37 134 40 144 40H200C208 40 214 46 214 54V328C214 336 208 342 200 342H36C28 342 22 336 22 328V54C22 46 28 40 36 40H92C102 40 110 37 118 32Z"
          fill={`url(#${gradGlassId})`}
          opacity={0.82}
        />

        <path
          d="M118 0L148 16H222C230 16 236 22 236 30V60C236 68 230 74 222 74H14C6 74 0 68 0 60V30C0 22 6 16 14 16H88L118 0Z"
          fill={`url(#${gradEdgeId})`}
        />
        <path
          d="M118 6L142 20H216C222 20 226 24 226 30V56C226 62 222 66 216 66H20C14 66 10 62 10 56V30C10 24 14 20 20 20H94L118 6Z"
          fill="rgba(10,12,26,0.92)"
          stroke="rgba(255,255,255,0.24)"
          strokeWidth={1.4}
        />

        <path
          d="M118 370L88 354H14C6 354 0 348 0 340V320C0 312 6 306 14 306H222C230 306 236 312 236 320V340C236 348 230 354 222 354H148L118 370Z"
          fill="rgba(0,0,0,0.52)"
        />
        <path
          d="M118 366L92 352H18C12 352 8 348 8 342V322C8 316 12 312 18 312H218C224 312 228 316 228 322V342C228 348 224 352 218 352H144L118 366Z"
          fill="rgba(255,255,255,0.08)"
        />

        {variant === 'front' ? (
          <g opacity={0.42}>
            <circle cx="118" cy="200" r="92" fill={`url(#${gradRuneId})`} />
            <circle cx="118" cy="128" r="50" fill={`url(#${gradRuneId})`} opacity={0.45} />
            <circle cx="118" cy="264" r="48" fill={`url(#${gradRuneId})`} opacity={0.35} />
          </g>
        ) : (
          <g>
            <rect x="34" y="92" width="168" height="196" rx="24" fill={`url(#${gradBackId})`} stroke="rgba(255,255,255,0.18)" strokeWidth={3} />
            <circle cx="118" cy="196" r="70" fill={`url(#${gradRuneId})`} opacity={0.65} />
            <path
              d="M118 106L140 146L186 156L154 188L160 236L118 212L76 236L82 188L50 156L96 146L118 106Z"
              fill="rgba(255,255,255,0.18)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={2.4}
            />
          </g>
        )}
      </g>
    </svg>
  );
};

interface CardBadgeProps {
  fusion?: boolean;
  legend?: boolean;
}

export const CardBadges: React.FC<CardBadgeProps> = ({ fusion, legend }) => (
  <div className="absolute inset-x-0 top-0 pointer-events-none flex justify-between px-5 pt-4 text-[0.65rem] uppercase tracking-[0.2em] font-semibold text-white drop-shadow-md">
    {fusion ? (
      <span className="card-badge card-badge--fusion">合体技</span>
    ) : (
      <span />
    )}
    {legend ? (
      <span className="card-badge card-badge--legend">传奇</span>
    ) : (
      <span />
    )}
  </div>
);
