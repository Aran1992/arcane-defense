import { Graphics } from 'pixi.js';

const FADE_MS = 250;

/** 爆炸 AoE 半径圈，约 250ms 淡出 */
export class ExplosionRingVfx {
  readonly gfx: Graphics;
  private ageMs = 0;

  constructor(x: number, y: number, radius: number) {
    this.gfx = new Graphics();
    this.gfx.circle(0, 0, radius);
    this.gfx.stroke({ width: 3, color: 0xff8844, alpha: 0.85 });
    this.gfx.circle(0, 0, radius * 0.35);
    this.gfx.fill({ color: 0xffaa66, alpha: 0.35 });
    this.gfx.x = x;
    this.gfx.y = y;
  }

  /** @returns false when finished and gfx should be destroyed */
  tick(dt: number): boolean {
    this.ageMs += dt;
    const t = Math.min(1, this.ageMs / FADE_MS);
    this.gfx.alpha = 1 - t;
    return t < 1;
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
