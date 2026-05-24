# 龙卷风（Tornado）

v1 第二技能。以持续区域弹道对块状区域的敌人持续造成伤害；移动慢、范围大、伤害累计可观。

## 定位

| 对比       | 奥术飞弹                     | 龙卷风                         |
| ---------- | ---------------------------- | ------------------------------ |
| 伤害方式   | 瞬间单体 / 穿透 / 爆炸       | 持续区域性伤害（DOT 领域）     |
| 弹道速度   | 快                           | 慢                             |
| 范围       | 窄                           | 宽                             |
| 冷却       | 短（基础约 0.6–0.8s）       | 长（基础 5s）                  |
| 持续能力   | 无（即时）                   | 存在时间 3s，期间持续造成伤害  |

## 基础（v1）

| 属性                     | 说明                                                   |
| ------------------------ | ------------------------------------------------------ |
| 类型                     | 持续区域弹道                                           |
| 触发方式                 | 战场中部感应区（y = 300~900），敌人进入后从敌人位置原地生成 |
| 弹道范围                 | 圆形判定区域，半径 `TORNADO_BASE_RADIUS`（建议 48）    |
| 前进速度                 | `TORNADO_SPEED`（建议 60 px/s，约飞弹 1/4）            |
| 移动方向                 | 垂直向上（生成时朝向战场上方）                         |
| 存在时间                 | `TORNADO_BASE_DURATION_MS`（建议 3000）                |
| 伤害频率                 | 每 `TORNADO_TICK_MS`（建议 250ms）对范围内敌人造成伤害 |
| 每 tick 伤害             | `TORNADO_BASE_TICK_DAMAGE`（建议 3）                   |
| 冷却                     | `TORNADO_COOLDOWN_MS`（建议 5000）                     |
| 穿透                     | 天生穿透（持续 AoE，无弹道命中后消失的问题）           |
| 感应范围                 | 战场中部 `TORNADO_TRIGGER_ZONE_TOP` ~ `TORNADO_TRIGGER_ZONE_BOTTOM` |

### 伤害计算公式

```
总伤害 / 龙卷风 = tickDamage × (durationMs / tickMs)
```

基础值：`3 × (3000 / 250) = 36` 总伤（假设敌人在范围满 3 秒）。
对比飞弹基础 15 单发：龙卷风总伤更高但分散到时间上，且敌人可能跑出范围。

## 强化词条

| id                          | name         | maxRank | prerequisites       | mutexGroup       | stackRule                                                               | v1  |
| --------------------------- | ------------ | ------- | ------------------- | ---------------- | ----------------------------------------------------------------------- | --- |
| `tornado_damage`            | 旋风之力     | 5       | —                   | —                | 每级 tick 伤害 +30%                                                     | 是  |
| `tornado_size`              | 疾风领域     | 3       | —                   | —                | 每级判定半径 +20%                                                       | 是  |
| `tornado_duration`          | 暴风眼       | 3       | —                   | —                | 每级存在时间 +1s                                                        | 是  |
| `tornado_suction`           | 风之牵引     | 1       | —                   | `crowd_control`  | 将触碰龙卷风范围内的敌人向中心拉扯                                      | 是  |
| `tornado_suction_strength`  | 牵引增强     | 3       | `tornado_suction`   | —                | 每级拉扯力 +30%                                                         | 是  |
| `tornado_multi`             | 多重旋风     | 2       | —                   | —                | 每级额外 +1 个龙卷风（扇形对称分布，间隔 30°）                          | 是  |
| `tornado_knockback`         | 风之冲击     | 1       | —                   | `crowd_control`  | 龙卷风命中敌人时击退一段距离（建议 30px）                               | 是  |
| `tornado_slow`              | 迟缓之风     | 1       | —                   | —                | 被龙卷风触碰的敌人减速 40%，持续 `SLOW_DURATION_MS`（建议 1500）        | 是  |
| `tornado_slow_strength`     | 深陷泥沼     | 3       | `tornado_slow`      | —                | 每级减速效果 +10%（即 40%→50%→60%）                                     | 是  |
| `tornado_electric`          | 雷霆风暴     | 1       | —                   | —                | 龙卷风每 tick 额外对范围内随机一个敌人造成闪电伤害（直击 1 倍 tick 伤害）| 是  |
| `tornado_electric_chain`    | 闪电链       | 3       | `tornado_electric`  | —                | 每级闪电可额外弹跳 1 次（1 级 2 个 → 3 级 4 个）                       | 否  |

