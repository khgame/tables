export type KHTableID = string & { readonly __KHTableID: unique symbol }; 
export const TABLE_CONTEXT_VERSION = 0; 
/** These codes are auto generated :context.enums.ActionKey */
export enum ActionKey {
    StokeFire = 40000001,
    GatherWood = 40000002,
    CheckTraps = 40000003,
    PrepareRations = 40000004,
    CraftCharcoal = 40000005,
    CraftSteel = 40000006,
    TradeWithCaravan = 40000007,
}

/** These codes are auto generated :context.enums.EventKey */
export enum EventKey {
    StrangerFire = 50000001,
    SettlerArrives = 50000002,
    EmbersFading = 50000003,
    CaravanReturns = 50000004,
    WolvesCircle = 50000005,
}

/** These codes are auto generated :context.enums.JobKey */
export enum JobKey {
    Gatherer = 20000001,
    Trapper = 20000002,
    Hunter = 20000003,
    CharcoalBurner = 20000004,
    Tanner = 20000005,
    Smelter = 20000006,
}

/** These codes are auto generated :context.enums.BuildingKey */
export enum BuildingKey {
    Hut = 30000001,
    Trap = 30000002,
    Smokehouse = 30000003,
    Workshop = 30000004,
    Foundry = 30000005,
    Caravanserai = 30000006,
}


