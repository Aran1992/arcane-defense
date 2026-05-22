# arcane-defense（奥术防线）

竖屏肉鸽割草塔防：我方驻守下方城墙，敌人自上方分波刷出；自动施放奥术飞弹，击杀升级后三选一强化，撑过 20 波即胜利。

> **当前阶段**：v1 可玩原型（PixiJS + Vite 已接入）；运行 `npm run dev` 启动。

## 文档地图

| 你想了解…                     | 阅读                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| 核心玩法、胜负、屏幕布局      | [docs/game/overview.md](docs/game/overview.md)                           |
| 20 波数量、出怪节奏、波次切换 | [docs/game/waves.md](docs/game/waves.md)                                 |
| 城墙、自动战斗、敌人行为      | [docs/game/combat.md](docs/game/combat.md)                               |
| 升级、三选一、选牌规则        | [docs/game/progression.md](docs/game/progression.md)                     |
| 奥术飞弹与全部强化词条        | [docs/game/skills/arcane-missile.md](docs/game/skills/arcane-missile.md) |
| 技术栈（PixiJS / Vite / TS）  | [docs/dev/stack.md](docs/dev/stack.md)                                   |
| Prettier / ESLint / 提交门禁  | [docs/dev/tooling.md](docs/dev/tooling.md)                               |
| 预期源码目录与模块边界        | [docs/dev/architecture.md](docs/dev/architecture.md)                     |
| **给 AI 的入口**              | [AGENTS.md](AGENTS.md)                                                   |

完整索引见 [docs/README.md](docs/README.md)。

## 本地开发

```bash
npm install
npm run dev          # 开发服务器 http://localhost:5173
npm run build        # 生产构建
npm run preview      # 预览构建产物
npm run lint         # ESLint
npm run format       # Prettier 格式化
npm run format:check # 检查格式
```

提交前自动执行 Prettier + ESLint（husky + lint-staged）。

工具链约定见 [docs/dev/tooling.md](docs/dev/tooling.md)。

## 给协作者

- 改玩法或数值：**先改 `docs/game/`，再改 `src/`**。
- Cursor 用户：仓库内已配置 [AGENTS.md](AGENTS.md) 与 `.cursor/skills/arcane-defense/`。
