const Path = require('path');
const fs = require('fs-extra');
const XLSX = require('xlsx');

const baseDir = __dirname;

function makeSheet(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '__data');
  return wb;
}

function writeTable(fileName, rows) {
  const wb = makeSheet(rows);
  const target = Path.resolve(baseDir, fileName);
  XLSX.writeFile(wb, target);
  console.log('[abyssal-nightfall] wrote', fileName);
}

const rowsEmpty = [[], [], []];

function buildOperators() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'uint', 'float', 'uint', 'float', 'float', 'string', 'string'],
    ['sector', 'category', 'serial', 'codename', 'role', 'startWeapon', 'startRelic', 'hp', 'moveSpeed', 'sanityCap', 'reloadBonus', 'critBonus', 'signaturePassive', 'portraitArt'],
    ['10', '01', '0001', 'Sable Hart', 'Reclaimer', 'weapon:runic-revolver', 'relic:void-orbit', '135', '5.6', '140', '0.92', '0.08', 'passive:precision-lock', 'ui/assets/operators/sable.svg'],
    ['10', '01', '0002', 'Iris Calder', 'Beacon', 'weapon:chorus-ray', 'relic:sigil-halo', '120', '5.1', '155', '0.88', '0.15', 'passive:seraph-ward', 'ui/assets/operators/iris.svg'],
    ['10', '01', '0003', 'Marlow Reef', 'Harpooner', 'weapon:tidebreaker', 'relic:maelstrom-core', '150', '5.3', '130', '0.96', '0.06', 'passive:undertow-grip', 'ui/assets/operators/marlow.svg']
  ];
  writeTable('operators.xlsx', rows);
}

function buildWeapons() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'WeaponCategory', 'AttackStyle', 'uint', 'DamageType', 'float', 'float', 'uint', 'float', 'float', 'float', 'float', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'categoryName', 'attackStyle', 'damage', 'damageType', 'fireRate', 'reload', 'magazine', 'spread', 'projectileSpeed', 'maxRange', 'projectileLifetime', 'travelSprite', 'impactSprite', 'muzzleSprite', 'notes'],
    ['20', '02', '0001', 'Runic Revolver', 'SIDEARM', 'MANUAL', '35', 'KINETIC', '0.38', '1.60', '6', '2.4', '48', '30', '0.62', 'ui/assets/fx/projectiles/revolver.png', 'ui/assets/fx/impact/sparks.png', 'ui/assets/fx/muzzle/flame.png', 'Baseline sidearm for Sable; stagger on crit.'],
    ['20', '02', '0002', 'Chorus Ray', 'ARCANE', 'BEAM', '18', 'VOID', '0.12', '2.40', '0', '0.0', '78', '24', '0.30', 'ui/assets/fx/projectiles/beam_ray.png', 'ui/assets/fx/impact/void_burst.png', 'ui/assets/fx/muzzle/chorus.png', 'Channel beam that ramps +4 dmg per second of focus.'],
    ['20', '02', '0003', 'Tidebreaker Launcher', 'LAUNCHER', 'BURST', '96', 'FROST', '0.22', '2.80', '2', '4.5', '36', '20', '0.55', 'ui/assets/fx/projectiles/tide_shell.png', 'ui/assets/fx/impact/frost_shatter.png', 'ui/assets/fx/muzzle/water.png', 'Two-stage burst: shell splits into 3 shards at 0.35s.'],
    ['20', '02', '0004', 'Pulse Carbine', 'RIFLE', 'MANUAL', '44', 'LIGHT', '0.26', '1.90', '18', '3.1', '64', '32', '0.50', 'ui/assets/fx/projectiles/pulse.png', 'ui/assets/fx/impact/pulse_flash.png', 'ui/assets/fx/muzzle/pulse_muzzle.png', 'Rewards rhythm fire; reload grants +10% move speed for 2s.'],
    ['20', '02', '0005', 'Umbral Scattergun', 'SHOTGUN', 'BURST', '28', 'VOID', '0.45', '2.10', '4', '8.0', '28', '18', '0.40', 'ui/assets/fx/projectiles/umbral_pellet.png', 'ui/assets/fx/impact/void_scar.png', 'ui/assets/fx/muzzle/umbral.png', 'Fires 7 pellets; gain +6 damage per pellet within 1.2m.'],
    ['20', '02', '0006', 'Eclipse Javelin', 'LAUNCHER', 'AUTO', '54', 'FIRE', '0.32', '2.20', '5', '2.2', '52', '32', '0.70', 'ui/assets/fx/projectiles/eclipse_javelin.png', 'ui/assets/fx/impact/eclipse_burst.png', 'ui/assets/fx/muzzle/eclipse.png', 'Spears explode in a scorch column, best used vs clustered foes.']
  ];
  writeTable('weapons.xlsx', rows);
}

