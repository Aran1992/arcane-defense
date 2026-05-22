import { Graphics } from 'pixi.js';

const TOTAL_LIFETIME_MS = 120;
const FADE_START_MS = 80;

/**
 * 闪电链折线特效。
 * 每次 tick 重新生成折线路径以产生电能闪烁感。
 */
export class LightningChainVfx {
  readonly gfx: Graphics;
  private ageMs = 0;

  constructor(
    private readonly x1: number,
    private readonly y1: number,
    private readonly x2: number,
    private readonly y2: number,
  ) {
    this.gfx = new Graphics();
    this.draw();
  }

  private draw(): void {
    this.gfx.clear();

    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      return;
    }

    // 根据距离动态分配段数，介于 4 到 10 段之间
    const segments = Math.max(4, Math.min(10, Math.floor(dist / 25)));
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;

    const points: { x: number; y: number }[] = [];
    points.push({ x: this.x1, y: this.y1 });

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = this.x1 + dx * t;
      const baseY = this.y1 + dy * t;

      // 垂直偏离距离，在 -12px 到 12px 之间随机抖动
      const offset = Math.random() * 24 - 12;

      points.push({
        x: baseX + Math.cos(perpAngle) * offset,
        y: baseY + Math.sin(perpAngle) * offset,
      });
    }

    points.push({ x: this.x2, y: this.y2 });

    // 1. 绘制宽发光外圈 (深蓝色)
    this.gfx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      this.gfx.lineTo(points[i]!.x, points[i]!.y);
    }
    this.gfx.stroke({ width: 5, color: 0x0055ff, alpha: 0.45 });

    // 2. 绘制亮蓝色中圈
    this.gfx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      this.gfx.lineTo(points[i]!.x, points[i]!.y);
    }
    this.gfx.stroke({ width: 2.5, color: 0x00e0ff, alpha: 0.85 });

    // 3. 绘制亮白色内核
    this.gfx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      this.gfx.lineTo(points[i]!.x, points[i]!.y);
    }
    this.gfx.stroke({ width: 1, color: 0xffffff, alpha: 1.0 });
  }

  /**
   * @returns false when finished and vfx should be destroyed
   */
  tick(dt: number): boolean {
    this.ageMs += dt;
    if (this.ageMs >= TOTAL_LIFETIME_MS) {
      return false;
    }

    // 重新随机生成折线，以获取抖动的电流效果
    this.draw();

    // 最后阶段的淡出逻辑
    if (this.ageMs > FADE_START_MS) {
      const progress = (this.ageMs - FADE_START_MS) / (TOTAL_LIFETIME_MS - FADE_START_MS);
      this.gfx.alpha = 1 - progress;
    } else {
      this.gfx.alpha = 1;
    }

    return true;
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
