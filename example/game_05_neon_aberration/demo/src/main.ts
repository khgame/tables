import Phaser from 'phaser';

type TablePayload<T> = {
  tids: string[];
  result: Record<string, T>;
};

interface OperatorRecord {
  codename: string;
  archetype: string;
  vitality: number;
  stamina: number;
  focus: number;
  exposureCap: number;
  morale: number;
  traits: string;
  loadoutTags: string;
}

interface EnemyRecord {
  name: string;
  family: string;
  rank: number;
  hp: number;
  damage: number;
  abilities: string;
  inflict: string;
}

interface MapTileRecord {
  name: string;
  biome: string;
  hazards: string;
  spawnTables: string;
}

const HUD_ROOT = document.getElementById('hud');

const WORLD_BOUNDS = new Phaser.Math.Vector2(1600, 900);

function extractFirst<T>(table: TablePayload<T>): T {
  const id = table.tids[0];
  return table.result[id];
}

function extractMany<T>(table: TablePayload<T>): T[] {
  return table.tids.map(id => table.result[id]);
}

class NeonScene extends Phaser.Scene {
  private operator!: OperatorRecord;
  private mapTile!: MapTileRecord;
  private hero!: Phaser.Physics.Arcade.Image;
  private heroSpeed = 200;
  private heroHp = 0;
  private heroHpMax = 0;
  private heroStamina = 0;
  private heroStaminaMax = 0;
  private heroExposure = 0;
  private killCount = 0;
  private hud?: HTMLElement;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private sprintKey!: Phaser.Input.Keyboard.Key;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private lastShot = 0;
  private shotCooldown = 180;
  private enemyPool: EnemyRecord[] = [];
  private nextSpawn = 0;
  private alive = true;

  preload(): void {
    this.load.json('operators', '../operators.json');
    this.load.json('enemies', '../enemies.json');
    this.load.json('map_tiles', '../map_tiles.json');
  }

  create(): void {
    this.hud = HUD_ROOT ?? undefined;

    const operators = this.cache.json.get('operators') as TablePayload<OperatorRecord>;
    const enemies = this.cache.json.get('enemies') as TablePayload<EnemyRecord>;
    const mapTiles = this.cache.json.get('map_tiles') as TablePayload<MapTileRecord>;

    this.operator = extractFirst(operators);
    this.enemyPool = extractMany(enemies).sort((a, b) => a.rank - b.rank);
    this.mapTile = extractFirst(mapTiles);

    this.heroHpMax = Math.round(this.operator.vitality);
    this.heroHp = this.heroHpMax;
    this.heroStaminaMax = Math.round(this.operator.stamina);
    this.heroStamina = this.heroStaminaMax;

    this.setupWorld();
    this.setupInput();
    this.setupGroups();
    this.spawnInitialWave();
    this.nextSpawn = this.time.now + 6500;

    this.events.on('resume', () => {
      this.alive = true;
    });
  }

  update(time: number, delta: number): void {
    if (!this.hero || !this.alive) {
      return;
    }

    this.processMovement(delta);
    this.processShooting(time);
    this.updateEnemiesAI(delta);
    this.recycleBullets();
    this.regenerateStamina(delta);
    this.tickExposure(delta);
    this.updateHud();

    if (time > this.nextSpawn) {
      this.spawnEnemy();
      this.nextSpawn = time + 6500;
    }
  }

