const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const timeLabel = document.getElementById('timeLabel');
const waveInfoEl = document.getElementById('waveInfo');
const killLabel = document.getElementById('killLabel');
const heartContainer = document.getElementById('heartContainer');
const weaponNameEl = document.getElementById('weaponName');
const ammoIconsEl = document.getElementById('ammoIcons');
const relicLabel = document.getElementById('relicLabel');
const levelLabel = document.getElementById('levelLabel');
const xpLabel = document.getElementById('xpLabel');
const xpBar = document.getElementById('xpBar');
const eventFeedEl = document.getElementById('eventFeed');
const overlayEl = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const overlayOptions = document.getElementById('overlayOptions');
const overlaySkip = document.getElementById('overlaySkip');
const restartBtn = document.getElementById('restartBtn');

let resourcesCache = null;
let inputBound = false;
let lifecycle = { onGameEnd: null, onRestart: null };
let lastPreset = null;

const SCALE = 16;
const PLAYER_RADIUS = 16;
const ENEMY_RADIUS = 18;
const BULLET_RADIUS = 4;
const ENEMY_BULLET_RADIUS = 6;
const ARENA_PADDING = 48;
const TARGET_DURATION = 180; // seconds
const HEART_UNIT = 20; // every 20 hp is one heart

const keys = new Set();
const controls = {
  firing: false,
  aimX: 1,
  aimY: 0
};

const state = {
  mode: 'loading',
  time: 0,
  lastTime: 0,
  nextWaveIndex: 0,
  waves: [],
  enemies: [],
  enemyTemplates: [],
  bullets: [],
  enemyProjectiles: [],
  effects: [],
  logs: [],
  killCount: 0,
  player: null,
  weapon: null,
  relic: null,
  sanityCap: 120,
  sanity: 120,
  invulnTimer: 0,
  stats: null,
  level: 1,
  xp: 0,
  xpNeeded: 60,
  baseCrit: 0.05,
  skillTree: [],
  synergyCards: [],
  unlockedSkills: new Set(),
  unlockedSynergies: new Set(),
  upgradeQueue: [],
  library: null,
  currentPreset: null,
  bossTemplates: [],
  runId: 0,
  lastSummary: null
};

function loadJson(file) {
  return fetch(file).then(res => {
    if (!res.ok) throw new Error(`无法加载 ${file}`);
    return res.json();
  });
}

async function loadResources() {
  if (resourcesCache) return resourcesCache;
  const [operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards] = await Promise.all([
    loadJson('./operators.json'),
    loadJson('./weapons.json'),
    loadJson('./relics.json'),
    loadJson('./enemies.json'),
    loadJson('./bosses.json'),
    loadJson('./waves.json'),
    loadJson('./skill_tree.json'),
    loadJson('./synergy_cards.json')
  ]);
  resourcesCache = { operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards };
  return resourcesCache;
}

function toArray(converted) {
  return Object.entries(converted.result || {}).map(([tid, payload]) => ({ tid, ...payload }));
}

