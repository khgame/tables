export type KHTableID = string & { readonly __KHTableID: unique symbol }; 
export const TABLE_CONTEXT_VERSION = 0; 
/** These codes are auto generated :context.enums.UpgradeType */
export enum UpgradeType {
    Multiplier = "multiplier",
    Additive = "additive",
}

/** These codes are auto generated :context.enums.AchievementType */
export enum AchievementType {
    TotalCookies = "totalCookies",
    BuildingCountCursor = "buildingCount:60000001",
    BuildingCountGrandma = "buildingCount:60000002",
    BuildingCountFarm = "buildingCount:60000003",
    BuildingCountMine = "buildingCount:60000004",
    BuildingCountFactory = "buildingCount:60000005",
    BuildingCountBank = "buildingCount:60000006",
    BuildingCountTemple = "buildingCount:60000007",
    BuildingCountWizardTower = "buildingCount:60000008",
    BuildingCountShipment = "buildingCount:60000009",
    BuildingCountPortal = "buildingCount:60000010",
    BuildingCountTimeMachine = "buildingCount:60000011",
    BuildingCountAntimatter = "buildingCount:60000012",
}

/** These codes are auto generated :context.enums.ArtifactEffectType */
export enum ArtifactEffectType {
    GlobalMultiplier = "globalMultiplier",
    ClickMultiplier = "clickMultiplier",
    OfflineMultiplier = "offlineMultiplier",
    CostReduction = "costReduction",
    PrestigeBonus = "prestigeBonus",
}


