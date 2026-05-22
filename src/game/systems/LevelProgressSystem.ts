import { getKillsRequiredForLevel } from '../data/waves.ts';

export class LevelProgressSystem {
  level = 1;
  killsThisLevel = 0;

  get killsRequired(): number {
    return getKillsRequiredForLevel(this.level);
  }

  onEnemyKilled(): boolean {
    this.killsThisLevel += 1;
    if (this.killsThisLevel >= this.killsRequired) {
      this.level += 1;
      this.killsThisLevel = 0;
      return true;
    }
    return false;
  }
}
