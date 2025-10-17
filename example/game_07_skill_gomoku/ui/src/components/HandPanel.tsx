import React from 'react';
import type { RawCard } from '../types';
import { CardView } from './CardView';

export interface HandPanelProps {
  cards: RawCard[];
  onCardClick?: (index: number) => void;
  disabled: boolean;
  onCardHover?: (card: RawCard | null) => void;
  onCardDragStart?: (index: number) => void;
  onCardDragEnd?: () => void;
  className?: string;
}

export const HandPanel: React.FC<HandPanelProps> = ({
  cards,
  onCardClick,
  disabled,
  onCardHover,
  onCardDragStart,
  onCardDragEnd,
  className
}) => {
  if (cards.length === 0) {
    return (
      <div className={['hand-panel', className].filter(Boolean).join(' ')}>
        <div className="hand-panel__empty text-amber-200/70 text-sm italic">暂无手牌</div>
      </div>
    );
  }

  const total = cards.length;
  const mid = (total - 1) / 2;
  const angleRange = Math.min(50, 22 + total * 3.6);
  const angleStep = total > 1 ? angleRange / (total - 1) : 0;
  const baseWidth = total >= 5 ? 8.8 : 9.6;

  return (
    <div className={['hand-panel', className].filter(Boolean).join(' ')}>
      <div className="hand-panel__glow" />
      <div className="hand-panel__inner">
        {cards.map((card, idx) => {
          const offset = idx - mid;
          const angle = total > 1 ? (idx - mid) * angleStep - angleRange / 2 : 0;
          const translateX = offset * 62;
          const translateY = -Math.abs(angle) * 0.5;
          const zIndex = 100 + idx;

          return (
            <div
              key={card._tid ?? `${card.nameZh}-${idx}`}
              className="absolute left-1/2 bottom-0 origin-bottom"
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`,
                transformOrigin: 'center bottom',
                zIndex
              }}
            >
              <CardView
                card={card}
                variant="hand"
                disabled={disabled}
                style={{ width: `${baseWidth}rem` }}
                onClick={() => {
                  if (!disabled) onCardClick?.(idx);
                }}
                onHover={hoverCard => {
                  if (!disabled) onCardHover?.(hoverCard);
                }}
                onHoverEnd={() => onCardHover?.(null)}
                onDragStart={event => {
                  event.dataTransfer.setData('application/x-card-index', String(idx));
                  onCardDragStart?.(idx);
                }}
                onDragEnd={() => {
                  onCardDragEnd?.();
                  onCardHover?.(null);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

