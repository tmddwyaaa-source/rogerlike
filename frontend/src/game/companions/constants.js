import { assetUrl } from '../../assetUrl.js'
import { BODY, SPEED_PX_PER_UNIT } from '../constants.js'

/** 地精贴图：32×32 单帧，绘制约同小怪。 */
export const GOBLIN_SRC = assetUrl('assets/跟班/地精.png')
export const RABBIT_SRC = assetUrl('assets/跟班/兔子.png')
export const GOBLIN_DRAW = 16
export const GOBLIN_INTERVAL = 0.4
export const GOBLIN_DMG_BASE = 15
export const GOBLIN_DMG_ATK_RATIO = 0.6
export const GOBLIN_MAX_TARGETS = 2
export const RABBIT_DMG = 10
export const RABBIT_MAX_TARGETS = 1
export const BAT_SRC = assetUrl('assets/跟班/蝙蝠.png')
export const BAT_DMG = 7
export const BAT_MAX_TARGETS = 1
export const BAT_KILL_HEAL_EVERY = 200
export const EGG_SRC = {
  1: assetUrl('assets/跟班/奇怪的蛋-x.png'),
  2: assetUrl('assets/跟班/奇怪的蛋-y.png'),
  3: assetUrl('assets/跟班/奇怪的蛋-z.png'),
}
export const EGG_STAGE2_KILLS = 100
export const EGG_STAGE3_KILLS = 300
export const EGG_MUL = { 1: 0.2, 2: 0.5, 3: 0.8 }
export const EGG_MAX_TARGETS = { 1: 1, 2: 2, 3: 3 }
export const EGG_KILL_BONUS_EVERY = 100
/**
 * 万物一心档位（P24）：≥2 伤+5；≥4 再 +floor(攻击×0.2)；
 * ≥6 目标+1；≥8 移速+0.2 设计单位、伤再+10、优先角色目标。
 */
export const UNITY_TIER_FLAT = 2
export const UNITY_TIER_ATK = 4
export const UNITY_TIER_TARGETS = 6
export const UNITY_TIER_ELITE = 8
export const UNITY_FLAT = 5
export const UNITY_ATK_SHARE = 0.2
export const UNITY_ELITE_FLAT = 10
/** 0.2 设计单位 × 80 px/s（SPEED_PX_PER_UNIT）。 */
export const UNITY_SPEED_ADD = 16
/** 无敌人时绕角色停驻的半径。 */
export const GOBLIN_FOLLOW_DIST = BODY
export const BLACK_KEY = 12

/** P28 B1 驯兽师：所有跟班伤害 +5、移速 +0.05（设计单位），可叠。 */
export const TAMER_DMG = 5
/** 0.05 设计单位 × SPEED_PX_PER_UNIT(80)。 */
export const TAMER_SPEED_ADD = 0.05 * SPEED_PX_PER_UNIT
export const DEMON_SRC = assetUrl('assets/跟班/恶魔.png')
/** P28 B4 恶魔：基础伤 10 + 角色伤害×20%；软拉绳跟随角色、打 1 单位。 */
export const DEMON_DMG_BASE = 10
export const DEMON_ATK_RATIO = 0.2
/** 3 身位（BODY=22）＝ 66 px；软拉绳的平衡点约在 2×该值，不再是硬边界。 */
export const DEMON_KEEP_RADIUS = 3 * BODY
/**
 * P42 恶魔索敌半径：只在「距角色 ≤3 身位」的活怪里取最近的一只（实机问题修：
 * 恶魔会追着 Boss 跑、远离角色）。数值恰好与 DEMON_KEEP_RADIUS 相同，但语义不同：
 * 这里限制的是「以角色为中心的索敌距离」，不是跟随绳长，调绳长/舒适环时不要连带改这里。
 */
export const DEMON_TARGET_RADIUS = 3 * BODY
/**
 * 索敌滞回：已锁定的目标要超出 3.5 身位才放弃，避免目标在 3 身位边界上
 * 反复「锁定→丢弃→再锁定」造成抖动。
 */
