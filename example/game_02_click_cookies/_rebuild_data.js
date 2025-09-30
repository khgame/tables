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

// Buildings / producers
writeSheet('producers.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Producer Name', 'Description', 'Base Cost', 'Cost Growth', 'Base CPS', 'Icon', 'Unlock Cookies'],
  ['@', '@', '@', 'uint', 'string', 'string', 'uint', 'float', 'float', 'string', 'uint'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'desc', 'baseCost', 'costGrowth', 'baseCps', 'icon', 'unlockCookies'],
  ['60', '00', '0001', 1, 'Cursor', '雇佣手指自动点击，每个 +0.1 CPS。', 15, 1.15, 0.1, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f446.png', 0],
  ['60',  '00', '0002', 2, 'Grandma', '奶奶烘焙饼干，每个约 +0.6 CPS。', 100, 1.15, 0.6, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f475.png', 50],
  ['60', '00', '0003', 3, 'Farm', '种植饼干树，每个约 +6.5 CPS。', 1100, 1.15, 6.5, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f33e.png', 500],
  ['60', '00', '0004', 4, 'Mine', '开采饼干矿脉，每个约 +65 CPS。', 12000, 1.15, 65, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26cf.png', 6000],
  ['60', '00', '0005', 5, 'Factory', '批量生产饼干，每个约 +650 CPS。', 130000, 1.15, 650, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3ed.png', 65000],
  ['60', '00', '0006', 6, 'Bank', '资本运作，每个约 +7000 CPS。', 1400000, 1.15, 7000, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3e6.png', 500000],
  ['60', '00', '0007', 7, 'Temple', '奶奶祈祷，每个约 +85K CPS。', 20000000, 1.15, 85000, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3db.png', 7500000],
  ['60', '00', '0008', 8, 'Wizard Tower', '魔法师召唤饼干，每个约 +1.2M CPS。', 330000000, 1.15, 1200000, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f52e.png', 250000000],
  ['60', '00', '0009', 9, 'Shipment', '宇宙运输，每个约 +18M CPS。', 5100000000, 1.15, 18000000, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6f8.png', 1200000000],
  ['60', '00', '0010', 10, 'Portal', '跨维度门户，每个约 +260M CPS。', 75000000000, 1.15, 260000000, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f300.png', 60000000000],
  ['60', '00', '0011', 11, 'Time Machine', '扭曲时间，每个约 +3.2B CPS。', 1000000000000, 1.15, 3200000000, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f2.png', 400000000000],
  ['60', '00', '0012', 12, 'Antimatter Condenser', '凝聚物质，每个约 +42B CPS。', 14000000000000, 1.15, 42000000000, 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2728.png', 8000000000000]
])

// Upgrades
writeSheet('upgrades.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Upgrade Name', 'Target Producer', 'Upgrade Type', 'Value', 'Cost', 'Description', 'Icon', 'Unlock Cookies'],
  ['@', '@', '@', 'uint', 'string', 'tid', 'UpgradeType', 'float', 'uint', 'string', 'string', 'uint'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'target', 'upgradeType', 'value', 'cost', 'desc', 'icon', 'unlockCookies'],
  ['70', '00', '0001', 1, 'Reinforced Index Finger', 60000001, 'multiplier', 2.0, 80, '游标产出翻倍。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48e.png', 50],
  ['70', '00', '0002', 2, 'Forwards from Grandma', 60000002, 'multiplier', 2.0, 800, '奶奶烘焙速度翻倍。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9d3.png', 400],
  ['70', '00', '0003', 3, 'Steel Plows', 60000003, 'multiplier', 2.0, 9500, '农场效率翻倍。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6e0.png', 2500],
  ['70', '00', '0004', 4, 'Deep Drills', 60000004, 'multiplier', 2.0, 100000, '矿井深挖翻倍产出。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26cf.png', 60000],
  ['70', '00', '0005', 5, 'Assembly Line', 60000005, 'multiplier', 1.8, 1100000, '工厂效率 ×1.8。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3ed.png', 600000],
  ['70', '00', '0006', 6, 'Compound Interest', 60000006, 'multiplier', 1.8, 11000000, '银行存款利滚利，CPS ×1.8。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b5.png', 5000000],
  ['70', '00', '0007', 7, 'Divine Inspiration', 60000007, 'multiplier', 1.8, 160000000, '庙宇产出 ×1.8。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3db.png', 75000000],
  ['70', '00', '0008', 8, 'Arcane Circuit', 60000008, 'multiplier', 1.8, 2400000000, '巫师塔效率 ×1.8。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f52e.png', 2200000000],
  ['70', '00', '0009', 9, 'Interstellar Logistics', 60000009, 'multiplier', 1.6, 36000000000, '宇宙运输效率 ×1.6。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6f8.png', 35000000000],
  ['70', '00', '0010', 10, 'Dimensional Stabilizer', 60000010, 'multiplier', 1.6, 540000000000, '传送门稳定性提升，产出 ×1.6。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f300.png', 520000000000],
  ['70', '00', '0011', 11, 'Chrono Crystal', 60000011, 'multiplier', 1.6, 7200000000000, '时间机器效率 ×1.6。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f2.png', 7500000000000],
  ['70', '00', '0012', 12, 'Quantum Condenser', 60000012, 'multiplier', 1.6, 95000000000000, '反物质凝聚器效率 ×1.6。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2728.png', 90000000000000]
])

// Achievements
writeSheet('achievements.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Achievement Name', 'Requirement Type', 'Requirement Value', 'Flavor', 'Reward Icon'],
  ['@', '@', '@', 'uint', 'string', 'AchievementType', 'uint', 'string', 'string'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'requirementType', 'requirementValue', 'flavor', 'icon'],
  ['80', '00', '0001', 1, 'Getting Started', 'totalCookies', 100, '做出第一百块饼干。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36a.png'],
  ['80', '00', '0002', 2, 'Grandma Hive', 'buildingCount:60000002', 5, '招募 5 位奶奶。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9da.png'],
  ['80', '00', '0003', 3, 'Industrial Revolution', 'buildingCount:60000005', 3, '建成 3 座工厂。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3ed.png'],
  ['80', '00', '0004', 4, 'Cookie Tycoon', 'totalCookies', 10000, '烘焙 1 万块饼干。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b0.png'],
  ['80', '00', '0005', 5, 'Millionaire Baker', 'totalCookies', 1000000, '烘焙 100 万饼干。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f911.png'],
  ['80', '00', '0006', 6, 'Temple Choir', 'buildingCount:60000007', 5, '运营 5 座庙宇。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3db.png'],
  ['80', '00', '0007', 7, 'Space Entrepreneur', 'buildingCount:60000009', 3, '拥有 3 艘宇宙运输舰。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f680.png'],
  ['80', '00', '0008', 8, 'Temporal Lord', 'buildingCount:60000011', 1, '购入第一台时间机器。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f2.png']
])

// Global config
writeSheet('global_config.xlsx', [
  ['Category Code', 'Section Code', 'Sequence Code', 'Sequence', 'Key', 'Value Type', 'Value', 'Description'],
  ['@', '@', '@', 'uint', 'string', 'GlobalValueType', 'any', 'string'],
  ['categoryCode', 'sectionCode', 'sequenceCode', 'sequence', 'key', 'valueType', 'value', 'description'],
  ['90', '00', '0001', 1, 'baseClick', 'Float', 1, '单次点击基础产量'],
  ['90', '00', '0002', 2, 'tickInterval', 'Float', 0.1, '自动计算间隔（秒）'],
  ['90', '00', '0003', 3, 'clickFloatDuration', 'Float', 0.9, '点击数字上浮动画时长（秒）'],
  ['90', '00', '0004', 4, 'clickFloatDistance', 'Float', 140, '点击数字上浮距离（像素）'],
  ['90', '00', '0005', 5, 'clickFloatSpread', 'Float', 80, '点击数字随机偏移范围（像素）'],
  ['90', '00', '0006', 6, 'prestigeBase', 'Float', 250000000, '声望计算基数（总饼干 / 基数）'],
  ['90', '00', '0007', 7, 'prestigeExponent', 'Float', 0.6, '声望计算指数'],
  ['90', '00', '0008', 8, 'prestigeResetMultiplier', 'Float', 1.08, '每次声望提升的全局 CPS 乘数'],
  ['90', '01', '0001', 9, 'autosaveInterval', 'UInt', 30, '自动保存秒数（演示用途）']
])

// Artifacts / prestige perks
writeSheet('artifacts.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Artifact Name', 'Effect Type', 'Effect Value', 'Cost Points', 'Description', 'Icon'],
  ['@', '@', '@', 'uint', 'string', 'ArtifactEffectType', 'float', 'uint', 'string', 'string'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'effectType', 'effectValue', 'costPoints', 'desc', 'icon'],
  ['95', '00', '0001', 1, 'Golden Oven Mitts', 'globalMultiplier', 1.6, 30, '所有 CPS 乘以 1.6。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9b5.png'],
  ['95', '00', '0002', 2, 'Sugar Rush', 'clickMultiplier', 3.0, 25, '点击产量翻至 3 倍，并更快上浮。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36c.png'],
  ['95', '00', '0003', 3, 'Pocket Chronometer', 'offlineMultiplier', 2.0, 35, '离线收益翻倍，归来即可收割。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f1.png'],
  ['95', '00', '0004', 4, 'Quantum Ledger', 'costReduction', 0.15, 40, '所有建筑成本降低 15%。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b0.png'],
  ['95', '01', '0001', 5, 'Starfarer Compass', 'prestigeBonus', 0.25, 45, '声望重置额外 +25% 神器点。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f320.png']
])

// context enums
fs.writeFileSync(Path.join(base, 'context.meta.json'), JSON.stringify({
  exports: {
    enum: ['enums']
  }
}, null, 2))

fs.writeFileSync(Path.join(base, 'context.enums.json'), JSON.stringify({
  UpgradeType: {
    Multiplier: 'multiplier',
    Additive: 'additive'
  },
  AchievementType: {
    TotalCookies: 'totalCookies',
    BuildingCountCursor: 'buildingCount:60000001',
    BuildingCountGrandma: 'buildingCount:60000002',
    BuildingCountFarm: 'buildingCount:60000003',
    BuildingCountMine: 'buildingCount:60000004',
    BuildingCountFactory: 'buildingCount:60000005',
    BuildingCountBank: 'buildingCount:60000006',
    BuildingCountTemple: 'buildingCount:60000007',
    BuildingCountWizardTower: 'buildingCount:60000008',
    BuildingCountShipment: 'buildingCount:60000009',
    BuildingCountPortal: 'buildingCount:60000010',
    BuildingCountTimeMachine: 'buildingCount:60000011',
    BuildingCountAntimatter: 'buildingCount:60000012'
  },
  ArtifactEffectType: {
    GlobalMultiplier: 'globalMultiplier',
    ClickMultiplier: 'clickMultiplier',
    OfflineMultiplier: 'offlineMultiplier',
    CostReduction: 'costReduction',
    PrestigeBonus: 'prestigeBonus'
  }
}, null, 2))

console.log('Rebuilt click-cookies sheets.')
