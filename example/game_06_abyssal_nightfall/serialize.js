const Path = require('path');
const fs = require('fs-extra');
const {
  serialize,
  serializeContext,
  loadContext,
  jsonSerializer,
  tsSerializer,
  tsInterfaceSerializer,
  jsonxSerializer
} = require('../..');

const baseDir = __dirname;
const outDir = Path.resolve(baseDir, 'out');

const tables = [
  { file: 'operators.xlsx', stem: 'operators' },
  { file: 'weapons.xlsx', stem: 'weapons' },
  { file: 'relics.xlsx', stem: 'relics' },
  { file: 'enemies.xlsx', stem: 'enemies' },
  { file: 'bosses.xlsx', stem: 'bosses' },
  { file: 'waves.xlsx', stem: 'waves' }
];

const serializerEntries = [
  { getFileName: stem => `${stem}.json`, serializer: jsonSerializer },
  { getFileName: stem => `${stem}.jsonx`, serializer: jsonxSerializer },
  { getFileName: stem => `${stem}.ts`, serializer: tsSerializer },
  { getFileName: stem => `${stem}Interface.ts`, serializer: tsInterfaceSerializer }
];

function main() {
  fs.ensureDirSync(outDir);
  const context = loadContext(baseDir);
  const serializerList = serializerEntries.map(entry => entry.serializer);
  serializeContext(outDir, serializerList, context);

  for (const { file, stem } of tables) {
    const src = Path.resolve(baseDir, file);
    if (!fs.existsSync(src)) {
      console.warn(`[abyssal-nightfall] skip missing ${file}`);
      continue;
    }
    const serializerMap = serializerEntries.reduce((acc, entry) => {
      acc[entry.getFileName(stem)] = entry.serializer;
      return acc;
    }, {});
    serialize(src, outDir, serializerMap, context);
    console.log(`[abyssal-nightfall] serialized ${file}`);
  }

  writeWebDemo(outDir);
  console.log(`[abyssal-nightfall] artifacts written to ${outDir}`);
}

function writeWebDemo(targetDir) {
  const templatePath = Path.resolve(baseDir, 'ui/index.html');
  if (!fs.existsSync(templatePath)) {
    console.warn('[abyssal-nightfall] ui/index.html not found, skip web demo generation');
    return;
  }

  const replacements = new Map([
    ['__OPERATORS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'operators.json'))],
    ['__WEAPONS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'weapons.json'))],
    ['__RELICS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'relics.json'))],
    ['__ENEMIES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'enemies.json'))],
    ['__BOSSES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'bosses.json'))],
    ['__WAVES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'waves.json'))]
  ]);

  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [token, value] of replacements.entries()) {
    html = html.replace(new RegExp(token, 'g'), value);
  }

  const destPath = Path.resolve(targetDir, 'index.html');
  fs.writeFileSync(destPath, html, 'utf8');
  console.log('[abyssal-nightfall] wrote web demo index.html');
}

function loadJsonForScript(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[abyssal-nightfall] ${filePath} missing, inject null`);
    return 'null';
  }
  const json = fs.readJsonSync(filePath);
  return JSON.stringify(json, null, 2).replace(/</g, '\\u003c');
}

main();
