const Path = require('path')
const XLSX = require('xlsx')
const fs = require('fs')

const base = Path.resolve(__dirname)

function writeSheet(name, rows) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, '__data')
  XLSX.writeFile(wb, Path.join(base, name))
}

writeSheet('heroes.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Hero Name', 'Class', 'Element', 'Rarity', 'Max Level', 'Base HP', 'Base ATK', 'Base DEF', 'Signature Item', 'Primary Skill', 'Support Skill', 'Ultimate Skill', 'Unlock Stage', 'Battle Role', 'Origin Region', 'Story Blurb', 'Portrait'],
  ['@', '@', '@', 'uint', 'string', 'HeroClass', 'HeroElement', 'uint', 'uint', 'uint', 'uint', 'uint', 'tid', 'tid', 'tid', 'tid', 'tid', 'HeroRole', 'string', 'string', 'string'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'class', 'element', 'rarity', 'maxLevel', 'baseHp', 'baseAtk', 'baseDef', 'signatureItem', 'primarySkill', 'supportSkill', 'ultimateSkill', 'unlockStage', 'role', 'region', 'story', 'portrait'],
  ['10', '00', '0001', 1, 'Aerin Frostshield', 'Knight', 'Frost', 2, 30, 1200, 85, 150, 30000004, 20001001, 20002001, 20006001, 40000001, 'Vanguard', 'Elder Peaks', '守护北境的年轻骑士，擅长用盾形构筑防线。', 'https://images.unsplash.com/photo-1526272560260-5b1c131dea52?auto=format&fit=crop&w=600&q=80'],
  ['10', '00', '0002', 2, 'Mira Silverquill', 'Mage', 'Arcane', 3, 40, 900, 110, 95, 30000005, 20003001, 20001002, 20009001, 40000002, 'Burst', 'Lumina Academy', '天赋异禀的法师，对古代秘术痴迷，善于远程压制。', 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=600&q=80'],
  ['10', '00', '0003', 3, 'Roth Dusktrail', 'Rogue', 'Shadow', 2, 32, 1000, 95, 105, 30000001, 20004001, 20005001, 20005001, 40000003, 'Assassin', 'Freeports', '雇佣兵出身的游侠，行动迅捷，擅长毒刃。', 'https://images.unsplash.com/photo-1529245019870-59a6d1ef7c86?auto=format&fit=crop&w=600&q=80'],
  ['10', '01', '0001', 4, 'Nyx Moonweaver', 'Assassin', 'Lunar', 4, 45, 1050, 120, 115, 30000006, 20007001, 20002001, 20008001, 40000004, 'Skirmisher', 'Nightfall Enclave', '掌握月影之术的刺客，能在暗夜中穿梭并施展幻舞。', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80']
])

writeSheet('skills.xlsx', [
  ['Category Code', 'Skill Code', 'Level Code', 'Level', 'Skill Name', 'Target', 'Cooldown', 'Power', 'Scaling', 'Energy Cost', 'Unlock Stage', 'Description'],
  ['@', '@', '@', 'uint', 'string', 'SkillTarget', 'uint', 'uint', 'float', 'uint', 'tid', 'string'],
  ['categoryCode', 'skillCode', 'levelCode', 'level', 'name', 'target', 'cooldown', 'power', 'scaling', 'energyCost', 'unlockStage', 'desc'],
  ['20', '001', '001', 1, 'Shield Bash', 'Enemy', 8, 120, 1.0, 20, 40000001, '挥动盾牌造成伤害，并短暂眩晕敌人。'],
  ['20', '001', '002', 2, 'Shield Bash', 'Enemy', 7, 150, 1.15, 20, 40000002, '强化版盾击，提升伤害并延长控制。'],
  ['20', '002', '001', 1, 'Guardian Aura', 'AllyTeam', 12, 0, 0.0, 25, 40000001, '为全队提供护盾并缓慢回复生命。'],
  ['20', '003', '001', 1, 'Arcane Nova', 'EnemyAll', 10, 180, 1.25, 30, 40000002, '释放大范围法术，造成高额爆发伤害。'],
  ['20', '004', '001', 1, 'Shadowstep', 'Self', 6, 90, 1.1, 10, 40000002, '迅速闪至目标背后并提升下次攻击。'],
  ['20', '005', '001', 1, 'Poisoned Blade', 'Enemy', 9, 110, 1.05, 18, 40000003, '附加毒素的攻击，会在后续造成持续伤害。'],
  ['20', '006', '001', 1, 'Celestial Lance', 'Boss', 14, 240, 1.4, 40, 40000004, '召唤星辉长枪贯穿敌人，造成巨额伤害。'],
  ['20', '007', '001', 1, 'Umbral Veil', 'Self', 11, 0, 0.0, 22, 40000003, '化作影子躲避伤害，并在现身时造成穿刺。'],
  ['20', '008', '001', 1, 'Moonfall Waltz', 'EnemyAll', 15, 260, 1.5, 45, 40000004, '月光化作刀舞横扫全场，附带易伤效果。'],
  ['20', '009', '001', 1, 'Crystal Bloom', 'Enemy', 13, 210, 1.35, 35, 40000003, '凝聚水晶爆炸，造成范围伤害并减速。']
])

