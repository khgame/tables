import React from 'react';
import type { GraveyardEntry, ShichahaiEntry } from '../types';
import { PLAYER_NAMES } from '../core/constants';
import { CardFrame } from './CardFrame';

export interface ZonePanelProps {
  title: string;
  graveyard: GraveyardEntry[];
  shichahai: ShichahaiEntry[];
  variant?: 'player' | 'opponent';
}

const GraveIcon = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path
      d="M12 2C7.58 2 4 5.58 4 10V20H20V10C20 5.58 16.42 2 12 2ZM12 4C15.31 4 18 6.69 18 10V18H6V10C6 6.69 8.69 4 12 4ZM11 6V8H9V10H11V18H13V10H15V8H13V6H11Z"
      fill="currentColor"
    />
  </svg>
);

const SeaIcon = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path
      d="M4 6C6 6 7 8 9 8C11 8 12 6 14 6C16 6 18 8 20 8V10C18 10 16 8 14 8C12 8 11 10 9 10C7 10 6 8 4 8V6ZM4 12C6 12 7 14 9 14C11 14 12 12 14 12C16 12 18 14 20 14V16C18 16 16 14 14 14C12 14 11 16 9 16C7 16 6 14 4 14V12ZM4 18C6 18 7 20 9 20C11 20 12 18 14 18C16 18 18 20 20 20V22C18 22 16 20 14 20C12 20 11 22 9 22C7 22 6 20 4 20V18Z"
      fill="currentColor"
    />
  </svg>
);

export const ZonePanel: React.FC<ZonePanelProps> = ({ title, graveyard, shichahai, variant = 'player' }) => (
  <div className={`zone-panel zone-panel--${variant}`}>
    <header className="zone-panel__header">
      <h3 className="zone-panel__title">{title}</h3>
      <div className="zone-panel__summary">
        <span className="zone-chip zone-chip--grave">
          {GraveIcon}
          <span>{graveyard.length}</span>
        </span>
        <span className="zone-chip zone-chip--sea">
          {SeaIcon}
          <span>{shichahai.length}</span>
        </span>
      </div>
    </header>
    <section className="zone-section">
      <div className="zone-section__title">
        <span className="zone-section__icon">{GraveIcon}</span>
        <span>墓地</span>
      </div>
      {graveyard.length === 0 ? (
        <div className="zone-empty">暂无卡牌</div>
      ) : (
        <div className="zone-scroll zone-scroll--grave">
          {graveyard.map(item => (
            <div key={item.id} className="zone-card">
              <div className="zone-card__frame">
                <CardFrame type={item.cardType ?? 'Support'} width={62} height={100} variant="front" />
                <span className="zone-card__badge">T{item.turn}</span>
              </div>
              <div className="zone-card__info">
                <div className="zone-card__name">{item.cardName}</div>
                <div className="zone-card__meta">{describeReason(item.reason)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
    <section className="zone-section">
      <div className="zone-section__title">
        <span className="zone-section__icon">{SeaIcon}</span>
        <span>什刹海</span>
      </div>
      {shichahai.length === 0 ? (
        <div className="zone-empty">暂无记录</div>
      ) : (
        <div className="zone-scroll zone-scroll--sea">
          {shichahai.map(entry => (
            <div key={entry.id} className="zone-token">
              <div className="zone-token__glyph">
                <span>{entry.row + 1}</span>
                <span>{entry.col + 1}</span>
              </div>
              <div className="zone-token__body">
                <div className="zone-token__title">{PLAYER_NAMES[entry.owner]} 的棋子</div>
                <div className="zone-token__meta">
                  第 {entry.turn} 回合 · {entry.cardName ?? '技能效果'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
);

const describeReason = (reason: string) => {
  switch (reason) {
    case 'played':
      return '已使用';
    case 'counter':
      return '用于反击';
    case 'countered':
      return '被反击打出';
    case 'mulligan':
      return '调度阶段换牌';
    case 'fizzled':
      return '未命中目标';
    default:
      return reason;
  }
};

