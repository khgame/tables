const Path = require('path')
const XLSX = require('xlsx')
const fs = require('fs')

const base = Path.resolve(__dirname)
if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })

function writeSheet(name, rows) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, '__data')
  XLSX.writeFile(wb, Path.join(base, name))
}

const RESOURCE_KEYS = ['wood', 'fur', 'meat', 'leather', 'charcoal', 'iron', 'steel', 'warmth', 'supplies']

const TID = {
  resource: {
    warmth: 10000001,
    wood: 10000002,
    fur: 10000003,
    meat: 10000004,
    leather: 10000005,
    charcoal: 10000006,
    iron: 10000007,
    steel: 10000008,
    villagers: 10000009,
    supplies: 10000010
  },
  job: {
    gatherer: 20000001,
    trapper: 20000002,
    hunter: 20000003,
    charcoal_burner: 20000004,
    tanner: 20000005,
    smelter: 20000006
  },
  building: {
    hut: 30000001,
    trap: 30000002,
    smokehouse: 30000003,
    workshop: 30000004,
    foundry: 30000005,
    caravanserai: 30000006
  },
  action: {
    stoke_fire: 40000001,
    gather_wood: 40000002,
    check_traps: 40000003,
    prepare_rations: 40000004,
    craft_charcoal: 40000005,
    craft_steel: 40000006,
    trade_with_caravan: 40000007
  },
  event: {
    stranger_fire: 50000001,
    settler_arrives: 50000002,
    embers_fading: 50000003,
    caravan_returns: 50000004,
    wolves_circle: 50000005
  },
  config: {
    baseTickSeconds: 90000001,
    offlineCapSeconds: 90000002,
    autosaveInterval: 90000003,
    initialWarmth: 90000004,
    initialWood: 90000005,
    initialVillagers: 90000006,
    logLimit: 90000007,
    maxJobRatio: 90000008,
    fireCriticalThreshold: 90000009,
    gatherWoodGain: 90000010,
    stokeFireGain: 90000011
  },
  achievement: {
    sparkShelter: 60000001,
    villageAwakens: 60000002
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : value != null ? [value] : []
}

function getByPath(row, path) {
  if (!path) return ''
  if (typeof path === 'function') return path(row)
  const chain = Array.isArray(path) ? path : String(path).split('.')
  let cur = row
  for (const key of chain) {
    if (cur == null) return ''
    cur = cur[key]
  }
  return cur == null ? '' : cur
}

function buildSheet({ name, columns, rows }) {
  const headerRow = columns.map(col => col.header || '')
  const markRow = columns.map(col => col.mark || '')
  const descRow = columns.map(col => col.desc || '')
  const table = [headerRow, markRow, descRow]
  rows.forEach(row => {
    table.push(columns.map(col => {
      const value = getByPath(row, col.path || col.getter)
      if (value === undefined || value === null || value === '') return undefined
      return value
    }))
  })
  writeSheet(name, table)
}

// resources
const resourcesData = [
  { tid: TID.resource.warmth, sequence: 1, key: 'warmth', label: '炉火', description: '保持营地温暖，会随时间缓慢衰减。', baseRate: 0, decayRate: -0.08, baseCapacity: 120, maxCapacity: 200, displayOrder: 1 },
  { tid: TID.resource.wood, sequence: 2, key: 'wood', label: '木材', description: '点燃营火与建造结构的基础资源。', baseRate: 0, decayRate: 0, baseCapacity: 400, maxCapacity: 800, displayOrder: 2 },
  { tid: TID.resource.fur, sequence: 3, key: 'fur', label: '兽皮', description: '来自捕猎，用于取暖与制作皮革。', baseRate: 0, decayRate: 0, baseCapacity: 240, maxCapacity: 480, displayOrder: 3 },
  { tid: TID.resource.meat, sequence: 4, key: 'meat', label: '肉类', description: '猎物带回的肉，可供烹煮或换取口粮。', baseRate: 0, decayRate: 0, baseCapacity: 240, maxCapacity: 480, displayOrder: 4 },
  { tid: TID.resource.leather, sequence: 5, key: 'leather', label: '皮革', description: '经处理的兽皮，可加工装备与建筑材料。', baseRate: 0, decayRate: 0, baseCapacity: 180, maxCapacity: 360, displayOrder: 5 },
  { tid: TID.resource.charcoal, sequence: 6, key: 'charcoal', label: '木炭', description: '高温冶炼所需，由木材闷烧而成。', baseRate: 0, decayRate: 0, baseCapacity: 180, maxCapacity: 360, displayOrder: 6 },
  { tid: TID.resource.iron, sequence: 7, key: 'iron', label: '生铁', description: '从荒野搜集的铁料，可进一步冶炼。', baseRate: 0, decayRate: 0, baseCapacity: 140, maxCapacity: 280, displayOrder: 7 },
  { tid: TID.resource.steel, sequence: 8, key: 'steel', label: '精钢', description: '冶炼后的优质钢材，可制作利器与建筑。', baseRate: 0, decayRate: 0, baseCapacity: 120, maxCapacity: 240, displayOrder: 8 },
  { tid: TID.resource.villagers, sequence: 9, key: 'villagers', label: '村民', description: '愿意留下的幸存者，可分配至各项工作。', baseRate: 0, decayRate: 0, baseCapacity: 4, maxCapacity: 60, displayOrder: 0 },
  { tid: TID.resource.supplies, sequence: 10, key: 'supplies', label: '口粮', description: '远征与商队所需的补给。', baseRate: 0, decayRate: 0, baseCapacity: 120, maxCapacity: 240, displayOrder: 9 }
]

buildSheet({
  name: 'resources.xlsx',
  columns: [
    { header: 'TID', mark: '@', desc: 'tid', path: 'tid' },
    { header: 'Resource Key', mark: 'string', desc: 'key', path: 'key' },
    { header: 'Label', mark: 'string', desc: 'label', path: 'label' },
    { header: 'Description', mark: 'string', desc: 'description', path: 'description' },
    { header: 'Base Rate', mark: 'float', desc: 'baseRate', path: 'baseRate' },
    { header: 'Decay Rate', mark: 'float', desc: 'decayRate', path: 'decayRate' },
    { header: 'Base Capacity', mark: 'float', desc: 'baseCapacity', path: 'baseCapacity' },
    { header: 'Max Capacity', mark: 'float', desc: 'maxCapacity', path: 'maxCapacity' },
    { header: 'Sequence', mark: 'uint', desc: 'sequence', path: 'sequence' },
    { header: 'Display Order', mark: 'uint', desc: 'displayOrder', path: 'displayOrder' }
  ],
  rows: resourcesData
})

const jobsData = [
  {
    tid: TID.job.gatherer,
    key: 'gatherer',
    label: '采集者',
    description: '在废墟间拾取木材。',
    produces: { wood: 0.6 },
    consumes: {},
    baseRate: 1,
    baseCap: 2,
    unlock: {}
  },
  {
    tid: TID.job.trapper,
    key: 'trapper',
    label: '设陷者',
    description: '布设陷阱，零星获取肉与兽皮。',
    produces: { meat: 0.25, fur: 0.2 },
    consumes: {},
    baseRate: 1,
    baseCap: 0,
    unlock: { building: TID.building.trap }
  },
  {
    tid: TID.job.hunter,
    key: 'hunter',
    label: '猎人',
    description: '与猎犬出行，稳定带回肉与皮毛。',
    produces: { meat: 0.45, fur: 0.3 },
    consumes: { warmth: 0.02 },
    baseRate: 1,
    baseCap: 0,
    unlock: { resource: 'warmth', min: 80, building: TID.building.hut }
  },
  {
    tid: TID.job.charcoal_burner,
    key: 'charcoal_burner',
    label: '烧炭者',
    description: '消耗木材以制得木炭。',
    produces: { charcoal: 0.55 },
    consumes: { wood: 1.1 },
    baseRate: 1,
    baseCap: 0,
    unlock: { building: TID.building.workshop }
  },
  {
    tid: TID.job.tanner,
    key: 'tanner',
    label: '制革匠',
    description: '处理兽皮，制得皮革。',
    produces: { leather: 0.28 },
    consumes: { fur: 0.6 },
    baseRate: 1,
    baseCap: 0,
    unlock: { building: TID.building.workshop }
  },
  {
    tid: TID.job.smelter,
    key: 'smelter',
    label: '熔炼师',
    description: '燃烧木炭冶炼钢材。',
    produces: { steel: 0.12 },
    consumes: { charcoal: 0.5, iron: 0.25 },
    baseRate: 1,
    baseCap: 0,
    unlock: { building: TID.building.foundry }
  }
]

buildSheet({
  name: 'jobs.xlsx',
  columns: [
    { header: 'TID', mark: '@', desc: 'tid', path: 'tid' },
    { header: 'Job Key', mark: 'string', desc: 'key', path: 'key' },
    { header: 'Label', mark: 'string', desc: 'label', path: 'label' },
    { header: 'Description', mark: 'string', desc: 'description', path: 'description' },
    { header: 'Produces', mark: '{', desc: 'produces' },
    ...RESOURCE_KEYS.map(name => ({ header: `Produces ${name}`, mark: 'float?', desc: name, getter: row => row.produces?.[name] })),
    { header: '', mark: '}' },
    { header: 'Consumes', mark: '{', desc: 'consumes' },
    ...RESOURCE_KEYS.map(name => ({ header: `Consumes ${name}`, mark: 'float?', desc: name, getter: row => row.consumes?.[name] })),
    { header: '', mark: '}' },
    { header: 'Base Rate', mark: 'float', desc: 'baseRate', path: 'baseRate' },
    { header: 'Base Cap', mark: 'float', desc: 'baseCap', path: 'baseCap' },
    { header: 'Unlock', mark: '{', desc: 'unlock' },
    { header: 'Unlock Building', mark: 'uint?', desc: 'building', getter: row => row.unlock?.building },
    { header: 'Unlock Building Count', mark: 'float?', desc: 'buildingCount', getter: row => row.unlock?.buildingCount },
    { header: 'Unlock Resource', mark: 'string?', desc: 'resource', getter: row => row.unlock?.resource },
    { header: 'Unlock Min', mark: 'float?', desc: 'min', getter: row => row.unlock?.min },
    { header: 'Unlock Max', mark: 'float?', desc: 'max', getter: row => row.unlock?.max },
    { header: 'Unlock Villagers', mark: 'uint?', desc: 'villagers', getter: row => row.unlock?.villagers },
    { header: 'Unlock Event', mark: 'uint?', desc: 'event', getter: row => row.unlock?.event },
    { header: '', mark: '}' }
  ],
  rows: jobsData
})

function createEffectColumns(slotCount, accessorFactory) {
  const columns = [{ header: 'Effects', mark: '[', desc: 'effects' }]
  for (let i = 0; i < slotCount; i++) {
    columns.push({ header: `Effect ${i + 1}`, mark: '$ghost {', desc: `effect${i + 1}` })
    columns.push({ header: `Effect ${i + 1} Type`, mark: 'string?', desc: 'type', getter: row => accessorFactory(row, i)?.type })
    columns.push({ header: `Effect ${i + 1} Resource`, mark: 'string?', desc: 'resource', getter: row => accessorFactory(row, i)?.resource })
    columns.push({ header: `Effect ${i + 1} Amount`, mark: 'float?', desc: 'amount', getter: row => accessorFactory(row, i)?.amount })
    columns.push({ header: `Effect ${i + 1} Building`, mark: 'uint?', desc: 'building', getter: row => accessorFactory(row, i)?.building })
    columns.push({ header: `Effect ${i + 1} Job`, mark: 'uint?', desc: 'job', getter: row => accessorFactory(row, i)?.job })
    columns.push({ header: `Effect ${i + 1} Action`, mark: 'uint?', desc: 'action', getter: row => accessorFactory(row, i)?.action })
    columns.push({ header: `Effect ${i + 1} Event`, mark: 'uint?', desc: 'event', getter: row => accessorFactory(row, i)?.event })
    columns.push({ header: `Effect ${i + 1} Message`, mark: 'string?', desc: 'message', getter: row => accessorFactory(row, i)?.message })
    columns.push({ header: '', mark: '}' })
  }
  columns.push({ header: '', mark: ']' })
  return columns
}

const buildingsData = [
  {
    tid: TID.building.hut,
    key: 'hut',
    label: '棚屋',
    description: '粗糙却温暖的住所，可吸引更多幸存者。',
    cost: { wood: 40, fur: 15 },
    costScaling: 0.28,
    effects: [
      { type: 'storage', resource: 'villagers', amount: 2 },
      { type: 'jobCap', job: TID.job.gatherer, amount: 1 },
      { type: 'jobCap', job: TID.job.hunter, amount: 0.5 },
      { type: 'event', event: TID.event.settler_arrives }
    ],
    unlock: { resource: 'warmth', min: 60 },
    buildTime: 18,
    repeatable: true,
    maxCount: 12
  },
  {
    tid: TID.building.trap,
    key: 'trap',
    label: '陷阱',
    description: '散落在林中的陷阱，提供稳定的猎物。',
    cost: { wood: 25 },
    costScaling: 0.22,
    effects: [
      { type: 'storage', resource: 'meat', amount: 20 },
      { type: 'storage', resource: 'fur', amount: 20 },
      { type: 'jobCap', job: TID.job.trapper, amount: 1 },
      { type: 'unlockJob', job: TID.job.trapper }
    ],
    unlock: { event: TID.event.stranger_fire, building: TID.building.hut, buildingCount: 1 },
    buildTime: 12,
    repeatable: true,
    maxCount: 16
  },
  {
    tid: TID.building.smokehouse,
    key: 'smokehouse',
    label: '熏肉房',
    description: '处理肉类，提高口粮储备。',
    cost: { wood: 65, meat: 20, fur: 10 },
    costScaling: 0.18,
    effects: [
      { type: 'storage', resource: 'supplies', amount: 60 },
      { type: 'jobCap', job: TID.job.hunter, amount: 1 },
      { type: 'unlockAction', action: TID.action.prepare_rations }
    ],
    unlock: { building: TID.building.trap, buildingCount: 1 },
    buildTime: 22,
    repeatable: false,
    maxCount: 2
  },
  {
    tid: TID.building.workshop,
    key: 'workshop',
    label: '工坊',
    description: '装备工具的工坊，开启加工工艺。',
    cost: { wood: 110, fur: 50, leather: 8 },
    costScaling: 0.2,
    effects: [
      { type: 'jobCap', job: TID.job.charcoal_burner, amount: 2 },
      { type: 'jobCap', job: TID.job.tanner, amount: 1.5 },
      { type: 'unlockJob', job: TID.job.charcoal_burner },
      { type: 'unlockJob', job: TID.job.tanner },
      { type: 'unlockAction', action: TID.action.craft_charcoal }
    ],
    unlock: { villagers: 4, building: TID.building.hut, buildingCount: 3 },
    buildTime: 28,
    repeatable: false,
    maxCount: 2
  },
  {
    tid: TID.building.foundry,
    key: 'foundry',
    label: '铸炉',
    description: '用于冶炼钢材的高温炉。',
    cost: { wood: 140, charcoal: 50, iron: 35 },
    costScaling: 0.22,
    effects: [
      { type: 'jobCap', job: TID.job.smelter, amount: 2 },
      { type: 'storage', resource: 'steel', amount: 60 },
      { type: 'unlockJob', job: TID.job.smelter },
      { type: 'unlockAction', action: TID.action.craft_steel }
    ],
    unlock: { building: TID.building.workshop, buildingCount: 1 },
    buildTime: 36,
    repeatable: false,
    maxCount: 2
  },
  {
    tid: TID.building.caravanserai,
    key: 'caravanserai',
    label: '商旅驿站',
    description: '接引游商，可交换稀缺物资。',
    cost: { wood: 160, leather: 25, steel: 10 },
    costScaling: 0.18,
    effects: [
      { type: 'storage', resource: 'supplies', amount: 120 },
      { type: 'jobCap', job: TID.job.hunter, amount: 1 },
      { type: 'unlockAction', action: TID.action.trade_with_caravan },
      { type: 'event', event: TID.event.caravan_returns }
    ],
    unlock: { resource: 'supplies', min: 40, building: TID.building.hut, buildingCount: 6 },
    buildTime: 32,
    repeatable: false,
    maxCount: 1
  }
]

buildSheet({
  name: 'buildings.xlsx',
  columns: [
    { header: 'TID', mark: '@', desc: 'tid', path: 'tid' },
    { header: 'Building Key', mark: 'string', desc: 'key', path: 'key' },
    { header: 'Label', mark: 'string', desc: 'label', path: 'label' },
    { header: 'Description', mark: 'string', desc: 'description', path: 'description' },
    { header: 'Cost', mark: '{', desc: 'cost' },
    ...RESOURCE_KEYS.map(name => ({ header: `Cost ${name}`, mark: 'float?', desc: name, getter: row => row.cost?.[name] })),
    { header: '', mark: '}' },
    { header: 'Cost Scaling', mark: 'float?', desc: 'costScaling', path: 'costScaling' },
    ...createEffectColumns(6, (row, idx) => toArray(row.effects)[idx] || null),
    { header: 'Unlock', mark: '{', desc: 'unlock' },
    { header: 'Unlock Building', mark: 'uint?', desc: 'building', getter: row => row.unlock?.building },
    { header: 'Unlock Resource', mark: 'string?', desc: 'resource', getter: row => row.unlock?.resource },
    { header: 'Unlock Min', mark: 'float?', desc: 'min', getter: row => row.unlock?.min },
    { header: 'Unlock Max', mark: 'float?', desc: 'max', getter: row => row.unlock?.max },
    { header: 'Unlock Villagers', mark: 'uint?', desc: 'villagers', getter: row => row.unlock?.villagers },
    { header: 'Unlock Event', mark: 'uint?', desc: 'event', getter: row => row.unlock?.event },
    { header: '', mark: '}' },
    { header: 'Build Time', mark: 'float', desc: 'buildTime', path: 'buildTime' },
    { header: 'Repeatable', mark: 'bool', desc: 'repeatable', path: 'repeatable' },
    { header: 'Max Count', mark: 'uint', desc: 'maxCount', path: 'maxCount' }
  ],
  rows: buildingsData
})

const actionsData = [
  { tid: TID.action.stoke_fire, key: 'stoke_fire', label: '添柴', description: '投掷木材保持炉火旺盛。', cooldown: 10, cost: { wood: 5 }, reward: { warmth: 30 }, unlock: {}, logStart: '把几根木柴塞进炉火。', logResult: '炉火腾起，驱散了刺骨的寒意。', offline: true },
  { tid: TID.action.gather_wood, key: 'gather_wood', label: '拾荒', description: '外出搜寻散落的木材。', cooldown: 6, cost: {}, reward: { wood: 7 }, unlock: {}, logStart: '你走入昏暗的林间。', logResult: '拖着沉重树枝回到了营地。', offline: true },
  { tid: TID.action.check_traps, key: 'check_traps', label: '巡查陷阱', description: '查看陷阱是否捕获猎物。', cooldown: 20, cost: {}, reward: { meat: 4, fur: 3 }, unlock: { building: TID.building.trap }, logStart: '你踏雪而行，沿途检查陷阱。', logResult: '几只小兽无力挣扎，被你顺手收好。', offline: true },
  { tid: TID.action.prepare_rations, key: 'prepare_rations', label: '熏制口粮', description: '在熏肉房制作耐储存的口粮。', cooldown: 30, cost: { meat: 6, leather: 1 }, reward: { supplies: 8 }, unlock: { building: TID.building.smokehouse }, logStart: '你将肉悬挂在低温的炉火旁。', logResult: '口粮被妥善封存，足以支撑远行。', offline: true },
  { tid: TID.action.craft_charcoal, key: 'craft_charcoal', label: '闷烧木炭', description: '将木材闷烧成木炭。', cooldown: 45, cost: { wood: 20 }, reward: { charcoal: 12 }, unlock: { building: TID.building.workshop }, logStart: '你用土壤封住炉膛。', logResult: '黑亮的木炭堆满炉旁。', offline: true },
  { tid: TID.action.craft_steel, key: 'craft_steel', label: '冶炼钢材', description: '在铸炉中冶炼精钢。', cooldown: 60, cost: { charcoal: 18, iron: 10 }, reward: { steel: 4 }, unlock: { building: TID.building.foundry }, logStart: '你把铁锭推入炽热的炉膛。', logResult: '精钢发出银蓝色的光泽。', offline: true },
  { tid: TID.action.trade_with_caravan, key: 'trade_with_caravan', label: '与商队交易', description: '花费口粮换取铁料与其他资源。', cooldown: 120, cost: { supplies: 12 }, reward: { iron: 8, charcoal: 6, fur: 10 }, unlock: { building: TID.building.caravanserai }, logStart: '你摆出准备好的物资等待商队。', logResult: '商人留下货物与故事，踏雪而去。', offline: false }
]

const achievementEffectsSlots = 4

const achievementsData = [
  {
    tid: TID.achievement.sparkShelter,
    key: 'spark_shelter',
    label: '火势渐旺',
    description: '将炉火升至 60 以上，村民提议搭建棚屋。',
    trigger: { resource: 'warmth', min: 60 },
    effects: [
      { type: 'unlockBuilding', building: TID.building.hut },
      { type: 'log', message: '篝火驱散寒意，大家提议搭起棚屋。' }
    ]
  },
  {
    tid: TID.achievement.villageAwakens,
    key: 'village_awakens',
    label: '村落初成',
    description: '建造至少两座棚屋，小村庄开始成形。',
    trigger: { building: TID.building.hut, buildingCount: 3 },
    effects: [
      { type: 'unlockBuilding', building: TID.building.smokehouse },
      { type: 'unlockBuilding', building: TID.building.workshop },
      { type: 'log', message: '村民们规划起烟房和工坊，为未来做准备。' }
    ]
  }
]

buildSheet({
  name: 'actions.xlsx',
  columns: [
    { header: 'TID', mark: '@', desc: 'tid', path: 'tid' },
    { header: 'Action Key', mark: 'string', desc: 'key', path: 'key' },
    { header: 'Label', mark: 'string', desc: 'label', path: 'label' },
    { header: 'Description', mark: 'string', desc: 'description', path: 'description' },
    { header: 'Cooldown Seconds', mark: 'float', desc: 'cooldown', path: 'cooldown' },
    { header: 'Cost', mark: '{', desc: 'cost' },
    ...RESOURCE_KEYS.map(name => ({ header: `Cost ${name}`, mark: 'float?', desc: name, getter: row => row.cost?.[name] })),
    { header: '', mark: '}' },
    { header: 'Reward', mark: '{', desc: 'reward' },
    ...RESOURCE_KEYS.map(name => ({ header: `Reward ${name}`, mark: 'float?', desc: name, getter: row => row.reward?.[name] })),
    { header: '', mark: '}' },
    { header: 'Unlock', mark: '{', desc: 'unlock' },
    { header: 'Unlock Building', mark: 'uint?', desc: 'building', getter: row => row.unlock?.building },
    { header: 'Unlock Resource', mark: 'string?', desc: 'resource', getter: row => row.unlock?.resource },
    { header: 'Unlock Min', mark: 'float?', desc: 'min', getter: row => row.unlock?.min },
    { header: 'Unlock Villagers', mark: 'uint?', desc: 'villagers', getter: row => row.unlock?.villagers },
    { header: 'Unlock Event', mark: 'uint?', desc: 'event', getter: row => row.unlock?.event },
    { header: '', mark: '}' },
    { header: 'Log Start', mark: 'string', desc: 'logStart', path: 'logStart' },
    { header: 'Log Complete', mark: 'string', desc: 'logResult', path: 'logResult' },
    { header: 'Offline Eligible', mark: 'bool', desc: 'offline', path: 'offline' }
  ],
  rows: actionsData
})

const eventEffectsSlots = 3

const eventsData = [
  { tid: TID.event.stranger_fire, key: 'stranger_fire', label: '结霜的旅人', description: '炉火吸引了一名瑟瑟发抖的陌生人。', trigger: { resource: 'warmth', min: 60 }, effects: [{ type: 'resource', resource: 'villagers', amount: 1 }], cooldownSeconds: 600, once: true, log: '陌生人蜷缩在火旁，慢慢伸出双手烤火。' },
  { tid: TID.event.settler_arrives, key: 'settler_arrives', label: '新的居民', description: '有人在棚屋里安顿下来。', trigger: { building: TID.building.hut }, effects: [{ type: 'resource', resource: 'villagers', amount: 1 }], cooldownSeconds: 300, once: false, log: '有人敲了敲门，想留在这里。' },
  { tid: TID.event.embers_fading, key: 'embers_fading', label: '余烬渐息', description: '火势低迷时，人们瑟瑟发抖。', trigger: { resource: 'warmth', max: 25 }, effects: [{ type: 'log', message: '炉火濒临熄灭，必须添柴。' }], cooldownSeconds: 180, once: false, log: '寒风灌入营地，大家不安地望向你。' },
  { tid: TID.event.caravan_returns, key: 'caravan_returns', label: '商队消息', description: '驿站传来消息，一支商队靠近。', trigger: { building: TID.building.caravanserai }, effects: [{ type: 'log', message: '商队抵达，他们乐于交换口粮与补给。' }], cooldownSeconds: 900, once: true, log: '商队在营地外搭起了帐篷。' },
  { tid: TID.event.wolves_circle, key: 'wolves_circle', label: '狼群盘旋', description: '储备过多肉类会引来狼群。', trigger: { resource: 'meat', min: 180 }, effects: [
    { type: 'resource', resource: 'meat', amount: -20 },
    { type: 'log', message: '夜里传来低嚎，第二天肉少了一些。' }
  ], cooldownSeconds: 420, once: false, log: '黎明时，雪地里出现了狼爪的痕迹。' }
]

buildSheet({
  name: 'events.xlsx',
  columns: [
    { header: 'TID', mark: '@', desc: 'tid', path: 'tid' },
    { header: 'Event Key', mark: 'string', desc: 'key', path: 'key' },
    { header: 'Label', mark: 'string', desc: 'label', path: 'label' },
    { header: 'Description', mark: 'string', desc: 'description', path: 'description' },
    { header: 'Trigger', mark: '{', desc: 'trigger' },
    { header: 'Trigger Resource', mark: 'string?', desc: 'resource', getter: row => row.trigger?.resource },
    { header: 'Trigger Building', mark: 'uint?', desc: 'building', getter: row => row.trigger?.building },
    { header: 'Trigger Event', mark: 'uint?', desc: 'event', getter: row => row.trigger?.event },
    { header: 'Trigger Villagers', mark: 'uint?', desc: 'villagers', getter: row => row.trigger?.villagers },
    { header: 'Trigger Min', mark: 'float?', desc: 'min', getter: row => row.trigger?.min },
    { header: 'Trigger Max', mark: 'float?', desc: 'max', getter: row => row.trigger?.max },
    { header: 'Trigger Supplies', mark: 'float?', desc: 'supplies', getter: row => row.trigger?.supplies },
    { header: '', mark: '}' },
    ...createEffectColumns(eventEffectsSlots, (row, idx) => toArray(row.effects)[idx] || null),
    { header: 'Cooldown Seconds', mark: 'float', desc: 'cooldown', path: 'cooldownSeconds' },
    { header: 'Once', mark: 'bool', desc: 'once', path: 'once' },
    { header: 'Log Message', mark: 'string', desc: 'log', path: 'log' }
  ],
  rows: eventsData
})

buildSheet({
  name: 'achievements.xlsx',
  columns: [
    { header: 'TID', mark: '@', desc: 'tid', path: 'tid' },
    { header: 'Achievement Key', mark: 'string', desc: 'key', path: 'key' },
    { header: 'Label', mark: 'string', desc: 'label', path: 'label' },
    { header: 'Description', mark: 'string', desc: 'description', path: 'description' },
    { header: 'Trigger', mark: '{', desc: 'trigger' },
    { header: 'Trigger Resource', mark: 'string?', desc: 'resource', getter: row => row.trigger?.resource },
    { header: 'Trigger Min', mark: 'float?', desc: 'min', getter: row => row.trigger?.min },
    { header: 'Trigger Max', mark: 'float?', desc: 'max', getter: row => row.trigger?.max },
    { header: 'Trigger Villagers', mark: 'uint?', desc: 'villagers', getter: row => row.trigger?.villagers },
    { header: 'Trigger Building', mark: 'uint?', desc: 'building', getter: row => row.trigger?.building },
    { header: 'Trigger Building Count', mark: 'float?', desc: 'buildingCount', getter: row => row.trigger?.buildingCount },
    { header: '', mark: '}' },
    ...createEffectColumns(achievementEffectsSlots, (row, idx) => toArray(row.effects)[idx] || null)
  ],
  rows: achievementsData
})

const configData = [
  { tid: TID.config.baseTickSeconds, sequence: 1, key: 'baseTickSeconds', valueType: 'Float', value: 1, description: '主循环每秒运行一次。' },
  { tid: TID.config.offlineCapSeconds, sequence: 2, key: 'offlineCapSeconds', valueType: 'UInt', value: 21600, description: '离线结算上限（秒）。' },
  { tid: TID.config.autosaveInterval, sequence: 3, key: 'autosaveInterval', valueType: 'UInt', value: 30, description: '自动保存间隔（秒）。' },
  { tid: TID.config.initialWarmth, sequence: 4, key: 'initialWarmth', valueType: 'Float', value: 42, description: '初始炉火值。' },
  { tid: TID.config.initialWood, sequence: 5, key: 'initialWood', valueType: 'Float', value: 12, description: '初始木材。' },
  { tid: TID.config.initialVillagers, sequence: 6, key: 'initialVillagers', valueType: 'UInt', value: 1, description: '初始村民数量。' },
  { tid: TID.config.logLimit, sequence: 7, key: 'logLimit', valueType: 'UInt', value: 120, description: '日志保留数量。' },
  { tid: TID.config.maxJobRatio, sequence: 8, key: 'maxJobRatio', valueType: 'Float', value: 0.95, description: '可分配的村民上限比例。' },
  { tid: TID.config.fireCriticalThreshold, sequence: 9, key: 'fireCriticalThreshold', valueType: 'Float', value: 25, description: '炉火警告阈值。' },
  { tid: TID.config.gatherWoodGain, sequence: 10, key: 'gatherWoodGain', valueType: 'Float', value: 7, description: '手动拾荒获得的木材。' },
  { tid: TID.config.stokeFireGain, sequence: 11, key: 'stokeFireGain', valueType: 'Float', value: 30, description: '添柴获得的炉火。' }
]

buildSheet({
  name: 'global_config.xlsx',
  columns: [
    { header: 'TID', mark: '@', desc: 'tid', path: 'tid' },
    { header: 'Sequence', mark: 'uint', desc: 'sequence', path: 'sequence' },
    { header: 'Key', mark: 'string', desc: 'key', path: 'key' },
    { header: 'Value Type', mark: 'string', desc: 'valueType', path: 'valueType' },
    { header: 'Value', mark: 'string', desc: 'value', path: 'value' },
    { header: 'Description', mark: 'string', desc: 'description', path: 'description' }
  ],
  rows: configData
})

fs.writeFileSync(Path.join(base, 'context.enums.json'), JSON.stringify({
  ActionKey: {
    StokeFire: TID.action.stoke_fire,
    GatherWood: TID.action.gather_wood,
    CheckTraps: TID.action.check_traps,
    PrepareRations: TID.action.prepare_rations,
    CraftCharcoal: TID.action.craft_charcoal,
    CraftSteel: TID.action.craft_steel,
    TradeWithCaravan: TID.action.trade_with_caravan
  },
  EventKey: {
    StrangerFire: TID.event.stranger_fire,
    SettlerArrives: TID.event.settler_arrives,
    EmbersFading: TID.event.embers_fading,
    CaravanReturns: TID.event.caravan_returns,
    WolvesCircle: TID.event.wolves_circle
  },
  JobKey: {
    Gatherer: TID.job.gatherer,
    Trapper: TID.job.trapper,
    Hunter: TID.job.hunter,
    CharcoalBurner: TID.job.charcoal_burner,
    Tanner: TID.job.tanner,
    Smelter: TID.job.smelter
  },
  BuildingKey: {
    Hut: TID.building.hut,
    Trap: TID.building.trap,
    Smokehouse: TID.building.smokehouse,
    Workshop: TID.building.workshop,
    Foundry: TID.building.foundry,
    Caravanserai: TID.building.caravanserai
  }
}, null, 2))

fs.writeFileSync(Path.join(base, 'context.meta.json'), JSON.stringify({
  exports: {
    enum: ['enums']
  }
}, null, 2))

console.log('Rebuilt a_dark_room sheets with structured data.')
