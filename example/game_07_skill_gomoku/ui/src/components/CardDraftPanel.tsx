import React, { useEffect, useMemo, useState } from 'react';
import type { CardDraftOption } from '../types';
import { CardView } from './CardView';
import standPanda from '../assets/stand_panda.png';

export interface CardDraftPanelProps {
  options: CardDraftOption[];
  source: 'initial' | 'draw';
  onSelect: (id: string) => void;
}

const SOURCE_TITLE: Record<CardDraftPanelProps['source'], string> = {
  initial: '选择起始牌',
  draw: '从抽到的卡牌中选择'
};

export const CardDraftPanel: React.FC<CardDraftPanelProps> = ({ options, source, onSelect }) => {
  const [appear, setAppear] = useState(false);
  const [turnBanner, setTurnBanner] = useState(true);
  const [pandaWiggle, setPandaWiggle] = useState(false);
  const displayCount = useMemo(() => Math.min(3, options.length), [options.length]);

  useEffect(() => {
    const t0 = window.setTimeout(() => setAppear(true), 160);
    const tBanner = window.setTimeout(() => setTurnBanner(false), 900);
    return () => { window.clearTimeout(t0); window.clearTimeout(tBanner); };
  }, []);

  // Panda subtle wiggle every few seconds
  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;
    let offId: number | null = null;
    const schedule = (delay: number) => {
      timerId = window.setTimeout(() => {
        if (cancelled) return;
        setPandaWiggle(true);
        offId = window.setTimeout(() => {
          setPandaWiggle(false);
          if (!cancelled) {
            // next cycle: 4.5s ~ 8s
            schedule(4500 + Math.floor(Math.random() * 3500));
          }
        }, 1100);
      }, delay);
    };
    schedule(2200);
    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
      if (offId) window.clearTimeout(offId);
    };
  }, []);

  return (
    <div className="draft-modal" role="dialog" aria-modal="true">
      {/* Dim & halftone mask that blocks background interactions */}
      <div className="draft-modal__backdrop" />
      {turnBanner && (
        <div className="draft-banner">
          我方回合
        </div>
      )}

      {/* Persona-like side stage */}
      <aside className="draft-stage">
        {/* Decorative stripes & panda illustration */}
        <div className="draft-decor">
          <div className="draft-decor__stripes" />
          <img
            src={standPanda}
            alt="Pet stand"
            className={`draft-decor__panda ${pandaWiggle ? 'draft-decor__panda--wiggle' : ''}`}
            style={{ opacity: appear ? 1 : 0, transform: appear ? 'translateY(0)' : 'translateY(6px)', transition: 'all 260ms ease' }}
          />
        </div>

        <div
          className={`draft-panel ${appear ? 'draft-panel--in' : ''}`}
          aria-label={SOURCE_TITLE[source]}
        >
          <header className="draft-panel__header">
            <div className="draft-panel__header-ink" />
            <h2 className="draft-panel__title">{SOURCE_TITLE[source]}</h2>
            <p className="draft-panel__subtitle">请选择一张加入手牌</p>
          </header>
          <div className="draft-panel__body">
            <div className="draft-cards">
              {options.slice(0, displayCount).map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  className="draft-card__btn group"
                  onClick={() => onSelect(option.id)}
                  style={{
                    opacity: appear ? 1 : 0,
                    transform: appear ? 'translateY(0) rotate(0deg) scale(1)' : 'translateY(18px) rotate(-2deg) scale(0.98)',
                    transition: `transform 360ms cubic-bezier(.21,.85,.24,1.12) ${idx * 100}ms, opacity 220ms ease ${idx * 100}ms`
                  }}
                >
                  <CardView
                    card={option.card}
                    variant="list"
                    style={{ width: '11.6rem' }}
                    compact
                    disabled={false}
                  />
                  <span className="draft-card__badge">剩余 {option.remaining}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
