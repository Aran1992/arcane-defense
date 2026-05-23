# AGENTS.md — arcane-defense AI 指南

本文件是 Cursor / 其它 AI 助手的**项目入口**。实现功能前请先读文档，勿臆造未记录的机制。

## 项目一句话

竖屏 PixiJS 肉鸽塔防：下方城墙 + 自动奥术飞弹，敌人分 20 波自上方刷出；击杀达标升级三选一；城墙被毁失败，撑过 20 波胜利。

## 必读顺序

1. [docs/game/overview.md](docs/game/overview.md) — 核心循环、胜负
2. [docs/game/waves.md](docs/game/waves.md) — 波次表、出怪节奏、波次与升级解耦
3. [docs/game/combat.md](docs/game/combat.md) — 战斗与城墙
4. [docs/game/progression.md](docs/game/progression.md) — 升级、三选一
5. [docs/game/skills/arcane-missile.md](docs/game/skills/arcane-missile.md) — 技能与强化数据表
6. [docs/dev/architecture.md](docs/dev/architecture.md) — 源码布局（实现阶段）

按需阅读：[docs/dev/stack.md](docs/dev/stack.md)、[docs/dev/tooling.md](docs/dev/tooling.md)。

## 硬性规则

1. **文档优先**：`docs/game/` 为玩法与数值的权威来源；`src/game/data/` 须与文档同步。
2. **禁止臆造**：文档未定义的机制、词条、互斥关系不得写入代码。
3. **变更流程**：改玩法 → 更新对应 `docs/game/*.md` → 再改 `src/` → 提交说明引用文档章节。
4. **术语一致**：与用户设计一致——「波次」「升级」「三选一」「奥术飞弹」「城墙」等。
5. **工具链**：实现阶段每次提交前须通过 Prettier 与 ESLint（见 [docs/dev/tooling.md](docs/dev/tooling.md)）。
6. **开发与提交工作流**：每次一项功能开发完成后，或者一项新功能开发前，必须通过开启一个 subagent 的方式对当前的改动进行审查与规范的 Git 提交。完成提交后方可开始新的开发。

## v1 范围清单

| 包含                            | 不包含                     |
| ------------------------------- | -------------------------- |
| 单技能：奥术飞弹 + 文档所列强化 | 其它主动技能（选牌池占位） |
| 20 波、均匀出怪、波次间隔切波   | 元进度 / 存档              |
| 城墙 HP、失败 / 胜利            | 手动施法、移动             |
| 升级触发三选一                  | CI（可选，见 tooling）     |

## 已确认的设计决策（摘要）

- **波次刷新**：每波最后一只生成完毕 → `WAVE_GAP_MS` → 下一波；不要求清场。
- **升级**：与波次无关；从等级 L 升 L+1 需再击杀 `count(L)` 只（第 L 波敌人数）；升级后**重置本级击杀计数**。
- **出怪**：每波总时长 `WAVE_SPAWN_DURATION_MS` 内均匀逐只生成。
- **强化**：互斥组、前置、`maxRank` 以 [arcane-missile.md](docs/game/skills/arcane-missile.md) 为准。

## 问题该查哪份文档

| 问题类型                    | 文档              |
| --------------------------- | ----------------- |
| 赢/输条件、屏幕分区         | overview.md       |
| 第 N 波几只怪、何时刷下一波 | waves.md          |
| 城墙、射程、索敌            | combat.md         |
| 何时升级、选牌怎么过滤      | progression.md    |
| 穿透 vs 爆炸、齐射上限      | arcane-missile.md |
| 目录结构、系统模块          | architecture.md   |

项目 Skill：`.cursor/skills/arcane-defense/SKILL.md`（触发词与速查表）。

## 远程仓库与部署

- **远程仓库**：`https://github.com/Aran1992/arcane-defense.git` (本地已配置带 Token 的 origin，在本地运行 git push 即可无缝推送)
- **手机预览地址**：`https://Aran1992.github.io/arcane-defense/`
- **自动部署**：`.github/workflows/deploy-gh-pages.yml` — push 到 master 后 GitHub Actions 自动构建并部署到 gh-pages，无需手动操作
