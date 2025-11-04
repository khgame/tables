import { useEffect } from 'react';
import type { GameStatus } from '../../types';
import { GamePhaseEnum, PlayerEnum } from '../../core/constants';

export function useInactivityPrompt(params: {
  gameState: GameStatus;
  isPlayerTurn: boolean;
  lastPlayerActionRef: React.MutableRefObject<number>;
  setAiBubble: React.Dispatch<React.SetStateAction<{ id: string; text: string; tone?: 'prompt' | 'praise' | 'taunt' | 'info' | 'frustrated' } | null>>;
  setBoardBlockedFeedback: React.Dispatch<React.SetStateAction<boolean>>;
  setPlayerInactivityLevel: React.Dispatch<React.SetStateAction<0 | 1 | 2>>;
}) {
  const { gameState, isPlayerTurn, lastPlayerActionRef, setAiBubble, setBoardBlockedFeedback, setPlayerInactivityLevel } = params;

  // 回合开始时标记一次动作时间并重置层级
  useEffect(() => {
    lastPlayerActionRef.current = Date.now();
    try { setPlayerInactivityLevel(0); } catch {}
  }, [isPlayerTurn, gameState.turnCount]);

  // 空闲提示与棋盘轻晃
  useEffect(() => {
    const timers: number[] = [];

    const eligible =
      gameState.aiEnabled &&
      gameState.phase === GamePhaseEnum.PLAYING &&
      isPlayerTurn &&
      !gameState.pendingAction && !gameState.targetRequest && !gameState.draft && !gameState.pendingCounter;
    if (!eligible) return () => timers.forEach(id => window.clearTimeout(id));

    const now = Date.now();
    const elapsed = now - lastPlayerActionRef.current;
    const thresholds = [7000, 14000];
    const messages = ['你掉线了?', '我等的黄花菜都凉了'];

    thresholds.forEach((ms, idx) => {
      const delay = Math.max(0, ms - elapsed);
      const t = window.setTimeout(() => {
        const ok =
          gameState.aiEnabled &&
          gameState.phase === GamePhaseEnum.PLAYING &&
          gameState.currentPlayer === PlayerEnum.BLACK &&
          !gameState.pendingAction && !gameState.targetRequest && !gameState.draft && !gameState.pendingCounter;
        if (!ok) return;
        const id = `ai-bubble-${Date.now()}-${idx}`;
        setAiBubble({ id, text: messages[idx], tone: 'frustrated' });
        setBoardBlockedFeedback(true);
        window.setTimeout(() => {
          setAiBubble(prev => (prev && prev.id === id ? null : prev));
        }, 1600);
        try {
          setPlayerInactivityLevel(prev => {
            if (prev === 0) return 1;
            if (prev === 1) return 2;
            return 2;
          });
        } catch {}
      }, delay);
      timers.push(t);
    });

    return () => {
      timers.forEach(id => window.clearTimeout(id));
    };
  }, [gameState.aiEnabled, gameState.phase, isPlayerTurn, gameState.pendingAction, gameState.targetRequest, gameState.draft, gameState.pendingCounter, gameState.currentPlayer]);
}