function buildRelics() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'AttackStyle', 'float', 'float', 'float', 'uint', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'school', 'activationStyle', 'cooldown', 'duration', 'radius', 'sanityDrain', 'effects', 'vfxSprite', 'sfxCue'],
    ['30', '05', '0001', 'Void Orbit', 'entropy', 'AUTO', '24', '6', '4.5', '12', 'Summons 3 orbitals that deal 22 void DPS.', 'ui/assets/fx/relics/void_orbit.png', 'ui/assets/sfx/relics/void_hum.wav'],
    ['30', '05', '0002', 'Sigil Halo', 'radiance', 'CHANNEL', '32', '8', '6.0', '18', 'Creates sanctified ring that slows enemies by 35%.', 'ui/assets/fx/relics/sigil_halo.png', 'ui/assets/sfx/relics/halo_chime.wav'],
    ['30', '05', '0003', 'Maelstrom Core', 'tides', 'BURST', '28', '5', '5.5', '15', 'Pulls foes inward, then detonates for 88 frost damage.', 'ui/assets/fx/relics/maelstrom.png', 'ui/assets/sfx/relics/maelstrom.wav'],
    ['30', '05', '0004', 'Seraph Beacon', 'radiance', 'AUTO', '18', '4', '3.0', '10', 'Spectral turret fires light bolts every 0.6s for 16 dmg.', 'ui/assets/fx/relics/seraph_beacon.png', 'ui/assets/sfx/relics/beacon_loop.wav'],
    ['30', '05', '0005', 'Aegis Bloom', 'ward', 'BURST', '36', '4', '4.0', '20', 'Deploys a bloom granting +60 shield for 8s.', 'ui/assets/fx/relics/aegis_bloom.png', 'ui/assets/sfx/relics/aegis.wav']
  ];
  writeTable('relics.xlsx', rows);
}

