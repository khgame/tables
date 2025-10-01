import {
  ensureResources,
  startGame,
  configureLifecycle,
  tableToArray,
  formatTime,
  getCurrentPreset
} from './engine.js';

const layoutEl = document.querySelector('.layout');
const prepRoot = document.getElementById('prepRoot');
const gameRoot = document.getElementById('gameRoot');
const postRunPanel = document.getElementById('postRunPanel');

const operatorListEl = document.getElementById('operatorList');
const weaponListEl = document.getElementById('weaponList');
const relicListEl = document.getElementById('relicList');
const skillTreeListEl = document.getElementById('skillTreeList');
const synergyListEl = document.getElementById('synergyList');
const waveListEl = document.getElementById('waveList');
const loadoutSummaryEl = document.getElementById('loadoutSummary');
const startRunBtn = document.getElementById('startRunBtn');

const resultTitleEl = document.getElementById('resultTitle');
const resultMessageEl = document.getElementById('resultMessage');
const resultTimeEl = document.getElementById('resultTime');
const resultKillsEl = document.getElementById('resultKills');
const resultLevelEl = document.getElementById('resultLevel');
const resultLoadoutEl = document.getElementById('resultLoadout');
const resultUpgradesEl = document.getElementById('resultUpgrades');
const backToPrepBtn = document.getElementById('backToPrepBtn');
const retryRunBtn = document.getElementById('retryRunBtn');

const state = {
  tables: {
    operators: [],
    weapons: [],
    relics: [],
    skillTree: [],
    synergyCards: [],
    waves: [],
    bosses: []
  },
  selection: {
    operatorTid: null,
    weaponTid: null,
    relicTid: null
  },
  flags: {
    manualWeapon: false,
    manualRelic: false
  },
  lastPreset: null
};

startRunBtn.disabled = true;
loadoutSummaryEl.innerHTML = '<div>正在加载 tables 数据…</div>';

bootstrap().catch(err => {
  console.error('[abyssal-nightfall] init failed', err);
  loadoutSummaryEl.innerHTML = '<div>数据加载失败，请查看控制台日志。</div>';
  startRunBtn.disabled = true;
});

async function bootstrap() {
  const resources = await ensureResources();
  state.tables.operators = tableToArray(resources.operators);
  state.tables.weapons = tableToArray(resources.weapons);
  state.tables.relics = tableToArray(resources.relics);
  state.tables.skillTree = tableToArray(resources.skillTree);
  state.tables.synergyCards = tableToArray(resources.synergyCards);
  state.tables.waves = tableToArray(resources.waves);
  state.tables.bosses = resources.bosses ? tableToArray(resources.bosses) : [];

  const defaultOperator = state.tables.operators[0] || null;
  const defaultWeapon = resolveEntry(state.tables.weapons, defaultOperator ? defaultOperator.startWeapon : null);
  const defaultRelic = resolveEntry(state.tables.relics, defaultOperator ? defaultOperator.startRelic : null);

  state.selection.operatorTid = defaultOperator ? defaultOperator.tid : null;
  state.selection.weaponTid = defaultWeapon ? defaultWeapon.tid : null;
  state.selection.relicTid = defaultRelic ? defaultRelic.tid : null;
  state.flags.manualWeapon = false;
  state.flags.manualRelic = false;

  applyPreset(
    {
      operatorTid: state.selection.operatorTid,
      weaponTid: state.selection.weaponTid,
      relicTid: state.selection.relicTid
    },
    { markManual: false }
  );
  renderMetaPanels();

  configureLifecycle({
    onGameEnd: handleGameEnd,
    onRestart: () => returnToPrep(state.lastPreset || getCurrentPreset())
  });

  startRunBtn.disabled = false;
  startRunBtn.addEventListener('click', launchRun, { once: false });
  backToPrepBtn.addEventListener('click', () => returnToPrep(state.lastPreset), { once: false });
  retryRunBtn.addEventListener('click', retryRun, { once: false });
}

