import { assetUrl } from '../../assetUrl.js'
import { BODY } from '../constants.js'

/** 地精贴图：32×32 单帧，绘制约同小怪。 */
export const GOBLIN_SRC = assetUrl('assets/跟班/地精.png')
export const RABBIT_SRC = assetUrl('assets/跟班/兔子.png')
export const GOBLIN_DRAW = 16
export const GOBLIN_INTERVAL = 0.4
export const GOBLIN_DMG_BASE = 15
export const GOBLIN_DMG_ATK_RATIO = 0.6
export const GOBLIN_MAX_TARGETS = 2
export const RABBIT_DMG = 20
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

/** ceil(15 + 攻击×0.6) + companionBonus。攻击 20、加成 10 → 37。 */
export function goblinDamage(attack, bonus = 0) {
  const base = Math.ceil(
    GOBLIN_DMG_BASE + GOBLIN_DMG_ATK_RATIO * (Number(attack) || 0),
  )
  return base + (Number(bonus) || 0)
}

/** 兔子固定 20 + companionBonus。 */
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
