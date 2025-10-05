const Path = require('path');
const fs = require('fs-extra');
const {
  serialize,
  serializeContext,
  loadContext,
  jsonSerializer,
  jsonxSerializer,
  tsSerializer,
  tsInterfaceSerializer
} = require('../..');

const baseDir = __dirname;
const outDir = Path.resolve(baseDir, 'out');

const tables = [
  'operators',
  'weapons',
  'weapon_mods',
  'resources',
  'survival_stats',
  'gather_nodes',
  'craft_recipes',
  'status_effects',
  'enemies',
  'loot_tables',
  'enemy_phases',
  'missions',
  'objectives',
  'map_tiles',
  'regions',
  'weather_cycle',
  'chapters',
  'dialogues',
  'facility_upgrades',
  'research',
  'npc_roster',
  'base_tasks',
  'vendors',
  'shop_inventory',
  'combat_formulas',
  'events',
  'exposure_events'
];

const serializerEntries = [
  { suffix: '.json', serializer: jsonSerializer },
  { suffix: '.jsonx', serializer: jsonxSerializer },
  { suffix: 'Solution.ts', serializer: tsSerializer },
  { suffix: '.ts', serializer: tsInterfaceSerializer }
];

function main() {
  fs.ensureDirSync(outDir);
  const context = loadContext(baseDir);
  const serializerList = serializerEntries.map(e => e.serializer);
  serializeContext(outDir, serializerList, context);

  for (const stem of tables) {
    const source = Path.resolve(baseDir, `${stem}.xlsx`);
    if (!fs.existsSync(source)) {
      console.warn(`[neon-aberration] skip missing ${stem}.xlsx`);
      continue;
    }
    const serializerMap = serializerEntries.reduce((acc, entry) => {
      acc[`${stem}${entry.suffix}`] = entry.serializer;
      return acc;
    }, {});
    serialize(source, outDir, serializerMap, context);
    console.log(`[neon-aberration] serialized ${stem}.xlsx`);
  }

  writeWebDemo(outDir);

  console.log(`[neon-aberration] artifacts written to ${outDir}`);
}

main();

function writeWebDemo(targetDir) {
  const templatePath = Path.resolve(baseDir, 'ui/index.html');
  if (!fs.existsSync(templatePath)) {
    console.warn('[neon-aberration] ui/index.html not found, skip web demo generation');
    return;
  }

  const replacements = new Map([
    ['__OPERATORS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'operators.json'))],
    ['__SURVIVAL_JSON__', loadJsonForScript(Path.resolve(targetDir, 'survival_stats.json'))],
    ['__GATHER_JSON__', loadJsonForScript(Path.resolve(targetDir, 'gather_nodes.json'))],
    ['__CRAFT_JSON__', loadJsonForScript(Path.resolve(targetDir, 'craft_recipes.json'))],
    ['__STATUS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'status_effects.json'))],
    ['__FACILITY_JSON__', loadJsonForScript(Path.resolve(targetDir, 'facility_upgrades.json'))],
    ['__NPC_ROSTER_JSON__', loadJsonForScript(Path.resolve(targetDir, 'npc_roster.json'))],
    ['__BASE_TASKS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'base_tasks.json'))],
    ['__VENDORS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'vendors.json'))],
    ['__SHOP_JSON__', loadJsonForScript(Path.resolve(targetDir, 'shop_inventory.json'))],
    ['__MISSIONS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'missions.json'))],
    ['__MAP_TILES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'map_tiles.json'))],
    ['__REGIONS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'regions.json'))],
    ['__WEATHER_JSON__', loadJsonForScript(Path.resolve(targetDir, 'weather_cycle.json'))],
    ['__CHAPTERS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'chapters.json'))],
    ['__DIALOGUES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'dialogues.json'))],
    ['__WEAPONS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'weapons.json'))],
    ['__ENEMIES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'enemies.json'))],
    ['__LOOT_JSON__', loadJsonForScript(Path.resolve(targetDir, 'loot_tables.json'))],
    ['__PHASES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'enemy_phases.json'))],
    ['__COMBAT_FORMULAS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'combat_formulas.json'))],
    ['__EVENTS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'events.json'))],
    ['__EXPOSURE_EVENTS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'exposure_events.json'))]
  ]);

  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [token, value] of replacements.entries()) {
    html = html.replace(new RegExp(token, 'g'), value);
  }

  const destPath = Path.resolve(targetDir, 'index.html');
  fs.writeFileSync(destPath, html, 'utf8');
  console.log(`[neon-aberration] wrote web demo to ${destPath}`);
}

function loadJsonForScript(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[neon-aberration] ${filePath} missing, injecting null`);
    return 'null';
  }
  const json = fs.readJsonSync(filePath);
  return JSON.stringify(json, null, 2).replace(/</g, '\\u003c');
}