function buildEnemies() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'EnemyFamily', 'uint', 'uint', 'float', 'AttackStyle', 'float', 'float', 'float', 'string', 'string', 'DamageType', 'DamageType', 'string', 'uint', 'string', 'uint', 'float'],
    ['sector', 'category', 'serial', 'name', 'family', 'hp', 'damage', 'moveSpeed', 'attackStyle', 'attackInterval', 'projectileSpeed', 'projectileLifetime', 'projectileSprite', 'impactSprite', 'weakness', 'resistance', 'lootTable', 'sanityDamage', 'combatNotes', 'xp', 'radius'],
    ['40', '06', '0001', 'Rift Shambler', 'SHAMBLER', '80', '18', '3.4', 'AUTO', '1.80', '14', '0.90', 'ui/assets/fx/projectiles/spittle.png', 'ui/assets/fx/impact/slime.png', 'FIRE', 'VOID', 'loot:ichor_minor', '6', 'Lobs corrupted bile; projectile arc 35 degrees.', '15', '12'],
    ['40', '06', '0002', 'Choir Acolyte', 'CULTIST', '120', '24', '3.1', 'BURST', '2.40', '22', '0.85', 'ui/assets/fx/projectiles/choir_note.png', 'ui/assets/fx/impact/chorus.png', 'LIGHT', 'VOID', 'loot:choir_cache', '9', 'Fires 3-note burst; third note inflicts dread stack.', '20', '14'],
    ['40', '06', '0003', 'Abyssal Howler', 'ABERRATION', '180', '28', '4.0', 'MANUAL', '2.80', '0', '0.00', 'ui/assets/fx/projectiles/howl_wave.png', 'ui/assets/fx/impact/howl.png', 'LIGHT', 'FROST', 'loot:howler_pouch', '12', 'Line cone shockwave; adds sanity bleed over 3s.', '25', '18'],
    ['40', '06', '0004', 'Null Sentinel', 'CONSTRUCT', '220', '32', '2.6', 'BEAM', '1.45', '60', '0.50', 'ui/assets/fx/projectiles/null_beam.png', 'ui/assets/fx/impact/null_burn.png', 'VOID', 'KINETIC', 'loot:sentinel_cache', '10', 'Sweeping beam telegraph 0.6s; pierces obstacles.', '30', '20'],
    ['40', '06', '0005', 'Harbor Dredger', 'CONSTRUCT', '320', '42', '2.2', 'MANUAL', '1.10', '0', '0.00', 'ui/assets/fx/projectiles/dredger_slam.png', 'ui/assets/fx/impact/dredger_slam.png', 'FIRE', 'KINETIC', 'loot:dredger_core', '14', 'Heavy mech charges the beacon and causes shock tremors.', '40', '24'],
    ['40', '06', '0006', 'Myriad Fragment', 'ABERRATION', '60', '15', '4.8', 'BURST', '1.90', '26', '0.75', 'ui/assets/fx/projectiles/fragment_dart.png', 'ui/assets/fx/impact/fragment_spark.png', 'LIGHT', 'VOID', 'loot:fragment_cache', '8', 'Skittering shards fire dart volleys in packs.', '12', '10']
  ];
  writeTable('enemies.xlsx', rows);
}

function buildBosses() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'uint', 'uint', 'float', 'float', 'string', 'float', 'float', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'hp', 'armor', 'moveSpeed', 'enrageSpeed', 'signatureAttack', 'attackInterval', 'projectileLifetime', 'telegraphSprite', 'arenaModifier'],
    ['50', '07', '0001', 'The Choir of Mouths', '9000', '25', '3.0', '20', 'Rotary void beam with hymn barrages', '1.20', '0.80', 'ui/assets/fx/telegraph/choir_circle.png', 'Increases ambient dread by 1 per 20s.'],
    ['50', '07', '0002', 'Tide Shepherd', '8200', '18', '2.4', '18', 'Hook chains pull player into tidal lanes', '2.10', '1.10', 'ui/assets/fx/telegraph/tidal_lane.png', 'Tidal surges sweep arena edges every 15s.'],
    ['50', '07', '0003', 'Nameless Beacon', '9800', '32', '2.8', '24', 'Pillars of surveillance drain sanity', '1.60', '0.95', 'ui/assets/fx/telegraph/beacon_grid.png', 'Reduces sight radius to 65% while active.']
  ];
  writeTable('bosses.xlsx', rows);
}

function buildWaves() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'uint', 'uint', 'tid', 'uint', 'float', 'string', 'string'],
    ['sector', 'category', 'serial', 'timestamp', 'duration', 'enemyId', 'count', 'spawnRadius', 'formation', 'notes'],
    ['60', '08', '0001', '3', '25', '40060001', '6', '11.5', 'ring', 'Opening probe; stays outside melee range.'],
    ['60', '08', '0002', '35', '35', '40060002', '8', '9.0', 'arc', 'Choir acolytes chant, boosting nearby allies.'],
    ['60', '08', '0003', '80', '30', '40060003', '6', '7.5', 'cone', 'Howlers arrive after fog surge; manage sanity bleed.'],
    ['60', '08', '0004', '120', '40', '40060004', '4', '13.5', 'cross', 'Sentinels sweep beams while shamblers close in.'],
    ['60', '08', '0005', '170', '35', '40060006', '10', '8.0', 'swarm', 'Fragments dash in packs forcing kite routes.'],
    ['60', '08', '0006', '220', '45', '40060005', '5', '10.5', 'line', 'Dredgers charge straight for the beacon core.']
  ];
  writeTable('waves.xlsx', rows);
}

