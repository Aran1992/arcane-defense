import {
  ENEMY_WALL_ATTACK_INTERVAL_MS,
  ENEMY_WALL_DAMAGE,
  WALL_ATTACK_RANGE,
  WALL_MAX_HP,
  WALL_Y,
} from '../data/constants.ts';
import type { Enemy } from '../entities/Enemy.ts';

export class WallSystem {
  hp = WALL_MAX_HP;
  readonly maxHp = WALL_MAX_HP;

  update(enemies: Enemy[], dt: number): void {
    for (const enemy of enemies) {
      if (!enemy.alive) {
        continue;
      }
      if (enemy.y < WALL_Y - WALL_ATTACK_RANGE) {
        continue;
      }
      enemy.wallAttackTimer -= dt;
      if (enemy.wallAttackTimer <= 0) {
        this.hp -= ENEMY_WALL_DAMAGE;
        enemy.wallAttackTimer = ENEMY_WALL_ATTACK_INTERVAL_MS;
      }
    }
  }

  get destroyed(): boolean {
    return this.hp <= 0;
  }
}
