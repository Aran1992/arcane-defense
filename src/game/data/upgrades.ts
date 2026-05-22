/** Sync with docs/game/skills/*.md */

export type UpgradeId =
  | 'damage_amp'
  | 'salvo'
  | 'rapid_fire'
  | 'pierce'
  | 'explode'
  | 'explode_radius'
  | 'explode_damage_amp'
  | 'split'
  | 'split_count'
  | 'split_explode'
  | 'size_up'
  // Chain Lightning
  | 'unlock_chain'
  | 'chain_damage'
  | 'chain_bounces'
  | 'chain_slow'
  | 'chain_fork'
  | 'chain_explode'
  | 'chain_surge';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  maxRank: number;
  prerequisites: UpgradeId[];
  mutexGroup?: string;
  description: string;
}

export const UPGRADE_DEFS: readonly UpgradeDef[] = [
  {
    id: 'damage_amp',
    name: '\u4f24\u5bb3\u589e\u5e45',
    maxRank: 5,
    prerequisites: [],
    description: '每级基础伤害 +20%',
  },
  {
    id: 'salvo',
    name: '\u9f50\u5c04',
    maxRank: 2,
    prerequisites: [],
    description: '每级额外 +1 发并列弹道（同帧）',
  },
  {
    id: 'rapid_fire',
    name: '\u8fde\u53d1',
    maxRank: 2,
    prerequisites: [],
    description: '每级冷却 -15%，同次攻击额外连续一轮齐射',
  },
  {
    id: 'pierce',
    name: '\u7a7f\u900f',
    maxRank: 1,
    prerequisites: [],
    mutexGroup: 'hit_effect',
    description: '弹道可命中多个敌人直至射程结束',
  },
  {
    id: 'explode',
    name: '\u7206\u70b8',
    maxRank: 1,
    prerequisites: [],
    mutexGroup: 'hit_effect',
    description: '命中时对半径内敌人造成范围伤害',
  },
  {
    id: 'explode_radius',
    name: '\u7206\u70b8\u8303\u56f4',
    maxRank: 3,
    prerequisites: ['explode'],
    description: '每级爆炸半径 +25%',
  },
  {
    id: 'explode_damage_amp',
    name: '\u7206\u70b8\u4f24\u5bb3\u589e\u52a0',
    maxRank: 3,
    prerequisites: ['explode'],
    description: '每级爆炸伤害 +30%',
  },
  {
    id: 'split',
    name: '\u5206\u88c2\u5b50\u5f39',
    maxRank: 1,
    prerequisites: [],
    description: '主弹命中后生成次级子弹',
  },
  {
    id: 'split_count',
    name: '\u5206\u88c2\u6570\u91cf\u589e\u52a0',
    maxRank: 3,
    prerequisites: ['split'],
    description: '每级分裂弹 +1',
  },
  {
    id: 'split_explode',
    name: '\u5206\u88c2\u5b50\u5f39\u7206\u70b8',
    maxRank: 1,
    prerequisites: ['split', 'explode'],
    description: '分裂弹命中时也触发爆炸',
  },
  {
    id: 'size_up',
    name: '\u4f53\u79ef\u589e\u5927',
    maxRank: 3,
    prerequisites: [],
    description: '每级碰撞盒 +20%，伤害 +10%',
  },
  {
    id: 'unlock_chain',
    name: '解锁闪电链',
    maxRank: 1,
    prerequisites: [],
    description: '解锁闪电链技能，初始弹跳3次，冷却3.5秒',
  },
  {
    id: 'chain_damage',
    name: '电能过载',
    maxRank: 5,
    prerequisites: ['unlock_chain'],
    description: '每级闪电链直击与弹跳伤害 +30%',
  },
  {
    id: 'chain_bounces',
    name: '高压传导',
    maxRank: 3,
    prerequisites: ['unlock_chain'],
    description: '每级最大弹跳次数 +2',
  },
  {
    id: 'chain_slow',
    name: '强效麻痹',
    maxRank: 3,
    prerequisites: ['unlock_chain'],
    description: '每级麻痹减速比例 +15%（加法），持续时间 +0.5s',
  },
  {
    id: 'chain_fork',
    name: '分叉闪电',
    maxRank: 1,
    prerequisites: ['unlock_chain'],
    description: '首个目标命中后，分叉成2条独立的闪电链传导弹跳',
  },
  {
    id: 'chain_explode',
    name: '雷击爆轰',
    maxRank: 1,
    prerequisites: ['unlock_chain'],
    description: '弹跳转向结束时在最后受击者处引发雷暴爆炸',
  },
  {
    id: 'chain_surge',
    name: '闪电涌动',
    maxRank: 3,
    prerequisites: ['unlock_chain'],
    description: '每次弹跳成功，该技能的剩余冷却时间减少0.15秒',
  },
];

export type UpgradeRanks = Partial<Record<UpgradeId, number>>;

export function getUpgradeRank(ranks: UpgradeRanks, id: UpgradeId): number {
  return ranks[id] ?? 0;
}

export function hasUpgrade(ranks: UpgradeRanks, id: UpgradeId): boolean {
  return getUpgradeRank(ranks, id) > 0;
}

function hasOtherInMutexGroup(ranks: UpgradeRanks, group: string, excludeId: UpgradeId): boolean {
  return UPGRADE_DEFS.some(
    (d) => d.mutexGroup === group && d.id !== excludeId && hasUpgrade(ranks, d.id),
  );
}

export function isUpgradeEligible(ranks: UpgradeRanks, def: UpgradeDef): boolean {
  if (getUpgradeRank(ranks, def.id) >= def.maxRank) {
    return false;
  }
  if (!def.prerequisites.every((p) => hasUpgrade(ranks, p))) {
    return false;
  }
  if (def.mutexGroup && hasOtherInMutexGroup(ranks, def.mutexGroup, def.id)) {
    return false;
  }
  return true;
}

export function rollUpgradeChoices(ranks: UpgradeRanks, count = 3): UpgradeDef[] {
  const pool = UPGRADE_DEFS.filter((d) => isUpgradeEligible(ranks, d));
  if (pool.length === 0) {
    return [];
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function applyUpgrade(ranks: UpgradeRanks, id: UpgradeId): UpgradeRanks {
  return { ...ranks, [id]: getUpgradeRank(ranks, id) + 1 };
}

/** 选牌按钮主标题：名称 + 下一级 rank */
export function formatUpgradeChoiceTitle(def: UpgradeDef, ranks: UpgradeRanks): string {
  const next = getUpgradeRank(ranks, def.id) + 1;
  if (def.maxRank <= 1) {
    return def.name;
  }
  return `${def.name}（${next}/${def.maxRank}）`;
}
