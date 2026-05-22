import { Text } from 'pixi.js';
import { DAMAGE_FLOAT_DURATION_MS, DAMAGE_FLOAT_RISE_PX } from '../data/constants.ts';

/** 敌人受击伤害飘字：上浮并淡出 */
export class DamageNumberVfx {
  readonly gfx: Text;
  private ageMs = 0;
  private readonly startY: number;

  constructor(x: number, y: number, damage: number) {
    this.gfx = new Text({
      text: String(Math.round(damage)),
      style: {
        fill: 0xfff5a0,
        fontSize: 18,
        fontWeight: 'bold',
        stroke: { color: 0x2c1810, width: 3 },
      },
    });
    this.gfx.anchor.set(0.5);
    this.gfx.x = x;
    this.startY = y - 18;
    this.gfx.y = this.startY;
  }

  /** @returns false when finished and gfx should be destroyed */
  tick(dt: number): boolean {
    this.ageMs += dt;
    const t = Math.min(1, this.ageMs / DAMAGE_FLOAT_DURATION_MS);
    this.gfx.y = this.startY - DAMAGE_FLOAT_RISE_PX * t;
    this.gfx.alpha = 1 - t;
    return t < 1;
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