function buildSkillTree() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'SkillBranch', 'uint', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'branch', 'node', 'name', 'branchName', 'tier', 'parent', 'effects', 'requirements', 'tooltip', 'icon'],
    ['70', '01', '0001', 'Focal Anchor', 'PRECISION', '1', '', 'crit:+5|stability:+8', '', '提高命中稳定，解锁精准分支。', 'ui/assets/icons/skill/focal_anchor.png'],
    ['70', '01', '0002', 'Rapid Siphon', 'PRECISION', '2', 'skill:70010001', 'reload:-6%|crit:+4', 'level:3', '装填更迅速并提升暴击。', 'ui/assets/icons/skill/rapid_siphon.png'],
    ['70', '01', '0003', 'Zero Point Rounds', 'PRECISION', '3', 'skill:70010002', 'damage:+12|weakPoint:+20%', 'level:6', '子弹穿透时获得额外伤害。', 'ui/assets/icons/skill/zero_point.png'],
    ['70', '02', '0001', 'Aether Resonance', 'AETHER', '1', '', 'beamDamage:+6|sanityDrain:-2', '', '持续型武器效率提升。', 'ui/assets/icons/skill/aether_resonance.png'],
    ['70', '02', '0002', 'Choir Surge', 'AETHER', '2', 'skill:70020001', 'beamRamp:+4/s|radius:+0.8', 'level:4', '光束蓄力更快并扩大范围。', 'ui/assets/icons/skill/choir_surge.png'],
    ['70', '03', '0001', 'Undertow Grasp', 'TIDES', '1', '', 'pullStrength:+18|frostDamage:+10', '', '潮汐技能增强牵引力。', 'ui/assets/icons/skill/undertow.png'],
    ['70', '03', '0002', 'Riptide Collapse', 'TIDES', '2', 'skill:70030001', 'frostShatter:+22|radius:+1.2', 'level:5', '爆裂范围扩大并追加寒霜伤害。', 'ui/assets/icons/skill/riptide_collapse.png'],
    ['70', '04', '0001', 'Ward Bastion', 'WARD', '1', '', 'shield:+40|sanityRegen:+3', '', '短期内提高护盾与理智恢复。', 'ui/assets/icons/skill/ward_bastion.png'],
    ['70', '04', '0002', 'Seraphic Shell', 'WARD', '2', 'skill:70040001', 'shield:+60|beamReflect:15%', 'level:4', '护盾容量增加并反射部分激光。', 'ui/assets/icons/skill/seraphic_shell.png']
  ];
  writeTable('skill_tree.xlsx', rows);
}

function buildSynergyCards() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'SynergyTier', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'tier', 'prerequisites', 'effects', 'trigger', 'icon'],
    ['71', '02', '0001', 'Leviathan Lance', 'MYTHIC', 'weapon:chorus-ray|relic:maelstrom-core', 'beamDamage:+28|pullStrength:+20', 'sanity:<40', 'ui/assets/icons/synergy/leviathan.png'],
    ['71', '02', '0002', 'Singularity Waltz', 'EPIC', 'weapon:runic-revolver|relic:void-orbit', 'projectileSpeed:+18|orbitals:+1|crit:+6', 'after:reload', 'ui/assets/icons/synergy/singularity.png'],
    ['71', '02', '0003', 'Seraph Tide', 'RARE', 'relic:sigil-halo|skill:70040002', 'slow:+12%|shield:+30|duration:+2', 'killstreak:15@20s', 'ui/assets/icons/synergy/seraph_tide.png'],
    ['71', '02', '0004', 'Undertow Battery', 'EPIC', 'weapon:tidebreaker|skill:70030002', 'burstDamage:+24|shardCount:+1', 'after:maelstrom', 'ui/assets/icons/synergy/undertow_battery.png']
  ];
  writeTable('synergy_cards.xlsx', rows);
}

function main() {
  fs.ensureDirSync(baseDir);
  buildOperators();
  buildWeapons();
  buildRelics();
  buildEnemies();
  buildBosses();
  buildWaves();
  buildSkillTree();
  buildSynergyCards();
}

main();
