import React from 'react';

export type BubbleTone = 'info' | 'praise' | 'taunt' | 'frustrated';

export interface ComicBubbleProps {
  text: string;
  tone?: BubbleTone;
  align?: 'left' | 'right';
  direction?: 'down' | 'up';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const toneStops: Record<BubbleTone, { from: string; to: string; ring: string; text: string }> = {
  info: { from: '#22d3ee', to: '#60a5fa', ring: 'rgba(255,255,255,0.18)', text: '#0B1220' },
  praise: { from: '#34d399', to: '#10b981', ring: 'rgba(255,255,255,0.18)', text: '#0B1220' },
  taunt: { from: '#a78bfa', to: '#f472b6', ring: 'rgba(255,255,255,0.18)', text: '#0B1220' },
  frustrated: { from: '#fb7185', to: '#f59e0b', ring: 'rgba(255,255,255,0.18)', text: '#0B1220' }
};

export const ComicBubble: React.FC<ComicBubbleProps> = ({ text, tone = 'info', align = 'right', direction = 'down', size = 'md', className }) => {
  const W = size === 'lg' ? 280 : size === 'sm' ? 200 : 240;
  const H = size === 'lg' ? 96  : size === 'sm' ? 68  : 82;
  const tailW = 24;
  const tailH = 18;
  const alignRight = align === 'right';
  const { ring } = toneStops[tone];

  // Styling: black background with exaggerated gray outline, white text
  const fillColor = '#0b0f1a';
  const strokeColor = 'rgba(243,244,246,0.9)'; // gray-100
  const textColor = '#ffffff';

  const oy = direction === 'up' ? tailH : 0; // offset body when tail is on top
  const bodyPath = `M16,${8 + oy} C44,${0 + oy} ${W - 56},${0 + oy} ${W - 20},${10 + oy} C${W - 4},${18 + oy} ${W - 4},${H - 22 + oy} ${W - 22},${H - 12 + oy} C${W - 62},${H + 6 + oy} 44,${H + 4 + oy} 16,${H - 4 + oy} C4,${H - 10 + oy} 2,${H - 26 + oy} 6,${H - 36 + oy} C10,${H - 50 + oy} 4,${20 + oy} 16,${8 + oy} Z`;

  const tailX = alignRight ? W - 48 : 28;
  const tailPath = (() => {
    if (direction === 'down') {
      return alignRight
        ? `M${tailX},${H - 10 + oy} C${tailX + 8},${H - 6 + oy} ${tailX + 14},${H - 2 + oy} ${tailX + tailW},${H + 2 + oy} L${tailX + 2},${H - 2 + oy} Z`
        : `M${tailX},${H - 10 + oy} C${tailX - 8},${H - 6 + oy} ${tailX - 14},${H - 2 + oy} ${tailX - tailW},${H + 2 + oy} L${tailX - 2},${H - 2 + oy} Z`;
    }
    // direction === 'up'
    return alignRight
      ? `M${tailX},${oy + 10} C${tailX + 8},${oy + 6} ${tailX + 14},${oy + 2} ${tailX + tailW},${oy - 6} L${tailX + 2},${oy + 4} Z`
      : `M${tailX},${oy + 10} C${tailX - 8},${oy + 6} ${tailX - 14},${oy + 2} ${tailX - tailW},${oy - 6} L${tailX - 2},${oy + 4} Z`;
  })();

  return (
    <div
      className={[
        'relative pointer-events-none select-none',
        size === 'sm' ? 'w-[180px] h-[78px]' : 'w-[220px] h-[92px]',
        'bubble-shake-in',
        className || ''
      ].join(' ')}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H + tailH}`}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          <filter id="cshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="rgba(0,0,0,0.35)"/>
          </filter>
          {/* 轻微毛边效果 */}
          <filter id="crough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.4" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        <path d={bodyPath} fill={fillColor} filter="url(#cshadow)" />
        <path d={tailPath} fill={fillColor} />
        <path d={bodyPath} fill="none" stroke={strokeColor} strokeWidth="3.25" filter="url(#crough)" />
        <path d={bodyPath} fill="none" stroke={ring} strokeWidth="1.25" opacity="0.4" />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center px-5"
        style={{ color: textColor, textShadow: '0 1px 0 rgba(0,0,0,0.35)', textAlign: 'center' }}
      >
        <span className="font-extrabold text-[14px] tracking-wide whitespace-pre-wrap leading-snug">
          {text}
        </span>
      </div>
    </div>
  );
};

export default ComicBubble;
