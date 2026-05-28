import type { GamePhase, GameSnapshot, SkillStatus } from '../game/GameState.ts';

export class Hud {
  private readonly el: HTMLElement;
  private readonly skillsEl: HTMLElement;
  private endOverlay: HTMLElement | null = null;

  constructor(root: HTMLElement, version: string) {
    const versionEl = document.createElement('div');
    versionEl.className = 'version-label';
    versionEl.textContent = version;
    root.appendChild(versionEl);

    this.el = document.createElement('div');
    this.el.className = 'hud';
    root.appendChild(this.el);

    this.skillsEl = document.createElement('div');
    this.skillsEl.className = 'hud-skills';
    root.appendChild(this.skillsEl);
  }

  update(snapshot: GameSnapshot): void {
    const pct = snapshot.killsRequired > 0
      ? Math.min(1, snapshot.killsThisLevel / snapshot.killsRequired)
      : 0;
    this.el.innerHTML = `
      <div class="hud-row">波次 ${snapshot.wave} / 20</div>
      <div class="hud-row">等级 ${snapshot.level}</div>
      <div class="xp-bar-wrap">
        <div class="xp-bar-bg">
          <div class="xp-bar-fill" style="width:${(pct * 100).toFixed(1)}%"></div>
        </div>
        <span class="xp-bar-label">${snapshot.killsThisLevel} / ${snapshot.killsRequired}</span>
      </div>
      <div class="hud-row">城墙 ${snapshot.wallHp} / ${snapshot.wallMaxHp}</div>
      <div class="hud-row">场上 ${snapshot.enemyCount}</div>
    `;
    this.renderSkills(snapshot.skills);
  }

  /** 技能图标映射 */
  private static SKILL_ICON: Record<string, string> = {
    arcane_missile: '🔮',
    chain_lightning: '⚡',
    tornado: '🌪',
  };

  private renderSkills(skills: SkillStatus[]): void {
    if (skills.length === 0) {
      this.skillsEl.innerHTML = '';
      return;
    }

    this.skillsEl.innerHTML = skills
      .map((s) => {
        const icon = Hud.SKILL_ICON[s.id] ?? '?';
        const cdFrac = s.cooldownMax > 0 ? s.cooldownRemaining / s.cooldownMax : 0;
        // 冷却遮罩弧度（conic-gradient 从 12 点顺时针扫光）
        const cdDeg = Math.round(cdFrac * 360);
        const ready = s.ready;
        const cdText = ready ? '' : `${(s.cooldownRemaining / 1000).toFixed(1)}`;

        // 持续释放进度（龙卷风）
        const hasActive = s.activeRemaining !== undefined && s.activeRemaining !== null && s.activeMax && s.activeMax > 0;
        const activeFrac = hasActive ? s.activeRemaining! / s.activeMax! : 0;
        const activeDeg = Math.round(activeFrac * 360);

        return `<div class="skill-icon${ready ? ' is-ready' : ''}${hasActive ? ' is-active' : ''}" data-skill="${s.id}">
          <div class="skill-icon-inner">
            <span class="skill-icon-emoji">${icon}</span>
          </div>
          ${!ready ? `<div class="skill-cd-overlay" style="--cd-deg:${cdDeg}deg"></div>` : ''}
          ${hasActive ? `<div class="skill-active-ring" style="--active-deg:${activeDeg}deg"></div>` : ''}
          ${!ready ? `<span class="skill-cd-text">${cdText}</span>` : ''}
        </div>`;
      })
      .join('');
  }

  showEndScreen(phase: GamePhase, onRestart: () => void): void {
    this.hideEndScreen();
    const overlay = document.createElement('div');
    overlay.className = 'end-overlay';
    const title = phase === 'victory' ? '胜利！' : '城墙陷落';
    overlay.innerHTML = `
      <div class="end-card">
        <h2>${title}</h2>
        <button type="button" class="btn-restart">再来一局</button>
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
