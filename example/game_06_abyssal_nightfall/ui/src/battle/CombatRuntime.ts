import { AssetManager } from '../core/assets';
import type { GameDom } from '../core/dom';
import { loadResources, parseLibrary } from '../core/resources';
import type { GamePreset, GameSummary, LifecycleHooks, GameLibrary, GameResources } from '../core/types';
import { clamp, length, normalize, randomRange, formatTime, normalizeIdentifier } from '../core/utils';
import { GameState, GameMode } from './state';
import { StageController } from '../stage/StageController';
import { ProgressionManager } from '../progression/ProgressionManager';
import { PlayerUnit, WeaponInstance, RelicInstance, Projectile, EnemyProjectile, EffectInstance, LootDrop, EnemyUnit } from './entities';
import { pushLog } from './logger';
import {
  ARENA_BACKGROUND,
  ARENA_PADDING,
  BULLET_RADIUS,
  DEFAULT_IMPACT_SCALE,
  DEFAULT_PLAYER_SPRITE_SCALE,
  DEFAULT_PROJECTILE_SCALE,
  DROP_ATTRACTION_RADIUS,
  DROP_COLLECT_RADIUS,
  HEART_UNIT,
  PLAYER_RADIUS,
  SCALE,
  TARGET_DURATION,
  ENEMY_BULLET_RADIUS,
  LOOT_DEFINITIONS
} from './constants';
import { resolveEnemyTemplate, findByTid, buildEnemyIndex } from '../core/library';
import type { EnemyRow, RelicRow, WeaponRow } from '../core/types';

const CONTACT_DAMAGE_MIN = 6;
const BASE_LOOT_RATE = 0.5;

interface ControlsState {
  firing: boolean;
  aimX: number;
  aimY: number;
}

interface UpgradeToken {
  reason: 'level' | 'synergy';
}

export class CombatRuntime {
  private lifecycle: LifecycleHooks = {};
  private controls: ControlsState = { firing: false, aimX: 1, aimY: 0 };
  private readonly keys = new Set<string>();
  private inputBound = false;
  private animationHandle = 0;
  private lastPreset: GamePreset | null = null;
  private library: GameLibrary | null = null;
  private resources: GameResources | null = null;
  private missingProjectileSpriteLogged = new Set<string>();

  constructor(
    private readonly state: GameState,
    private readonly dom: GameDom,
    private readonly assets: AssetManager,
    private readonly stage: StageController,
    private readonly progression: ProgressionManager
  ) {
    this.progression.setStatsChangedHandler(() => this.updateHUD());
  }

  async ensureResources(): Promise<GameResources> {
    if (this.resources) return this.resources;
    this.resources = await loadResources();
    return this.resources;
  }

  getLibrary(): GameLibrary | null {
    return this.library;
  }

  getPreset(): GamePreset | null {
    return this.state.currentPreset;
  }

  getLastSummary(): GameSummary | null {
    return this.state.lastSummary;
  }

  configureLifecycle(hooks: LifecycleHooks): void {
    this.lifecycle = { ...this.lifecycle, ...hooks };
  }

  async startGame(preset: GamePreset = {}, options: { lifecycle?: LifecycleHooks } = {}): Promise<void> {
    if (options.lifecycle) {
      this.configureLifecycle(options.lifecycle);
    }
    this.lastPreset = preset;
    const resources = await this.ensureResources();
    this.library = parseLibrary(resources);
    await this.preloadAssets(this.library);
    this.bootstrap(this.library, preset);
    this.setupInput();
    this.updateHUD();
    this.render();
    this.state.mode = 'playing';
    this.scheduleNextFrame();
  }

  stopBgm(): void {
    this.assets.stopBgm();
  }

  private scheduleNextFrame(): void {
    cancelAnimationFrame(this.animationHandle);
    const loop = (timestamp: number) => {
      if (!this.state.lastTime) this.state.lastTime = timestamp;
      const dt = Math.min((timestamp - this.state.lastTime) / 1000, 0.033);
      this.state.lastTime = timestamp;
      if (this.state.mode === 'playing') {
        this.update(dt);
      } else {
        this.render();
      }
      this.animationHandle = requestAnimationFrame(loop);
    };
    this.animationHandle = requestAnimationFrame(loop);
  }

  private async preloadAssets(library: GameLibrary): Promise<void> {
    const { imagePaths, audioPaths } = this.collectAssetPaths(library);
    await this.assets.preload(imagePaths, audioPaths);
    this.state.assets = this.assets;
    const background = this.assets.getImage(ARENA_BACKGROUND);
    this.state.background = background;
    this.state.backgroundPattern = background ? this.dom.ctx.createPattern(background, 'repeat') : null;
  }

