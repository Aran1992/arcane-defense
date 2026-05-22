/** �?docs/game/waves.md 一�?*/
export const WAVE_COUNTS: readonly number[] = [
  3, 4, 5, 7, 9, 12, 15, 19, 24, 30, 38, 48, 61, 77, 98, 124, 157, 199, 252, 300,
];

export function getWaveCount(wave: number): number {
  if (wave < 1 || wave > WAVE_COUNTS.length) {
    return 0;
  }
  return WAVE_COUNTS[wave - 1] ?? 0;
}

/** 升级 L �?L+1 所需击杀�?= �?L 波数�?*/
export function getKillsRequiredForLevel(level: number): number {
  return getWaveCount(level);
}
