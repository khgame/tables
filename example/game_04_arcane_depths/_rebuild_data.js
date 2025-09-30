const Path = require('path')
const XLSX = require('xlsx')
const fs = require('fs')

const base = __dirname

if (!fs.existsSync(base)) {
  fs.mkdirSync(base, { recursive: true })
}

function writeSheet(name, rows) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, '__data')
  XLSX.writeFile(wb, Path.join(base, name))
  console.log(`[arcane-depths] wrote ${name}`)
}

writeSheet('chapters.xlsx', [
  ['Family Code', 'Chapter Code', 'Difficulty Code', 'Variant Code', 'Sequence', 'Chapter Name', 'Tagline', 'Summary', 'Passive Effect', 'Start Arcane', 'Start Crystal', 'Start Provision', 'Boss Enemy', 'Feature Rooms', 'Unlock Facility'],
  ['@', '@', '@', '@', 'uint', 'string', 'string', 'string', 'string', 'uint', 'uint', 'uint', 'tid', 'string', 'tid'],
  ['familyCode', 'chapterCode', 'difficultyCode', 'variantCode', 'sequence', 'name', 'tagline', 'summary', 'passiveEffect', 'startArcane', 'startCrystal', 'startProvision', 'bossEnemy', 'featureRooms', 'unlockFacility'],
  ['10', '01', '01', '00', 1, '余烬裂隙（Ember Rift）', '熔心锋芒', '坠入熔岩裂谷，净化觉醒的余烬巨灵。', '战斗开始时全体获得1点技能能量。', 6, 25, 40, 40010300, 'Combat|Event|Merchant', 70010100],
  ['10', '02', '01', '00', 1, '蔓生穹顶（Verdant Spire）', '翠潮回响', '穿越失控的植物穹顶，解除深根巨树的束缚。', '每层结束额外获得5点Arcane。', 4, 18, 55, 40020300, 'Combat|Event|Rest', 70020100],
  ['10', '03', '01', '00', 1, '星界熔炉（Astral Crucible）', '星辉洪流', '深入星火熔炉，阻止星界熔铸的异界兵团。', '极限技能冷却缩短1回合。', 5, 30, 35, 40030300, 'Combat|Elite|Boss', 70030100]
])

writeSheet('map_templates.xlsx', [
  ['Family Code', 'Chapter Code', 'Layer Code', 'Node Code', 'Order', 'Chapter Id', 'Layer', 'Room Type', 'Reward Hint', 'Edge Left', 'Edge Right', 'Weight Modifier', 'Special Rule'],
  ['@', '@', '@', '@', 'uint', 'tid', 'uint', 'RoomType', 'string?', 'uint?', 'uint?', 'float?', 'string?'],
  ['familyCode', 'chapterCode', 'layerCode', 'nodeCode', 'order', 'chapterId', 'layer', 'roomType', 'rewardHint', 'edgeLeft', 'edgeRight', 'weightMod', 'specialRule'],
  ['11', '01', '01', '01', 1, 10010100, 1, 'Combat', '核心碎片', undefined, undefined, 1.0, '首战敌人易伤1回合'],
  ['11', '01', '01', '02', 2, 10010100, 1, 'Event', '双选奖励', undefined, undefined, 0.9, '事件根据队伍特质生成'],
  ['11', '01', '01', '03', 3, 10010100, 1, 'Merchant', '稀有遗物', undefined, undefined, 0.8, '首层商人限购1件'],
  ['11', '01', '02', '01', 4, 10010100, 2, 'Combat', '附魔碎片', 1, 2, 1.1, '加入余烬守卫精英'],
  ['11', '01', '02', '02', 5, 10010100, 2, 'Elite', '遗物选择', 3, undefined, 1.3, '精英战耐久场地'],
  ['11', '01', '03', '01', 6, 10010100, 3, 'Boss', '章节核心', 4, 5, 1.0, 'Boss进战带护盾'],
  ['11', '02', '01', '01', 1, 10020100, 1, 'Combat', '植物孢子', undefined, undefined, 1.0, '首轮生成藤蔓障碍'],
  ['11', '02', '01', '02', 2, 10020100, 1, 'Event', '旅者求助', undefined, undefined, 1.0, '成功可解锁NPC'],
  ['11', '02', '02', '01', 3, 10020100, 2, 'Rest', '深林调息', 1, undefined, 0.7, '可移除一个减益'],
  ['11', '02', '03', '01', 4, 10020100, 3, 'Boss', '藤界之心', 3, undefined, 1.0, 'Boss召唤孢子从者'],
  ['11', '03', '01', '01', 1, 10030100, 1, 'Elite', '星辉残渣', undefined, undefined, 1.2, '敌人带反射护盾'],
  ['11', '03', '02', '01', 2, 10030100, 2, 'Combat', '星铁碎片', 1, undefined, 1.1, '地图施加减速'],
  ['11', '03', '03', '01', 3, 10030100, 3, 'Boss', '熔炉核心', 2, undefined, 1.0, 'Boss阶段转换带召唤']
])

