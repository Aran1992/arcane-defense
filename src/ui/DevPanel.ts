import type { Game } from '../game/Game.ts';

export class DevPanel {
  private readonly el: HTMLElement;
  private readonly game: Game;
  private collapsed = false;

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
      <div class="dev-panel-header">
        <div class="dev-panel-title">🛠️ 开发者沙盒调试</div>
        <button type="button" class="dev-panel-toggle" id="dev-panel-toggle" aria-label="收起开发者面板">
          ${this.collapsed ? '展开' : '收起'}
        </button>
      </div>
      <div class="dev-panel-body ${this.collapsed ? 'is-collapsed' : ''}">
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
      </div>
    `;

    this.el.querySelector('#dev-panel-toggle')?.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      this.render();
    });

    this.el.querySelector('#dev-btn-normal')?.addEventListener('click', () => {
      this.collapse();
      window.location.href = window.location.origin + window.location.pathname;
    });

    this.el.querySelector('#dev-btn-chain')?.addEventListener('click', () => {
      this.collapse();
      window.location.href = window.location.origin + window.location.pathname + '?testSkill=chain';
    });

    this.el.querySelector('#dev-btn-arcane')?.addEventListener('click', () => {
      this.collapse();
      window.location.href =
        window.location.origin + window.location.pathname + '?testSkill=arcane';
    });

    this.el.querySelector('#dev-btn-upgrade')?.addEventListener('click', () => {
      this.game.triggerUpgrade();
      this.collapse();
    });

    this.el.querySelector('#dev-btn-clear')?.addEventListener('click', () => {
      this.game.clearAllEnemies();
      this.collapse();
    });

    this.el.querySelector('#dev-btn-heal')?.addEventListener('click', () => {
      this.game.healWall();
      this.collapse();
    });
  }

  private collapse(): void {
    if (this.collapsed) {
      return;
    }
    this.collapsed = true;
    this.render();
  }
}
