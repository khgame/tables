import { ensureResources, startGame, configureLifecycle, tableToArray, formatTime, getCurrentPreset, stopBgm } from '../engine.js';
export class AppController {
    constructor(dom) {
        this.dom = dom;
        this.tables = {
            operators: [],
            weapons: [],
            relics: [],
            skillTree: [],
            synergyCards: [],
            waves: [],
            enemies: [],
            bosses: []
        };
        this.selection = {
            operatorTid: null,
            weaponTid: null,
            relicTid: null
        };
        this.flags = {
            manualWeapon: false,
            manualRelic: false
        };
        this.lastPreset = null;
        this.isLaunching = false;
    }
    async init() {
        this.dom.startRunBtn.disabled = true;
        this.setStatus('正在加载 tables 数据…');
        this.dom.loadoutSummaryEl.innerHTML = '<div class="summary-card">正在加载 tables 数据…</div>';
        try {
            await this.bootstrap();
        }
        catch (err) {
            console.error('[abyssal-nightfall] init failed', err);
            this.dom.loadoutSummaryEl.innerHTML = '<div class="summary-card">数据加载失败，请通过 <code>npm run ex:nightfall</code> 启动本地服务后重试。</div>';
            this.dom.startRunBtn.disabled = true;
            this.setStatus(`数据加载失败：${err.message}`, 'error');
        }
    }
    async bootstrap() {
        const resources = await ensureResources();
        this.tables.operators = tableToArray(resources.operators);
        this.tables.weapons = tableToArray(resources.weapons);
        this.tables.relics = tableToArray(resources.relics);
        this.tables.skillTree = tableToArray(resources.skillTree);
        this.tables.synergyCards = tableToArray(resources.synergyCards);
        this.tables.waves = tableToArray(resources.waves);
        this.tables.enemies = tableToArray(resources.enemies);
        this.tables.bosses = tableToArray(resources.bosses);
        const defaultOperator = this.tables.operators[0] || null;
        const defaultWeapon = defaultOperator ? this.resolveEntry(this.tables.weapons, defaultOperator.startWeapon) : null;
        const defaultRelic = defaultOperator ? this.resolveEntry(this.tables.relics, defaultOperator.startRelic) : null;
        this.selection.operatorTid = defaultOperator ? defaultOperator.tid : null;
        this.selection.weaponTid = defaultWeapon ? defaultWeapon.tid : null;
        this.selection.relicTid = defaultRelic ? defaultRelic.tid : null;
        this.flags.manualWeapon = false;
        this.flags.manualRelic = false;
        this.applyPreset({
            operatorTid: this.selection.operatorTid,
            weaponTid: this.selection.weaponTid,
            relicTid: this.selection.relicTid
        }, { markManual: false });
        this.renderMetaPanels();
        configureLifecycle({
            onGameEnd: summary => this.handleGameEnd(summary),
            onRestart: (_summary, preset) => this.returnToPrep(preset || this.lastPreset)
        });
        this.dom.startRunBtn.disabled = false;
        this.dom.startRunBtn.addEventListener('click', () => this.launchRun());
        this.dom.backToPrepBtn.addEventListener('click', () => this.returnToPrep(this.lastPreset));
        this.dom.retryRunBtn.addEventListener('click', () => this.retryRun());
        if (!this.dom.layoutEl.classList.contains('persona-enter')) {
            requestAnimationFrame(() => this.dom.layoutEl.classList.add('persona-enter'));
        }
        this.setStatus('数据加载完成，随时可以部署。', 'success');
    }
    renderMetaPanels() {
        this.renderOperators();
        this.renderWeapons();
        this.renderRelics();
        this.renderSkillTree();
        this.renderSynergies();
        this.renderWaves();
        this.renderHeroPreview();
        this.renderLoadoutSummary();
    }
    // Rendering helpers and interaction logic will be implemented here ...
    setStatus(message, type = 'info') {
        if (!message) {
            this.dom.statusMessageEl.textContent = '';
            this.dom.statusMessageEl.className = 'status-message';
            return;
        }
        this.dom.statusMessageEl.textContent = message;
        this.dom.statusMessageEl.className = `status-message ${type}`;
    }
    resolveEntry(list, key, fallbackTid) {
        if (!Array.isArray(list) || !list.length)
            return null;
        const candidateKeys = [];
        if (key) {
            candidateKeys.push(key, this.stripTypePrefix(key));
        }
        for (const candidate of candidateKeys) {
            const tid = candidate != null ? String(candidate).trim() : '';
            if (!tid)
                continue;
            const match = list.find(entry => String(entry.tid) === tid);
            if (match)
                return match;
        }
        if (key) {
            const normalized = this.normalizeKey(key);
            if (normalized) {
                const slugMatch = list.find(entry => this.normalizeKey(entry.name) === normalized || this.normalizeKey(entry.tid) === normalized);
                if (slugMatch)
                    return slugMatch;
            }
        }
        if (fallbackTid) {
            const fallbackCandidates = [fallbackTid, this.stripTypePrefix(fallbackTid)];
            for (const candidate of fallbackCandidates) {
                const tid = candidate != null ? String(candidate).trim() : '';
                if (!tid)
                    continue;
                const fallback = list.find(entry => String(entry.tid) === tid);
                if (fallback)
                    return fallback;
            }
        }
        return list[0] || null;
    }
    handleGameEnd(summary) {
        this.lastPreset = summary.preset;
        this.dom.layoutEl.classList.add('game-active');
        this.dom.prepRoot.classList.add('hidden');
        this.dom.gameRoot.classList.remove('hidden');
        this.dom.postRunPanel.classList.remove('hidden');
        this.dom.resultTitleEl.textContent = summary.mode === 'victory' ? '行动成功' : '行动失败';
        this.dom.resultMessageEl.textContent = summary.message;
        this.dom.resultTimeEl.textContent = formatTime(summary.time);
        this.dom.resultKillsEl.textContent = summary.kills.toString();
        this.dom.resultLevelEl.textContent = summary.level.toString();
        const preset = summary.preset || getCurrentPreset();
        this.dom.resultLoadoutEl.textContent = preset
            ? `${summary.operator} / ${summary.weapon ?? '—'} / ${summary.relic ?? '—'}`
            : '—';
        const skillBadges = summary.unlockedSkills.map(skill => `<div class="info-card"><div class="info-name">技能 · ${skill.name}</div></div>`);
        const synergyBadges = summary.unlockedSynergies.map(card => `<div class="info-card"><div class="info-name">协同 · ${card.name}</div></div>`);
        const combined = [...skillBadges, ...synergyBadges];
        this.dom.resultUpgradesEl.innerHTML = combined.length
            ? combined.join('')
            : '<div class="info-card"><div class="info-body">本次行动没有获得额外升级或协同。</div></div>';
    }
    applyPreset(preset, options) {
        const operator = this.findByTid(this.tables.operators, preset.operatorTid) || this.tables.operators[0] || null;
        const weapon = this.resolveEntry(this.tables.weapons, preset.weaponTid, operator?.startWeapon || undefined);
        const relic = this.resolveEntry(this.tables.relics, preset.relicTid, operator?.startRelic || undefined);
        this.selection.operatorTid = operator ? operator.tid : null;
        this.selection.weaponTid = weapon ? weapon.tid : null;
        this.selection.relicTid = relic ? relic.tid : null;
        if (options.markManual) {
            this.flags.manualWeapon = Boolean(preset.weaponTid);
            this.flags.manualRelic = Boolean(preset.relicTid);
        }
        else {
            this.flags.manualWeapon = false;
            this.flags.manualRelic = false;
        }
        this.renderMetaPanels();
    }
    onOperatorSelected(tid) {
        if (this.selection.operatorTid === tid)
            return;
        this.selection.operatorTid = tid;
        const operator = this.findByTid(this.tables.operators, tid);
        if (!operator)
            return;
        if (!this.flags.manualWeapon || !this.selection.weaponTid) {
            const nextWeapon = this.lookupReference(this.tables.weapons, operator.startWeapon, this.selection.weaponTid);
            this.selection.weaponTid = nextWeapon ? nextWeapon.tid : this.selection.weaponTid;
        }
        if (!this.flags.manualRelic || !this.selection.relicTid) {
            const nextRelic = this.lookupReference(this.tables.relics, operator.startRelic, this.selection.relicTid);
            this.selection.relicTid = nextRelic ? nextRelic.tid : this.selection.relicTid;
        }
        this.renderMetaPanels();
    }
    findByTid(list, tid) {
        if (!tid)
            return null;
        return list.find(item => item.tid === tid) || null;
    }
    async launchRun() {
        if (this.isLaunching)
            return;
        const operator = this.findByTid(this.tables.operators, this.selection.operatorTid);
        if (!operator) {
            this.setStatus('请选择操作者后再部署。', 'error');
            return;
        }
        const preset = {
            operatorTid: operator.tid,
            weaponTid: this.selection.weaponTid,
            relicTid: this.selection.relicTid
        };
        this.lastPreset = { ...preset };
        this.isLaunching = true;
        this.dom.startRunBtn.disabled = true;
        this.setStatus('部署中…', 'info');
        this.dom.layoutEl.classList.add('game-active');
        this.dom.gameRoot.classList.remove('hidden');
        this.dom.postRunPanel.classList.add('hidden');
        this.dom.startRunBtn.blur();
        try {
            await startGame(preset);
            this.setStatus('');
        }
        catch (err) {
            console.error('[abyssal-nightfall] startGame failed', err);
            this.setStatus(`启动战斗失败：${err.message}`, 'error');
            this.dom.layoutEl.classList.remove('game-active');
            this.dom.gameRoot.classList.add('hidden');
            this.dom.startRunBtn.disabled = false;
        }
        finally {
            this.isLaunching = false;
        }
    }
    returnToPrep(preset) {
        this.dom.layoutEl.classList.remove('game-active');
        this.dom.postRunPanel.classList.add('hidden');
        this.dom.gameRoot.classList.add('hidden');
        this.dom.prepRoot.classList.remove('hidden');
        this.isLaunching = false;
        this.dom.startRunBtn.disabled = false;
        stopBgm();
        if (preset) {
            this.applyPreset(preset, { markManual: true });
        }
        this.setStatus('已返回战前配置。', 'info');
    }
    async retryRun() {
        if (this.isLaunching)
            return;
        const preset = this.lastPreset || {
            operatorTid: this.selection.operatorTid,
            weaponTid: this.selection.weaponTid,
            relicTid: this.selection.relicTid
        };
        if (!preset.operatorTid) {
            this.returnToPrep(preset);
            return;
        }
        this.isLaunching = true;
        this.setStatus('重新部署…', 'info');
        this.dom.postRunPanel.classList.add('hidden');
        this.dom.layoutEl.classList.add('game-active');
        this.dom.gameRoot.classList.remove('hidden');
        try {
            await startGame(preset);
            this.setStatus('');
        }
        catch (err) {
            console.error('[abyssal-nightfall] retry failed', err);
            this.setStatus(`重新部署失败：${err.message}`, 'error');
            this.dom.layoutEl.classList.remove('game-active');
            this.dom.gameRoot.classList.add('hidden');
        }
        finally {
            this.isLaunching = false;
        }
    }
    renderOperators() {
        this.dom.operatorListEl.innerHTML = this.tables.operators
            .map(operator => this.renderOperatorCard(operator))
            .join('');
        this.dom.operatorListEl.querySelectorAll('.operator-card').forEach(card => {
            card.addEventListener('click', () => {
                const tid = card.dataset.tid || null;
                if (tid)
                    this.onOperatorSelected(tid);
            });
        });
    }
    renderOperatorCard(operator) {
        const active = operator.tid === this.selection.operatorTid ? ' active' : '';
        const portraitUrl = this.resolveAssetUrl(operator.portraitArt);
        const baseWeapon = this.lookupReference(this.tables.weapons, operator.startWeapon);
        const baseRelic = this.lookupReference(this.tables.relics, operator.startRelic);
        const stats = [
            { label: '理智', value: operator.sanityCap },
            { label: '移速', value: `${operator.moveSpeed} m/s` },
            { label: '暴击', value: `${Math.round((operator.critBonus || 0) * 100)}%` },
            { label: '装填', value: `${Math.round((operator.reloadBonus || 1) * 100)}%` }
        ];
        const cardIndex = this.tables.operators.findIndex(op => op.tid === operator.tid);
        return `
      <article class="card operator-card${active}" data-tid="${operator.tid}" style="--card-index:${cardIndex}">
        <div class="card-visual" style="background-image:url('${portraitUrl}')"></div>
        <div class="card-body">
          <header class="card-header">
            <span class="card-role">${operator.role || '操作者'}</span>
            <span class="card-hitpoint">HP ${operator.hp}</span>
          </header>
          <h3 class="card-name">${operator.codename}</h3>
          <ul class="card-stats">
            ${stats
            .map(stat => `<li>${stat.label}<strong>${stat.value}</strong></li>`)
            .join('')}
          </ul>
          <div class="card-chips">
            <span class="chip">武器 ${baseWeapon ? baseWeapon.name : '—'}</span>
            <span class="chip">遗物 ${baseRelic ? baseRelic.name : '—'}</span>
          </div>
          <p class="card-note">${operator.signaturePassive || '无被动描述'}</p>
        </div>
      </article>
    `;
    }
    renderWeapons() {
        this.dom.weaponListEl.innerHTML = this.tables.weapons
            .map(weapon => this.renderWeaponCard(weapon))
            .join('');
        this.dom.weaponListEl.querySelectorAll('.weapon-card').forEach(card => {
            card.addEventListener('click', () => {
                const tid = card.dataset.tid || null;
                if (!tid)
                    return;
                this.flags.manualWeapon = true;
                this.selection.weaponTid = tid;
                this.renderWeapons();
                this.renderLoadoutSummary();
                this.renderHeroPreview();
            });
        });
    }
    renderWeaponCard(weapon) {
        const active = weapon.tid === this.selection.weaponTid ? ' active' : '';
        const iconUrl = this.resolveAssetUrl(weapon.travelSprite || weapon.muzzleSprite);
        const stats = [
            { label: '伤害', value: weapon.damage ?? '—' },
            { label: '射速', value: weapon.fireRate != null ? `${weapon.fireRate}s` : '—' },
            { label: '弹匣', value: weapon.magazine ?? '—' },
            { label: '散射', value: weapon.spread ?? '—' },
            { label: '弹速', value: weapon.projectileSpeed != null ? `${weapon.projectileSpeed} m/s` : '—' },
            { label: '寿命', value: weapon.projectileLifetime != null ? `${weapon.projectileLifetime}s` : '—' }
        ];
        return `
      <article class="card weapon-card${active}" data-tid="${weapon.tid}">
        <div class="card-visual" style="background-image:url('${iconUrl}')"></div>
        <div class="card-body">
          <header class="card-header">
            <span class="card-role">${weapon.categoryName || '武器'}</span>
            <span class="card-hitpoint">${this.formatDamageType(weapon.damageType)}</span>
          </header>
          <h3 class="card-name">${weapon.name}</h3>
          <div class="card-chips">
            <span class="chip">${this.formatAttackStyle(weapon.attackStyle)}</span>
            <span class="chip">弹道范围 ${weapon.maxRange ?? '—'} m</span>
          </div>
          <ul class="card-stats">
            ${stats.map(stat => `<li>${stat.label}<strong>${stat.value}</strong></li>`).join('')}
          </ul>
          <p class="card-note">${weapon.notes || '——'}</p>
        </div>
      </article>
    `;
    }
    renderRelics() {
        this.dom.relicListEl.innerHTML = this.tables.relics
            .map(relic => this.renderRelicCard(relic))
            .join('');
        this.dom.relicListEl.querySelectorAll('.relic-card').forEach(card => {
            card.addEventListener('click', () => {
                const tid = card.dataset.tid || null;
                if (!tid)
                    return;
                this.flags.manualRelic = true;
                this.selection.relicTid = tid;
                this.renderRelics();
                this.renderLoadoutSummary();
                this.renderHeroPreview();
            });
        });
    }
    renderRelicCard(relic) {
        const active = relic.tid === this.selection.relicTid ? ' active' : '';
        const iconUrl = this.resolveAssetUrl(relic.vfxSprite);
        const stats = [
            { label: '冷却', value: relic.cooldown != null ? `${relic.cooldown}s` : '—' },
            { label: '持续', value: relic.duration != null ? `${relic.duration}s` : '—' },
            { label: '半径', value: relic.radius != null ? `${relic.radius}m` : '—' },
            { label: '理智', value: relic.sanityDrain ?? '—' }
        ];
        return `
      <article class="card relic-card${active}" data-tid="${relic.tid}">
        <div class="card-visual" style="background-image:url('${iconUrl}')"></div>
        <div class="card-body">
          <header class="card-header">
            <span class="card-role">${relic.school || '遗物'}</span>
            <span class="card-hitpoint">${this.formatActivationStyle(relic.activationStyle)}</span>
          </header>
          <h3 class="card-name">${relic.name}</h3>
          <ul class="card-stats">
            ${stats.map(stat => `<li>${stat.label}<strong>${stat.value}</strong></li>`).join('')}
          </ul>
          <p class="card-note">${this.formatEffectsText(relic.effects)}</p>
        </div>
      </article>
    `;
    }
    renderSkillTree() {
        this.dom.skillTreeListEl.innerHTML = this.tables.skillTree
            .map(node => `
        <article class="info-card skill-card" data-branch="${node.branchName || node.branch || ''}">
          <div class="info-title">
            <span class="tag">${node.branchName || node.branch || '技能'}</span>
            <span>${node.tier != null ? `T${node.tier}` : '—'}</span>
          </div>
          <div class="info-name">${node.name}</div>
          <div class="info-body">${this.formatEffectsText(node.effects)}</div>
          <div class="info-footer">需求：${this.formatRequirementsText(node.requirements)}</div>
        </article>
      `)
            .join('');
    }
    renderSynergies() {
        this.dom.synergyListEl.innerHTML = this.tables.synergyCards
            .map(card => `
        <article class="info-card synergy-card" data-rarity="${(card.tier || '').toLowerCase()}">
          <div class="info-title">
            <span class="tag">${card.tier || '协同'}</span>
            <span>${this.formatTriggerText(card.trigger)}</span>
          </div>
          <div class="info-name">${card.name}</div>
          <div class="info-body">${this.formatEffectsText(card.effects)}</div>
          <div class="info-footer">前置：${this.formatRequirementsText(card.prerequisites)}</div>
        </article>
      `)
            .join('');
    }
    renderWaves() {
        this.dom.waveListEl.innerHTML = this.tables.waves
            .map(wave => `
        <article class="info-card">
          <div class="info-title">波次 ${wave.tid}</div>
          <div class="info-name">${wave.count} × ${this.resolveEnemyName(wave.enemyId)}</div>
          <div class="info-body">${wave.notes || '无备注'}</div>
          <div class="info-footer">时间 ${wave.timestamp}s · 阵型 ${wave.formation || 'ring'}</div>
        </article>
      `)
            .join('');
    }
    renderHeroPreview() {
        const operator = this.findByTid(this.tables.operators, this.selection.operatorTid) || this.tables.operators[0] || null;
        if (!operator) {
            this.dom.heroPreviewEl.innerHTML = '<div class="hero-placeholder">选择操作者以查看详细能力与初始构筑。</div>';
            return;
        }
        const weapon = this.findByTid(this.tables.weapons, this.selection.weaponTid) || this.lookupReference(this.tables.weapons, operator.startWeapon);
        const relic = this.findByTid(this.tables.relics, this.selection.relicTid) || this.lookupReference(this.tables.relics, operator.startRelic);
        const portraitUrl = this.resolveAssetUrl(operator.portraitArt);
        const weaponIcon = weapon ? this.resolveAssetUrl(weapon.travelSprite || weapon.muzzleSprite) : '';
        const relicIcon = relic ? this.resolveAssetUrl(relic.vfxSprite) : '';
        this.dom.heroPreviewEl.innerHTML = `
      <div class="hero-art" style="background-image:url('${portraitUrl}')"></div>
      <div class="hero-head">
        <div class="hero-portrait" style="background-image:url('${portraitUrl}')"></div>
        <div class="hero-meta">
          <span class="hero-role">${operator.role || '操作者'}</span>
          <h2>${operator.codename}</h2>
          <p class="hero-passive">${operator.signaturePassive || '——'}</p>
          <ul class="hero-metrics">
            <li>生命<strong>${operator.hp}</strong></li>
            <li>理智<strong>${operator.sanityCap}</strong></li>
            <li>移动<strong>${operator.moveSpeed} m/s</strong></li>
          </ul>
        </div>
      </div>
      <div class="hero-loadout">
        <div class="hero-loadout-row"><span>武器</span><strong>${weapon ? weapon.name : '未配置'}</strong></div>
        <div class="hero-loadout-row"><span>遗物</span><strong>${relic ? relic.name : '未配置'}</strong></div>
      </div>
      <div class="hero-loadout-icons">
        <div class="loadout-item">
          <strong>武器</strong>
          <div class="loadout-icon" style="background-image:url('${weaponIcon}')"></div>
        </div>
        <div class="loadout-item">
          <strong>遗物</strong>
          <div class="loadout-icon" style="background-image:url('${relicIcon}')"></div>
        </div>
      </div>
    `;
    }
    renderLoadoutSummary() {
        const operator = this.findByTid(this.tables.operators, this.selection.operatorTid);
        const weapon = this.findByTid(this.tables.weapons, this.selection.weaponTid) || (operator ? this.lookupReference(this.tables.weapons, operator.startWeapon) : null);
        const relic = this.findByTid(this.tables.relics, this.selection.relicTid) || (operator ? this.lookupReference(this.tables.relics, operator.startRelic) : null);
        const upcoming = [...this.tables.waves]
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            .slice(0, 3)
            .map(wave => {
            const template = this.findByTid(this.tables.enemies, String(wave.enemyId));
            return {
                text: `T+${wave.timestamp}s ${template ? template.name : this.formatIdentifier(wave.enemyId)} ×${wave.count}`,
                icon: template && template.sprite ? this.resolveAssetUrl(template.sprite) : ''
            };
        });
        const items = [
            {
                label: '操作者',
                primary: operator ? operator.codename : '未选择',
                secondary: operator ? `${operator.role || '——'} · HP ${operator.hp} · 理智 ${operator.sanityCap}` : '',
                icon: operator ? this.resolveAssetUrl(operator.portraitArt) : ''
            },
            {
                label: '武器',
                primary: weapon ? weapon.name : '未选择',
                secondary: weapon
                    ? `伤害 ${weapon.damage ?? '—'} · 射速 ${weapon.fireRate ?? '—'}s · 弹匣 ${weapon.magazine ?? '—'}`
                    : '',
                icon: weapon ? this.resolveAssetUrl(weapon.travelSprite || weapon.muzzleSprite) : ''
            },
            {
                label: '遗物',
                primary: relic ? relic.name : '未选择',
                secondary: relic
                    ? `冷却 ${relic.cooldown ?? '—'}s · 持续 ${relic.duration ?? '—'}s · 理智 ${relic.sanityDrain ?? '—'}`
                    : '',
                icon: relic ? this.resolveAssetUrl(relic.vfxSprite) : ''
            },
            {
                label: '敌情',
                primary: upcoming[0] ? upcoming[0].text : '等待情报',
                secondary: upcoming.slice(1).map(item => item.text).join(' / ') || '开场压力较低，专注清线',
                icon: upcoming[0] ? upcoming[0].icon : ''
            }
        ];
        this.dom.loadoutSummaryEl.innerHTML = items
            .map(item => `
        <div class="summary-card">
          <div class="summary-icon" style="background-image:url('${item.icon}')"></div>
          <div class="summary-content">
            <span class="summary-label">${item.label}</span>
            <span class="summary-primary">${item.primary}</span>
            <span class="summary-secondary">${item.secondary}</span>
          </div>
        </div>
      `)
            .join('');
    }
    resolveEnemyName(enemyId) {
        const normalized = String(enemyId);
        const match = this.tables.enemies.find(enemy => enemy.tid === normalized);
        return match ? match.name : normalized;
    }
    resolveAssetUrl(path) {
        if (!path)
            return '';
        const sanitized = path.replace(/'/g, '%27');
        if (/^https?:/i.test(path))
            return sanitized;
        if (sanitized.startsWith('./') || sanitized.startsWith('/'))
            return sanitized;
        if (sanitized.startsWith('ui/'))
            return `./${sanitized}`;
        if (sanitized.startsWith('icons/') || sanitized.startsWith('fx/') || sanitized.startsWith('assets/')) {
            return `./${sanitized}`;
        }
        return `./ui/assets/${sanitized}`;
    }
    formatEffectsText(effects = '') {
        if (!effects)
            return '——';
        return effects
            .split('|')
            .map(token => token.trim())
            .filter(Boolean)
            .map(token => {
            const [key, value] = token.split(':');
            if (!value)
                return this.formatIdentifier(key);
            return `${this.formatIdentifier(key)} ${value}`;
        })
            .join(' · ');
    }
    formatRequirementsText(requirements = '') {
        if (!requirements)
            return '无';
        return requirements
            .split('|')
            .map(requirement => requirement.trim())
            .filter(Boolean)
            .map(token => token.replace('level:', '等级 ').replace('skill:', '技能 '))
            .join(' · ');
    }
    formatTriggerText(trigger = '') {
        if (!trigger)
            return '协同效果常驻生效';
        return trigger
            .split('|')
            .map(token => token.trim())
            .filter(Boolean)
            .map(token => {
            if (token.startsWith('sanity:<')) {
                const threshold = token.split('<')[1];
                return `理智低于 ${threshold}`;
            }
            if (token.startsWith('after:')) {
                return `触发源：${this.formatIdentifier(token.slice(6))}`;
            }
            if (token.startsWith('killstreak:')) {
                const [, payload] = token.split(':');
                const [count, window] = payload.split('@');
                return `在 ${window} 内连杀 ${count} 次`;
            }
            return this.formatIdentifier(token);
        })
            .join(' · ');
    }
    formatAttackStyle(style) {
        if (!style)
            return '未知形态';
        switch (style) {
            case 'MANUAL':
                return '手动射击';
            case 'AUTO':
                return '自动射击';
            case 'BURST':
                return '爆裂点射';
            case 'BEAM':
                return '持续光束';
            case 'CHANNEL':
                return '引导术式';
            default:
                return style;
        }
    }
    formatActivationStyle(style) {
        if (!style)
            return '触发';
        switch (style) {
            case 'ACTIVE':
                return '主动释放';
            case 'PASSIVE':
                return '被动';
            case 'REACTIVE':
                return '反应';
            default:
                return style;
        }
    }
    formatDamageType(type) {
        if (!type)
            return '未知属性';
        switch (type) {
            case 'KINETIC':
                return '动能';
            case 'VOID':
                return '虚空';
            case 'FROST':
                return '霜冻';
            case 'FIRE':
                return '火焰';
            case 'LIGHT':
                return '炽光';
            default:
                return type;
        }
    }
    formatIdentifier(value) {
        if (value == null)
            return '—';
        const slug = String(value).split(':').pop() || '';
        return slug
            .split(/[-_]/)
            .filter(Boolean)
            .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' ');
    }
    stripTypePrefix(value) {
        const raw = String(value ?? '').trim();
        const colonIndex = raw.indexOf(':');
        if (colonIndex === -1)
            return raw;
        return raw.slice(colonIndex + 1);
    }
    normalizeKey(value) {
        const stripped = this.stripTypePrefix(value);
        if (!stripped)
            return '';
        return stripped
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    lookupReference(list, key, fallbackTid) {
        if (!Array.isArray(list) || !list.length)
            return null;
        if (!key)
            return this.resolveEntry(list, fallbackTid);
        const candidateKeys = [key, this.stripTypePrefix(key)];
        for (const candidate of candidateKeys) {
            const tid = candidate != null ? String(candidate).trim() : '';
            if (!tid)
                continue;
            const match = list.find(entry => String(entry.tid) === tid);
            if (match)
                return match;
        }
        const normalized = this.normalizeKey(key);
        if (normalized) {
            const slugMatch = list.find(entry => this.normalizeKey(entry.name) === normalized || this.normalizeKey(entry.tid) === normalized);
            if (slugMatch)
                return slugMatch;
        }
        return this.resolveEntry(list, fallbackTid);
    }
}
