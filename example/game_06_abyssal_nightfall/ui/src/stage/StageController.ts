import { AssetManager } from '../core/assets';
import type { GameDom } from '../core/dom';
import type { GameLibrary, WaveRow } from '../core/types';
import { resolveEnemyTemplate } from '../core/library';
import { pushLog } from '../battle/logger';
import type { GameState } from '../battle/state';
import { DEFAULT_ENEMY_RADIUS, SCALE } from '../battle/constants';
import { EnemyUnit } from '../battle/entities';

const WAVE_TIME_SCALE = 0.75;
const WAVE_MIN_DELTA = 1.25; // seconds, keep waves flowing但整体更密集

const EARLY_WAVE_ADJUSTMENTS = [
  {
    maxWave: 1,
    hpScale: 0.55,
    damageScale: 0.5,
    attackIntervalScale: 1.8,
    initialAttackDelay: 1.2,
    projectileSpeedScale: 0.75,
    projectileLifetimeScale: 1.2,
    disableProjectiles: false
  },
  {
    maxWave: 3,
    hpScale: 0.82,
    damageScale: 0.7,
    attackIntervalScale: 1.4,
    initialAttackDelay: 0.6,
    projectileSpeedScale: 0.9,
    projectileLifetimeScale: 1.0,
    disableProjectiles: false
  }
];

export class StageController {
  private missingEnemySpriteLogged = new Set<string>();

  constructor(
    private readonly state: GameState,
    private readonly dom: GameDom,
    private readonly assets: AssetManager
  ) {}

  prepare(library: GameLibrary): void {
    this.state.enemyTemplates = library.enemies;
    this.state.bossTemplates = library.bosses;
    this.state.enemyLookup = new Map(library.enemies.map(enemy => [enemy.tid, enemy]));

    let lastTimestamp = 0;
    this.state.waves = (library.waves || []).map((wave, index) => {
      const scaled = Math.max(0, wave.timestamp * WAVE_TIME_SCALE);
      const timestamp = index === 0 ? scaled : Math.max(scaled, lastTimestamp + WAVE_MIN_DELTA);
      lastTimestamp = timestamp;
      return { ...wave, timestamp };
    });

    this.state.nextWaveIndex = 0;
  }

  update(): void {
    while (
      this.state.nextWaveIndex < this.state.waves.length &&
      this.state.time >= this.state.waves[this.state.nextWaveIndex].timestamp
    ) {
      const wave = this.state.waves[this.state.nextWaveIndex];
      this.spawnWave(wave);
      this.state.nextWaveIndex += 1;
    }
  }

