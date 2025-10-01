const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const timeLabel = document.getElementById('timeLabel');
const waveLabel = document.getElementById('waveLabel');
const killLabel = document.getElementById('killLabel');
const ammoLabel = document.getElementById('ammoLabel');
const cooldownLabel = document.getElementById('cooldownLabel');
const sanityLabel = document.getElementById('sanityLabel');
const hpBar = document.getElementById('hpBar');
const logEl = document.getElementById('log');
const restartBtn = document.getElementById('restartBtn');

const SCALE = 16; // 1 游戏单位对应 16 像素
const PLAYER_RADIUS = 16;
const ENEMY_RADIUS = 18;
const BULLET_RADIUS = 4;
const ARENA_PADDING = 48;
const TARGET_DURATION = 180; // 秒

const keys = new Set();
const controls = {
  firing: false,
  aimX: 1,
  aimY: 0
};

const state = {
  running: true,
  time: 0,
  elapsed: 0,
  waves: [],
  nextWaveIndex: 0,
  enemies: [],
  bullets: [],
  killCount: 0,
  logs: [],
  player: null,
  weapon: null,
  sanity: 120,
  invulnTimer: 0
};

function loadJson(file) {
  return fetch(file).then(res => {
    if (!res.ok) throw new Error(`无法加载 ${file}`);
    return res.json();
  });
}

async function loadResources() {
  const [operators, weapons, enemies, waves] = await Promise.all([
    loadJson('./operators.json'),
    loadJson('./weapons.json'),
    loadJson('./enemies.json'),
    loadJson('./waves.json')
  ]);
  return { operators, weapons, enemies, waves };
}

function toArray(result) {
  return Object.entries(result.result || {}).map(([tid, payload]) => ({ tid, ...payload }));
}

function pushLog(message) {
  state.logs.unshift(`[${formatTime(state.time)}] ${message}`);
  state.logs = state.logs.slice(0, 20);
  logEl.innerHTML = state.logs.map(line => `<div>${line}</div>`).join('');
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

function resolveEnemy(enemies, slug) {
  const key = slug.split(':')[1] || slug;
  return enemies.find(e => e.name.toLowerCase().includes(key));
}

function spawnWave(waveDef, enemiesData) {
  const enemyTemplate = resolveEnemy(enemiesData, waveDef.enemyId);
  if (!enemyTemplate) return;

  const count = waveDef.count;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const radius = waveDef.spawnRadius * SCALE + Math.random() * 32;
    const x = canvas.width / 2 + Math.cos(angle) * radius;
    const y = canvas.height / 2 + Math.sin(angle) * radius;
    state.enemies.push({
      template: enemyTemplate,
      hp: enemyTemplate.hp,
      x,
      y,
      speed: enemyTemplate.moveSpeed * SCALE,
      damage: enemyTemplate.damage,
      sanityDamage: enemyTemplate.sanityDamage,
      alive: true
    });
  }
  pushLog(`波次 ${state.nextWaveIndex + 1}：生成 ${count} 个 ${enemyTemplate.name}`);
}

function initPlayer(operator, weapon) {
  state.player = {
    name: operator.codename,
    x: canvas.width / 2,
    y: canvas.height / 2,
    hp: operator.hp,
    hpMax: operator.hp,
    moveSpeed: operator.moveSpeed * SCALE
  };
  state.weapon = {
    name: weapon.name,
    damage: weapon.damage,
    fireRate: weapon.fireRate,
    fireTimer: 0,
    reloadTime: weapon.reload,
    reloadTimer: 0,
    magazineSize: weapon.magazine,
    ammo: weapon.magazine,
    projectileSpeed: weapon.projectileSpeed * SCALE,
    projectileLifetime: weapon.projectileLifetime,
    notes: weapon.notes,
    spread: weapon.spread
  };
  state.sanity = operator.sanityCap;
  pushLog(`操作者 ${operator.codename} 装备 ${weapon.name}`);
}

