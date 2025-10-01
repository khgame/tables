# Neon Aberration — Product & Content Design

> Cyberpunk survival ARPG inspired by Ares Virus mechanics, reimagined with eldritch overtones for the tables demo suite.

## 1. Project Overview
- **Deliverable**: configurable data pack + reference demo (future) showcasing complex multi-table pipelines with `tables`.
- **Player Fantasy**: a bio-engineered fixer surviving in a quarantined megacity while unraveling cosmic contamination.
- **Tone & Style**: neon-drenched streets, corporate dystopia, eldritch anomalies; hard survival with tactical combat.
- **Platforms / Perspective**: top-down 2D action on PC/mobile; twin-stick controls.
- **Primary References**: Ares Virus (loop depth), Hyper Light Drifter (visual pacing), Control (anomaly flavor).

## 2. Core Pillars
1. **Harsh Survival Loop** — scarcity of ammunition, meds, and clean food; attrition drives risk/reward choices.
2. **Configurable Crafting & Loadouts** — extensive weapon mods, synth implants, and consumables shaped by data tables.
3. **Dynamic Operations** — generated missions reacting to contamination level, faction dispositions, and lunar cycles.
4. **Anomaly Pressure** — Eldritch exposure alters enemies, environment, and the player, encouraging adaptive builds.

## 3. Macro / Mid / Micro Loops
- **Macro (Cycle = 1 day)**: Return to Haven Spire (base) → craft / research / briefings → choose operation → resolve consequences → increase city contamination, unlock narrative arcs.
- **Mid (Mission Instance)**: Infiltrate sector → fulfill objective → scavenge rare resources → exfiltrate or push deeper for optional rewards.
- **Micro (Encounter)**: Manage stamina, position, and exposure; balance melee vs. firearms vs. psionic gear; leverage gadgets to control enemy waves.

## 4. Player Stats & Progression
- **Primary Attributes**: Vitality (HP), Stamina (dash & melee), Focus (psionic skills), Exposure (eldritch corruption), Morale (mental stability).
- **Secondary Gauges**: Hunger, Hydration, Body Temperature (affects stamina regen), Noise Signature (stealth), Reputation (per faction).
- **Progression Tracks**:
  - **Operator Ranks**: unlocks gear tiers, mission types.
  - **Implant Grid**: 3x3 node matrix fed by Research data; mix of passive boosts and triggered abilities.
  - **Codex Discoveries**: narrative unlocks gating special operations & anomalies.

## 5. Systems Blueprint
### 5.1 Combat & Enemy Design
- **Weapon Archetypes**: sidearms, SMGs, shotguns, rifles, melee blades, heavy ordnance, psionic conduits.
- **Mod Slots**: barrel, mag, core chipset, catalyst (psionic). Each mod modifies stats, elemental damage, or afflictions.
- **Damage Types**: kinetic, thermal, chemical, voltaic, void. Enemies have resistances/weaknesses.
- **Enemy Families**:
  - *Gangers*: human factions with firearms, light armor, AI patterns (flankers, grenadiers, snipers).
  - *Sentinel Constructs*: corporate drones/turrets with shield phases.
  - *Aberrants*: mutated creatures with exposure attacks (bleed, spore, mindbreak).
  - *Eldritch Avatars*: boss-tier anomalies; multi-phase scripts, battlefield hazards.
- **Status Effects**: bleed, burn, shock, neurofog, void corruption, armor fracture.
- **Encounter Scripts**: wave triggers, hazard spawns, reinforcement timers defined via data tables.

### 5.2 Survival & Exposure
- **Daily Consumption**: hunger/hydration tick while on missions; failure adds stacking debuffs.
- **Exposure Thresholds**: 0–100 scale; thresholds at 25/50/75 trigger mutation choices or negative events; can be purged at base.
- **Weather & Time**: acid rain, static storms, blood moon anomalies; modify detection radius, exposure gain, loot tables.

### 5.3 Crafting & Economy
- **Resource Types**:
  - *Scrap Components* (metallic, polymer, circuit), *Bio Samples* (organic, spore, ichor), *Energy Cells*, *Credits*, *Favor Tokens* (faction-specific).
- **Workbench Fabrication**: craft weapons/mods/armors; each recipe has blueprint unlock requirements and crafting costs.
- **Chem Lab**: synth stimulants, medkits, anti-exposure serums; supports batch crafting with success variance.
- **Black Market Trading**: barter using Favor Tokens; dynamic pricing influenced by contamination & reputation.

### 5.4 Base Management (Haven Spire)
- **Facilities**: Command Deck, Workshop, Chem Lab, Archive, Dormitory, Observation Deck.
- **Facility Levels**: 1–5; each level unlocks new recipes, storage, or research slots.
- **NPC Staff**: data-driven roster with roles (Quartermaster, Researcher, Scout) and loyalty quests.
- **Daily Routines**: assign NPCs to tasks (scavenging, research, defense) to generate time-based yields.

