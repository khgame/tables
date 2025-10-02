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
  console.log('[neon-aberration] wrote', fileName);
}

const rowsEmpty = [[], [], []];

function buildOperators() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'uint', 'uint', 'uint', 'uint', 'uint', 'string', 'string', 'uint', 'uint', 'string'],
    ['sector', 'category', 'serial', 'codename', 'archetype', 'vitality', 'stamina', 'focus', 'exposureCap', 'morale', 'traits', 'loadoutTags', 'hungerResist', 'sleepDebt', 'signatureSkill'],
    ['10', '01', '0001', 'Sable', 'Recon', '120', '140', '80', '60', '50', 'Shadowstep|ColdLogic', 'sidearm|psionic', '10', '0', 'skill:void-veil'],
    ['10', '01', '0002', 'Helix', 'Medic', '110', '130', '70', '55', '65', 'FieldSurgeon|Containment', 'sidearm|shotgun', '6', '5', 'skill:stasis-field'],
    ['10', '01', '0003', 'Rift', 'Breaker', '150', '110', '60', '70', '40', 'Overcrank|Grit', 'rifle|blade', '4', '7', 'skill:overdrive'],
    ['10', '01', '0004', 'Nyx', 'Invoker', '100', '125', '120', '75', '45', 'Mindlink|Entropy', 'psionic|blade', '8', '3', 'skill:entropy-wave']
  ];
  writeTable('operators.xlsx', rows);
}

function buildWeapons() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'uint', 'uint', 'uint', 'uint', 'uint', 'string', 'string', 'string', 'uint', 'float', 'uint', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'archetype', 'tier', 'kineticDamage', 'voidDamage', 'chemicalDamage', 'staminaCost', 'modSlots', 'compatibleOps', 'ammoType', 'magSize', 'fireRate', 'durability', 'statusPayload', 'tags'],
    ['20', '02', '0001', 'VX-9 Wraith', 'sidearm', '1', '32', '12', '0', '8', 'barrel|mag|chipset', 'Sable|Helix', 'light_round', '18', '4.2', '120', 'bleed:8|stagger:4', 'starter|sidearm'],
    ['20', '02', '0002', 'Graviton Pike', 'psionic', '2', '18', '28', '0', '14', 'catalyst|chipset', 'Sable|Rift|Nyx', 'psi_cell', '6', '2.1', '90', 'void:18|slow:6', 'psionic|channel'],
    ['20', '02', '0003', 'Holo-Riot SG', 'shotgun', '2', '72', '8', '12', '20', 'barrel|mag|chipset|catalyst', 'Helix|Rift', 'scatter_shell', '6', '1.6', '150', 'bleed:15|knockback:6', 'close|staggers'],
    ['20', '02', '0004', 'Cerulean Carver', 'blade', '3', '44', '0', '10', '12', 'core|chipset', 'Rift|Nyx', 'none', '0', '0.9', '200', 'bleed:20|expose:10', 'melee|charged']
  ];
  writeTable('weapons.xlsx', rows);
}

function buildWeaponMods() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'slot', 'rarity', 'effects', 'requirements', 'compatibility'],
    ['21', '02', '1001', 'Phantom Suppressor', 'barrel', 'rare', '+10 kineticDamage|-20 noise', 'research:COM-001', 'sidearm|shotgun'],
    ['21', '02', '1002', 'Azoth Cell', 'catalyst', 'epic', '+15 voidDamage|+5 exposureResistance', 'research:PSI-102|facility:chem.lab@3', 'psionic|shotgun'],
    ['21', '02', '1003', 'Splicer Drum', 'mag', 'uncommon', '+30 ammoCapacity|+8 reloadTime', 'mission:SUPPLY-201', 'sidearm|shotgun'],
    ['21', '02', '1004', 'Vortex Lattice', 'chipset', 'legendary', '+12 focus|+8 statusPower', 'research:COM-205|favor:Observation@14', 'psionic|blade']
  ];
  writeTable('weapon_mods.xlsx', rows);
}