function handleInput(dt) {
  const player = state.player;
  let dx = 0;
  let dy = 0;
  if (keys.has('KeyW')) dy -= 1;
  if (keys.has('KeyS')) dy += 1;
  if (keys.has('KeyA')) dx -= 1;
  if (keys.has('KeyD')) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const [nx, ny] = normalize(dx, dy);
    player.x += nx * player.moveSpeed * dt;
    player.y += ny * player.moveSpeed * dt;
  }
  player.x = clamp(player.x, ARENA_PADDING, canvas.width - ARENA_PADDING);
  player.y = clamp(player.y, ARENA_PADDING, canvas.height - ARENA_PADDING);
}

function tryFire(dt) {
  const weapon = state.weapon;
  if (!weapon) return;

  weapon.fireTimer = Math.max(weapon.fireTimer - dt, 0);
  if (weapon.reloadTimer > 0) {
    weapon.reloadTimer = Math.max(weapon.reloadTimer - dt, 0);
    if (weapon.reloadTimer === 0) {
      weapon.ammo = weapon.magazineSize;
      pushLog('装填完成');
    }
    return;
  }

  if (!controls.firing || weapon.fireTimer > 0 || weapon.ammo <= 0) {
    if (weapon.ammo <= 0 && weapon.reloadTimer === 0) {
      weapon.reloadTimer = weapon.reloadTime;
      pushLog('子弹耗尽，正在装填');
    }
    return;
  }

  const [dirX, dirY] = normalize(controls.aimX, controls.aimY);
  const spreadRad = (weapon.spread || 0) * (Math.PI / 180) * 0.5;
  const offset = (Math.random() - 0.5) * 2 * spreadRad;
  const cos = Math.cos(offset), sin = Math.sin(offset);
  const finalX = dirX * cos - dirY * sin;
  const finalY = dirX * sin + dirY * cos;

  state.bullets.push({
    x: state.player.x + finalX * PLAYER_RADIUS,
    y: state.player.y + finalY * PLAYER_RADIUS,
    vx: finalX * weapon.projectileSpeed,
    vy: finalY * weapon.projectileSpeed,
    life: weapon.projectileLifetime,
    damage: weapon.damage
  });

  weapon.ammo -= 1;
  weapon.fireTimer = weapon.fireRate;
  if (weapon.ammo <= 0) {
    weapon.reloadTimer = weapon.reloadTime;
  }
}

function updateBullets(dt) {
  state.bullets = state.bullets.filter(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (bullet.life <= 0) return false;
    if (
      bullet.x < 0 ||
      bullet.x > canvas.width ||
      bullet.y < 0 ||
      bullet.y > canvas.height
    ) {
      return false;
    }
    return true;
  });
}

function updateEnemies(dt) {
  const player = state.player;
  state.enemies = state.enemies.filter(enemy => {
    if (!enemy.alive) return false;
    const dirX = player.x - enemy.x;
    const dirY = player.y - enemy.y;
    const [nx, ny] = normalize(dirX, dirY);
    enemy.x += nx * enemy.speed * dt;
    enemy.y += ny * enemy.speed * dt;

    // bullet collision
    for (const bullet of state.bullets) {
      const dist = length(enemy.x - bullet.x, enemy.y - bullet.y);
      if (dist <= ENEMY_RADIUS) {
        enemy.hp -= bullet.damage;
        bullet.life = 0;
        if (enemy.hp <= 0) {
          enemy.alive = false;
          state.killCount += 1;
          pushLog(`击杀 ${enemy.template.name}`);
        }
        break;
      }
    }

    if (!enemy.alive) return false;

    // contact damage
    const distPlayer = length(player.x - enemy.x, player.y - enemy.y);
    if (distPlayer <= PLAYER_RADIUS + ENEMY_RADIUS && state.invulnTimer <= 0) {
      player.hp -= enemy.damage;
      state.sanity = Math.max(0, state.sanity - enemy.sanityDamage);
      state.invulnTimer = 1.2;
      pushLog(`${enemy.template.name} 命中，HP -${enemy.damage}`);
      if (player.hp <= 0) {
        gameOver('你倒在邪潮之中。');
      }
    }

    return true;
  });
}

