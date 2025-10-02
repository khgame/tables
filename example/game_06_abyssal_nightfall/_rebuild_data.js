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
    ['40', '06', '0001', '裂界餍爬者', 'SHAMBLER', '220', '24', '3.4', '12', 'AUTO', '1.80', '14', '0.90', 'fx/projectiles/spittle.png', 'fx/impact/slime.png', 'FIRE', 'VOID', 'loot:ichor_minor', '6', '投掷腐质胆汁，落地后留下灼蚀雾。', '18', 'ui/assets/topdown/top-down-shooter/characters/head/13.png', '0.9', 'ui/assets/topdown/top-down-shooter/effects/explosion.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-2.wav', 'ui/assets/topdown/top-down-shooter/sounds/shoot-2.wav'],
    ['40', '06', '0002', '聆渊歌祭徒', 'CULTIST', '260', '32', '3.1', '14', 'BURST', '2.40', '22', '0.85', 'fx/projectiles/choir_note.png', 'fx/impact/chorus.png', 'LIGHT', 'VOID', 'loot:choir_cache', '9', '三连音符袭击，第三发附加畏惧层。', '26', 'ui/assets/topdown/top-down-shooter/characters/head/7.png', '0.92', 'ui/assets/topdown/top-down-shooter/effects/4.png', 'ui/assets/topdown/top-down-shooter/sounds/death.wav', 'ui/assets/topdown/top-down-shooter/sounds/shoot-3.wav'],
    ['40', '06', '0003', '渊喉呼嚎者', 'ABERRATION', '340', '36', '4.0', '16', 'MANUAL', '2.80', '0', '0.00', 'fx/projectiles/howl_wave.png', 'fx/impact/howl.png', 'LIGHT', 'FROST', 'loot:howler_pouch', '12', '扇形震荡波附加 3 秒理智流失。', '32', 'ui/assets/topdown/top-down-shooter/characters/head/4.png', '0.95', 'ui/assets/topdown/top-down-shooter/effects/3.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-3.wav', 'ui/assets/topdown/top-down-shooter/sounds/sword-2.wav'],
    ['40', '06', '0004', '虚壳哨兵', 'CONSTRUCT', '420', '42', '2.6', '18', 'BEAM', '1.45', '60', '0.50', 'fx/projectiles/null_beam.png', 'fx/impact/null_burn.png', 'VOID', 'KINETIC', 'loot:sentinel_cache', '10', '扫射光束前有 0.6 秒警示。', '38', 'ui/assets/topdown/top-down-shooter/characters/turret/1.png', '1.05', 'ui/assets/topdown/top-down-shooter/effects/5.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-1.wav', 'ui/assets/topdown/top-down-shooter/sounds/alert.wav'],
    ['40', '06', '0005', '堕港掘锚者', 'CONSTRUCT', '520', '55', '2.2', '24', 'MANUAL', '1.10', '0', '0.00', 'fx/projectiles/dredger_slam.png', 'fx/impact/dredger_slam.png', 'FIRE', 'KINETIC', 'loot:dredger_core', '14', '冲撞灯塔并引发地震波，需快速躲避。', '46', 'ui/assets/topdown/top-down-shooter/characters/tank.png', '0.85', 'ui/assets/topdown/top-down-shooter/effects/explosion.png', 'ui/assets/topdown/top-down-shooter/sounds/explosion-3.wav', 'ui/assets/topdown/top-down-shooter/sounds/flame-thrower.wav'],
    ['40', '06', '0006', '无数碎影', 'ABERRATION', '160', '18', '4.8', '10', 'BURST', '1.90', '26', '0.75', 'fx/projectiles/fragment_dart.png', 'fx/impact/fragment_spark.png', 'LIGHT', 'VOID', 'loot:fragment_cache', '8', '群猎碎片成群而行，形成交叉弹雨。', '20', 'ui/assets/topdown/top-down-shooter/effects/1.png', '1.0', 'ui/assets/topdown/top-down-shooter/effects/2.png', 'ui/assets/topdown/top-down-shooter/sounds/shoot-destroy.wav', 'ui/assets/topdown/top-down-shooter/sounds/shoot-1.wav']
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
    ['60', '08', '0001', '3', '25', '40060001', '12', '11.5', 'ring', '先遣侦查，保持距离发射腐质胆汁。'],
    ['60', '08', '0002', '35', '30', '40060002', '10', '9.0', 'arc', '歌祭徒吟唱增幅附近同伴。'],
    ['60', '08', '0003', '75', '30', '40060003', '8', '7.5', 'cone', '雾潮袭来后出现呼嚎者，注意理智流失。'],
    ['60', '08', '0004', '115', '35', '40060004', '6', '13.5', 'cross', '虚壳哨兵扫描横扫，伴随餍爬者挤压。'],
    ['60', '08', '0005', '160', '35', '40060006', '14', '8.0', 'swarm', '碎影成群突进，逼迫频繁拉扯走位。'],
    ['60', '08', '0006', '210', '40', '40060005', '8', '10.5', 'line', '掘锚者直冲核心，需迅速打断。']
  ];
  writeTable('waves.xlsx', rows);
}

