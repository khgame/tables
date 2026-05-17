import type { GameStatus } from '../../types';

export type ShareReplayPayload = {
  v: 1;
  winner: number | null;
  turnCount: number;
  timeline: GameStatus['timeline'];
  shichahai: GameStatus['shichahai'];
  players?: { me?: string; opp?: string; ai?: 'cloud' | 'local' };
  createdAt: number;
};

const encodeUtf8Base64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const decodeUtf8Base64 = (value: string): string => {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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
  return encodeUtf8Base64(json);
};

export const decodeReplay = (raw: string): ShareReplayPayload | null => {
  try {
    const json = decodeUtf8Base64(raw);
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
