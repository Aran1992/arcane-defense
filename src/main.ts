import './style.css';
import { GameApp } from './app/GameApp.ts';

async function main(): Promise<void> {
  const appRoot = document.querySelector<HTMLElement>('#app');
  if (!appRoot) {
    throw new Error('#app element not found');
  }
  const gameApp = new GameApp();
  await gameApp.init(appRoot);
}

main().catch((err: unknown) => {
  console.error(err);
});
