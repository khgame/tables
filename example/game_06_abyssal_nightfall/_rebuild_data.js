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
    ['10', '01', '0001', 'Sable Hart', 'Reclaimer', 'weapon:runic-revolver', 'relic:void-orbit', '135', '5.6', '140', '0.92', '0.08', 'passive:precision-lock', 'art/operators/sable.png'],
    ['10', '01', '0002', 'Iris Calder', 'Beacon', 'weapon:chorus-ray', 'relic:sigil-halo', '120', '5.1', '155', '0.88', '0.15', 'passive:seraph-ward', 'art/operators/iris.png'],
    ['10', '01', '0003', 'Marlow Reef', 'Harpooner', 'weapon:tidebreaker', 'relic:maelstrom-core', '150', '5.3', '130', '0.96', '0.06', 'passive:undertow-grip', 'art/operators/marlow.png']
  ];
  writeTable('operators.xlsx', rows);
}

function buildWeapons() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'WeaponCategory', 'AttackStyle', 'uint', 'DamageType', 'float', 'float', 'uint', 'float', 'float', 'float', 'float', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'categoryName', 'attackStyle', 'damage', 'damageType', 'fireRate', 'reload', 'magazine', 'spread', 'projectileSpeed', 'maxRange', 'projectileLifetime', 'travelSprite', 'impactSprite', 'muzzleSprite', 'notes'],
    ['20', '02', '0001', 'Runic Revolver', 'SIDEARM', 'MANUAL', '62', 'KINETIC', '0.38', '1.60', '6', '2.4', '48', '30', '0.62', 'fx/projectiles/revolver.png', 'fx/impact/sparks.png', 'fx/muzzle/flame.png', 'Baseline sidearm for Sable; stagger on crit.'],
    ['20', '02', '0002', 'Chorus Ray', 'ARCANE', 'BEAM', '18', 'VOID', '0.12', '2.40', '0', '0.0', '78', '24', '0.30', 'fx/projectiles/beam_ray.png', 'fx/impact/void_burst.png', 'fx/muzzle/chorus.png', 'Channel beam that ramps +4 dmg per second of focus.'],
    ['20', '02', '0003', 'Tidebreaker Launcher', 'LAUNCHER', 'BURST', '96', 'FROST', '0.22', '2.80', '2', '4.5', '36', '20', '0.55', 'fx/projectiles/tide_shell.png', 'fx/impact/frost_shatter.png', 'fx/muzzle/water.png', 'Two-stage burst: shell splits into 3 shards at 0.35s.'],
    ['20', '02', '0004', 'Pulse Carbine', 'RIFLE', 'MANUAL', '44', 'LIGHT', '0.26', '1.90', '18', '3.1', '64', '32', '0.50', 'fx/projectiles/pulse.png', 'fx/impact/pulse_flash.png', 'fx/muzzle/pulse_muzzle.png', 'Rewards rhythm fire; reload grants +10% move speed for 2s.'],
    ['20', '02', '0005', 'Umbral Scattergun', 'SHOTGUN', 'BURST', '28', 'VOID', '0.45', '2.10', '4', '8.0', '28', '18', '0.40', 'fx/projectiles/umbral_pellet.png', 'fx/impact/void_scar.png', 'fx/muzzle/umbral.png', 'Fires 7 pellets; gain +6 damage per pellet within 1.2m.']
  ];
  writeTable('weapons.xlsx', rows);
}

function buildRelics() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'AttackStyle', 'float', 'float', 'float', 'uint', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'school', 'activationStyle', 'cooldown', 'duration', 'radius', 'sanityDrain', 'effects', 'vfxSprite', 'sfxCue'],
    ['30', '05', '0001', 'Void Orbit', 'entropy', 'AUTO', '24', '6', '4.5', '12', 'Summons 3 orbitals that deal 22 void DPS.', 'fx/relics/void_orbit.png', 'sfx/relics/void_hum.wav'],
    ['30', '05', '0002', 'Sigil Halo', 'radiance', 'CHANNEL', '32', '8', '6.0', '18', 'Creates sanctified ring that slows enemies by 35%.', 'fx/relics/sigil_halo.png', 'sfx/relics/halo_chime.wav'],
    ['30', '05', '0003', 'Maelstrom Core', 'tides', 'BURST', '28', '5', '5.5', '15', 'Pulls foes inward, then detonates for 88 frost damage.', 'fx/relics/maelstrom.png', 'sfx/relics/maelstrom.wav'],
    ['30', '05', '0004', 'Seraph Beacon', 'radiance', 'AUTO', '18', '4', '3.0', '10', 'Spectral turret fires light bolts every 0.6s for 16 dmg.', 'fx/relics/seraph_beacon.png', 'sfx/relics/beacon_loop.wav']
  ];
  writeTable('relics.xlsx', rows);
}

