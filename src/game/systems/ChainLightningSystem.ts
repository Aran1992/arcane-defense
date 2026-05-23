import { Container, Graphics } from 'pixi.js';
import {
  PLAYER_X,
  PLAYER_Y,
  PLAYER_ATTACK_RANGE,
  CHAIN_LIGHTNING_EXPLODE_RADIUS,
  CHAIN_LIGHTNING_EXPLODE_DAMAGE_RATIO,
} from '../data/constants.ts';
import type { PlayerBuild } from '../PlayerBuild.ts';
import type { Enemy } from '../entities/Enemy.ts';
import { LightningChainVfx } from '../vfx/LightningChainVfx.ts';
import { DamageNumberVfx } from '../vfx/DamageNumberVfx.ts';

/**
 * 闪电链专属雷暴特效：亮蓝色/青色能量环
 */
class LightningExplosionVfx {
  readonly gfx: Graphics;
  private ageMs = 0;
  private readonly durationMs = 250;

  constructor(x: number, y: number, radius: number) {
    this.gfx = new Graphics();
    this.gfx.circle(0, 0, radius);
    this.gfx.stroke({ width: 3, color: 0x00a8ff, alpha: 0.85 });
    this.gfx.circle(0, 0, radius * 0.35);
    this.gfx.fill({ color: 0x00f0ff, alpha: 0.35 });
    this.gfx.x = x;
    this.gfx.y = y;
  }

  tick(dt: number): boolean {
    this.ageMs += dt;
    const t = Math.min(1, this.ageMs / this.durationMs);
    this.gfx.alpha = 1 - t;
    return t < 1;
  }

  destroy(): void {
    this.gfx.destroy();
  }
}

export class ChainLightningSystem {
  private readonly activeVfx: LightningChainVfx[] = [];
  private readonly activeExplosions: LightningExplosionVfx[] = [];
  private readonly activeDamageNumbers: DamageNumberVfx[] = [];

  constructor(
    private readonly projectileLayer: Container,
    private readonly vfxLayer: Container,
    private readonly onEnemyKilled: (enemy: Enemy) => void,
  ) {}

  /**
   * 触发闪电链
   * @returns 成功弹跳的总段数 (首个命中计为 0，每多跳一下加 1)
   */
  triggerChain(build: PlayerBuild, enemies: Enemy[]): number {
    const target = this.findFirstTarget(enemies);
    if (!target) {
      return -1;
    }

    // 1. 首段闪电：从炮塔到首个敌人
    this.spawnChainVfx(PLAYER_X, PLAYER_Y, target.x, target.y);
    this.damageEnemy(target, build.chainDamage);
    target.applySlow(build.chainSlowRatio, build.chainSlowDurationMs);

    const visited = new Set<number>();
    visited.add(target.id);

    let bounceCount = 0;

    if (build.hasChainFork) {
      // 2a. 分叉闪电：首个目标命中后，分裂成 2 条独立的链传导
      const nextTargets = this.findNearestBounces(target, enemies, visited, 2);
      for (const nextTarget of nextTargets) {
        // 创建该分支专属的已访问列表，包含已命中的两个
        const branchVisited = new Set(visited);
        branchVisited.add(nextTarget.id);

        this.spawnChainVfx(target.x, target.y, nextTarget.x, nextTarget.y);
        this.damageEnemy(nextTarget, build.chainDamage);
        nextTarget.applySlow(build.chainSlowRatio, build.chainSlowDurationMs);
        bounceCount++;

        // 递归传导子链
        bounceCount += this.bounce(
          build,
          nextTarget,
          enemies,
          branchVisited,
          build.chainMaxBounces - 2,
        );
      }

      // 如果有分叉但首个怪周围压根没有怪可以分叉，且有爆轰，在首个怪处引发雷暴
      if (nextTargets.length === 0 && build.hasChainExplode) {
        this.explode(build, target, enemies);
      }
    } else {
      // 2b. 单链传导：首个目标递归弹跳
      bounceCount += this.bounce(build, target, enemies, visited, build.chainMaxBounces - 1);
    }

    return bounceCount;
  }

