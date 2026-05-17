import { BULLET_RADIUS } from './constants.js';
export class PlayerUnit {
    constructor(name, x, y, hp, moveSpeed, sprite, spriteScale) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.hpMax = hp;
        this.shield = 0;
        this.shieldMax = 0;
        this.moveSpeed = moveSpeed;
        this.sprite = sprite;
        this.spriteScale = spriteScale;
    }
    applyDamage(amount) {
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
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.hpMax);
    }
    overchargeShield(amount) {
        const nextMax = Math.max(this.shieldMax, amount);
        this.shieldMax = nextMax;
        this.shield = Math.min(this.shield + amount, nextMax);
    }
}
export class WeaponInstance {
    constructor(template, sprites, scale) {
        this.template = template;
        this.fireTimer = 0;
        this.reloadTimer = 0;
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
    constructor(template) {
        this.template = template;
        this.cooldownTimer = 0;
        this.activeTimer = 0;
    }
}
let enemyIdCounter = 0;
export class EnemyUnit {
    constructor(template, position, options) {
        this.template = template;
        this.alive = true;
        this.attackIntervalScale = 1;
        this.projectileSpeedScale = 1;
        this.projectileLifetimeScale = 1;
        this.disableProjectiles = false;
        this.slowAmount = 0;
        this.slowTimer = 0;
        this.hp = template.hp;
        this.x = position.x;
        this.y = position.y;
        this.radius = options.radius;
        this.baseSpeed = (template.moveSpeed ?? 0) * 16;
        this.speed = this.baseSpeed;
        this.attackTimer = template.attackInterval ?? 2.4;
        this.damage = template.damage ?? 8;
        this.sanityDamage = template.sanityDamage ?? 0;
        this.sprite = options.sprite;
        this.spritePath = options.spritePath ?? null;
        this.spriteScale = options.spriteScale ?? 1;
        this.animPhase = Math.random() * Math.PI * 2;
        this.id = `${template.tid}-${enemyIdCounter++}`;
    }
    updateStatus(dt) {
        if (this.slowTimer > 0) {
            this.slowTimer = Math.max(0, this.slowTimer - dt);
            if (this.slowTimer === 0) {
                this.slowAmount = 0;
            }
        }
        const slowFactor = Math.max(0.1, 1 - this.slowAmount);
        this.speed = this.baseSpeed * slowFactor;
    }
    applySlow(amount, duration) {
        if (amount <= 0 || duration <= 0)
            return;
        this.slowAmount = Math.max(this.slowAmount, amount);
        this.slowTimer = Math.max(this.slowTimer, duration);
    }
}
export class Projectile {
    constructor(x, y, vx, vy, life, damage, sprite, scale, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.damage = damage;
        this.sprite = sprite;
        this.scale = scale;
        this.angle = Math.atan2(vy, vx);
        this.pierce = Math.max(0, options.pierce ?? 0);
        this.ricochet = Math.max(0, options.ricochet ?? 0);
        this.radius = Math.max(2, options.radius ?? BULLET_RADIUS);
        this.slowAmount = Math.max(0, options.slowAmount ?? 0);
        this.slowDuration = Math.max(0, options.slowDuration ?? 0);
        this.hitSet = new Set();
        this.extra = {};
    }
}
export class EnemyProjectile {
    constructor(x, y, vx, vy, life, damage, sanity, label, sprite, spritePath, scale) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.damage = damage;
        this.sanity = sanity;
        this.label = label;
        this.sprite = sprite;
        this.spritePath = spritePath;
        this.scale = scale;
        this.elapsed = 0;
    }
}
export class EffectInstance {
    constructor(type, x, y, duration, sprite, scale, angle = 0, extra = {}) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.duration = duration;
        this.sprite = sprite;
        this.scale = scale;
        this.angle = angle;
        this.extra = extra;
        this.elapsed = 0;
        this.detonated = false;
        this.frameCount = 1;
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.updateFrameInfo();
    }
    updateFrameInfo() {
        if (!this.sprite)
            return;
        if (this.frameWidth && this.frameHeight)
            return;
        const width = this.sprite.width;
        const height = this.sprite.height || width;
        if (!width || !height)
            return;
        const horizontalRatio = width / height;
        const verticalRatio = height / width;
        const H_THRESHOLD = 1.2;
        if (horizontalRatio > H_THRESHOLD) {
            const frames = Math.max(1, Math.round(horizontalRatio));
            this.frameCount = frames;
            this.frameWidth = Math.max(1, Math.floor(width / frames));
            this.frameHeight = height;
        }
        else if (verticalRatio > H_THRESHOLD) {
            const frames = Math.max(1, Math.round(verticalRatio));
            this.frameCount = frames;
            this.frameWidth = width;
            this.frameHeight = Math.max(1, Math.floor(height / frames));
        }
        else {
            this.frameCount = 1;
            this.frameWidth = width;
            this.frameHeight = height;
        }
    }
}
export class LootDrop {
    constructor(id, type, amount, x, y, sprite, spritePath, sfx, life) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.spritePath = spritePath;
        this.sfx = sfx;
        this.life = life;
        this.elapsed = 0;
        this.bob = Math.random() * Math.PI * 2;
    }
}
