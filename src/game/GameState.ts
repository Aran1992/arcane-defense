export type GamePhase = 'playing' | 'upgrade' | 'gameover' | 'victory';

export interface SkillStatus {
  /** 技能标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 冷却剩余 (ms) */
  cooldownRemaining: number;
  /** 冷却上限 (ms) */
  cooldownMax: number;
  /** 是否就绪（冷却完成） */
  ready: boolean;
  /** 持续释放技能的剩余时间 (ms)，如龙卷风 */
  activeRemaining?: number;
  /** 持续释放技能的最长持续时间 (ms) */
  activeMax?: number;
}

export interface GameSnapshot {
  phase: GamePhase;
  level: number;
  killsThisLevel: number;
  killsRequired: number;
  wave: number;
  wallHp: number;
  wallMaxHp: number;
  enemyCount: number;
  /** 各技能冷却与状态 */
  skills: SkillStatus[];
}
