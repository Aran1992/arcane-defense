import { Graphics } from 'pixi.js';
import { ENEMY_HP, ENEMY_RADIUS } from '../data/constants.ts';

let enemyIdCounter = 0;

export class Enemy {
  readonly id = ++enemyIdCounter;
  hp = ENEMY_HP;
  wallAttackTimer = 0;
  readonly gfx: Graphics;

  slowRatio = 0;
  slowTimer = 0; // ms

  constructor(
    public x: number,
    public y: number,
  ) {
    this.gfx = new Graphics();
    this.draw();
  }

  get radius(): number {
    return ENEMY_RADIUS;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  applySlow(ratio: number, durationMs: number): void {
    if (ratio > this.slowRatio) {
      this.slowRatio = ratio;
      this.slowTimer = durationMs;
      this.draw();
    } else if (ratio === this.slowRatio) {
      this.slowTimer = Math.max(this.slowTimer, durationMs);
    }
  }

  get speedScale(): number {
    return this.slowTimer > 0 ? 1 - this.slowRatio : 1;
  }

  update(dt: number): void {
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowRatio = 0;
        this.draw();
      } else {
        // 随机重绘电流线，产生电光闪烁特效
        if (Math.random() < 0.2) {
          this.draw();
        }
      }
    }
  }

  draw(): void {
    this.gfx.clear();
    this.gfx.circle(0, 0, ENEMY_RADIUS);
    this.gfx.fill({ color: 0xe74c3c });

    if (this.slowTimer > 0) {
      // 绘制麻痹减速的蓝色光环
      this.gfx.circle(0, 0, ENEMY_RADIUS + 3);
      this.gfx.stroke({ color: 0x3498db, width: 2, alpha: 0.7 });

      // 绘制微小的电弧
      const segments = 4;
      const r = ENEMY_RADIUS + 3;
      const startAngle = Math.random() * Math.PI;
      this.gfx.moveTo(Math.cos(startAngle) * r, Math.sin(startAngle) * r);
      for (let i = 1; i <= segments; i++) {
        const angle = startAngle + (i * Math.PI * 2) / segments;
        const currentR = r + (Math.random() * 4 - 2);
        this.gfx.lineTo(Math.cos(angle) * currentR, Math.sin(angle) * currentR);
      }
      this.gfx.stroke({ color: 0x00f0ff, width: 1.5 });
    }

    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }

  syncPosition(): void {
    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }
}
