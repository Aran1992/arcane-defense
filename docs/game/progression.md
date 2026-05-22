# 成长与三选一

## 等级与击杀配额

- 玩家初始 **等级 L = 1**。
- 从等级 **L** 升到 **L + 1** 所需击杀数 = **第 L 波**敌人数 **`count(L)`**（见 [waves.md](waves.md)）。
- **与当前刷怪波次无关**：正在刷第 5 波时，仍可能按第 2 级配额攒击杀。

### 示例

| 升级    | 本级需击杀 | 依据               |
| ------- | ---------- | ------------------ |
| 1 → 2   | 3          | 第 1 波 count(1)   |
| 2 → 3   | 4          | 第 2 波 count(2)   |
| 3 → 4   | 5          | 第 3 波 count(3)   |
| …       | …          | …                  |
| 19 → 20 | 252        | 第 19 波 count(19) |

理论上单局最多 **19 次**升级选牌（1→20 级）；与是否撑满 20 波刷怪独立。

## 击杀计数规则（v1 已定）

1. **计入对象**：任意波次生成、被玩家击杀的敌人。
2. **计数器**：`killsThisLevel`，从 0 开始。
3. **升级时**：`killsThisLevel >= count(L)` → 等级 +1 → **三选一** → `killsThisLevel = 0`。
4. **不计入**：城墙被敌人「消耗」不算击杀；敌人漏怪未杀不影响升级计数。

## 三选一选牌

### 触发

每次 **升级** 后立即弹出，玩家选 1 张后关闭。

### 选项类型（v1）

| 类型                       | v1                     |
| -------------------------- | ---------------------- |
| 已有技能强化（奥术飞弹池） | **开放**               |
| 新技能                     | **占位**，不出现在池中 |

### 选牌池过滤

从全量强化表（见 [arcane-missile.md](skills/arcane-missile.md)）中剔除不满足条件的词条，再随机抽 **3** 张供选。

剔除条件（满足任一则不可用）：

1. **满级**：该词条已选次数 ≥ `maxRank`。
2. **前置未满足**：`prerequisites` 中任一项未拥有。
3. **互斥**：已拥有与候选同 `mutexGroup` 的另一词条（且非同一 id）。
4. **互斥反向**：候选与已拥有词条互斥（如已有 `explode` 则 `pierce` 不可用）。

### 不足 3 张时

1. 在剩余合法池中重抽，直至 3 张或池耗尽。
2. 若合法池 < 3：展示全部合法项；若为空，跳过选牌（实现时打 log，正常局后期才可能发生）。

### 伪代码

```text
function rollUpgradeChoices(state):
  pool = allUpgrades.filter(u => isEligible(state, u))
  return shuffle(pool).take(3)

function isEligible(state, u):
  if state.rank(u.id) >= u.maxRank: return false
  if not u.prerequisites.every(p => state.has(p)): return false
  if u.mutexGroup and state.hasOtherInGroup(u.mutexGroup, u.id): return false
  return true
```

实现对应：`src/game/data/upgrades.ts` + `LevelProgressSystem`。

## 与波次的关系（再次强调）

| 系统        | 驱动条件                       |
| ----------- | ------------------------------ |
| 下一波刷怪  | 本波出怪结束 + `WAVE_GAP_MS`   |
| 升级 + 选牌 | 本级击杀数 ≥ `count(当前等级)` |

二者**无必然先后**；可连续升级、可场上叠多波怪。

## 相关文档

- [waves.md](waves.md)
- [skills/arcane-missile.md](skills/arcane-missile.md)
- [overview.md](overview.md)
