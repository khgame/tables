const Path = require('path');
const fs = require('fs-extra');
const XLSX = require('xlsx');

const baseDir = __dirname;

function makeSheet(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '__data');
  return wb;
}

function writeTable(fileName, rows) {
  const wb = makeSheet(rows);
  const target = Path.resolve(baseDir, fileName);
  XLSX.writeFile(wb, target);
  console.log('[abyssal-nightfall] wrote', fileName);
}

const rowsEmpty = [[], [], []];

function buildOperators() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'string', 'string', 'uint', 'float', 'uint', 'float', 'float', 'string', 'string', 'string', 'float', 'string'],
    ['sector', 'category', 'serial', 'codename', 'role', 'startWeapon', 'startRelic', 'hp', 'moveSpeed', 'sanityCap', 'reloadBonus', 'critBonus', 'signaturePassive', 'portraitArt', 'sprite', 'spriteScale', 'themeTrack'],
    ['10', '01', '0001', '萨布尔「霓虹猎手」', '霓虹清剿者', 'weapon:20020001', 'relic:30050001', '135', '5.6', '140', '0.92', '0.08', 'passive:precision-lock', 'ui/assets/operators/sable.svg', 'ui/assets/actors/sable.png', '0.9', 'ui/assets/topdown/top-down-shooter/music/theme-1.ogg'],
    ['10', '01', '0002', '伊莉丝「破晓灯塔」', '共鸣信标师', 'weapon:20020002', 'relic:30050002', '120', '5.1', '155', '0.88', '0.15', 'passive:seraph-ward', 'ui/assets/operators/iris.svg', 'ui/assets/actors/iris.png', '0.92', 'ui/assets/topdown/top-down-shooter/music/theme-2.ogg'],
    ['10', '01', '0003', '马洛「潮汐制裁」', '深渊猎手', 'weapon:20020003', 'relic:30050003', '150', '5.3', '130', '0.96', '0.06', 'passive:undertow-grip', 'ui/assets/operators/marlow.svg', 'ui/assets/actors/marlow.png', '0.88', 'ui/assets/topdown/top-down-shooter/music/theme-3.ogg']
  ];
  writeTable('operators.xlsx', rows);
}

function buildWeapons() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'WeaponCategory', 'AttackStyle', 'uint', 'DamageType', 'float', 'float', 'uint', 'float', 'float', 'float', 'float', 'string', 'string', 'string', 'string', 'string', 'string', 'float', 'float'],
    ['sector', 'category', 'serial', 'name', 'categoryName', 'attackStyle', 'damage', 'damageType', 'fireRate', 'reload', 'magazine', 'spread', 'projectileSpeed', 'maxRange', 'projectileLifetime', 'travelSprite', 'impactSprite', 'muzzleSprite', 'notes', 'fireSfx', 'impactSfx', 'projectileScale', 'impactScale'],
    ['20', '02', '0001', '霓虹符文左轮', '霓虹侧臂', 'MANUAL', '62', 'KINETIC', '0.38', '1.60', '6', '2.4', '48', '30', '0.62', 'fx/projectiles/revolver.png', 'fx/impact/sparks.png', 'fx/muzzle/flame.png', '轻量侧臂，暴击可震慑敌人 0.3 秒。', 'ui/assets/sfx/weapons/runic_revolver_fire.wav', 'ui/assets/sfx/weapons/runic_revolver_hit.wav', '0.68', '0.9'],
    ['20', '02', '0002', '共鸣光谱射线', '以太光束', 'BEAM', '18', 'VOID', '0.12', '2.40', '0', '0.0', '78', '24', '0.30', 'fx/projectiles/beam_ray.png', 'fx/impact/void_burst.png', 'fx/muzzle/chorus.png', '持续瞄准时，伤害每秒提升 +4。', 'ui/assets/sfx/weapons/chorus_ray_fire.wav', 'ui/assets/sfx/weapons/chorus_ray_hit.wav', '0.85', '1.05'],
    ['20', '02', '0003', '潮裂破晓炮', '潮汐重炮', 'BURST', '96', 'FROST', '0.22', '2.80', '2', '4.5', '36', '20', '0.55', 'fx/projectiles/tide_shell.png', 'fx/impact/frost_shatter.png', 'fx/muzzle/water.png', '0.35 秒后裂解成三枚霜晶碎片。', 'ui/assets/sfx/weapons/tidebreaker_launcher_fire.wav', 'ui/assets/sfx/weapons/tidebreaker_launcher_hit.wav', '0.75', '1.15'],
    ['20', '02', '0004', '脉冲疾能卡宾枪', '脉冲步枪', 'MANUAL', '44', 'LIGHT', '0.26', '1.90', '18', '3.1', '64', '32', '0.50', 'fx/projectiles/pulse.png', 'fx/impact/pulse_flash.png', 'fx/muzzle/pulse_muzzle.png', '跟随节奏射击可叠加动量，加速装填。', 'ui/assets/sfx/weapons/pulse_carbine_fire.wav', 'ui/assets/sfx/weapons/pulse_carbine_hit.wav', '0.7', '1.0'],
    ['20', '02', '0005', '幽幕散裂霰炮', '暗影霰弹', 'BURST', '28', 'VOID', '0.45', '2.10', '4', '8.0', '28', '18', '0.40', 'fx/projectiles/umbral_pellet.png', 'fx/impact/void_scar.png', 'fx/muzzle/umbral.png', '近距离命中同一目标时，每颗弹丸额外 +6 伤害。', 'ui/assets/sfx/weapons/umbral_scattergun_fire.wav', 'ui/assets/sfx/weapons/umbral_scattergun_hit.wav', '0.78', '1.1'],
    ['20', '02', '0006', '蚀光穿梭矛阵', '熔蚀矛阵', 'AUTO', '54', 'FIRE', '0.32', '2.20', '5', '2.2', '52', '32', '0.70', 'fx/projectiles/eclipse_javelin.png', 'fx/impact/eclipse_burst.png', 'fx/muzzle/eclipse.png', '自导矛头炸裂出炽焰柱，擅长清理聚群敌人。', 'ui/assets/sfx/weapons/eclipse_javelin_fire.wav', 'ui/assets/sfx/weapons/eclipse_javelin_hit.wav', '0.82', '1.25']
  ];
  writeTable('weapons.xlsx', rows);
}

