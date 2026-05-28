import {
  ARCANE_MISSILE_SPEED,
  PLAYER_ATTACK_RANGE,
  PLAYER_X,
  PLAYER_Y,
  TORNADO_TRIGGER_ZONE_TOP,
  TORNADO_TRIGGER_ZONE_BOTTOM,
} from '../data/constants.ts';
import type { PlayerBuild } from '../PlayerBuild.ts';
import type { Enemy } from '../entities/Enemy.ts';
import type { ProjectileSystem } from './ProjectileSystem.ts';
import type { ChainLightningSystem } from './ChainLightningSystem.ts';
import type { TornadoSystem } from './TornadoSystem.ts';
import type { SkillStatus } from '../GameState.ts';

interface PendingBurst {
  delayMs: number;
  aimX: number;
  aimY: number;
}

export class CombatSystem {
  cooldown = 0;
  chainCooldown = 0;
  tornadoCooldown = 0;
  private readonly pendingBursts: PendingBurst[] = [];

  constructor(
    private readonly projectiles: ProjectileSystem,
    private readonly chainLightning: ChainLightningSystem,
    private readonly tornadoes: TornadoSystem,
  ) {}

  update(build: PlayerBuild, enemies: Enemy[], dt: number): void {
    this.tickPendingBursts(build, dt);

    // 1. 闪电链 (独立冷却)
    if (build.hasChainLightning) {
      this.chainCooldown -= dt;
      if (this.chainCooldown <= 0) {
        const bounces = this.chainLightning.triggerChain(build, enemies);
        if (bounces >= 0) {
          const baseCd = build.chainCooldownMs;
          const cdReduction = bounces * build.chainSurgeCdReduction;
          this.chainCooldown = Math.max(500, baseCd - cdReduction);
        }
      }
    }

    // 2. 龙卷风 (独立冷却，战场中部触发，在敌人位置生成)
    if (build.hasTornado) {
      this.tornadoCooldown -= dt;
      if (this.tornadoCooldown <= 0) {
        const triggerTarget = this.findTornadoTriggerTarget(enemies);
        if (triggerTarget) {
          // 直接在触发敌人位置生成龙卷风
          this.tornadoes.spawnAt(build, triggerTarget.x, triggerTarget.y);
          this.tornadoCooldown = build.tornadoCooldownMs;
        }
      }
    }

    // 3. 奥术飞弹 (独立冷却)
    if (build.hasArcaneMissile) {
      this.cooldown -= dt;
      if (this.cooldown <= 0) {
        const target = this.findTarget(enemies);
        if (target) {
          const aim = this.leadTarget(target);
          this.fireAttackVolley(build, aim.x, aim.y);
          this.cooldown = build.cooldownMs;
        }
      }
    }
  }

  /** 收集所有可用技能的冷却与状态 */
  getSkillStatuses(build: PlayerBuild, tornadoSys: TornadoSystem): SkillStatus[] {
    const statuses: SkillStatus[] = [];

    if (build.hasArcaneMissile) {
      statuses.push({
        id: 'arcane_missile',
        name: '奥术飞弹',
        cooldownRemaining: Math.max(0, this.cooldown),
        cooldownMax: build.cooldownMs,
        ready: this.cooldown <= 0,
      });
    }

    if (build.hasChainLightning) {
      statuses.push({
        id: 'chain_lightning',
        name: '闪电链',
        cooldownRemaining: Math.max(0, this.chainCooldown),
        cooldownMax: build.chainCooldownMs,
        ready: this.chainCooldown <= 0,
      });
    }

    if (build.hasTornado) {
      const active = tornadoSys.getActiveRemaining();
      statuses.push({
        id: 'tornado',
        name: '龙卷风',
        cooldownRemaining: Math.max(0, this.tornadoCooldown),
        cooldownMax: build.tornadoCooldownMs,
        ready: this.tornadoCooldown <= 0,
        activeRemaining: active?.remainingMs,
        activeMax: active?.maxMs,
      });
    }

    return statuses;
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

  /**
   * 在龙卷风触发区域内寻找最靠近底部的活敌
   * 触发区域为战场中部（TORNADO_TRIGGER_ZONE_TOP ~ TORNADO_TRIGGER_ZONE_BOTTOM）
   */
  private findTornadoTriggerTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestY = -1;
    for (const e of enemies) {
      if (!e.alive) {
        continue;
      }
      if (e.y >= TORNADO_TRIGGER_ZONE_TOP && e.y <= TORNADO_TRIGGER_ZONE_BOTTOM && e.y > bestY) {
        bestY = e.y;
        best = e;
      }
    }
    return best;
  }

  /** 按敌人下移速度预判落点，减少贴脸移动时的脱靶 */
  private leadTarget(target: Enemy): { x: number; y: number } {
    const dx = target.x - PLAYER_X;
    const dy = target.y - PLAYER_Y;
    const dist = Math.hypot(dx, dy) || 1;
    const travelSec = dist / ARCANE_MISSILE_SPEED;
    return {
      x: target.x,
      y: target.y + target.speed * travelSec,
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
