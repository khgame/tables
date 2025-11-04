import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { RawCard } from '../types';
import { CardView } from './CardView';

export interface FlyingCardData {
  id: string;
  card: RawCard;
  fromElement: HTMLElement | null;
  toElement: HTMLElement | null;
  duration?: number;
  onComplete?: () => void;
}

interface CardFlyingAnimationProps {
  flyingCards: FlyingCardData[];
}

interface AnimatingCard extends FlyingCardData {
  startPos: { x: number; y: number; width: number; height: number };
  endPos: { x: number; y: number; width: number; height: number };
  startTime: number;
}

export const CardFlyingAnimation: React.FC<CardFlyingAnimationProps> = ({ flyingCards }) => {
  const [animatingCards, setAnimatingCards] = useState<AnimatingCard[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // 当有新的飞行卡牌时，初始化动画
    flyingCards.forEach(flyingCard => {
      const { fromElement, toElement } = flyingCard;

      if (!fromElement || !toElement) {
        flyingCard.onComplete?.();
        return;
      }

      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      const startPos = {
        x: fromRect.left,
        y: fromRect.top,
        width: fromRect.width,
        height: fromRect.height
      };

      const endPos = {
        x: toRect.left,
        y: toRect.top,
        width: toRect.width,
        height: toRect.height
      };

      setAnimatingCards(prev => [...prev, {
        ...flyingCard,
        startPos,
        endPos,
        startTime: Date.now()
      }]);
    });
  }, [flyingCards]);

  useEffect(() => {
    if (animatingCards.length === 0) return;

    const animate = () => {
      const now = Date.now();
      const stillAnimating: AnimatingCard[] = [];
      const completed: AnimatingCard[] = [];

      animatingCards.forEach(card => {
        const elapsed = now - card.startTime;
        const duration = card.duration || 800;

        if (elapsed >= duration) {
          completed.push(card);
        } else {
          stillAnimating.push(card);
        }
      });

      // 移除已完成的动画
      if (completed.length > 0) {
        setAnimatingCards(stillAnimating);
        completed.forEach(card => card.onComplete?.());
      }

      if (stillAnimating.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animatingCards]);

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[10000]">
      {animatingCards.map(card => {
        const elapsed = Date.now() - card.startTime;
        const duration = card.duration || 800;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        // 计算当前位置和大小
        const currentX = card.startPos.x + (card.endPos.x - card.startPos.x) * easedProgress;
        const currentY = card.startPos.y + (card.endPos.y - card.startPos.y) * easedProgress;
        const currentWidth = card.startPos.width + (card.endPos.width - card.startPos.width) * easedProgress;
        const currentHeight = card.startPos.height + (card.endPos.height - card.startPos.height) * easedProgress;

        // 3D 效果：中途向上弹起和旋转
        const arc = Math.sin(progress * Math.PI) * 80; // 弧形运动
        const rotation = (progress - 0.5) * 15; // 旋转效果
        const scale = 1 + Math.sin(progress * Math.PI) * 0.15; // 缩放效果

        return (
          <div
            key={card.id}
            style={{
              position: 'fixed',
              left: currentX,
              top: currentY - arc,
              width: currentWidth,
              height: currentHeight,
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: 'transform 0.1s ease-out',
              filter: `brightness(${1 + progress * 0.3})`,
              zIndex: 10000
            }}
          >
            <CardView
              card={card.card}
              variant="hand"
              disabled
              style={{ pointerEvents: 'none' }}
            />
          </div>
        );
      })}
    </div>,
    document.body
  );
};
