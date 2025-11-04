export type KHTableID = string & { readonly __KHTableID: unique symbol }; 
export const TABLE_CONTEXT_VERSION = 0; 
/** These codes are auto generated :context.enums.WeaponCategory */
export enum WeaponCategory {
    SIDEARM = "sidearm",
    RIFLE = "rifle",
    SHOTGUN = "shotgun",
    ARCANE = "arcane",
    LAUNCHER = "launcher",
}

/** These codes are auto generated :context.enums.AttackStyle */
export enum AttackStyle {
    MANUAL = "manual",
    CHANNEL = "channel",
    BEAM = "beam",
    BURST = "burst",
    AUTO = "auto",
}

/** These codes are auto generated :context.enums.DamageType */
export enum DamageType {
    KINETIC = "kinetic",
    VOID = "void",
    FROST = "frost",
    FIRE = "fire",
    LIGHT = "light",
}

/** These codes are auto generated :context.enums.EnemyFamily */
export enum EnemyFamily {
    SHAMBLER = "shambler",
    CULTIST = "cultist",
    ABERRATION = "aberration",
    CONSTRUCT = "construct",
    AVATAR = "avatar",
}

/** These codes are auto generated :context.enums.ArenaBiome */
export enum ArenaBiome {
    HARBOR = "harbor",
    MARKET = "market",
    GRAVEYARD = "graveyard",
    LIGHTHOUSE = "lighthouse",
}


