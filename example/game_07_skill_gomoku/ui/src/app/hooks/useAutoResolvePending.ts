import { useEffect, useRef } from 'react';
import type { GameStatus } from '../../types';
import { GamePhaseEnum, PlayerEnum } from '../../core/constants';

/**
 * Auto-resolve my (BLACK) pending card based on instant/non-instant semantics.
 * - Instant: resolve after 7s
 * - Non-instant: resolve when counter window expires
 */
export function useAutoResolvePending(
  gameState: GameStatus,
  resolveCard: (countered: boolean, counterCard: null) => void
) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = gameState.pendingAction;
    if (gameState.phase !== GamePhaseEnum.COUNTER_WINDOW || !pending) return;
    if (pending.player !== PlayerEnum.BLACK) return;

    const isInstant = Boolean(pending.metadata?.uiInstant);
    const now = Date.now();
    let ms: number | null = null;
    if (isInstant) {
      ms = 7000;
    } else if (gameState.counterWindow) {
      ms = Math.max(0, (gameState.counterWindow.expiresAt ?? now) - now);
    }
    if (ms && ms > 0) {
      timerRef.current = window.setTimeout(() => resolveCard(false, null), ms) as unknown as number;
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.phase, gameState.pendingAction, gameState.counterWindow, resolveCard]);
}
