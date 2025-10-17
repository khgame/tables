export class GameState {
    constructor() {
        this.mode = 'loading';
        this.time = 0;
        this.lastTime = 0;
        this.nextWaveIndex = 0;
        this.waves = [];
        this.enemies = [];
        this.enemyTemplates = [];
        this.bullets = [];
        this.enemyProjectiles = [];
        this.effects = [];
        this.drops = [];
        this.logs = [];
        this.killCount = 0;
        this.player = null;
        this.weapon = null;
        this.relic = null;
        this.sanityCap = 120;
        this.sanity = 120;
        this.invulnTimer = 0;
        this.stats = null;
        this.meleePulseTimer = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 60;
        this.baseCrit = 0.05;
        this.skillTree = [];
        this.synergyCards = [];
        this.unlockedSkills = new Set();
        this.unlockedSynergies = new Set();
        this.upgradeQueue = [];
        this.library = null;
        this.currentPreset = null;
        this.bossTemplates = [];
        this.enemyLookup = new Map();
        this.runId = 0;
        this.lastSummary = null;
        this.assets = null;
        this.background = null;
        this.backgroundPattern = null;
    }
    resetStats() {
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
            multiShotCount: 1,
            multiShotAngle: 0,
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
    clearTransient() {
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
