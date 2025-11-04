import { useEffect, useRef, useState } from 'react';
import type { GameStatus, Player } from '../../types';
import { GamePhaseEnum } from '../../core/constants';
import { SkillEffect } from '../../skills/effects';

export function useWinPresentation(gameState: GameStatus) {
  const [showFinal, setShowFinal] = useState(false);
  const [lit, setLit] = useState<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
    setLit(new Set());

    if (gameState.phase !== GamePhaseEnum.GAME_OVER || gameState.winner == null) {
      setShowFinal(false);
      return;
    }

    const recent = (gameState.visuals ?? []).slice(-3).find(v =>
      v.effectId === SkillEffect.InstantWin || v.effectId === SkillEffect.CounterReverseWin
    );
    if (recent) {
      setShowFinal(false);
      const t = window.setTimeout(() => setShowFinal(true), 3200);
      timersRef.current.push(t);
      return;
    }

    const winner = gameState.winner;
    const line = findWinningLine(gameState.board, winner);
    if (!line || line.length < 5) {
      setShowFinal(true);
      return;
    }

    setShowFinal(false);
    const keys = line.map(c => `${c.row}-${c.col}`);
    keys.forEach((k, idx) => {
      const t = window.setTimeout(() => {
        setLit(prev => {
          const next = new Set(prev);
          next.add(k);
          return next;
        });
        if (idx === keys.length - 1) {
          const t2 = window.setTimeout(() => setShowFinal(true), 50);
          timersRef.current.push(t2);
        }
      }, 100 * idx);
      timersRef.current.push(t);
    });

    return () => {
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [gameState.phase, gameState.winner, gameState.board, gameState.visuals]);

  return { showFinalPanel: showFinal, winLineLit: lit } as const;
}

function findWinningLine(board: GameStatus['board'], winner: Player | null) {
  if (!winner) return null;
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      for (const { dr, dc } of directions) {
        let count = 0;
        const cells: Array<{ row: number; col: number }> = [];
        for (let i = 0; i < 5; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr >= 0 && nr < board.size && nc >= 0 && nc < board.size) {
            if (board.get(nr, nc) === winner) {
              count++;
              cells.push({ row: nr, col: nc });
            } else break;
          }
        }
        if (count === 5) return cells;
      }
    }
  }
  return null;
}
