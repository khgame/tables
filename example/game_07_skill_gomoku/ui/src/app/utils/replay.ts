import type { GameStatus } from '../../types';

export type ShareReplayPayload = {
  v: 1;
  winner: number | null;
  turnCount: number;
  timeline: GameStatus['timeline'];
  shichahai: GameStatus['shichahai'];
  players?: { me?: string; opp?: string };
  createdAt: number;
};

export const buildReplayPayload = (game: GameStatus, me?: string): ShareReplayPayload => ({
  v: 1,
  winner: game.winner ?? null,
  turnCount: game.turnCount,
  timeline: game.timeline,
  shichahai: game.shichahai,
  players: me ? { me } : undefined,
  createdAt: Date.now()
});

// 简单 base64 编码（不压缩）。如需缩短可换用 LZ-string。
export const encodeReplay = (payload: ShareReplayPayload): string => {
  const json = JSON.stringify(payload);
  const b64 = typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json, 'utf8').toString('base64');
  return b64;
};

export const decodeReplay = (raw: string): ShareReplayPayload | null => {
  try {
    const json = typeof window !== 'undefined'
      ? decodeURIComponent(escape(window.atob(raw)))
      : Buffer.from(raw, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;
    if (obj.v !== 1) return null;
    return obj as ShareReplayPayload;
  } catch {
    return null;
  }
};

export const findReplayParam = (): string | null => {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const q = url.searchParams.get('replay');
  if (q) return q;
  const hash = window.location.hash || '';
  if (hash.startsWith('#replay=')) return hash.slice('#replay='.length);
  const idx = hash.indexOf('replay=');
  if (idx >= 0) return hash.slice(idx + 'replay='.length);
  return null;
};