function launchRun() {
  const operator = findByTid(state.tables.operators, state.selection.operatorTid);
  if (!operator) return;
  const preset = {
    operatorTid: operator.tid,
    weaponTid: state.selection.weaponTid,
    relicTid: state.selection.relicTid
  };
  state.lastPreset = { ...preset };
  layoutEl.classList.add('game-active');
  gameRoot.classList.remove('hidden');
  postRunPanel.classList.add('hidden');
  startRunBtn.blur();
  startGame(preset);
}

function returnToPrep(preset) {
  layoutEl.classList.remove('game-active');
  postRunPanel.classList.add('hidden');
  gameRoot.classList.add('hidden');
  prepRoot.classList.remove('hidden');
  if (preset) {
    applyPreset(preset, { markManual: true });
  }
}

function retryRun() {
  if (!state.lastPreset) {
    launchRun();
    return;
  }
  postRunPanel.classList.add('hidden');
  gameRoot.classList.remove('hidden');
  layoutEl.classList.add('game-active');
  startGame(state.lastPreset);
}

function handleGameEnd(summary) {
  if (!summary) return;
  state.lastPreset = summary.preset ? { ...summary.preset } : state.lastPreset;
  resultTitleEl.textContent = summary.result === 'victory' ? '胜利达成' : '行动失败';
  resultMessageEl.textContent = summary.message || '战斗结束';
  resultTimeEl.textContent = summary.formattedTime || formatTime(summary.time || 0);
  resultKillsEl.textContent = String(summary.killCount || 0);
  resultLevelEl.textContent = String(summary.level || 1);
  const operator = findByTid(state.tables.operators, summary.operatorTid) || findByTid(state.tables.operators, state.selection.operatorTid);
  const weapon = findByTid(state.tables.weapons, summary.weaponTid) || findByTid(state.tables.weapons, state.selection.weaponTid);
  const relic = findByTid(state.tables.relics, summary.relicTid) || findByTid(state.tables.relics, state.selection.relicTid);
  resultLoadoutEl.textContent = [
    operator ? operator.codename : '—',
    weapon ? weapon.name : '—',
    relic ? relic.name : '—'
  ].join(' / ');

  const upgrades = [];
  (summary.unlockedSkills || []).forEach(item => {
    upgrades.push(`技能 · ${item.name || item.tid}`);
  });
  (summary.unlockedSynergies || []).forEach(item => {
    upgrades.push(`协同 · ${item.name || item.tid}`);
  });
  resultUpgradesEl.innerHTML = upgrades.length
    ? upgrades.map(text => `<div>${text}</div>`).join('')
    : '<div>本局未获得新增强化。</div>';

  postRunPanel.classList.remove('hidden');
}

function renderOperators() {
  operatorListEl.innerHTML = '';
  if (!state.tables.operators.length) {
    operatorListEl.innerHTML = '<div class="card">暂无操作者数据</div>';
    return;
  }
  state.tables.operators.forEach(operator => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `card${operator.tid === state.selection.operatorTid ? ' active' : ''}`;
    card.innerHTML = `
      <h3>${operator.codename}</h3>
      <div class="tag-row">
        <span class="tag">${operator.role || 'Operator'}</span>
        <span class="tag">HP ${operator.hp}</span>
        <span class="tag">SAN ${operator.sanityCap}</span>
      </div>
      <p>移速 ${operator.moveSpeed} m/s · 装填 ${(operator.reloadBonus ? Math.round(operator.reloadBonus * 100) : 100)}%</p>
    `;
    card.addEventListener('click', () => {
      selectOperator(operator.tid);
    });
    operatorListEl.appendChild(card);
  });
}

