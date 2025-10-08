import React, { useId } from 'react';

const TYPE_GRADIENT: Record<string, { start: string; end: string }> = {
  Attack: { start: '#f97316', end: '#ffa94d' },
  Control: { start: '#38bdf8', end: '#80d4ff' },
  Counter: { start: '#a855f7', end: '#d8b4fe' },
  Support: { start: '#14b8a6', end: '#5eead4' }
};

interface CardFrameProps {
  type: string;
  width?: number;
  height?: number;
  variant?: 'front' | 'back';
  className?: string;
}

export const CardFrame: React.FC<CardFrameProps> = ({ type, width = 220, height = 356, variant = 'front', className }) => {
  const gradient = TYPE_GRADIENT[type] ?? TYPE_GRADIENT.Attack;
  const uniqueId = useId().replace(/:/g, '-');
  const gradId = `card-grad-${uniqueId}`;
  const shadowId = `card-shadow-${uniqueId}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 356"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradient.start} />
          <stop offset="100%" stopColor={gradient.end} />
        </linearGradient>
        <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="8" />
          <feGaussianBlur stdDeviation="12" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="rgba(0,0,0,0.45)" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>
      <g filter={`url(#${shadowId})`}>
        <path
          d="M24 10h172c8.837 0 16 7.163 16 16v304c0 8.837-7.163 16-16 16H24c-8.837 0-16-7.163-16-16V26c0-8.837 7.163-16 16-16Z"
          fill="#1f2937"
        />
        <path
          d="M24 10h172c8.837 0 16 7.163 16 16v304c0 8.837-7.163 16-16 16H24c-8.837 0-16-7.163-16-16V26c0-8.837 7.163-16 16-16Z"
          fill={`url(#${gradId})`}
          opacity={0.78}
        />
      </g>
      <path
        d="M30 24h160c6.627 0 12 5.373 12 12v264c0 6.627-5.373 12-12 12H30c-6.627 0-12-5.373-12-12V36c0-6.627 5.373-12 12-12Z"
        fill={variant === 'front' ? '#111827d0' : '#0f172abd'}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={3}
      />
      {variant === 'back' ? (
        <g opacity={0.25}>
          <circle cx="110" cy="110" r="52" fill="white" />
          <circle cx="110" cy="110" r="40" fill={`url(#${gradId})`} />
          <path d="M82 194h56l24 96H58l24-96Z" fill={`url(#${gradId})`} opacity={0.6} />
        </g>
      ) : (
        <>
          <path
            d="M44 60h132c6.627 0 12 5.373 12 12v64c0 6.627-5.373 12-12 12H44c-6.627 0-12-5.373-12-12V72c0-6.627 5.373-12 12-12Z"
            fill="rgba(17,24,39,0.65)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.5}
          />
          <path
            d="M44 160h132c6.627 0 12 5.373 12 12v90c0 6.627-5.373 12-12 12H44c-6.627 0-12-5.373-12-12v-90c0-6.627 5.373-12 12-12Z"
            fill="rgba(17,24,39,0.78)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1.5}
          />
        </>
      )}
      <path
        d="M24 10h172c8.837 0 16 7.163 16 16v304c0 8.837-7.163 16-16 16H24c-8.837 0-16-7.163-16-16V26c0-8.837 7.163-16 16-16Z"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={6}
      />
    </svg>
  );
};

interface CardBadgeProps {
  fusion?: boolean;
  legend?: boolean;
}

export const CardBadges: React.FC<CardBadgeProps> = ({ fusion, legend }) => (
  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
    <div className="flex justify-between px-4 pt-3 text-[0.65rem] uppercase font-semibold tracking-wide">
      {fusion ? (
        <span className="px-2 py-1 rounded-full bg-rose-500/90 text-white shadow-sm">合体技</span>
      ) : (
        <span />
      )}
      {legend ? (
        <span className="px-2 py-1 rounded-full bg-yellow-400/90 text-stone-900 shadow-sm">传奇</span>
      ) : (
        <span />
      )}
    </div>
  </div>
);
