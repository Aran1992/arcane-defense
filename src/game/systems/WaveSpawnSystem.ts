import { Container } from 'pixi.js';
import {
  DESIGN_WIDTH,
  ENEMY_SPAWN_Y,
  MAX_WAVES,
  WAVE_GAP_MS,
  WAVE_SPAWN_DURATION_MS,
} from '../data/constants.ts';
import { getWaveCount } from '../data/waves.ts';
import { Enemy } from '../entities/Enemy.ts';

type WavePhase = 'spawning' | 'gap' | 'done';

export class WaveSpawnSystem {
  wave = 1;
  phase: WavePhase = 'spawning';
  spawnIndex = 0;
  phaseTimer = 0;
  waveElapsed = 0;

  constructor(private readonly enemyLayer: Container) {}

  get totalWaves(): number {
    return MAX_WAVES;
  }

  get isComplete(): boolean {
    return this.phase === 'done';
  }

  reset(): void {
    this.wave = 1;
    this.phase = 'spawning';
    this.spawnIndex = 0;
    this.phaseTimer = 0;
    this.waveElapsed = 0;
  }

  update(dt: number, paused: boolean): Enemy[] {
    if (paused || this.phase === 'done') {
      return [];
    }

    const spawned: Enemy[] = [];

    if (this.phase === 'spawning') {
      this.waveElapsed += dt;
      const count = getWaveCount(this.wave);
      while (this.spawnIndex < count) {
        const i = this.spawnIndex + 1;
        const spawnAt = (i / count) * WAVE_SPAWN_DURATION_MS;
        if (this.waveElapsed < spawnAt) {
          break;
        }
        const x = 80 + Math.random() * (DESIGN_WIDTH - 160);
        const enemy = new Enemy(x, ENEMY_SPAWN_Y, this.wave);
        this.enemyLayer.addChild(enemy.gfx);
        spawned.push(enemy);
        this.spawnIndex += 1;
      }
      if (this.spawnIndex >= count) {
        this.phase = 'gap';
        this.phaseTimer = 0;
      }
    } else if (this.phase === 'gap') {
      this.phaseTimer += dt;
      if (this.phaseTimer >= WAVE_GAP_MS) {
        if (this.wave >= MAX_WAVES) {
          this.phase = 'done';
        } else {
          this.wave += 1;
          this.phase = 'spawning';
          this.spawnIndex = 0;
          this.waveElapsed = 0;
          this.phaseTimer = 0;
        }
      }
    }

    return spawned;
  }
}
