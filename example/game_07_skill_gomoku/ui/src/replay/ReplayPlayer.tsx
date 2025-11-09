import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BoardSnapshot, GameStatus, Player, VisualEffectEvent } from '../types';
import { Board, SkillEffectLayer } from '../components';

export interface ReplayPlayerProps {
  frames?: BoardSnapshot[];
  // 结构化事件：p=place, v=visual
  events?: Array<{ t: 'p'; r: number; c: number; pl: Player; at?: number } | { t: 'v'; ev: Partial<VisualEffectEvent>; at?: number }>;
  players?: { me?: string; opp?: string; ai?: 'cloud' | 'local' };
  speedMs?: number;
  onExit?: () => void;
}

// 适配 Board 组件所需的最小 board 接口（size/history/forEachCell）
class BoardAdapter {
  size: number;
  grid: (Player | null)[][];
  history: Array<{ row: number; col: number; player: Player }>;
  constructor(snapshot: BoardSnapshot) {
    this.size = snapshot.size;
    this.grid = snapshot.grid.map(row => row.slice());
    this.history = (snapshot as any).history ? (snapshot as any).history.slice() : [];
  }
  get(row: number, col: number): Player | null {
    if (row < 0 || col < 0 || row >= this.size || col >= this.size) return null;
    return this.grid[row][col] as Player | null;
  }
  forEachCell(cb: (row: number, col: number, value: Player | null) => void) {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        cb(r, c, this.grid[r][c]);
      }
    }
  }
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ frames, events, players, speedMs = 900, onExit }) => {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);
  const [visuals, setVisuals] = useState<VisualEffectEvent[]>([]);
  const visualsWindowRef = useRef<number | null>(null);

  const hasFrames = Array.isArray(frames) && frames.length > 0;
  const hasEvents = Array.isArray(events) && events.length > 0;
  const max = hasFrames ? Math.max(0, frames!.length - 1) : Math.max(0, (events?.length ?? 1) - 1);

  const board = useMemo(() => {
    if (hasFrames) return new BoardAdapter(frames![Math.min(idx, max)]);
    // 事件驱动：重放到当前 idx 的棋盘
    // 假设 15x15 棋盘（与游戏一致），也可以由首帧/事件提供 size
    const size = 15;
    const empty: BoardSnapshot = { size, grid: Array.from({ length: size }, () => Array.from({ length: size }, () => null as Player | null)), history: [] };
    const b = new BoardAdapter(empty);
    (events ?? []).slice(0, idx + 1).forEach(ev => {
      if ((ev as any).t === 'p') {
        const p = ev as any;
        (b.grid[p.r][p.c] as any) = p.pl;
        b.history.push({ row: p.r, col: p.c, player: p.pl });
      }
    });
    return b;
  }, [frames, idx, max, hasFrames, events, hasEvents]);

  // 手牌数重建：依赖事件（draw: t='d'; play: t='play'）
  const handCounts = useMemo(() => {
    let b = 0, w = 0;
    if (Array.isArray(events)) {
      for (let i = 0; i <= idx && i < events.length; i++) {
        const e: any = events[i];
        if (e.t === 'd') { if (e.pl === 0) b++; else w++; }
        if (e.t === 'play') { if (e.pl === 0) b = Math.max(0, b - 1); else w = Math.max(0, w - 1); }
      }
    }
    return [b, w] as [number, number];
  }, [events, idx]);

  // 推进计时
  useEffect(() => {
    if (!playing) return;
    if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    timerRef.current = window.setTimeout(() => setIdx(i => Math.min(i + 1, max)), speedMs) as unknown as number;
    return () => { if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null; } };
  }, [idx, playing, speedMs, max]);

  useEffect(() => { if (idx >= max) setPlaying(false); }, [idx, max]);

  // 事件驱动的技能可视化
  useEffect(() => {
    if (!hasEvents) return;
    const ev = events![idx];
    if (!ev) return;
    if ((ev as any).t === 'v') {
      const v = (ev as any).ev || {};
      const full: VisualEffectEvent = {
        id: `rv-${idx}-${Date.now()}`,
        cardName: v.cardName || '技能',
        player: (v.player as any) ?? 0,
        effectId: v.effectId as any,
        cardTid: v.cardTid,
        cardQuote: v.cardQuote,
        role: (v.role as any) ?? 'normal',
        cell: v.cell as any,
        owner: v.owner as any,
        createdAt: Date.now()
      } as any;
      setVisuals(prev => [...prev, full].slice(-10));
      if (visualsWindowRef.current !== null) window.clearTimeout(visualsWindowRef.current);
      visualsWindowRef.current = window.setTimeout(() => setVisuals(prev => prev.slice(1)), 2200) as unknown as number;
    }
  }, [idx, hasEvents, events]);

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/95 text-white flex items-center justify-center p-4">
      <div className="absolute top-3 left-3 text-xs text-slate-300">回放 {idx + 1}/{max + 1}</div>
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button onClick={() => onExit?.()} className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 border border-white/10">退出</button>
      </div>
      <div className="w-[min(66vh,68vw)] aspect-square relative">
        <Board
          board={board as unknown as GameStatus['board']}
          onCellClick={() => {}}
          disabled={true}
          targetRequest={null}
          onTargetSelect={() => {}}
          className="w-full h-full"
          style={{ aspectRatio: '1 / 1' }}
        />
        {hasEvents && visuals.length > 0 && (
          <SkillEffectLayer
            events={visuals}
            playerNames={{ 0: (players?.me || '黑方') as any, 1: '启发者' as any }}
          />
        )}
        {/* 顶部：白方（启发者）手牌计数 + AI 来源 */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
          <div className="px-2 py-1 rounded bg-slate-900/70 text-white text-xs font-bold border border-white/10">
            启发者（{players?.ai === 'cloud' ? '大模型' : '本地AI'}） 手牌 {handCounts[1]}
          </div>
        </div>
        {/* 底部：黑方（玩家）手牌计数 + 名字（若有） */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none">
          <div className="px-2 py-1 rounded bg-slate-900/70 text-white text-xs font-bold border border-white/10">
            {(players?.me || '黑方')} 手牌 {handCounts[0]}
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 flex items-center gap-3">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 border border-white/10">上一步</button>
        <button onClick={() => setPlaying(p => !p)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 border border-white/10">{playing ? '暂停' : '播放'}</button>
        <button onClick={() => setIdx(i => Math.min(max, i + 1))} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 border border-white/10">下一步</button>
      </div>
    </div>
  );
};

export default ReplayPlayer;