function buildResources() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'uint', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'rarity', 'class', 'value', 'sources', 'craftUse'],
    ['30', '03', '0001', 'Ichor Sample', 'rare', 'bio', '40', 'enemy:Aberrant|mission:ANOM-401', 'serum|antidote'],
    ['30', '03', '0002', 'Flux Capacitor', 'epic', 'circuit', '85', 'loot:Sentinel|facility:observation', 'mod|facility'],
    ['30', '03', '0003', 'Street Rations', 'common', 'supply', '8', 'vendor:blackMarket|mission:SUPPLY-101', 'consumable'],
    ['30', '03', '0004', 'Solar Gel Cell', 'uncommon', 'energy', '25', 'tile:docks|enemy:Ganger', 'ammo|facility'],
    ['30', '03', '0005', 'Frost Bloom Herb', 'rare', 'herb', '32', 'gather:polar-greenhouse', 'serum|buff']
  ];
  writeTable('resources.xlsx', rows);
}

function buildSurvivalStats() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'uint', 'uint', 'uint', 'uint', 'uint', 'string'],
    ['sector', 'category', 'serial', 'parameter', 'appliesTo', 'baseValue', 'minValue', 'maxValue', 'decayPerHour', 'threshold', 'effects'],
    ['31', '04', '0001', 'hunger', 'global', '100', '0', '120', '6', '25', 'morale:-10|vitality:-15'],
    ['31', '04', '0002', 'hydration', 'global', '100', '0', '120', '7', '30', 'focus:-8|stamina:-12'],
    ['31', '04', '0003', 'temperature', 'environment:cold', '98', '80', '110', '2', '85', 'stamina:-10|exposure:+8'],
    ['31', '04', '0004', 'sleep', 'operator', '100', '0', '120', '5', '35', 'focus:-15|skillLock:true']
  ];
  writeTable('survival_stats.xlsx', rows);
}

function buildGatherNodes() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'uint', 'string', 'uint'],
    ['sector', 'category', 'serial', 'name', 'region', 'resource', 'yield', 'respawn', 'exposureGain'],
    ['32', '05', '0001', 'Collapsed Pharmacy', 'District-Helix', 'resource:0003@3|resource:0001@1', '4', 'task:restock', '6'],
    ['32', '05', '0002', 'Polar Greenhouse', 'Rift-13', 'resource:0005@2|resource:0004@1', '3', 'weather:clear', '10'],
    ['32', '05', '0003', 'Signal Relay Roof', 'District-Nadir', 'resource:0004@2|favor:Observation@2', '2', 'mission:3002', '5']
  ];
  writeTable('gather_nodes.xlsx', rows);
}

function buildCraftRecipes() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'uint', 'string'],
    ['sector', 'category', 'serial', 'itemId', 'categoryName', 'inputs', 'outputs', 'time', 'facility'],
    ['33', '06', '0001', 'consumable:serum-alpha', 'serum', 'resource:0001@2|resource:0005@1', 'serum-alpha@1', '4', 'chem.lab'],
    ['33', '06', '0002', 'ammo:light_round@60', 'ammo', 'resource:0004@1|resource:0003@1', 'light_round@60', '2', 'workshop'],
    ['33', '06', '0003', 'meal:reinforced', 'meal', 'resource:0003@2|resource:0005@1', 'meal:reinforced@2', '3', 'dormitory'],
    ['33', '06', '0004', 'mod:azoth-cell', 'mod', 'resource:0002@1|favor:Observation@4', 'mod:azoth-cell@1', '6', 'workshop']
  ];
  writeTable('craft_recipes.xlsx', rows);
}

