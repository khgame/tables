import React, { useMemo } from 'react';
import { PlayerEnum } from '../core/constants';
import type { GameStatus, TargetRequest } from '../types';

export interface BoardProps {
  board: GameStatus['board'];
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
  targetRequest: TargetRequest | null;
  onTargetSelect: (selection: { row: number; col: number }) => void;
  className?: string;
  style?: React.CSSProperties;
  onCardDrop?: (index: number | null) => void;
  onBlockedInteract?: () => void;
}

const extractCardIndex = (event: React.DragEvent) => {
  const raw = event.dataTransfer.getData('application/x-card-index');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
};

export const Board: React.FC<BoardProps> = ({
  board,
  onCellClick,
  disabled,
  targetRequest,
  onTargetSelect,
  className,
  style,
  onCardDrop,
  onBlockedInteract
}) => {
  const lastMove = board.history[board.history.length - 1];
  const inTargetMode = Boolean(targetRequest && targetRequest.type === 'cell');
  const targetCells = useMemo(() => {
    const set = new Set<string>();
    if (inTargetMode && targetRequest?.cells) {
      targetRequest.cells.forEach(cell => set.add(`${cell.row}-${cell.col}`));
    }
    return set;
  }, [inTargetMode, targetRequest]);
  const originKey = targetRequest?.origin ? `${targetRequest.origin.row}-${targetRequest.origin.col}` : null;

  const handleClick = (row: number, col: number) => {
    if (inTargetMode) {
      const key = `${row}-${col}`;
      if (!targetCells.has(key)) return;
      onTargetSelect({ row, col });
      return;
    }
    if (disabled) return;
    onCellClick(row, col);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onCardDrop?.(extractCardIndex(event));
  };

  return (
    <div
      className={['gomoku-board', className ?? ''].join(' ')}
      style={style}
      onDragOver={event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = event.dataTransfer.types.includes('application/x-card-index') ? 'move' : 'none';
      }}
      onDrop={handleDrop}
      onPointerDown={event => {
        if (!disabled) return;
        if (inTargetMode) return;
        if (typeof onBlockedInteract === 'function') {
          onBlockedInteract();
        }
      }}
      aria-disabled={disabled}
    >
      <div className="gomoku-board__surface">
        <div className="gomoku-board__grid" style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}>
          {Array.from({ length: board.size }).map((_, rowIdx) =>
            Array.from({ length: board.size }).map((_, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const highlight = inTargetMode
                ? targetCells.has(key)
                  ? 'target'
                  : originKey === key
                    ? 'origin'
                    : null
                : null;
              const value = board.get(rowIdx, colIdx);
              const isLast = Boolean(lastMove && lastMove.row === rowIdx && lastMove.col === colIdx);
              const classes = ['gomoku-board__cell'];
              if (!value && !highlight) classes.push('gomoku-board__cell--interactive');
              if (isLast) classes.push('gomoku-board__cell--last');
              if (highlight === 'target') classes.push('gomoku-board__cell--target');
              if (highlight === 'origin') classes.push('gomoku-board__cell--origin');

              return (
                <button
                  key={key}
                  type="button"
                  className={classes.join(' ')}
                  onClick={() => handleClick(rowIdx, colIdx)}
                  disabled={Boolean(value) && !highlight}
                  onDragOver={event => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = event.dataTransfer.types.includes('application/x-card-index') ? 'move' : 'none';
                  }}
                  onDrop={handleDrop}
                >
                  {value === PlayerEnum.BLACK && <div className="gomoku-stone gomoku-stone--black" />}
                  {value === PlayerEnum.WHITE && <div className="gomoku-stone gomoku-stone--white" />}
                </button>
              );
            })
          )}
        </div>
        <div className="gomoku-board__decor gomoku-board__decor--top" />
        <div className="gomoku-board__decor gomoku-board__decor--bottom" />
      </div>
    </div>
  );
};