function normalizeSlug(name = '') {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function findBySlug(list, slug, fallbackIndex = 0) {
  if (!list.length) return null;
  if (!slug) return list[fallbackIndex] || list[0];
  const exact = list.find(entry => entry.tid === slug);
  if (exact) return exact;
  const key = slug.includes(':') ? slug.split(':')[1] : slug;
  return (
    list.find(entry => normalizeSlug(entry.name) === key) ||
    list[fallbackIndex] ||
    list[0]
  );
}

function findByTid(list, tid) {
  if (!tid) return null;
  return list.find(entry => entry.tid === tid) || null;
}

function pushLog(message) {
  state.logs.unshift(`[${formatTime(state.time)}] ${message}`);
  state.logs = state.logs.slice(0, 10);
  eventFeedEl.innerHTML = state.logs
    .map(entry => `<div>${entry}</div>`)
    .join('');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function length(x, y) {
  return Math.hypot(x, y);
}

function normalize(x, y) {
  const len = length(x, y) || 1;
  return [x / len, y / len];
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function xpForLevel(level) {
  return Math.round(60 * Math.pow(level, 1.35));
}

function renderHearts() {
  if (!state.player) return;
  const totalHearts = Math.ceil(state.player.hpMax / HEART_UNIT);
  heartContainer.innerHTML = '';
  for (let i = 0; i < totalHearts; i++) {
    const fill = clamp((state.player.hp - i * HEART_UNIT) / HEART_UNIT, 0, 1);
    const span = document.createElement('span');
    span.className = 'heart';
    span.style.setProperty('--fill', fill);
    heartContainer.appendChild(span);
  }
  const shield = state.player.shield || 0;
  if (shield > 0) {
    const shieldHearts = Math.ceil(shield / HEART_UNIT);
    for (let i = 0; i < shieldHearts; i++) {
      const fill = clamp((shield - i * HEART_UNIT) / HEART_UNIT, 0, 1);
      const span = document.createElement('span');
      span.className = 'heart shield';
      span.style.setProperty('--fill', fill);
      heartContainer.appendChild(span);
    }
  }
}

function renderAmmo() {
  if (!state.weapon) return;
  ammoIconsEl.innerHTML = '';
  const total = state.weapon.baseMagazine;
  for (let i = 0; i < total; i++) {
    const bullet = document.createElement('span');
    bullet.className = 'bullet';
    if (i >= state.weapon.ammo) bullet.classList.add('empty');
    ammoIconsEl.appendChild(bullet);
  }
}

function updateHUD() {
  timeLabel.textContent = formatTime(state.time);
  killLabel.textContent = state.killCount.toString();
  weaponNameEl.textContent = state.weapon ? state.weapon.template.name : '';
  renderHearts();
  renderAmmo();

  if (state.relic && state.relic.template) {
    if (state.relic.activeTimer > 0) {
      relicLabel.textContent = `遗物激活 ${state.relic.activeTimer.toFixed(1)}s`;
    } else if (state.relic.cooldownTimer > 0) {
      relicLabel.textContent = `遗物冷却 ${state.relic.cooldownTimer.toFixed(1)}s`;
    } else {
      relicLabel.textContent = '遗物就绪 (空格)';
    }
  } else {
    relicLabel.textContent = '未装备遗物';
  }

  const currentWave = Math.min(state.nextWaveIndex, state.waves.length);
  if (state.nextWaveIndex < state.waves.length) {
    const wave = state.waves[state.nextWaveIndex];
    const eta = Math.max(0, wave.timestamp - state.time);
    waveInfoEl.textContent = `Wave ${currentWave + 1}/${state.waves.length} · ${wave.enemyId} ×${wave.count} · ${eta.toFixed(1)}s`;
  } else if (state.enemies.length) {
    waveInfoEl.textContent = `Wave ${currentWave}/${state.waves.length} · 清理剩余敌人`;
  } else {
    waveInfoEl.textContent = `Wave ${state.waves.length}/${state.waves.length}`;
  }

  levelLabel.textContent = state.level.toString();
  xpLabel.textContent = `${Math.round(state.xp)} / ${state.xpNeeded}`;
  xpBar.style.width = `${clamp((state.xp / state.xpNeeded) * 100, 0, 100)}%`;
}

function queueUpgrade(reason) {
  state.upgradeQueue.push({ reason });
  processUpgradeQueue();
}

function processUpgradeQueue() {
  if (state.mode !== 'playing') return;
  if (!state.upgradeQueue.length) return;
  openUpgradePanel(state.upgradeQueue.shift());
}

function openUpgradePanel(job) {
  const options = buildUpgradeOptions(job.reason);
  if (!options.length) {
    applyFallbackUpgrade(job.reason);
    processUpgradeQueue();
    return;
  }
  state.mode = 'levelup';
  overlayTitle.textContent = job.reason === 'level' ? `等级 ${state.level}` : '协同机会';
  overlaySubtitle.textContent = job.reason === 'level'
    ? '抽取一项升级强化你的舰队。'
    : '满足条件的协同卡现已开放。';
  overlayOptions.innerHTML = '';
  options.forEach(option => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'option-card';
    const meta = option.type === 'skill'
      ? `分支 ${option.data.branchName} · 阶段 ${option.data.tier}`
      : `品质 ${option.data.tier}`;
    const effects = option.data.effects ? formatEffects(option.data.effects) : '——';
    card.innerHTML = `
      <h3>${option.data.name}</h3>
      <p>${option.description}</p>
      <div class="option-meta">${meta}</div>
      <div class="option-meta">${effects}</div>
    `;
    card.addEventListener('click', () => {
      overlayEl.classList.add('hidden');
      state.mode = 'playing';
      applyUpgradeOption(option);
      processUpgradeQueue();
    });
    overlayOptions.appendChild(card);
  });
  overlayEl.classList.remove('hidden');
}

overlaySkip.addEventListener('click', () => {
  overlayEl.classList.add('hidden');
  state.mode = 'playing';
  processUpgradeQueue();
});

function buildUpgradeOptions(reason) {
  const skillCandidates = getAvailableSkills();
  const synergyCandidates = getAvailableSynergies();
  const options = [];
  shuffle(skillCandidates);
  shuffle(synergyCandidates);
  if (skillCandidates.length) {
    options.push(...skillCandidates.slice(0, 2).map(node => ({ type: 'skill', data: node, description: node.tooltip })));
  }
  if (options.length < 3 && synergyCandidates.length) {
    options.push(...synergyCandidates.slice(0, 3 - options.length).map(card => ({ type: 'synergy', data: card, description: card.trigger || '协同效果常驻生效。' })));
  }
  if (!options.length && skillCandidates.length) {
    options.push({ type: 'skill', data: skillCandidates[0], description: skillCandidates[0].tooltip });
  }
  return options;
}

function applyFallbackUpgrade(reason) {
  state.stats.damageFlat += 8;
  pushLog(reason === 'level' ? '基础强化：伤害 +8' : '协同缺失：转化为伤害 +8');
}

function getAvailableSkills() {
  return state.skillTree.filter(node => {
    if (state.unlockedSkills.has(node.tid)) return false;
    if (node.parent) {
      const parentId = node.parent.split(':')[1] || node.parent;
      if (!state.unlockedSkills.has(parentId)) return false;
    }
    return requirementsMet(node.requirements);
  });
}

function getAvailableSynergies() {
  return state.synergyCards.filter(card => {
    if (state.unlockedSynergies.has(card.tid)) return false;
    return prerequisitesMet(card.prerequisites);
  });
}

function requirementsMet(requirements = '') {
  if (!requirements) return true;
  return requirements.split('|').every(token => {
    const [kind, value] = token.split(':');
    if (!value) return true;
    if (kind === 'level') return state.level >= Number(value);
    if (kind === 'skill') return state.unlockedSkills.has(value);
    return true;
  });
}

function prerequisitesMet(prerequisites = '') {
  if (!prerequisites) return true;
  return prerequisites.split('|').every(token => {
    const [kind, value] = token.split(':');
    if (!value) return true;
    switch (kind) {
      case 'weapon':
        return state.weapon && state.weapon.template && (state.weapon.template.tid.endsWith(value) || normalizeSlug(state.weapon.template.name) === value);
      case 'relic':
        return state.relic && state.relic.template && (state.relic.template.tid.endsWith(value) || normalizeSlug(state.relic.template.name) === value);
      case 'skill':
        return state.unlockedSkills.has(value);
      default:
        return true;
    }
  });
}

function applyUpgradeOption(option) {
  if (option.type === 'skill') {
    unlockSkill(option.data);
  } else if (option.type === 'synergy') {
    unlockSynergy(option.data);
  }
  updateHUD();
}

function unlockSkill(node) {
  if (state.unlockedSkills.has(node.tid)) return;
  state.unlockedSkills.add(node.tid);
  applyEffectsString(node.effects);
  pushLog(`习得技能：${node.name}`);
}

function unlockSynergy(card) {
  if (state.unlockedSynergies.has(card.tid)) return;
  state.unlockedSynergies.add(card.tid);
  applyEffectsString(card.effects);
  pushLog(`激活协同：${card.name}`);
}

function applyEffectsString(effects = '') {
  effects.split('|').map(token => token.trim()).filter(Boolean).forEach(token => applyEffectToken(token));
}

function applyEffectToken(token) {
  const [rawKey, rawValue] = token.split(':');
  if (!rawValue) return;
  const key = rawKey.trim();
  const valueStr = rawValue.trim();
  const numericValue = parseFloat(valueStr.replace(/[^-0-9.]/g, '')) || 0;
  switch (key) {
    case 'damage':
    case 'beamDamage':
    case 'burstDamage':
    case 'frostDamage':
    case 'frostShatter':
      state.stats.damageFlat += numericValue;
      break;
    case 'fireRate':
      state.stats.fireRateMultiplier *= 1 + numericValue / 100;
      break;
    case 'reload':
      state.stats.reloadMultiplier *= 1 + numericValue / 100;
      break;
    case 'crit':
      state.stats.critBonus += numericValue / 100;
      break;
    case 'weakPoint':
      state.stats.critDamageBonus += numericValue / 100;
      break;
    case 'stability':
      state.stats.spreadMultiplier *= 1 - numericValue / 100;
      state.stats.spreadMultiplier = Math.max(0.3, state.stats.spreadMultiplier);
      break;
    case 'sanityDrain':
      state.stats.relicSanityReduction += numericValue;
      break;
    case 'radius':
      state.stats.relicRadiusBonus += numericValue;
      break;
    case 'pullStrength':
      state.stats.pullStrength += numericValue;
      break;
    case 'shield':
      addShield(numericValue);
      break;
    case 'sanityRegen':
      state.stats.sanityRegen += numericValue;
      break;
    case 'beamReflect':
      state.stats.beamReflect = Math.min(0.8, state.stats.beamReflect + numericValue / 100);
      break;
    case 'projectileSpeed':
      state.stats.projectileSpeedBonus += numericValue;
      break;
    case 'slow':
      state.stats.maelstromSlow += numericValue / 100;
      break;
    case 'duration':
      state.stats.relicDurationBonus += numericValue;
      break;
    case 'damageMultiplier':
      state.stats.damageBonusMultiplier *= 1 + numericValue / 100;
      break;
    default:
      break;
  }
}

function addShield(amount) {
  if (!state.player) return;
  state.player.shieldMax = (state.player.shieldMax || 0) + amount;
  state.player.shield = (state.player.shield || 0) + amount;
}

function spawnWave(waveDef) {
  const template = resolveEnemyTemplate(waveDef.enemyId);
  if (!template) return;
  for (let i = 0; i < waveDef.count; i++) {
    const angle = (Math.PI * 2 * i) / waveDef.count;
    const radius = waveDef.spawnRadius * SCALE + Math.random() * 24;
    const x = canvas.width / 2 + Math.cos(angle) * radius;
    const y = canvas.height / 2 + Math.sin(angle) * radius;
    state.enemies.push({
      template,
      hp: template.hp,
      x,
      y,
      speed: template.moveSpeed * SCALE,
      attackTimer: template.attackInterval || 0,
      damage: template.damage,
      sanityDamage: template.sanityDamage,
      alive: true
    });
  }
  pushLog(`Wave ${state.nextWaveIndex + 1}: 出现 ${waveDef.count} 个 ${template.name}`);
}

function handleInput(dt) {
  if (!state.player || state.mode !== 'playing') return;
  let dx = 0;
  let dy = 0;
  if (keys.has('KeyW')) dy -= 1;
  if (keys.has('KeyS')) dy += 1;
  if (keys.has('KeyA')) dx -= 1;
  if (keys.has('KeyD')) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const [nx, ny] = normalize(dx, dy);
    state.player.x += nx * state.player.moveSpeed * dt;
    state.player.y += ny * state.player.moveSpeed * dt;
  }
  state.player.x = clamp(state.player.x, ARENA_PADDING, canvas.width - ARENA_PADDING);
  state.player.y = clamp(state.player.y, ARENA_PADDING, canvas.height - ARENA_PADDING);

  const weapon = state.weapon;
  if (!weapon) return;
  weapon.fireTimer = Math.max(0, weapon.fireTimer - dt);
  if (weapon.reloadTimer > 0) {
    weapon.reloadTimer = Math.max(0, weapon.reloadTimer - dt);
    if (weapon.reloadTimer === 0) {
      weapon.ammo = weapon.baseMagazine;
      pushLog('装填完成');
    }
    return;
  }
  if (!controls.firing || weapon.fireTimer > 0) return;
  if (weapon.ammo <= 0) {
    weapon.reloadTimer = weapon.baseReload * state.stats.reloadMultiplier;
    pushLog('子弹耗尽，开始装填');
    return;
  }
  fireWeapon();
}

function fireWeapon() {
  const weapon = state.weapon;
  weapon.ammo -= 1;
  weapon.fireTimer = weapon.baseFireRate * state.stats.fireRateMultiplier;
  if (weapon.ammo <= 0) {
    weapon.reloadTimer = weapon.baseReload * state.stats.reloadMultiplier;
  }
  const [dirX, dirY] = normalize(controls.aimX, controls.aimY);
  const spread = Math.max(0, (weapon.baseSpread || 0) * state.stats.spreadMultiplier);
  const offset = spread > 0 ? (Math.random() - 0.5) * (spread * Math.PI / 180) : 0;
  const cos = Math.cos(offset);
  const sin = Math.sin(offset);
  const fx = dirX * cos - dirY * sin;
  const fy = dirX * sin + dirY * cos;
  const speed = (weapon.baseProjectileSpeed + state.stats.projectileSpeedBonus) * SCALE;
  state.bullets.push({
    x: state.player.x + fx * PLAYER_RADIUS,
    y: state.player.y + fy * PLAYER_RADIUS,
    vx: fx * speed,
    vy: fy * speed,
    life: weapon.template.projectileLifetime,
    damage: computeShotDamage()
  });
}

function computeShotDamage() {
  let damage = (state.weapon.baseDamage + state.stats.damageFlat) * state.stats.damageBonusMultiplier;
  damage = Math.max(1, damage);
  const critChance = clamp(state.baseCrit + state.stats.critBonus, 0, 0.8);
  if (Math.random() < critChance) {
    damage *= 1.5 + state.stats.critDamageBonus;
    pushLog('暴击造成额外伤害');
  }
  return damage;
}

function applyPlayerDamage(amount, source, sanityLoss = 0, options = {}) {
  if (state.mode !== 'playing') return;
  if (!options.bypassInvuln && state.invulnTimer > 0) return;
  let remaining = amount;
  if (!options.bypassShield) {
    const shield = state.player.shield || 0;
    if (shield > 0) {
      const absorbed = Math.min(shield, remaining);
      state.player.shield -= absorbed;
      remaining -= absorbed;
      if (absorbed > 0) pushLog(`护盾吸收 ${Math.round(absorbed)} 伤害`);
    }
  }
  if (remaining <= 0) return;
  state.player.hp -= remaining;
  state.sanity = Math.max(0, state.sanity - sanityLoss);
  if (!options.bypassInvuln) state.invulnTimer = options.invuln || 0.8;
  if (options.log !== false) pushLog(`${source} 造成 ${Math.round(remaining)} 伤害`);
  if (state.player.hp <= 0) gameOver('defeat', '你倒在邪潮之中。');
}

function killEnemy(enemy, source = '射击') {
  if (!enemy.alive) return;
  enemy.alive = false;
  state.killCount += 1;
  pushLog(`${source} 击杀 ${enemy.template.name}`);
  gainXp(enemy.template.xp || 20);
}

function gainXp(amount) {
  state.xp += amount;
  while (state.xp >= state.xpNeeded) {
    state.xp -= state.xpNeeded;
    state.level += 1;
    state.xpNeeded = xpForLevel(state.level);
    queueUpgrade('level');
  }
}

function performEnemyAttack(enemy) {
  const template = enemy.template;
  enemy.attackTimer = template.attackInterval;
  const [dirX, dirY] = normalize(state.player.x - enemy.x, state.player.y - enemy.y);
  switch (template.attackStyle) {
    case 'BURST': {
      const spread = 0.22;
      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * spread;
        const cos = Math.cos(offset);
        const sin = Math.sin(offset);
        const fx = dirX * cos - dirY * sin;
        const fy = dirX * sin + dirY * cos;
        state.enemyProjectiles.push({
          x: enemy.x + fx * ENEMY_RADIUS,
          y: enemy.y + fy * ENEMY_RADIUS,
          vx: fx * template.projectileSpeed * SCALE,
          vy: fy * template.projectileSpeed * SCALE,
          life: template.projectileLifetime,
          damage: Math.round(template.damage * 0.6),
          sanity: Math.round(template.sanityDamage * 0.5),
          label: template.name
        });
      }
      break;
    }
    case 'MANUAL': {
      state.effects.push({
        type: 'shockwave',
        x: enemy.x,
        y: enemy.y,
        elapsed: 0,
        duration: template.projectileLifetime || 0.8,
        maxRadius: Math.max(180, template.projectileSpeed * SCALE * (template.projectileLifetime || 0.6)),
        damage: template.damage,
        sanity: template.sanityDamage,
        detonated: false,
        label: template.name
      });
      break;
    }
    case 'BEAM': {
      state.effects.push({
        type: 'beam',
        x: enemy.x,
        y: enemy.y,
        dirX,
        dirY,
        elapsed: 0,
        duration: template.projectileLifetime || 0.9,
        length: Math.max(320, template.projectileSpeed * SCALE * template.projectileLifetime || 420),
        width: 28,
        dps: template.damage * Math.max(0.05, 1 - state.stats.beamReflect),
        sanity: template.sanityDamage * 0.8,
        label: template.name
      });
      break;
    }
    default:
      break;
  }
}

