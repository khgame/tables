import React, { Fragment } from 'react';
import { PLAYER_NAMES, PlayerEnum } from '../core/constants';
import type { GameStatus, Player, RawCard } from '../types';
import { CardView } from './CardView';

export interface PendingCardPanelProps {
  pendingCard: GameStatus['pendingAction'];
  responder: Player | null;
  availableCounters: RawCard[];
  selectedCounter: RawCard | null;
  setSelectedCounter: (card: RawCard | null) => void;
  onResolve: (countered: boolean, counterCard: RawCard | null) => void;
  aiEnabled: boolean;
}

export const PendingCardPanel: React.FC<PendingCardPanelProps> = ({
  pendingCard,
  responder,
  availableCounters,
  selectedCounter,
  setSelectedCounter,
  onResolve,
  aiEnabled
}) => {
  if (!pendingCard) return null;
  const actingPlayer = pendingCard.player;
  const isResponderAI = aiEnabled && responder === PlayerEnum.WHITE;
  const canCounter = responder === PlayerEnum.BLACK && availableCounters.length > 0;

  return (
    <div className="pending-panel">
      <div className="pending-panel__glass">
        <div className="pending-panel__title">
          <span className="pending-panel__tag">{PLAYER_NAMES[actingPlayer]}</span>
          <span>发动技能</span>
        </div>
        <div className="pending-panel__content">
          <div className="pending-panel__primary-card">
            <CardView card={pendingCard.card} variant="list" style={{ width: '8.4rem' }} />
          </div>
          <p className="pending-panel__effect">{pendingCard.card.effect}</p>
        </div>
        {canCounter ? (
          <Fragment>
            <div className="pending-panel__subtitle">
              {PLAYER_NAMES[responder!]} 可用反击卡
            </div>
            <div className="pending-panel__counter-grid">
              {availableCounters.map(card => {
                const tid = card._tid ?? card.tid;
                const isSelected = selectedCounter && (selectedCounter._tid ?? selectedCounter.tid) === tid;
                return (
                  <div key={tid} className={`pending-panel__counter-card ${isSelected ? 'pending-panel__counter-card--active' : ''}`}>
                    <CardView
                      card={card}
                      variant="list"
                      style={{ width: '6.6rem' }}
                      onClick={() => setSelectedCounter(card)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="pending-panel__actions">
              <button
                type="button"
                disabled={!selectedCounter}
                onClick={() => selectedCounter && onResolve(true, selectedCounter)}
                className="pending-panel__button pending-panel__button--counter"
              >
                使用反击卡
              </button>
              <button
                type="button"
                onClick={() => {
                  onResolve(false, null);
                  setSelectedCounter(null);
                }}
                className="pending-panel__button pending-panel__button--pass"
              >
                放弃反击
              </button>
            </div>
          </Fragment>
        ) : (
          <div className="pending-panel__actions">
            <button
              type="button"
              onClick={isResponderAI ? undefined : () => onResolve(false, null)}
              disabled={isResponderAI}
              className="pending-panel__button pending-panel__button--confirm"
            >
              确认生效
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
