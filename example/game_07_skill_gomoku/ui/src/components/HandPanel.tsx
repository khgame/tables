import React from 'react';
import type { RawCard } from '../types';
import { CardView } from './CardView';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export interface HandPanelProps {
  cards: RawCard[];
  onCardClick?: (index: number) => void;
  disabled: boolean;
  onCardHover?: (card: RawCard | null) => void;
  onCardDragStart?: (index: number) => void;
  onCardDragEnd?: () => void;
  className?: string;
  isOpponent?: boolean;
}

export const HandPanel: React.FC<HandPanelProps> = ({
  cards,
  onCardClick,
  disabled,
  onCardHover,
  onCardDragStart,
  onCardDragEnd,
  className,
  isOpponent = false
}) => {
  if (cards.length === 0) {
    return (
      <div className={cx('relative flex h-[8.8rem] w-full items-end justify-start', className)}>
        <div className="flex h-full w-full items-center justify-start pl-4 text-sm italic text-amber-200/70">
          {isOpponent ? '白方无手牌' : '暂无手牌'}
        </div>
      </div>
    );
  }

  const total = cards.length;
  const mid = (total - 1) / 2;
  // 大幅减少扇形角度：从20度减少到4度，让卡牌更接近横排
  const angleRange = Math.min(4, 1 + total * 0.6);
  const angleStep = total > 1 ? angleRange / (total - 1) : 0;
  // 增加卡牌间距，确保能看清所有卡面
  const spacingBase = total > 1 ? Math.min(65, 50 + total * 1.8) : 0;
  const baseWidth = total >= 5 ? 9.8 : 10.8;

  return (
    <div className={cx('relative flex h-[8.8rem] w-full items-end justify-center', className)}>
      <div
        className="pointer-events-none absolute inset-[18%_6%_6%] rounded-full opacity-80"
        style={{ background: 'radial-gradient(circle at 50% 80%, rgba(251,191,36,0.16), transparent 70%)', filter: 'blur(40px)' }}
      />
      <div className="relative h-full w-full">
        {cards.map((card, idx) => {
          const offset = idx - mid;
          const angle = total > 1 ? (idx - mid) * angleStep - angleRange / 2 : 0;
          const translateX = offset * spacingBase;
          // 减少弧形抬升，让卡牌更接近水平线
          const arcLift = Math.abs(angle) * 0.1; // 从0.25减少到0.1
          const translateY = isOpponent ? arcLift : -arcLift;
          const zIndex = 100 + idx;
          const positionClass = isOpponent ? 'top-0' : 'bottom-0';

          return (
            <div
              key={card._tid ?? `${card.nameZh}-${idx}`}
              className={`absolute left-1/2 ${positionClass} origin-${isOpponent ? 'top' : 'bottom'}`}
              data-base-z-index={100 + idx}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${isOpponent ? -angle : angle}deg)`,
                transformOrigin: isOpponent ? 'center top' : 'center bottom',
                zIndex
              }}
            >
              <CardView
                card={card}
                variant="hand"
                disabled={disabled}
                revealBack={isOpponent}
                style={{ width: `${baseWidth}rem` }}
                onClick={() => {
                  if (!disabled && !isOpponent) onCardClick?.(idx);
                }}
                onHover={hoverCard => {
                  if (!disabled && !isOpponent) onCardHover?.(hoverCard);
                }}
                onHoverEnd={() => {
                  if (!isOpponent) {
                    onCardHover?.(null);
                  }
                }}
                onDragStart={event => {
                  if (!isOpponent) {
                    event.dataTransfer.setData('application/x-card-index', String(idx));
                    event.dataTransfer.setData('text/plain', String(idx));
                    onCardDragStart?.(idx);
                  }
                }}
                onDragEnd={() => {
                  if (!isOpponent) {
                    onCardDragEnd?.();
                    onCardHover?.(null);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
