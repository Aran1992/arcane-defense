import { Container } from 'pixi.js';
import {
  ARCANE_MISSILE_SPEED,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  PLAYER_X,
  PLAYER_Y,
  PROJECTILE_MAX_RANGE,
  SPLIT_ANGLE_SPREAD_DEG,
} from '../data/constants.ts';
import type { PlayerBuild } from '../PlayerBuild.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Projectile } from '../entities/Projectile.ts';
import { DamageNumberVfx } from '../vfx/DamageNumberVfx.ts';
import { ExplosionRingVfx } from '../vfx/ExplosionRingVfx.ts';

const SALVO_SPREAD_RAD = 0.12;

/** 齐射角偏移：奇数对称中心为 0；偶数保证有一发对准目标 */
function salvoAngleOffsets(count: number, spread: number): number[] {
  if (count <= 1) {
    return [0];
  }
  if (count % 2 === 1) {
    const half = (count - 1) / 2;
    return Array.from({ length: count }, (_, i) => (i - half) * spread);
  }
  const centerIndex = count / 2;
  return Array.from({ length: count }, (_, i) => (i - centerIndex) * spread);
}

export class ProjectileSystem {
  readonly projectiles: Projectile[] = [];
  private readonly explosionVfx: ExplosionRingVfx[] = [];
  private readonly damageNumberVfx: DamageNumberVfx[] = [];

  constructor(
    private readonly layer: Container,
    private readonly vfxLayer: Container,
    private readonly onEnemyKilled: (enemy: Enemy) => void,
  ) {}

  fireAt(build: PlayerBuild, aimX: number, aimY: number): void {
    const dx = aimX - PLAYER_X;
    const dy = aimY - PLAYER_Y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = ARCANE_MISSILE_SPEED;
    const vx = (dx / len) * speed;
    const vy = (dy / len) * speed;
    const baseAngle = Math.atan2(vy, vx);
    const offsets = salvoAngleOffsets(build.salvoCount, SALVO_SPREAD_RAD);

    for (const offset of offsets) {
      const angle = baseAngle + offset;
      this.spawn(
        build,
        PLAYER_X,
        PLAYER_Y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        false,
      );
    }
  }

  private spawn(
    build: PlayerBuild,
    x: number,
    y: number,
    vx: number,
    vy: number,
    isSplit: boolean,
  ): void {
    const p = new Projectile(
      x,
      y,
      vx,
      vy,
      isSplit ? build.splitDamage : build.damage,
      build.projectileRadius,
      PROJECTILE_MAX_RANGE,
      isSplit,
      build.hasPierce,
    );
    this.layer.addChild(p.gfx);
    this.projectiles.push(p);
  }

  update(build: PlayerBuild, enemies: Enemy[], dt: number): void {
    this.tickExplosionVfx(dt);
    this.tickDamageNumberVfx(dt);

    const sec = dt / 1000;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]!;
      p.x += p.vx * sec;
      p.y += p.vy * sec;
      p.distanceTraveled += Math.hypot(p.vx * sec, p.vy * sec);
      p.syncPosition();

      // 离开 720×1280 遮罩区域则移除
      if (
        p.x < -p.radius ||
        p.x > DESIGN_WIDTH + p.radius ||
        p.y < -p.radius ||
        p.y > DESIGN_HEIGHT + p.radius
      ) {
        this.removeAt(i);
        continue;
      }

      // 按累计飞行路程移除（非存活时间）；上限见 PROJECTILE_MAX_RANGE
      if (p.distanceTraveled > p.maxRange) {
        this.removeAt(i);
        continue;
      }

      const hit = this.findHit(p, enemies);
      if (hit) {
        this.onHit(build, p, hit, enemies);
        if (!p.canPierce) {
          this.removeAt(i);
        }
      }
    }
  }

  private tickExplosionVfx(dt: number): void {
    for (let i = this.explosionVfx.length - 1; i >= 0; i--) {
      const vfx = this.explosionVfx[i]!;
      if (!vfx.tick(dt)) {
        vfx.destroy();
        this.explosionVfx.splice(i, 1);
      }
    }
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

  private showDamageNumber(x: number, y: number, amount: number): void {
    const vfx = new DamageNumberVfx(x, y, amount);
    this.vfxLayer.addChild(vfx.gfx);
    this.damageNumberVfx.push(vfx);
  }

  private showExplosionRing(x: number, y: number, radius: number): void {
    const vfx = new ExplosionRingVfx(x, y, radius);
    this.vfxLayer.addChild(vfx.gfx);
    this.explosionVfx.push(vfx);
  }

  private findHit(p: Projectile, enemies: Enemy[]): Enemy | null {
    for (const e of enemies) {
      if (!e.alive || p.hitEnemyIds.has(e.id)) {
        continue;
      }
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist <= e.radius + p.radius) {
        return e;
      }
    }
    return null;
  }

  private onHit(build: PlayerBuild, p: Projectile, enemy: Enemy, enemies: Enemy[]): void {
    p.hitEnemyIds.add(enemy.id);
    this.damageEnemy(enemy, p.damage);

    if (build.hasExplode && (!p.isSplit || build.splitExplode)) {
      this.explode(build, p.x, p.y, enemies, p.hitEnemyIds);
    }

    if (!p.isSplit && build.hasSplit) {
      this.spawnSplits(build, p.x, p.y, p.vx, p.vy);
    }
  }

  private explode(
    build: PlayerBuild,
    x: number,
    y: number,
    enemies: Enemy[],
    exclude: Set<number>,
  ): void {
    const r = build.explodeRadius;
    this.showExplosionRing(x, y, r);
    const dmg = build.explodeDamage;
    for (const e of enemies) {
      if (!e.alive || exclude.has(e.id)) {
        continue;
      }
      if (Math.hypot(e.x - x, e.y - y) <= r + e.radius) {
        this.damageEnemy(e, dmg);
      }
    }
  }

  private spawnSplits(build: PlayerBuild, x: number, y: number, vx: number, vy: number): void {
    const baseAngle = Math.atan2(vy, vx);
    const spread = (SPLIT_ANGLE_SPREAD_DEG * Math.PI) / 180;
    const count = build.splitCount;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = baseAngle - spread / 2 + spread * t;
      const speed = Math.hypot(vx, vy);
      this.spawn(build, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, true);
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

  private removeAt(index: number): void {
    const p = this.projectiles[index]!;
    p.gfx.destroy();
    this.projectiles.splice(index, 1);
  }

  clear(): void {
    for (const p of this.projectiles) {
      p.gfx.destroy();
    }
    this.projectiles.length = 0;
    for (const vfx of this.explosionVfx) {
      vfx.destroy();
    }
    this.explosionVfx.length = 0;
    for (const vfx of this.damageNumberVfx) {
      vfx.destroy();
    }
    this.damageNumberVfx.length = 0;
  }
}
