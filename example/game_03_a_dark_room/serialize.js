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
  { file: 'achievements.xlsx', stem: 'achievements' },
  { file: 'resources.xlsx', stem: 'resources' },
  { file: 'jobs.xlsx', stem: 'jobs' },
  { file: 'buildings.xlsx', stem: 'buildings' },
  { file: 'actions.xlsx', stem: 'actions' },
  { file: 'events.xlsx', stem: 'events' },
  { file: 'global_config.xlsx', stem: 'global_config' }
]

function main() {
  fs.ensureDirSync(outDir)
  const context = loadContext(baseDir)
  const serializerList = [jsonSerializer, tsSerializer, tsInterfaceSerializer]
  serializeContext(outDir, serializerList, context)

  for (const { file, stem } of tables) {
    const src = Path.resolve(baseDir, file)
    const serializerMap = {
      [`${stem}.json`]: jsonSerializer,
      [`${stem}.ts`]: tsSerializer,
      [`${stem}Interface.ts`]: tsInterfaceSerializer
    }
    serialize(src, outDir, serializerMap, context)
    console.log(`[a-dark-room] serialized ${file}`)
  }

  writeWebDemo(outDir)
  console.log(`[a-dark-room] artifacts written to ${outDir}`)
}

function writeWebDemo(targetDir) {
  const uiDir = Path.resolve(baseDir, 'ui')
  if (!fs.existsSync(uiDir)) {
    console.warn('[a-dark-room] ui/ directory not found, skip web demo generation')
    return
  }

  const templatePath = Path.resolve(uiDir, 'index.html.modular')
  if (!fs.existsSync(templatePath)) {
    console.warn('[a-dark-room] ui/index.html.modular not found, skip web demo generation')
    return
  }

  // Copy all UI files
  const uiFiles = fs.readdirSync(uiDir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'))
  uiFiles.forEach(file => {
    const sourcePath = Path.resolve(uiDir, file)
    const targetName = file === 'app.jsx' ? 'app.new.jsx' : file
    fs.copyFileSync(sourcePath, Path.resolve(targetDir, targetName))
  })
  console.log(`[a-dark-room] copied ${uiFiles.length} UI modules to ${targetDir}`)

  // Process index.html with data injection
  const replacements = new Map([
    ['__ACHIEVEMENTS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'achievements.json'))],
    ['__RESOURCES_JSON__', loadJsonForScript(Path.resolve(targetDir, 'resources.json'))],
    ['__JOBS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'jobs.json'))],
    ['__BUILDINGS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'buildings.json'))],
    ['__ACTIONS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'actions.json'))],
    ['__EVENTS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'events.json'))],
    ['__GLOBAL_JSON__', loadJsonForScript(Path.resolve(targetDir, 'global_config.json'))]
  ])

  let html = fs.readFileSync(templatePath, 'utf8')
  for (const [token, value] of replacements) {
    html = html.replace(new RegExp(token, 'g'), value)
  }

  fs.writeFileSync(Path.resolve(targetDir, 'index.html'), html)
  console.log('[a-dark-room] wrote web demo index.html')
}

function loadJsonForScript(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[a-dark-room] ${filePath} missing, injecting null`)
    return 'null'
  }
  const json = fs.readJsonSync(filePath)
  return JSON.stringify(json, null, 2).replace(/</g, '\\u003c')
}

main()