  private spawnWave(wave: WaveRow): void {
    const template = resolveEnemyTemplate(this.state.enemyLookup, wave.enemyId);
    if (!template) {
      const msg = `未找到敌人模板：${wave.enemyId}`;
      console.warn('[abyssal-nightfall]', msg);
      pushLog(this.state, this.dom, msg);
      return;
    }

    const formation = wave.formation || 'ring';
    const enemyRadius = template.radius || DEFAULT_ENEMY_RADIUS;
    const { canvas } = this.dom;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const offscreenDist = Math.max(canvas.width, canvas.height) / 2 + 100;

    const spritePath = template.sprite || null;
    if (!template.sprite) {
      console.warn('[abyssal-nightfall] 敌人未指定 sprite 字段', template.name, template);
    }

    for (let i = 0; i < wave.count; i++) {
      let x = centerX;
      let y = centerY;
      switch (formation) {
        case 'ring': {
          const angle = (Math.PI * 2 * i) / wave.count;
          x = centerX + Math.cos(angle) * offscreenDist;
          y = centerY + Math.sin(angle) * offscreenDist;
          break;
        }
        case 'arc': {
          const startAngle = -Math.PI / 3;
          const arcSpan = (2 * Math.PI) / 3;
          const angle = startAngle + (arcSpan * i) / (wave.count - 1 || 1);
          x = centerX + Math.cos(angle) * offscreenDist;
          y = centerY + Math.sin(angle) * offscreenDist;
          break;
        }
        case 'cone': {
          const baseAngle = Math.PI / 2;
          const spread = Math.PI / 6;
          const angle = baseAngle - spread + (2 * spread * i) / (wave.count - 1 || 1);
          x = centerX + Math.cos(angle) * offscreenDist;
          y = centerY + Math.sin(angle) * offscreenDist;
          break;
        }
        case 'cross': {
          const direction = i % 4;
          const offsetInLine = Math.floor(i / 4) * 60;
          switch (direction) {
            case 0:
              x = centerX + offscreenDist;
              y = centerY + offsetInLine;
              break;
            case 1:
              x = centerX - offscreenDist;
              y = centerY + offsetInLine;
              break;
            case 2:
              x = centerX + offsetInLine;
              y = centerY + offscreenDist;
              break;
            case 3:
              x = centerX + offsetInLine;
              y = centerY - offscreenDist;
              break;
          }
          break;
        }
        case 'swarm': {
          const side = i % 4;
          const offset = (i / wave.count) * (canvas.width * 0.6) - canvas.width * 0.3;
          switch (side) {
            case 0:
              x = centerX + offscreenDist;
              y = centerY + offset;
              break;
            case 1:
              x = centerX - offscreenDist;
              y = centerY + offset;
              break;
            case 2:
              x = centerX + offset;
              y = centerY + offscreenDist;
              break;
            case 3:
              x = centerX + offset;
              y = centerY - offscreenDist;
              break;
          }
          break;
        }
        case 'line': {
          const angle = Math.PI;
          const spacing = 60;
          const lineOffset = (i - wave.count / 2) * spacing;
          x = centerX + Math.cos(angle) * offscreenDist + Math.cos(angle + Math.PI / 2) * lineOffset;
          y = centerY + Math.sin(angle) * offscreenDist + Math.sin(angle + Math.PI / 2) * lineOffset;
          break;
        }
        default: {
          const angle = (Math.PI * 2 * i) / wave.count;
          x = centerX + Math.cos(angle) * offscreenDist;
          y = centerY + Math.sin(angle) * offscreenDist;
        }
      }

      const sprite = spritePath ? this.assets.getImage(spritePath) : null;
      if (!sprite && spritePath && !this.missingEnemySpriteLogged.has(spritePath)) {
        this.missingEnemySpriteLogged.add(spritePath);
        console.warn('[abyssal-nightfall] 等待载入敌人贴图', template.name, spritePath);
        void this.assets.loadImage(spritePath).then(img => {
          if (img) this.missingEnemySpriteLogged.delete(spritePath);
        });
      }

      const enemy = new EnemyUnit(
        template,
        { x, y },
        { radius: enemyRadius, sprite, spritePath, spriteScale: template.spriteScale || 1 }
      );
      enemy.speed = enemy.baseSpeed;
      const waveIndex = this.state.nextWaveIndex;
      const softening = EARLY_WAVE_ADJUSTMENTS.find(config => waveIndex < config.maxWave);
      if (softening) {
        enemy.hp = Math.max(1, Math.round(enemy.hp * softening.hpScale));
        enemy.damage = Math.max(3, Math.round((enemy.damage ?? 6) * softening.damageScale));
        enemy.attackIntervalScale = softening.attackIntervalScale ?? 1;
        enemy.projectileSpeedScale = softening.projectileSpeedScale ?? 1;
        enemy.projectileLifetimeScale = softening.projectileLifetimeScale ?? (enemy.projectileSpeedScale < 1 ? 1 / enemy.projectileSpeedScale : 1);
        enemy.disableProjectiles = Boolean(softening.disableProjectiles);
        enemy.attackTimer += softening.initialAttackDelay ?? 0;
      }
      this.state.enemies.push(enemy);
    }

    pushLog(this.state, this.dom, `波次 ${this.state.nextWaveIndex + 1}: 出现 ${wave.count} 个 ${template.name}`);
  }
}
