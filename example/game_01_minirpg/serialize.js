const Path = require('path')
const fs = require('fs-extra')
const {
  serialize,
  serializeContext,
  loadContext,
  jsonSerializer,
  tsSerializer,
  tsInterfaceSerializer
} = require('../..')

const baseDir = __dirname
const outDir = Path.resolve(baseDir, 'out')

const tableStems = ['heroes', 'skills', 'items', 'enemies', 'stages', 'relics', 'global_config']

function resolveSourceFile(stem) {
  const candidates = [`${stem}.csv`, `${stem}.xlsx`]
  for (const candidate of candidates) {
    const fullPath = Path.resolve(baseDir, candidate)
    if (fs.existsSync(fullPath)) return candidate
  }
  throw new Error(`[minirpg] missing source table for ${stem}, expected one of ${candidates.join(', ')}`)
}

const serializerConfigs = [
  {
    getFileName: stem => `${stem}.json`,
    serializer: jsonSerializer
  },
  {
    getFileName: stem => `${stem}Solution.ts`,
    serializer: tsSerializer
  },
  {
    getFileName: stem => `${stem}.ts`,
    serializer: tsInterfaceSerializer
  }
]

function main() {
  fs.ensureDirSync(outDir)
  const context = loadContext(baseDir)
  const serializerList = serializerConfigs.map(({ serializer }) => serializer)
  serializeContext(outDir, serializerList, context)

  for (const stem of tableStems) {
    const file = resolveSourceFile(stem)
    const src = Path.resolve(baseDir, file)
    const serializerMap = serializerConfigs.reduce((acc, cfg) => {
      acc[cfg.getFileName(stem)] = cfg.serializer
      return acc
    }, {})
    serialize(src, outDir, serializerMap, context)
    console.log(`[minirpg] serialized ${file}`)
  }

  writeWebDemo(outDir)

  console.log(`[minirpg] artifacts written to ${outDir}`)
}

function writeWebDemo(targetDir) {
  const templatePath = Path.resolve(baseDir, 'ui/index.html')
  if (!fs.existsSync(templatePath)) {
    console.warn('[minirpg] ui/index.html not found, skip web demo generation')
    return
  }

  const replacements = new Map([
    ['__HEROES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'heroes.json'))],
    ['__SKILLS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'skills.json'))],
    ['__ITEMS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'items.json'))],
    ['__ENEMIES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'enemies.json'))],
    ['__RELICS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'relics.json'))],
    ['__STAGES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'stages.json'))],
    ['__GLOBAL_JSON__', loadJsonForScript(Path.resolve(targetDir, 'global_config.json'))]
  ])

  let html = fs.readFileSync(templatePath, 'utf8')
  for (const [token, value] of replacements.entries()) {
    if (!value) continue
    html = html.replace(new RegExp(token, 'g'), value)
  }

  const destPath = Path.resolve(targetDir, 'index.html')
  fs.writeFileSync(destPath, html)
  console.log(`[minirpg] wrote web demo to ${destPath}`)
}

function loadJsonForScript(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[minirpg] ${filePath} missing, placeholder left empty`)
    return 'null'
  }
  const json = fs.readJsonSync(filePath)
  return JSON.stringify(json, null, 2).replace(/</g, '\\u003c')
}

main()
