import type { GamePhase, GameSnapshot } from '../game/GameState.ts';

export class Hud {
  private readonly el: HTMLElement;
  private endOverlay: HTMLElement | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    root.appendChild(this.el);
  }

  update(snapshot: GameSnapshot): void {
    this.el.innerHTML = `
      <div class="hud-row">\u6ce2\u6b21 ${snapshot.wave} / 20</div>
      <div class="hud-row">\u7b49\u7ea7 ${snapshot.level}</div>
      <div class="hud-row">\u51fb\u6740 ${snapshot.killsThisLevel} / ${snapshot.killsRequired}</div>
      <div class="hud-row">\u57ce\u5899 ${snapshot.wallHp} / ${snapshot.wallMaxHp}</div>
      <div class="hud-row">\u573a\u4e0a ${snapshot.enemyCount}</div>
    `;
  }

  showEndScreen(phase: GamePhase, onRestart: () => void): void {
    this.hideEndScreen();
    const overlay = document.createElement('div');
    overlay.className = 'end-overlay';
    const title = phase === 'victory' ? '\u80dc\u5229\uff01' : '\u57ce\u5899\u9677\u843d';
    overlay.innerHTML = `
      <div class="end-card">
        <h2>${title}</h2>
        <button type="button" class="btn-restart">\u518d\u6765\u4e00\u5c40</button>
      </div>
    `;
    overlay.querySelector('.btn-restart')?.addEventListener('click', () => {
      this.hideEndScreen();
      onRestart();
    });
    this.el.parentElement?.appendChild(overlay);
    this.endOverlay = overlay;
  }

  hideEndScreen(): void {
    this.endOverlay?.remove();
    this.endOverlay = null;
  }
}
