import {
  formatUpgradeChoiceTitle,
  type UpgradeDef,
  type UpgradeRanks,
} from '../game/data/upgrades.ts';

export class UpgradePicker {
  private overlay: HTMLElement | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly onPick: (def: UpgradeDef) => void,
  ) {}

  show(choices: UpgradeDef[], ranks: UpgradeRanks = {}): void {
    this.hide();
    const overlay = document.createElement('motion.div');
    overlay.className = 'upgrade-overlay';
    const card = document.createElement('motion.div');
    card.className = 'upgrade-card';
    const heading = document.createElement('h2');
    heading.textContent = '\u5347\u7ea7\uff01\u9009\u62e9\u4e00\u9879\u5f3a\u5316';
    card.appendChild(heading);

    const list = document.createElement('motion.div');
    list.className = 'upgrade-list';

    for (const def of choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'upgrade-btn';
      const strong = document.createElement('strong');
      strong.textContent = formatUpgradeChoiceTitle(def, ranks);
      const span = document.createElement('span');
      span.textContent = def.description;
      btn.appendChild(strong);
      btn.appendChild(span);
      btn.addEventListener('click', () => {
        this.onPick(def);
        this.hide();
      });
      list.appendChild(btn);
    }

    card.appendChild(list);
    overlay.appendChild(card);
    this.container.appendChild(overlay);
    this.overlay = overlay;
  }

  hide(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}
