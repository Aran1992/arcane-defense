import type { Game } from '../game/Game.ts';

export class DevPanel {
  private readonly el: HTMLElement;
  private readonly game: Game;

  constructor(root: HTMLElement, game: Game) {
    this.game = game;
    this.el = document.createElement('div');
    this.el.className = 'dev-panel';
    root.appendChild(this.el);
    this.render();
  }

  private render(): void {
    const params = new URLSearchParams(window.location.search);
    const testSkill = params.get('testSkill');

    this.el.innerHTML = `
      <div class="dev-panel-title">🛠️ 开发者沙盒调试</div>
      <div class="dev-section-title">测试模式 (刷新重载)</div>
      <div class="dev-row">
        <button type="button" class="dev-btn btn-mode ${!testSkill ? 'active' : ''}" id="dev-btn-normal">
          正常模式
        </button>
        <button type="button" class="dev-btn btn-mode ${testSkill === 'chain' ? 'active active-chain' : ''}" id="dev-btn-chain">
          ⚡ 闪电链测试
        </button>
        <button type="button" class="dev-btn btn-mode ${testSkill === 'arcane' ? 'active active-arcane' : ''}" id="dev-btn-arcane">
          🎯 飞弹测试
        </button>
      </div>
      <div class="dev-section-title">快捷指令 (即时生效)</div>
      <div class="dev-row">
        <button type="button" class="dev-btn btn-debug" id="dev-btn-upgrade">
          ✨ 立刻升级
        </button>
        <button type="button" class="dev-btn btn-debug" id="dev-btn-clear">
          💥 清理全屏
        </button>
        <button type="button" class="dev-btn btn-debug" id="dev-btn-heal">
          🛡️ 修复城墙
        </button>
      </div>
    `;

    // 绑定事件
    this.el.querySelector('#dev-btn-normal')?.addEventListener('click', () => {
      window.location.href = window.location.origin + window.location.pathname;
    });

    this.el.querySelector('#dev-btn-chain')?.addEventListener('click', () => {
      window.location.href = window.location.origin + window.location.pathname + '?testSkill=chain';
    });

    this.el.querySelector('#dev-btn-arcane')?.addEventListener('click', () => {
      window.location.href =
        window.location.origin + window.location.pathname + '?testSkill=arcane';
    });

    this.el.querySelector('#dev-btn-upgrade')?.addEventListener('click', () => {
      this.game.triggerUpgrade();
    });

    this.el.querySelector('#dev-btn-clear')?.addEventListener('click', () => {
      this.game.clearAllEnemies();
    });

    this.el.querySelector('#dev-btn-heal')?.addEventListener('click', () => {
      this.game.healWall();
    });
  }
}