function renderWeapons() {
  weaponListEl.innerHTML = '';
  if (!state.tables.weapons.length) {
    weaponListEl.innerHTML = '<div class="card">暂无武器数据</div>';
    return;
  }
  state.tables.weapons.forEach(weapon => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `card${weapon.tid === state.selection.weaponTid ? ' active' : ''}`;
    card.innerHTML = `
      <h3>${weapon.name}</h3>
      <div class="tag-row">
        <span class="tag">${weapon.categoryName}</span>
        <span class="tag">${weapon.attackStyle}</span>
        <span class="tag">${weapon.damageType}</span>
      </div>
      <p>伤害 ${weapon.damage} · 射速 ${weapon.fireRate}s · 弹匣 ${weapon.magazine}</p>
      <p>弹速 ${weapon.projectileSpeed} m/s · 存活 ${weapon.projectileLifetime}s</p>
    `;
    card.addEventListener('click', () => {
      state.flags.manualWeapon = true;
      state.selection.weaponTid = weapon.tid;
      renderWeapons();
      updateSummary();
    });
    weaponListEl.appendChild(card);
  });
}

function renderRelics() {
  relicListEl.innerHTML = '';
  if (!state.tables.relics.length) {
    relicListEl.innerHTML = '<div class="card">暂无遗物数据</div>';
    return;
  }
  state.tables.relics.forEach(relic => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `card${relic.tid === state.selection.relicTid ? ' active' : ''}`;
    card.innerHTML = `
      <h3>${relic.name}</h3>
      <div class="tag-row">
        <span class="tag">${(relic.school || '').toUpperCase()}</span>
        <span class="tag">${relic.activationStyle}</span>
      </div>
      <p>冷却 ${relic.cooldown}s · 持续 ${relic.duration}s · 半径 ${relic.radius}m</p>
      <p>理智 ${relic.sanityDrain} · ${relic.effects}</p>
    `;
    card.addEventListener('click', () => {
      state.flags.manualRelic = true;
      state.selection.relicTid = relic.tid;
      renderRelics();
      updateSummary();
    });
    relicListEl.appendChild(card);
  });
}

function renderMetaPanels() {
  renderSkillTreePreview();
  renderSynergyPreview();
  renderWaveTimeline();
}

function renderSkillTreePreview() {
  if (!state.tables.skillTree.length) {
    skillTreeListEl.innerHTML = '<div>暂无技能节点</div>';
    return;
  }
  const items = [...state.tables.skillTree]
    .sort((a, b) => {
      if (a.branch !== b.branch) return (a.branch || '').localeCompare(b.branch || '');
      return (a.tier || 0) - (b.tier || 0);
    })
    .slice(0, 8);
  skillTreeListEl.innerHTML = items
    .map(node => `<div><span class="item-title">${node.name}</span> · ${node.effects}</div>`)
    .join('');
}

function renderSynergyPreview() {
  if (!state.tables.synergyCards.length) {
    synergyListEl.innerHTML = '<div>暂无协同卡</div>';
    return;
  }
  const items = [...state.tables.synergyCards]
    .sort((a, b) => (a.tier || '').localeCompare(b.tier || ''))
    .slice(0, 8);
  synergyListEl.innerHTML = items
    .map(card => `<div><span class="item-title">${card.name}</span> · ${card.effects}</div>`)
    .join('');
}

function renderWaveTimeline() {
  if (!state.tables.waves.length) {
    waveListEl.innerHTML = '<div>暂无波次脚本</div>';
    return;
  }
  const items = [...state.tables.waves]
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .slice(0, 8);
  waveListEl.innerHTML = items
    .map(wave => `<div><span class="item-title">T+${wave.timestamp}s</span> ${wave.enemyId} ×${wave.count} · ${wave.formation || 'pattern'}</div>`)
    .join('');
}

