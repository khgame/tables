// Raw SVG imports from game-icons.net
// License: CC BY 3.0 — attribution required to authors and game-icons.net
// See example/game_07_skill_gomoku/ASSETS.md for details.

// Use Vite raw loader to import file content as string
import sandstorm from './sandstorm.svg?raw';
import brainFreeze from './brain-freeze.svg?raw';
import crown from './crown.svg?raw';
import magicBroom from './magic-broom.svg?raw';
import baseballBat from './baseball-bat.svg?raw';
import backwardTime from './backward-time.svg?raw';
import distraction from './distraction.svg?raw';
import returnArrow from './return-arrow.svg?raw';
import grab from './grab.svg?raw';
// breaking-chain icon was not found — keep undefined to allow fallback
import timeTrap from './time-trap.svg?raw';
import lifeSupport from './life-support.svg?raw';
import megaphone from './megaphone.svg?raw';
import prayer from './prayer.svg?raw';
import magicPortal from './magic-portal.svg?raw';
import exitDoor from './exit-door.svg?raw';

export const GAME_ICON_BODIES = {
  'sandstorm': sandstorm,
  'brain-freeze': brainFreeze,
  'crown': crown,
  'magic-broom': magicBroom,
  'baseball-bat': baseballBat,
  'backward-time': backwardTime,
  'distraction': distraction,
  'return-arrow': returnArrow,
  'grab': grab,
  'breaking-chain': undefined as unknown as string, // fallback to built-in
  'time-trap': timeTrap,
  'life-support': lifeSupport,
  'megaphone': megaphone,
  'prayer': prayer,
  'magic-portal': magicPortal,
  'exit-door': exitDoor
} as const;

export type GameIconKey = keyof typeof GAME_ICON_BODIES;

