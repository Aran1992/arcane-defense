---
name: arcane-defense
description: >-
  arcane-defense 竖屏 PixiJS 肉鸽塔防（奥术防线）。实现波次、出怪、升级选牌、奥术飞弹强化、城墙、
  Pixi/Vite 架构或数值时，必须先读 docs/game 与 AGENTS.md。用户提到奥术飞弹、三选一、波次、城墙、穿透、爆炸时使用。
---

# arcane-defense 项目 Skill

## 快速入口

1. 读 [AGENTS.md](../../AGENTS.md)（规则与 v1 范围）
2. 按任务类型打开下表文档

## 文档路由

| 任务                       | 文档                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| 核心循环、胜负、布局       | [docs/game/overview.md](../../docs/game/overview.md)                           |
| 波次表、WAVE_GAP、均匀出怪 | [docs/game/waves.md](../../docs/game/waves.md)                                 |
| 城墙、射程、敌人           | [docs/game/combat.md](../../docs/game/combat.md)                               |
| 升级配额、三选一过滤       | [docs/game/progression.md](../../docs/game/progression.md)                     |
| 强化互斥/前置/maxRank      | [docs/game/skills/arcane-missile.md](../../docs/game/skills/arcane-missile.md) |
| 目录与 System 划分         | [docs/dev/architecture.md](../../docs/dev/architecture.md)                     |
| Prettier/ESLint/husky      | [docs/dev/tooling.md](../../docs/dev/tooling.md)                               |
| Pixi/Vite/TS               | [docs/dev/stack.md](../../docs/dev/stack.md)                                   |

## 不可违反的约定

- 波次推进 **≠** 升级；出怪结束 + `WAVE_GAP_MS` 开下一波；击杀 `count(L)` 升级并重置计数。
- `pierce` 与 `explode` 互斥（`hit_effect` 组）。
- 改玩法先改 `docs/game/`，再改 `src/game/data/`。
- 每次开发完一项功能或开发新功能前，必须开启 subagent 进行审查与规范的 Git 提交。

## 实现检查清单（新功能时）

- [ ] 行为是否已在 docs 定义
- [ ] `waves.ts` / `upgrades.ts` / `constants.ts` 是否与文档一致
- [ ] 提交前 `format` + `lint`（见 tooling.md）
- [ ] 当前功能完成或开始新功能前，通过开启 subagent 进行 Git 提交
