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
const heroPreviewEl = document.getElementById('heroPreview');
const statusMessageEl = document.getElementById('statusMessage');

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
  lastPreset: null,
  isLaunching: false
};

startRunBtn.disabled = true;
setStatus('正在加载 tables 数据…');
loadoutSummaryEl.innerHTML = '<div class="summary-card">正在加载 tables 数据…</div>';

bootstrap().catch(err => {
  console.error('[abyssal-nightfall] init failed', err);
  loadoutSummaryEl.innerHTML = '<div class="summary-card">数据加载失败，请通过 <code>npm run ex:nightfall</code> 启动本地服务后重试。</div>';
  startRunBtn.disabled = true;
  setStatus(`数据加载失败：${err.message}`, 'error');
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

  setStatus('数据加载完成，随时可以部署。', 'success');
}

function setStatus(message, type = 'info') {
  if (!statusMessageEl) return;
  if (!message) {
    statusMessageEl.textContent = '';
    statusMessageEl.className = 'status-message';
    return;
  }
  statusMessageEl.textContent = message;
  statusMessageEl.className = `status-message ${type}`;
}

async function launchRun() {
  if (state.isLaunching) return;
  const operator = findByTid(state.tables.operators, state.selection.operatorTid);
  if (!operator) {
    setStatus('请选择操作者后再部署。', 'error');
    return;
  }
  const preset = {
    operatorTid: operator.tid,
    weaponTid: state.selection.weaponTid,
    relicTid: state.selection.relicTid
  };

  state.lastPreset = { ...preset };
  state.isLaunching = true;
  startRunBtn.disabled = true;
  setStatus('部署中…', 'info');

  layoutEl.classList.add('game-active');
  gameRoot.classList.remove('hidden');
  postRunPanel.classList.add('hidden');
  startRunBtn.blur();

  try {
    await startGame(preset);
    setStatus('');
  } catch (err) {
    console.error('[abyssal-nightfall] startGame failed', err);
    setStatus(`启动战斗失败：${err.message}`, 'error');
    layoutEl.classList.remove('game-active');
    gameRoot.classList.add('hidden');
    startRunBtn.disabled = false;
  } finally {
    state.isLaunching = false;
  }
}

function returnToPrep(preset) {
  layoutEl.classList.remove('game-active');
  postRunPanel.classList.add('hidden');
  gameRoot.classList.add('hidden');
  prepRoot.classList.remove('hidden');
  state.isLaunching = false;
  startRunBtn.disabled = false;
  if (preset) {
    applyPreset(preset, { markManual: true });
  }
  setStatus('已返回战前配置。', 'info');
}

async function retryRun() {
  if (state.isLaunching) return;
  const preset = state.lastPreset || {
    operatorTid: state.selection.operatorTid,
    weaponTid: state.selection.weaponTid,
    relicTid: state.selection.relicTid
  };
  if (!preset.operatorTid) {
    returnToPrep(preset);
    return;
  }
  state.isLaunching = true;
  setStatus('重新部署…', 'info');
  postRunPanel.classList.add('hidden');
  layoutEl.classList.add('game-active');
  gameRoot.classList.remove('hidden');
  try {
    await startGame(preset);
    setStatus('');
  } catch (err) {
    console.error('[abyssal-nightfall] retry failed', err);
    setStatus(`重新部署失败：${err.message}`, 'error');
    layoutEl.classList.remove('game-active');
    gameRoot.classList.add('hidden');
    startRunBtn.disabled = false;
  } finally {
    state.isLaunching = false;
  }
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
    upgrades.push({ label: '技能', value: item.name || item.tid });
  });
  (summary.unlockedSynergies || []).forEach(item => {
    upgrades.push({ label: '协同', value: item.name || item.tid });
  });

  resultUpgradesEl.innerHTML = upgrades.length
    ? upgrades
        .map(
          upgrade => `
            <div class="info-card">
              <div class="info-title">
                <span class="tag">${upgrade.label}</span>
                <span class="info-name">${upgrade.value}</span>
              </div>
            </div>
          `
        )
        .join('')
    : '<div class="info-card"><div class="info-body">本局未获得新增强化。</div></div>';

  postRunPanel.classList.remove('hidden');
  setStatus('行动结束，查看战报或返回战备。', summary.result === 'victory' ? 'success' : 'info');
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
    const baseWeapon = lookupReference(state.tables.weapons, operator.startWeapon);
    const baseRelic = lookupReference(state.tables.relics, operator.startRelic);
    const stats = [
      { label: '理智', value: operator.sanityCap },
      { label: '移速', value: `${operator.moveSpeed} m/s` },
      { label: '暴击', value: `${Math.round((operator.critBonus || 0) * 100)}%` },
      { label: '装填', value: `${Math.round((operator.reloadBonus || 1) * 100)}%` }
    ];
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">${operator.codename}</div>
          <div class="card-subtitle">${operator.role || 'Operator'}</div>
        </div>
        <span class="tag">HP ${operator.hp}</span>
      </div>
      <div class="stat-grid">
        ${stats
          .map(
            stat => `
              <div class="stat-cell">
                <span>${stat.label}</span>
                <strong>${stat.value}</strong>
              </div>
            `
          )
          .join('')}
      </div>
      <p class="card-notes">武器 ${baseWeapon ? baseWeapon.name : '—'} · 遗物 ${baseRelic ? baseRelic.name : '—'}</p>
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
    const stats = [
      { label: '伤害', value: weapon.damage ?? '—' },
      { label: '射速', value: weapon.fireRate != null ? `${weapon.fireRate}s` : '—' },
      { label: '弹匣', value: weapon.magazine ?? '—' },
      { label: '散射', value: weapon.spread ?? '—' },
      { label: '弹速', value: weapon.projectileSpeed != null ? `${weapon.projectileSpeed} m/s` : '—' },
      { label: '寿命', value: weapon.projectileLifetime != null ? `${weapon.projectileLifetime}s` : '—' }
    ];
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">${weapon.name}</div>
          <div class="card-subtitle">${weapon.categoryName} • ${weapon.attackStyle}</div>
        </div>
        <span class="tag">${weapon.damageType}</span>
      </div>
      <div class="stat-grid">
        ${stats
          .map(
            stat => `
              <div class="stat-cell">
                <span>${stat.label}</span>
                <strong>${stat.value}</strong>
              </div>
            `
          )
          .join('')}
      </div>
      <p class="card-notes">${weapon.notes || '——'}</p>
    `;
    card.addEventListener('click', () => {
      state.flags.manualWeapon = true;
      state.selection.weaponTid = weapon.tid;
      renderWeapons();
      renderSummary();
      renderHeroPreview();
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
    const stats = [
      { label: '冷却', value: relic.cooldown != null ? `${relic.cooldown}s` : '—' },
      { label: '持续', value: relic.duration != null ? `${relic.duration}s` : '—' },
      { label: '半径', value: relic.radius != null ? `${relic.radius}m` : '—' },
      { label: '理智', value: relic.sanityDrain ?? '—' }
    ];
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">${relic.name}</div>
          <div class="card-subtitle">${(relic.school || '').toUpperCase()} • ${relic.activationStyle}</div>
        </div>
      </div>
      <div class="stat-grid">
        ${stats
          .map(
            stat => `
              <div class="stat-cell">
                <span>${stat.label}</span>
                <strong>${stat.value}</strong>
              </div>
            `
          )
          .join('')}
      </div>
      <p class="card-notes">${formatEffectsText(relic.effects)}</p>
    `;
    card.addEventListener('click', () => {
      state.flags.manualRelic = true;
      state.selection.relicTid = relic.tid;
      renderRelics();
      renderSummary();
      renderHeroPreview();
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
    skillTreeListEl.innerHTML = '<div class="info-card"><div class="info-body">暂无技能节点</div></div>';
    return;
  }
  const items = [...state.tables.skillTree]
    .sort((a, b) => {
      const branchA = normaliseKeyForSort(a.branch);
      const branchB = normaliseKeyForSort(b.branch);
      if (branchA !== branchB) return branchA.localeCompare(branchB);
      return (Number(a.tier) || 0) - (Number(b.tier) || 0);
    })
    .slice(0, 8);
  skillTreeListEl.innerHTML = items
    .map(
      node => `
        <div class="info-card">
          <div class="info-title">
            <span class="tag">${node.branchName || node.branch}</span>
            <span class="info-name">${node.name}</span>
          </div>
          <div class="info-body">${formatEffectsText(node.effects)}</div>
          <div class="info-footer">需求 ${formatRequirementsText(node.requirements)}</div>
        </div>
      `
    )
    .join('');
}