function buildStatusEffects() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'uint', 'string'],
    ['sector', 'category', 'serial', 'name', 'categoryName', 'effects', 'duration', 'cleanup'],
    ['34', '07', '0001', 'bleed', 'damage', 'hp:-5/tick', '10', 'serum-alpha'],
    ['34', '07', '0002', 'void', 'control', 'focus:-8|exposure:+6', '12', 'none'],
    ['34', '07', '0003', 'slow', 'control', 'staminaRegen:-30%', '8', 'stim:overclock'],
    ['34', '07', '0004', 'mindfracture', 'debuff', 'morale:-15|skillLock:true', '15', 'base:therapy']
  ];
  writeTable('status_effects.xlsx', rows);
}

function buildEnemies() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'uint', 'uint', 'uint', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'family', 'rank', 'hp', 'damage', 'resistances', 'lootTable', 'abilities', 'phases', 'inflict'],
    ['40', '04', '2001', 'Glyph Marauder', 'Ganger', '2', '220', '26', '{kinetic:0.1,void:-0.2}', 'loot:ganger.standard', 'burst-fire|frag-grenade', 'phase:ganger-standard', 'bleed:12'],
    ['40', '04', '2002', 'Axiom Sentinel', 'Construct', '3', '340', '32', '{kinetic:0.25,thermal:-0.15}', 'loot:construct.guard', 'shield-wall|overclock', 'phase:construct-sentry', 'shock:10'],
    ['40', '04', '2003', 'Chorus Spawn', 'Aberrant', '3', '280', '38', '{void:0.3,chemical:-0.2}', 'loot:aberrant.bio', 'neurofog|tendril-lash', 'phase:aberrant-chorus', 'void:14'],
    ['40', '04', '2004', 'Warden of Null', 'Avatar', '5', '520', '54', '{kinetic:0.4,void:0.1}', 'loot:avatar.core', 'phase-rift|entropy-field', 'phase:avatar-null', 'mindfracture:16']
  ];
  writeTable('enemies.xlsx', rows);
}

function buildLootTables() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'tableId', 'entries', 'notes'],
    ['41', '08', '0001', 'loot:ganger.standard', 'resource:0003@70|ammo:light_round@40|credits@120', '黑帮基础掉落'],
    ['41', '08', '0002', 'loot:construct.guard', 'resource:0004@60|resource:0002@30|mod:splicer-drum@10', '企业哨兵'],
    ['41', '08', '0003', 'loot:aberrant.bio', 'resource:0001@65|resource:0005@25|consumable:serum-alpha@8', '感染体'],
    ['41', '08', '0004', 'loot:avatar.core', 'resource:0002@35|implant:psi-core@15|artifact:eldritch-sigil@5', '终极 Boss 奖励']
  ];
  writeTable('loot_tables.xlsx', rows);
}

function buildEnemyPhases() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'uint', 'string', 'string'],
    ['sector', 'category', 'serial', 'phaseId', 'stage', 'behaviour', 'transitions'],
    ['42', '09', '0001', 'phase:ganger-standard', '1', 'burst-fire|take-cover', 'hp:60%->stage2'],
    ['42', '09', '0002', 'phase:construct-sentry', '1', 'shield-up|projectile-burst', 'shield:broken->stage2'],
    ['42', '09', '0003', 'phase:aberrant-chorus', '1', 'spawn-larva|neurofog', 'hp:30%->stage2'],
    ['42', '09', '0004', 'phase:avatar-null', '1', 'entropy-wave|teleport|summon', 'timer:60s->stage2']
  ];
  writeTable('enemy_phases.xlsx', rows);
}

function buildMissions() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'uint', 'string', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'type', 'minRank', 'sectorRef', 'objectives', 'rewards', 'failImpact', 'weatherReq', 'unlock'],
    ['50', '05', '3001', 'Static Bloom Survey', 'Recon', '1', 'District-Helix', 'OBJ-1001|OBJ-1003', 'credits:120|resource:0001@2|reputation:Archive@5', 'contamination:+5', 'any', 'chapter:1'],
    ['50', '05', '3002', 'Cult Safehouse Breach', 'Purge', '2', 'District-Nadir', 'OBJ-1002|OBJ-1004', 'credits:240|blueprint:21-02-1002', 'reputation:Archive-3', 'clear', 'chapter:1|mission:3001'],
    ['50', '05', '3003', 'Anomaly Containment S-13', 'Seal', '3', 'Rift-13', 'OBJ-1005|OBJ-1006', 'resource:0002@1|favor:Observation@4|exposure:-10', 'event:EXPOSURE_SURGE', 'storm', 'chapter:2'],
    ['50', '05', '3004', 'Harbor Night Raid', 'Heist', '3', 'Harbor Nexus', 'OBJ-1002|OBJ-1007', 'credits:320|loot:construct.guard', 'contamination:+8', 'night', 'chapter:2|reputation:Observation@8']
  ];
  writeTable('missions.xlsx', rows);
}

