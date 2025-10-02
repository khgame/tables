import type { EnemyRow, RelicRow, WeaponRow } from '../core/types';

export class PlayerUnit {
  public hp: number;
  public hpMax: number;
  public shield: number;
  public shieldMax: number;
  public sprite: HTMLImageElement | null;
  public spriteScale: number;

  constructor(
    public readonly name: string,
    public x: number,
    public y: number,
    hp: number,
    moveSpeed: number,
    sprite: HTMLImageElement | null,
    spriteScale: number
  ) {
    this.hp = hp;
    this.hpMax = hp;
    this.shield = 0;
    this.shieldMax = 0;
    this.moveSpeed = moveSpeed;
    this.sprite = sprite;
    this.spriteScale = spriteScale;
  }

  public moveSpeed: number;

  applyDamage(amount: number): { remaining: number; absorbed: number } {
    let remaining = amount;
    let absorbed = 0;
    if (this.shield > 0) {
      const use = Math.min(this.shield, remaining);
      this.shield -= use;
      absorbed = use;
      remaining -= use;
    }
    if (remaining > 0) {
      this.hp = Math.max(0, this.hp - remaining);
    }
    return { remaining, absorbed };
  }

  heal(amount: number): void {
    this.hp = Math.min(this.hp + amount, this.hpMax);
  }

  overchargeShield(amount: number): void {
    const nextMax = Math.max(this.shieldMax, amount);
    this.shieldMax = nextMax;
    this.shield = Math.min(this.shield + amount, nextMax);
  }
}

export class WeaponInstance {
  public baseDamage: number;
  public baseFireRate: number;
  public baseReload: number;
  public baseMagazine: number;
  public baseSpread: number;
  public baseProjectileSpeed: number;
  public ammo: number;
  public fireTimer = 0;
  public reloadTimer = 0;
  public travelSprite: HTMLImageElement | null;
  public impactSprite: HTMLImageElement | null;
  public muzzleSprite: HTMLImageElement | null;
  public projectileScale: number;
  public impactScale: number;
  public fireSfx: string | null;
  public impactSfx: string | null;

  constructor(
    public readonly template: WeaponRow,
    sprites: {
      travel: HTMLImageElement | null;
      impact: HTMLImageElement | null;
      muzzle: HTMLImageElement | null;
    },
    scale: { projectile: number; impact: number }
  ) {
    this.baseDamage = template.damage ?? 0;
    this.baseFireRate = template.fireRate ?? 0.6;
    this.baseReload = template.reload ?? 2.4;
    this.baseMagazine = template.magazine ?? 6;
    this.baseSpread = template.spread ?? 0;
    this.baseProjectileSpeed = template.projectileSpeed ?? 42;
    this.ammo = this.baseMagazine;
    this.travelSprite = sprites.travel;
    this.impactSprite = sprites.impact;
    this.muzzleSprite = sprites.muzzle;
    this.projectileScale = scale.projectile;
    this.impactScale = scale.impact;
    this.fireSfx = template.fireSfx ?? null;
    this.impactSfx = template.impactSfx ?? null;
  }
}

export class RelicInstance {
  public cooldownTimer = 0;
  public activeTimer = 0;

  constructor(public readonly template: RelicRow) {}
}

export class EnemyUnit {
  public hp: number;
  public x: number;
  public y: number;
  public radius: number;
  public speed: number;
  public attackTimer: number;
  public damage: number;
  public sanityDamage: number;
  public sprite: HTMLImageElement | null;
  public spritePath?: string | null;
  public spriteScale: number;
  public animPhase: number;
  public alive = true;
  public attackIntervalScale = 1;
  public projectileSpeedScale = 1;
  public disableProjectiles = false;

  constructor(
    public readonly template: EnemyRow,
    position: { x: number; y: number },
    options: {
      radius: number;
      sprite: HTMLImageElement | null;
      spritePath?: string | null;
      spriteScale?: number;
    }
  ) {
    this.hp = template.hp;
    this.x = position.x;
    this.y = position.y;
    this.radius = options.radius;
    this.speed = (template.moveSpeed ?? 0) * 16;
    this.attackTimer = template.attackInterval ?? 2.4;
    this.damage = template.damage ?? 8;
    this.sanityDamage = template.sanityDamage ?? 0;
    this.sprite = options.sprite;
    this.spritePath = options.spritePath ?? null;
    this.spriteScale = options.spriteScale ?? 1;
    this.animPhase = Math.random() * Math.PI * 2;
  }
}

export class Projectile {
  public angle: number;
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public life: number,
    public damage: number,
    public sprite: HTMLImageElement | null,
    public scale: number
  ) {
    this.angle = Math.atan2(vy, vx);
  }
}

export class EnemyProjectile {
  public elapsed = 0;
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public life: number,
    public damage: number,
    public sanity: number,
    public label: string | null,
    public sprite: HTMLImageElement | null,
    public spritePath: string | null,
    public scale: number
  ) {}
}

export type EffectType = 'muzzle' | 'impact' | 'maelstrom' | 'shield' | 'telegraph';

export class EffectInstance {
  public elapsed = 0;
  public detonated = false;
  public frameCount = 1;
  public frameWidth = 0;
  public frameHeight = 0;
  constructor(
    public readonly type: EffectType,
    public x: number,
    public y: number,
    public duration: number,
    public sprite: HTMLImageElement | null,
    public scale: number,
    public angle = 0,
    public extra: Record<string, unknown> = {}
  ) {
    this.updateFrameInfo();
  }

  updateFrameInfo(): void {
    if (!this.sprite) return;
    if (this.frameWidth && this.frameHeight) return;
    const width = this.sprite.width;
    const height = this.sprite.height || width;
    if (!width || !height) return;
    if (width > height) {
      const frames = Math.max(1, Math.floor(width / height));
      this.frameCount = frames;
      this.frameWidth = Math.floor(width / frames);
      this.frameHeight = height;
    } else {
      this.frameCount = 1;
      this.frameWidth = width;
      this.frameHeight = height;
    }
  }
}

export type DropType = 'sanity' | 'hp' | 'shield' | 'xp' | 'ammo' | 'relic_charge';

export class LootDrop {
  public elapsed = 0;
  public bob = Math.random() * Math.PI * 2;
  constructor(
    public readonly id: string,
    public readonly type: DropType,
    public amount: number,
    public x: number,
    public y: number,
    public sprite: HTMLImageElement | null,
    public spritePath: string | null,
    public sfx: string | null,
    public life: number
  ) {}
}