writeSheet('items.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Item Name', 'Slot', 'Rarity', 'Cost Currency', 'Cost Amount', 'Attack', 'Defense', 'Bonus HP', 'Effect', 'Source Stage', 'Flavor Text'],
  ['@', '@', '@', 'uint', 'string', 'ItemSlot', 'uint', 'RewardCurrency', 'uint', 'uint', 'uint', 'uint', 'string', 'tid', 'string'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'slot', 'rarity', 'currency', 'amount', 'attack', 'defense', 'bonusHp', 'effect', 'sourceStage', 'flavor'],
  ['30', '01', '0001', 1, 'Iron Sword', 'Weapon', 1, 'gold', 400, 35, 0, 0, '基础长剑，增加物理伤害。', 40000002, '大量量产的骑士制式武器。'],
  ['30', '02', '0001', 2, 'Apprentice Robe', 'Armor', 1, 'gold', 350, 0, 20, 120, '提升法术抗性并加快回蓝。', 40000003, '学院学徒的制服，附带细微的魔力纹路。'],
  ['30', '03', '0001', 3, 'Mana Potion', 'Consumable', 1, 'gold', 50, 0, 0, 0, '立即恢复 60 点能量。', 40000001, '香甜的蓝莓味，深受学徒欢迎。'],
  ['30', '04', '0001', 4, 'Knight Emblem', 'Trinket', 2, 'guild', 15, 0, 40, 200, '强化护盾技能效果。', 40000001, '象征坚守的徽章，镶嵌寒霜之石。'],
  ['30', '05', '0001', 5, 'Ember Ring', 'Accessory', 3, 'gold', 800, 25, 10, 80, '释放技能时追加灼烧伤害。', 40000002, '炙热的火焰石戒指，不断散发余温。'],
  ['30', '05', '0002', 6, 'Moonlight Charm', 'Accessory', 3, 'honor', 120, 18, 25, 60, '夜间战斗时提升闪避与暴击。', 40000004, '由月神祭司编织的护符，散发柔和光芒。']
])

