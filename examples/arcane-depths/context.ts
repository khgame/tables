export type KHTableID = string & { readonly __KHTableID: unique symbol }; 
export const TABLE_CONTEXT_VERSION = 0; 
/** These codes are auto generated :context.enums.ResourceType */
export enum ResourceType {
    Arcane = "arcane",
    Crystal = "crystal",
    Provision = "provision",
}

/** These codes are auto generated :context.enums.RoomType */
export enum RoomType {
    Combat = "Combat",
    Elite = "Elite",
    Event = "Event",
    Merchant = "Merchant",
    Rest = "Rest",
    Boss = "Boss",
}

/** These codes are auto generated :context.enums.SkillTag */
export enum SkillTag {
    Melee = "Melee",
    Ranged = "Ranged",
    Spell = "Spell",
    Support = "Support",
    Control = "Control",
}

/** These codes are auto generated :context.enums.HeroClass */
export enum HeroClass {
    Vanguard = "Vanguard",
    Mystic = "Mystic",
    Gunner = "Gunner",
    Warden = "Warden",
}

/** These codes are auto generated :context.enums.HeroRole */
export enum HeroRole {
    Tank = "Tank",
    Burst = "Burst",
    Support = "Support",
    Specialist = "Specialist",
}

/** These codes are auto generated :context.enums.TraitType */
export enum TraitType {
    Resolve = "Resolve",
    Resonance = "Resonance",
    Synergy = "Synergy",
    Instinct = "Instinct",
}

/** These codes are auto generated :context.enums.EnemyFamily */
export enum EnemyFamily {
    Aberrant = "Aberrant",
    Cultist = "Cultist",
    Construct = "Construct",
}

/** These codes are auto generated :context.enums.BehaviorCondition */
export enum BehaviorCondition {
    OnTurnStart = "OnTurnStart",
    OnAllyDown = "OnAllyDown",
    OnPlayerHeal = "OnPlayerHeal",
    HpBelow50 = "HpBelow50",
}

/** These codes are auto generated :context.enums.BehaviorAction */
export enum BehaviorAction {
    AttackFront = "AttackFront",
    AttackLowestHp = "AttackLowestHp",
    ApplyDebuff = "ApplyDebuff",
    SummonMinion = "SummonMinion",
}

/** These codes are auto generated :context.enums.RewardType */
export enum RewardType {
    Resource = "Resource",
    Relic = "Relic",
    Item = "Item",
    Trait = "Trait",
}

/** These codes are auto generated :context.enums.RequirementType */
export enum RequirementType {
    SkillTag = "SkillTag",
    Resource = "Resource",
    RelicOwned = "RelicOwned",
    HeroTrait = "HeroTrait",
}

/** These codes are auto generated :context.enums.PenaltyType */
export enum PenaltyType {
    Damage = "Damage",
    Debuff = "Debuff",
    LoseResource = "LoseResource",
    SpawnEnemy = "SpawnEnemy",
}

/** These codes are auto generated :context.enums.FacilityType */
export enum FacilityType {
    Camp = "Camp",
    Workshop = "Workshop",
    Library = "Library",
    Spire = "Spire",
}

/** These codes are auto generated :context.enums.EquipmentSlot */
export enum EquipmentSlot {
    Weapon = "Weapon",
    Armor = "Armor",
    Accessory = "Accessory",
}

/** These codes are auto generated :context.enums.SkillTarget */
export enum SkillTarget {
    Enemy = "Enemy",
    AllyTeam = "AllyTeam",
    Self = "Self",
    EnemyAll = "EnemyAll",
    Boss = "Boss",
}

/** These codes are auto generated :context.enums.DamageFormula */
export enum DamageFormula {
    Basic = "Basic",
    Burst = "Burst",
    Pierce = "Pierce",
    Aoe = "Aoe",
}


