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
  animateThinking?: boolean;
}

export const HandPanel: React.FC<HandPanelProps> = ({
  cards,
  onCardClick,
  disabled,
  onCardHover,
  onCardDragStart,
  onCardDragEnd,
  className,
  isOpponent = false,
  animateThinking = false
}) => {
  const [pickedIdx, setPickedIdx] = React.useState<number | null>(null);
  const [pickedStyle, setPickedStyle] = React.useState<string>('');
  const lastPickedRef = React.useRef<number | null>(null);
  const timersRef = React.useRef<number[]>([]);
  const suspendedRef = React.useRef(false);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Random pick-up scheduler for opponent AI thinking（非固定频率，指数分布 + 随机双重思考）
  React.useEffect(() => {
    if (!isOpponent || !animateThinking || cards.length === 0) {
      clearTimers();
      setPickedIdx(null);
      setPickedStyle('');
      return;
    }

    let cancelled = false;

    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const expMs = (mean: number, min: number, max: number) => {
      const u = Math.random();
      const v = -Math.log(1 - u) * mean; // exponential
      return Math.max(min, Math.min(max, Math.floor(v)));
    };
    const LIFT_VARIANTS = [
      '-translate-y-2 -rotate-[0.5deg] scale-[1.01] drop-shadow-lg',
      '-translate-y-3 -rotate-1 scale-[1.02] drop-shadow-xl',
      '-translate-y-4 -rotate-[1.4deg] scale-[1.03] drop-shadow-2xl'
    ];
    const chooseIndex = (): number => {
      if (cards.length === 1) return 0;
      const last = lastPickedRef.current;
      let idx = rand(0, cards.length - 1);
      if (last != null && cards.length > 1) {
        // avoid picking the same card twice in a row
        for (let tries = 0; tries < 3 && idx === last; tries++) idx = rand(0, cards.length - 1);
      }
      lastPickedRef.current = idx;
      return idx;
    };

    const schedule = () => {
      if (cancelled) return;
      // Next rest picked from exponential, trimmed to range；并有小概率静默跳过
      const rest = expMs(1700, 600, 4200);
      const t1 = window.setTimeout(() => {
        if (cancelled) return;
        if (suspendedRef.current) { schedule(); return; }
        // 10% 概率本轮不拿牌（静默）
        if (Math.random() < 0.1) { schedule(); return; }
        const idx = chooseIndex();
        setPickedIdx(idx); // animate up via CSS transition
        setPickedStyle(LIFT_VARIANTS[rand(0, LIFT_VARIANTS.length - 1)]);
        const hold = expMs(1100, 700, 1800);
        const tHold = window.setTimeout(() => {
          if (cancelled) return;
          setPickedIdx(null); // animate down
          // 22% 概率“再考虑一下”：短暂停顿后再拿一次（可能同一张，30% 概率）
          const doubleConsider = Math.random() < 0.22;
          const settle = rand(360, 820);
          const tNext = window.setTimeout(() => {
            if (cancelled) return;
            if (doubleConsider && !suspendedRef.current) {
              const pickSame = Math.random() < 0.3;
              const idx2 = pickSame ? (lastPickedRef.current ?? idx) : chooseIndex();
              setPickedIdx(idx2);
              setPickedStyle(LIFT_VARIANTS[rand(0, LIFT_VARIANTS.length - 1)]);
              const hold2 = expMs(900, 600, 1400);
              const tHold2 = window.setTimeout(() => {
                if (cancelled) return;
                setPickedIdx(null);
                const settle2 = rand(420, 900);
                const tLoop = window.setTimeout(() => { if (!cancelled) schedule(); }, settle2);
                timersRef.current.push(tLoop);
              }, hold2);
              timersRef.current.push(tHold2);
            } else {
              schedule();
            }
          }, settle);
          timersRef.current.push(tNext);
        }, hold);
        timersRef.current.push(tHold);
      }, rest);
      timersRef.current.push(t1);
    };

    schedule();
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [isOpponent, animateThinking, cards.length, clearTimers]);
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
    <div
      className={cx('relative flex h-[8.8rem] w-full items-end justify-center', className)}
      onMouseEnter={() => { suspendedRef.current = true; setPickedIdx(null); }}
      onMouseLeave={() => { suspendedRef.current = false; }}
    >
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
              key={card.instanceId ?? `${card._tid ?? card.tid}-${idx}`}
              className={`group absolute left-1/2 ${positionClass} origin-${isOpponent ? 'top' : 'bottom'}`}
              data-base-z-index={100 + idx}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${isOpponent ? -angle : angle}deg)`,
                transformOrigin: isOpponent ? 'center top' : 'center bottom',
                // 当被“拿起”时，提升父容器 z-index，确保位于所有手牌之上
                zIndex: isOpponent && animateThinking && pickedIdx === idx ? 100000 : zIndex
              }}
            >
              <CardView
                card={card}
                variant="hand"
                disabled={disabled}
                revealBack={isOpponent}
                style={{
                  width: `${baseWidth}rem`,
                  // raise selected card; rely on CSS transitions inside CardView wrapper
                }}
                className={[
                  isOpponent && animateThinking && pickedIdx === idx
                    ? `z-[1000] ${pickedStyle}`
                    : ''
                ].filter(Boolean).join(' ')}
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