  private collectAssetPaths(library: GameLibrary): { imagePaths: Set<string>; audioPaths: Set<string> } {
    const imagePaths = new Set<string>();
    const audioPaths = new Set<string>();

    library.operators.forEach(operator => {
      if (operator.sprite) imagePaths.add(operator.sprite);
      if (operator.portraitArt) imagePaths.add(operator.portraitArt);
      if (operator.themeTrack) audioPaths.add(operator.themeTrack);
    });

    library.weapons.forEach(weapon => {
      ['travelSprite', 'impactSprite', 'muzzleSprite'].forEach(key => {
        const value = (weapon as any)[key];
        if (value) imagePaths.add(value);
      });
      if (weapon.fireSfx) audioPaths.add(weapon.fireSfx);
      if (weapon.impactSfx) audioPaths.add(weapon.impactSfx);
    });

    library.relics.forEach(relic => {
      if (relic.vfxSprite) imagePaths.add(relic.vfxSprite);
      if (relic.sfxActivate) audioPaths.add(relic.sfxActivate);
      if (relic.sfxLoop) audioPaths.add(relic.sfxLoop);
      if (relic.sfxEnd) audioPaths.add(relic.sfxEnd);
    });

    library.enemies.forEach(enemy => {
      if (enemy.projectileSprite) imagePaths.add(enemy.projectileSprite);
      const impactSprite = (enemy as any).impactSprite;
      if (impactSprite) imagePaths.add(impactSprite);
      if (enemy.sprite) imagePaths.add(enemy.sprite);
      if (enemy.deathSprite) imagePaths.add(enemy.deathSprite);
      const deathSfx = (enemy as any).deathSfx;
      if (deathSfx) audioPaths.add(deathSfx);
      const attackSfx = (enemy as any).attackSfx;
      if (attackSfx) audioPaths.add(attackSfx);
    });

    library.bosses.forEach(boss => {
      const telegraphSprite = (boss as any).telegraphSprite;
      if (telegraphSprite) imagePaths.add(telegraphSprite);
      if (boss.sprite) imagePaths.add(boss.sprite);
      if (boss.deathSprite) imagePaths.add(boss.deathSprite);
      const deathSfx = (boss as any).deathSfx;
      if (deathSfx) audioPaths.add(deathSfx);
      const themeTrack = (boss as any).themeTrack;
      if (themeTrack) audioPaths.add(themeTrack);
    });

    Object.values(LOOT_DEFINITIONS).forEach(def => {
      if (def.sprite) imagePaths.add(def.sprite);
      if (def.sfx) audioPaths.add(def.sfx);
    });

    imagePaths.add(ARENA_BACKGROUND);
    return { imagePaths, audioPaths };
  }

  private bootstrap(library: GameLibrary, preset: GamePreset): void {
    this.state.library = library;
    this.stage.prepare(library);
    this.state.runId += 1;
    this.state.mode = 'loading';
    this.state.time = 0;
    this.state.lastTime = 0;
    this.state.invulnTimer = 0;
    this.state.clearTransient();
    this.state.level = 1;
    this.state.xp = 0;
    this.state.xpNeeded = 60;
    this.state.baseCrit = 0.05;
    this.state.resetStats();
    this.state.unlockedSkills.clear();
    this.state.unlockedSynergies.clear();
    this.state.upgradeQueue = [];

    const operator = this.pickOperator(library, preset);
    if (!operator) {
      pushLog(this.state, this.dom, '未找到可用的操作者');
      this.state.mode = 'idle';
      return;
    }

    const weaponTemplate = this.pickWeapon(library, preset, operator.startWeapon);
    const relicTemplate = this.pickRelic(library, preset, operator.startRelic);

    this.state.currentPreset = {
      operatorTid: operator.tid,
      weaponTid: weaponTemplate ? weaponTemplate.tid : null,
      relicTid: relicTemplate ? relicTemplate.tid : null
    };

    this.state.player = new PlayerUnit(
      operator.codename,
      this.dom.canvas.width / 2,
      this.dom.canvas.height / 2,
      operator.hp,
      operator.moveSpeed * SCALE,
      operator.sprite ? this.assets.getImage(operator.sprite) : null,
      Number(operator.spriteScale) || DEFAULT_PLAYER_SPRITE_SCALE
    );

    if (weaponTemplate) {
      this.state.weapon = this.createWeaponInstance(weaponTemplate);
    } else {
      this.state.weapon = null;
    }

    if (relicTemplate) {
      this.state.relic = new RelicInstance(relicTemplate);
    } else {
      this.state.relic = null;
    }

    this.state.sanityCap = operator.sanityCap;
    this.state.sanity = operator.sanityCap;
    this.state.baseCrit = operator.critBonus ?? 0.05;

    pushLog(
      this.state,
      this.dom,
      `操作者 ${operator.codename} · 武器 ${weaponTemplate ? weaponTemplate.name : '无'} · 遗物 ${relicTemplate ? relicTemplate.name : '无'}`
    );

    this.assets.stopBgm();
    if (operator.themeTrack) {
      this.assets.playBgm(operator.themeTrack, { volume: 0.7, loop: true });
    }
  }

  private pickOperator(library: GameLibrary, preset: GamePreset) {
    const direct = findByTid(library.operators, preset.operatorTid ?? null);
    if (direct) return direct;
    const slug = preset.operatorSlug || '';
    if (slug) {
      const normalized = normalizeIdentifier(slug);
      const bySlug = library.operators.find(op => normalizeIdentifier(op.tid).endsWith(normalized) || normalizeIdentifier(op.codename) === normalized);
      if (bySlug) return bySlug;
    }
    return library.operators[0] || null;
  }

  private pickWeapon(library: GameLibrary, preset: GamePreset, fallbackTid?: string | null) {
    const preferred = findByTid(library.weapons, preset.weaponTid ?? null);
    if (preferred) return preferred;
    if (preset.weaponSlug) {
      const normalized = normalizeIdentifier(preset.weaponSlug);
      const bySlug = library.weapons.find(weapon => normalizeIdentifier(weapon.tid).endsWith(normalized) || normalizeIdentifier(weapon.name) === normalized);
      if (bySlug) return bySlug;
    }
    if (fallbackTid) {
      const fallback = findByTid(library.weapons, fallbackTid);
      if (fallback) return fallback;
    }
    return library.weapons[0] || null;
  }

