import React, { useMemo, useState } from 'react';
import type { RawCard } from '../types';
import { CardView } from './CardView';

export interface CardCollectionPanelProps {
  cards: RawCard[];
  open: boolean;
  onClose: () => void;
}

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

type CardType = 'Attack' | 'Counter' | 'Support';

// 类型映射：将JSON中的小写类型映射到组件使用的大写类型
const normalizeCardType = (type: string): CardType => {
  const lower = type.toLowerCase();
  if (lower === 'attack') return 'Attack';
  if (lower === 'counter') return 'Counter';
  if (lower === 'support') return 'Support';
  // 默认返回 Support 作为后备
  return 'Support';
};

const TYPE_LABELS: Record<CardType, string> = {
  Attack: '进攻卡',
  Counter: '反击卡',
  Support: '辅助卡'
};

const TYPE_COLORS: Record<CardType, { bg: string; border: string; text: string }> = {
  Attack: {
    bg: 'rgba(220, 38, 38, 0.15)',
    border: 'rgba(220, 38, 38, 0.4)',
    text: 'rgb(252, 165, 165)'
  },
  Counter: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    text: 'rgb(147, 197, 253)'
  },
  Support: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.4)',
    text: 'rgb(134, 239, 172)'
  }
};

export const CardCollectionPanel: React.FC<CardCollectionPanelProps> = ({ cards, open, onClose }) => {
  const [selectedType, setSelectedType] = useState<CardType | 'all'>('all');
  const [selectedCard, setSelectedCard] = useState<RawCard | null>(null);

  const cardsByType = useMemo(() => {
    const result: Record<CardType, RawCard[]> = {
      Attack: [],
      Counter: [],
      Support: []
    };

    cards.forEach(card => {
      const normalizedType = normalizeCardType(card.type);
      result[normalizedType].push(card);
    });

    // 按稀有度和ID排序
    const rarityOrder: Record<string, number> = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4
    };
    Object.keys(result).forEach(type => {
      result[type as CardType].sort((a, b) => {
        const rarityA = rarityOrder[a.rarity?.toLowerCase()] || 0;
        const rarityB = rarityOrder[b.rarity?.toLowerCase()] || 0;
        if (rarityA !== rarityB) return rarityA - rarityB;
        const tidA = Number(a._tid ?? a.tid) || 0;
        const tidB = Number(b._tid ?? b.tid) || 0;
        return tidA - tidB;
      });
    });

    return result;
  }, [cards]);

  const displayCards = useMemo(() => {
    if (selectedType === 'all') {
      return [...cardsByType.Attack, ...cardsByType.Counter, ...cardsByType.Support];
    }
    return cardsByType[selectedType];
  }, [selectedType, cardsByType]);

  if (!open) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 主面板 */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-6xl h-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #1f2937 0%, #374151 50%, #1f2937 100%)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* 顶部装饰光带 */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: 'linear-gradient(90deg, transparent, rgb(245, 158, 11), transparent)'
            }}
          />

          {/* 头部 */}
          <div className="relative px-6 py-4 border-b border-amber-200/20 bg-gradient-to-r from-slate-800/50 via-slate-700/30 to-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20 border border-amber-400/30">
                  <svg className="w-6 h-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-amber-100 tracking-wide">卡牌图鉴</h2>
                  <p className="text-xs text-slate-300 mt-0.5">共 {cards.length} 张卡牌</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 transition-all text-slate-300 hover:text-slate-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 分类标签 */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setSelectedType('all')}
                className={cx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedType === 'all'
                    ? 'bg-amber-500/30 border-2 border-amber-400/60 text-amber-100 shadow-lg'
                    : 'bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-600/40 hover:border-slate-500/50'
                )}
              >
                全部 ({cards.length})
              </button>
              {(['Attack', 'Counter', 'Support'] as CardType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    selectedType === type
                      ? 'border-2 shadow-lg'
                      : 'border hover:brightness-110'
                  )}
                  style={
                    selectedType === type
                      ? {
                          background: TYPE_COLORS[type].bg,
                          borderColor: TYPE_COLORS[type].border,
                          color: TYPE_COLORS[type].text
                        }
                      : {
                          background: 'rgba(51, 65, 85, 0.4)',
                          borderColor: 'rgba(71, 85, 105, 0.4)',
                          color: 'rgb(203, 213, 225)'
                        }
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: TYPE_COLORS[type].border }}
                  />
                  {TYPE_LABELS[type]} ({cardsByType[type].length})
                </button>
              ))}
            </div>
          </div>

          {/* 卡牌网格 */}
          <div className="relative h-[calc(100%-140px)] overflow-y-auto p-6 scrollbar-thin scrollbar-track-slate-800/40 scrollbar-thumb-slate-600/60 hover:scrollbar-thumb-slate-500/80">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayCards.map(card => {
                const tid = card._tid ?? card.tid;
                return (
                  <div
                    key={`${tid}-${card.name}`}
                    className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:z-10"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="relative">
                      <CardView
                        card={card}
                        variant="compact"
                        className="w-full"
                      />
                      {/* 悬浮提示 */}
                      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 text-center">
                          <p className="text-xs font-medium text-white drop-shadow-lg">点击查看详情</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayCards.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-24 h-24 rounded-full bg-slate-700/30 border border-slate-600/30 flex items-center justify-center mb-4">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-lg font-medium">暂无卡牌</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 卡牌详情弹窗 */}
      {selectedCard && (
        <>
          <div
            className="fixed inset-0 z-[202] bg-black/50"
            onClick={() => setSelectedCard(null)}
          />
          <div className="fixed inset-0 z-[203] flex items-center justify-center p-4">
            <div
              className="relative max-w-md w-full rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #1f2937 0%, #374151 50%, #1f2937 100%)',
                border: '2px solid rgba(245, 158, 11, 0.4)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-amber-100">卡牌详情</h3>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 transition-all text-slate-300 hover:text-slate-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <CardView
                  card={selectedCard}
                  variant="normal"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