function buildObjectives() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'string', 'uint'],
    ['sector', 'category', 'serial', 'kind', 'target', 'parameters', 'success', 'failure', 'timeLimit'],
    ['60', '06', '1001', 'ScanArea', 'locus-beacon', '{duration:45}', '{missionProgress:+40}', '{spawn:"Chorus Spawn"}', '300'],
    ['60', '06', '1002', 'Eliminate', 'Griefers', '{count:8}', '{lootBoost:0.15}', '{contamination:+4}', '0'],
    ['60', '06', '1003', 'SecureIntel', 'DataCore', '{nodes:3,timeLimit:240}', '{intel:+1}', '{alertLevel:+2}', '240'],
    ['60', '06', '1004', 'Escort', 'Defector', '{distance:320}', '{reputation:Archive:+6}', '{npcLoss:true}', '0'],
    ['60', '06', '1005', 'StabilizeRift', 'Anomaly-Spire', '{phases:3}', '{contamination:-7}', '{exposure:+12}', '0'],
    ['60', '06', '1006', 'Defend', 'ContainmentArray', '{waves:4}', '{favor:Observation:+5}', '{structureHP:-100}', '0'],
    ['60', '06', '1007', 'HackRoute', 'Harbor-Nexus', '{terminals:2}', '{missionProgress:+35}', '{alertLevel:+3}', '180']
  ];
  writeTable('objectives.xlsx', rows);
}

function buildMapTiles() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'uint', 'uint', 'uint', 'uint'],
    ['sector', 'category', 'serial', 'name', 'biome', 'hazards', 'spawnTables', 'exitRules', 'connections', 'tileSheet', 'tileWidth', 'tileHeight', 'tileRow', 'tileCol'],
    ['70', '07', '0101', 'Ruined Arcade', 'urban', 'acid-rain|collapsed-floor', 'ganger.light|construct.patrol', '{exits:2,requires:"lockpick-II"}', 'District-Helix|District-Nadir', 'tileset_city', '32', '32', '0', '0'],
    ['70', '07', '0102', 'Subway Artery', 'transit', 'electrical-surge|darkness', 'ganger.sniper|aberrant.swarm', '{exits:3,requires:"flare"}', 'District-Helix|Harbor Nexus', 'tileset_city', '32', '32', '0', '1'],
    ['70', '07', '0103', 'Harbor Breach', 'docks', 'toxic-fog|tidal-spike', 'aberrant.lurker|construct.turret', '{exits:1,requires:"hazmat"}', 'Harbor Nexus|Rift-13', 'tileset_city', '32', '32', '1', '0'],
    ['70', '07', '0104', 'Polar Lab Perimeter', 'icefield', 'whiteout|low-temp', 'construct.turret|aberrant.synth', '{exits:2,requires:"thermal-suit"}', 'Rift-13', 'tileset_city', '32', '32', '1', '1']
  ];
  writeTable('map_tiles.xlsx', rows);
}

