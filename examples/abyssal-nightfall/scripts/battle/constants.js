export const SCALE = 16;
export const PLAYER_RADIUS = 16;
export const DEFAULT_ENEMY_RADIUS = 18;
export const BULLET_RADIUS = 4;
export const ENEMY_BULLET_RADIUS = 6;
export const ARENA_PADDING = 48;
export const TARGET_DURATION = 180;
export const HEART_UNIT = 20;
export const DROP_ATTRACTION_RADIUS = 120;
export const DROP_COLLECT_RADIUS = 26;
export const DEFAULT_PROJECTILE_SCALE = 0.6;
export const DEFAULT_IMPACT_SCALE = 1.0;
export const DEFAULT_PLAYER_SPRITE_SCALE = 0.9;
export const ARENA_BACKGROUND = 'ui/assets/topdown/top-down-shooter/background/tileset.png';
export const LOOT_DEFINITIONS = {
    'loot:ichor_minor': {
        type: 'sanity',
        amountRange: [18, 26],
        sprite: 'ui/assets/topdown/top-down-shooter/item/medikit.png',
        sfx: 'ui/assets/topdown/top-down-shooter/sounds/cure.wav',
        chance: 0.75
    },
    'loot:choir_cache': {
        type: 'xp',
        amountRange: [48, 72],
        sprite: 'ui/assets/topdown/top-down-shooter/item/grenade.png',
        sfx: 'ui/assets/topdown/top-down-shooter/sounds/shoot-destroy.wav',
        chance: 0.7
    },
    'loot:howler_pouch': {
        type: 'hp',
        amountRange: [28, 36],
        sprite: 'ui/assets/topdown/top-down-shooter/item/medikit.png',
        sfx: 'ui/assets/topdown/top-down-shooter/sounds/cure.wav',
        chance: 0.6
    },
    'loot:sentinel_cache': {
        type: 'shield',
        amountRange: [40, 70],
        sprite: 'ui/assets/topdown/top-down-shooter/item/grenade-pack.png',
        sfx: 'ui/assets/topdown/top-down-shooter/sounds/window-hit-2.wav',
        chance: 0.55
    },
    'loot:dredger_core': {
        type: 'relic_charge',
        amount: 1,
        sprite: 'ui/assets/fx/relics/maelstrom.png',
        sfx: 'ui/assets/sfx/relics/maelstrom.wav',
        chance: 0.5
    },
    'loot:fragment_cache': {
        type: 'ammo',
        amountRange: [0.45, 0.7],
        sprite: 'ui/assets/topdown/top-down-shooter/item/ammo-pack.png',
        sfx: 'ui/assets/topdown/top-down-shooter/sounds/no-ammo.wav',
        chance: 0.65
    }
};
