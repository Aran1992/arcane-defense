import {
  ARCANE_MISSILE_BASE_DAMAGE,
  ARCANE_MISSILE_COOLDOWN_MS,
  EXPLODE_BASE_DAMAGE_RATIO,
  EXPLODE_BASE_RADIUS,
  PROJECTILE_RADIUS,
  RAPID_FIRE_BURST_GAP_MS,
  RAPID_FIRE_BURST_GAP_RANK2_MS,
  SPLIT_BASE_COUNT,
  SPLIT_DAMAGE_RATIO,
  CHAIN_LIGHTNING_BASE_DAMAGE,
  CHAIN_LIGHTNING_BASE_BOUNCES,
  CHAIN_LIGHTNING_BASE_SLOW,
  CHAIN_LIGHTNING_BASE_SLOW_DURATION,
  CHAIN_LIGHTNING_BASE_COOLDOWN_MS,
} from './data/constants.ts';
import { getUpgradeRank, type UpgradeRanks } from './data/upgrades.ts';

export class PlayerBuild {
  constructor(public ranks: UpgradeRanks = {}) {}

  get damage(): number {
    const amp = getUpgradeRank(this.ranks, 'damage_amp');
    const size = getUpgradeRank(this.ranks, 'size_up');
    return ARCANE_MISSILE_BASE_DAMAGE * (1 + 0.2 * amp) * (1 + 0.1 * size);
  }

  /** 连发仍叠乘冷却；额外在同 tick 内连续打出多轮齐射 */
  get cooldownMs(): number {
    const rf = getUpgradeRank(this.ranks, 'rapid_fire');
    return ARCANE_MISSILE_COOLDOWN_MS * Math.pow(0.85, rf);
  }

  /** 单次攻击发射的齐射轮数：无连发 1 轮；1 级 2 轮；2 级 3 轮 */
  get rapidFireVolleyCount(): number {
    const rf = getUpgradeRank(this.ranks, 'rapid_fire');
    return rf > 0 ? 1 + rf : 1;
  }

  /** 连发轮与轮之间的间隔（ms） */
  get rapidFireBurstGapMs(): number {
    const rf = getUpgradeRank(this.ranks, 'rapid_fire');
    if (rf <= 0) {
      return 0;
    }
    return rf >= 2 ? RAPID_FIRE_BURST_GAP_RANK2_MS : RAPID_FIRE_BURST_GAP_MS;
  }

  get salvoCount(): number {
    return 1 + getUpgradeRank(this.ranks, 'salvo');
  }

  get projectileRadius(): number {
    const size = getUpgradeRank(this.ranks, 'size_up');
    return PROJECTILE_RADIUS * (1 + 0.2 * size);
  }

  get hasPierce(): boolean {
    return getUpgradeRank(this.ranks, 'pierce') > 0;
  }

  get hasExplode(): boolean {
    return getUpgradeRank(this.ranks, 'explode') > 0;
  }

  get explodeRadius(): number {
    const r = getUpgradeRank(this.ranks, 'explode_radius');
    return EXPLODE_BASE_RADIUS * (1 + 0.25 * r);
  }

  get explodeDamage(): number {
    const amp = getUpgradeRank(this.ranks, 'explode_damage_amp');
    return this.damage * EXPLODE_BASE_DAMAGE_RATIO * (1 + 0.3 * amp);
  }

  get hasSplit(): boolean {
    return getUpgradeRank(this.ranks, 'split') > 0;
  }

  get splitCount(): number {
    return SPLIT_BASE_COUNT + getUpgradeRank(this.ranks, 'split_count');
  }

  get splitDamage(): number {
    return this.damage * SPLIT_DAMAGE_RATIO;
  }

  get splitExplode(): boolean {
    return getUpgradeRank(this.ranks, 'split_explode') > 0;
  }

  // === Chain Lightning Getters ===
  get hasChainLightning(): boolean {
    return getUpgradeRank(this.ranks, 'unlock_chain') > 0;
  }

  get chainDamage(): number {
    const amp = getUpgradeRank(this.ranks, 'chain_damage');
    return CHAIN_LIGHTNING_BASE_DAMAGE * (1 + 0.3 * amp);
  }

  get chainCooldownMs(): number {
    return CHAIN_LIGHTNING_BASE_COOLDOWN_MS;
  }

  get chainMaxBounces(): number {
    const extra = getUpgradeRank(this.ranks, 'chain_bounces');
    return CHAIN_LIGHTNING_BASE_BOUNCES + extra * 2;
  }

  get chainSlowRatio(): number {
    const amp = getUpgradeRank(this.ranks, 'chain_slow');
    return Math.min(0.95, CHAIN_LIGHTNING_BASE_SLOW + amp * 0.15); // 麻痹减速加法叠加，上限 95%
  }

  get chainSlowDurationMs(): number {
    const amp = getUpgradeRank(this.ranks, 'chain_slow');
    return CHAIN_LIGHTNING_BASE_SLOW_DURATION + amp * 500;
  }

  get hasChainFork(): boolean {
    return getUpgradeRank(this.ranks, 'chain_fork') > 0;
  }

  get hasChainExplode(): boolean {
    return getUpgradeRank(this.ranks, 'chain_explode') > 0;
  }

  get chainSurgeCdReduction(): number {
    const amp = getUpgradeRank(this.ranks, 'chain_surge');
    return amp * 150; // 每级 0.15s = 150ms 冷却缩减
  }
}
