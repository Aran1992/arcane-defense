import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/arcane-defense/' : '/',
  server: {
    host: true,
  },
  build: {
    target: 'es2022',
  },
}));
