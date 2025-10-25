import React from 'react';
import type { Player, RawCard } from '../types';
import { PLAYER_NAMES } from '../core/constants';
import { CardView } from './CardView';

export interface MulliganPanelProps {
  player: Player;
  card: RawCard | null;
  onKeep: () => void;
  onReplace: () => void;
  hidden?: boolean;
}

export const MulliganPanel: React.FC<MulliganPanelProps> = ({ player, card, onKeep, onReplace, hidden }) => (
  <div className="mulligan-panel">
    <div className="mulligan-panel__inner">
      <h2 className="mulligan-panel__title">{PLAYER_NAMES[player]} 的调度阶段</h2>
      {hidden ? (
        <p className="mulligan-panel__hint">{PLAYER_NAMES[player]} 正在调整手牌…</p>
      ) : (
        <>
          <p className="mulligan-panel__description">你可以保留当前手牌或将其置入墓地并抽取新牌，回合结束后将自动继续。</p>
          <div className="mulligan-panel__actions">
            <button
              type="button"
              onClick={onKeep}
              className="mulligan-panel__button mulligan-panel__button--keep"
            >
              保留手牌
            </button>
            <button
              type="button"
              onClick={onReplace}
              className="mulligan-panel__button mulligan-panel__button--replace"
            >
              换一张
            </button>
          </div>
        </>
      )}
    </div>
    {!hidden && (
      <div className="mulligan-panel__card-floating">
        {card ? <CardView card={card} disabled variant="showcase" style={{ width: '10rem' }} /> : <div className="mulligan-panel__empty">无手牌</div>}
      </div>
    )}
  </div>
);
