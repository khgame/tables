import { useEffect, useRef } from 'react';
import type { GameStatus } from '../../types';
import { GamePhaseEnum } from '../../core/constants';

/**
 * Auto-resolve pending card based on instant/non-instant semantics (both sides).
 * - Instant: resolve after 7s
 * - Non-instant: resolve when counter window expires (or immediately if already expired)
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

    const isInstant = Boolean(pending.metadata?.uiInstant);
    const now = Date.now();
    let ms: number | null = null;
    if (isInstant) {
      ms = 7000;
    } else if (gameState.counterWindow) {
      ms = Math.max(0, (gameState.counterWindow.expiresAt ?? now) - now);
    }
    // 若窗口已过期，立即推进结算（避免因标签页休眠而错过定时器）
    if (ms === 0) {
      // 使用微任务，让 React 有机会先清理上一次 effect
      Promise.resolve().then(() => resolveCard(false, null)).catch(() => {});
      return;
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
