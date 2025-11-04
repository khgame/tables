import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PlayerEnum } from '../core/constants';
import type { GameStatus, TargetRequest, Player } from '../types';

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
  winLineLit?: Set<string> | null;
  hoveredPosition?: { row: number; col: number } | null;
  skillTargetPosition?: { row: number; col: number } | null;
  sealedCells?: [
    { row: number; col: number; expiresAtTurn: number } | null,
    { row: number; col: number; expiresAtTurn: number } | null
  ];
  currentTurn?: number;
  removedCells?: Array<{ row: number; col: number; owner: Player }>; // 动画：被移入什刹海
}

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

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
  onBlockedInteract,
  winLineLit = null,
  hoveredPosition = null,
  skillTargetPosition = null,
  sealedCells = [null, null],
  currentTurn = 0,
  removedCells = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardPixels, setBoardPixels] = useState<number | null>(null);
  // 使用 SVG 绘制网格与星位，让交叉点精确位于每个格心
  const gridPositions = useMemo(() => Array.from({ length: board.size }, (_, i) => i + 0.5), [board.size]);
  const starPoints = useMemo(() => {
    const size = board.size;
    const mid = Math.floor(size / 2) + 0.5; // 天元
    if (size >= 15) {
      const k = 3.5; // 3 与 size-4 的半坐标
      const arr = [k, mid, size - 0.5 - 3]; // (3.5, 7.5, 11.5)
      const pts: Array<{ x: number; y: number }> = [];
      arr.forEach(x => arr.forEach(y => pts.push({ x, y })));
      return pts;
    }
    return [{ x: mid, y: mid }];
  }, [board.size]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const updateSize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth <= 0 || clientHeight <= 0) return;
      const raw = Math.min(clientWidth, clientHeight);
      const margin = Math.max(40, raw * 0.08);
      const size = Math.floor(Math.max(0, raw - margin));
      setBoardPixels(size);
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      ref={containerRef}
      className={cx('relative flex items-center justify-center', className)}
      style={style}
      onDragOver={event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = event.dataTransfer.types.includes('application/x-card-index') ? 'move' : 'none';
      }}
      onDrop={handleDrop}
      onPointerDown={() => {
        if (!disabled) return;
        if (inTargetMode) return;
        onBlockedInteract?.();
      }}
      aria-disabled={disabled}
    >
      <div
        className="relative rounded-[18px] p-3.5 shadow-board-glow"
        style={
          boardPixels
            ? {
                width: boardPixels,
                height: boardPixels,
                background:
                  'linear-gradient(140deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 60%), ' +
                  'repeating-linear-gradient(90deg, rgba(146, 96, 49, 0.12) 0, rgba(146, 96, 49, 0.12) 8px, rgba(231, 198, 147, 0) 8px, rgba(231, 198, 147, 0) 20px), ' +
                  'repeating-linear-gradient(0deg, rgba(146, 96, 49, 0.08) 0, rgba(146, 96, 49, 0.08) 6px, rgba(231, 198, 147, 0) 6px, rgba(231, 198, 147, 0) 18px)',
                backgroundColor: '#e7c693',
                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.18), inset 0 18px 38px rgba(87, 56, 26, 0.32)'
              }
            : undefined
        }
      >
        <div
          className="relative grid aspect-square w-full overflow-hidden rounded-[14px] border border-white/20"
          style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}
        >
          {/* SVG 网格与星位（交叉点） */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 ${board.size} ${board.size}`}>
            <defs>
              <radialGradient id="star-dot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
              </radialGradient>
              <filter id="sshadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0.15" stdDeviation="0.25" floodColor="rgba(0,0,0,0.3)"/>
              </filter>
            </defs>
            {/* 网格线（更柔和） */}
            {gridPositions.map((p) => (
              <line key={`v-${p}`} x1={p} y1={0.5} x2={p} y2={board.size - 0.5} stroke="rgba(80,52,24,0.38)" strokeWidth={0.06} />
            ))}
            {gridPositions.map((p) => (
              <line key={`h-${p}`} x1={0.5} y1={p} x2={board.size - 0.5} y2={p} stroke="rgba(80,52,24,0.38)" strokeWidth={0.06} />
            ))}
            {/* 星位/天元（质感更柔和，位于网格层，棋子会盖住） */}
            {starPoints.map((pt, idx) => (
              <circle
                key={`s-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={0.16}
                fill="url(#star-dot)"
                stroke="rgba(0,0,0,0.28)"
                strokeWidth={0.04}
                filter="url(#sshadow)"
              />
            ))}
          </svg>
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
              const removed = removedCells.find(c => c.row === rowIdx && c.col === colIdx) || null;
              const isLast = Boolean(lastMove && lastMove.row === rowIdx && lastMove.col === colIdx);
              const isWinLit = winLineLit ? winLineLit.has(key) : false;
              const isHovered = Boolean(hoveredPosition && hoveredPosition.row === rowIdx && hoveredPosition.col === colIdx);
              const isSkillTarget = Boolean(skillTargetPosition && skillTargetPosition.row === rowIdx && skillTargetPosition.col === colIdx);

              // 检查此位置是否被封禁
              const sealedForPlayer = sealedCells.findIndex(
                cell => cell && cell.row === rowIdx && cell.col === colIdx && currentTurn < cell.expiresAtTurn
              );
              const isSealed = sealedForPlayer >= 0;
              const remainingTurns = isSealed && sealedCells[sealedForPlayer]
                ? sealedCells[sealedForPlayer]!.expiresAtTurn - currentTurn
                : 0;
              // 封禁是哪个玩家的：0=黑方，1=白方
              const sealedByPlayer = sealedForPlayer as Player;

              const cellStyle: React.CSSProperties = {
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), rgba(0,0,0,0) 70%)'
              };

              if (isWinLit) {
                cellStyle.boxShadow = 'inset 0 0 0 2px rgba(250,204,21,0.95), 0 0 24px rgba(250,204,21,0.55)';
              } else if (isLast) {
                cellStyle.boxShadow = 'inset 0 0 0 2px rgba(250,204,21,0.9), 0 0 20px rgba(250,204,21,0.4)';
              } else if (isSkillTarget) {
                cellStyle.boxShadow = 'inset 0 0 0 3px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.6)';
                cellStyle.background = 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.2), rgba(0,0,0,0) 70%)';
              } else if (isHovered) {
                cellStyle.boxShadow = 'inset 0 0 0 2px rgba(168,85,247,0.8), 0 0 16px rgba(168,85,247,0.4)';
                cellStyle.background = 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.15), rgba(0,0,0,0) 70%)';
              }
              if (highlight === 'target') {
                cellStyle.boxShadow = 'inset 0 0 0 2px rgba(56,189,248,0.9), 0 0 18px rgba(56,189,248,0.5)';
              }
              if (highlight === 'origin') {
                cellStyle.boxShadow = 'inset 0 0 0 2px rgba(244,63,94,0.85), 0 0 18px rgba(244,63,94,0.45)';
              }

              return (
                <button
                  key={key}
                  type="button"
                  className={cx(
                    'relative z-10 w-full border-0 bg-transparent transition-all duration-150 ease-out',
                    !value && !highlight && 'hover:scale-[1.02] hover:bg-white/10'
                  )}
                  style={cellStyle}
                  onClick={() => handleClick(rowIdx, colIdx)}
                  disabled={Boolean(value) && !highlight}
                  onDragOver={event => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = event.dataTransfer.types.includes('application/x-card-index') ? 'move' : 'none';
                  }}
                  onDrop={handleDrop}
                >
                  {/* 被移除棋子的飞出动画 */}
                  {removed && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
                      <div
                        className={cx('rounded-full', removed.owner === PlayerEnum.BLACK ? 'bg-slate-800' : 'bg-amber-200')}
                        style={{
                          width: '64%',
                          height: '64%',
                          boxShadow: removed.owner === PlayerEnum.BLACK
                            ? 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 14px 20px rgba(0,0,0,0.65)'
                            : 'inset 0 0 0 1px rgba(0,0,0,0.12), 0 10px 16px rgba(0,0,0,0.35)',
                          animation: 'cell-flyout 0.9s ease-out forwards'
                        }}
                      />
                    </div>
                  )}
                  {isLast && (
                    <div
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      style={{ zIndex: 0 }}
                    >
                      <div className="w-[76%] h-[76%] rounded-full border border-amber-200/30 animate-stone-ripple" />
                    </div>
                  )}
                  {value === PlayerEnum.BLACK && (
                    <div
                      className={cx('absolute inset-[12%] rounded-full', isLast && 'animate-stone-pop')}
                      style={{
                        // 先铺一层不透明底色，再叠加高光渐变，避免网格透出
                        background:
                          'radial-gradient(circle at 30% 25%, rgba(209,213,219,0.20), rgba(17,17,17,1)), #111111',
                        // 内描边 + 外投影（收紧）
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 6px 10px rgba(0,0,0,0.45)'
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), rgba(255,255,255,0) 60%)' }}
                      />
                    </div>
                  )}
                  {value === PlayerEnum.WHITE && (
                    <div
                      className={cx('absolute inset-[12%] rounded-full', isLast && 'animate-stone-pop')}
                      style={{
                        background:
                          'radial-gradient(circle at 30% 25%, #ffffff, #e5e7eb), #ffffff',
                        // 内描边 + 外投影（收紧）
                        boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.35), 0 6px 10px rgba(148,163,184,0.35)'
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)' }}
                      />
                    </div>
                  )}
                  {isSealed && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="relative w-[70%] h-[70%] rounded-full flex items-center justify-center"
                        style={{
                          background: 'radial-gradient(circle at 50% 50%, rgba(251, 146, 60, 0.3), rgba(251, 146, 60, 0.1) 70%)',
                          boxShadow: 'inset 0 0 0 2px rgba(251, 146, 60, 0.8), 0 0 12px rgba(251, 146, 60, 0.5)'
                        }}
                      >
                        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="rgba(251, 146, 60, 0.95)" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>

                        {/* 玩家标识：小棋子 */}
                        <div
                          className="absolute -top-2 -left-2 w-4 h-4 rounded-full border-1"
                          style={{
                            background: sealedByPlayer === PlayerEnum.BLACK
                              ? 'radial-gradient(circle at 30% 25%, rgba(209, 213, 219, 0.35), rgba(17, 17, 17, 1))'
                              : 'radial-gradient(circle at 30% 25%, rgba(255,255,255,1), rgba(209,213,219,0.5))',
                            borderColor: sealedByPlayer === PlayerEnum.BLACK ? 'rgba(255,255,255,0.2)' : 'rgba(148,163,184,0.4)',
                            boxShadow: sealedByPlayer === PlayerEnum.BLACK
                              ? 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.5)'
                              : 'inset 0 0 0 1px rgba(148,163,184,0.4), 0 2px 4px rgba(148,163,184,0.3)'
                          }}
                        />

                        <div
                          className="absolute -bottom-1 right-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold"
                          style={{
                            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.95), rgba(234, 88, 12, 0.95))',
                            color: '#fff',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}
                        >
                          {remainingTurns}
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div
          className="pointer-events-none absolute left-[8%] right-[8%] top-[10%] h-6 rounded-full blur-[12px] opacity-40"
          style={{
            background: 'linear-gradient(90deg, rgba(251,191,36,0.35), rgba(255,255,255,0), rgba(59,130,246,0.35))'
          }}
        />
        <div
          className="pointer-events-none absolute left-[8%] right-[8%] bottom-[8%] h-6 rounded-full blur-[12px] opacity-40"
          style={{
            background: 'linear-gradient(90deg, rgba(236,72,153,0.35), rgba(255,255,255,0), rgba(34,197,94,0.35))'
          }}
        />
      </div>
    </div>
  );
};
