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

const tables = [
  { file: 'producers.xlsx', stem: 'producers' },
  { file: 'upgrades.xlsx', stem: 'upgrades' },
  { file: 'achievements.xlsx', stem: 'achievements' },
  { file: 'artifacts.xlsx', stem: 'artifacts' },
  { file: 'global_config.xlsx', stem: 'global_config' }
]

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

  for (const { file, stem } of tables) {
    const src = Path.resolve(baseDir, file)
    const serializerMap = serializerConfigs.reduce((acc, cfg) => {
      acc[cfg.getFileName(stem)] = cfg.serializer
      return acc
    }, {})
    serialize(src, outDir, serializerMap, context)
    console.log(`[click-cookies] serialized ${file}`)
  }

  writeWebDemo(outDir)
  console.log(`[click-cookies] artifacts written to ${outDir}`)
}

function writeWebDemo(targetDir) {
  const templatePath = Path.resolve(baseDir, 'ui/index.html')
  if (!fs.existsSync(templatePath)) {
    console.warn('[click-cookies] ui/index.html not found, skip web demo generation')
    return
  }

  const replacements = new Map([
    ['__PRODUCERS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'producers.json'))],
    ['__UPGRADES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'upgrades.json'))],
    ['__ACHIEVEMENTS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'achievements.json'))],
    ['__ARTIFACTS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'artifacts.json'))],
    ['__GLOBAL_JSON__', loadJsonForScript(Path.resolve(targetDir, 'global_config.json'))]
  ])

  let html = fs.readFileSync(templatePath, 'utf8')
  for (const [token, value] of replacements) {
    html = html.replace(new RegExp(token, 'g'), value)
  }

  fs.writeFileSync(Path.resolve(targetDir, 'index.html'), html)
  console.log('[click-cookies] wrote web demo index.html')
}

function loadJsonForScript(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[click-cookies] ${filePath} missing, injecting null`)
    return 'null'
  }
  const json = fs.readJsonSync(filePath)
  return JSON.stringify(json, null, 2).replace(/</g, '\\u003c')
}

main()