function renderSynergyPreview() {
  if (!state.tables.synergyCards.length) {
    synergyListEl.innerHTML = '<div class="info-card"><div class="info-body">暂无协同卡</div></div>';
    return;
  }
  const items = [...state.tables.synergyCards]
    .sort((a, b) => (a.tier || '').localeCompare(b.tier || ''))
    .slice(0, 8);
  synergyListEl.innerHTML = items
    .map(
      card => `
        <div class="info-card">
          <div class="info-title">
            <span class="tag">${card.tier}</span>
            <span class="info-name">${card.name}</span>
          </div>
          <div class="info-body">${formatEffectsText(card.effects)}</div>
          <div class="info-footer">${formatTriggerText(card.trigger)}</div>
        </div>
      `
    )
    .join('');
}

function renderWaveTimeline() {
  if (!state.tables.waves.length) {
    waveListEl.innerHTML = '<div class="info-card"><div class="info-body">暂无波次脚本</div></div>';
    return;
  }
  const items = [...state.tables.waves]
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .slice(0, 6);
  waveListEl.innerHTML = items
    .map(
      wave => `
        <div class="info-card">
          <div class="info-title">
            <span class="tag">T+${wave.timestamp}s</span>
            <span class="info-name">${formatIdentifier(wave.enemyId)}</span>
          </div>
          <div class="info-body">数量 ${wave.count} · 阵型 ${wave.formation || '未知'}</div>
          <div class="info-footer">${wave.notes || '——'}</div>
        </div>
      `
    )
    .join('');
}

