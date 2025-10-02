import type { AssetManager } from '../core/assets';
import { normalizeSlug, normalizeIdentifier } from '../core/utils';
import type { GameDom } from '../core/dom';
import type {
  GameLibrary,
  SkillNodeRow,
  SynergyCardRow
} from '../core/types';
import type { GameState, PendingUpgradeJob } from '../battle/state';
import { pushLog } from '../battle/logger';

interface UpgradeOption {
  type: 'skill' | 'synergy';
  data: SkillNodeRow | SynergyCardRow;
  description: string;
}

export type UpgradeReason = PendingUpgradeJob['reason'];

type StatsMutator = (state: GameState) => void;

const xpForLevel = (level: number) => Math.round(60 * Math.pow(level, 1.35));

export class ProgressionManager {
  private onStatsChanged: (() => void) | null = null;
  private readonly fallbackSeeds = [
    {
      key: 'damage',
      name: '应急火力',
      branch: '应急',
      effects: 'damage:8',
      description: '立即提升主要武器伤害 +8。',
      icon: 'icons/skill/zero_point.png'
    },
    {
      key: 'resilience',
      name: '战术恢复',
      branch: '应急',
      effects: 'hpRegen:12|sanityRegen:8',
      description: '持续恢复生命与理智，稳定后排节奏。',
      icon: 'icons/skill/ward_bastion.png'
    },
    {
      key: 'aegis',
      name: '防御矩阵',
      branch: '应急',
      effects: 'shield:40|invulnTime:0.6',
      description: '立即获得护盾并延长短暂无敌时间。',
      icon: 'icons/skill/seraphic_shell.png'
    }
  ];

  constructor(
    private readonly state: GameState,
    private readonly dom: GameDom,
    private readonly library: () => GameLibrary,
    private readonly assets: AssetManager
  ) {
    this.dom.overlaySkip.addEventListener('click', () => {
      this.closeOverlay();
      this.processQueue();
    });
  }

  setStatsChangedHandler(handler: () => void): void {
    this.onStatsChanged = handler;
  }

  gainXp(amount: number): void {
    const stats = this.state.stats;
    if (!stats) return;
    const xpBonus = stats.xpBonus || 0;
    const finalXp = amount * (1 + xpBonus / 100);
    this.state.xp += finalXp;
    while (this.state.xp >= this.state.xpNeeded) {
      this.state.xp -= this.state.xpNeeded;
      this.state.level += 1;
      this.state.xpNeeded = xpForLevel(this.state.level);
      this.queueUpgrade('level');
    }
  }

  queueUpgrade(reason: UpgradeReason): void {
    this.state.upgradeQueue.push({ reason });
    this.processQueue();
  }

  private processQueue(): void {
    if (this.state.mode !== 'playing') return;
    if (!this.state.upgradeQueue.length) return;
    const job = this.state.upgradeQueue.shift();
    if (!job) return;
    this.openUpgradePanel(job);
  }