writeSheet('enemies.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Enemy Name', 'Element', 'Role', 'Max HP', 'Attack', 'Defense', 'Signature Skill', 'Weakness', 'Reward Exp', 'Portrait'],
  ['@', '@', '@', 'uint', 'string', 'HeroElement', 'string', 'uint', 'uint', 'uint', 'string', 'string', 'uint', 'string'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'element', 'role', 'hp', 'attack', 'defense', 'skill', 'weakness', 'rewardExp', 'portrait'],
  ['50', '00', '0001', 1, 'Frostfang Raider', 'Frost', 'Bruiser', 950, 80, 60, '冰霜冲撞', '火焰', 120, 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=600&q=80'],
  ['50', '00', '0002', 2, 'Obsidian Sentinel', 'Arcane', 'Guardian', 1200, 70, 90, '熔核护盾', '毒素', 160, 'https://images.unsplash.com/photo-1558980664-10ea1989d896?auto=format&fit=crop&w=600&q=80'],
  ['50', '00', '0003', 3, 'Marsh Wraith', 'Shadow', 'Caster', 850, 95, 45, '瘴雾缠绕', '圣光', 150, 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=600&q=80'],
  ['50', '01', '0001', 4, 'Lunar Shade', 'Lunar', 'Assassin', 1000, 105, 70, '月蚀狂袭', '雷电', 200, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80']
])

writeSheet('stages.xlsx', [
  ['Category Code', 'Route Code', 'Sequence Code', 'Sequence', 'Stage Name', 'Stage Type', 'Environment', 'Required Power', 'Recommended Level', 'Length (min)', 'Boss Skill', 'Boss Enemy', 'Unlock Hero', 'Reward Item 1', 'Reward Qty 1', 'Reward Item 2', 'Reward Qty 2', 'Reward Item 3', 'Reward Qty 3', 'First Clear Skill', 'Prerequisite Stage', 'Backdrop', 'Narrative'],
  ['@', '@', '@', 'uint', 'string', 'StageSubtype', 'StageEnvironment', 'uint', 'uint', 'uint', 'tid', 'tid', 'tid', 'tid', 'uint', 'tid', 'uint', 'tid', 'uint', 'tid', 'tid', 'string', 'string'],
  ['categoryCode', 'routeCode', 'sequenceCode', 'sequence', 'name', 'stageType', 'environment', 'requiredPower', 'recommendedLevel', 'duration', 'bossSkill', 'bossEnemy', 'unlockHero', 'rewardItem1', 'rewardQty1', 'rewardItem2', 'rewardQty2', 'rewardItem3', 'rewardQty3', 'firstClearSkill', 'prerequisiteStage', 'backdrop', 'narrative'],
  ['40', '01', '0001', 1, 'Frostfang Trail', 'Main', 'Tundra', 12, 10, 5, 20005001, 50000001, 10000001, 30000003, 2, 30000004, 1, 30000001, 1, 20001001, 0, 'https://images.unsplash.com/photo-1457269449834-928af64c684d?auto=format&fit=crop&w=1200&q=80', '沿着冰霜峡谷一路前行，驱逐盘踞的掠夺者。'],
  ['40', '01', '0002', 2, 'Obsidian Keep', 'Main', 'Volcano', 20, 15, 6, 20004001, 50000002, 10000002, 30000001, 1, 30000005, 1, 30000003, 2, 20001002, 40000001, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80', '深处火山的城堡中，守卫者掌控着熔岩机关。'],
  ['40', '01', '0003', 3, 'Sunken Ruins', 'Main', 'Marsh', 28, 18, 7, 20003001, 50000003, 10000003, 30000002, 1, 30000003, 1, 30000004, 1, 20005001, 40000002, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', '被湖水吞噬的古代都市，仍散发着微弱魔力。'],
  ['40', '02', '0001', 4, 'Nightfall Citadel', 'Elite', 'NightCity', 35, 22, 8, 20006001, 50010001, 10000004, 30000005, 1, 30000006, 1, 30000004, 1, 20008001, 40000003, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80', '月蚀之夜开启的秘境，月影刺客在此接受试炼。']
])

writeSheet('relics.xlsx', [
  ['Category Code', 'Subtype Code', 'Sequence Code', 'Sequence', 'Relic Name', 'Effect Type', 'Effect Value', 'Unlock Stage', 'Description', 'Icon'],
  ['@', '@', '@', 'uint', 'string', 'RelicEffectType', 'float', 'tid?', 'string', 'string'],
  ['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', 'effectType', 'effectValue', 'unlockStage', 'desc', 'icon'],
  ['70', '00', '0001', 1, 'Everburning Ember', 'attackMultiplier', 1.2, '', '灼热火种让全体英雄攻击提高 20%。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png'],
  ['70', '00', '0002', 2, 'Aegis Mirror', 'defenseMultiplier', 1.15, 40000001, '远古护盾折射伤害，使防御提升 15%。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6e1.png'],
  ['70', '00', '0003', 3, 'Crystal Prism', 'enemyDefenseReduction', 0.18, 40000002, '棱光削弱敌人护甲，战斗开始时破甲 18%。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48e.png'],
  ['70', '00', '0004', 4, 'Scholar Chronicle', 'expBonus', 0.25, 40000002, '编年史记录战术心得，额外获得 25% 经验。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4d6.png'],
  ['70', '00', '0005', 5, 'Frostbrand Sigil', 'environmentBonus:Tundra', 1.25, 40000001, '寒霜纹章在冰原作战时提升 25% 伤害。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png'],
  ['70', '00', '0006', 6, 'Moonlit Compass', 'elementBonus:Lunar', 1.3, 40000004, '月辉罗盘唤醒月属性英雄力量，伤害提升 30%。', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f319.png']
])

writeSheet('global_config.xlsx', [
  ['Category Code', 'Section Code', 'Sequence Code', 'Sequence', 'Key', 'Value Type', 'Value', 'Description'],
  ['@', '@', '@', 'uint', 'string', 'GlobalValueType', 'any', 'string'],
  ['categoryCode', 'sectionCode', 'sequenceCode', 'sequence', 'key', 'valueType', 'value', 'description'],
  ['90', '00', '0001', 1, 'gameVersion', 'String', '1.0.0', '当前游戏版本号'],
  ['90', '00', '0002', 2, 'enableTutorial', 'Bool', true, '是否开启新手引导'],
  ['90', '00', '0003', 3, 'rookieDiamonds', 'UInt', 1500, '新手礼包钻石数量'],
  ['90', '00', '0004', 4, 'initialCurrency', 'Currency', 'gold', '初始主要货币类型'],
  ['90', '01', '0001', 5, 'defaultStage', 'StageId', 40000001, '默认剧情起始关卡'],
  ['90', '01', '0002', 6, 'unlockHeroReward', 'StageId', 40000002, '完成后解锁第二位英雄的关卡']
])

console.log('Rebuilt mini RPG data sheets.');
