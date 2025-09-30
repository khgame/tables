const Path = require('path')
const fs = require('fs-extra')
const {
  serialize,
  serializeContext,
  loadContext,
  jsonSerializer,
  tsSerializer,
  tsInterfaceSerializer,
  jsonxSerializer
} = require('../..')

const baseDir = __dirname
const outDir = Path.resolve(baseDir, 'out')

const tables = [
  { file: 'chapters.xlsx', stem: 'chapters' },
  { file: 'map_templates.xlsx', stem: 'map_templates' },
  { file: 'classes.xlsx', stem: 'classes' },
  { file: 'heroes.xlsx', stem: 'heroes' },
  { file: 'skills.xlsx', stem: 'skills' },
  { file: 'skill_links.xlsx', stem: 'skill_links' },
  { file: 'enemies.xlsx', stem: 'enemies' },
  { file: 'enemy_ai.xlsx', stem: 'enemy_ai' },
  { file: 'rooms.xlsx', stem: 'rooms' },
  { file: 'events.xlsx', stem: 'events' },
  { file: 'relics.xlsx', stem: 'relics' },
  { file: 'equipment.xlsx', stem: 'equipment' },
  { file: 'facilities.xlsx', stem: 'facilities' },
  { file: 'research.xlsx', stem: 'research' },
  { file: 'economy.xlsx', stem: 'economy' },
  { file: 'tasks.xlsx', stem: 'tasks' },
  { file: 'achievements.xlsx', stem: 'achievements' }
]

function main() {
  fs.ensureDirSync(outDir)
  const context = loadContext(baseDir)

  const serializerList = [jsonSerializer, tsSerializer, tsInterfaceSerializer]
  serializeContext(outDir, serializerList, context)

  for (const { file, stem } of tables) {
    const src = Path.resolve(baseDir, file)
    if (!fs.existsSync(src)) {
      console.warn(`[arcane-depths] skip missing ${file}`)
      continue
    }
    const serializerMap = {
      [`${stem}.json`]: jsonSerializer,
      [`${stem}.jsonx`]: jsonxSerializer,
      [`${stem}.ts`]: tsSerializer,
      [`${stem}Interface.ts`]: tsInterfaceSerializer
    }
    serialize(src, outDir, serializerMap, context)
    console.log(`[arcane-depths] serialized ${file}`)
  }

  console.log(`[arcane-depths] artifacts written to ${outDir}`)
}

main()
