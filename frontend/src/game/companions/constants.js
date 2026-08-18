import { BODY } from '../constants.js'

/** 地精贴图：32×32 单帧，绘制约同小怪。 */
export const GOBLIN_SRC = '/assets/跟班/地精.png'
export const RABBIT_SRC = '/assets/跟班/兔子.png'
export const GOBLIN_DRAW = 16
export const GOBLIN_INTERVAL = 0.4
export const GOBLIN_DMG_BASE = 15
export const GOBLIN_DMG_ATK_RATIO = 0.6
export const GOBLIN_MAX_TARGETS = 2
export const RABBIT_DMG = 20
export const RABBIT_MAX_TARGETS = 1
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