function buildSkillTree() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'SkillBranch', 'uint', 'string', 'string', 'string', 'string', 'string'],
    ['sector', 'branch', 'node', 'name', 'branchName', 'tier', 'parent', 'effects', 'requirements', 'tooltip', 'icon'],
    ['70', '01', '0001', '聚焦锚点', '精准', '1', '', '暴击:+5|稳定:+8', 'level:3', '提高命中稳定，解锁精准分支。', 'icons/skill/focal_anchor.png'],
    ['70', '01', '0002', '极速虹吸', '精准', '2', 'skill:70010001', '装填:-6%|暴击:+4', 'level:6', '装填更迅速并提升暴击。', 'icons/skill/rapid_siphon.png'],
    ['70', '01', '0003', '零点穿透', '精准', '3', 'skill:70010002', '伤害:+12|弱点:+20%', 'level:9', '子弹穿透时获得额外伤害。', 'icons/skill/zero_point.png'],
    ['70', '02', '0001', '以太共振', '以太', '1', '', '光束伤害:+6|理智消耗:-2', 'level:4', '持续型武器效率提升。', 'icons/skill/aether_resonance.png'],
    ['70', '02', '0002', '合唱激流', '以太', '2', 'skill:70020001', '蓄力:+4/s|半径:+0.8', 'level:7', '光束蓄力更快并扩大范围。', 'icons/skill/choir_surge.png'],
    ['70', '03', '0001', '回涌之握', '潮汐', '1', '', '牵引:+18|霜寒伤害:+10', 'level:5', '潮汐技能增强牵引力。', 'icons/skill/undertow.png'],
    ['70', '03', '0002', '裂潮坠落', '潮汐', '2', 'skill:70030001', '霜裂:+22|范围:+1.2', 'level:8', '爆裂范围扩大并追加寒霜伤害。', 'icons/skill/riptide_collapse.png'],
    ['70', '04', '0001', '护域壁垒', '守御', '1', '', '护盾:+40|理智恢复:+3', 'level:4', '短期内提高护盾与理智恢复。', 'icons/skill/ward_bastion.png'],
    ['70', '04', '0002', '炽天护壳', '守御', '2', 'skill:70040001', '护盾:+60|反射:15%', 'level:8', '护盾容量增加并反射部分激光。', 'icons/skill/seraphic_shell.png']
  ];
  writeTable('skill_tree.xlsx', rows);
}

function buildSynergyCards() {
  const rows = [
    ...rowsEmpty,
    ['@', '@', '@', 'string', 'SynergyTier', 'string', 'string', 'string', 'string'],
    ['sector', 'category', 'serial', 'name', 'tier', 'prerequisites', 'effects', 'trigger', 'icon'],
    ['71', '02', '0001', '深渊利维坦矛', 'MYTHIC', 'weapon:20020002|relic:30050003', '光束伤害:+28|牵引力:+20', 'sanity:<40', 'icons/synergy/leviathan.png'],
    ['71', '02', '0002', '奇点圆舞', 'EPIC', 'weapon:20020001|relic:30050001', '弹速:+18|环轨:+1|暴击:+6', 'after:reload', 'icons/synergy/singularity.png'],
    ['71', '02', '0003', '炽天潮汐', 'RARE', 'relic:30050002|skill:70040002', '减速:+12%|护盾:+30|持续:+2', 'killstreak:15@20s', 'icons/synergy/seraph_tide.png'],
    ['71', '02', '0004', '逆潮蓄能阵', 'EPIC', 'weapon:20020003|skill:70030002', '爆发伤害:+24|碎片:+1', 'after:maelstrom', 'icons/synergy/undertow_battery.png']
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
