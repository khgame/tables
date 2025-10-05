const Path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
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
  { file: 'waves.xlsx', stem: 'waves' },
  { file: 'skill_tree.xlsx', stem: 'skill_tree' },
  { file: 'synergy_cards.xlsx', stem: 'synergy_cards' }
];

const serializerEntries = [
  { getFileName: stem => `${stem}.json`, serializer: jsonSerializer },
  { getFileName: stem => `${stem}.jsonx`, serializer: jsonxSerializer },
  { getFileName: stem => `${stem}Solution.ts`, serializer: tsSerializer },
  { getFileName: stem => `${stem}.ts`, serializer: tsInterfaceSerializer }
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

  compileUiScripts();
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
    ['__WAVES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'waves.json'))],
    ['__SKILLTREE_JSON__', loadJsonForScript(Path.resolve(targetDir, 'skill_tree.json'))],
    ['__SYNERGY_JSON__', loadJsonForScript(Path.resolve(targetDir, 'synergy_cards.json'))]
  ]);

  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [token, value] of replacements.entries()) {
    html = html.replace(new RegExp(token, 'g'), value);
  }

  const destPath = Path.resolve(targetDir, 'index.html');
  fs.writeFileSync(destPath, html, 'utf8');
  console.log('[abyssal-nightfall] wrote web demo index.html');

  const engineHtml = Path.resolve(baseDir, 'ui/engine.html');
  if (fs.existsSync(engineHtml)) {
    fs.copyFileSync(engineHtml, Path.resolve(targetDir, 'engine.html'));
  }
  const assetsSrc = Path.resolve(baseDir, 'ui/assets');
  if (fs.existsSync(assetsSrc)) {
    const uiAssetsTarget = Path.resolve(targetDir, 'ui/assets');
    fs.copySync(assetsSrc, uiAssetsTarget, { overwrite: true });

    const rootAssetsTarget = Path.resolve(targetDir, 'assets');
    fs.copySync(assetsSrc, rootAssetsTarget, { overwrite: true });

    const fxDir = Path.resolve(assetsSrc, 'fx');
    if (fs.existsSync(fxDir)) {
      fs.copySync(fxDir, Path.resolve(targetDir, 'fx'), { overwrite: true });
    }
    const iconsDir = Path.resolve(assetsSrc, 'icons');
    if (fs.existsSync(iconsDir)) {
      fs.copySync(iconsDir, Path.resolve(targetDir, 'icons'), { overwrite: true });
    }
  }
}

function compileUiScripts() {
  const projectPath = Path.resolve(baseDir, 'ui/tsconfig.json');
  if (!fs.existsSync(projectPath)) {
    console.warn('[abyssal-nightfall] ui/tsconfig.json missing, skip TS compilation');
    return;
  }
  console.log('[abyssal-nightfall] compiling UI TypeScript');
  execSync(`npx tsc --project "${projectPath}"`, { stdio: 'inherit', cwd: baseDir });
  const scriptsDir = Path.resolve(baseDir, 'out/scripts');
  fixImportExtensions(scriptsDir);
}

function fixImportExtensions(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = Path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      fixImportExtensions(fullPath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    let content = fs.readFileSync(fullPath, 'utf8');
    const updated = content
      .replace(/(import\s+[^'";]+?from\s+['"])(\.{1,2}\/[^'";]+?)(['"])/g, (_, prefix, spec, suffix) => `${prefix}${appendJsExtension(spec)}${suffix}`)
      .replace(/(export\s+[^'";]+?from\s+['"])(\.{1,2}\/[^'";]+?)(['"])/g, (_, prefix, spec, suffix) => `${prefix}${appendJsExtension(spec)}${suffix}`)
      .replace(/(import\(\s*['"])(\.{1,2}\/[^'";]+?)(['"]\s*\))/g, (_, prefix, spec, suffix) => `${prefix}${appendJsExtension(spec)}${suffix}`);
    if (updated !== content) {
      fs.writeFileSync(fullPath, updated, 'utf8');
    }
  }
}

function appendJsExtension(spec) {
  if (spec.endsWith('.js') || spec.endsWith('.json') || spec.endsWith('.css')) return spec;
  return `${spec}.js`;
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