function buildRelics() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'string', 'AttackStyle', 'float', 'float', 'float', 'uint', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'school', 'activationStyle', 'cooldown', 'duration', 'radius', 'sanityDrain', 'effects', 'vfxSprite', 'sfxCue'],
    ['30', '05', '0001', '虚空环轨矩阵', '熵能', 'AUTO', '24', '6', '4.5', '12', '轨道体:+3|每秒伤害:+22虚空', 'fx/relics/void_orbit.png', 'ui/assets/sfx/relics/void_hum.wav'],
    ['30', '05', '0002', '圣徽光域', '辉耀', 'CHANNEL', '32', '8', '6.0', '18', '减速:+35%|持续:+8s', 'fx/relics/sigil_halo.png', 'ui/assets/sfx/relics/halo_chime.wav'],
    ['30', '05', '0003', '潮汐漩核', '潮汐', 'BURST', '28', '5', '5.5', '15', '拉拽强度:+100|爆裂伤害:+88霜寒', 'fx/relics/maelstrom.png', 'ui/assets/sfx/relics/maelstrom.wav'],
    ['30', '05', '0004', '炽天光塔', '辉耀', 'AUTO', '18', '4', '3.0', '10', '射速:0.6s|伤害:+16光耀', 'fx/relics/seraph_beacon.png', 'ui/assets/sfx/relics/beacon_loop.wav'],
    ['30', '05', '0005', '护域绽放', '护盾', 'BURST', '36', '4', '4.0', '20', '护盾:+60|持续:+8s', 'fx/relics/aegis_bloom.png', 'ui/assets/sfx/relics/aegis.wav']
  ];
  writeTable('relics.xlsx', rows);
}

