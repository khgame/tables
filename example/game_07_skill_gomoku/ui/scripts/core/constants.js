export const BOARD_SIZE = 15;
export const INITIAL_HAND_SIZE = 1;
export const DRAW_INTERVAL = 3;
export const SKILL_UNLOCK_MOVE = 6;
export const MULLIGAN_WINDOW_MS = 15000;
export const COUNTER_WINDOW_MS = 12000;

export const Player = {
  BLACK: 0,
  WHITE: 1
};

export const PLAYER_NAMES = {
  [Player.BLACK]: '黑方',
  [Player.WHITE]: '白方'
};

export const AI_PLAYER = Player.WHITE;

export function getOpponent(player) {
  return player === Player.BLACK ? Player.WHITE : Player.BLACK;
}

export const GamePhase = {
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

export const PlayerColor = {
  [Player.BLACK]: 'bg-gradient-to-br from-slate-900 to-black',
  [Player.WHITE]: 'bg-gradient-to-br from-slate-100 to-white'
};
