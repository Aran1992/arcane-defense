/** 设计分辨率 */
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

/** 波次 */
export const WAVE_SPAWN_DURATION_MS = 5000;
export const WAVE_GAP_MS = 3000;
export const MAX_WAVES = 20;

/** 战斗 */
export const ARCANE_MISSILE_BASE_DAMAGE = 15;
export const ARCANE_MISSILE_COOLDOWN_MS = 800;
/** 连发：同一次攻击 tick 内额外齐射轮之间的间隔（ms） */
export const RAPID_FIRE_BURST_GAP_MS = 100;
export const RAPID_FIRE_BURST_GAP_RANK2_MS = 80;
/** 伤害飘字：上浮 + 淡出时长（ms） */
export const DAMAGE_FLOAT_DURATION_MS = 700;
export const DAMAGE_FLOAT_RISE_PX = 48;
export const ARCANE_MISSILE_SPEED = 960;
/** 索敌/自动开火距离（CombatSystem）；不等于弹道最大飞行距离 */
export const PLAYER_ATTACK_RANGE = 900;
export const PLAYER_Y = 1235;
export const PLAYER_X = DESIGN_WIDTH / 2;

/** 城墙 */
export const WALL_Y = 1180;
export const WALL_MAX_HP = 100;
export const WALL_ATTACK_RANGE = 40;
export const ENEMY_WALL_DAMAGE = 5;
export const ENEMY_WALL_ATTACK_INTERVAL_MS = 1000;

/** 敌人 */
export const ENEMY_HP = 10;
export const ENEMY_SPEED = 85;
export const ENEMY_SPAWN_Y = 80;
export const ENEMY_RADIUS = 14;

/** 弹道 */
export const PROJECTILE_RADIUS = 8;
/** 弹道最大飞行距离（按路程累加，非存活时间）；须覆盖玩家至刷怪区 */
export const PROJECTILE_MAX_RANGE = PLAYER_Y - ENEMY_SPAWN_Y + 100;

/** 爆炸 */
export const EXPLODE_BASE_RADIUS = 48;
export const EXPLODE_BASE_DAMAGE_RATIO = 0.5;

/** 分裂 */
export const SPLIT_BASE_COUNT = 2;
export const SPLIT_DAMAGE_RATIO = 0.4;
export const SPLIT_ANGLE_SPREAD_DEG = 60;

/** 闪电链 */
export const CHAIN_LIGHTNING_BASE_DAMAGE = 10;
export const CHAIN_LIGHTNING_BASE_BOUNCES = 3;
export const CHAIN_LIGHTNING_BOUNCE_RANGE = 150;
export const CHAIN_LIGHTNING_BASE_SLOW = 0.3;
export const CHAIN_LIGHTNING_BASE_SLOW_DURATION = 1500;
export const CHAIN_LIGHTNING_BASE_COOLDOWN_MS = 3500;
export const CHAIN_LIGHTNING_EXPLODE_RADIUS = 64;
export const CHAIN_LIGHTNING_EXPLODE_DAMAGE_RATIO = 0.8;
