import { Graphics } from 'pixi.js';
import { ENEMY_HP, ENEMY_RADIUS } from '../data/constants.ts';

let enemyIdCounter = 0;

export class Enemy {
  readonly id = ++enemyIdCounter;
  hp = ENEMY_HP;
  wallAttackTimer = 0;
  readonly gfx: Graphics;

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

  draw(): void {
    this.gfx.clear();
    this.gfx.circle(0, 0, ENEMY_RADIUS);
    this.gfx.fill({ color: 0xe74c3c });
    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }

  syncPosition(): void {
    this.gfx.x = this.x;
    this.gfx.y = this.y;
  }
}