function buildRegions() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'regionId', 'name', 'environment', 'unlock', 'modifiers'],
    ['71', '10', '0001', 'District-Helix', '螺旋商业区', 'urban', 'chapter:1', 'contamination:+5/day|hunger:+4/day'],
    ['71', '10', '0002', 'District-Nadir', '深渊旧城区', 'urban-dark', 'mission:3001', 'hydration:-6/day|loots:+10%'],
    ['71', '10', '0003', 'Harbor Nexus', 'docks', 'chapter:2', 'weather:storm|exposure:+8|loot+boss'],
    ['71', '10', '0004', 'Rift-13', 'anomaly', 'mission:3003', 'void:+12|weather:crimson|resource:+15%']
  ];
  writeTable('regions.xlsx', rows);
}

function buildWeather() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'weatherId', 'name', 'effects', 'duration'],
    ['72', '11', '0001', 'weather:clear', '晴空', 'exposure:-4|visibility:+10', '12h'],
    ['72', '11', '0002', 'weather:rain', '酸雨', 'stamina:-6|hunger:+4|exposure:+6', '8h'],
    ['72', '11', '0003', 'weather:storm', '静电风暴', 'ammoDrop:+10%|focus:-8', '6h'],
    ['72', '11', '0004', 'weather:crimson', '血月', 'enemyDamage:+15%|loot:+20%', '4h']
  ];
  writeTable('weather_cycle.xlsx', rows);
}

function buildChapters() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'chapterId', 'name', 'summary', 'unlock', 'reward'],
    ['73', '12', '0001', 'chapter:1', '余烬序章', '调查 Helix 区域的污染源，建立前哨与补给。', 'none', 'unlock:District-Helix|mission:3001'],
    ['73', '12', '0002', 'chapter:2', '潮汐裂隙', '追踪血月教团至港口与裂隙之内，封印异常。', 'chapter:1|mission:3002', 'unlock:Rift-13|mission:3003|weapon:20-02-0004']
  ];
  writeTable('chapters.xlsx', rows);
}

function buildDialogues() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'dialogueId', 'speaker', 'line', 'choices', 'effects'],
    ['74', '13', '0001', 'dialog:intro-1', 'Sable', 'Helix 区的污染指数再次上升，我们得尽快行动。', 'stay-alert|need-rest', 'morale:+4|sleep:+10'],
    ['74', '13', '0002', 'dialog:intro-2', 'Dr. Lumen', '我可以尝试调制新的抗暴露血清，但需要更多 Ichor 样本。', 'agree|decline', 'task:craft-serum|npcLoyalty:+4'],
    ['74', '13', '0003', 'dialog:event-crimson', 'Nyx', '血月将至，潮汐在囚禁我们的现实。你准备好了吗？', 'ready|delay', 'mission:3003|morale:-3']
  ];
  writeTable('dialogues.xlsx', rows);
}

function buildResearch() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'string', 'uint'],
    ['sector', 'category', 'serial', 'branchCode', 'nodeCode', 'prereq', 'cost', 'unlocks', 'researchTime'],
    ['91', '11', '0001', 'COM', '001', 'none', 'credits@180|resource:0004@3', 'weapon_mod:21-02-1001', '8'],
    ['91', '11', '0002', 'BIO', '014', 'BIO-008', 'credits@220|resource:0001@5', 'consumable:serum-alpha|event:EXPOSURE_REDUCE', '10'],
    ['91', '11', '0003', 'PSI', '102', 'PSI-076', 'credits@300|resource:0002@2|favor:Observation@12', 'weapon_mod:21-02-1002|implant:psi-core', '14'],
    ['91', '11', '0004', 'COM', '205', 'COM-001', 'credits@260|resource:0004@4', 'facility:workshop@3|mission:SUPPLY-301', '12']
  ];
  writeTable('research.xlsx', rows);
}