### 5.5 Mission Structure
- **Mission Types**: Recon, Supply Run, Purge, Escort, Data Heist, Boss Hunt, Anomaly Seal.
- **Objective Blocks**: retrieve item, destroy asset, hack terminal, protect agent, survive waves.
- **Map Tiles**: urban blocks, sewers, labs, docks, dimensional rifts; each tile references hazard sets & loot tables.
- **Branching Outcomes**: success/failure modifies faction reputation, contamination, unlock follow-ups.

### 5.6 Research & Implants
- **Research Projects**: tree of techs requiring resources + intel; unlocks recipes, implants, codex entries.
- **Implant Grid**: nodes slot chips providing passive buffs; chips categorized (Combat, Survival, Psionic, Utility); each has rarity tiers.

### 5.7 Narrative & Events
- **Acts / Chapters**: 4 acts culminating in Eldritch Nexus raid.
- **Event Deck**: random events triggered by contamination level + day (e.g., cultist uprising, corporate crackdown, anomaly surge).
- **Dialogue System**: branching conversations with key NPCs; choices affect loyalty, unlock gear, or trigger events.

## 6. Data Architecture (tables)
| Sheet | Purpose | Key Columns (Mark tokens) | Notes |
|-------|---------|---------------------------|-------|
| `operators.xlsx` | Player archetypes & growth curves | `@id`, `name<string>`, `baseStats{}`, `unlockRank<uint>`, `traits[]` | Traits stored as nested arrays with `$strict`. |
| `weapons.xlsx` | Weapon catalog | `@class`, `@model`, `tier<uint>`, `archetype<enum>`, `damage{}`, `mods[]`, `sway<float>`, `durability<uint>`, `afflictions[]` | `damage{}` uses nested object with damage types. |
| `weapon_mods.xlsx` | Mod blueprints | `@id`, `slot<enum>`, `rarity<enum>`, `statChanges{}`, `requirements{}` | Requirements reference research IDs. |
| `armor_implants.xlsx` | Armor sets + implant chips | `@id`, `type<enum>`, `slots<uint>`, `effects[]`, `exposureResist<float>` | Effects array holds key/value pairs. |
| `consumables.xlsx` | Meds, serums, buffs | `@id`, `category<enum>`, `craftCost{}`, `effects[]`, `cooldown<uint>` | Effects support duration/intensity fields. |
| `resources.xlsx` | Loot itemization | `@id`, `rarity<enum>`, `stack<uint>`, `sources[]`, `value<uint>` | Sources map to mission tiles/enemies. |
| `enemies.xlsx` | Enemy archetypes | `@species`, `@variant`, `family<enum>`, `stats{}`, `aiProfile<enum>`, `lootTable<ref>`, `abilities[]`, `afflictionVuln{}` | `abilities[]` references `enemy_abilities.xlsx`. |
| `enemy_abilities.xlsx` | Skills & behaviors | `@id`, `trigger<enum>`, `effects[]`, `cooldown<uint>`, `visualFx<string>` | Effects can spawn hazards or apply statuses. |
| `missions.xlsx` | Mission templates | `@type`, `@code`, `sector<enum>`, `minRank<uint>`, `objectives[]`, `failState{}`, `rewards{}` | Objectives array references `objectives.xlsx`. |
| `objectives.xlsx` | Objective blocks | `@id`, `kind<enum>`, `params{}`, `success{}`, `failure{}` | Encapsulates modular pieces reused across missions. |
| `map_tiles.xlsx` | Procedural map chunks | `@tile`, `biome<enum>`, `size<uint>`, `hazards[]`, `spawnTables[]`, `exitRules{}` | Ties into mission generation. |
| `events.xlsx` | Dynamic events & consequences | `@id`, `trigger{}`, `choices[]`, `effects[]`, `cooldowns<uint>` | Branching outcomes and gating conditions. |
| `factions.xlsx` | Faction metadata | `@id`, `name<string>`, `alignment<enum>`, `rewards[]`, `reputationRanges[]`, `narrativeHooks[]` | Reputation thresholds unlock gear/events. |
| `research.xlsx` | Tech tree | `@branch`, `@node`, `cost{}`, `prereq[]`, `unlocks[]`, `researchTime<uint>` | Distinguish Combat/Bio/Psionic branches. |
| `facility_upgrades.xlsx` | Base building | `@facility`, `@level`, `requirements{}`, `benefits[]`, `maintenance{}` | Maintenance ties to daily resource drain. |
| `npc_roster.xlsx` | Base NPCs | `@npc`, `role<enum>`, `loyalty<uint>`, `missions[]`, `bonus{}` | Loyalty progression unlocks modifications. |
| `exposure_events.xlsx` | Threshold anomalies | `@stage`, `options[]`, `mutations[]`, `penalties[]` | Drives corruption choices. |
| `loot_tables.xlsx` | Drop pools | `@table`, `entries[]`, `conditions{}` | Entries specify resource ID + weight. |