  /**
   * 递归/循环弹跳转向
   */
  private bounce(
    build: PlayerBuild,
    current: Enemy,
    enemies: Enemy[],
    visited: Set<number>,
    remainingBounces: number,
  ): number {
    if (remainingBounces <= 0) {
      if (build.hasChainExplode) {
        this.explode(build, current, enemies);
      }
      return 0;
    }

    const nextTargets = this.findNearestBounces(current, enemies, visited, 1);
    const nextTarget = nextTargets[0];

    if (!nextTarget) {
      // 找不到下一个弹跳目标，提前终止，并触发雷爆
      if (build.hasChainExplode) {
        this.explode(build, current, enemies);
      }
      return 0;
    }

    // 成功进行下一次弹跳
    this.spawnChainVfx(current.x, current.y, nextTarget.x, nextTarget.y);
    this.damageEnemy(nextTarget, build.chainDamage);
    nextTarget.applySlow(build.chainSlowRatio, build.chainSlowDurationMs);
    visited.add(nextTarget.id);

    return 1 + this.bounce(build, nextTarget, enemies, visited, remainingBounces - 1);
  }

  /**
   * 雷击爆轰 (AoE 爆轰)
   */
  private explode(build: PlayerBuild, lastHit: Enemy, enemies: Enemy[]): void {
    const x = lastHit.x;
    const y = lastHit.y;
    const radius = CHAIN_LIGHTNING_EXPLODE_RADIUS;
    const dmg = build.chainDamage * CHAIN_LIGHTNING_EXPLODE_DAMAGE_RATIO;

    this.spawnExplosionVfx(x, y, radius);

    for (const e of enemies) {
      // 炸伤半径内所有敌人 (排除最后命中的受击者本身，因为已经吃了单体伤害，避免重复判定)
      if (!e.alive || e.id === lastHit.id) {
        continue;
      }
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist <= radius + e.radius) {
        this.damageEnemy(e, dmg);
      }
    }
  }

  update(dt: number): void {
    // 1. 更新闪电线条特效
    for (let i = this.activeVfx.length - 1; i >= 0; i--) {
      const vfx = this.activeVfx[i]!;
      if (!vfx.tick(dt)) {
        vfx.destroy();
        this.activeVfx.splice(i, 1);
      }
    }

    // 2. 更新雷暴爆炸特效
    for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
      const vfx = this.activeExplosions[i]!;
      if (!vfx.tick(dt)) {
        vfx.destroy();
        this.activeExplosions.splice(i, 1);
      }
    }

    // 3. 更新伤害飘字特效
    for (let i = this.activeDamageNumbers.length - 1; i >= 0; i--) {
      const vfx = this.activeDamageNumbers[i]!;
      if (!vfx.tick(dt)) {
        vfx.destroy();
        this.activeDamageNumbers.splice(i, 1);
      }
    }
  }

  /**
   * 优先选择射程内最靠近底端城墙的活怪作为闪电链首个目标
   */
  private findFirstTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let maxSubdist = -1; // 距离城墙近意味着 y 坐标更大

    for (const e of enemies) {
      if (!e.alive) {
        continue;
      }
      const dist = Math.hypot(e.x - PLAYER_X, e.y - PLAYER_Y);
      if (dist <= PLAYER_ATTACK_RANGE && e.y > maxSubdist) {
        maxSubdist = e.y;
        best = e;
      }
    }
    return best;
  }

  /**
   * 在全场范围内寻找最近的 N 个未受击的活怪，闪电链弹射不受距离限制
   */
  private findNearestBounces(
    current: Enemy,
    enemies: Enemy[],
    visited: Set<number>,
    limit: number,
  ): Enemy[] {
    const pool = enemies
      .filter((e) => e.alive && !visited.has(e.id))
      .map((e) => {
        const dist = Math.hypot(e.x - current.x, e.y - current.y);
        return { enemy: e, dist };
      })
      .sort((a, b) => a.dist - b.dist);

    return pool.slice(0, limit).map((item) => item.enemy);
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

  private spawnChainVfx(x1: number, y1: number, x2: number, y2: number): void {
    const vfx = new LightningChainVfx(x1, y1, x2, y2);
    this.projectileLayer.addChild(vfx.gfx);
    this.activeVfx.push(vfx);
  }

  private spawnExplosionVfx(x: number, y: number, radius: number): void {
    const vfx = new LightningExplosionVfx(x, y, radius);
    this.vfxLayer.addChild(vfx.gfx);
    this.activeExplosions.push(vfx);
  }

  private showDamageNumber(x: number, y: number, amount: number): void {
    const vfx = new DamageNumberVfx(x, y, amount);
    this.vfxLayer.addChild(vfx.gfx);
    this.activeDamageNumbers.push(vfx);
  }

  clear(): void {
    for (const vfx of this.activeVfx) {
      vfx.destroy();
    }
    this.activeVfx.length = 0;

    for (const vfx of this.activeExplosions) {
      vfx.destroy();
    }
    this.activeExplosions.length = 0;

    for (const vfx of this.activeDamageNumbers) {
      vfx.destroy();
    }
    this.activeDamageNumbers.length = 0;
  }
}
