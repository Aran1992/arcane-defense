export type GamePhase = 'playing' | 'upgrade' | 'gameover' | 'victory';

export interface GameSnapshot {
  phase: GamePhase;
  level: number;
  killsThisLevel: number;
  killsRequired: number;
  wave: number;
  wallHp: number;
  wallMaxHp: number;
  enemyCount: number;
}
