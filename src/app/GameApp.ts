import { Application } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../game/data/constants.ts';
import { Game, type GameCallbacks } from '../game/Game.ts';
import type { GamePhase } from '../game/GameState.ts';
import { Hud } from '../ui/Hud.ts';
import { UpgradePicker } from '../ui/UpgradePicker.ts';

export class GameApp {
  private app!: Application;
  private worldScale = 1;
  private game!: Game;
  private hud!: Hud;
  private picker!: UpgradePicker;

  async init(container: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      background: '#0d1117',
      resizeTo: container,
      antialias: true,
    });
    container.appendChild(this.app.canvas);

    const callbacks: GameCallbacks = {
      onPhaseChange: (phase) => this.onPhaseChange(phase),
      onUpgradeChoices: (choices) => this.picker.show(choices, this.game.build.ranks),
      onSnapshot: (s) => this.hud.update(s),
    };

    this.game = new Game(this.app.stage, callbacks);
    this.layout();

    const hudRoot = document.createElement('div');
    hudRoot.className = 'hud-root';
    container.appendChild(hudRoot);
    this.hud = new Hud(hudRoot);
    this.hud.update(this.game.getSnapshot());

    this.picker = new UpgradePicker(container, (def) => {
      this.game.pickUpgrade(def);
    });

    window.addEventListener('resize', () => this.layout());
    this.app.ticker.add((ticker) => {
      this.game.update(ticker.deltaMS);
    });
  }

  private layout(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.worldScale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
    this.game.world.scale.set(this.worldScale);
    this.game.world.x = (w - DESIGN_WIDTH * this.worldScale) / 2;
    this.game.world.y = (h - DESIGN_HEIGHT * this.worldScale) / 2;
  }

  private onPhaseChange(phase: GamePhase): void {
    if (phase === 'gameover' || phase === 'victory') {
      this.picker.hide();
      this.hud.showEndScreen(phase, () => this.game.restart());
    } else if (phase === 'playing') {
      this.picker.hide();
      this.hud.hideEndScreen();
    }
  }
}