export const DEMON_RELEASE_RADIUS = 3.5 * BODY
/** P30 恶魔软跟随：舒适环绕距离（2 身位）。 */
export const DEMON_COMFORT_RADIUS = 2 * BODY
export const DEMON_MAX_TARGETS = 1
export const SLIME_GG_SRC = {
  1: assetUrl('assets/跟班/史莱姆g-1.png'),
  2: assetUrl('assets/跟班/史莱姆g-2.png'),
}
/** P28 B5 史莱姆gg：生成 g-1/g-2 两跟班，基础伤 5。 */
export const SLIME_GG_DMG = 5
export const SLIME_GG_MAX_TARGETS = 1
/** P28 B6 伴我同行：角色每跨 100 杀，按当时 rate 加跟班伤害。 */
export const COMPANIONSHIP_KILL_STEP = 100
export const COMPANIONSHIP_RATE_BASE = 1
export const COMPANIONSHIP_RATE_STEP = 0.5

/** ceil(15 + 攻击×0.6) + companionBonus。攻击 20、加成 10 → 37。 */
export function goblinDamage(attack, bonus = 0) {
  const base = Math.ceil(
    GOBLIN_DMG_BASE + GOBLIN_DMG_ATK_RATIO * (Number(attack) || 0),
  )
  return base + (Number(bonus) || 0)
}

/** 兔子固定 10 + companionBonus。 */
export function rabbitDamage(bonus = 0) {
  return RABBIT_DMG + (Number(bonus) || 0)
}

/** 蝙蝠固定 7 + companionBonus。 */
export function batDamage(bonus = 0) {
  return BAT_DMG + (Number(bonus) || 0)
}

export function eggStage(playerKills) {
  const k = Number(playerKills) || 0
  if (k >= EGG_STAGE3_KILLS) return 3
  if (k >= EGG_STAGE2_KILLS) return 2
  return 1
}

export function unityFlat(tier) {
  return (Number(tier) || 0) >= UNITY_TIER_FLAT ? UNITY_FLAT : 0
}

export function unityAtkBonus(tier, attack) {
  if ((Number(tier) || 0) < UNITY_TIER_ATK) return 0
  return Math.floor((Number(attack) || 0) * UNITY_ATK_SHARE)
}

export function unityExtraTargets(tier) {
  return (Number(tier) || 0) >= UNITY_TIER_TARGETS ? 1 : 0
}

export function unityEliteFlat(tier) {
  return (Number(tier) || 0) >= UNITY_TIER_ELITE ? UNITY_ELITE_FLAT : 0
}

export function unitySpeedBonus(tier) {
  return (Number(tier) || 0) >= UNITY_TIER_ELITE ? UNITY_SPEED_ADD : 0
}

/** 万物一心加在跟班面板伤上的额外值（与地精 +10 分开）。 */
export function unityDamageAdd(tier, attack) {
  return unityFlat(tier) + unityAtkBonus(tier, attack) + unityEliteFlat(tier)
}

/** ceil(攻击 × 阶段倍率) + floor(蛋杀敌/100) + companionBonus */
export function eggDamage(attack, stage = 1, eggKills = 0, bonus = 0) {
  const mul = EGG_MUL[stage] ?? EGG_MUL[1]
  return (
    Math.ceil((Number(attack) || 0) * mul) +
    Math.floor((Number(eggKills) || 0) / EGG_KILL_BONUS_EVERY) +
    (Number(bonus) || 0)
  )
}

/** P28 B4 恶魔：floor(10 + 角色伤害×0.2) + bonus。attack 用含恶魔联动的有效角色伤害。 */
export function demonDamage(attack, bonus = 0) {
  const base = DEMON_DMG_BASE + Math.floor((Number(attack) || 0) * DEMON_ATK_RATIO)
  return base + (Number(bonus) || 0)
}

/** 恶魔联动：每档 5 点额外跟班伤害 → 角色伤害 +（3 + 恶魔次数−1）。 */
export function demonAttackPerBonus(demonCount) {
  const n = Math.max(1, Number(demonCount) || 1)
  return 3 + (n - 1)
}

/** 绕圆心均匀槽位；n≥2 时相邻中心距 = chord。 */
export function ringRadius(n, chord = GOBLIN_DRAW) {
  if (n <= 1) return chord
  return chord / (2 * Math.sin(Math.PI / Math.max(2, n)))
}

export function slotPos(cx, cy, i, n, radius) {
  const count = Math.max(1, n)
  const ang = (Math.PI * 2 * i) / count
  return {
    x: cx + Math.cos(ang) * radius,
    y: cy + Math.sin(ang) * radius,
  }
}

/** 走进目标 AABB 用的内缩，必须小于半宽之和，保证重叠。 */
export const CONTACT_INSET_RATIO = 0.35
