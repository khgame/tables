# Abyssal Nightfall — Vampire Survivors Like Design Bible

## 1. Vision Snapshot
- **Working Title**: Abyssal Nightfall (internal codename `VampireSurvivorsLike`).
- **Genre**: Survival roguelite shooter blending auto-horde pressure (Vampire Survivors) with manual twin-stick marksmanship (20 Minutes Till Dawn).
- **Setting**: 1920s Lovecraftian fishing town swallowed by eldritch fog; occult armaments vs. cosmic horrors.
- **Session Target**: 18-minute standard run (variants at 10 and 25). Emphasis on “one-more-run” cadence.
- **Experience Pillars**: Escalating spectacle, tense reload windows, buildcraft depth, creeping dread atmosphere.

## 2. Core Loop
1. Drop into fog-shrouded arena with signature weapon + relic.
2. Kite hordes, collect Eldritch Motes (XP) and Ichor Shards (currency) while dodging corruption zones.
3. Every level-up presents a draft of weapon upgrades, passive sigils, or synergy cards.
4. Clear timed sigils/bosses at minute 6/12/18 to keep rift pressure manageable.
5. Survive until lighthouse flare (dawn) or perish; convert run resources into meta progression.

## 3. Moment-to-Moment Combat
- **Controls**: WASD/left stick for movement; mouse/right stick for aim. Primary weapon fires manually with recoil and reload; equipped relic auto-triggers on cooldown.
- **Weapons**: 12 planned archetypes (e.g., Runic Revolver, Void Harpoon, Hymn Cannon) tuned for damage, projectile count, rate of fire, reload, crit, knockback.
- **Relic Spells**: Orbiting wards, homing daggers, gravity wells; governed by cooldown and sanity cost.
- **Status Suite**: Eldritch Burn (DoT), Abyssal Slow (–40% move), Mindshock (stun), Dread (raises spawn tier).
- **Enemy Pressure**: Wave table escalates HP/damage/move-speed every 90 s; elites gain affixes (Phase, Bile-Shot, Howl-Lure).
- **Risk Hotspots**: Shrines, ley-line breaches, corruption pools grant strong buffs but amplify spawn density.

## 4. Buildcraft & Progression
- **Draft Categories**: Weapon Evolutions (Tier I–IV), Passive Sigils (cooldown, ammo efficiency, sanity ward), Synergy Cards (ultimate bonuses with prerequisites), Ritual Gambits (high-risk augments unlocked at low sanity).
- **Sanity Meter**: Starts at 100; damage or corruption drains it. Below 40 triggers Aim Drift (spread +10%). At 0 sanity player enters Chaos Surge (3 s invuln, +35% damage) then loses HP 5/s until sanity restored.
- **Artefact Slots**: Up to 6 equippable relic mods looted from mini-bosses/chests (e.g., Abyssal Battery +18% projectile speed, –0.6 s reload).
- **Synergy Examples**:
  - `Void Harpoon` + `Abyssal Battery` → `Leviathan Lance` (pierce + chain lightning).
  - `Hymn Cannon` + `Choir Vestments` → `Canticle Barrage` (doubling projectiles, sanity cost per volley).

## 5. Enemy & Encounter Design
- **Enemy Families**:
  - Shamblers: baseline melee, HP scaling 1.0 + 0.12 × minute.
  - Cult Acolytes: ranged bile bolts, apply Dread.
  - Deep Spawn: burrow ambushers, emerge for burst damage.
  - Screamers: sanity-drain aura, fragile but evasive.
  - Star-Warped Hounds: dash attacks, stagger on hit.
- **Boss Sigils** (minutes 6/12/18):
  - `The Choir of Mouths`: rotary beam + summon clusters; HP 9,000, damage 45.
  - `Tide Shepherd`: tidal wave lanes + hook chains; armor phases (75% reduction) until nodes destroyed.
  - `Nameless Beacon`: area denial pillars + sanity siphon; enrages below 30% HP (+20% speed, +30% damage).
- **Wave Definition**: Timeline JSON rows (timestamp, spawn id, count, radius, modifiers) enabling rapid iteration.

## 6. World & Level Structure
- **Arenas**: Procedural tile chunks (Harbor, Market, Graveyard). Fog density alters sight radius (default 9 tiles → 6 during Fog Surge events).
- **Interactive Events**:
  - Sealing Runes: timed channel for rare relic drop, spawns cultist waves.
  - Meteor Showers: hazard telegraphs rewarding perfect dodges with sanity orbs.
  - Lighthouse Flares: temporary map reveal + pickup vacuum.
