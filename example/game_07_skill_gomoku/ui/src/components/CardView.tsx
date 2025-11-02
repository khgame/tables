import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { RawCard } from '../types';
import { CardFrame, CARD_TYPE_PALETTES } from './CardFrame';
import { CardArtwork } from './CardArtwork';

export type CardVariant = 'hand' | 'list' | 'showcase';

interface IconMeta {
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface TooltipState {
  label: string;
  description: string;
  x: number;
  y: number;
}

const TYPE_META: Record<string, IconMeta> = {
  Attack: {
    label: 'Attack - 进攻',
    description: '进攻类技能，用于推进局势、对对手施压。',
    icon: createIcon('crossed-swords', 'Attack')
  },
  Counter: {
    label: 'Counter - 反击',
    description: '反击类技能，可在对手行动时即时应对。',
    icon: createIcon('shield-reflect', 'Counter')
  },
  Support: {
    label: 'Support - 支援',
    description: '支援类技能，提供增益、恢复或条件铺垫。',
    icon: createIcon('healing', 'Support')
  }
};

const TIMING_META: Record<string, IconMeta> = {
  PreMove: {
    label: 'PreMove - 落子前',
    description: '在本回合落子动作之前发动。',
    icon: createIcon('hourglass', 'PreMove')
  },
  Reaction: {
    label: 'Reaction - 反应',
    description: '对手发动技能时即时响应。',
    icon: createIcon('awareness', 'Reaction')
  },
  Anytime: {
    label: 'Anytime - 任意时',
    description: '满足卡牌条件即可在任意时机发动。',
    icon: createIcon('infinity', 'Anytime')
  }
};

// NOTE: 速度展示已移除，避免与时机信息冲突（仅展示 Timing 信息）。

const STATUS_META = {
  fusion: {
    label: '合体技',
    description: '需指定角色同场方可释放的联合技。',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M12 3L9.2 6H6V9.2L3 12L6 14.8V18H9.2L12 21L14.8 18H18V14.8L21 12L18 9.2V6H14.8L12 3ZM12 6.9L13.7 8.6H16V10.9L17.7 12.6L16 14.3V16.6H13.7L12 18.3L10.3 16.6H8V14.3L6.3 12.6L8 10.9V8.6H10.3L12 6.9ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z"
          fill="currentColor"
        />
      </svg>
    )
  },
  legend: {
    label: '传奇',
    description: '稀有度最高，具备独特战局影响力。',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M12 2L14.09 8.26L21 9.27L16 13.97L17.18 21L12 17.77L6.82 21L8 13.97L3 9.27L9.91 8.26L12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  }
} as const;

