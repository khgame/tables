export type KHTableID = string & { readonly __KHTableID: unique symbol }; 
export const TABLE_CONTEXT_VERSION = 0; 
/** These codes are auto generated :context.enums.CardType */
export enum CardType {
    Attack = "attack",
    Counter = "counter",
    Support = "support",
}

/** These codes are auto generated :context.enums.CardSubtype */
export enum CardSubtype {
    Standard = "standard",
    Fusion = "fusion",
    Legendary = "legendary",
    Reactive = "reactive",
    Support = "support",
}

/** These codes are auto generated :context.enums.CardTiming */
export enum CardTiming {
    PreMove = "pre-move",
    Reaction = "reaction",
    Anytime = "anytime",
}

/** These codes are auto generated :context.enums.CardRarity */
export enum CardRarity {
    Common = "common",
    Rare = "rare",
    Legendary = "legendary",
}

/** These codes are auto generated :context.enums.CardEffect */
export enum CardEffect {
    RemoveToShichahai = "remove-to-shichahai",
    FreezeOpponent = "freeze-opponent",
    InstantWin = "instant-win",
    CleanSweep = "clean-sweep",
    TimeRewind = "time-rewind",
    SkipNextTurn = "skip-next-turn",
    CounterRetrieve = "counter-retrieve",
    CounterPreventRemoval = "counter-prevent-removal",
    CounterThaw = "counter-thaw",
    CounterReverseWin = "counter-reverse-win",
    CounterRestoreBoard = "counter-restore-board",
    CounterCancelFusion = "counter-cancel-fusion",
    CounterPunish = "counter-punish",
    SummonCharacter = "summon-character",
    ForceExit = "force-exit",
}

/** These codes are auto generated :context.enums.RoleType */
export enum RoleType {
    Character = "character",
    Location = "location",
}

/** These codes are auto generated :context.enums.CardSpeed */
export enum CardSpeed {
    Normal = "normal",
    Instant = "instant",
}

/** These codes are auto generated :context.enums.Tag */
export enum Tag {
    Removal = "removal",
    Shichahai = "shichahai",
    Freeze = "freeze",
    DirectWin = "direct-win",
    Fusion = "fusion",
    Legendary = "legendary",
    Random = "random",
    SkipTurn = "skip-turn",
    Reset = "reset",
    Rewind = "rewind",
    Counter = "counter",
    Recovery = "recovery",
    Prevention = "prevention",
    AntiFusion = "anti-fusion",
    Punish = "punish",
    Summon = "summon",
    Reflect = "reflect",
    Unseizeable = "unseizeable",
    Support = "support",
}