function buildFacilityUpgrades() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'uint', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'facilityId', 'level', 'requirements', 'benefits', 'maintenance'],
    ['90', '10', '0001', 'workshop', '1', 'cost:credits@200|resource:0001@2', 'unlock:weapon_mods|queue:1', 'power:5'],
    ['90', '10', '0002', 'workshop', '2', 'cost:credits@420|resource:0002@1|favor:Archive@10', 'unlock:advanced_mods|queue:2', 'power:8'],
    ['90', '10', '0003', 'chem.lab', '3', 'cost:credits@360|resource:0001@4|resource:0003@5', 'unlock:anti-exposure|batch:2', 'power:10|bioWaste:2'],
    ['90', '10', '0004', 'observation', '1', 'cost:credits@250|resource:0002@1', 'unlock:mission_insight|event_warning', 'power:4'],
    ['90', '10', '0005', 'dormitory', '2', 'cost:credits@180|resource:0003@2', 'unlock:rest_cycle|morale:+4', 'power:3']
  ];
  writeTable('facility_upgrades.xlsx', rows);
}

function buildNpcRoster() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'uint', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'role', 'loyalty', 'abilities', 'assignedFacility', 'notes'],
    ['92', '12', '0001', 'Dr. Lumen', 'Researcher', '62', 'psionic-analysis|serum-tuning', 'chem.lab', '专注于抗暴露血清的调配'],
    ['92', '12', '0002', 'Forge', 'Quartermaster', '54', 'mod-forging|supply-drop', 'workshop', '善于打造高级模组与补给'],
    ['92', '12', '0003', 'Shade', 'Scout', '48', 'recon|signal-mask', 'observation', '外勤侦查与信号干扰'],
    ['92', '12', '0004', 'Aegis', 'Defender', '70', 'shield-wall|crowd-control', 'dormitory', '可临时加入战斗任务，提供护盾支持'],
    ['92', '12', '0005', 'Mira', 'Trader', '58', 'market-link|salvage-bid', 'workshop', '可引入黑市商品刷新']
  ];
  writeTable('npc_roster.xlsx', rows);
}

function buildBaseTasks() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'uint', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'facilityId', 'priority', 'task', 'effects', 'requirements'],
    ['93', '13', '0001', 'workshop', '1', '打造 Phantom Suppressor', 'weapon_mod:21-02-1001', 'resource:0001@2|resource:0004@1'],
    ['93', '13', '0002', 'chem.lab', '2', '批量合成抗暴露血清', 'consumable:serum-alpha@3', 'resource:0001@3|resource:0005@2'],
    ['93', '13', '0003', 'observation', '3', '扫描即将发生的异动', 'event_warning:BloodMoon', 'favor:Observation@4'],
    ['93', '13', '0004', 'dormitory', '4', '恢复队员士气', 'morale:+8', 'resource:0003@1|resource:0005@1'],
    ['93', '13', '0005', 'workshop', '2', '修理 VX-9 Wraith', 'durability:+60', 'ammo:light_round@30|credits@60']
  ];
  writeTable('base_tasks.xlsx', rows);
}

function buildVendors() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'vendorId', 'name', 'type', 'unlock'],
    ['94', '14', '0001', 'vendor:forge', 'Forge 黑市', 'black-market', 'facility:workshop@2'],
    ['94', '14', '0002', 'vendor:lumen', '观测部补给', 'scientific', 'facility:observation@1'],
    ['94', '14', '0003', 'vendor:aegis', '避难所军需', 'military', 'chapter:2']
  ];
  writeTable('vendors.xlsx', rows);
}

function buildCombatFormulas() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'float', 'string'],
    ['sector', 'category', 'serial', 'formulaId', 'target', 'value', 'notes'],
    ['82', '16', '0001', 'damage.focusMultiplier', 'operator', '0.25', '攻击时的专注系数'],
    ['82', '16', '0002', 'ammo.perShot.default', 'weapon', '1', '默认远程武器单次消耗弹药'],
    ['82', '16', '0003', 'ammo.perShot.none', 'weapon', '0', '近战武器无需弹药'],
    ['82', '16', '0004', 'durability.perHit.blade', 'weapon', '1', '近战每次挥击耐久消耗'],
    ['82', '16', '0005', 'durability.perHit.ranged', 'weapon', '2', '远程武器每次射击耐久消耗'],
    ['82', '16', '0006', 'durability.perHit.psionic', 'weapon', '1', '灵能武器耐久消耗'],
    ['82', '16', '0007', 'exposure.baseGain', 'mission', '10', '基础暴露增量'],
    ['82', '16', '0008', 'exposure.bonus.seal', 'mission', '8', '封印类任务额外暴露'],
    ['82', '16', '0009', 'stamina.perShot.multiplier', 'weapon', '1', '体力消耗倍数']
  ];
  writeTable('combat_formulas.xlsx', rows);
}

