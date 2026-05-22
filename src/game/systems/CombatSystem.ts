import {
  ARCANE_MISSILE_SPEED,
  ENEMY_SPEED,
  PLAYER_ATTACK_RANGE,
  PLAYER_X,
  PLAYER_Y,
} from '../data/constants.ts';
import type { PlayerBuild } from '../PlayerBuild.ts';
import type { Enemy } from '../entities/Enemy.ts';
import type { ProjectileSystem } from './ProjectileSystem.ts';

interface PendingBurst {
  delayMs: number;
  aimX: number;
  aimY: number;
}

export class CombatSystem {
  cooldown = 0;
  private readonly pendingBursts: PendingBurst[] = [];

  constructor(private readonly projectiles: ProjectileSystem) {}

  update(build: PlayerBuild, enemies: Enemy[], dt: number): void {
    this.tickPendingBursts(build, dt);

    this.cooldown -= dt;
    if (this.cooldown > 0) {
      return;
    }
    const target = this.findTarget(enemies);
    if (!target) {
      return;
    }
    const aim = this.leadTarget(target);
    this.fireAttackVolley(build, aim.x, aim.y);
    this.cooldown = build.cooldownMs;
  }

  clearPendingBursts(): void {
    this.pendingBursts.length = 0;
  }

  private fireAttackVolley(build: PlayerBuild, aimX: number, aimY: number): void {
    this.projectiles.fireAt(build, aimX, aimY);
    const extraVolleys = build.rapidFireVolleyCount - 1;
    if (extraVolleys <= 0) {
      return;
    }
    const gap = build.rapidFireBurstGapMs;
    for (let i = 1; i <= extraVolleys; i++) {
      this.pendingBursts.push({ delayMs: gap * i, aimX, aimY });
    }
  }

  private tickPendingBursts(build: PlayerBuild, dt: number): void {
    for (let i = this.pendingBursts.length - 1; i >= 0; i--) {
      const burst = this.pendingBursts[i]!;
      burst.delayMs -= dt;
      if (burst.delayMs <= 0) {
        this.projectiles.fireAt(build, burst.aimX, burst.aimY);
        this.pendingBursts.splice(i, 1);
      }
    }
  }

  /** 按敌人下移速度预判落点，减少贴脸移动时的脱靶 */
  private leadTarget(target: Enemy): { x: number; y: number } {
    const dx = target.x - PLAYER_X;
    const dy = target.y - PLAYER_Y;
    const dist = Math.hypot(dx, dy) || 1;
    const travelSec = dist / ARCANE_MISSILE_SPEED;
    return {
      x: target.x,
      y: target.y + ENEMY_SPEED * travelSec,
    };
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) {
        continue;
      }
      const dist = Math.hypot(e.x - PLAYER_X, e.y - PLAYER_Y);
      if (dist <= PLAYER_ATTACK_RANGE && dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    return best;
  }
}
