import { Container, Graphics, Text } from 'pixi.js';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  ENEMY_SPEED,
  PLAYER_X,
  PLAYER_Y,
  WALL_Y,
} from './data/constants.ts';
import { applyUpgrade, rollUpgradeChoices, type UpgradeDef } from './data/upgrades.ts';
import type { Enemy } from './entities/Enemy.ts';
import type { GamePhase, GameSnapshot } from './GameState.ts';
import { PlayerBuild } from './PlayerBuild.ts';
import { CombatSystem } from './systems/CombatSystem.ts';
import { LevelProgressSystem } from './systems/LevelProgressSystem.ts';
import { ProjectileSystem } from './systems/ProjectileSystem.ts';
import { WallSystem } from './systems/WallSystem.ts';
import { WaveSpawnSystem } from './systems/WaveSpawnSystem.ts';
import { ChainLightningSystem } from './systems/ChainLightningSystem.ts';

export type GameCallbacks = {
  onPhaseChange: (phase: GamePhase) => void;
  onUpgradeChoices: (choices: UpgradeDef[]) => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
};

export class Game {
  readonly world: Container;
  readonly build = new PlayerBuild();
  readonly enemies: Enemy[] = [];

  private readonly gameplayLayer: Container;
  private readonly enemyLayer: Container;
  private readonly vfxLayer: Container;
  private readonly projectileLayer: Container;
  private readonly waveSpawn: WaveSpawnSystem;
  private readonly levelProgress = new LevelProgressSystem();
  private readonly wall = new WallSystem();
  private readonly projectiles: ProjectileSystem;
  private readonly chainLightning: ChainLightningSystem;
  private readonly combat: CombatSystem;

  phase: GamePhase = 'playing';
  private pendingUpgradeChoices: UpgradeDef[] = [];

  constructor(
    stage: Container,
    private readonly callbacks: GameCallbacks,
  ) {
    this.world = new Container();
    stage.addChild(this.world);

    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    bg.fill({ color: 0x1a1f2e });
    this.world.addChild(bg);

    const clipMask = new Graphics();
    clipMask.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    clipMask.fill({ color: 0xffffff });

    this.gameplayLayer = new Container();
    this.gameplayLayer.mask = clipMask;
    this.world.addChild(this.gameplayLayer);
    this.world.addChild(clipMask);

    this.drawPlayer();
    this.drawWallLine();

    this.enemyLayer = new Container();
    this.vfxLayer = new Container();
    this.projectileLayer = new Container();
    this.gameplayLayer.addChild(this.enemyLayer);
    this.gameplayLayer.addChild(this.vfxLayer);
    this.gameplayLayer.addChild(this.projectileLayer);

    this.waveSpawn = new WaveSpawnSystem(this.enemyLayer);
    this.projectiles = new ProjectileSystem(this.projectileLayer, this.vfxLayer, (e) =>
      this.handleKill(e),
    );
    this.chainLightning = new ChainLightningSystem(this.projectileLayer, this.vfxLayer, (e) =>
      this.handleKill(e),
    );
    this.combat = new CombatSystem(this.projectiles, this.chainLightning);
  }

  private drawWallLine(): void {
    const wall = new Graphics();
    wall.rect(40, WALL_Y, DESIGN_WIDTH - 80, 8);
    wall.fill({ color: 0x7f8c8d });
    this.gameplayLayer.addChild(wall);
  }

  private drawPlayer(): void {
    const p = new Graphics();
    p.circle(0, 0, 22);
    p.fill({ color: 0x2ecc71 });
    p.x = PLAYER_X;
    p.y = PLAYER_Y;
    this.gameplayLayer.addChild(p);

    const label = new Text({
      text: '奥术',
      style: { fill: 0xffffff, fontSize: 14 },
    });
    label.anchor.set(0.5);
    label.x = PLAYER_X;
    label.y = PLAYER_Y - 36;
    this.gameplayLayer.addChild(label);
  }

  getSnapshot(): GameSnapshot {
    return {
      phase: this.phase,
      level: this.levelProgress.level,
      killsThisLevel: this.levelProgress.killsThisLevel,
      killsRequired: this.levelProgress.killsRequired,
      wave: this.waveSpawn.wave,
      wallHp: Math.max(0, this.wall.hp),
      wallMaxHp: this.wall.maxHp,
      enemyCount: this.enemies.filter((e) => e.alive).length,
    };
  }

  private setPhase(phase: GamePhase): void {
    this.phase = phase;
    this.callbacks.onPhaseChange(phase);
    this.emitSnapshot();
  }

  private emitSnapshot(): void {
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  update(dt: number): void {
    if (this.phase === 'gameover' || this.phase === 'victory') {
      return;
    }

    const paused = this.phase === 'upgrade';

    if (!paused) {
      const spawned = this.waveSpawn.update(dt, false);
      this.enemies.push(...spawned);

      for (const enemy of this.enemies) {
        if (!enemy.alive) {
          continue;
        }
        enemy.update(dt);
        enemy.y += (ENEMY_SPEED * enemy.speedScale * dt) / 1000;
        enemy.syncPosition();
      }

      this.wall.update(this.enemies, dt);
      if (this.wall.destroyed) {
        this.setPhase('gameover');
        return;
      }

      this.combat.update(this.build, this.enemies, dt);
      this.projectiles.update(this.build, this.enemies, dt);
      this.chainLightning.update(dt);

      if (this.waveSpawn.isComplete && !this.hasLivingEnemies()) {
        this.setPhase('victory');
        return;
      }
    }

    this.pruneDeadEnemies();
    this.emitSnapshot();
  }

  private handleKill(enemy: Enemy): void {
    const leveled = this.levelProgress.onEnemyKilled();
    if (leveled) {
      this.pendingUpgradeChoices = rollUpgradeChoices(this.build.ranks);
      if (this.pendingUpgradeChoices.length > 0) {
        this.setPhase('upgrade');
        this.callbacks.onUpgradeChoices(this.pendingUpgradeChoices);
      }
    }
    enemy.gfx.tint = 0x555555;
  }

  private hasLivingEnemies(): boolean {
    return this.enemies.some((e) => e.alive);
  }

  private pruneDeadEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      if (e.alive) {
        continue;
      }
      e.gfx.destroy();
      this.enemies.splice(i, 1);
    }
  }

  pickUpgrade(def: UpgradeDef): void {
    if (this.phase !== 'upgrade') {
      return;
    }
    this.build.ranks = applyUpgrade(this.build.ranks, def.id);
    this.setPhase('playing');
    this.pendingUpgradeChoices = [];
  }

  restart(): void {
    for (const e of this.enemies) {
      e.gfx.destroy();
    }
    this.enemies.length = 0;
    this.projectiles.clear();
    this.chainLightning.clear();
    this.build.ranks = {};
    this.levelProgress.level = 1;
    this.levelProgress.killsThisLevel = 0;
    this.wall.hp = this.wall.maxHp;
    this.waveSpawn.reset();
    this.combat.cooldown = 0;
    this.combat.chainCooldown = 0;
    this.combat.clearPendingBursts();
    this.setPhase('playing');
  }
}
