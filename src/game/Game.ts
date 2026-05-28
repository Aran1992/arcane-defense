import { Container, Graphics, Text } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PLAYER_X, PLAYER_Y, WALL_Y } from './data/constants.ts';
import { applyUpgrade, rollUpgradeChoices, type UpgradeDef } from './data/upgrades.ts';
import type { Enemy } from './entities/Enemy.ts';
import type { GamePhase, GameSnapshot } from './GameState.ts';
import { PlayerBuild } from './PlayerBuild.ts';
import { CombatSystem } from './systems/CombatSystem.ts';
import { LevelProgressSystem } from './systems/LevelProgressSystem.ts';
import { ProjectileSystem } from './systems/ProjectileSystem.ts';
import { TornadoSystem } from './systems/TornadoSystem.ts';
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
  private readonly tornadoLayer: Container;
  private readonly waveSpawn: WaveSpawnSystem;
  private readonly levelProgress = new LevelProgressSystem();
  private readonly wall = new WallSystem();
  private readonly projectiles: ProjectileSystem;
  private readonly tornadoes: TornadoSystem;
  private readonly chainLightning: ChainLightningSystem;
  private readonly combat: CombatSystem;

  /** 场景内 HUD：波次文字 */
  private readonly waveText: Text;
  /** 场景内 HUD：等级文字 */
  private readonly levelText: Text;
  /** 场景内 HUD：经验条背景 */
  private readonly xpBarBg: Graphics;
  /** 场景内 HUD：经验条填充 */
  private readonly xpBarFill: Graphics;
  /** 场景内 HUD：经验数值文字 */
  private readonly xpLabel: Text;
  /** 场景内 HUD：城墙血量条 */
  private readonly wallHpBar: Graphics;

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
    this.tornadoLayer = new Container();
    this.gameplayLayer.addChild(this.enemyLayer);
    this.gameplayLayer.addChild(this.vfxLayer);
    this.gameplayLayer.addChild(this.projectileLayer);
    this.gameplayLayer.addChild(this.tornadoLayer);

    // 城墙血量条（放在最上层，不被敌人/弹道遮挡）
    this.wallHpBar = new Graphics();
    this.gameplayLayer.addChild(this.wallHpBar);

    // 场景内顶部 HUD（放在 world 但不被 gameplayLayer 裁剪，随场景缩放）
    const textStyle = {
      fontSize: 15,
      fill: 0xe6edf3,
      fontFamily: 'monospace',
      fontWeight: 'bold' as const,
    };

    this.waveText = new Text({ text: '波次 1 / 20', style: textStyle });
    this.waveText.x = 16;
    this.waveText.y = 8;
    this.world.addChild(this.waveText);

    this.levelText = new Text({ text: 'Lv.1', style: { ...textStyle, fill: 0xa78bfa } });
    this.levelText.x = 180;
    this.levelText.y = 8;
    this.world.addChild(this.levelText);

    this.xpBarBg = new Graphics();
    this.xpBarBg.roundRect(16, 30, 210, 12, 6);
    this.xpBarBg.fill({ color: 0x2d333b });
    this.world.addChild(this.xpBarBg);

    this.xpBarFill = new Graphics();
    this.world.addChild(this.xpBarFill);

    this.xpLabel = new Text({
      text: '0 / 0',
      style: { fontSize: 10, fill: 0xd4d4d8, fontFamily: 'monospace' },
    });
    this.xpLabel.x = 230;
    this.xpLabel.y = 30;
    this.world.addChild(this.xpLabel);

    this.waveSpawn = new WaveSpawnSystem(this.enemyLayer);
    this.projectiles = new ProjectileSystem(this.projectileLayer, this.vfxLayer, (e) =>
      this.handleKill(e),
    );
    this.chainLightning = new ChainLightningSystem(this.projectileLayer, this.vfxLayer, (e) =>
      this.handleKill(e),
    );
    this.tornadoes = new TornadoSystem(this.tornadoLayer, this.vfxLayer, (e) =>
      this.handleKill(e),
    );
    this.combat = new CombatSystem(this.projectiles, this.chainLightning, this.tornadoes);
    this.initTestMode();
  }

  private initTestMode(): void {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const testSkill = params.get('testSkill');
      if (testSkill === 'chain') {
        this.build.ranks = { unlock_chain: 1 };
      }
    }
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
      skills: this.combat.getSkillStatuses(this.build, this.tornadoes),
    };
  }

  /** 更新场景内 HUD（波次、等级、经验条、城墙血量） */
  private updateSceneHud(): void {
    const snap = this.getSnapshot();

    // 波次 & 等级
    this.waveText.text = `波次 ${snap.wave} / 20`;
    this.levelText.text = `Lv.${snap.level}`;

    // 经验条
    const pct =
      snap.killsRequired > 0
        ? Math.min(1, snap.killsThisLevel / snap.killsRequired)
        : 0;
    this.xpBarFill.clear();
    if (pct > 0) {
      this.xpBarFill.roundRect(16, 30, 210 * pct, 12, 6);
      this.xpBarFill.fill({ color: 0x8b5cf6 });
    }
    this.xpLabel.text = `${snap.killsThisLevel} / ${snap.killsRequired}`;

    // 城墙血量条（在城墙线上方）
    const wallPct =
      this.wall.maxHp > 0 ? Math.max(0, this.wall.hp / this.wall.maxHp) : 0;
    const barY = WALL_Y - 6;
    const barWidth = DESIGN_WIDTH - 80;
    this.wallHpBar.clear();
    // 背景
    this.wallHpBar.rect(40, barY, barWidth, 5);
    this.wallHpBar.fill({ color: 0x3a1e1e });
    // 填充
    this.wallHpBar.rect(40, barY, barWidth * wallPct, 5);
    const hpColor = wallPct > 0.5 ? 0x2ecc71 : wallPct > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.wallHpBar.fill({ color: hpColor });
  }

  private setPhase(phase: GamePhase): void {
    this.phase = phase;
    this.callbacks.onPhaseChange(phase);
    this.emitSnapshot();
  }

  private emitSnapshot(): void {
    this.updateSceneHud();
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
        enemy.y += (enemy.speed * enemy.speedScale * dt) / 1000;
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
      this.tornadoes.update(this.build, this.enemies, dt);

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
    this.tornadoes.clear();
    this.build.ranks = {};
    this.initTestMode();
    this.levelProgress.level = 1;
    this.levelProgress.killsThisLevel = 0;
    this.wall.hp = this.wall.maxHp;
    this.waveSpawn.reset();
    this.combat.cooldown = 0;
    this.combat.chainCooldown = 0;
    this.combat.tornadoCooldown = 0;
    this.combat.clearPendingBursts();
    this.setPhase('playing');
  }

  triggerUpgrade(): void {
    if (this.phase !== 'playing') {
      return;
    }
    this.levelProgress.level += 1;
    this.levelProgress.killsThisLevel = 0;
    this.pendingUpgradeChoices = rollUpgradeChoices(this.build.ranks);
    if (this.pendingUpgradeChoices.length > 0) {
      this.setPhase('upgrade');
      this.callbacks.onUpgradeChoices(this.pendingUpgradeChoices);
    }
  }

  clearAllEnemies(): void {
    for (const e of this.enemies) {
      if (e.alive) {
        e.hp = 0;
        this.handleKill(e);
      }
    }
    this.pruneDeadEnemies();
    this.emitSnapshot();
  }

  healWall(): void {
    this.wall.hp = this.wall.maxHp;
    this.emitSnapshot();
  }
}
