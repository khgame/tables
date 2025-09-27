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
  { file: 'heroes.xlsx', stem: 'heroes' },
  { file: 'skills.xlsx', stem: 'skills' },
  { file: 'items.xlsx', stem: 'items' },
  { file: 'stages.xlsx', stem: 'stages' },
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
    console.log(`[minirpg] serialized ${file}`)
  }

  console.log(`[minirpg] artifacts written to ${outDir}`)
}

main()