function renderSummary() {
  const operator = findByTid(state.tables.operators, state.selection.operatorTid);
  const weapon = findByTid(state.tables.weapons, state.selection.weaponTid);
  const relic = findByTid(state.tables.relics, state.selection.relicTid);
  const upcoming = [...state.tables.waves]
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .slice(0, 3)
    .map(wave => `T+${wave.timestamp}s ${formatIdentifier(wave.enemyId)} ×${wave.count}`);

  const summaryItems = [
    {
      label: '主武器',
      primary: weapon ? weapon.name : '未选择',
      secondary: weapon
        ? `${weapon.damage ?? '—'} ${weapon.damageType ?? ''} · 射速 ${weapon.fireRate ?? '—'}s · 弹匣 ${weapon.magazine ?? '—'}`
        : '请选择一件主武器'
    },
    {
      label: '遗物',
      primary: relic ? relic.name : '未配置',
      secondary: relic
        ? `冷却 ${relic.cooldown ?? '—'}s · 持续 ${relic.duration ?? '—'}s · 理智 ${relic.sanityDrain ?? '—'}`
        : '请选择一件遗物'
    },
    {
      label: '敌情',
      primary: upcoming[0] || '等待情报',
      secondary: upcoming.slice(1).join(' / ') || '开场压力较低，专注清线'
    }
  ];

  loadoutSummaryEl.innerHTML = summaryItems
    .map(
      item => `
        <div class="summary-card">
          <span class="summary-label">${item.label}</span>
          <div class="summary-primary">${item.primary}</div>
          <div class="summary-secondary">${item.secondary}</div>
        </div>
      `
    )
    .join('');
}

