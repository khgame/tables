import { useEffect, useRef, useState } from 'react';
import type { VisualEffectEvent, GameStatus } from '../../types';
import { SkillEffect } from '../../skills/effects';

/**
 * Keeps a deduped, time-ordered queue of visual effect events to render.
 * - Only plays events newer than the last processed timestamp
 * - Uses an internal tracker to avoid re-playing historical events
 * - Automatically cleans up each queued event after its animation window
 */
export function useVisualEffects(gameState: GameStatus): VisualEffectEvent[] {
  const [active, setActive] = useState<VisualEffectEvent[]>([]);
  const lastTsRef = useRef(0);
  const trackerRef = useRef<Set<string>>(new Set());

  // enqueue new visuals
  useEffect(() => {
    const visuals = gameState.visuals ?? [];
    const cutoff = lastTsRef.current;
    const next = visuals.filter(e => e.createdAt > cutoff && !trackerRef.current.has(e.id));
    if (next.length === 0) return;

    next.forEach(ev => {
      trackerRef.current.add(ev.id);
      setActive(prev => [...prev, ev]);
      // 根据角色与具体技能调整动画占用时长
      const isCounterSkill = ev.role === 'counter';
      let cleanupDelay = isCounterSkill ? 4200 : 3000;
      if (ev.effectId === SkillEffect.CounterRestoreBoard) cleanupDelay = 4200; // 东山再起：反击动画更长
      if (ev.effectId === SkillEffect.InstantWin || ev.effectId === SkillEffect.CounterReverseWin) cleanupDelay = 4200;
      window.setTimeout(() => {
        setActive(prev => prev.filter(x => x.id !== ev.id));
      }, cleanupDelay);
    });

    const maxTs = Math.max(cutoff, ...next.map(e => e.createdAt));
    lastTsRef.current = maxTs;
  }, [gameState.visuals]);

  // reset on new game / full rewind
  useEffect(() => {
    if (gameState.turnCount === 0 && gameState.board.history.length === 0) {
      trackerRef.current.clear();
      lastTsRef.current = 0;
      setActive([]);
    }
  }, [gameState.turnCount, gameState.board.history.length]);

  return active;
}