  private pickRelic(library: GameLibrary, preset: GamePreset, fallbackTid?: string | null) {
    const preferred = findByTid(library.relics, preset.relicTid ?? null);
    if (preferred) return preferred;
    if (preset.relicSlug) {
      const normalized = normalizeIdentifier(preset.relicSlug);
      const bySlug = library.relics.find(relic => normalizeIdentifier(relic.tid).endsWith(normalized) || normalizeIdentifier(relic.name) === normalized);
      if (bySlug) return bySlug;
    }
    if (fallbackTid) {
      const fallback = findByTid(library.relics, fallbackTid);
      if (fallback) return fallback;
    }
    return library.relics[0] || null;
  }

  private createWeaponInstance(template: WeaponRow): WeaponInstance {
    return new WeaponInstance(
      template,
      {
        travel: template.travelSprite ? this.assets.getImage(template.travelSprite) : null,
        impact: template.impactSprite ? this.assets.getImage(template.impactSprite) : null,
        muzzle: template.muzzleSprite ? this.assets.getImage(template.muzzleSprite) : null
      },
      {
        projectile: Number(template.projectileScale) || DEFAULT_PROJECTILE_SCALE,
        impact: Number(template.impactScale) || Number(template.projectileScale) || DEFAULT_IMPACT_SCALE
      }
    );
  }