### 互斥组

| mutexGroup      | 成员                                       | 规则                                    |
| --------------- | ------------------------------------------ | --------------------------------------- |
| `crowd_control` | `tornado_suction`, `tornado_knockback`     | 只能拥有其中一种群体控制机制            |

### 默认数值常量

| 常量                         | 建议初值   |
| ---------------------------- | ---------- |
| `TORNADO_BASE_RADIUS`        | 48         |
| `TORNADO_SPEED`              | 60 px/s    |
| `TORNADO_BASE_DURATION_MS`   | 3000       |
| `TORNADO_TICK_MS`            | 250        |
| `TORNADO_BASE_TICK_DAMAGE`   | 3          |
| `TORNADO_COOLDOWN_MS`        | 5000       |
| `SLOW_DURATION_MS`           | 1500       |
| `SLOW_BASE_FACTOR`           | 0.6（-40%）|
| `KNOCKBACK_DISTANCE`         | 30 px      |
| `MULTI_ANGLE_SPREAD`         | 30°        |
| `ELECTRIC_BASE_JUMP_COUNT`   | 1          |

## 机交互说明

### 多重旋风

- 1 级：生成 2 个龙卷风，左右对称间隔 30° 水平散开。
- 2 级：生成 3 个龙卷风，均匀扇形分布（间隔 30°）。
- 每个龙卷风独立计算伤害、存在时间、判定范围。
- 多重旋风 + 暴风眼 → 场上同时存在多个持续区域，覆盖率大幅提升。

### 风之牵引 vs 风之冲击 vs 迟缓之风

- `crowd_control` 互斥组内 `suction` 与 `knockback` 只能选一个。
- `slow` 不属 `crowd_control` 组，可搭配任意技能。
- 牵引使敌人向龙卷风中心聚拢，配合爆炸/范围技能理想。
- 冲击定点击退，适合防推线。
- 迟缓减移速，被动防守。

### 雷霆风暴

- 每个 tick 结算时，额外对范围内随机一名敌人造成一次 `tickDamage * 1` 的闪电伤害。
- `electric` 与 `tornado_damage` 相乘：伤害越高闪电越痛。
- 视觉效果独立（闪电连线），不与飞弹互动。

### 与奥术飞弹互动

- 龙卷风为独立冷却技能，和飞弹各自独立发射。
- 升级时三选一池包含飞弹和龙卷风的全部合法词条（未来扩展）。
- 不存在技能间互斥。

## 实现备注

- 龙卷风在 `ProjectileSystem` 内以特殊类型运行：不设「命中消失」逻辑，改为「存在时间到期消失」。
- 每个 tick 调用 `areaDamage(position, radius) -> Set<Enemy>` 结算伤害。
- 牵引/击退发生在每个伤害 tick 后（建议 `afterDamageHook` 模式）。
- tick 判定不要求高性能空间划分：v1 龙卷风数量上限 ~6 个（3 发 × 2 级多重），同屏敌人数最多 ~300。

## 选牌显示文案（示例）

- 旋风之力（1/5）：tick 伤害 +30%
- 疾风领域（2/3）：判定半径 +40%
- 暴风眼（2/3）：存在时间 +2s
- 风之牵引：将敌人向龙卷风中心拉扯
- 多重旋风（1/2）：额外 +1 个龙卷风
- 迟缓之风：触碰减速 40%

## 数据文件

实现时：扩展 `src/game/data/upgrades.ts` 追加本表条目；与本文保持同步。

## 相关文档

- [arcane-missile.md](arcane-missile.md) — 同步选牌池
- [progression.md](../progression.md) — 选牌过滤逻辑
- [combat.md](../combat.md) — 射程与发射
- [architecture.md](../../dev/architecture.md) — ProjectileSystem 扩展
