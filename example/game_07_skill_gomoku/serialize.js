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

const tableStems = ['cards', 'characters', 'states']

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

  console.log(`[game07] artifacts written to ${outDir}`)
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