function buildEnemies() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'EnemyFamily', 'uint', 'uint', 'float', 'float', 'AttackStyle', 'float', 'float', 'float', 'string', 'string', 'DamageType', 'DamageType', 'string', 'uint', 'string', 'uint', 'string', 'float', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'family', 'hp', 'damage', 'moveSpeed', 'radius', 'attackStyle', 'attackInterval', 'projectileSpeed', 'projectileLifetime', 'projectileSprite', 'impactSprite', 'weakness', 'resistance', 'lootTable', 'sanityDamage', 'combatNotes', 'xp', 'sprite', 'spriteScale', 'deathSprite', 'deathSfx', 'attackSfx'],
    ['40', '06', '0001', '裂界餍爬者', 'SHAMBLER', '220', '24', '3.4', '12', 'AUTO', '1.80', '18', '0.90', 'fx/projectiles/spittle.png', 'fx/impact/slime.png', 'FIRE', 'VOID', 'loot:ichor_minor', '6', '投掷腐质胆汁，落地后留下灼蚀雾。', '18', 'ui/assets/topdown/top-down-shooter/characters/body/3.png', '0.9', 'ui/assets/topdown/top-down-shooter/effects/explosion.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-2.wav', 'ui/assets/topdown/top-down-shooter/sounds/shoot-2.wav'],
    ['40', '06', '0002', '聆渊歌祭徒', 'CULTIST', '260', '32', '3.1', '14', 'BURST', '2.40', '22', '0.85', 'fx/projectiles/choir_note.png', 'fx/impact/chorus.png', 'LIGHT', 'VOID', 'loot:choir_cache', '9', '三连音符袭击，第三发附加畏惧层。', '26', 'ui/assets/topdown/top-down-shooter/characters/body/2.png', '0.94', 'ui/assets/topdown/top-down-shooter/effects/4.png', 'ui/assets/topdown/top-down-shooter/sounds/death.wav', 'ui/assets/topdown/top-down-shooter/sounds/shoot-3.wav'],
    ['40', '06', '0003', '渊喉呼嚎者', 'ABERRATION', '340', '36', '3.6', '16', 'BURST', '2.60', '28', '0.70', 'fx/projectiles/howl_wave.png', 'fx/impact/howl.png', 'LIGHT', 'FROST', 'loot:howler_pouch', '12', '扇形震荡波附加 3 秒理智流失。', '32', 'ui/assets/topdown/top-down-shooter/characters/body/1.png', '0.92', 'ui/assets/topdown/top-down-shooter/effects/3.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-3.wav', 'ui/assets/topdown/top-down-shooter/sounds/sword-2.wav'],
    ['40', '06', '0004', '虚壳哨兵', 'CONSTRUCT', '420', '42', '2.6', '18', 'BEAM', '1.45', '64', '0.60', 'fx/projectiles/null_beam.png', 'fx/impact/null_burn.png', 'VOID', 'KINETIC', 'loot:sentinel_cache', '10', '扫射光束前有 0.6 秒警示。', '38', 'ui/assets/topdown/top-down-shooter/characters/turret/2.png', '1.05', 'ui/assets/topdown/top-down-shooter/effects/5.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-1.wav', 'ui/assets/topdown/top-down-shooter/sounds/alert.wav'],
    ['40', '06', '0005', '堕港掘锚者', 'CONSTRUCT', '520', '55', '2.2', '24', 'MANUAL', '1.10', '0', '0.00', 'fx/projectiles/dredger_slam.png', 'fx/impact/dredger_slam.png', 'FIRE', 'KINETIC', 'loot:dredger_core', '14', '冲撞灯塔并引发地震波，需快速躲避。', '46', 'ui/assets/topdown/top-down-shooter/characters/tank.png', '0.85', 'ui/assets/topdown/top-down-shooter/effects/explosion.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-3.wav', 'ui/assets/topdown/top-down-shooter/sounds/flame-thrower.wav'],
    ['40', '06', '0006', '无数碎影', 'ABERRATION', '130', '14', '3.6', '10', 'BURST', '2.40', '18', '0.90', 'fx/projectiles/fragment_dart.png', 'fx/impact/fragment_spark.png', 'LIGHT', 'VOID', 'loot:fragment_cache', '6', '碎影快速游走射击，首波练习走位。', '16', 'ui/assets/topdown/top-down-shooter/characters/head/9.png', '0.8', 'ui/assets/topdown/top-down-shooter/effects/2.png', 'ui/assets/topdown/top-down-shooter/sounds/shoot-destroy.wav', 'ui/assets/topdown/top-down-shooter/sounds/shoot-1.wav'],
    ['40', '06', '0007', '虚潮行者', 'SHAMBLER', '150', '12', '2.9', '16', 'MANUAL', '0', '0', '0', '', '', 'LIGHT', 'VOID', 'loot:ichor_minor', '4', '只会贴身缠斗的虚潮行者，用来熟悉位移。', '14', 'ui/assets/topdown/top-down-shooter/characters/head/5.png', '0.88', 'ui/assets/topdown/top-down-shooter/effects/explosion.png', 'ui/assets/topdown/top-down-shooter/sounds/death.wav', '']
  ];
  writeTable('enemies.xlsx', rows);
}