writeSheet('classes.xlsx', [
  ['Family Code', 'Class Code', 'Variant Code', 'Sub Code', 'Sequence', 'Class Key', 'Display Name', 'Role', 'Base HP', 'Base ATK', 'Base DEF', 'Base SPD', 'Energy Regen', 'Signature Trait', 'Gear Slots'],
  ['@', '@', '@', '@', 'uint', 'HeroClass', 'string', 'HeroRole', 'uint', 'uint', 'uint', 'uint', 'float', 'TraitType', 'string'],
  ['familyCode', 'classCode', 'variantCode', 'subCode', 'sequence', 'classKey', 'name', 'role', 'baseHp', 'baseAtk', 'baseDef', 'baseSpd', 'energyRegen', 'signatureTrait', 'gearSlots'],
  ['21', '01', '00', '00', 1, 'Vanguard', '先锋 - 炽焰守望者', 'Tank', 1150, 90, 160, 98, 1.1, 'Resolve', 'Weapon|Armor|Accessory'],
  ['21', '02', '00', '00', 1, 'Mystic', '咒术师 - 星文织者', 'Burst', 900, 125, 95, 104, 1.4, 'Resonance', 'Weapon|Accessory'],
  ['21', '03', '00', '00', 1, 'Gunner', '神射手 - 轨道猎手', 'Specialist', 980, 135, 90, 110, 1.2, 'Instinct', 'Weapon|Armor|Accessory'],
  ['21', '04', '00', '00', 1, 'Warden', '守望者 - 森野使徒', 'Support', 1020, 105, 130, 100, 1.3, 'Synergy', 'Weapon|Armor|Accessory']
])

