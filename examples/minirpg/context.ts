export type KHTableID = string & { readonly __KHTableID: unique symbol }; 
export const TABLE_CONTEXT_VERSION = 0; 
/** These codes are auto generated :context.enums.HeroClass */
export enum HeroClass {
    Knight = "knight",
    Mage = "mage",
    Rogue = "rogue",
    Assassin = "assassin",
}

/** These codes are auto generated :context.enums.HeroElement */
export enum HeroElement {
    Frost = "Frost",
    Arcane = "Arcane",
    Shadow = "Shadow",
    Lunar = "Lunar",
}

/** These codes are auto generated :context.enums.HeroRole */
export enum HeroRole {
    Vanguard = "Vanguard",
    Burst = "Burst",
    Assassin = "Assassin",
    Skirmisher = "Skirmisher",
}

/** These codes are auto generated :context.enums.StageEnvironment */
export enum StageEnvironment {
    Tundra = "Tundra",
    Volcano = "Volcano",
    Marsh = "Marsh",
    NightCity = "NightCity",
}

/** These codes are auto generated :context.enums.StageSubtype */
export enum StageSubtype {
    Main = "Main",
    Elite = "Elite",
}

/** These codes are auto generated :context.enums.SkillTarget */
export enum SkillTarget {
    Enemy = "Enemy",
    AllyTeam = "AllyTeam",
    Self = "Self",
    EnemyAll = "EnemyAll",
    Boss = "Boss",
}

/** These codes are auto generated :context.enums.RewardCurrency */
export enum RewardCurrency {
    Gold = "gold",
    Guild = "guild",
    Honor = "honor",
}

/** These codes are auto generated :context.enums.ItemSlot */
export enum ItemSlot {
    Weapon = "weapon",
    Armor = "armor",
    Consumable = "consumable",
    Trinket = "trinket",
    Accessory = "accessory",
}

/** These codes are auto generated :context.enums.GlobalValueType */
export enum GlobalValueType {
    String = "String",
    Bool = "Bool",
    UInt = "UInt",
    Currency = "Currency",
    StageId = "StageId",
}

/** These codes are auto generated :context.enums.RelicEffectType */
export enum RelicEffectType {
    AttackMultiplier = "attackMultiplier",
    DefenseMultiplier = "defenseMultiplier",
    EnemyDefenseReduction = "enemyDefenseReduction",
    ExpBonus = "expBonus",
    EnvironmentBonusTundra = "environmentBonus:Tundra",
    ElementBonusLunar = "elementBonus:Lunar",
}


