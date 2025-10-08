import type { GamePhase, Player } from '../types';

export const BOARD_SIZE = 15;
export const INITIAL_HAND_SIZE = 1;
export const DRAW_INTERVAL = 3;
export const SKILL_UNLOCK_MOVE = 6;
export const MULLIGAN_WINDOW_MS = 15000;
export const COUNTER_WINDOW_MS = 12000;

export const PlayerEnum = {
  BLACK: 0 as Player,
  WHITE: 1 as Player
};

export const PLAYER_NAMES: Record<Player, string> = {
  [PlayerEnum.BLACK]: '黑方',
  [PlayerEnum.WHITE]: '白方'
};

export const GamePhaseEnum: Record<string, GamePhase> = {
  SETUP: 'setup',
  MULLIGAN: 'mulligan',
  PLAYING: 'playing',
  CARD_TARGETING: 'card_targeting',
  COUNTER_WINDOW: 'counter_window',
  GAME_OVER: 'game_over'
};

export const CardTiming = {
  PRE_MOVE: 'pre-move',
  REACTION: 'reaction',
  ANYTIME: 'anytime'
};

export const PlayerColorClasses: Record<Player, string> = {
  [PlayerEnum.BLACK]: 'bg-gradient-to-br from-slate-900 to-black',
  [PlayerEnum.WHITE]: 'bg-gradient-to-br from-amber-200 to-amber-100'
};

export const getOpponent = (player: Player): Player =>
  player === PlayerEnum.BLACK ? PlayerEnum.WHITE : PlayerEnum.BLACK;
