import type {
  BossRow,
  EnemyRow,
  GameLibrary,
  GamePreset,
  GameSummary,
  RelicRow,
  SkillNodeRow,
  SynergyCardRow,
  WaveRow
} from '../core/types';
import type { AssetManager } from '../core/assets';
import type {
  EffectInstance,
  EnemyProjectile,
  EnemyUnit,
  LootDrop,
  PlayerUnit,
  Projectile,
  RelicInstance,
  WeaponInstance
} from './entities';

export type GameMode = 'loading' | 'playing' | 'levelup' | 'victory' | 'defeat' | 'abort' | 'idle';

export interface PendingUpgradeJob {
  reason: 'level' | 'synergy';
}

export interface GameStats {
  damageFlat: number;
  fireRateMultiplier: number;
  reloadMultiplier: number;
  spreadMultiplier: number;
  projectileSpeedBonus: number;
  projectileSplit: number;
  projectileSplitAngle: number;
  projectileSizeBonus: number;
  projectilePierce: number;
  projectileRicochet: number;
  projectileRicochetRadius: number;
  critBonus: number;
  critDamageBonus: number;
  sanityRegen: number;
  relicSanityReduction: number;
  relicRadiusBonus: number;
  relicDurationBonus: number;
  pullStrength: number;
  damageBonusMultiplier: number;
  relicDamageFlat: number;
  beamReflect: number;
  maelstromSlow: number;
  hpRegen: number;
  shieldRegen: number;
  moveSpeedBonus: number;
  invulnTimeBonus: number;
  luckBonus: number;
  ammoEfficiency: number;
  xpBonus: number;
  elementalSlow: number;
  elementalSlowDuration: number;
  meleePulseDamage: number;
  meleePulseRadius: number;
  meleePulseInterval: number;
  contactDamageResist: number;
}

export class GameState {
  mode: GameMode = 'loading';
  time = 0;
  lastTime = 0;
  nextWaveIndex = 0;
  waves: WaveRow[] = [];
  enemies: EnemyUnit[] = [];
  enemyTemplates: EnemyRow[] = [];
  bullets: Projectile[] = [];
  enemyProjectiles: EnemyProjectile[] = [];
  effects: EffectInstance[] = [];
  drops: LootDrop[] = [];
  logs: string[] = [];
  killCount = 0;
  player: PlayerUnit | null = null;
  weapon: WeaponInstance | null = null;
  relic: RelicInstance | null = null;
  sanityCap = 120;
  sanity = 120;
  invulnTimer = 0;
  stats: GameStats | null = null;
  meleePulseTimer = 0;
  level = 1;
  xp = 0;
  xpNeeded = 60;
  baseCrit = 0.05;
  skillTree: SkillNodeRow[] = [];
  synergyCards: SynergyCardRow[] = [];
  unlockedSkills = new Set<string>();
  unlockedSynergies = new Set<string>();
  upgradeQueue: PendingUpgradeJob[] = [];
  library: GameLibrary | null = null;
  currentPreset: GamePreset | null = null;
  bossTemplates: BossRow[] = [];
  enemyLookup = new Map<string, EnemyRow>();
  runId = 0;
  lastSummary: GameSummary | null = null;
  assets: AssetManager | null = null;
  background: HTMLImageElement | null = null;
  backgroundPattern: CanvasPattern | null = null;

  resetStats(): void {
    this.stats = {
      damageFlat: 0,
      fireRateMultiplier: 1,
      reloadMultiplier: 1,
      spreadMultiplier: 1,
      projectileSpeedBonus: 0,
      projectileSplit: 0,
      projectileSplitAngle: 10,
      projectileSizeBonus: 0,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileRicochetRadius: 160,
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
      maelstromSlow: 0,
      hpRegen: 0,
      shieldRegen: 0,
      moveSpeedBonus: 0,
      invulnTimeBonus: 0,
      luckBonus: 0,
      ammoEfficiency: 0,
      xpBonus: 0,
      elementalSlow: 0,
      elementalSlowDuration: 0,
      meleePulseDamage: 0,
      meleePulseRadius: 80,
      meleePulseInterval: 1.8,
      contactDamageResist: 0
    };
    this.meleePulseTimer = 0;
  }

  clearTransient(): void {
    this.enemies = [];
    this.bullets = [];
    this.enemyProjectiles = [];
    this.effects = [];
    this.drops = [];
    this.logs = [];
    this.killCount = 0;
    this.invulnTimer = 0;
    this.lastSummary = null;
  }
}
