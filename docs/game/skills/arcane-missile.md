# 奥术飞弹（Arcane Missile）

v1 唯一实战技能。基础为单体伤害弹道；通过三选一强化修饰行为。

## 基础（v1）

| 属性 | 说明                                                 |
| ---- | ---------------------------------------------------- |
| 类型 | 追踪/直线弹道（实现阶段二选一，默认直线向上方敌人）  |
| 命中 | 默认命中路径上**第一个**敌人                         |
| 伤害 | `ARCANE_MISSILE_BASE_DAMAGE`（建议 15）              |
| 射速 | 受 `ARCANE_MISSILE_COOLDOWN_MS` 与 `rapid_fire` 影响 |
| 射程 | `PLAYER_ATTACK_RANGE` 内自动开火                     |

## 强化词条字段说明

| 字段            | 含义                                     |
| --------------- | ---------------------------------------- |
| `id`            | 程序用标识                               |
| `name`          | 选牌显示名（中文）                       |
| `effect`        | 效果描述                                 |
| `maxRank`       | 本局最多选取次数                         |
| `prerequisites` | 须已拥有的词条 id 列表                   |
| `mutexGroup`    | 互斥组；同组只能拥有一种（不含自身叠层） |
| `stackRule`     | 多次选取时的叠加规则                     |

## 互斥组

| mutexGroup   | 成员                | 规则                 |
| ------------ | ------------------- | -------------------- |
| `hit_effect` | `pierce`, `explode` | 只能拥有其中一种机制 |

## 强化全表

| id                   | name         | maxRank | prerequisites      | mutexGroup   | stackRule                                                                                       | v1  |
| -------------------- | ------------ | ------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------- | --- |
| `damage_amp`         | 伤害增幅     | 5       | —                  | —            | 每级基础伤害 +20%                                                                               | 是  |
| `salvo`              | 齐射         | 2       | —                  | —            | 每级额外 +1 发并列弹道（同帧）                                                                  | 是  |
| `rapid_fire`         | 连发         | 2       | —                  | —            | 每级冷却 -15%（乘算）；同 tick 内额外连续 1 轮齐射（1 级共 2 轮、2 级共 3 轮，轮间约 80–100ms） | 是  |
| `pierce`             | 穿透         | 1       | —                  | `hit_effect` | 弹道可命中多个敌人直至射程结束                                                                  | 是  |
| `explode`            | 爆炸         | 1       | —                  | `hit_effect` | 命中时对半径内敌人造成 AoE（见下表）                                                            | 是  |
| `explode_radius`     | 爆炸范围     | 3       | `explode`          | —            | 每级爆炸半径 +25%                                                                               | 是  |
| `explode_damage_amp` | 爆炸伤害增加 | 3       | `explode`          | —            | 每级爆炸伤害 +30%                                                                               | 是  |
| `split`              | 分裂子弹     | 1       | —                  | —            | 命中后生成次级子弹（见下表）                                                                    | 是  |
| `split_count`        | 分裂数量增加 | 3       | `split`            | —            | 每级分裂弹 +1                                                                                   | 是  |
| `split_explode`      | 分裂子弹爆炸 | 1       | `split`, `explode` | —            | 分裂弹命中时也触发爆炸                                                                          | 是  |
| `size_up`            | 体积增大     | 3       | —                  | —            | 每级碰撞盒 +20%，伤害 +10%                                                                      | 是  |

### 爆炸默认数值（实现常量）

| 常量                        | 建议初值            |
| --------------------------- | ------------------- |
| `EXPLODE_BASE_RADIUS`       | 48                  |
| `EXPLODE_BASE_DAMAGE_RATIO` | 0.5（相对直击伤害） |

### 分裂默认数值

| 常量                 | 建议初值 |
| -------------------- | -------- |
| `SPLIT_BASE_COUNT`   | 2        |
| `SPLIT_DAMAGE_RATIO` | 0.4      |
| `SPLIT_ANGLE_SPREAD` | 60°      |

## 机制交互说明

### 齐射 + 连发

- **齐射**：同一冷却 tick 内发射 `1 + salvoRank` 发弹道，扇形或平行偏移。
- **连发**：冷却时间 × `0.85^rapidFireRank`；且每次攻击在极短间隔内再打出 `rapidFireRank` 轮完整齐射（1 级 2 轮、2 级 3 轮，轮间 `RAPID_FIRE_BURST_GAP_MS` / 2 级更短）。
- 叠加顺序：先算连发冷却；每轮攻击先齐射多发，连发则再调度后续轮次齐射。

### 穿透 vs 爆炸

- 互斥：选 `pierce` 后 `explode` 及依赖 `explode` 的词条（`explode_radius`, `explode_damage_amp`, `split_explode`）均不可选。
- 选 `explode` 后不可选 `pierce`。
- `split_explode` 需同时拥有 `split` 与 `explode`（且未选穿透）。

### 分裂链

1. `split`：主弹命中后生成 `SPLIT_BASE_COUNT + split_count` 个次级弹。
2. `split_count`：仅在有 `split` 时可抽。
3. `split_explode`：需 `split` + `explode`；次级弹命中时按爆炸规则结算。

### 体积增大

- 碰撞盒变大，更易命中；直击伤害按 `stackRule` 叠乘。

## 选牌显示文案（示例）

实现 UI 时可引用 `name` + 当前 rank：

- 伤害增幅（2/5）：基础伤害 +40%
- 齐射（1/2）：额外 1 发
- …

## 数据文件

实现时：`src/game/data/upgrades.ts` 导出上表结构；与本文保持同步。

## 相关文档

- [progression.md](../progression.md) — 选牌过滤
- [combat.md](../combat.md) — 射程与城墙