function buildBosses() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'uint', 'uint', 'float', 'float', 'string', 'float', 'float', 'string', 'string', 'string', 'float', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'hp', 'armor', 'moveSpeed', 'enrageSpeed', 'signatureAttack', 'attackInterval', 'projectileLifetime', 'telegraphSprite', 'arenaModifier', 'sprite', 'spriteScale', 'deathSprite', 'deathSfx', 'themeTrack'],
    ['50', '07', '0001', '万口赞歌执政体', '9000', '25', '3.0', '20', '旋转虚空光束配合赞歌轰炸', '1.20', '0.80', 'fx/telegraph/choir_circle.png', '每 20 秒累积 1 层恐惧。', 'ui/assets/topdown/top-down-shooter/characters/tank-cannon.png', '1.1', 'ui/assets/topdown/top-down-shooter/effects/explosion.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-3.wav', 'ui/assets/topdown/top-down-shooter/music/theme-4.ogg'],
    ['50', '07', '0002', '潮汐引航巨像', '8200', '18', '2.4', '18', '锁链钩拖将玩家拉入潮汐航道', '2.10', '1.10', 'fx/telegraph/tidal_lane.png', '每 15 秒海潮横扫战场边缘。', 'ui/assets/topdown/top-down-shooter/characters/tank-base.png', '1.05', 'ui/assets/topdown/top-down-shooter/effects/5.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-2.wav', 'ui/assets/topdown/top-down-shooter/music/theme-4.ogg'],
    ['50', '07', '0003', '无名肃光灯塔', '9800', '32', '2.8', '24', '监视立柱抽离理智能量', '1.60', '0.95', 'fx/telegraph/beacon_grid.png', '激活时视野压缩至 65%。', 'ui/assets/topdown/top-down-shooter/background/door.gif', '1.0', 'ui/assets/topdown/top-down-shooter/effects/4.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-1.wav', 'ui/assets/topdown/top-down-shooter/music/theme-4.ogg']
  ];
  writeTable('bosses.xlsx', rows);
}

function buildWaves() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'uint', 'uint', 'tid', 'uint', 'float', 'string', 'string'],
    ['sector', 'category', 'serial', 'timestamp', 'duration', 'enemyId', 'count', 'spawnRadius', 'formation', 'notes'],
    ['60', '08', '0001', '3', '20', '40060007', '8', '12.0', 'ring', '虚潮行者只会缠斗，练习走位与护盾。'],
    ['60', '08', '0002', '28', '22', '40060006', '10', '8.5', 'swarm', '碎影涌入，速度快但血量低。'],
    ['60', '08', '0003', '54', '26', '40060001', '12', '10.5', 'ring', '餍爬者投掷腐质胆汁，学会绕开溅射区。'],
    ['60', '08', '0004', '86', '30', '40060002', '10', '9.0', 'arc', '歌祭徒三连音袭击，持续走位或击杀增幅者。'],
    ['60', '08', '0005', '124', '32', '40060003', '8', '8.5', 'cone', '呼嚎者扇形震荡波附理智流失，利用空挡反击。'],
    ['60', '08', '0006', '164', '34', '40060004', '6', '13.5', 'cross', '虚壳哨兵有 0.6 秒警示后扫射光束，注意走位。'],
    ['60', '08', '0007', '206', '40', '40060005', '8', '10.5', 'line', '掘锚者冲撞灯塔并引发震波，及时打断或闪避。']
  ];
  writeTable('waves.xlsx', rows);
}