writeSheet('heroes.xlsx', [
  ['Family Code', 'Class Code', 'Hero Code', 'Variant Code', 'Sequence', 'Hero Name', 'Class Tid', 'Role', 'Rarity', 'Base HP', 'Base ATK', 'Base DEF', 'Base SPD', 'Signature Skill', 'Support Skill', 'Ultimate Skill', 'Unlock Chapter', 'Primary Trait', 'Secondary Trait', 'Portrait'],
  ['@', '@', '@', '@', 'uint', 'string', 'tid', 'HeroRole', 'uint', 'uint', 'uint', 'uint', 'uint', 'tid', 'tid', 'tid', 'tid', 'TraitType', 'TraitType?', 'string'],
  ['familyCode', 'classCode', 'heroCode', 'variantCode', 'sequence', 'name', 'classTid', 'role', 'rarity', 'baseHp', 'baseAtk', 'baseDef', 'baseSpd', 'signatureSkill', 'supportSkill', 'ultimateSkill', 'unlockChapter', 'primaryTrait', 'secondaryTrait', 'portrait'],
  ['20', '01', '01', '00', 1, 'Lyra Emberguard', 21010000, 'Tank', 4, 1320, 96, 178, 101, 30010100, 30010200, 30990100, 10010100, 'Resolve', 'Synergy', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80'],
  ['20', '02', '01', '00', 1, 'Eiden Starcaller', 21020000, 'Burst', 5, 880, 148, 102, 108, 30020100, 30030100, 30990100, 10020100, 'Resonance', 'Instinct', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80'],
  ['20', '03', '01', '00', 1, 'Rhea Longshot', 21030000, 'Specialist', 4, 1040, 142, 92, 116, 30040100, 30030100, 30990100, 10020100, 'Instinct', 'Resolve', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'],
  ['20', '04', '01', '00', 1, 'Kael Mosswarden', 21040000, 'Support', 3, 1085, 112, 140, 99, 30050100, 30010100, 30990100, 10030100, 'Synergy', 'Resonance', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80']
])

writeSheet('skills.xlsx', [
  ['Family Code', 'Skill Code', 'Level Code', 'Variant Code', 'Sequence', 'Skill Name', 'Skill Tag', 'Target', 'Cooldown', 'Energy Cost', 'Formula', 'Power', 'Description'],
  ['@', '@', '@', '@', 'uint', 'string', 'SkillTag', 'SkillTarget', 'uint', 'uint', 'DamageFormula', 'float', 'string'],
  ['familyCode', 'skillCode', 'levelCode', 'variantCode', 'sequence', 'name', 'tag', 'target', 'cooldown', 'energyCost', 'formula', 'power', 'description'],
  ['30', '01', '01', '00', 1, 'Molten Bulwark', 'Support', 'AllyTeam', 10, 20, 'Basic', 1.0, '为全队提供护盾并反弹20%伤害。'],
  ['30', '01', '02', '00', 2, 'Molten Bulwark+', 'Support', 'AllyTeam', 8, 20, 'Basic', 1.2, '护盾强化，并赋予护盾破裂爆炸。'],
  ['30', '02', '01', '00', 1, 'Starfall Spear', 'Spell', 'Enemy', 12, 30, 'Burst', 1.35, '召唤星辉长枪，对单体造成高额伤害。'],
  ['30', '03', '01', '00', 1, 'Gravity Lattice', 'Control', 'EnemyAll', 13, 28, 'Aoe', 0.95, '放置重力锁阵，降低敌方速度并造成持续伤害。'],
  ['30', '04', '01', '00', 1, 'Echo Barrage', 'Ranged', 'Enemy', 9, 16, 'Pierce', 1.1, '连续射击，命中同一目标时累计易伤。'],
  ['30', '05', '01', '00', 1, 'Verdant Pulse', 'Support', 'AllyTeam', 11, 18, 'Basic', 0.8, '治愈并赋予再生，若目标携带藤蔓印记则额外回复。'],
  ['30', '99', '01', '00', 1, 'Crucible Overload', 'Spell', 'EnemyAll', 16, 40, 'Burst', 1.6, '极限释放，爆发星火冲击全场。']
])

writeSheet('skill_links.xlsx', [
  ['Family Code', 'Link Code', 'Variant Code', 'Sub Code', 'Sequence', 'Skill Id', 'Trigger Trait', 'Condition', 'Step Order', 'Step Skill', 'Chance', 'Remark'],
  ['@', '@', '@', '@', 'uint', 'tid', 'TraitType?', 'string', 'uint', 'tid', 'float', 'string?'],
  ['familyCode', 'linkCode', 'variantCode', 'subCode', 'sequence', 'skillId', 'triggerTrait', 'condition', 'stepOrder', 'stepSkill', 'chance', 'remark'],
  ['31', '01', '00', '00', 1, 30010100, 'Resolve', '队伍护盾总量>=200', 1, 30010200, 1.0, 'Molten Bulwark 触发升级'],
  ['31', '02', '00', '00', 1, 30020100, 'Resonance', '目标处于易伤', 1, 30030100, 0.85, '星辉共鸣追加终结一击'],
  ['31', '03', '00', '00', 1, 30040100, 'Instinct', '自身持有动量', 1, 30990100, 0.7, 'Echo Barrage 触发穿透强击']
])

writeSheet('enemies.xlsx', [
  ['Family Code', 'Enemy Family', 'Subtype Code', 'Variant Code', 'Sequence', 'Display Name', 'Class', 'Rarity', 'Level', 'HP', 'ATK', 'DEF', 'SPD', 'Resistance', 'Loot Table', 'Signature Skill', 'Behavior Profile', 'Boss Phase Count'],
  ['@', '@', '@', '@', 'uint', 'string', 'EnemyFamily', 'string', 'uint', 'uint', 'uint', 'uint', 'uint', 'float', 'string', 'tid?', 'string', 'uint?'],
  ['familyCode', 'enemyFamily', 'subtypeCode', 'variantCode', 'sequence', 'name', 'family', 'rarity', 'level', 'hp', 'atk', 'def', 'spd', 'resistance', 'lootTable', 'signatureSkill', 'behaviorProfile', 'bossPhaseCount'],
  ['40', '01', '01', '00', 1, '余烬兽', 'Aberrant', 'Normal', 8, 1800, 120, 70, 90, 0.1, 'ember_basic', 30010100, 'ember_beast_default', undefined],
  ['40', '01', '02', '00', 2, '熔核巨灵', 'Aberrant', 'Elite', 11, 4500, 210, 150, 70, 0.25, 'ember_elite', 30010200, 'ember_titan', undefined],
  ['40', '01', '03', '00', 3, '灰烬之主', 'Aberrant', 'Boss', 14, 9800, 310, 210, 80, 0.35, 'ember_boss', 30990100, 'ember_lord', 2],
  ['40', '02', '01', '00', 1, '荆棘信徒', 'Cultist', 'Normal', 9, 2050, 140, 90, 96, 0.12, 'spire_basic', 30030100, 'cultist_default', undefined],
  ['40', '02', '03', '00', 3, '深根祭司', 'Cultist', 'Boss', 14, 9200, 280, 200, 88, 0.28, 'spire_boss', 30050100, 'cultist_highpriest', 2],
  ['40', '03', '01', '00', 1, '星界傀儡', 'Construct', 'Elite', 12, 5200, 220, 180, 82, 0.3, 'crucible_elite', 30040100, 'construct_guardian', undefined],
  ['40', '03', '03', '00', 3, '熔炉主宰', 'Construct', 'Boss', 16, 11500, 360, 240, 84, 0.4, 'crucible_boss', 30990100, 'construct_overlord', 3]
])

writeSheet('enemy_ai.xlsx', [
  ['Family Code', 'Enemy Code', 'Behavior Code', 'Variant Code', 'Sequence', 'Enemy Id', 'Priority', 'Condition', 'Action', 'Param', 'Cooldown'],
  ['@', '@', '@', '@', 'uint', 'tid', 'uint', 'BehaviorCondition', 'BehaviorAction', 'string?', 'uint?'],
  ['familyCode', 'enemyCode', 'behaviorCode', 'variantCode', 'sequence', 'enemyId', 'priority', 'condition', 'action', 'param', 'cooldown'],
  ['41', '01', '01', '00', 1, 40010100, 1, 'OnTurnStart', 'AttackFront', 'burn', 0],
  ['41', '01', '02', '00', 2, 40010100, 2, 'HpBelow50', 'ApplyDebuff', 'ignite', 3],
  ['41', '01', '03', '00', 3, 40010300, 1, 'OnTurnStart', 'SummonMinion', 'emberling', 4],
  ['41', '01', '04', '00', 4, 40010300, 2, 'OnAllyDown', 'AttackLowestHp', 'execute', 0],
  ['41', '02', '01', '00', 1, 40020300, 1, 'OnTurnStart', 'ApplyDebuff', 'root', 2],
  ['41', '02', '02', '00', 2, 40020300, 2, 'OnPlayerHeal', 'SummonMinion', 'sporeling', 3],
  ['41', '03', '01', '00', 1, 40030300, 1, 'OnTurnStart', 'AttackFront', 'meteor', 0],
  ['41', '03', '02', '00', 2, 40030300, 2, 'HpBelow50', 'SummonMinion', 'forge_construct', 2],
  ['41', '03', '03', '00', 3, 40030300, 3, 'OnAllyDown', 'ApplyDebuff', 'frailty', 3]
])

writeSheet('rooms.xlsx', [
  ['Family Code', 'Room Type Code', 'Room Code', 'Variant Code', 'Sequence', 'Room Type', 'Display Name', 'Chapter Id', 'Description', 'Enemy Id', 'Event Id', 'Reward Type', 'Reward Value', 'Special Rule'],
  ['@', '@', '@', '@', 'uint', 'RoomType', 'string', 'tid?', 'string', 'tid?', 'tid?', 'RewardType', 'string', 'string?'],
  ['familyCode', 'roomTypeCode', 'roomCode', 'variantCode', 'sequence', 'roomType', 'name', 'chapterId', 'description', 'enemyId', 'eventId', 'rewardType', 'rewardValue', 'specialRule'],
  ['50', '01', '01', '00', 1, 'Combat', '熔心巨室', 10010100, '与余烬族群的正面冲突。', 40010100, undefined, 'Resource', 'Arcane:12', '地形随机生成火焰陷阱'],
  ['50', '02', '01', '00', 1, 'Event', '余烬碎片祭坛', 10010100, '献祭资源以换取强化。', undefined, 51010000, 'Relic', '60010000', '献祭Arcane可提升奖励'],
  ['50', '03', '01', '00', 1, 'Merchant', '漂泊铸匠', 10010100, '可购买熔锻遗物或转换资源。', undefined, undefined, 'Item', '62010000', '本层限购一次强化部件'],
  ['50', '01', '02', '00', 2, 'Combat', '蔓生之巢', 10020100, '藤蔓潮汐的核心据点。', 40020300, undefined, 'Resource', 'Provision:18', '初始时所有敌人持有藤蔓护盾'],
  ['50', '05', '01', '00', 1, 'Rest', '翠息静室', 10020100, '通过深绿脉络恢复与净化。', undefined, undefined, 'Trait', 'Synergy', '移除任意一个减益'],
  ['50', '06', '01', '00', 1, 'Boss', '熔炉主宰之厅', 10030100, '对决星界熔炉的主宰。', 40030300, undefined, 'Relic', '60030000', 'Boss阶段转换召唤星火残迹']
])

writeSheet('events.xlsx', [
  ['Family Code', 'Event Code', 'Variant Code', 'Sub Code', 'Sequence', 'Chapter Id', 'Title', 'Summary', 'Option1 Text', 'Option1 Requirement', 'Option1 Reward Type', 'Option1 Reward Value', 'Option1 Penalty Type', 'Option1 Penalty Value', 'Option2 Text', 'Option2 Requirement', 'Option2 Reward Type', 'Option2 Reward Value', 'Option2 Penalty Type', 'Option2 Penalty Value', 'Follow Up Event'],
  ['@', '@', '@', '@', 'uint', 'tid?', 'string', 'string', 'string', 'RequirementType?', 'RewardType?', 'string?', 'PenaltyType?', 'string?', 'string?', 'RequirementType?', 'RewardType?', 'string?', 'PenaltyType?', 'string?', 'tid?'],
  ['familyCode', 'eventCode', 'variantCode', 'subCode', 'sequence', 'chapterId', 'title', 'summary', 'option1Text', 'option1Requirement', 'option1RewardType', 'option1RewardValue', 'option1PenaltyType', 'option1PenaltyValue', 'option2Text', 'option2Requirement', 'option2RewardType', 'option2RewardValue', 'option2PenaltyType', 'option2PenaltyValue', 'followUp'],
  ['51', '01', '00', '00', 1, 10010100, '余烬之心的呼唤', '碎片共鸣召唤你投入灼热火焰。', '投掷熔心碎片', 'Resource', 'Relic', '60010000', 'LoseResource', 'Arcane:10', '保持距离观察', undefined, 'Resource', 'Crystal:8', 'Debuff', 'Scorching', 51010001],
  ['51', '01', '00', '01', 2, 10010100, '余烬之心回响', '碎片涌动，显现潜在力量。', '吞噬碎片', 'HeroTrait', 'Trait', 'Resolve', 'Damage', 'team:12', '封印碎片', undefined, 'Resource', 'Arcane:6', undefined, undefined, undefined],
  ['51', '02', '00', '00', 1, 10020100, '深根求援', '被藤蔓缠绕的旅者请求帮助。', '切断藤蔓', 'SkillTag', 'Resource', 'Provision:20', 'Debuff', 'Bleed', '分享药剂', 'Resource', 'Resource', 'Arcane:8', undefined, undefined, 51020000],
  ['51', '03', '00', '00', 1, 10030100, '星火铸炉', '熔炉中浮现星界影像。', '倾听星火', 'HeroTrait', 'Resource', 'Arcane:10', undefined, undefined, '融入星火', 'HeroTrait', 'Relic', '60030000', 'LoseResource', 'HP:15', undefined]
])

writeSheet('relics.xlsx', [
  ['Family Code', 'Relic Code', 'Variant Code', 'Sub Code', 'Sequence', 'Relic Name', 'Rarity', 'Slot', 'Effect Summary', 'Trigger Condition', 'Triggered Effect', 'Synergy Trait'],
  ['@', '@', '@', '@', 'uint', 'string', 'uint', 'string', 'string', 'string?', 'string', 'TraitType?'],
  ['familyCode', 'relicCode', 'variantCode', 'subCode', 'sequence', 'name', 'rarity', 'slot', 'effectSummary', 'triggerCondition', 'triggerEffect', 'synergyTrait'],
  ['60', '01', '00', '00', 1, '余烬之心碎片', 3, 'Any', '战斗开始额外获得护盾', 'OnBattleStart', '队伍护盾+150', 'Resolve'],
  ['60', '02', '00', '00', 2, '翠潮之语', 4, 'Any', '治疗时为目标附加藤蔓护佑', 'OnHeal', '回复额外15%并免疫下一次减益', 'Synergy'],
  ['60', '03', '00', '00', 3, '星锻合金', 5, 'Weapon', '技能命中时追加星能碎片', 'OnSkillHit', '对同列敌人造成30%额外伤害', 'Resonance'],
  ['60', '04', '00', '00', 4, '猎手之徽', 3, 'Accessory', '高连击时提升暴击', 'OnCombo', '连击>=3时暴击率+18%', 'Instinct'],
  ['60', '05', '00', '00', 5, '守望灯盏', 2, 'Armor', '防御时为队友提供护盾', 'OnGuard', '触发格挡时最近的队友获得100护盾', 'Resolve']
])

writeSheet('equipment.xlsx', [
  ['Family Code', 'Item Code', 'Variant Code', 'Sub Code', 'Sequence', 'Item Name', 'Slot', 'Rarity', 'Craft Cost', 'Craft Resource', 'Upgrade Level', 'Upgrade Bonus', 'Linked Relic'],
  ['@', '@', '@', '@', 'uint', 'string', 'EquipmentSlot', 'uint', 'uint', 'ResourceType', 'uint', 'string', 'tid?'],
  ['familyCode', 'itemCode', 'variantCode', 'subCode', 'sequence', 'name', 'slot', 'rarity', 'craftCost', 'craftResource', 'upgradeLevel', 'upgradeBonus', 'linkedRelic'],
  ['62', '01', '00', '00', 1, '熔铸壁盾', 'Armor', 3, 140, 'Crystal', 3, '+60 DEF 每级并提供灼烧反击', 60010000],
  ['62', '02', '00', '00', 1, '星织法杖', 'Weapon', 4, 180, 'Arcane', 4, '+70 ATK 每级并提升极限技倍率', 60030000],
  ['62', '03', '00', '00', 1, '追猎者护弓', 'Weapon', 3, 150, 'Crystal', 3, '+8% 暴击率每级', 60040000],
  ['62', '04', '00', '00', 1, '翠息护符', 'Accessory', 2, 90, 'Provision', 2, '+12% 治疗量每级', 60020000],
  ['62', '05', '00', '00', 1, '熔炉余辉指环', 'Accessory', 4, 160, 'Arcane', 3, '技能命中追加星火标记', 60030000],
  ['62', '06', '00', '00', 1, '守望藤蔓披风', 'Armor', 2, 110, 'Provision', 2, '+50 护盾提供量每级', 60050000]
])

writeSheet('facilities.xlsx', [
  ['Family Code', 'Facility Code', 'Level Code', 'Variant Code', 'Sequence', 'Facility Name', 'Type', 'Level', 'Unlock Cost Resource', 'Unlock Cost Amount', 'Effect Summary', 'Unlock Requirement'],
  ['@', '@', '@', '@', 'uint', 'string', 'FacilityType', 'uint', 'ResourceType', 'uint', 'string', 'string?'],
  ['familyCode', 'facilityCode', 'levelCode', 'variantCode', 'sequence', 'name', 'type', 'level', 'unlockResource', 'unlockAmount', 'effectSummary', 'unlockRequirement'],
  ['70', '01', '01', '00', 1, '营地核心 - 熔心炉', 'Camp', 1, 'Crystal', 40, '进入余烬裂隙时额外获得护盾', '章节10010100通关'],
  ['70', '02', '01', '00', 1, '工坊 - 星锻台', 'Workshop', 1, 'Arcane', 55, '制造装备时可随机附加词缀', '完成研究71010000'],
  ['70', '03', '01', '00', 1, '图书馆 - 远星室', 'Library', 1, 'Crystal', 60, '解锁星界技能研究支线', '解锁英雄Eiden'],
  ['70', '04', '01', '00', 1, '方尖塔 - 共鸣柱', 'Spire', 1, 'Arcane', 70, '提供全队被动能量回复+0.2', '成就91010000达成']
])

writeSheet('research.xlsx', [
  ['Family Code', 'Research Code', 'Variant Code', 'Sub Code', 'Sequence', 'Research Name', 'Parent Research', 'Cost Resource', 'Cost Amount', 'Reward Type', 'Reward Value'],
  ['@', '@', '@', '@', 'uint', 'string', 'tid?', 'ResourceType', 'uint', 'string', 'string'],
  ['familyCode', 'researchCode', 'variantCode', 'subCode', 'sequence', 'name', 'parent', 'costResource', 'costAmount', 'rewardType', 'rewardValue'],
  ['71', '01', '00', '00', 1, '熔心防御矩阵', undefined, 'Crystal', 120, 'UnlockFacility', '70010100'],
  ['71', '02', '00', '00', 2, '余烬护盾调制', 71010000, 'Arcane', 90, 'Passive', '护盾效率+10%'],
  ['71', '03', '00', '00', 3, '蔓生复苏术', undefined, 'Provision', 100, 'UnlockFacility', '70040100'],
  ['71', '04', '00', '00', 4, '星界注能', 71020000, 'Arcane', 140, 'Passive', '能量回复+0.2'],
  ['71', '05', '00', '00', 5, '熔炉终极构筑', 71040000, 'Crystal', 160, 'UnlockSkill', '30990100']
])

writeSheet('economy.xlsx', [
  ['Family Code', 'Economy Code', 'Variant Code', 'Sub Code', 'Sequence', 'Scope', 'Resource', 'Stage', 'Reward Amount', 'Consumption', 'Notes'],
  ['@', '@', '@', '@', 'uint', 'string', 'ResourceType', 'uint', 'uint', 'uint?', 'string?'],
  ['familyCode', 'economyCode', 'variantCode', 'subCode', 'sequence', 'scope', 'resource', 'stage', 'rewardAmount', 'consumption', 'notes'],
  ['80', '01', '00', '00', 1, '章节结算', 'Crystal', 1, 28, undefined, '通关获得基础水晶'],
  ['80', '01', '00', '01', 2, '章节结算', 'Crystal', 2, 36, undefined, '额外奖励来自任务'],
  ['80', '02', '00', '00', 1, '战斗掉落', 'Arcane', 1, 8, undefined, '精英战+4'],
  ['80', '03', '00', '00', 1, '事件奖励', 'Provision', 1, 15, undefined, '成功事件额外奖励'],
  ['80', '04', '00', '00', 1, '商人交易', 'Provision', 0, 0, 12, '购买遗物或装备'],
  ['80', '05', '00', '00', 1, '设施维护', 'Arcane', 0, 0, 6, '每回合维护消耗']
])

writeSheet('tasks.xlsx', [
  ['Family Code', 'Task Code', 'Variant Code', 'Sub Code', 'Sequence', 'Scope', 'Display Name', 'Condition', 'Reward Type', 'Reward Value', 'Linked Chapter'],
  ['@', '@', '@', '@', 'uint', 'string', 'string', 'string', 'RewardType', 'string', 'tid?'],
  ['familyCode', 'taskCode', 'variantCode', 'subCode', 'sequence', 'scope', 'name', 'condition', 'rewardType', 'rewardValue', 'linkedChapter'],
  ['90', '01', '00', '00', 1, '章节', '余烬净化I', '在余烬裂隙中3回合内击败Boss', 'Resource', 'Crystal:20', 10010100],
  ['90', '02', '00', '00', 2, '章节', '蔓生守护I', '救出2位旅者并完成休整房间', 'Trait', 'Synergy', 10020100],
  ['90', '03', '00', '00', 3, '周目', '熔炉之眼', '累计造成30000点星火伤害', 'Relic', '60030000', undefined],
  ['90', '04', '00', '00', 4, '周目', '共鸣守护者', '任意一局中保持护盾不破3场战斗', 'Resource', 'Arcane:24', undefined]
])

writeSheet('achievements.xlsx', [
  ['Family Code', 'Achievement Code', 'Variant Code', 'Sub Code', 'Sequence', 'Title', 'Description', 'Trigger', 'Reward Type', 'Reward Value'],
  ['@', '@', '@', '@', 'uint', 'string', 'string', 'string', 'RewardType', 'string'],
  ['familyCode', 'achievementCode', 'variantCode', 'subCode', 'sequence', 'title', 'description', 'trigger', 'rewardType', 'rewardValue'],
  ['91', '01', '00', '00', 1, '余烬守望', '完成余烬裂隙所有难度。', 'chapter:10010100:all', 'Relic', '60010000'],
  ['91', '02', '00', '00', 2, '翠潮庇佑', '在蔓生穹顶无伤通关。', 'chapter:10020100:perfect', 'Resource', 'Crystal:60'],
  ['91', '03', '00', '00', 3, '星火熔铸师', '解锁所有星界熔炉装备。', 'equipment:all:crucible', 'Resource', 'Arcane:80']
])

console.log('[arcane-depths] Excel samples rebuilt. Run `node _rebuild_data.js` to refresh data.')
