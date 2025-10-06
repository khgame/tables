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

const tableStems = ['cards', 'characters']

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

function resolveSourceFile(stem) {
  const candidate = `${stem}.csv`
  const fullPath = Path.resolve(baseDir, candidate)
  if (fs.existsSync(fullPath)) return fullPath
  throw new Error(`[game07] missing source table for ${stem}, expected ${candidate}`)
}

function writeArtifacts() {
  fs.ensureDirSync(outDir)
  const context = loadContext(baseDir)
  const serializerList = serializerConfigs.map(({ serializer }) => serializer)
  serializeContext(outDir, serializerList, context)

  for (const stem of tableStems) {
    const src = resolveSourceFile(stem)
    const serializerMap = serializerConfigs.reduce((acc, cfg) => {
      acc[cfg.getFileName(stem)] = cfg.serializer
      return acc
    }, {})
    serialize(src, outDir, serializerMap, context)
    console.log(`[game07] serialized ${Path.basename(src)}`)
  }

  writeWebDemo(outDir)
  console.log(`[game07] artifacts written to ${outDir}`)
}

function writeWebDemo(targetDir) {
  const templatePath = Path.resolve(baseDir, 'ui/index.html')
  if (!fs.existsSync(templatePath)) {
    console.warn('[game07] ui/index.html not found, skip web demo generation')
    return
  }

  const replacements = new Map([
    ['__CARDS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'cards.json'))],
    ['__CHARACTERS_JSON__', loadJsonForScript(Path.resolve(targetDir, 'characters.json'))]
  ])

  let html = fs.readFileSync(templatePath, 'utf8')
  for (const [token, value] of replacements.entries()) {
    if (!value) continue
    html = html.replace(new RegExp(token, 'g'), value)
  }

  const destPath = Path.resolve(targetDir, 'index.html')
  fs.writeFileSync(destPath, html)
  console.log(`[game07] wrote web demo to ${destPath}`)
}

function loadJsonForScript(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[game07] ${filePath} missing, placeholder left empty`)
    return 'null'
  }
  const json = fs.readJsonSync(filePath)
  return JSON.stringify(json, null, 2).replace(/</g, '\\u003c')
}

if (require.main === module) {
  try {
    writeArtifacts()
  } catch (error) {
    console.error('[game07] serialization failed:', error)
    process.exitCode = 1
  }
}

module.exports = {
  writeArtifacts
}