function updateBullets(dt) {
  state.bullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  });
  state.bullets = state.bullets.filter(bullet => bullet.life > 0 && bullet.x >= -40 && bullet.x <= canvas.width + 40 && bullet.y >= -40 && bullet.y <= canvas.height + 40);
}

function updateEnemyProjectiles(dt) {
  state.enemyProjectiles.forEach(projectile => {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (projectile.life <= 0) return;
    const dist = length(state.player.x - projectile.x, state.player.y - projectile.y);
    if (dist <= PLAYER_RADIUS + ENEMY_BULLET_RADIUS) {
      applyPlayerDamage(projectile.damage, projectile.label, projectile.sanity, { invuln: 0.5 });
      projectile.life = -1;
    }
  });
  state.enemyProjectiles = state.enemyProjectiles.filter(projectile => projectile.life > 0);
}

function updateEffects(dt) {
  state.effects.forEach(effect => {
    effect.elapsed += dt;
    if (effect.type === 'maelstrom') {
      const ratio = Math.min(effect.elapsed / effect.duration, 1);
      effect.radius = effect.maxRadius * ratio;
      const pullStrength = (260 + state.stats.pullStrength) * dt;
      const slowFactor = 1 - Math.min(0.6, state.stats.maelstromSlow);
      state.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        const dx = enemy.x - effect.x;
        const dy = enemy.y - effect.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist <= effect.radius) {
          enemy.x -= (dx / dist) * pullStrength * slowFactor;
          enemy.y -= (dy / dist) * pullStrength * slowFactor;
        }
      });
      if (!effect.detonated && effect.elapsed >= effect.duration) {
        effect.detonated = true;
        const blast = effect.finalDamage + state.stats.relicDamageFlat;
        state.enemies.forEach(enemy => {
          if (!enemy.alive) return;
          const dist = length(enemy.x - effect.x, enemy.y - effect.y);
          if (dist <= effect.radius + ENEMY_RADIUS) {
            enemy.hp -= blast;
            if (enemy.hp <= 0) killEnemy(enemy, '遗物爆裂');
          }
        });
        pushLog('遗物漩涡爆裂造成伤害');
      }
    } else if (effect.type === 'shockwave') {
      effect.radius = effect.maxRadius * Math.min(effect.elapsed / effect.duration, 1);
      if (!effect.detonated && effect.elapsed >= effect.duration * 0.6) {
        effect.detonated = true;
        const dist = length(state.player.x - effect.x, state.player.y - effect.y);
        if (dist <= effect.radius + PLAYER_RADIUS) {
          applyPlayerDamage(effect.damage, effect.label || '冲击波', effect.sanity, { bypassInvuln: true });
        }
      }
    } else if (effect.type === 'beam') {
      const len = effect.length;
      const px = state.player.x - effect.x;
      const py = state.player.y - effect.y;
      const proj = px * effect.dirX + py * effect.dirY;
      if (proj > 0 && proj < len) {
        const perp = Math.abs(px * effect.dirY - py * effect.dirX);
        if (perp <= effect.width) {
          applyPlayerDamage(effect.dps * dt, effect.label || '光束', effect.sanity * dt, { bypassInvuln: true, log: false, invuln: 0 });
        }
      }
    }
  });
  state.effects = state.effects.filter(effect => effect.type === 'maelstrom' ? effect.elapsed <= effect.duration + 0.4 : effect.elapsed <= effect.duration);
}