**Schema Conventions**
- Use `@` columns to compose TIDs (sector + category + serial) consistent with tables plugins.
- `enum` references resolved via `context.enums.json` (see Section 8).
- Nested structures rely on `$strict` for ordered arrays, `$ghost` for optional nodes.

## 7. Resource & Economy Flow
1. **Mission Rewards** → Credits, Scrap, Bio Samples, Reputation.
2. **Credits** spent at vendors; **Scrap/Bio** converted into gear via crafting.
3. Crafted gear boosts mission efficiency, enabling higher-tier operations with better loot.
4. Exposure accrues during missions; purged at base using consumables, costing Bio Samples.
5. Facility upgrades open new crafting tiers and generate passive yields.
6. Reputation unlocks faction-exclusive blueprints and narrative operations.

## 8. Context Enumerations (`context.enums.json`)
- `WeaponClass`, `WeaponArchetype`, `ModSlot`, `DamageType`, `StatusEffect`.
- `EnemyFamily`, `AIProfile`, `SpawnBehavior`.
- `MissionType`, `ObjectiveKind`, `Sector`, `TileBiome`.
- `ResourceType`, `RarityTier`, `CurrencyType`.
- `FacilityType`, `ResearchBranch`, `ImplantCategory`.
- `EventTrigger`, `ExposureStage`, `ChoiceOutcome`.
- `FactionId`, `ReputationTier`.

## 9. UI & UX Requirements
### 9.1 Base (Haven Spire)
- **Dashboard Screen**: contamination gauge, next event timer, news ticker. Data from `events.xlsx`, `factions.xlsx`.
- **Facility Tabs**: Each facility panel lists current level, upgrade requirements, queued tasks (bind to `facility_upgrades.xlsx`).
- **NPC Management**: roster grid showing loyalty, assigned task, morale; uses `npc_roster.xlsx`.

### 9.2 Loadout & Crafting
- **Loadout Builder**: weapon cards list stats, mod slots (`weapons.xlsx`, `weapon_mods.xlsx`); drag-and-drop implants (`armor_implants.xlsx`).
- **Crafting UI**: recipe list filtered by category, ingredient availability via `resources.xlsx`; show unlock requirements and preview stats.
- **Research Tree View**: hex-grid or node map with branching lines; nodes pulled from `research.xlsx` with status indicators.

### 9.3 Mission Selection & Briefing
- **City Map**: sectors color-coded by contamination; mission markers with type icons (`missions.xlsx`).
- **Briefing Popover**: objectives list with risk indicators, recommended gear, projected rewards.
- **Event Alerts**: overlay highlighting urgent anomalies from `events.xlsx`.

### 9.4 In-Mission HUD
- **Player Gauges**: HP, Stamina, Exposure, Morale; buff/debuff icons from `status` enums.
- **Objective Tracker**: dynamic list referencing current objective block (with timers).
- **Loot Feed**: log entries for resources gained (icons from `resources.xlsx`).
- **Enemy Info**: targeted enemy panel showing resistances and status effects.

### 9.5 Post-Mission Report
- **Summary Table**: damage dealt/received, consumables used, time taken.
- **Loot Breakdown**: per resource with rarity colors.
- **Outcome Hooks**: event triggers queued based on mission results.

## 10. Content Production Guidance
- **Excel Standards**: 2-row header (mark row with `@`, descriptor row with text). Keep descriptions under 80 chars.
- **ID Composition**: use 2-digit sector + 2-digit category + 4-digit serial (e.g., `12070031`).
- **Balancing Curves**: maintain Ares Virus style lethal TTK (player ~3 hits unarmored); escalate enemy HP/DMG by 12% per tier.
- **Loot Economy**: average mission yields enough materials for one weapon mod or three consumables.
- **Exposure Management**: ensure average mission adds ~30 exposure; forcing players to rotate serums.

## 11. Future Demo Scope (Optional)
- Minimal React + Canvas combat sandbox reading JSON outputs.
- Story vignette using `events.xlsx` to highlight branching data-driven dialogues.

## 12. Acceptance Criteria for Design Asset
- Directory contains populated Excel skeletons (future) following schema above.
- `context.enums.json` lists enumerations referenced by schemas.
- `serialize.js` eventually reuses existing pattern to generate JSON / TS / Interface / JSONX.
- Documentation kept in this file; updates tracked per milestone.

## 13. Appendix — System Checklist (derived from Ares Virus)
- [x] Scarcity-based survival stats
- [x] Multi-layer crafting & weapon modification
- [x] Mission variety with faction repercussions
- [x] Base facility upgrades & NPC management
- [x] Dynamic events influenced by global contamination
- [x] Harsh combat tempo with varied enemy families
- [x] Exposure/mutation subsystem supplanting infection mechanic
- [x] Rich data modeling for `tables` demonstration

