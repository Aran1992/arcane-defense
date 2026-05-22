import { Graphics } from 'pixi.js';
import { ENEMY_RADIUS } from '../data/constants.ts';

let enemyIdCounter = 0;

export class Enemy {
  readonly id = ++enemyIdCounter;
  hp: number;
  maxHp: number;
  speed: number;
  wallAttackTimer = 0;
  readonly gfx: Graphics;

  slowRatio = 0;
  slowTimer = 0; // ms

  constructor(
    public x: number,
    public y: number,
    public wave: number = 1,
  ) {
    // 动态计算该波次下敌人的最大生命值与速度属性
    this.maxHp = wave === 1 ? 15 : Math.round(15 * Math.pow(1.25, wave - 1));
    this.hp = this.maxHp;
    this.speed = 65 + 2 * (wave - 1);

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

    // 绘制敌人本体红色圆球
    this.gfx.circle(0, 0, ENEMY_RADIUS);
    this.gfx.fill({ color: 0xe74c3c });

    // 仅在受到伤害时绘制简约现代血条以提升品质与视觉反馈
    if (this.hp < this.maxHp) {
      const barWidth = ENEMY_RADIUS * 2;
      const barHeight = 3;
      const barY = -ENEMY_RADIUS - 8; // 位于怪头顶上方

      // 绘制深灰暗红色底槽
      this.gfx.rect(-barWidth / 2, barY, barWidth, barHeight);
      this.gfx.fill({ color: 0x3e1815 });

      // 绘制亮绿生命条
      const ratio = Math.max(0, this.hp / this.maxHp);
      this.gfx.rect(-barWidth / 2, barY, barWidth * ratio, barHeight);
      this.gfx.fill({ color: 0x2ecc71 });
    }

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