function updateRelic(dt) {
  if (!state.relic) return;
  state.relic.cooldownTimer = Math.max(0, state.relic.cooldownTimer - dt);
  state.relic.activeTimer = Math.max(0, state.relic.activeTimer - dt);
}

function updateEnemies(dt) {
  const player = state.player;
  state.enemies = state.enemies.filter(enemy => {
    if (!enemy.alive) return false;
    const [nx, ny] = normalize(player.x - enemy.x, player.y - enemy.y);
    enemy.x += nx * enemy.speed * dt;
    enemy.y += ny * enemy.speed * dt;
    for (const bullet of state.bullets) {
      const dist = length(enemy.x - bullet.x, enemy.y - bullet.y);
      if (dist <= ENEMY_RADIUS) {
        enemy.hp -= bullet.damage;
        bullet.life = -1;
        if (enemy.hp <= 0) {
          killEnemy(enemy);
          break;
        }
      }
    }
    if (!enemy.alive) return false;
    const distPlayer = length(player.x - enemy.x, player.y - enemy.y);
    if (distPlayer <= PLAYER_RADIUS + ENEMY_RADIUS) {
      applyPlayerDamage(enemy.damage, enemy.template.name, enemy.sanityDamage);
    }
    if (enemy.template.attackInterval) {
      enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
      if (enemy.attackTimer === 0) performEnemyAttack(enemy);
    }
    return true;
  });
}

