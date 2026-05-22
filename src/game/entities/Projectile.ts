import { Graphics } from 'pixi.js';

let projectileIdCounter = 0;

export class Projectile {
  readonly id = ++projectileIdCounter;
  readonly hitEnemyIds = new Set<number>();
  readonly gfx: Graphics;
  distanceTraveled = 0;

  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public damage: number,
    public radius: number,
    /** 最大累计飞行路程（非时间）；由 PROJECTILE_MAX_RANGE 传入 */
    public maxRange: number,
    public isSplit = false,
    public canPierce = false,
  ) {
    this.gfx = new Graphics();
    this.draw();
  }

  draw(): void {
    this.gfx.clear();
    this.gfx.circle(0, 0, this.radius);
    this.gfx.fill({ color: this.isSplit ? 0x9b59b6 : 0x3498db });
    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }

  syncPosition(): void {
    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }
}
