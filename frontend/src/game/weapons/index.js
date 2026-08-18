/**
 * 游侠弓：蓄力箭数值。无弹匣 / 无换弹。
 */
import { BODY } from '../constants.js'

export const WEAPON_NAME = '游侠弓'
export const CHARGE_MAX_SEC = 0.75
export const CHARGE_UPGRADE = 0.2
export const FIRE_INTERVAL = 0.21
/** 角色攻击属性初值。未蓄 = attack，满蓄 = attack×2。 */
export const ATTACK_BASE = 20
export const DMG_MIN = ATTACK_BASE
export const DMG_MAX = ATTACK_BASE * 2
export const KB_MIN_BODIES = 1
export const KB_MAX_BODIES = 2
export const SPREAD_DEG = 15
export const DUAL_SPREAD_DEG = SPREAD_DEG
export const SCATTER_DMG_PENALTY = 3
export const POWER_DMG = 10
export const ARROW_SPEED = 520
export const ATTACK_ANIM_SEC = 4 / 12
export const ARROW_W = 11
export const ARROW_H = 3
export const HIT_RADIUS = 3

export const ARROW_SRC = '/assets/characters/Other/Arrow.png'
export const BLOOD_SRC = {
  D: '/assets/characters/Other/D_Blood.png',
  S: '/assets/characters/Other/S_Blood.png',
  U: '/assets/characters/Other/U_Blood.png',
}
export const BLOOD_FRAMES = 4
export const BLOOD_FRAME = 32
export const BLOOD_FPS = 14

/** @deprecated P3 已无弹匣；保留导出以免旧 import 崩。 */
export const MAG_SIZE = 0
export const BULLET_DAMAGE = DMG_MIN
export const RELOAD_SEC = CHARGE_MAX_SEC
export const KNOCKBACK_DIST = BODY
export const AMMO_CAP_BONUS = 0
export const RELOAD_FACTOR = 1
export const FIRE_COOLDOWN = FIRE_INTERVAL
export const BULLET_SPEED = ARROW_SPEED
export const BULLET_SRC = ARROW_SRC

export function chargeRatio(charge, chargeMax) {
  if (!(chargeMax > 0)) return 1
  return Math.max(0, Math.min(1, charge / chargeMax))
}

export function damageForCharge(ratio, attack = ATTACK_BASE) {
  const r = Math.max(0, Math.min(1, ratio))
  const atk = Math.max(1, attack)
  return atk * (1 + r)
}

export function knockbackForCharge(ratio) {
  return BODY * (KB_MIN_BODIES + (KB_MAX_BODIES - KB_MIN_BODIES) * ratio)
}

/** 满蓄基础 +1；升级穿透再叠加。返回可继续穿透的额外目标数。 */
export function pierceForCharge(ratio, bonus = 0) {
  const full = ratio >= 1 ? 1 : 0
  return full + Math.max(0, bonus | 0)
}

export function shotDamage(ratio, attack = ATTACK_BASE) {
  return Math.max(1, damageForCharge(ratio, attack))
}

/**
 * 正前方 1+extraFront 支，均匀按 stepDeg 张开；背后 backCount 支同公式。
 */
export function fireAngles(base, extraFront = 0, backCount = 0, stepDeg = SPREAD_DEG) {
  const step = (stepDeg * Math.PI) / 180
  const angs = []
  const frontN = 1 + Math.max(0, extraFront | 0)
  for (let i = 0; i < frontN; i++) {
    angs.push(base + (i - (frontN - 1) / 2) * step)
  }
  const backN = Math.max(0, backCount | 0)
  const rear = base + Math.PI
  for (let i = 0; i < backN; i++) {
    angs.push(rear + (i - (backN - 1) / 2) * step)
  }
  return angs
}

export function giantSizeMul(picks) {
  const n = Math.max(0, picks | 0)
  if (n <= 0) return 1
  return 1 + 1 + 0.5 * (n - 1)
}

/**
 * @param {{ chargeMax?: number }} [opts]
 */
export function createBow(opts = {}) {
  const weapon = {
    name: WEAPON_NAME,
    chargeMax: opts.chargeMax ?? CHARGE_MAX_SEC,
    charge: 0,
    charging: false,
    fireCd: 0,
    extraShots: 0,
    backShots: 0,
    pierceBonus: 0,
    attack: opts.attack ?? ATTACK_BASE,
    dmgBonus: (opts.attack ?? ATTACK_BASE) - ATTACK_BASE,
    giantPicks: 0,
    sizeMul: 1,
    dualShot: false,
    infiniteAmmo: Boolean(opts.infiniteAmmo),
    mag: 0,
    magSize: 0,
    reloading: false,
    reloadLeft: 0,
    reloadSec: opts.chargeMax ?? CHARGE_MAX_SEC,
    damage: opts.attack ?? ATTACK_BASE,
    applyUpgrade,
    setInfiniteAmmo(v) {
      weapon.infiniteAmmo = Boolean(v)
    },
    effectiveChargeMax,
  }

  function effectiveChargeMax() {
    return weapon.infiniteAmmo ? 0 : weapon.chargeMax
  }

  function bumpAttack(delta) {
    weapon.attack = Math.max(1, (weapon.attack ?? ATTACK_BASE) + delta)
    weapon.dmgBonus = weapon.attack - ATTACK_BASE
    weapon.damage = weapon.attack
  }

  function applyUpgrade(id) {
    if (id === 'ammo_cap' || id === 'scatter' || id === 'dual_shot') {
      weapon.extraShots += 1
      bumpAttack(-SCATTER_DMG_PENALTY)
      weapon.dualShot = weapon.extraShots > 0
      return true
    }
    if (id === 'eyes') {
      weapon.backShots += 1
      bumpAttack(-SCATTER_DMG_PENALTY)
      return true
    }
    if (id === 'pierce') {
      weapon.pierceBonus += 1
      return true
    }
    if (id === 'power') {
      bumpAttack(POWER_DMG)
      return true
    }
    if (id === 'giant') {
      weapon.giantPicks += 1
      weapon.sizeMul = giantSizeMul(weapon.giantPicks)
      return true
    }
    if (id === 'reload' || id === 'charge') {
      weapon.chargeMax = Math.max(0, weapon.chargeMax - CHARGE_UPGRADE)
      weapon.reloadSec = weapon.chargeMax
      if (weapon.charge > weapon.chargeMax) weapon.charge = weapon.chargeMax
      return true
    }
    return false
  }

  return weapon
}

/** 兼容 match.js 的 combat.pistol 字段名。 */
export const createPistol = createBow