export interface CardViewProps {
  card: RawCard;
  onClick?: () => void;
  disabled?: boolean;
  revealBack?: boolean;
  variant?: CardVariant;
  style?: React.CSSProperties;
  className?: string;
  onHover?: (card: RawCard) => void;
  onHoverEnd?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
  compact?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  onClick,
  disabled,
  revealBack,
  variant = 'hand',
  style,
  className,
  onHover,
  onHoverEnd,
  onDragStart,
  onDragEnd,
  compact = false
}) => {
  // Debug: 检查卡牌数据
  console.log('CardView render:', {
    nameZh: card.nameZh,
    type: card.type,
    timing: card.timing,
    tags: card.tags,
    typeInfo: TYPE_META[card.type],
    timingInfo: TIMING_META[card.timing ?? 'Anytime']
  });

  const tags = new Set((card.tags ?? '').split('|').map(tag => tag.trim()).filter(Boolean));
  const fusion = tags.has('Fusion');
  const legend = card.rarity === 'Legendary';
  const interactive = !disabled && variant !== 'showcase';
  // Visual hover should work even when disabled; interaction (click/drag) still respects disabled
  const hoverClass = variant !== 'hand' ? 'hover:scale-[1.03] hover:drop-shadow-xl' : '';

  // 修复大小写不匹配问题：JSON 是小写/kebab-case，组件期望 PascalCase
  const normalizeType = (type: string): string => {
    if (!type) return 'Support';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const normalizeTiming = (timing: string): string => {
    if (!timing) return 'Anytime';
    // pre-move → PreMove, reaction → Reaction, anytime → Anytime
    return timing.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  };

  const typeKey = normalizeType(card.type);
  const timingKey = normalizeTiming(card.timing);

  const typeInfo = TYPE_META[typeKey] || TYPE_META.Support;
  const timingInfo = TIMING_META[timingKey] || TIMING_META.Anytime;
  const palette = CARD_TYPE_PALETTES[typeKey] || CARD_TYPE_PALETTES.Support;
  const tidStr = String((card as any)._tid ?? (card as any).tid ?? '');
  const isSkillFive = tidStr === '1015' || (card.nameZh && card.nameZh.includes('技能五'));
  const headerBg = (() => {
    // 橙色：技能五 & See You Again（tid 1015 / 1016 或名称匹配）
    const isSeeYouAgain = tidStr === '1016' || (card.nameEn?.toLowerCase().includes('see you again') ?? false) || (card.nameZh?.includes('See You Again') ?? false);
    if (isSkillFive || isSeeYouAgain) {
      // vivid orange
      return 'linear-gradient(135deg, rgba(249,115,22,0.96), rgba(245,158,11,0.94))';
    }
    const type = (card.type || '').toLowerCase();
    if (type === 'attack') {
      if (fusion) {
        // 主动技 + 合体技：绿色打底，叠加到橙色的渐变，营造能量感
        return [
          'linear-gradient(135deg, rgba(16,185,129,0.92) 0%, rgba(16,185,129,0.0) 38%)',
          'linear-gradient(135deg, rgba(249,115,22,0.92), rgba(245,158,11,0.9))'
        ].join(', ');
      }
      // 普通主动技：绿色
      return 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.92))';
    }
    if (type === 'counter') {
      // 反击：紫色（Persona-like）
      return 'linear-gradient(135deg, rgba(168,85,247,0.96), rgba(124,58,237,0.93))';
    }
    return `linear-gradient(135deg, ${palette.edge}, ${palette.core})`;
  })();
  const rarityStars = card.rarity === 'Legendary' ? 3 : card.rarity === 'Rare' ? 2 : 1;
  const nameZhLength = card.nameZh?.length ?? 0;
  const nameZhClass = useMemo(() => {
    if (nameZhLength >= 10) return 'text-[0.96rem]';
    if (nameZhLength >= 7) return 'text-[1.08rem]';
    return 'text-[1.2rem]';
  }, [nameZhLength]);
  const enableClick = !disabled && variant !== 'hand' && typeof onClick === 'function';
  const baseWidth = (() => {
    if (style?.width) return undefined;
    if (variant === 'list') return '11rem';
    if (variant === 'showcase') return '15.8rem';
    return '13rem';
  })();

  const cursorClass = disabled ? 'cursor-not-allowed' : enableClick ? 'cursor-pointer' : '';
  const ribbonItems: Array<{ key: string; label: string; description: string; icon: React.ReactNode }> = [
    { key: 'type', label: typeInfo.label, description: typeInfo.description, icon: typeInfo.icon },
    { key: 'timing', label: timingInfo.label, description: timingInfo.description, icon: timingInfo.icon }
  ];
  if (fusion) {
    ribbonItems.push({ key: 'fusion', ...STATUS_META.fusion });
  }
  if (legend) {
    ribbonItems.push({ key: 'legend', ...STATUS_META.legend });
  }

  const buttonRef = useRef<HTMLButtonElement>(null);
  const originalZIndex = useRef<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const shouldElevate = interactive && variant === 'hand' && (isHovering || isDragging);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const restoreZIndex = useCallback(() => {
    const wrapper = buttonRef.current?.parentElement as HTMLElement | null;
    if (!wrapper) return;
    if (originalZIndex.current === null) return;
    if (originalZIndex.current === '') {
      wrapper.style.removeProperty('z-index');
    } else {
      wrapper.style.zIndex = originalZIndex.current;
    }
    originalZIndex.current = null;
  }, []);

  useEffect(() => {
    const wrapper = buttonRef.current?.parentElement as HTMLElement | null;
    if (!wrapper) return;
    if (shouldElevate) {
      if (originalZIndex.current === null) {
        const currentInline = wrapper.style.zIndex;
        if (currentInline) {
          originalZIndex.current = currentInline;
        } else {
          originalZIndex.current = wrapper.dataset.baseZIndex ?? '';
        }
      }
      wrapper.style.zIndex = '100000';
    } else {
      restoreZIndex();
    }
  }, [restoreZIndex, shouldElevate]);

  useEffect(() => () => restoreZIndex(), [restoreZIndex]);

  const showTooltip = useCallback((meta: IconMeta, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const clampedX =
      viewportWidth > 0
        ? Math.min(Math.max(rect.left + rect.width / 2, 16), viewportWidth - 16)
        : rect.left + rect.width / 2;
    const clampedY = Math.max(rect.top - 8, 24);
    setTooltip({
      label: meta.label,
      description: meta.description,
      x: clampedX,
      y: clampedY
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  useEffect(() => () => setTooltip(null), []);

  const handleHoverStart = () => {
    if (variant === 'hand' && interactive) {
      setIsHovering(true);
    }
    onHover?.(card);
  };

  const handleHoverEnd = () => {
    if (variant === 'hand') {
      setIsHovering(false);
    }
    hideTooltip();
    onHoverEnd?.();
  };

  // Variant-aware layout tweaks
  // Fixed heights for artwork and description to keep a consistent layout
  // 调整描述区域高度，确保与行数限制匹配，避免文字溢出
  const fixedHeights = useMemo(() => {
    // 根据字体大小 0.78rem 和行高 1.36 计算合适的高度
    // 4行 ≈ 4 * 0.78 * 1.36 ≈ 4.24rem，加上padding约0.5rem = 4.8rem
    // 5行 ≈ 5 * 0.78 * 1.36 ≈ 5.3rem，加上padding约0.5rem = 5.8rem
    // 6行 ≈ 6 * 0.78 * 1.36 ≈ 6.36rem，加上padding约0.5rem = 6.9rem
    if (variant === 'hand') return { art: '7.2rem', desc: '4.8rem', clamp: 4 } as const;
    if (variant === 'list') return { art: '8.2rem', desc: '5.8rem', clamp: 5 } as const;
    return { art: '10.2rem', desc: '6.9rem', clamp: 6 } as const; // showcase/default
  }, [variant]);

  // Slightly move content upward by reducing bottom padding and margins
  const overlayPad = variant === 'hand'
    ? 'pt-[0.40rem] px-[0.52rem] pb-[0.32rem] gap-[0.24rem]'
    : 'pt-[0.56rem] px-[0.56rem] pb-[0.42rem] gap-[0.36rem]';

  const bodyGridRows = (() => {
    // Use fixed internal heights via inline styles; keep grid rows generic
    if (variant === 'hand') {
      return 'grid-rows-[auto_auto_auto] gap-[0.32rem]';
    }
    return 'grid-rows-[auto_auto_auto] gap-[0.4rem]';
  })();

  const effectPanelClass = variant === 'hand'
    ? 'relative z-[2] mt-[0.12rem] bg-[rgba(6,10,18,0.76)] border border-white/10 rounded-[0.6rem] px-2 py-1.5 shadow-[0_8px_18px_rgba(5,8,14,0.35)] overflow-hidden'
    : 'relative z-[2] mt-[0.12rem] bg-[rgba(12,18,30,0.55)] border border-white/10 rounded-[0.6rem] px-2 py-1.5 overflow-hidden';

  const wrapperClasses = [
    'relative block rounded-xl overflow-hidden outline-none',
    variant !== 'showcase' ? 'transition-transform duration-200' : '',
    // keep hover lift even when disabled; only remove grab cursor/active state
    variant === 'hand' ? 'hover:-translate-y-2' : '',
    disabled ? 'cursor-not-allowed' : (variant === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''),
    hoverClass,
    className ?? ''
  ].filter(Boolean).join(' ');

  // 漫画风格白色描边样式
  const comicStrokeStyle: React.CSSProperties = {
    boxShadow: `
      0 0 0 3px rgba(255, 255, 255, 0.9),
      0 0 0 4px rgba(0, 0, 0, 0.4),
      0 4px 8px rgba(0, 0, 0, 0.3)
    `
  };

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        onClick={enableClick ? onClick : undefined}
        disabled={disabled}
        className={wrapperClasses}
        style={{ width: baseWidth, aspectRatio: '1 / 1.618', ...comicStrokeStyle, ...style }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onFocus={handleHoverStart}
        onBlur={handleHoverEnd}
        draggable={interactive && variant === 'hand' && Boolean(onDragStart)}
        onDragStart={event => {
          if (!interactive || variant !== 'hand') return;
          event.dataTransfer.effectAllowed = 'move';
          setIsDragging(true);
          hideTooltip();
          onDragStart?.(event);
        }}
        onDragEnd={() => {
          if (!interactive || variant !== 'hand') return;
          setIsDragging(false);
          hideTooltip();
          onDragEnd?.();
        }}
      >
        <CardFrame type={card.type} variant={revealBack ? 'back' : 'front'} className="absolute inset-0 w-full h-full" />
        {!revealBack && (
          <div className={['absolute inset-0 flex flex-col text-white', overlayPad].join(' ')}>
            {/* 顶部功能标签（所有变体均显示；手牌使用更紧凑样式） */}
            <header
              className={[
                'card-header relative z-[10] flex items-center gap-1 rounded-md uppercase tracking-[0.16em] pointer-events-auto w-full',
                // unify header height across variants for consistency
                'px-1 text-[0.58rem] h-[28px] min-h-[28px] leading-[1]'
              ].join(' ')}
              style={{ background: headerBg, color: '#0f172a' }}
            >
              <span className="card-header__ink" />
              {ribbonItems.map(item => (
                <div
                  key={item.key}
                  className="relative group pointer-events-auto"
                  role="presentation"
                  tabIndex={0}
                  onMouseEnter={event => showTooltip(item, event.currentTarget)}
                  onMouseLeave={hideTooltip}
                  onFocus={event => showTooltip(item, event.currentTarget)}
                  onBlur={hideTooltip}
                  onKeyDown={event => {
                    if (event.key === 'Escape') hideTooltip();
                  }}
                >
                  <span
                    className={[
                      'flex items-center justify-center rounded bg-white/60 text-slate-900 shadow-sm',
                      // fixed icon size for consistent placement
                      variant === 'hand' ? 'h-3 w-3' : 'h-4 w-4'
                    ].join(' ')}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </span>
                </div>
              ))}
              <span className={['ml-auto flex gap-0.5 text-amber-50 drop-shadow', variant === 'hand' ? 'text-[0.65rem]' : 'text-[0.75rem]'].join(' ')}>
                {Array.from({ length: rarityStars }).map((_, idx) => (
                  <span key={idx}>★</span>
                ))}
              </span>
            </header>

            <div className={['relative z-[1] grid', bodyGridRows].join(' ')}>
              <div className={[variant === 'hand' ? 'gap-[0.04rem]' : 'gap-[0.5rem]', 'flex flex-col'].join(' ')}>
                <span className={[
                  'font-extrabold tracking-[0.12em] text-white whitespace-nowrap overflow-hidden text-ellipsis',
                  'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-shadow-sm',
                  nameZhClass
                ].join(' ')}>
                  {card.nameZh}
                </span>
                {card.nameEn && (
                  <span className="text-[0.55rem] uppercase tracking-[0.35em] text-amber-200/85 whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    {card.nameEn}
                  </span>
                )}
              </div>

              <div
                className={['relative rounded-[12px] overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_16px_32px_rgba(8,15,35,0.38)]'].join(' ')}
                style={{ height: fixedHeights.art }}
              >
                <CardArtwork card={card} />
              </div>

              <section className="flex flex-col">
                <div
                  className={effectPanelClass}
                  style={{ height: fixedHeights.desc }}
                >
                  <p className={[
                    'text-left text-[0.78rem] leading-[1.36] text-white whitespace-pre-line pb-1',
                    'overflow-hidden text-ellipsis break-words', // 确保文字不溢出
                    variant === 'hand' ? 'line-clamp-4' : (variant === 'list' ? 'line-clamp-5' : 'line-clamp-6')
                  ].join(' ')}>
                    {card.effect}
                  </p>
                </div>
              </section>

              {variant !== 'hand' && card.quote && (
                <div className="text-[0.62rem] leading-relaxed text-amber-100/80 text-center whitespace-pre-line overflow-hidden italic line-clamp-2">
                  "{card.quote}"
                </div>
              )}
            </div>
          </div>
        )}
      </button>
      <TooltipOverlay tooltip={tooltip} />
    </>
  );
};

function createIcon(name: string, title: string) {
  const ICON_BODIES: Record<string, string> = {
    'crossed-swords':
      '<path fill="currentColor" d="M19.75 14.438c59.538 112.29 142.51 202.35 232.28 292.718l3.626 3.75l.063-.062c21.827 21.93 44.04 43.923 66.405 66.25c-18.856 14.813-38.974 28.2-59.938 40.312l28.532 28.53l68.717-68.717c42.337 27.636 76.286 63.646 104.094 105.81l28.064-28.06c-42.47-27.493-79.74-60.206-106.03-103.876l68.936-68.938l-28.53-28.53c-11.115 21.853-24.413 42.015-39.47 60.593c-43.852-43.8-86.462-85.842-130.125-125.47c-.224-.203-.432-.422-.656-.625C183.624 122.75 108.515 63.91 19.75 14.437zm471.875 0c-83.038 46.28-154.122 100.78-221.97 161.156l22.814 21.562l56.81-56.812l13.22 13.187l-56.438 56.44l24.594 23.186c61.802-66.92 117.6-136.92 160.97-218.72zm-329.53 125.906l200.56 200.53a403 403 0 0 1-13.405 13.032L148.875 153.53zm-76.69 113.28l-28.5 28.532l68.907 68.906c-26.29 43.673-63.53 76.414-106 103.907l28.063 28.06c27.807-42.164 61.758-78.174 104.094-105.81l68.718 68.717l28.53-28.53c-20.962-12.113-41.08-25.5-59.937-40.313c17.865-17.83 35.61-35.433 53.157-52.97l-24.843-25.655l-55.47 55.467c-4.565-4.238-9.014-8.62-13.374-13.062l55.844-55.844l-24.53-25.374c-18.28 17.856-36.602 36.06-55.158 54.594c-15.068-18.587-28.38-38.758-39.5-60.625z"/>',
    telepathy:
      '<path fill="currentColor" d="M128.813 20.813c-.73.03-1.536.107-2.407.218c-33.88 4.403-58.97 36.928-58.97 78.157c0 17.885 4.538 35.768 12.626 50.157c-11.006 4.402-20.227 11.366-27.5 20.094c-9.996 11.996-16.582 27.018-21.124 43.5c-9.086 32.963-10.125 72.234-10.125 107.625v9.343h42.031l9.968 154.75l.563 8.75H191.78l.564-8.75l9.97-154.75h42.03v-9.344c0-35.39-1.04-74.66-10.125-107.625c-4.544-16.48-11.13-31.503-21.126-43.5c-7.273-8.727-16.494-15.69-27.5-20.093c4.88-8.683 8.453-18.635 10.53-29.094l65.814 15.938l16.218 3.937L273 124.22l-12.75-39.345L313.72 98.5c-.003.23 0 .457 0 .688c0 17.884 4.535 35.767 12.624 50.156c-11.007 4.402-20.26 11.366-27.53 20.094c-9.998 11.996-16.553 27.018-21.095 43.5c-9.086 32.963-10.158 72.234-10.158 107.625v9.343h42.064l1.968 30.875v1.408h.094l7.875 122.468l.562 8.75H438.03l.564-8.75l7.844-122.28h.125l.03-2.126l1.938-30.344h42.064v-9.344c0-35.39-1.04-74.66-10.125-107.625c-4.544-16.48-11.13-31.503-21.126-43.5c-7.273-8.727-16.525-15.69-27.53-20.093c8.087-14.39 12.623-32.272 12.623-50.156c0-41.23-25.056-73.755-58.937-78.157h-.03a28 28 0 0 0-4.376-.218c-.893.028-1.45.068-2 .094c-.56-.026-1.136-.065-2.03-.093a28 28 0 0 0-4.377.218h-.03c-28.334 3.682-50.472 27.03-56.97 58.69l-67.217-17.13l-16.44-4.188l5.22 16.125l12.813 39.564l-51.875-12.53c.017-.795.03-1.583.03-2.376c0-41.23-25.056-73.755-58.937-78.157h-.03a28 28 0 0 0-4.375-.218c-.91.03-1.5.07-2.063.094c-.56-.026-1.135-.065-2.03-.093c-.586-.02-1.24-.032-1.97 0zm3.406 18.812c.433.006.7 0 1.218 0c5.338 0 10.785 1.384 15.875 3.78l.093-.155c16.9 7.98 29.447 27.32 30.094 53.78l-19.28-4.655c-3.217-12.606-14.644-21.906-28.25-21.906c-16.103 0-29.157 13.053-29.157 29.155s13.052 29.156 29.156 29.156c11.977 0 22.262-7.234 26.75-17.56l19.093 4.624c-2.573 13.025-7.828 25.176-14.22 32.875l-10.155 12.218l15.593 2.937c12.813 2.408 22.09 8.375 29.72 17.53c7.63 9.158 13.393 21.712 17.47 36.5c7.434 26.98 9.063 60.967 9.31 93.282h-24.874l.563-58.593l-18.69-.188l-1.06 109.78l.03.002l-7.22 112.53H141.5V335h-18.688v139.72H91.406l-7.25-112.345h.063l1.06-109.78l-18.686-.19l-.563 58.782H40.126c.25-32.315 1.908-66.303 9.344-93.28c4.075-14.79 9.806-27.344 17.436-36.5c7.63-9.157 16.907-15.124 29.72-17.532l15.593-2.938l-10.126-12.218c-9.083-10.943-15.97-30.87-15.97-49.532c0-27.573 12.788-47.748 30.157-55.938l.064.156c5.09-2.397 10.536-3.78 15.875-3.78m246.25 0c.44.006.722 0 1.25 0c5.337 0 10.784 1.384 15.874 3.78l.062-.124c17.33 8.21 30.094 28.368 30.094 55.907c0 18.664-6.855 38.59-15.938 49.532l-10.156 12.218l15.625 2.937c12.813 2.408 22.06 8.375 29.69 17.53c7.63 9.158 13.39 21.712 17.467 36.5c7.436 26.98 9.096 60.967 9.344 93.282h-24.717l.562-58.593l-18.688-.188l-1.03 107.03L420.5 474.72h-32.906V335h-18.688v139.72h-31.25l-7.344-114.533l1.063-107.593l-18.688-.188l-.593 58.78l-25.72.002c.25-32.316 1.91-66.304 9.345-93.282c4.075-14.79 9.838-27.343 17.467-36.5c7.63-9.156 16.876-15.123 29.688-17.53l15.625-2.94l-10.156-12.217c-8.415-10.138-14.902-27.996-15.813-45.407l16.72 4.25c3.46 12.237 14.685 21.218 28.03 21.218c16.105 0 29.158-13.053 29.158-29.155S393.382 70.47 377.28 70.47c-12.17 0-22.57 7.466-26.936 18.06l-16.625-4.218c3.687-19.918 14.76-34.387 28.81-41.03l.064.124c5.09-2.397 10.536-3.78 15.875-3.78z"/>',
    'shield-reflect':
      '<path fill="currentColor" d="m19.36 19.457l-.38 27.84l267.127 154.75l-58.703 19.916l57.602 19.36L142.12 383.546l-19.214-19.213l-51.47 114.324l123.125-43.482l-17.492-18.95l151.868-151.87l12.433 43.078l22.976-68.5l56.675-16.565l-57.475-15.492l-22.934-79.828l-14.145 48.266l-268.65-155.41l-38.454-.446zM370.614 81.94q-6.796.03-13.51.302c-3.275.134-6.528.32-9.76.547l31.25 108.786l104.05 28.045c6.204-39.085 8.902-80.275 9.18-120.075C456.37 88.82 415.098 82.257 375.15 81.95a404 404 0 0 0-4.537-.01zm-36.87 2.1c-31.99 3.653-61.013 12.153-83.014 25.87l64.493 37.31l18.52-63.18zm148.18 139.997L378.958 254.13l-38.93 116.054l-20.268-70.225l-39.07 39.067c18.814 35.364 46.1 62.287 86.175 77.604c47.473-17.834 78.566-62.795 98.014-121.6c7.323-22.14 12.905-46.11 17.042-70.993z"/>',
    healing:
      '<path fill="currentColor" d="M250.9 18.9c-23.9 2.99-45.3 30.65-45.3 66.99c0 19.91 6.8 37.41 16.8 49.61l12.2 14.5l-18.7 3.5c-13 2.5-22.6 9.5-30.7 20.8c-8.5 11.5-14.8 26.9-19.1 45.2c-8 32.7-9.9 72.7-9.9 108.2h43.6l11.7 160.5c30.4 7 63.1 6.5 92.3 0l10.7-160.5H356c0-35.7-.5-76.4-7.8-109.7c-3.9-17.9-10-33.7-18.2-45.1c-8.2-11.1-18.5-17.8-33.3-20.1l-18.9-3l11.9-14.9c9.9-12.1 16.4-29.6 16.4-49.01c0-38.54-24-66.99-50.3-66.99zm145 3.59v41.85h-41.8v50.16h41.8v41.6h49.9v-41.6h41.9V64.34h-41.9V22.49zM52.92 62.89v30.58H22.39v36.63h30.53v30.4h36.4v-30.4h30.58V93.47H89.32V62.89zM92.63 199.7v21.8H70.75v26.3h21.88v21.9h26.27v-21.9h21.8v-26.3h-21.8v-21.8zm355.07 62.4v21.8h-21.9v26.3h21.9v21.9H474v-21.9h21.8v-26.3H474v-21.8zm-307.5 99.4v15h-15v18h15v15h18.1v-15h15v-18h-15v-15zm230 45.8v15h-15v18h15v15h18v-15h15v-18h-15v-15zM49.32 431.8v15h-15v18h15v15h18.01v-15h15v-18h-15v-15z"/>',
    hourglass:
      '<path fill="currentColor" d="M92.656 19.188v41.5h331.72v-41.5zM119.5 79.374V433.53h22.28V79.376H119.5zm46.594 0c3.212 43.324 13.312 82.022 27.78 110.906c17.685 35.304 40.845 54.75 64.064 54.75s46.346-19.446 64.03-54.75c14.47-28.883 24.57-67.58 27.782-110.905H166.094zm209.156 0V433.53h22.28V79.376h-22.28zm-117.313 185.22c-23.218 0-46.378 19.415-64.062 54.717c-14.835 29.614-25.098 69.562-28.03 114.22H350c-2.933-44.658-13.197-84.606-28.03-114.22c-17.686-35.302-40.814-54.718-64.033-54.718zM92.657 452.218v41.467h331.718V452.22H92.655z"/>',
    awareness:
      '<path fill="currentColor" d="M121.406 18.313c-57.98 16.562-98.06 51.613-98.062 92.28c-.003 40.518 39.805 75.616 97.437 92.25c-33.653-22.005-55.22-55.224-55.218-92.25c0-37.237 21.85-70.277 55.844-92.28zm276.531 0c33.995 22.003 55.844 55.043 55.844 92.28c.004 37.026-21.563 70.245-55.217 92.25c57.632-16.634 97.44-51.732 97.437-92.25c-.003-40.667-40.082-75.718-98.063-92.28zM163.28 41.656c-43.303 12.368-73.215 38.565-73.218 68.938c-.002 30.26 29.707 56.482 72.75 68.906c-25.135-16.434-41.25-41.255-41.25-68.906c0-27.813 16.328-52.503 41.72-68.938zm192.782 0c25.39 16.435 41.72 41.125 41.72 68.938c0 27.65-16.115 52.472-41.25 68.906c43.043-12.424 72.752-38.645 72.75-68.906c-.004-30.373-29.915-56.57-73.22-68.938m-101.03 6.813c-23.457 3.027-44.22 30.026-44.22 64.655c0 19.094 6.635 36.007 16.438 47.75l10.22 12.25l-15.69 2.938c-12.834 2.4-22.282 9.19-30.25 20.062c-7.965 10.872-14 25.903-18.218 43.156c-7.727 31.62-9.362 70.17-9.593 103.94h41.655l.625 8.655l10.625 141.375h90.344l9.374-141.313l.594-8.718h39.625c-.017-34.152-.373-73.232-7.375-105.095c-3.818-17.37-9.612-32.392-17.688-43.156c-8.076-10.765-17.99-17.51-32.344-19.72l-16-2.47l10.125-12.624c9.38-11.682 15.69-28.4 15.69-47.03c0-36.92-23.274-64.564-49.095-64.564c-2.8 0-4.505-.137-4.844-.093zm-51.438 12.155c-31.38 8.964-53.063 27.96-53.063 49.97c0 21.927 21.53 40.935 52.72 49.936c-18.212-11.908-29.875-29.898-29.875-49.936c.003-20.153 11.82-38.06 30.22-49.97zm112.156 0c18.398 11.91 30.216 29.816 30.22 49.97c0 20.037-11.664 38.027-29.876 49.936c31.19-9 52.72-28.008 52.72-49.936c-.002-22.01-21.686-41.005-53.064-49.97"/>',
    infinity:
      '<path fill="currentColor" d="M278.535 276.134q18.47 32.88 42.854 49.503q24.75 16.255 55.782 16.255q37.311 0 60.955-24.752q23.643-25.12 23.644-63.91q0-37.313-21.795-62.064q-21.798-24.751-54.676-24.752q-29.925 0-54.306 24.752q-24.014 24.382-52.46 84.968m-45.07-39.53q-18.101-32.508-42.853-48.763q-24.381-16.253-55.782-16.254q-37.312 0-60.955 24.752Q50.229 220.72 50.23 259.51q0 37.312 21.795 62.063t54.676 24.752q29.924 0 53.937-24.382q24.381-24.382 52.828-85.338m26.23 67.605q-26.23 50.242-55.045 73.516Q176.203 401 141.108 401q-49.872 0-84.598-41.376q-34.357-41.376-34.357-102.33q0-64.65 30.662-104.55q31.032-39.896 80.535-39.897q35.094 0 62.803 22.905q27.705 22.535 55.414 74.624q25.121-50.98 54.306-74.994Q335.058 111 370.893 111q49.13 0 83.86 41.745q35.093 41.745 35.094 103.07q0 64.28-31.032 104.18q-30.663 39.526-80.165 39.527q-35.098 0-62.433-21.426q-26.97-21.796-56.523-73.886z"/>',
    snail:
      '<path fill="currentColor" d="M425.5 74.313c-8.895 0-16.35 6.21-18.25 14.53c-8.593 3.7-15.195 10.617-19.03 18.813c-5.254 11.223-6.848 24.648-7.158 39.313c-.525 24.904 2.99 53.73 4.532 79.03c-1.782 14.666-4.867 28.518-9.063 41.406c2.84 17.934 3.39 36.487.94 55.188c-5.017 38.286-36.52 61.134-70.22 67.937c-31.048 6.27-65.312.42-87.656-19.405c-34.752 22.61-76.646 28.578-112.406 16.594c-42.048 16.248-74.53 38.826-87.626 61.436H341.25c103.105 0 137.952-107.888 111.406-225.53c-.018.023-.044.038-.062.06c-5.71-40.853.98-70.45 14.906-88.905a18.6 18.6 0 0 0 6.25 1.095c10.333 0 18.688-8.386 18.688-18.72c0-10.332-8.355-18.718-18.688-18.718s-18.72 8.386-18.72 18.72c0 1.017.095 1.994.25 2.968c-21.242 25.165-28.854 65.708-19.25 117.906c-10.296 4.836-21.152 2.878-31.436-6.75c-1.286-28.002-5.364-59.27-4.844-83.905c.283-13.405 2.07-24.72 5.375-31.78c2.1-4.49 4.222-7.344 7.47-9.032c3.355 3.196 7.904 5.187 12.905 5.187c10.333 0 18.688-8.386 18.688-18.72c0-10.332-8.355-18.718-18.688-18.718M193.344 106.25c-2.196-.01-4.398.036-6.594.125c-35.143 1.42-70.142 15.475-99.063 41.25c-56.73 50.558-59.43 144.59-9.187 201.125c38.648 38.3 106.856 34.79 151.5-9.844c37.712-37.61 40.61-94.977 8.78-127c-22.1-22.23-60.996-24.817-85.843 1.188c-5.534 5.79-8.98 16.02-8.906 26.906c.076 10.887 3.653 22.003 9.532 29.063c3.593 4.313 10.625 8.476 18.5 10.468c4.687 1.187 9.596 1.58 14.094 1.25c13.195-.228 26.156-9.01 26.156-26.624c0-15.72-10.332-24.428-21.937-26.28c7.773-.697 14.783.618 20.594 3.81c8.51 4.678 13.69 12.944 15.468 21.533c3.52 16.995-5.478 37.125-25.407 43.343l-.032.062c-.162.06-.337.067-.5.125c-.046.014-.078.05-.125.063c-10.572 3.753-22.202 3.567-32.968.843c-10.977-2.776-21.238-8.167-28.282-16.625c-9.418-11.306-13.744-26.222-13.844-40.874s4.01-29.453 14.062-39.97c32.03-33.52 83.263-31 112.625-1.467c39.98 40.22 35.282 109.352-8.843 153.374v.03c-2.627 2.627-5.384 5.056-8.156 7.438c17.017 12.7 44.022 17.605 68.532 12.657c28.256-5.706 51.524-22.667 55.375-52.064c9.492-72.455-34.215-147.342-72.25-179.25c-27.663-23.21-60.402-34.506-93.343-34.656z"/>',
    'lightning-frequency':
      '<path fill="currentColor" d="M33.125 19.406L135.5 128.22l81-23.157l18.72-5.344l-7.564 17.936l-46.125 109.78l134.282-70l26.157-13.655L328.436 170L256.5 309.25l91.25-57.125l22.97-14.375l-9.22 25.47l-34.625 95.624l71-36.375l21.188-10.845L410.906 334l-33.937 93.063l45.124-6.688l4.53-.656l3.313 3.155l64.313 61.47l-30.5-80.5l23.313-46.908l-72.5 39.532l51.062-141.158l-91.188 47.47l72.344-142.813l-128.217 82.81L421.875 70.063L239.03 168.69l30.44-99.563l-103.845 25.25zM18.155 30.78l77.876 108.25l-31.124 75.532l94.125-46.78l-98.905 166.812l190.25-99.656l-101.03 185.406l140.25-79.063l-46.94 102.22l106.5-53l-45.655 92.28l86.5-14.467l93.47 31.562l-63.158-60.344l-56.125 8.314l-15.53 2.312l5.374-14.75l31.158-85.437l-70.907 36.31l-21.124 10.814l8.094-22.313l33.47-92.436l-97.22 60.875l-28.938 18.092L224.22 331l74.06-143.344l-131.06 68.313l-22.97 12l10.03-23.908l48.626-115.687l-67.75 19.375l-5.5 1.563l-3.875-4.157L18.157 30.78z"/>'
  };

  const body = ICON_BODIES[name];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 512 512"
      className="h-4 w-4 text-current"
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

const getTooltipRoot = (): HTMLElement | null => {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById('game07-tooltip-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'game07-tooltip-root';
    document.body.appendChild(el);
  }
  return el;
};

const TooltipOverlay: React.FC<{ tooltip: TooltipState | null }> = ({ tooltip }) => {
  if (typeof document === 'undefined' || tooltip == null) return null;
  const root = getTooltipRoot();
  if (!root) return null;
  return createPortal(
    <div
      className="pointer-events-none z-[100000] max-w-[14rem] rounded-md bg-slate-900/95 px-3 py-2 text-amber-50 shadow-xl ring-1 ring-white/10"
      style={{
        position: 'fixed',
        left: tooltip.x,
        top: tooltip.y,
        transform: 'translate(-50%, -100%)',
        whiteSpace: 'normal'
      }}
    >
      <div className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
        {tooltip.label}
      </div>
      <div className="mt-1 text-[0.62rem] leading-snug text-slate-100/90">{tooltip.description}</div>
    </div>,
    root
  );
};