function renderHeroPreview() {
  if (!heroPreviewEl) return;
  const operator = findByTid(state.tables.operators, state.selection.operatorTid);
  if (!operator) {
    heroPreviewEl.innerHTML = '<div class="hero-placeholder">选择操作者以查看详细能力与初始构筑。</div>';
    return;
  }
  const weapon = findByTid(state.tables.weapons, state.selection.weaponTid) || lookupReference(state.tables.weapons, operator.startWeapon);
  const relic = findByTid(state.tables.relics, state.selection.relicTid) || lookupReference(state.tables.relics, operator.startRelic);
  const stats = [
    { label: '生命', value: operator.hp },
    { label: '移速', value: `${operator.moveSpeed} m/s` },
    { label: '理智', value: operator.sanityCap }
  ];
  const passiveLabel = formatIdentifier(operator.signaturePassive);
  const portraitUrl = resolveAssetUrl(operator.portraitArt);
  heroPreviewEl.innerHTML = `
    <div class="hero-art" style="background-image:url('${portraitUrl}')"></div>
    <div class="hero-title">
      <span class="hero-role">${operator.role || 'Operator'}</span>
      <h2>${operator.codename}</h2>
    </div>
    <div class="hero-stats-row">
      ${stats
        .map(
          stat => `
            <div class="hero-stat">
              <span>${stat.label}</span>
              <strong>${stat.value}</strong>
            </div>
          `
        )
        .join('')}
    </div>
    <div class="hero-loadout">
      <div class="hero-loadout-row"><span>初始武器</span><strong>${weapon ? weapon.name : '—'}</strong></div>
      <div class="hero-loadout-row"><span>起始遗物</span><strong>${relic ? relic.name : '—'}</strong></div>
      <div class="hero-loadout-row"><span>装填修正</span><strong>${Math.round((operator.reloadBonus || 1) * 100)}%</strong></div>
    </div>
    <div class="hero-note">暴击 ${(operator.critBonus ? Math.round(operator.critBonus * 100) : 0)}% · 被动 ${passiveLabel}</div>
  `;
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
  renderSummary();
  renderHeroPreview();
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
  renderSummary();
  renderHeroPreview();
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

function lookupReference(list, key) {
  if (!key || !Array.isArray(list)) return null;
  const normalized = normalizeKey(key);
  return list.find(entry => entry.tid === key || normalizeKey(entry.name) === normalized) || null;
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function formatEffectsText(effects = '') {
  if (!effects) return '——';
  return effects
    .split('|')
    .map(token => token.trim().replace(':', ' '))
    .filter(Boolean)
    .join(' · ');
}

function formatRequirementsText(requirements = '') {
  if (!requirements) return '无';
  return requirements
    .split('|')
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => token.replace('level:', '等级 ').replace('skill:', '技能 '))
    .join(' · ');
}

function formatTriggerText(trigger = '') {
  if (!trigger) return '协同效果常驻生效';
  return trigger
    .split('|')
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => {
      const [key, value] = token.split(':');
      if (!value) return formatIdentifier(key);
      return `${formatIdentifier(key)} ${formatIdentifier(value)}`;
    })
    .join(' · ');
}

function formatIdentifier(value) {
  if (!value) return '—';
  const slug = String(value).split(':').pop();
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function resolveAssetUrl(path) {
  if (!path) return '';
  const base = /^https?:/.test(path)
    ? path
    : path.startsWith('.')
    ? path
    : `./${path}`;
  return base.replace(/'/g, '%27');
}

function normaliseKeyForSort(value) {
  if (typeof value === 'number') return value.toString().padStart(2, '0');
  if (typeof value === 'string') return value;
  return '';
}