  private openUpgradePanel(job: PendingUpgradeJob): void {
    const options = this.buildUpgradeOptions(job.reason);
    if (!options.length) {
      this.applyFallback(job.reason);
      this.processQueue();
      return;
    }
    this.state.mode = 'levelup';
    this.dom.overlayTitle.textContent = job.reason === 'level' ? `等级 ${this.state.level}` : '协同机会';
    this.dom.overlaySubtitle.textContent = job.reason === 'level'
      ? '从三个升级中挑选其一，强化你的构筑。'
      : '满足条件的协同卡已解锁。';
    this.dom.overlayOptions.innerHTML = '';

    options.forEach(option => {
      const isSkill = option.type === 'skill';
      const data = option.data;
      const card = document.createElement('button');
      card.type = 'button';
      card.classList.add('option-card');
      if (isSkill) {
        card.classList.add('branch');
        const branchName = (data as SkillNodeRow).branchName;
        if (branchName) card.classList.add(`branch-${branchName}`);
      } else {
        card.classList.add('synergy');
        const tier = (data as SynergyCardRow).tier;
        if (tier) card.classList.add(tier.toLowerCase());
      }

      const iconPath = (data as SkillNodeRow).icon || (data as SynergyCardRow).icon || null;
      const resolvedIcon = this.assets.resolvePath(iconPath);
      const meta = isSkill
        ? `分支 ${(data as SkillNodeRow).branchName || (data as SkillNodeRow).branch || '未分类'} · 阶段 ${(data as SkillNodeRow).tier ?? '—'}`
        : `品质 ${(data as SynergyCardRow).tier ?? '—'}`;
      const effects = this.formatEffects((data as SkillNodeRow).effects || (data as SynergyCardRow).effects || '');

      card.innerHTML = `
        <div class="option-icon" style="background-image:url('${resolvedIcon}')"></div>
        <div class="option-content">
          <h3>${data.name}</h3>
          <p>${option.description}</p>
          <div class="option-meta">${meta}</div>
          <div class="option-meta">${effects || '——'}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.closeOverlay();
        this.applyUpgradeOption(option);
        this.processQueue();
      });

      this.dom.overlayOptions.appendChild(card);
    });

    this.dom.overlayEl.classList.remove('hidden');
  }

  private closeOverlay(): void {
    this.state.mode = 'playing';
    this.dom.overlayEl.classList.add('hidden');
  }

  private buildUpgradeOptions(reason: UpgradeReason): UpgradeOption[] {
    const skillCandidates = this.getAvailableSkills();
    const synergyCandidates = this.getAvailableSynergies();
    const options: UpgradeOption[] = [];

    this.shuffle(skillCandidates);
    this.shuffle(synergyCandidates);

    if (skillCandidates.length >= 3) {
      options.push(
        ...skillCandidates.slice(0, 3).map(node => ({ type: 'skill' as const, data: node, description: node.tooltip || '技能强化' }))
      );
    } else if (skillCandidates.length > 0) {
      options.push(
        ...skillCandidates.map(node => ({ type: 'skill' as const, data: node, description: node.tooltip || '技能强化' }))
      );
      if (options.length < 3 && synergyCandidates.length) {
        options.push(
          ...synergyCandidates
            .slice(0, 3 - options.length)
            .map(card => ({ type: 'synergy' as const, data: card, description: card.trigger || '协同效果常驻生效。' }))
        );
      }
    } else if (synergyCandidates.length) {
      options.push(
        ...synergyCandidates
          .slice(0, 3)
          .map(card => ({ type: 'synergy' as const, data: card, description: card.trigger || '协同效果常驻生效。' }))
      );
    }

    return this.ensureMinimumOptions(options);
  }

  private applyFallback(reason: UpgradeReason): void {
    const stats = this.state.stats;
    if (!stats) return;
    stats.damageFlat += 8;
    pushLog(this.state, this.dom, reason === 'level' ? '基础强化：伤害 +8' : '协同缺失：转化为伤害 +8');
    this.notifyStatsChanged();
  }

  private getAvailableSkills(): SkillNodeRow[] {
    const { skillTree } = this.library();
    return skillTree.filter(node => {
      if (this.state.unlockedSkills.has(node.tid)) return false;
      if (node.parent) {
        const parentId = node.parent.split(':')[1] || node.parent;
        if (!this.state.unlockedSkills.has(parentId)) return false;
      }
      return this.requirementsMet(node.requirements || '');
    });
  }

  private getAvailableSynergies(): SynergyCardRow[] {
    const { synergyCards } = this.library();
    return synergyCards.filter(card => {
      if (this.state.unlockedSynergies.has(card.tid)) return false;
      return this.prerequisitesMet(card.prerequisites || '');
    });
  }

  private requirementsMet(requirements: string): boolean {
    if (!requirements) return true;
    return requirements.split('|').every(token => {
      const [kind, value] = token.split(':');
      if (!value) return true;
      if (kind === 'level') return this.state.level >= Number(value);
      if (kind === 'skill') return this.state.unlockedSkills.has(value);
      if (kind === 'weapon') {
        if (!this.state.weapon) return false;
        const tid = this.state.weapon.template.tid;
        return tid.endsWith(value) || normalizeSlug(this.state.weapon.template.name) === value;
      }
      if (kind === 'weaponAttack') {
        if (!this.state.weapon) return false;
        const attackStyle = this.state.weapon.template.attackStyle || '';
        return normalizeIdentifier(attackStyle) === normalizeIdentifier(value);
      }
      if (kind === 'weaponDamage') {
        if (!this.state.weapon) return false;
        const damageType = this.state.weapon.template.damageType || '';
        return normalizeIdentifier(damageType) === normalizeIdentifier(value);
      }
      if (kind === 'weaponCategory') {
        if (!this.state.weapon) return false;
        const category = this.state.weapon.template.categoryName || '';
        return normalizeIdentifier(category) === normalizeIdentifier(value);
      }
      if (kind === 'relic') {
        if (!this.state.relic) return false;
        const tid = this.state.relic.template.tid;
        return tid.endsWith(value) || normalizeSlug(this.state.relic.template.name) === value;
      }
      return true;
    });
  }

  private prerequisitesMet(prerequisites: string): boolean {
    if (!prerequisites) return true;
    return prerequisites.split('|').every(token => {
      const [kind, value] = token.split(':');
      if (!value) return true;
      switch (kind) {
        case 'weapon':
          return !!(
            this.state.weapon &&
            (this.state.weapon.template.tid.endsWith(value) || normalizeSlug(this.state.weapon.template.name) === value)
          );
        case 'relic':
          return !!(
            this.state.relic &&
            (this.state.relic.template.tid.endsWith(value) || normalizeSlug(this.state.relic.template.name) === value)
          );
        case 'skill':
          return this.state.unlockedSkills.has(value);
        default:
          return true;
      }
    });
  }

  private applyUpgradeOption(option: UpgradeOption): void {
    if (option.type === 'skill') {
      this.unlockSkill(option.data as SkillNodeRow);
    } else {
      this.unlockSynergy(option.data as SynergyCardRow);
    }
    this.notifyStatsChanged();
  }

  private unlockSkill(node: SkillNodeRow): void {
    if (this.state.unlockedSkills.has(node.tid)) return;
    this.state.unlockedSkills.add(node.tid);
    this.applyEffectsString(node.effects || '');
    pushLog(this.state, this.dom, `习得技能：${node.name}`);
  }

  private unlockSynergy(card: SynergyCardRow): void {
    if (this.state.unlockedSynergies.has(card.tid)) return;
    this.state.unlockedSynergies.add(card.tid);
    this.applyEffectsString(card.effects || '');
    pushLog(this.state, this.dom, `激活协同：${card.name}`);
  }

  private applyEffectsString(effects: string): void {
    effects
      .split('|')
      .map(token => token.trim())
      .filter(Boolean)
      .forEach(token => this.applyEffectToken(token));
  }

  private applyEffectToken(token: string): void {
    const stats = this.state.stats;
    if (!stats) return;
    const [rawKey, rawValue] = token.split(':');
    if (!rawValue) return;
    const key = rawKey.trim();
    const valueStr = rawValue.trim();
    const numericValue = parseFloat(valueStr.replace(/[^-0-9.]/g, '')) || 0;
    const mutateStats: Record<string, StatsMutator> = {
      damage: s => (s.stats!.damageFlat += numericValue),
      beamDamage: s => (s.stats!.damageFlat += numericValue),
      burstDamage: s => (s.stats!.damageFlat += numericValue),
      frostDamage: s => (s.stats!.damageFlat += numericValue),
      frostShatter: s => (s.stats!.damageFlat += numericValue),
      fireRate: s => (s.stats!.fireRateMultiplier *= 1 + numericValue / 100),
      reload: s => (s.stats!.reloadMultiplier *= 1 + numericValue / 100),
      crit: s => (s.stats!.critBonus += numericValue / 100),
      weakPoint: s => (s.stats!.critDamageBonus += numericValue / 100),
      stability: s => {
        s.stats!.spreadMultiplier *= 1 - numericValue / 100;
        s.stats!.spreadMultiplier = Math.max(0.3, s.stats!.spreadMultiplier);
      },
      sanityDrain: s => (s.stats!.relicSanityReduction += numericValue),
      radius: s => (s.stats!.relicRadiusBonus += numericValue),
      pullStrength: s => (s.stats!.pullStrength += numericValue),
      sanityRegen: s => (s.stats!.sanityRegen += numericValue),
      beamReflect: s => (s.stats!.beamReflect = Math.min(0.8, s.stats!.beamReflect + numericValue / 100)),
      projectileSpeed: s => (s.stats!.projectileSpeedBonus += numericValue),
      split: s => (s.stats!.projectileSplit = Math.max(0, (s.stats!.projectileSplit || 0) + Math.round(numericValue))),
      splitAngle: s => (s.stats!.projectileSplitAngle = Math.max(0, (s.stats!.projectileSplitAngle || 0) + numericValue)),
      projectileSize: s => (s.stats!.projectileSizeBonus = (s.stats!.projectileSizeBonus || 0) + numericValue),
      pierce: s => (s.stats!.projectilePierce = Math.max(0, (s.stats!.projectilePierce || 0) + Math.round(numericValue))),
      ricochet: s => (s.stats!.projectileRicochet = Math.max(0, (s.stats!.projectileRicochet || 0) + Math.round(numericValue))),
      ricochetRadius: s => (s.stats!.projectileRicochetRadius = Math.max(40, (s.stats!.projectileRicochetRadius || 0) + numericValue)),
      slow: s => (s.stats!.maelstromSlow += numericValue / 100),
      elementalSlow: s => (s.stats!.elementalSlow = Math.min(0.9, (s.stats!.elementalSlow || 0) + numericValue / 100)),
      elementalSlowDuration: s => (s.stats!.elementalSlowDuration = Math.max(0, (s.stats!.elementalSlowDuration || 0) + numericValue)),
      duration: s => (s.stats!.relicDurationBonus += numericValue),
      damageMultiplier: s => (s.stats!.damageBonusMultiplier *= 1 + numericValue / 100),
      hpRegen: s => (s.stats!.hpRegen = (s.stats!.hpRegen || 0) + numericValue),
      shieldRegen: s => (s.stats!.shieldRegen = (s.stats!.shieldRegen || 0) + numericValue),
      moveSpeed: s => (s.stats!.moveSpeedBonus = (s.stats!.moveSpeedBonus || 0) + numericValue),
      invulnTime: s => (s.stats!.invulnTimeBonus = (s.stats!.invulnTimeBonus || 0) + numericValue),
      luckBonus: s => (s.stats!.luckBonus = (s.stats!.luckBonus || 0) + numericValue),
      ammoEfficiency: s => (s.stats!.ammoEfficiency = (s.stats!.ammoEfficiency || 0) + numericValue),
      xpBonus: s => (s.stats!.xpBonus = (s.stats!.xpBonus || 0) + numericValue),
      meleeDamage: s => (s.stats!.meleePulseDamage = (s.stats!.meleePulseDamage || 0) + numericValue),
      meleeRadius: s => (s.stats!.meleePulseRadius = Math.max(20, (s.stats!.meleePulseRadius || 0) + numericValue)),
      meleeInterval: s => (s.stats!.meleePulseInterval = Math.max(0.3, (s.stats!.meleePulseInterval || 1.8) + numericValue)),
      contactResist: s => {
        const current = s.stats!.contactDamageResist || 0;
        s.stats!.contactDamageResist = Math.min(0.9, Math.max(0, current + numericValue / 100));
      }
    } as Record<string, StatsMutator>;

    if (key === 'shield') {
      if (this.state.player) {
        this.state.player.overchargeShield(numericValue);
      }
      return;
    }

    if (key === 'maxHp') {
      if (this.state.player) {
        this.state.player.hpMax += numericValue;
        this.state.player.hp += numericValue;
      }
      return;
    }

    const mutator = mutateStats[key];
    if (mutator) {
      mutator(this.state);
    }
  }

  private notifyStatsChanged(): void {
    if (this.onStatsChanged) {
      this.onStatsChanged();
    }
  }

  private ensureMinimumOptions(options: UpgradeOption[]): UpgradeOption[] {
    let seedIndex = 0;
    while (options.length < 3) {
      const seed = this.fallbackSeeds[seedIndex % this.fallbackSeeds.length];
      options.push(this.createFallbackOption(seed));
      seedIndex += 1;
    }
    return options;
  }

  private createFallbackOption(seed: {
    key: string;
    name: string;
    branch: string;
    effects: string;
    description: string;
    icon?: string;
  }): UpgradeOption {
    const tidSuffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const node: SkillNodeRow = {
      tid: `fallback:${seed.key}:${tidSuffix}`,
      name: seed.name,
      branch: seed.branch,
      branchName: seed.branch,
      tier: 0,
      effects: seed.effects,
      tooltip: seed.description,
      icon: seed.icon
    };
    return {
      type: 'skill',
      data: node,
      description: seed.description
    };
  }

  private formatEffects(effectsString: string): string {
    if (!effectsString) return '';
    return effectsString
      .split('|')
      .map(effect => effect.trim())
      .filter(Boolean)
      .map(effect => {
        const [key, value] = effect.split(':');
        if (!value) return key;
        return `${key} ${value}`;
      })
      .join(' · ');
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
