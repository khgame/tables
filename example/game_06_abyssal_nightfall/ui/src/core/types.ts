export interface ConvertedTable<T> {
  tids: string[];
  result: Record<string, T>;
  collisions?: Array<{ id: string; first: unknown; incoming: unknown }>;
  meta?: {
    idSegments?: number[];
    markCols?: string[];
  };
}

export type TableResource<T> = ConvertedTable<T> | { result?: Record<string, T> };

export interface OperatorRow {
  tid: string;
  codename: string;
  role?: string;
  startWeapon?: string;
  startRelic?: string;
  hp: number;
  moveSpeed: number;
  sanityCap: number;
  reloadBonus?: number;
  critBonus?: number;
  signaturePassive?: string;
  portraitArt?: string;
  sprite?: string;
  spriteScale?: number;
  themeTrack?: string;
}

export type AttackStyle = 'MANUAL' | 'BURST' | 'AUTO' | 'BEAM' | 'CHANNEL' | string;
export type DamageType = 'KINETIC' | 'VOID' | 'FROST' | 'FIRE' | 'LIGHT' | string;

export interface WeaponRow {
  tid: string;
  name: string;
  categoryName?: string;
  attackStyle?: AttackStyle;
  damage?: number;
  damageType?: DamageType;
  fireRate?: number;
  reload?: number;
  magazine?: number;
  spread?: number;
  projectileSpeed?: number;
  maxRange?: number;
  projectileLifetime?: number;
  travelSprite?: string;
  impactSprite?: string;
  muzzleSprite?: string;
  notes?: string;
  fireSfx?: string;
  impactSfx?: string;
  projectileScale?: number;
  impactScale?: number;
}

export interface RelicRow {
  tid: string;
  name: string;
  school?: string;
  activationStyle?: string;
  cooldown?: number;
  duration?: number;
  radius?: number;
  sanityDrain?: number;
  effects?: string;
  vfxSprite?: string;
  icon?: string;
  sfxActivate?: string;
  sfxLoop?: string;
  sfxEnd?: string;
}

export interface EnemyRow {
  tid: string;
  name: string;
  family?: string;
  hp: number;
  moveSpeed: number;
  radius?: number;
  damage?: number;
  sanityDamage?: number;
  attackInterval?: number;
  projectileSpeed?: number;
  projectileLifetime?: number;
  projectileSprite?: string;
  attackStyle?: string;
  lootTable?: string;
  sprite?: string;
  spriteScale?: number;
  deathSprite?: string;
  projectileScale?: number;
  impactSprite?: string;
  attackSfx?: string;
  deathSfx?: string;
  xp?: number;
  notes?: string;
}

export interface BossRow extends EnemyRow {
  phases?: string;
  enragedBonus?: string;
  telegraphSprite?: string;
  themeTrack?: string;
}

export interface WaveRow {
  tid: string;
  timestamp: number;
  duration?: number;
  enemyId: string | number;
  count: number;
  spawnRadius?: number;
  formation?: string;
  notes?: string;
}

export interface SkillNodeRow {
  tid: string;
  name: string;
  branch?: string;
  branchName?: string;
  tier?: number;
  icon?: string;
  effects?: string;
  tooltip?: string;
  requirements?: string;
  parent?: string;
}

export interface SynergyCardRow {
  tid: string;
  name: string;
  tier?: string;
  prerequisites?: string;
  trigger?: string;
  effects?: string;
  icon?: string;
}

export interface GameLibrary {
  operators: OperatorRow[];
  weapons: WeaponRow[];
  relics: RelicRow[];
  enemies: EnemyRow[];
  bosses: BossRow[];
  waves: WaveRow[];
  skillTree: SkillNodeRow[];
  synergyCards: SynergyCardRow[];
}

export interface GamePreset {
  operatorTid?: string | null;
  operatorSlug?: string | null;
  weaponTid?: string | null;
  weaponSlug?: string | null;
  relicTid?: string | null;
  relicSlug?: string | null;
}

export interface LifecycleHooks {
  onGameEnd?: (summary: GameSummary) => void;
  onRestart?: (summary: GameSummary | null, preset?: GamePreset | null) => void;
}

export interface GameSummary {
  mode: 'victory' | 'defeat' | 'abort';
  message: string;
  time: number;
  duration: number;
  kills: number;
  level: number;
  xp: number;
  operator: string;
  operatorTid: string | null;
  weapon: string | null;
  weaponTid: string | null;
  relic: string | null;
  relicTid: string | null;
  unlockedSkills: Array<{ tid: string; name: string }>;
  unlockedSynergies: Array<{ tid: string; name: string }>;
  log: string[];
  timestamp: number;
  preset: GamePreset | null;
}

export interface GameResources {
  operators: TableResource<OperatorRow>;
  weapons: TableResource<WeaponRow>;
  relics: TableResource<RelicRow>;
  enemies: TableResource<EnemyRow>;
  bosses: TableResource<BossRow>;
  waves: TableResource<WaveRow>;
  skillTree: TableResource<SkillNodeRow>;
  synergyCards: TableResource<SynergyCardRow>;
}