  private setupWorld(): void {
    this.physics.world.setBounds(0, 0, WORLD_BOUNDS.x, WORLD_BOUNDS.y);

    this.add.rectangle(WORLD_BOUNDS.x / 2, WORLD_BOUNDS.y / 2, WORLD_BOUNDS.x, WORLD_BOUNDS.y, 0x05070e)
      .setAlpha(0.92);

    const grid = this.add.grid(WORLD_BOUNDS.x / 2, WORLD_BOUNDS.y / 2, WORLD_BOUNDS.x, WORLD_BOUNDS.y, 80, 80, 0x111b2f, 0.15, 0x0f172a, 0.28);
    grid.setBlendMode(Phaser.BlendModes.ADD);

    this.renderHazards();

    this.drawTextures();

    this.hero = this.physics.add.image(WORLD_BOUNDS.x / 2, WORLD_BOUNDS.y / 2, 'hero');
    this.hero.setDamping(true);
    this.hero.setDrag(0.7);
    this.hero.setCollideWorldBounds(true);
    this.hero.setCircle(20);

    this.cameras.main.setBounds(0, 0, WORLD_BOUNDS.x, WORLD_BOUNDS.y);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.2);

    this.add.text(24, 24, `${this.mapTile.name} — ${this.mapTile.biome}`, {
      fontSize: '18px',
      color: '#63a4ff'
    }).setScrollFactor(0);
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    this.sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.input.keyboard.on('keydown-R', () => {
      if (!this.alive) {
        this.scene.restart();
      }
    });
  }

  private setupGroups(): void {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    this.physics.add.overlap(this.hero, this.enemies, this.onPlayerHit, undefined, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, undefined, this);
  }

  private spawnInitialWave(): void {
    for (let i = 0; i < 3; i++) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    if (!this.enemyPool.length) {
      return;
    }

    const spec = Phaser.Utils.Array.GetRandom(this.enemyPool);
    const spawnRadius = 420;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const spawnX = Phaser.Math.Clamp(this.hero.x + Math.cos(angle) * spawnRadius, 80, WORLD_BOUNDS.x - 80);
    const spawnY = Phaser.Math.Clamp(this.hero.y + Math.sin(angle) * spawnRadius, 80, WORLD_BOUNDS.y - 80);

    const enemy = this.physics.add.image(spawnX, spawnY, 'enemy');
    enemy.setDataEnabled();
    enemy.setData('spec', spec);
    enemy.setData('hp', Math.max(30, Math.round(spec.hp / 8)));
    enemy.setData('maxHp', Math.max(30, Math.round(spec.hp / 8)));
    enemy.setData('damage', Math.max(6, Math.round(spec.damage / 3)));
    enemy.setData('nextHit', 0);
    enemy.setCircle(18);
    enemy.setDamping(true);
    enemy.setDrag(0.9);
    enemy.setDepth(2);

    this.enemies.add(enemy);

    const label = this.add.text(enemy.x, enemy.y - 28, spec.name, {
      fontSize: '12px',
      color: '#facc15'
    });
    label.setOrigin(0.5, 1);
    label.setDepth(1);
    label.setData('target', enemy);
    label.setData('spec', spec);

    enemy.setData('label', label);
  }

  private renderHazards(): void {
    if (!this.mapTile.hazards) {
      return;
    }

    const hazards = this.mapTile.hazards.split('|');
    hazards.forEach((hazard, index) => {
      const g = this.add.graphics({ x: 0, y: 0 });
      g.fillStyle(0xa78bfa, 0.12);
      const width = WORLD_BOUNDS.x - 120;
      const height = 80;
      g.fillRoundedRect(60, 120 + index * 110, width, height, 18);
      g.lineStyle(2, 0xa78bfa, 0.4);
      g.strokeRoundedRect(60, 120 + index * 110, width, height, 18);
      g.setScrollFactor(0);
      g.setBlendMode(Phaser.BlendModes.ADD);

      this.add.text(80, 136 + index * 110, `环境危害：${hazard}`, {
        fontSize: '14px',
        color: '#cbd5f5'
      }).setScrollFactor(0);
    });
  }

  private drawTextures(): void {
    const heroGraphics = this.add.graphics();
    heroGraphics.fillStyle(0x63a4ff, 1);
    heroGraphics.fillCircle(22, 22, 22);
    heroGraphics.lineStyle(3, 0xa78bfa, 1);
    heroGraphics.strokeCircle(22, 22, 22);
    heroGraphics.generateTexture('hero', 44, 44);
    heroGraphics.destroy();

    const enemyGraphics = this.add.graphics();
    enemyGraphics.fillStyle(0xf87171, 0.86);
    enemyGraphics.fillCircle(18, 18, 18);
    enemyGraphics.lineStyle(3, 0xfacc15, 0.9);
    enemyGraphics.strokeCircle(18, 18, 18);
    enemyGraphics.generateTexture('enemy', 36, 36);
    enemyGraphics.destroy();

    const bulletGraphics = this.add.graphics();
    bulletGraphics.fillStyle(0x63a4ff, 1);
    bulletGraphics.fillRoundedRect(0, 0, 10, 4, 2);
    bulletGraphics.generateTexture('bullet', 10, 4);
    bulletGraphics.destroy();
  }

  private processMovement(delta: number): void {
    const vector = new Phaser.Math.Vector2();

    if (this.cursors.left.isDown || this.wasd.A.isDown) vector.x -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vector.x += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vector.y -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vector.y += 1;

    const isSprinting = this.sprintKey.isDown && this.heroStamina > 0.5;
    const speedMultiplier = isSprinting ? 1.55 : 1;

    if (vector.lengthSq() > 0) {
      vector.normalize().scale(this.heroSpeed * speedMultiplier);
      this.hero.setVelocity(vector.x, vector.y);
      if (isSprinting) {
        this.heroStamina = Math.max(0, this.heroStamina - delta * 0.25);
      }
    } else {
      this.hero.setVelocity(0, 0);
    }
  }

  private processShooting(time: number): void {
    if (time < this.lastShot + this.shotCooldown) {
      return;
    }

    const pointer = this.input.activePointer;
    if (!pointer.isDown) {
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.hero.x, this.hero.y, pointer.worldX, pointer.worldY);
    const bullet = this.physics.add.image(this.hero.x, this.hero.y, 'bullet');
    bullet.setData('damage', Math.round(18 + this.operator.focus * 0.35));
    bullet.setAngle(Phaser.Math.RadToDeg(angle));
    this.physics.velocityFromRotation(angle, 520, bullet.body.velocity);
    bullet.setDepth(4);
    bullet.setBlendMode(Phaser.BlendModes.ADD);
    this.bullets.add(bullet);

    this.time.delayedCall(1400, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });

    this.heroStamina = Math.max(0, this.heroStamina - 1.2);
    this.lastShot = time;
  }

  private updateEnemiesAI(delta: number): void {
    this.enemies.children.iterate(child => {
      const enemy = child as Phaser.Physics.Arcade.Image;
      if (!enemy.active) {
        return null;
      }

      const spec = enemy.getData('spec') as EnemyRecord;
      const speed = 80 + spec.rank * 12;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.hero.x, this.hero.y);
      this.physics.velocityFromRotation(angle, speed, enemy.body.velocity);

      const label = enemy.getData('label') as Phaser.GameObjects.Text | undefined;
      if (label) {
        label.setPosition(enemy.x, enemy.y - 32);
        const hp = enemy.getData('hp') as number;
        const maxHp = enemy.getData('maxHp') as number;
        label.setText(`${spec.name}\nHP ${Math.max(0, hp)}/${maxHp}`);
      }

      return null;
    });
  }

  private recycleBullets(): void {
    this.bullets.children.each(child => {
      const bullet = child as Phaser.Physics.Arcade.Image;
      if (!bullet.active) {
        return;
      }
      if (
        bullet.x < -50 ||
        bullet.y < -50 ||
        bullet.x > WORLD_BOUNDS.x + 50 ||
        bullet.y > WORLD_BOUNDS.y + 50
      ) {
        bullet.destroy();
      }
    });
  }

  private regenerateStamina(delta: number): void {
    if (this.heroStamina < this.heroStaminaMax) {
      this.heroStamina = Math.min(this.heroStaminaMax, this.heroStamina + delta * 0.18);
    }
  }

  private tickExposure(delta: number): void {
    if (this.heroExposure < this.operator.exposureCap) {
      this.heroExposure = Math.min(this.operator.exposureCap, this.heroExposure + delta * 0.008);
    } else {
      this.heroHp = Math.max(0, this.heroHp - delta * 0.05);
    }

    if (this.heroHp <= 0 && this.alive) {
      this.triggerGameOver('你被异象吞没');
    }
  }

  private updateHud(): void {
    if (!this.hud) {
      return;
    }

    this.hud.innerHTML = `
      <div class="badge">特工 ${this.operator.codename} — ${this.operator.archetype}</div>
      <div class="badge">生命 ${Math.round(this.heroHp)}/${this.heroHpMax}</div>
      <div class="badge">体力 ${Math.round(this.heroStamina)}/${this.heroStaminaMax}</div>
      <div class="badge">暴露 ${Math.round(this.heroExposure)} / ${this.operator.exposureCap}</div>
      <div class="badge">击杀 ${this.killCount}</div>
      <div class="badge">区域 ${this.mapTile.name}</div>
    `;
  }

  private onPlayerHit = (playerObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void => {
    const enemy = enemyObj as Phaser.Physics.Arcade.Image;
    const time = this.time.now;
    const nextHit = enemy.getData('nextHit') as number;

    if (time < nextHit) {
      return;
    }

    const damage = enemy.getData('damage') as number;
    this.heroHp = Math.max(0, this.heroHp - damage);
    this.heroExposure = Math.min(this.operator.exposureCap + 40, this.heroExposure + 5 + damage * 0.2);
    enemy.setData('nextHit', time + 900);

    this.cameras.main.shake(120, 0.004);

    if (this.heroHp <= 0 && this.alive) {
      this.triggerGameOver('Haven Spire 失守');
    }
  };

  private handleBulletHit = (
    bulletObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ): void => {
    const bullet = bulletObj as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as Phaser.Physics.Arcade.Image;

    const damage = bullet.getData('damage') as number;
    bullet.destroy();

    const hp = (enemy.getData('hp') as number) - damage;
    enemy.setData('hp', hp);

    this.addImpactPulse(enemy.x, enemy.y);

    if (hp <= 0) {
      const label = enemy.getData('label') as Phaser.GameObjects.Text | undefined;
      if (label) {
        label.destroy();
      }
      enemy.destroy();
      this.killCount += 1;
      this.heroExposure = Math.max(0, this.heroExposure - 3);
    }
  };

  private addImpactPulse(x: number, y: number): void {
    const ring = this.add.circle(x, y, 6, 0x63a4ff, 0.6);
    ring.setDepth(5);
    this.tweens.add({
      targets: ring,
      radius: 32,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy()
    });
  }

  private triggerGameOver(reason: string): void {
    this.alive = false;
    this.physics.pause();
    this.enemies.children.each(child => {
      const label = (child as Phaser.Physics.Arcade.Image).getData('label') as Phaser.GameObjects.Text | undefined;
      label?.destroy();
    });

    this.add.rectangle(this.hero.x, this.hero.y, 280, 140, 0x0f172a, 0.7)
      .setStrokeStyle(2, 0xf87171)
      .setDepth(50);

    this.add.text(this.hero.x, this.hero.y - 30, '特工倒下', {
      fontSize: '24px',
      color: '#f87171',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(60);

    this.add.text(this.hero.x, this.hero.y + 4, reason, {
      fontSize: '16px',
      color: '#facc15'
    }).setOrigin(0.5).setDepth(60);

    this.add.text(this.hero.x, this.hero.y + 40, '按 R 重新部署', {
      fontSize: '14px',
      color: '#e2e8f0'
    }).setOrigin(0.5).setDepth(60);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#020308',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: NeonScene
});
