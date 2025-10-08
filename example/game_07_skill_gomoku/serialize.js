const Path = require('path')
const fs = require('fs-extra')
const { spawnSync } = require('child_process')
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
const uiDir = Path.resolve(baseDir, 'ui')
const publicDir = Path.resolve(uiDir, 'public')

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

function writeArtifacts(options = {}) {
  const { skipBuild = false } = options
  fs.ensureDirSync(outDir)
  fs.ensureDirSync(publicDir)
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

  copyDataToPublic()

  if (!skipBuild) {
    runViteBuild()
  }

  console.log(`[game07] artifacts available in ${outDir}`)
}

function copyDataToPublic() {
  for (const stem of tableStems) {
    const fileName = `${stem}.json`
    const sourcePath = Path.resolve(outDir, fileName)
    const publicPath = Path.resolve(publicDir, fileName)
    if (fs.existsSync(sourcePath)) {
      fs.copySync(sourcePath, publicPath)
    }
  }
}

function runViteBuild() {
  const configPath = Path.resolve(baseDir, 'vite.config.ts')
  const result = spawnSync('npx', ['vite', 'build', '--config', configPath], {
    stdio: 'inherit',
    cwd: Path.resolve(baseDir, '..', '..')
  })
  if (result.status !== 0) {
    throw new Error('[game07] Vite build failed')
  }
}

if (require.main === module) {
  try {
    const skipBuild = process.argv.includes('--skip-build') || process.argv.includes('--dev')
    writeArtifacts({ skipBuild })
  } catch (error) {
    console.error('[game07] serialization failed:', error)
    process.exitCode = 1
  }
}

module.exports = {
  writeArtifacts
}
