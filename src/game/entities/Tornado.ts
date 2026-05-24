import { Graphics } from 'pixi.js';

let tornadoIdCounter = 0;

const COLORS = {
  outer: 0x87ceeb,
  mid: 0x87ceeb,
  inner: 0xb0e0e6,
  electric: 0x00f0ff,
};

export class Tornado {
  readonly id = ++tornadoIdCounter;
  readonly gfx: Graphics;
  /** 剩余存在时间 (ms) */
  lifetimeMs: number;
  /** 当前 tick 累积时间 (ms) */
  tickAccum = 0;
  alive = true;

  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public radius: number,
    public durationMs: number,
    public tickDamage: number,
    public slowRatio: number,
    public slowDuration: number,
    public hasSuction: boolean,
    public suctionStrength: number,
    public hasKnockback: boolean,
    public hasElectric: boolean,
  ) {
    this.lifetimeMs = durationMs;
    this.gfx = new Graphics();
    this.draw();
  }

  private _ageOffset = 0;

  draw(): void {
    this.gfx.clear();
    const r = this.radius;

    // 外圈（轻雾）
    this.gfx.circle(0, 0, r);
    this.gfx.fill({ color: COLORS.outer, alpha: 0.1 });
    this.gfx.circle(0, 0, r);
    this.gfx.stroke({ color: COLORS.outer, width: 2, alpha: 0.3 });

    // 中圈（主体）
    this.gfx.circle(0, 0, r * 0.6);
    this.gfx.fill({ color: COLORS.mid, alpha: 0.2 });
    this.gfx.circle(0, 0, r * 0.6);
    this.gfx.stroke({ color: COLORS.mid, width: 1.5, alpha: 0.4 });

    // 内圈（风眼）
    this.gfx.circle(0, 0, r * 0.25);
    this.gfx.fill({ color: COLORS.inner, alpha: 0.5 });

    // 旋转弧线（产生风感）
    this._ageOffset += 0.15;
    for (let i = 0; i < 3; i++) {
      const a0 = this._ageOffset + (i * Math.PI * 2) / 3;
      const a1 = a0 + Math.PI * 0.6;
      this.gfx.arc(0, 0, r * (0.4 + i * 0.15), a0, a1);
      this.gfx.stroke({ color: COLORS.outer, width: 2 - i * 0.5, alpha: 0.4 - i * 0.1 });
    }

    if (this.hasElectric) {
      // 闪电环绕
      this.gfx.circle(0, 0, r + 2);
      this.gfx.stroke({ color: COLORS.electric, width: 1.5, alpha: 0.4 + Math.sin(this._ageOffset * 3) * 0.2 });
    }

    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }

  syncPosition(): void {
    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }
}
