import { Container } from 'pixi.js';
import {
  TORNADO_TICK_MS,
  TORNADO_MULTI_ANGLE_SPREAD_DEG,
  TORNADO_KNOCKBACK_DISTANCE,
  ENEMY_SPAWN_Y,
  PLAYER_Y,
} from '../data/constants.ts';
import type { PlayerBuild } from '../PlayerBuild.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Tornado } from '../entities/Tornado.ts';
import { DamageNumberVfx } from '../vfx/DamageNumberVfx.ts';

export class TornadoSystem {
  readonly tornadoes: Tornado[] = [];
  private readonly damageNumberVfx: DamageNumberVfx[] = [];

  constructor(
    private readonly tornadoLayer: Container,
    private readonly vfxLayer: Container,
    private readonly onEnemyKilled: (enemy: Enemy) => void,
  ) {}

  /**
   * 在触发敌人位置生成龙卷风，向上方移动（可多重，水平扇形散开）
   */
  spawnAt(build: PlayerBuild, x: number, y: number): void {
    const speed = build.tornadoSpeed;
    const count = build.tornadoMultiCount;
    const spreadDeg = count > 1 ? TORNADO_MULTI_ANGLE_SPREAD_DEG : 0;
    const spreadRad = (spreadDeg * Math.PI) / 180;

    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spreadRad;
      // 向上方移动，水平方向扇形散开
      const angle = -Math.PI / 2 + offset;
      this.spawn(
        build,
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );
    }
  }

  private spawn(build: PlayerBuild, x: number, y: number, vx: number, vy: number): void {
    const tornado = new Tornado(
      x,
      y,
      vx,
      vy,
      build.tornadoRadius,
      build.tornadoDurationMs,
      build.tornadoTickDamage,
      build.tornadoSlowRatio,
      build.tornadoSlowDurationMs,
      build.tornadoHasSuction,
      build.tornadoSuctionStrength,
      build.tornadoHasKnockback,
      build.tornadoHasElectric,
    );
    this.tornadoLayer.addChild(tornado.gfx);
    this.tornadoes.push(tornado);
  }

  update(build: PlayerBuild, enemies: Enemy[], dt: number): void {
    this.tickDamageNumberVfx(dt);
    const sec = dt / 1000;

    for (let i = this.tornadoes.length - 1; i >= 0; i--) {
      const t = this.tornadoes[i]!;
      if (!t.alive) {
        continue;
      }

      // 1. 移动
      t.x += t.vx * sec;
      t.y += t.vy * sec;
      t.syncPosition();

      // 2. 生命周期递减
      t.lifetimeMs -= dt;
      if (t.lifetimeMs <= 0) {
        this.removeAt(i);
        continue;
      }

      // 3. 超出边界移除
      if (t.y < ENEMY_SPAWN_Y - 100 || t.y > PLAYER_Y + 100 || t.x < -100 || t.x > 900) {
        this.removeAt(i);
        continue;
      }

      // 4. tick 伤害结算
      t.tickAccum += dt;
      if (t.tickAccum >= TORNADO_TICK_MS) {
        t.tickAccum -= TORNADO_TICK_MS;
        this.applyTickDamage(build, t, enemies);
      }

      // 5. 重绘（旋转动画）
      t.draw();
    }
  }

  private applyTickDamage(_build: PlayerBuild, tornado: Tornado, enemies: Enemy[]): void {
    const hitEnemies: Enemy[] = [];

    for (const e of enemies) {
      if (!e.alive) {
        continue;
      }
      const dist = Math.hypot(e.x - tornado.x, e.y - tornado.y);
      const threshold = tornado.radius + e.radius;
      if (dist <= threshold) {
        hitEnemies.push(e);
      }
    }

    if (hitEnemies.length === 0) {
      return;
    }

    // ---- 伤害 ----
    for (const e of hitEnemies) {
      this.damageEnemy(e, tornado.tickDamage);
    }

    // ---- 减速 ----
    if (tornado.slowRatio > 0) {
      for (const e of hitEnemies) {
        e.applySlow(tornado.slowRatio, tornado.slowDuration);
      }
    }

    // ---- 击退 ----
    if (tornado.hasKnockback) {
      for (const e of hitEnemies) {
        const dx = e.x - tornado.x;
        const dy = e.y - tornado.y;
        const len = Math.hypot(dx, dy) || 1;
        e.x += (dx / len) * TORNADO_KNOCKBACK_DISTANCE;
        e.y += (dy / len) * TORNADO_KNOCKBACK_DISTANCE;
        e.syncPosition();
      }
    }

    // ---- 牵引 ----
    if (tornado.hasSuction) {
      const strength = 20 * tornado.suctionStrength;
      for (const e of hitEnemies) {
        const dx = tornado.x - e.x;
        const dy = tornado.y - e.y;
        const len = Math.hypot(dx, dy) || 1;
        e.x += (dx / len) * strength;
        e.y += (dy / len) * strength;
        e.syncPosition();
      }
    }

    // ---- 雷霆风暴 ----
    if (tornado.hasElectric && hitEnemies.length > 0) {
      const electricTarget = hitEnemies[Math.floor(Math.random() * hitEnemies.length)]!;
      this.damageEnemy(electricTarget, tornado.tickDamage);
      // 闪电命中后的视觉反馈：额外伤害飘字已在 damageEnemy 中处理
    }
  }

  private damageEnemy(enemy: Enemy, amount: number): void {
    if (!enemy.alive) {
      return;
    }
    this.showDamageNumber(enemy.x, enemy.y, amount);
    enemy.hp -= amount;
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      this.onEnemyKilled(enemy);
    }
    enemy.draw();
  }

  private showDamageNumber(x: number, y: number, amount: number): void {
    const vfx = new DamageNumberVfx(x, y, amount);
    this.vfxLayer.addChild(vfx.gfx);
    this.damageNumberVfx.push(vfx);
  }

  private tickDamageNumberVfx(dt: number): void {
    for (let i = this.damageNumberVfx.length - 1; i >= 0; i--) {
      const vfx = this.damageNumberVfx[i]!;
      if (!vfx.tick(dt)) {
        vfx.destroy();
        this.damageNumberVfx.splice(i, 1);
      }
    }
  }

  private removeAt(index: number): void {
    const t = this.tornadoes[index]!;
    t.alive = false;
    t.gfx.destroy();
    this.tornadoes.splice(index, 1);
  }

  /** 获取最新生成的龙卷风剩余持续时间（用于 HUD 展示） */
  getActiveRemaining(): { remainingMs: number; maxMs: number } | null {
    if (this.tornadoes.length === 0) {
      return null;
    }
    const newest = this.tornadoes[this.tornadoes.length - 1]!;
    if (!newest.alive) {
      return null;
    }
    return {
      remainingMs: Math.max(0, newest.lifetimeMs),
      maxMs: newest.durationMs,
    };
  }

  clear(): void {
    for (const t of this.tornadoes) {
      t.alive = false;
      t.gfx.destroy();
    }
    this.tornadoes.length = 0;
    for (const vfx of this.damageNumberVfx) {
      vfx.destroy();
    }
    this.damageNumberVfx.length = 0;
  }
}
