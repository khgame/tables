import React from 'react';
import type { CardDraftOption } from '../types';
import { CardView } from './CardView';

export interface CardDraftPanelProps {
  options: CardDraftOption[];
  source: 'initial' | 'draw';
  onSelect: (id: string) => void;
}

const SOURCE_TITLE: Record<CardDraftPanelProps['source'], string> = {
  initial: '选择起始牌',
  draw: '从抽到的卡牌中选择'
};

export const CardDraftPanel: React.FC<CardDraftPanelProps> = ({ options, source, onSelect }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/75 backdrop-blur-sm px-4">
    <div className="w-full max-w-5xl space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-semibold text-amber-100 drop-shadow-lg">{SOURCE_TITLE[source]}</h2>
        <p className="mt-1 text-sm text-amber-100/80">请选择一张加入手牌（剩余数量仅为当前牌堆内的统计）</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {options.map(option => (
          <button
            key={option.id}
            type="button"
            className="group relative block focus:outline-none"
            onClick={() => onSelect(option.id)}
          >
            <CardView
              card={option.card}
              variant="showcase"
              style={{ width: '15.5rem' }}
              disabled={false}
            />
            <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-amber-100 shadow-lg">
              剩余 {option.remaining}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