- **Hazards**: Acid puddles (–12 HP/s), collapsing piers (trap instant death if pinned), luminescent spores (sanity bleed).

## 7. Meta Systems
- **Hub**: Library of R’lyeh—UI for Tome upgrades, character unlocks, relic codex.
- **Tome Trees**:
  - Resilience: HP, healing gain, revive charges.
  - Insight: XP gain, draft rerolls, sanity recovery.
  - Armory: weapon unlocks, ammo perks, relic starting tier.
  Nodes cost Eldritch Script; base cost 200, growth factor 1.45.
- **Characters** (8 planned):
  - Investigator: starts Runic Revolver III, +12% crit.
  - Occultist: passive sanity regen out of combat (+6/s), starts with Void Nova relic.
  - Mariner: +15% move speed in water tiles, begins with Harpoon gun.
  - Additional slots reserved (Alchemist, Sentinel, etc.).

## 8. Economy & Rewards
- **In-Run**: Eldritch Motes (XP), Ichor Shards (shop & rerolls), Relic Fragments (crafting events), Sanity Orbs (recovery).
- **Chests**:
  - Standard: 1 reward, 40% relic chance.
  - Gilded: 2–3 rewards, guarantees synergy if prerequisites met.
  - Abyssal: boss drop, choice between rare relic or +1 Eldritch Script meta currency.
- **Post-Run**: Eldritch Script (meta), Trophies (cosmetics & achievements), Lore Pages (codex entries unlocking world narrative).

## 9. Numerical Baselines
- Player base stats: 120 HP, 0 regen, 5.4 m/s move, 100 sanity (loss 15 per hit, regen 4 per 5 s idle).
- Enemy multipliers: HP × (1.0 + 0.12 × minute), Damage × (1.0 + 0.08 × minute), Move speed +0.2 m/s every 2 minutes.
- XP curve: Level N cost = `60 × N^1.22` motes; reroll costs escalate 1 → 3 → 6 Ichor.
- Reload examples: Runic Revolver (mag 6, reload 1.6 s), Hymn Cannon (mag 4, reload 2.4 s), Tidebreaker Shotgun (mag 2, reload 2.8 s, fires spread of 6 pellets).
- Cooldown examples: Void Nova relic 8 s, Hex Ward 12 s with 4 s duration.

## 10. Content Roadmap
- **Pre-Alpha (Vertical Slice)**: 1 arena, 4 enemy types, 2 bosses, 6 weapons, 4 relics, sanity loop stubbed, core loop shippable.
- **Alpha**: Meta hub shell, 3 characters, 3 arenas, 20+ draft cards, sanity fully tuned, basic challenges.
- **Beta**: Full enemy roster, 6 bosses, daily challenges, leaderboard prototype, accessibility options.
- **Launch**: 8 characters, 30 weapons/relics, 4 arenas, 6 bosses, codex narrative, Steam achievements.
- **Post-Launch**: Endless mode, co-op prototype, seasonal relic packs.

## 11. Art & Audio Direction
- Palette: desaturated coastal blues/greens with neon occult highlights; ensure readability via strong silhouettes.
- VFX: emissive glyph trails, fog layers pulsing with wave intensity, sanity distortion vignette.
- Audio: layered drones, adaptive heartbeat tied to sanity, manual weapon SFX with satisfying reload foley, distorted whispers at low sanity.
- Music: dynamic ambient score escalating with minute markers; boss leitmotifs featuring choral dissonance.

## 12. UX & Accessibility
- HUD: circular HP/sanity meters around character, ammo counter near reticle, cooldown icons radial at bottom-right, wave timer + boss sigils top-center.
- Draft UI: tarot-style cards with rarity colors, prerequisite icons, stat change deltas.
- Accessibility: aim assist slider, colorblind palettes for pickup glow, toggle for reduced screen shake, narration of draft text.
- Tutorials: short playable vignette, codex tooltips, ghost replay overlay to highlight optimal kiting path.

## 13. Testing & KPIs
- **Balance Goals**: 35–45% success rate on Normal, <20% on Hard. Median session length within ±2 min of target mode length.
- **Analytics**: Track weapon pick rates, synergy completion frequency, sanity failures, boss defeat times.
- **QA Focus**: Weapon feel (recoil, reload feedback), performance under max projectile spam, sanity effects clarity, shrine risk vs reward tuning.
- **Playtest Cadence**: Weekly internal runs, bi-weekly external closed cohort; use heatmaps for player deaths and shrine interactions.