  private setupInput(): void {
    if (this.inputBound) return;
    this.inputBound = true;
    window.addEventListener('keydown', e => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state.mode === 'playing') this.activateRelic();
        return;
      }
      if (this.state.mode === 'levelup') return;
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', e => {
      this.keys.delete(e.code);
    });

    this.dom.canvas.addEventListener('mousedown', () => {
      if (this.state.mode === 'playing') this.controls.firing = true;
    });
    this.dom.canvas.addEventListener('mouseup', () => {
      this.controls.firing = false;
    });
    this.dom.canvas.addEventListener('mouseleave', () => {
      this.controls.firing = false;
    });
    this.dom.canvas.addEventListener('mousemove', e => {
      if (!this.state.player) return;
      const rect = this.dom.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - this.state.player.x;
      const my = e.clientY - rect.top - this.state.player.y;
      const [nx, ny] = normalize(mx, my);
      this.controls.aimX = nx;
      this.controls.aimY = ny;
    });

    this.dom.restartBtn.addEventListener('click', () => {
      this.dom.restartBtn.classList.remove('visible');
      if (this.lifecycle.onRestart) {
        this.lifecycle.onRestart(this.state.lastSummary, this.lastPreset);
      } else {
        window.location.reload();
      }
    });
  }

  private update(dt: number): void {
    this.state.time += dt;
    this.state.invulnTimer = Math.max(0, this.state.invulnTimer - dt);
    if (this.state.stats) {
      if (this.state.stats.hpRegen > 0 && this.state.player && this.state.player.hp < this.state.player.hpMax) {
        this.state.player.hp = clamp(this.state.player.hp + this.state.stats.hpRegen * dt, 0, this.state.player.hpMax);
      }
      if (this.state.stats.shieldRegen > 0 && this.state.player && this.state.player.shield < this.state.player.shieldMax) {
        this.state.player.shield = clamp(this.state.player.shield + this.state.stats.shieldRegen * dt, 0, this.state.player.shieldMax);
      }
    }

    this.updateRelic(dt);
    this.handleInput(dt);
    this.updateBullets(dt);
    this.updateEnemyProjectiles(dt);
    this.updateDrops(dt);
    this.updateEnemies(dt);
    this.updateEffects(dt);
    this.stage.update();
    this.updateHUD();
    this.render();

    this.state.bullets = this.state.bullets.filter(bullet => bullet.life > 0);
    this.state.drops = this.state.drops.filter(drop => drop.elapsed <= drop.life);

    if (this.state.sanity <= 0) this.gameOver('defeat', '理智归零，你被黑暗吞噬');
    if (
      this.state.time >= TARGET_DURATION &&
      this.state.enemies.length === 0 &&
      this.state.nextWaveIndex >= this.state.waves.length
    ) {
      this.gameOver('victory', '黎明到来，你成功守住灯塔');
    }
  }

  private handleInput(dt: number): void {
    if (!this.state.player || this.state.mode !== 'playing') return;
    let dx = 0;
    let dy = 0;
    if (this.keys.has('KeyW')) dy -= 1;
    if (this.keys.has('KeyS')) dy += 1;
    if (this.keys.has('KeyA')) dx -= 1;
    if (this.keys.has('KeyD')) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const [nx, ny] = normalize(dx, dy);
      const moveSpeedBonus = this.state.stats?.moveSpeedBonus || 0;
      const finalMoveSpeed = this.state.player.moveSpeed * (1 + moveSpeedBonus / 100);
      this.state.player.x += nx * finalMoveSpeed * dt;
      this.state.player.y += ny * finalMoveSpeed * dt;
    }
    this.state.player.x = clamp(this.state.player.x, ARENA_PADDING, this.dom.canvas.width - ARENA_PADDING);
    this.state.player.y = clamp(this.state.player.y, ARENA_PADDING, this.dom.canvas.height - ARENA_PADDING);

    if (!this.state.weapon) return;
    const weapon = this.state.weapon;
    weapon.fireTimer = Math.max(0, weapon.fireTimer - dt);
    if (weapon.reloadTimer > 0) {
      weapon.reloadTimer = Math.max(0, weapon.reloadTimer - dt);
      if (weapon.reloadTimer === 0) {
        weapon.ammo = weapon.baseMagazine;
        pushLog(this.state, this.dom, '装填完成');
      }
      return;
    }
    if (!this.controls.firing || weapon.fireTimer > 0) return;
    if (weapon.ammo <= 0) {
      weapon.reloadTimer = weapon.baseReload * (this.state.stats?.reloadMultiplier ?? 1);
      pushLog(this.state, this.dom, '子弹耗尽，开始装填');
      return;
    }
    this.fireWeapon();
  }

  private fireWeapon(): void {
    const weapon = this.state.weapon;
    const player = this.state.player;
    if (!weapon || !player) return;
    weapon.ammo -= 1;
    weapon.fireTimer = weapon.baseFireRate * (this.state.stats?.fireRateMultiplier ?? 1);
    if (weapon.ammo <= 0) {
      weapon.reloadTimer = weapon.baseReload * (this.state.stats?.reloadMultiplier ?? 1);
    }
    const [dirX, dirY] = normalize(this.controls.aimX, this.controls.aimY);
    const spread = Math.max(0, (weapon.baseSpread || 0) * (this.state.stats?.spreadMultiplier ?? 1));
    const offset = spread > 0 ? (Math.random() - 0.5) * (spread * Math.PI / 180) : 0;
    const cos = Math.cos(offset);
    const sin = Math.sin(offset);
    const fx = dirX * cos - dirY * sin;
    const fy = dirX * sin + dirY * cos;
    const speed = (weapon.baseProjectileSpeed + (this.state.stats?.projectileSpeedBonus ?? 0)) * SCALE;
    this.state.bullets.push(
      new Projectile(
        player.x + fx * PLAYER_RADIUS,
        player.y + fy * PLAYER_RADIUS,
        fx * speed,
        fy * speed,
        weapon.template.projectileLifetime ?? 1.2,
        this.computeShotDamage(),
        weapon.travelSprite,
        weapon.projectileScale
      )
    );
    this.spawnMuzzleFlash(player.x, player.y, fx, fy);
    if (weapon.fireSfx) this.assets.playSound(weapon.fireSfx, { volume: 0.85 });
  }

  private computeShotDamage(): number {
    const weapon = this.state.weapon;
    const stats = this.state.stats;
    if (!weapon || !stats) return 0;
    let damage = (weapon.baseDamage + stats.damageFlat) * stats.damageBonusMultiplier;
    damage = Math.max(1, damage);
    const critChance = clamp(this.state.baseCrit + stats.critBonus, 0, 0.8);
    if (Math.random() < critChance) {
      damage *= 1.5 + stats.critDamageBonus;
      pushLog(this.state, this.dom, '暴击造成额外伤害');
    }
    return damage;
  }

  private spawnMuzzleFlash(originX: number, originY: number, fx: number, fy: number): void {
    const weapon = this.state.weapon;
    if (!weapon || !weapon.muzzleSprite) return;
    const angle = Math.atan2(fy, fx);
    const distance = PLAYER_RADIUS + 10;
    const x = originX + fx * distance;
    const y = originY + fy * distance;
    this.state.effects.push(
      new EffectInstance('muzzle', x, y, 0.16, weapon.muzzleSprite, weapon.projectileScale * 1.25, angle)
    );
  }

  private spawnImpactEffect(x: number, y: number): void {
    const weapon = this.state.weapon;
    if (!weapon || !weapon.impactSprite) return;
    this.state.effects.push(new EffectInstance('impact', x, y, 0.28, weapon.impactSprite, weapon.impactScale));
  }

  private spawnEnemyDeathEffect(enemy: EnemyRow, position: { x: number; y: number }): void {
    const deathSprite = enemy.deathSprite ? this.assets.getImage(enemy.deathSprite) : null;
    if (!deathSprite) return;
    this.state.effects.push(
      new EffectInstance(
        'impact',
        position.x,
        position.y,
        0.42,
        deathSprite,
        enemy.spriteScale ? enemy.spriteScale * 1.1 : DEFAULT_IMPACT_SCALE
      )
    );
  }

  private spawnLoot(enemy: EnemyRow, position: { x: number; y: number }): void {
    const table = enemy.lootTable || '';
    if (!table) return;
    const tokens = table
      .split('|')
      .map(token => token.trim())
      .filter(Boolean);
    if (!tokens.length) return;
    tokens.forEach(token => {
      const def = LOOT_DEFINITIONS[token];
      if (!def) return;
      const luckFactor = 1 + (this.state.stats?.luckBonus || 0) / 100;
      const baseChance = (def.chance ?? 0.5) * BASE_LOOT_RATE;
      const chance = clamp(baseChance * luckFactor, 0, 0.95);
      if (Math.random() > chance) return;
      const amount = def.amountRange ? randomRange(def.amountRange[0], def.amountRange[1]) : def.amount ?? 0;
      this.state.drops.push(
        new LootDrop(
          `${token}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          def.type,
          amount,
          position.x + randomRange(-22, 22),
          position.y + randomRange(-22, 22),
          def.sprite ? this.assets.getImage(def.sprite) : null,
          def.sprite || null,
          def.sfx || null,
          def.life ?? 18
        )
      );
    });
  }

  private collectDrop(drop: LootDrop): void {
    const stats = this.state.stats;
    switch (drop.type) {
      case 'sanity': {
        const gained = drop.amount || 0;
        this.state.sanity = clamp(this.state.sanity + gained, 0, this.state.sanityCap);
        pushLog(this.state, this.dom, `理智恢复 +${Math.round(gained)}`);
        break;
      }
      case 'hp': {
        if (this.state.player) {
          const gained = drop.amount || 0;
          this.state.player.heal(Math.round(gained));
          pushLog(this.state, this.dom, `生命回复 +${Math.round(gained)}`);
        }
        break;
      }
      case 'shield': {
        if (this.state.player) {
          const gained = drop.amount || 0;
          this.state.player.overchargeShield(gained);
          pushLog(this.state, this.dom, `护盾充能 +${Math.round(gained)}`);
        }
        break;
      }
      case 'xp': {
        const amount = drop.amount || 0;
        this.progression.gainXp(amount);
        pushLog(this.state, this.dom, `吸收记忆残响 +${Math.round(amount)} XP`);
        break;
      }
      case 'ammo': {
        if (this.state.weapon) {
          const refill = Math.max(1, Math.round(this.state.weapon.baseMagazine * (drop.amount || 0)));
          this.state.weapon.ammo = clamp(this.state.weapon.ammo + refill, 0, this.state.weapon.baseMagazine);
          pushLog(this.state, this.dom, `弹药补给 +${refill}`);
        }
        break;
      }
      case 'relic_charge': {
        if (this.state.relic) {
          this.state.relic.cooldownTimer = Math.max(0, this.state.relic.cooldownTimer - 12 * (drop.amount || 1));
          pushLog(this.state, this.dom, '遗物冷却大幅缩短');
        }
        break;
      }
    }
  }

  private updateDrops(dt: number): void {
    if (!this.state.player) return;
    this.state.drops.forEach(drop => {
      drop.elapsed += dt;
      const dist = length(this.state.player!.x - drop.x, this.state.player!.y - drop.y);
      if (dist <= DROP_COLLECT_RADIUS) {
        this.collectDrop(drop);
        if (drop.sfx) this.assets.playSound(drop.sfx, { volume: 0.6 });
        drop.elapsed = drop.life + 1;
        return;
      }
      if (dist <= DROP_ATTRACTION_RADIUS) {
        const pull = this.state.stats?.pullStrength || 0;
        const [nx, ny] = normalize(this.state.player!.x - drop.x, this.state.player!.y - drop.y);
        drop.x += nx * (60 + pull * 10) * dt;
        drop.y += ny * (60 + pull * 10) * dt;
      }
    });
  }

  private updateRelic(dt: number): void {
    if (!this.state.relic) return;
    this.state.relic.cooldownTimer = Math.max(0, this.state.relic.cooldownTimer - dt);
    this.state.relic.activeTimer = Math.max(0, this.state.relic.activeTimer - dt);
  }

  private updateEnemies(dt: number): void {
    const player = this.state.player;
    if (!player) return;
    this.state.enemies = this.state.enemies.filter(enemy => {
      if (!enemy.alive) return false;
      const [nx, ny] = normalize(player.x - enemy.x, player.y - enemy.y);
      enemy.x += nx * enemy.speed * dt;
      enemy.y += ny * enemy.speed * dt;
      const enemyRadius = enemy.radius || PLAYER_RADIUS;
      for (const bullet of this.state.bullets) {
        const dist = length(enemy.x - bullet.x, enemy.y - bullet.y);
        if (dist <= enemyRadius) {
          enemy.hp -= bullet.damage;
          bullet.life = -1;
          this.spawnImpactEffect(bullet.x, bullet.y);
          if (this.state.weapon && this.state.weapon.impactSfx) {
            this.assets.playSound(this.state.weapon.impactSfx, { volume: 0.75 });
          }
          if (enemy.hp <= 0) {
            this.killEnemy(enemy);
            break;
          }
        }
      }
      if (!enemy.alive) return false;
      const distPlayer = length(player.x - enemy.x, player.y - enemy.y);
      if (distPlayer <= PLAYER_RADIUS + enemyRadius) {
        const contactDamage = Math.max(enemy.damage ?? 0, CONTACT_DAMAGE_MIN);
        const contactSanity = enemy.sanityDamage ?? Math.max(1, Math.round(contactDamage * 0.25));
        this.applyPlayerDamage(contactDamage, enemy.template.name, contactSanity);
      }
      if (enemy.template.attackInterval) {
        enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
        if (enemy.attackTimer === 0) this.performEnemyAttack(enemy);
      }
      return true;
    });
  }

  private updateBullets(dt: number): void {
    this.state.bullets.forEach(bullet => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
    });
  }

  private updateEnemyProjectiles(dt: number): void {
    if (!this.state.player) return;
    this.state.enemyProjectiles.forEach(projectile => {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      const dist = length(this.state.player!.x - projectile.x, this.state.player!.y - projectile.y);
      if (dist <= PLAYER_RADIUS + ENEMY_BULLET_RADIUS) {
        this.applyPlayerDamage(projectile.damage, projectile.label || '攻击', projectile.sanity || 0);
        projectile.life = -1;
      }
    });
    this.state.enemyProjectiles = this.state.enemyProjectiles.filter(projectile => projectile.life > 0);
  }

  private updateEffects(dt: number): void {
    this.state.effects = this.state.effects.filter(effect => {
      effect.elapsed += dt;
      if (effect.type === 'maelstrom') {
        // placeholder for special handling; keep effect alive until duration ends
      }
      return effect.elapsed <= effect.duration;
    });
  }

  private performEnemyAttack(enemy: EnemyUnit): void {
    const player = this.state.player;
    if (!player) return;
    const template = enemy.template;
    enemy.attackTimer = (template.attackInterval ?? 0) * (enemy.attackIntervalScale || 1);
    const [dirX, dirY] = normalize(player.x - enemy.x, player.y - enemy.y);
    const enemyRadius = enemy.radius || PLAYER_RADIUS;
    const projectileSprite = template.projectileSprite ? this.assets.getImage(template.projectileSprite) : null;
    if (!projectileSprite && template.projectileSprite && !this.missingProjectileSpriteLogged.has(template.projectileSprite)) {
      this.missingProjectileSpriteLogged.add(template.projectileSprite);
      console.warn('[abyssal-nightfall] 等待载入投射物贴图', template.name, template.projectileSprite);
      void this.assets.loadImage(template.projectileSprite).then(img => {
        if (img) this.missingProjectileSpriteLogged.delete(template.projectileSprite!);
      });
    }

    const pushProjectile = (vx: number, vy: number, damage: number, sanity: number) => {
      const projectileSpeed = (template.projectileSpeed ?? 0) * SCALE * (enemy.projectileSpeedScale || 1);
      this.state.enemyProjectiles.push(
        new EnemyProjectile(
          enemy.x + vx,
          enemy.y + vy,
          dirX * projectileSpeed,
          dirY * projectileSpeed,
          template.projectileLifetime ?? 1.4,
          damage,
          sanity,
          template.name,
          projectileSprite,
          template.projectileSprite || null,
          template.projectileScale || 0.9
        )
      );
    };

    if (enemy.disableProjectiles) {
      const contactDamage = Math.max(template.damage ?? 8, CONTACT_DAMAGE_MIN);
      const contactSanity = template.sanityDamage ?? Math.max(1, Math.round(contactDamage * 0.25));
      this.applyPlayerDamage(contactDamage, template.name, contactSanity);
      return;
    }

    switch (template.attackStyle) {
      case 'BURST': {
        const spread = 0.22;
        for (let i = 0; i < 3; i++) {
          const offset = (i - 1) * spread;
          const cos = Math.cos(offset);
          const sin = Math.sin(offset);
          const fx = dirX * cos - dirY * sin;
          const fy = dirX * sin + dirY * cos;
          pushProjectile(fx * enemyRadius, fy * enemyRadius, Math.round((template.damage ?? 12) * 0.6), Math.round((template.sanityDamage ?? 6) * 0.5));
        }
        break;
      }
      case 'AUTO': {
        pushProjectile(dirX * enemyRadius, dirY * enemyRadius, template.damage ?? 12, template.sanityDamage ?? 6);
        break;
      }
      case 'BEAM': {
        pushLog(this.state, this.dom, `${template.name} 凝聚能量，发射光束！`);
        this.state.effects.push(
          new EffectInstance('telegraph', enemy.x, enemy.y, 1.6, projectileSprite, template.projectileScale || 1, Math.atan2(dirY, dirX), {
            origin: { x: enemy.x, y: enemy.y },
            dirX,
            dirY
          })
        );
        break;
      }
      default: {
        pushProjectile(dirX * enemyRadius, dirY * enemyRadius, template.damage ?? 10, template.sanityDamage ?? 5);
      }
    }

    if (template.attackSfx) {
      this.assets.playSound(template.attackSfx, { volume: 0.65 });
    }
  }

  private applyPlayerDamage(amount: number, source: string, sanityLoss = 0): void {
    if (!this.state.player) return;
    if (this.state.invulnTimer > 0) return;
    const { remaining, absorbed } = this.state.player.applyDamage(amount);
    if (absorbed > 0) {
      this.state.effects.push(new EffectInstance('shield', this.state.player.x, this.state.player.y, 0.18, null, 1));
    }
    if (remaining > 0) {
      this.state.invulnTimer = 0.8 + (this.state.stats?.invulnTimeBonus ?? 0) / 10;
      this.spawnImpactEffect(this.state.player.x, this.state.player.y);
      pushLog(this.state, this.dom, `${source} 命中造成 ${Math.round(remaining)} 伤害`);
    }
    if (sanityLoss > 0) {
      this.state.sanity = clamp(this.state.sanity - sanityLoss, 0, this.state.sanityCap);
    }
    if (this.state.player.hp <= 0) this.gameOver('defeat', '你倒在邪潮之中。');
  }

  private killEnemy(enemy: EnemyUnit): void {
    enemy.alive = false;
    this.state.killCount += 1;
    this.spawnEnemyDeathEffect(enemy.template, { x: enemy.x, y: enemy.y });
    this.spawnLoot(enemy.template, { x: enemy.x, y: enemy.y });
    if (enemy.template.deathSfx) {
      this.assets.playSound(enemy.template.deathSfx, { volume: 0.9 });
    }
    this.progression.gainXp(enemy.template.xp ?? 20);
  }

  private updateEffectsVisuals(): void {
    // placeholder for potential post-processing; kept for parity
  }

  private render(): void {
    const { ctx, canvas } = this.dom;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.renderBackground();
    this.renderGrid();
    this.renderDrops();
    this.renderEffects();
    this.renderBullets();
    this.renderEnemyProjectiles();
    this.renderPlayer();
    this.renderEnemies();
    this.renderGameOverTint();
  }

  private renderBackground(): void {
    const { ctx, canvas } = this.dom;
    if (this.state.backgroundPattern) {
      ctx.save();
      ctx.fillStyle = this.state.backgroundPattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  private renderGrid(): void {
    const { ctx, canvas } = this.dom;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    const grid = 64;
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

  private renderPlayer(): void {
    const player = this.state.player;
    if (!player) return;
    const { ctx } = this.dom;
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.shield > 0) {
      const ratio = Math.min(1, player.shield / (player.shieldMax || player.shield));
      ctx.strokeStyle = 'rgba(147,197,253,0.85)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
    }

    if (player.sprite) {
      const scale = player.spriteScale || DEFAULT_PLAYER_SPRITE_SCALE;
      const angle = Math.atan2(this.controls.aimY, this.controls.aimX);
      ctx.save();
      ctx.rotate(angle);
      ctx.drawImage(
        player.sprite,
        (-player.sprite.width * scale) / 2,
        (-player.sprite.height * scale) / 2,
        player.sprite.width * scale,
        player.sprite.height * scale
      );
      ctx.restore();
      ctx.strokeStyle = 'rgba(191,219,254,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bfdbfe';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderEnemies(): void {
    const { ctx } = this.dom;
    this.state.enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      if (enemy.sprite) {
        const scale = enemy.spriteScale || 1;
        ctx.drawImage(
          enemy.sprite,
          (-enemy.sprite.width * scale) / 2,
          (-enemy.sprite.height * scale) / 2,
          enemy.sprite.width * scale,
          enemy.sprite.height * scale
        );
      } else {
        ctx.fillStyle = 'rgba(255, 30, 65, 0.65)';
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius || PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private renderBullets(): void {
    const { ctx } = this.dom;
    ctx.save();
    this.state.bullets.forEach(bullet => {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      const angle = bullet.angle !== undefined ? bullet.angle : Math.atan2(bullet.vy, bullet.vx);
      if (bullet.sprite) {
        const scale = bullet.scale || DEFAULT_PROJECTILE_SCALE;
        ctx.rotate(angle);
        ctx.drawImage(
          bullet.sprite,
          (-bullet.sprite.width * scale) / 2,
          (-bullet.sprite.height * scale) / 2,
          bullet.sprite.width * scale,
          bullet.sprite.height * scale
        );
      } else {
        ctx.fillStyle = '#faffff';
        ctx.beginPath();
        ctx.arc(0, 0, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  private renderEnemyProjectiles(): void {
    const { ctx } = this.dom;
    ctx.save();
    this.state.enemyProjectiles.forEach(projectile => {
      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      const angle = Math.atan2(projectile.vy, projectile.vx);
      if (projectile.sprite) {
        const scale = projectile.scale || 1;
        ctx.rotate(angle);
        ctx.drawImage(
          projectile.sprite,
          (-projectile.sprite.width * scale) / 2,
          (-projectile.sprite.height * scale) / 2,
          projectile.sprite.width * scale,
          projectile.sprite.height * scale
        );
      } else {
        ctx.fillStyle = 'rgba(255, 148, 94, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, ENEMY_BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  private renderDrops(): void {
    const { ctx } = this.dom;
    ctx.save();
    this.state.drops.forEach(drop => {
      ctx.translate(drop.x, drop.y + Math.sin(drop.bob + drop.elapsed * 4) * 3);
      if (drop.sprite) {
        const scale = 0.48;
        ctx.drawImage(
          drop.sprite,
          (-drop.sprite.width * scale) / 2,
          (-drop.sprite.height * scale) / 2,
          drop.sprite.width * scale,
          drop.sprite.height * scale
        );
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    ctx.restore();
  }

  private renderEffects(): void {
    const { ctx } = this.dom;
    ctx.save();
    this.state.effects.forEach(effect => {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      if (effect.sprite) {
        effect.updateFrameInfo();
        const scale = effect.scale || 1;
        const alpha = 1 - effect.elapsed / effect.duration;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.rotate(effect.angle || 0);
        const frameCount = Math.max(1, effect.frameCount);
        const progress = Math.min(0.999, Math.max(0, effect.elapsed / effect.duration));
        const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
        const frameWidth = effect.frameWidth || effect.sprite.width;
        const frameHeight = effect.frameHeight || effect.sprite.height;
        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        ctx.drawImage(
          effect.sprite,
          frameWidth * frameIndex,
          0,
          frameWidth,
          frameHeight,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
        ctx.globalAlpha = 1;
      } else if (effect.type === 'maelstrom') {
        const radius = Math.max(40, effect.scale * 0.5);
        const alpha = 0.35 * (1 - effect.elapsed / effect.duration);
        ctx.strokeStyle = `rgba(96, 165, 250, ${Math.max(0, alpha)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  private renderGameOverTint(): void {
    const { ctx, canvas } = this.dom;
    if (this.state.mode === 'playing') return;
    ctx.save();
    ctx.fillStyle = 'rgba(9, 12, 24, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  private updateHUD(): void {
    if (!this.state.player) return;
    this.dom.timeLabel.textContent = formatTime(this.state.time);
    this.dom.killLabel.textContent = this.state.killCount.toString();
    this.dom.weaponNameEl.textContent = this.state.weapon ? this.state.weapon.template.name : '未装备武器';
    this.renderHearts();
    this.renderAmmo();

    if (this.state.relic && this.state.relic.template) {
      if (this.state.relic.activeTimer > 0) {
        this.dom.relicLabel.textContent = `遗物激活 ${this.state.relic.activeTimer.toFixed(1)} 秒`;
      } else if (this.state.relic.cooldownTimer > 0) {
        this.dom.relicLabel.textContent = `遗物冷却 ${this.state.relic.cooldownTimer.toFixed(1)} 秒`;
      } else {
        this.dom.relicLabel.textContent = '遗物就绪（空格）';
      }
    } else {
      this.dom.relicLabel.textContent = '未装备遗物';
    }

    const currentWave = Math.min(this.state.nextWaveIndex, this.state.waves.length);
    if (this.state.nextWaveIndex < this.state.waves.length) {
      const wave = this.state.waves[this.state.nextWaveIndex];
      const template = resolveEnemyTemplate(this.state.enemyLookup, wave.enemyId);
      const enemyName = template ? template.name : String(wave.enemyId);
      const eta = Math.max(0, wave.timestamp - this.state.time);
      this.dom.waveInfoEl.textContent = `波次 ${currentWave + 1}/${this.state.waves.length} · ${enemyName} ×${wave.count} · ${eta.toFixed(1)} 秒`;
    } else if (this.state.enemies.length) {
      this.dom.waveInfoEl.textContent = `波次 ${currentWave}/${this.state.waves.length} · 清除残余目标`;
    } else {
      this.dom.waveInfoEl.textContent = `波次 ${this.state.waves.length}/${this.state.waves.length} · 等待收束`;
    }

    this.dom.levelLabel.textContent = this.state.level.toString();
    this.dom.xpLabel.textContent = `${Math.round(this.state.xp)} / ${this.state.xpNeeded}`;
    this.dom.xpBar.style.width = `${clamp((this.state.xp / this.state.xpNeeded) * 100, 0, 100)}%`;
  }

  private renderHearts(): void {
    if (!this.state.player) return;
    this.dom.heartContainer.innerHTML = '';
    const totalHearts = Math.ceil(this.state.player.hpMax / HEART_UNIT);
    for (let i = 0; i < totalHearts; i++) {
      const fill = clamp((this.state.player.hp - i * HEART_UNIT) / HEART_UNIT, 0, 1);
      const span = document.createElement('span');
      span.className = 'heart';
      span.style.setProperty('--fill', fill.toString());
      this.dom.heartContainer.appendChild(span);
    }
    const shield = this.state.player.shield || 0;
    if (shield > 0) {
      const shieldHearts = Math.ceil(shield / HEART_UNIT);
      for (let i = 0; i < shieldHearts; i++) {
        const fill = clamp((shield - i * HEART_UNIT) / HEART_UNIT, 0, 1);
        const span = document.createElement('span');
        span.className = 'heart shield';
        span.style.setProperty('--fill', fill.toString());
        this.dom.heartContainer.appendChild(span);
      }
    }
  }

  private renderAmmo(): void {
    const weapon = this.state.weapon;
    if (!weapon) return;
    this.dom.ammoIconsEl.innerHTML = '';
    for (let i = 0; i < weapon.baseMagazine; i++) {
      const bullet = document.createElement('span');
      bullet.className = 'bullet';
      if (i >= weapon.ammo) bullet.classList.add('empty');
      this.dom.ammoIconsEl.appendChild(bullet);
    }
  }

  private gameOver(mode: GameMode | 'victory' | 'defeat', message: string): void {
    if (this.state.mode !== 'playing') return;
    this.state.mode = mode as GameMode;
    pushLog(this.state, this.dom, message);
    this.updateHUD();
    this.render();
    this.dom.restartBtn.classList.add('visible');
    const summary = this.buildRunSummary(mode === 'victory' ? 'victory' : mode === 'defeat' ? 'defeat' : 'abort', message);
    this.state.lastSummary = summary;
    if (this.lifecycle.onGameEnd) {
      this.lifecycle.onGameEnd(summary);
    }
  }

  private buildRunSummary(mode: 'victory' | 'defeat' | 'abort', message: string): GameSummary {
    return {
      mode,
      message,
      time: this.state.time,
      duration: this.state.time,
      kills: this.state.killCount,
      level: this.state.level,
      xp: Math.round(this.state.xp),
      operator: this.state.player ? this.state.player.name : '',
      operatorTid: this.state.currentPreset ? this.state.currentPreset.operatorTid || null : null,
      weapon: this.state.weapon ? this.state.weapon.template.name : null,
      weaponTid: this.state.currentPreset ? this.state.currentPreset.weaponTid || null : null,
      relic: this.state.relic ? this.state.relic.template.name : null,
      relicTid: this.state.currentPreset ? this.state.currentPreset.relicTid || null : null,
      unlockedSkills: Array.from(this.state.unlockedSkills).map(tid => ({ tid, name: this.resolveEntryName(this.state.skillTree, tid) })),
      unlockedSynergies: Array.from(this.state.unlockedSynergies).map(tid => ({ tid, name: this.resolveEntryName(this.state.synergyCards, tid) })),
      log: [...this.state.logs],
      timestamp: Date.now(),
      preset: this.state.currentPreset ? { ...this.state.currentPreset } : null
    };
  }

  private resolveEntryName<T extends { tid: string; name: string }>(list: T[], tid: string): string {
    const entry = findByTid(list, tid);
    return entry ? entry.name : tid;
  }

  private activateRelic(): void {
    if (!this.state.relic || this.state.mode !== 'playing') return;
    if (this.state.relic.cooldownTimer > 0 || this.state.relic.activeTimer > 0) return;
    const template = this.state.relic.template;
    const sanityCost = Math.max(0, (template.sanityDrain ?? 0) - (this.state.stats?.relicSanityReduction ?? 0));
    if (this.state.sanity < sanityCost) {
      pushLog(this.state, this.dom, '理智不足，无法释放遗物');
      return;
    }
    this.state.sanity = Math.max(0, this.state.sanity - sanityCost);
    this.state.relic.cooldownTimer = template.cooldown ?? 0;
    const duration = (template.duration ?? 0) + (this.state.stats?.relicDurationBonus ?? 0);
    this.state.relic.activeTimer = duration;
    const radiusUnits = (template.radius ?? 0) + (this.state.stats?.relicRadiusBonus ?? 0);
    this.state.effects.push(
      new EffectInstance('maelstrom', this.state.player!.x, this.state.player!.y, duration, template.vfxSprite ? this.assets.getImage(template.vfxSprite) : null, radiusUnits * SCALE, 0, {
        damage: 88,
        name: template.name
      })
    );
    pushLog(this.state, this.dom, `释放遗物：${template.name}`);
    if (template.sfxActivate) this.assets.playSound(template.sfxActivate, { volume: 0.9 });
  }
}