function updateWaves() {
  while (state.nextWaveIndex < state.waves.length && state.time >= state.waves[state.nextWaveIndex].timestamp) {
    spawnWave(state.waves[state.nextWaveIndex]);
    state.nextWaveIndex += 1;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderGrid();
  renderEffects();
  renderBullets();
  renderEnemyProjectiles();
  renderPlayer();
  renderEnemies();
  renderGameOverTint();
}

function renderGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(59,130,246,0.08)';
  ctx.lineWidth = 1;
  const grid = 32;
  for (let x = grid; x < canvas.width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = grid; y < canvas.height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function renderPlayer() {
  ctx.save();
  ctx.translate(state.player.x, state.player.y);
  if (state.player.shield > 0) {
    const ratio = Math.min(1, state.player.shield / (state.player.shieldMax || state.player.shield));
    ctx.strokeStyle = 'rgba(147,197,253,0.85)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
  }
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function renderBullets() {
  ctx.fillStyle = '#f97316';
  state.bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderEnemyProjectiles() {
  ctx.fillStyle = '#f87171';
  state.enemyProjectiles.forEach(projectile => {
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, ENEMY_BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderEnemies() {
  state.enemies.forEach(enemy => {
    ctx.fillStyle = 'rgba(248,113,113,0.88)';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, ENEMY_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function renderEffects() {
  state.effects.forEach(effect => {
    if (effect.type === 'maelstrom') {
      ctx.save();
      const gradient = ctx.createRadialGradient(effect.x, effect.y, Math.max(effect.radius - 40, 0), effect.x, effect.y, effect.radius);
      gradient.addColorStop(0, 'rgba(56,189,248,0.35)');
      gradient.addColorStop(1, 'rgba(56,189,248,0.05)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (effect.type === 'shockwave') {
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,0.45)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (effect.type === 'beam') {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.rotate(Math.atan2(effect.dirY, effect.dirX));
      ctx.fillStyle = 'rgba(147,197,253,0.38)';
      ctx.fillRect(0, -effect.width, effect.length, effect.width * 2);
      ctx.restore();
    }
  });
}

function renderGameOverTint() {
  if (state.mode === 'victory' || state.mode === 'defeat') {
    ctx.save();
    ctx.fillStyle = state.mode === 'victory' ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function update(dt) {
  state.time += dt;
  state.invulnTimer = Math.max(0, state.invulnTimer - dt);
  if (state.stats.sanityRegen > 0 && state.sanity < state.sanityCap) {
    state.sanity = clamp(state.sanity + state.stats.sanityRegen * dt, 0, state.sanityCap);
  }
  updateRelic(dt);
  handleInput(dt);
  updateBullets(dt);
  updateEnemyProjectiles(dt);
  updateEnemies(dt);
  updateEffects(dt);
  updateWaves();
  updateHUD();
  render();

  state.bullets = state.bullets.filter(bullet => bullet.life > 0);

  if (state.sanity <= 0) gameOver('defeat', '理智归零，你被黑暗吞噬');
  if (state.time >= TARGET_DURATION && state.enemies.length === 0 && state.nextWaveIndex >= state.waves.length) {
    gameOver('victory', '黎明到来，你成功守住灯塔');
  }
}

function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;
  if (state.mode === 'playing') update(dt); else render();
  requestAnimationFrame(gameLoop);
}

function gameOver(mode, message) {
  if (state.mode !== 'playing') return;
  state.mode = mode;
  pushLog(message);
  updateHUD();
  render();
  restartBtn.classList.add('visible');
  const summary = buildRunSummary(mode, message);
  if (lifecycle.onGameEnd) {
    lifecycle.onGameEnd(summary);
  }
}

function buildRunSummary(mode, message) {
  const summary = {
    result: mode,
    message,
    runId: state.runId,
    time: state.time,
    formattedTime: formatTime(state.time),
    killCount: state.killCount,
    wavesCleared: Math.min(state.nextWaveIndex, state.waves.length),
    level: state.level,
    xp: Math.round(state.xp),
    operator: state.player ? state.player.name : '',
    operatorTid: state.currentPreset ? state.currentPreset.operatorTid : null,
    weapon: state.weapon && state.weapon.template ? state.weapon.template.name : null,
    weaponTid: state.currentPreset ? state.currentPreset.weaponTid : null,
    relic: state.relic && state.relic.template ? state.relic.template.name : null,
    relicTid: state.currentPreset ? state.currentPreset.relicTid : null,
    unlockedSkills: Array.from(state.unlockedSkills).map(tid => ({ tid, name: resolveEntryName(state.skillTree, tid) })),
    unlockedSynergies: Array.from(state.unlockedSynergies).map(tid => ({ tid, name: resolveEntryName(state.synergyCards, tid) })),
    log: [...state.logs],
    timestamp: Date.now(),
    preset: state.currentPreset ? { ...state.currentPreset } : null
  };
  state.lastSummary = summary;
  return summary;
}

function resolveEntryName(list, tid) {
  const entry = findByTid(list || [], tid);
  return entry ? entry.name : tid;
}

function setupInput() {
  if (inputBound) return;
  inputBound = true;
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.mode === 'playing') activateRelic();
      return;
    }
    if (state.mode === 'levelup') return;
    keys.add(e.code);
  });
  window.addEventListener('keyup', e => {
    keys.delete(e.code);
  });
  canvas.addEventListener('mousedown', () => {
    if (state.mode === 'playing') controls.firing = true;
  });
  canvas.addEventListener('mouseup', () => {
    controls.firing = false;
  });
  canvas.addEventListener('mouseleave', () => {
    controls.firing = false;
  });
  canvas.addEventListener('mousemove', e => {
    if (!state.player) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - state.player.x;
    const my = e.clientY - rect.top - state.player.y;
    const [nx, ny] = normalize(mx, my);
    controls.aimX = nx;
    controls.aimY = ny;
  });
  restartBtn.addEventListener('click', () => {
    restartBtn.classList.remove('visible');
    if (lifecycle.onRestart) {
      lifecycle.onRestart(state.lastSummary, state.currentPreset || lastPreset);
    } else {
      window.location.reload();
    }
  });
}

function activateRelic() {
  if (!state.relic || state.mode !== 'playing') return;
  if (state.relic.cooldownTimer > 0 || state.relic.activeTimer > 0) return;
  const template = state.relic.template;
  const sanityCost = Math.max(0, template.sanityDrain - state.stats.relicSanityReduction);
  if (state.sanity < sanityCost) {
    pushLog('理智不足，无法释放遗物');
    return;
  }
  state.sanity = Math.max(0, state.sanity - sanityCost);
  state.relic.cooldownTimer = template.cooldown;
  const duration = template.duration + state.stats.relicDurationBonus;
  state.relic.activeTimer = duration;
  const radiusUnits = template.radius + state.stats.relicRadiusBonus;
  const baseBlast = template.name.includes('Maelstrom') ? 88 : 60;
  state.effects.push({
    type: 'maelstrom',
    x: state.player.x,
    y: state.player.y,
    elapsed: 0,
    duration,
    maxRadius: radiusUnits * SCALE,
    finalDamage: baseBlast,
    detonated: false
  });
  pushLog(`释放遗物：${template.name}`);
}

function bootstrap(resources, preset = {}) {
  const operators = toArray(resources.operators);
  const weapons = toArray(resources.weapons);
  const relics = toArray(resources.relics);
  const enemies = toArray(resources.enemies);
  const bosses = resources.bosses ? toArray(resources.bosses) : [];
  const waves = toArray(resources.waves).sort((a, b) => a.timestamp - b.timestamp);
  const skillTree = toArray(resources.skillTree);
  const synergyCards = toArray(resources.synergyCards);

  state.library = { operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards };
  state.enemyTemplates = enemies;
  state.bossTemplates = bosses;
  state.waves = waves;
  state.skillTree = skillTree;
  state.synergyCards = synergyCards;

  state.runId += 1;
  state.mode = 'loading';
  state.time = 0;
  state.lastTime = 0;
  state.invulnTimer = 0;
  state.nextWaveIndex = 0;
  state.enemies = [];
  state.bullets = [];
  state.enemyProjectiles = [];
  state.effects = [];
  state.killCount = 0;
  state.logs = [];
  state.level = 1;
  state.xp = 0;
  state.xpNeeded = xpForLevel(1);
  state.unlockedSkills.clear();
  state.unlockedSynergies.clear();
  state.upgradeQueue = [];
  state.lastSummary = null;

  const operator = findByTid(operators, preset.operatorTid) || findBySlug(operators, preset.operatorSlug || '', 0) || operators[0];
  if (!operator) {
    pushLog('未找到可用的操作者。');
    state.mode = 'idle';
    return;
  }

  const weaponTemplate = findByTid(weapons, preset.weaponTid) || findBySlug(weapons, preset.weaponSlug || operator.startWeapon, 0) || weapons[0] || null;
  const relicTemplate = findByTid(relics, preset.relicTid) || findBySlug(relics, preset.relicSlug || operator.startRelic, 0) || relics[0] || null;

  state.currentPreset = {
    operatorTid: operator.tid,
    weaponTid: weaponTemplate ? weaponTemplate.tid : null,
    relicTid: relicTemplate ? relicTemplate.tid : null,
    timestamp: Date.now()
  };
  lastPreset = state.currentPreset;

  state.player = {
    name: operator.codename,
    x: canvas.width / 2,
    y: canvas.height / 2,
    hp: operator.hp,
    hpMax: operator.hp,
    moveSpeed: operator.moveSpeed * SCALE,
    shield: 0,
    shieldMax: 0
  };

  if (weaponTemplate) {
    state.weapon = {
      template: weaponTemplate,
      baseDamage: weaponTemplate.damage,
      baseFireRate: weaponTemplate.fireRate,
      baseReload: weaponTemplate.reload * (operator.reloadBonus || 1),
      baseMagazine: weaponTemplate.magazine,
      baseSpread: weaponTemplate.spread || 0,
      baseProjectileSpeed: weaponTemplate.projectileSpeed,
      ammo: weaponTemplate.magazine,
      fireTimer: 0,
      reloadTimer: 0
    };
  } else {
    state.weapon = null;
  }

  if (relicTemplate) {
    state.relic = {
      template: relicTemplate,
      cooldownTimer: 0,
      activeTimer: 0
    };
  } else {
    state.relic = null;
  }

  state.sanityCap = operator.sanityCap;
  state.sanity = operator.sanityCap;
  state.baseCrit = operator.critBonus || 0.05;
  state.stats = {
    damageFlat: 0,
    fireRateMultiplier: 1,
    reloadMultiplier: 1,
    spreadMultiplier: 1,
    projectileSpeedBonus: 0,
    critBonus: 0,
    critDamageBonus: 0,
    sanityRegen: 0,
    relicSanityReduction: 0,
    relicRadiusBonus: 0,
    relicDurationBonus: 0,
    pullStrength: 0,
    damageBonusMultiplier: 1,
    relicDamageFlat: 0,
    beamReflect: 0,
    maelstromSlow: 0
  };

  const weaponName = weaponTemplate ? weaponTemplate.name : '无武器';
  const relicName = relicTemplate ? relicTemplate.name : '无遗物';
  pushLog(`操作者 ${operator.codename} · 武器 ${weaponName} · 遗物 ${relicName}`);
  setupInput();
  updateHUD();
  render();
  state.mode = 'playing';
  restartBtn.classList.remove('visible');
  requestAnimationFrame(gameLoop);
}

export async function ensureResources() {
  try {
    return await loadResources();
  } catch (err) {
    console.error(err);
    pushLog(`加载数据失败：${err.message}`);
    throw err;
  }
}

export function configureLifecycle(partial = {}) {
  if (!partial) return;
  lifecycle = { ...lifecycle, ...partial };
}

function applyLifecycleOptions(options = {}) {
  if (!options) return;
  const next = {};
  if (typeof options.onGameEnd === 'function') next.onGameEnd = options.onGameEnd;
  if (typeof options.onRestart === 'function') next.onRestart = options.onRestart;
  if (options.lifecycle) configureLifecycle(options.lifecycle);
  if (Object.keys(next).length) configureLifecycle(next);
}

export async function startGame(preset = {}, options = {}) {
  applyLifecycleOptions(options);
  const resources = await ensureResources();
  bootstrap(resources, preset || {});
}

export function tableToArray(converted) {
  return toArray(converted);
}

export function getLastSummary() {
  return state.lastSummary;
}

export function getCurrentPreset() {
  return state.currentPreset;
}

export function getLibrary() {
  return state.library;
}

export { formatTime };