function buildEnemies() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'EnemyFamily', 'uint', 'uint', 'float', 'AttackStyle', 'float', 'float', 'float', 'string', 'string', 'DamageType', 'DamageType', 'string', 'uint', 'string'],
    ['sector', 'category', 'serial', 'name', 'family', 'hp', 'damage', 'moveSpeed', 'attackStyle', 'attackInterval', 'projectileSpeed', 'projectileLifetime', 'projectileSprite', 'impactSprite', 'weakness', 'resistance', 'lootTable', 'sanityDamage', 'combatNotes'],
    ['40', '06', '0001', 'Rift Shambler', 'SHAMBLER', '220', '24', '3.4', 'AUTO', '1.80', '14', '0.90', 'fx/projectiles/spittle.png', 'fx/impact/slime.png', 'FIRE', 'VOID', 'loot:ichor_minor', '6', 'Lobs corrupted bile; projectile arc 35 degrees.'],
    ['40', '06', '0002', 'Choir Acolyte', 'CULTIST', '260', '32', '3.1', 'BURST', '2.40', '22', '0.85', 'fx/projectiles/choir_note.png', 'fx/impact/chorus.png', 'LIGHT', 'VOID', 'loot:choir_cache', '9', 'Fires 3-note burst; third note inflicts dread stack.'],
    ['40', '06', '0003', 'Abyssal Howler', 'ABERRATION', '340', '36', '4.0', 'MANUAL', '2.80', '0', '0.00', 'fx/projectiles/howl_wave.png', 'fx/impact/howl.png', 'LIGHT', 'FROST', 'loot:howler_pouch', '12', 'Line cone shockwave; adds sanity bleed over 3s.'],
    ['40', '06', '0004', 'Null Sentinel', 'CONSTRUCT', '420', '42', '2.6', 'BEAM', '1.45', '60', '0.50', 'fx/projectiles/null_beam.png', 'fx/impact/null_burn.png', 'VOID', 'KINETIC', 'loot:sentinel_cache', '10', 'Sweeping beam telegraph 0.6s; pierces obstacles.']
  ];
  writeTable('enemies.xlsx', rows);
}

function buildBosses() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'uint', 'uint', 'float', 'float', 'string', 'float', 'float', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'hp', 'armor', 'moveSpeed', 'enrageSpeed', 'signatureAttack', 'attackInterval', 'projectileLifetime', 'telegraphSprite', 'arenaModifier'],
    ['50', '07', '0001', 'The Choir of Mouths', '9000', '25', '3.0', '20', 'Rotary void beam with hymn barrages', '1.20', '0.80', 'fx/telegraph/choir_circle.png', 'Increases ambient dread by 1 per 20s.'],
    ['50', '07', '0002', 'Tide Shepherd', '8200', '18', '2.4', '18', 'Hook chains pull player into tidal lanes', '2.10', '1.10', 'fx/telegraph/tidal_lane.png', 'Tidal surges sweep arena edges every 15s.'],
    ['50', '07', '0003', 'Nameless Beacon', '9800', '32', '2.8', '24', 'Pillars of surveillance drain sanity', '1.60', '0.95', 'fx/telegraph/beacon_grid.png', 'Reduces sight radius to 65% while active.']
  ];
  writeTable('bosses.xlsx', rows);
}

function buildWaves() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'uint', 'uint', 'string', 'uint', 'float', 'string', 'string'],
    ['sector', 'category', 'serial', 'timestamp', 'duration', 'enemyId', 'count', 'spawnRadius', 'formation', 'notes'],
    ['60', '08', '0001', '45', '30', 'enemy:shambler', '18', '11.5', 'ring', 'Opening probe; stays outside melee range.'],
    ['60', '08', '0002', '95', '40', 'enemy:cultist', '12', '9.0', 'arc', 'Choir acolytes spawn with dread chant buff.'],
    ['60', '08', '0003', '150', '35', 'enemy:howler', '6', '7.5', 'cone', 'Howlers arrive after fog surge; watch sanity bleed.'],
    ['60', '08', '0004', '210', '45', 'enemy:sentinel', '4', '13.5', 'cross', 'Sentinels rotate beam sweeps; pair with shambler adds.']
  ];
  writeTable('waves.xlsx', rows);
}

function main() {
  fs.ensureDirSync(baseDir);
  buildOperators();
  buildWeapons();
  buildRelics();
  buildEnemies();
  buildBosses();
  buildWaves();
}

main();