function buildShopInventory() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'uint', 'string', 'string'],
    ['sector', 'category', 'serial', 'vendorId', 'itemId', 'cost', 'currency', 'availability'],
    ['95', '15', '0001', 'vendor:forge', 'weapon_mod:21-02-1003', '180', 'credits', 'daily'],
    ['95', '15', '0002', 'vendor:forge', 'ammo:light_round@90', '90', 'credits', 'rotating'],
    ['95', '15', '0003', 'vendor:lumen', 'consumable:serum-alpha', '140', 'credits', 'weekly'],
    ['95', '15', '0004', 'vendor:aegis', 'shield:portable', '260', 'favor:Archive', 'limited']
  ];
  writeTable('shop_inventory.xlsx', rows);
}

function buildEvents() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'uint'],
    ['sector', 'category', 'serial', 'name', 'trigger', 'choices', 'effects', 'cooldown'],
    ['80', '08', '4001', 'Cult Uprising', 'contamination>=40', 'choice:assault|choice:negotiate', 'spawn:mission@3002|reputation:Archive-5', '3'],
    ['80', '08', '4002', 'Corporate Crackdown', 'day%7==0', 'choice:bribe|choice:divert', 'favor:Workshop@4|mission:3001', '2'],
    ['80', '08', '4003', 'Blood Moon Surge', 'lunarPhase==Crimson', 'choice:fortify|choice:ritual', 'event:EXPOSURE_SPIKE|loot:avatar.core@1', '4'],
    ['80', '08', '4004', 'Tide of Echoes', 'district==Harbor&&contamination>=55', 'choice:deploy|choice:evacuate', 'mission:3003|favor:Observation@6', '5'],
    ['80', '08', '4005', 'Supply Caravan', 'day%5==0', 'choice:escort|choice:tax', 'credits:+240|reputation:Archive+4', '3']
  ];
  writeTable('events.xlsx', rows);
}

function buildExposureEvents() {
  const rows = [
    ...rowsEmpty,
    ['@', 'string', 'string', 'string', 'string', 'string'],
    ['stage', 'optionCode', 'label', 'mutations', 'benefits', 'penalties'],
    ['25', 'A', 'Whispered Adaptation', '+5 focus|-5 morale', 'perk:VoidSense', 'status:hallucination@120s'],
    ['50', 'B', 'Chitin Bloom', '+20 vitality|+10 exposureCap', 'perk:BulwarkSkin', 'status:slow@60s'],
    ['75', 'C', 'Eldritch Insight', '+15 focus|+10 stamina', 'skill:entropy_wave', 'status:mindfracture@90s'],
    ['90', 'D', 'Null Ascendance', '+20 voidResist|+15 focus', 'perk:NullMind', 'morale:-20|npcLoyalty:-6']
  ];
  writeTable('exposure_events.xlsx', rows);
}

function main() {
  fs.ensureDirSync(baseDir);
  buildOperators();
  buildWeapons();
  buildWeaponMods();
  buildResources();
  buildSurvivalStats();
  buildGatherNodes();
  buildCraftRecipes();
  buildStatusEffects();
  buildEnemies();
  buildLootTables();
  buildEnemyPhases();
  buildMissions();
  buildObjectives();
  buildMapTiles();
  buildRegions();
  buildWeather();
  buildChapters();
  buildDialogues();
  buildResearch();
  buildFacilityUpgrades();
  buildNpcRoster();
  buildBaseTasks();
  buildVendors();
  buildShopInventory();
  buildCombatFormulas();
  buildEvents();
  buildExposureEvents();
}

main();