function buildSkillTree() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'SkillBranch', 'uint', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'branch', 'node', 'name', 'branchName', 'tier', 'parent', 'effects', 'requirements', 'tooltip', 'icon'],
    ['70', '01', '0001', '裂变弹匣', '弹道', '1', '', 'multiShot:2|damage:+6', 'level:3', '触发时连续射出两轮弹幕。', 'icons/skill/ballistic-tier1.svg'],
    ['70', '01', '0002', '轨迹稳流', '弹道', '2', 'skill:70010001', 'multiShot:3|stability:+12|projectileSize:+12|multiShotAngle:4', 'level:6', '连续三轮射击并稳定弹道。', 'icons/skill/ballistic-tier2.svg'],
    ['70', '01', '0003', '深域贯穿', '弹道', '3', 'skill:70010002', 'multiShot:4|pierce:+1|ricochet:+1', 'level:9', '连续四轮射击并令子弹贯穿弹射。', 'icons/skill/ballistic-tier3.svg'],
    ['70', '02', '0001', '棱镜导光', '能量', '1', '', 'damage:+6|sanityDrain:-6|projectileSize:+18', 'level:4|weaponAttack:BEAM', '棱镜束缚能量消耗，同时扩大光束宽度。', 'icons/skill/energy-tier1.svg'],
    ['70', '02', '0002', '谐振折叠', '能量', '2', 'skill:70020001', 'damageMultiplier:+8|projectileSpeed:+14|stability:+8', 'level:7|weaponAttack:BEAM', '折叠振镜提高能量聚焦与射速。', 'icons/skill/energy-tier2.svg'],
    ['70', '02', '0003', '相干放射', '能量', '3', 'skill:70020002', 'ricochet:+1|crit:+6|damage:+12', 'level:10|weaponAttack:BEAM', '相干腔反复震荡，使光束可在敌间折射。', 'icons/skill/energy-tier3.svg'],
    ['70', '03', '0001', '相位壁垒', '护卫', '1', '', 'shield:+60|contactResist:+25|sanityRegen:+3', 'level:4', '展开相位护壁，降低接触伤害并补充理智。', 'icons/skill/guardian-tier1.svg'],
    ['70', '03', '0002', '护盾崩击', '护卫', '2', 'skill:70030001', 'meleeDamage:+70|meleeRadius:+20|meleeInterval:-0.5', 'level:7', '护盾冲击形成短距爆发，持续清理近身威胁。', 'icons/skill/guardian-tier2.svg'],
    ['70', '03', '0003', '寂光回响', '护卫', '3', 'skill:70030002', 'beamReflect:20%|shieldRegen:+16|invulnTime:+0.4', 'level:10', '护盾折射寂光，可短暂反弹能量。', 'icons/skill/guardian-tier3.svg'],
    ['70', '04', '0001', '术式镀层', '工坊', '1', '', 'projectileSize:+24|elementSlow:+18|elementSlowDuration:+1.2', 'level:5', '在弹体上刻蚀术式，对命中目标施加霜蚀减速。', 'icons/skill/workshop-tier1.svg'],
    ['70', '04', '0002', '弹道精铸', '工坊', '2', 'skill:70040001', 'split:+1|splitAngle:+4|pierce:+1', 'level:8', '精铸枪管令术弹再次分裂并保持贯穿。', 'icons/skill/workshop-tier2.svg'],
    ['70', '04', '0003', '秘火迸流', '工坊', '3', 'skill:70040002', 'damageMultiplier:+12|luckBonus:+12|projectileSpeed:+16', 'level:11', '秘火符文强化弹速与掉落运势。', 'icons/skill/workshop-tier3.svg']
  ];
  writeTable('skill_tree.xlsx', rows);
}

function buildSynergyCards() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'SynergyTier', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'tier', 'prerequisites', 'effects', 'trigger', 'icon'],
    ['71', '02', '0001', '深渊利维坦矛', 'MYTHIC', 'weapon:20020002|relic:30050003', 'damage:+24|pullStrength:+20', 'sanity:<40', 'icons/synergy/leviathan.png'],
    ['71', '02', '0002', '奇点圆舞', 'EPIC', 'weapon:20020001|relic:30050001', 'projectileSpeed:+18|split:+1|crit:+6', 'after:reload', 'icons/synergy/singularity.png'],
    ['71', '02', '0003', '炽天潮汐', 'RARE', 'relic:30050002|skill:70030002', 'slow:+12%|shield:+30|duration:+2', 'killstreak:15@20s', 'icons/synergy/seraph_tide.png'],
    ['71', '02', '0004', '逆潮蓄能阵', 'EPIC', 'weapon:20020003|skill:70040002', 'damageMultiplier:+12|ricochet:+1', 'after:maelstrom', 'icons/synergy/undertow_battery.png']
  ];
  writeTable('synergy_cards.xlsx', rows);
}

function main() {
  fs.ensureDirSync(baseDir);
  buildOperators();
  buildWeapons();
  buildRelics();
  buildEnemies();
  buildBosses();
  buildWaves();
  buildSkillTree();
  buildSynergyCards();
}

main();