function updateSummary() {
  const lines = [];
  const operator = findByTid(state.tables.operators, state.selection.operatorTid);
  const weapon = findByTid(state.tables.weapons, state.selection.weaponTid);
  const relic = findByTid(state.tables.relics, state.selection.relicTid);

  if (operator) {
    lines.push(`<strong>操作者</strong> ${operator.codename} · HP ${operator.hp} · 理智 ${operator.sanityCap} · 暴击 ${(operator.critBonus ? Math.round(operator.critBonus * 100) : 0)}%`);
  }
  if (weapon) {
    lines.push(`<strong>主武器</strong> ${weapon.name}（${weapon.attackStyle}）· ${weapon.damage} ${weapon.damageType} · 射速 ${weapon.fireRate}s · 弹匣 ${weapon.magazine}`);
  } else {
    lines.push('<strong>主武器</strong> 未选择');
  }
  if (relic) {
    lines.push(`<strong>遗物</strong> ${relic.name} · 冷却 ${relic.cooldown}s · 持续 ${relic.duration}s · 理智 ${relic.sanityDrain}`);
  } else {
    lines.push('<strong>遗物</strong> 未配置');
  }

  const upcoming = state.tables.waves.slice(0, 3).map(wave => `T+${wave.timestamp}s ${wave.enemyId} ×${wave.count}`);
  if (upcoming.length) {
    lines.push(`<strong>前线情报</strong> ${upcoming.join(' · ')}`);
  }

  loadoutSummaryEl.innerHTML = lines.map(text => `<div>${text}</div>`).join('');
}

function selectOperator(tid) {
  if (state.selection.operatorTid === tid) return;
  state.selection.operatorTid = tid;
  const operator = findByTid(state.tables.operators, tid);
  if (!operator) return;

  if (!state.flags.manualWeapon || !state.selection.weaponTid) {
    const nextWeapon = resolveEntry(state.tables.weapons, operator.startWeapon, state.selection.weaponTid);
    state.selection.weaponTid = nextWeapon ? nextWeapon.tid : state.selection.weaponTid;
  }
  if (!state.flags.manualRelic || !state.selection.relicTid) {
    const nextRelic = resolveEntry(state.tables.relics, operator.startRelic, state.selection.relicTid);
    state.selection.relicTid = nextRelic ? nextRelic.tid : state.selection.relicTid;
  }

  renderOperators();
  renderWeapons();
  renderRelics();
  updateSummary();
}

function applyPreset(preset, { markManual = false } = {}) {
  if (!preset) return;
  if (preset.operatorTid) {
    state.selection.operatorTid = preset.operatorTid;
  }
  if (markManual) {
    state.flags.manualWeapon = Boolean(preset.weaponTid);
    state.flags.manualRelic = Boolean(preset.relicTid);
  }
  const operator = findByTid(state.tables.operators, state.selection.operatorTid) || state.tables.operators[0] || null;
  state.selection.operatorTid = operator ? operator.tid : null;

  if (preset.weaponTid) {
    state.selection.weaponTid = preset.weaponTid;
  } else if (!state.flags.manualWeapon) {
    const defaultWeapon = resolveEntry(state.tables.weapons, operator ? operator.startWeapon : null);
    state.selection.weaponTid = defaultWeapon ? defaultWeapon.tid : state.selection.weaponTid;
  }

  if (preset.relicTid) {
    state.selection.relicTid = preset.relicTid;
  } else if (!state.flags.manualRelic) {
    const defaultRelic = resolveEntry(state.tables.relics, operator ? operator.startRelic : null);
    state.selection.relicTid = defaultRelic ? defaultRelic.tid : state.selection.relicTid;
  }

  renderOperators();
  renderWeapons();
  renderRelics();
  updateSummary();
}

function resolveEntry(list, key, fallbackTid) {
  if (!list || !list.length) return null;
  if (key) {
    const direct = list.find(entry => entry.tid === key);
    if (direct) return direct;
    const normalized = normalizeKey(key);
    const slugMatch = list.find(entry => normalizeKey(entry.name) === normalized);
    if (slugMatch) return slugMatch;
  }
  if (fallbackTid) {
    const fallback = list.find(entry => entry.tid === fallbackTid);
    if (fallback) return fallback;
  }
  return list[0] || null;
}

function findByTid(list, tid) {
  if (!tid || !Array.isArray(list)) return null;
  return list.find(entry => entry.tid === tid) || null;
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}