function updateWaves(dt) {
  const waves = state.waves;
  while (state.nextWaveIndex < waves.length && state.time >= waves[state.nextWaveIndex].timestamp) {
    spawnWave(waves[state.nextWaveIndex], state.enemyTemplates);
    state.nextWaveIndex += 1;
  }
}

function updateHUD() {
  timeLabel.textContent = formatTime(state.time);
  waveLabel.textContent = `${Math.min(state.nextWaveIndex + 1, state.waves.length)}/${state.waves.length}`;
  killLabel.textContent = `${state.killCount}`;
  const weapon = state.weapon;
  if (weapon) {
    ammoLabel.textContent = `${weapon.ammo}/${weapon.magazineSize}`;
    cooldownLabel.textContent = weapon.reloadTimer > 0 ? `${weapon.reloadTimer.toFixed(1)}s` : weapon.fireTimer.toFixed(1);
  }
  sanityLabel.textContent = `${Math.round(state.sanity)}`;
  hpBar.style.width = `${clamp((state.player.hp / state.player.hpMax) * 100, 0, 100)}%`;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // background grid
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

  // player
  ctx.save();
  ctx.translate(state.player.x, state.player.y);
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // bullets
  ctx.fillStyle = '#f97316';
  state.bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });

  // enemies
  state.enemies.forEach(enemy => {
    ctx.fillStyle = 'rgba(248, 113, 113, 0.88)';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, ENEMY_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function update(dt) {
  if (!state.running) return;
  state.time += dt;
  state.invulnTimer = Math.max(state.invulnTimer - dt, 0);
  handleInput(dt);
  tryFire(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateWaves(dt);
  updateHUD();
  render();

  if (state.time >= TARGET_DURATION && state.enemies.length === 0 && state.nextWaveIndex >= state.waves.length) {
    gameOver('黎明到来，你成功存活。');
  }
}

function gameLoop(timestamp) {
  if (!state.running) return;
  if (!state.lastTime) state.lastTime = timestamp;
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;
  update(dt);
  requestAnimationFrame(gameLoop);
}

function gameOver(message) {
  if (!state.running) return;
  state.running = false;
  pushLog(message);
  restartBtn.disabled = false;
}

function setupInput() {
  window.addEventListener('keydown', e => {
    keys.add(e.code);
  });
  window.addEventListener('keyup', e => {
    keys.delete(e.code);
  });
  canvas.addEventListener('mousedown', () => {
    controls.firing = true;
  });
  canvas.addEventListener('mouseup', () => {
    controls.firing = false;
  });
  canvas.addEventListener('mouseleave', () => {
    controls.firing = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - state.player.x;
    const my = e.clientY - rect.top - state.player.y;
    const [nx, ny] = normalize(mx, my);
    controls.aimX = nx;
    controls.aimY = ny;
  });
  restartBtn.addEventListener('click', () => {
    window.location.reload();
  });
}

function bootstrap(resources) {
  const operators = toArray(resources.operators);
  const weapons = toArray(resources.weapons);
  const enemies = toArray(resources.enemies);
  const waves = toArray(resources.waves).sort((a, b) => a.timestamp - b.timestamp);

  state.enemyTemplates = enemies;
  state.waves = waves;
  state.nextWaveIndex = 0;
  state.enemies = [];
  state.bullets = [];
  state.killCount = 0;
  state.logs = [];
  state.time = 0;
  state.lastTime = 0;
  state.running = true;
  state.invulnTimer = 0;

  const operator = operators[0];
  const weapon = weapons.find(w => w.name === 'Runic Revolver') || weapons[0];
  initPlayer(operator, weapon);
  setupInput();
  updateHUD();
  render();
  requestAnimationFrame(gameLoop);
}

loadResources()
  .then(bootstrap)
  .catch(err => {
    console.error(err);
    pushLog(`加载数据失败：${err.message}`);
  });
