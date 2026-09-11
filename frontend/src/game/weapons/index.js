/**
 * 游侠弓：蓄力箭数值。无弹匣 / 无换弹。
 */
import { assetUrl } from '../../assetUrl.js'
import { BODY, BODY_W } from '../constants.js'

export const WEAPON_NAME = '游侠弓'
export const CHARGE_MAX_SEC = 0.75
export const CHARGE_UPGRADE = 0.15
export const FIRE_INTERVAL = 0.48
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
export const CHARGE_SIZE_BONUS = 0.25
export const EMPOWER_FULL_MUL = 2.5
export const EMPOWER_PIERCE = 2
export const EMPOWER_SPEED = 680
export const EMPOWER_ATK = 15
export const EMPOWER_RANGER_FIRST = 5
export const MAGE_ATTACK = 25
export const WARRIOR_ATTACK = 22
export const MAGE_FULL_SIZE = 3
export const MAGE_EXPAND_SEC = 0.3
export const MAGE_PIERCE_DMG = 0.2
export const MAGE_CHARGE_DMG = 0.5
export const WARRIOR_FULL_SIZE = 1.6
export const WARRIOR_CHARGE_DMG = 0.6
export const CRIT_CHANCE_PER_PICK = 10
export const CRIT_DAMAGE_MUL = 1.5
export const ONLY_FAST_MUL = 1.2
export const REFINE_CRIT_DMG = 0.2
export const REFINE_CRIT_STEP = 30
export const ORB_SRC_SIZE = 4
export const ORB_DRAW = 8
export const SLASH_FRAME = 96
export const SLASH_FRAMES = 6
export const SLASH_FPS = 12
export const SLASH_RANGE = BODY
export const SLASH_THICK = BODY * 0.5
export const SLASH_DRAW = SLASH_RANGE
export const SLASH_BODY_FRONT = BODY_W / 2
export const EMPOWER_DRAW_W = 56
export const EMPOWER_DRAW_H = 10
export const EMPOWER_DRAW = EMPOWER_DRAW_W
export const ARROW_SPEED = 520
export const ATTACK_ANIM_SEC = 4 / 12
export const ARROW_W = 11
export const ARROW_H = 3
export const HIT_RADIUS = 3

export const ARROW_SRC = assetUrl('assets/characters/Other/Arrow.png')
export const ORB_SRC = assetUrl('assets/子弹/法球.png')
export const SLASH_SRC = [
  assetUrl('assets/子弹/挥砍-1.png'),
  assetUrl('assets/子弹/挥砍-2.png'),
  assetUrl('assets/子弹/挥砍-3.png'),
]
export const EMPOWER_SRC = assetUrl('assets/子弹/强化箭矢x.png')
export const BLOOD_SRC = {
  D: assetUrl('assets/characters/Other/D_Blood.png'),
  S: assetUrl('assets/characters/Other/S_Blood.png'),
  U: assetUrl('assets/characters/Other/U_Blood.png'),
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

/** M5/P27 四娃·喷火：命中点燃 3 秒；每层每秒 30% 攻击（集齐后 40%）。 */
export const FIRE_DURATION_SEC = 3
export const FIRE_DMG_PER_PICK = 0.3
export const FIRE_DMG_PER_PICK_BOOST = 0.4
/** M5 五娃·吐水：命中减速 20%（集齐后 30%）；基础 0.3s，每层 +0.2s。 */
export const WATER_SLOW_BASE = 0.2
export const WATER_SLOW_BOOST = 0.3
export const WATER_SLOW_SEC = 0.3
export const WATER_SLOW_ADD_SEC = 0.2
/** P32 所有角色基础击退：初始 0.5 身位。 */
export const BASE_KNOCKBACK_BODIES = 0.5
/** P32 高级「击退」：每层 +1 身位。 */
export const KNOCKBACK_BONUS_BODIES = 1
/** M5 二娃·千里眼：三选一 20%/层 概率变四选一（集齐后 30%/层）。 */
export const ERSE_CHANCE_PER_PICK = 20
export const ERSE_CHANCE_PER_PICK_BOOST = 30
/** M5 小金刚七色脉冲。 */
export const PULSE_INTERVAL_SEC = 3.0
export const PULSE_RADIUS_MUL = 1.5
export const PULSE_DMG_MUL = 1.3
export const PULSE_SLOW = 0.3
export const PULSE_SLOW_SEC = 0.4

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

/** 战士：基础击退 0；每 1 穿透 +0.5 身位。满蓄不再另加。 */
export function warriorKnockback(pierceBonus = 0) {
  return Math.max(0, pierceBonus | 0) * 0.5 * BODY
}

/** 满蓄基础 +1；升级穿透再叠加。返回可继续穿透的额外目标数。游侠默认。 */
export function pierceForCharge(ratio, bonus = 0, extraFull = 0) {
  return pierceForChar('ranger', ratio, bonus, extraFull)
}

export function pierceForChar(charId, ratio, bonus = 0, extraFull = 0) {
  const r = ratio >= 1
  const id = resolveCharId({ charId })
  if (id === 'mage') return 0
  if (id === 'warrior') return 999
  const base = r ? 1 : 0
  const extra = r ? Math.max(0, extraFull | 0) : 0
  return Math.max(0, base + extra + (bonus | 0))
}

export function shotDamage(ratio, attack = ATTACK_BASE, opts = {}) {
  const r = Math.max(0, Math.min(1, ratio))
  const atk = Math.max(1, attack)
  const id = resolveCharId({ charId: opts.charId })
  if (opts.empowerFull && r >= 1) return Math.ceil(atk * EMPOWER_FULL_MUL)
  if (id === 'mage') {
    const p = Math.max(0, opts.pierceBonus | 0)
    return atk * (1 + p * MAGE_PIERCE_DMG + MAGE_CHARGE_DMG * r)
  }
  if (id === 'warrior') {
    return atk * (1 + WARRIOR_CHARGE_DMG * r)
  }
  return Math.max(1, atk * (1 + r))
}

export function critChanceForRoll(rate = 0) {
  return Math.min(100, Math.max(0, Number(rate) || 0))
}

export function critDamageMul(rate = 0, refinePicks = 0) {
  const steps = Math.floor(Math.max(0, Number(rate) || 0) / REFINE_CRIT_STEP)
  const n = Math.max(0, refinePicks | 0)
  return CRIT_DAMAGE_MUL + REFINE_CRIT_DMG * steps * n
}

export function rollCrit(rate = 0, rng = Math.random) {
  const p = critChanceForRoll(rate)
  if (p <= 0) return false
  const u = typeof rng === 'function' ? rng() : Math.random()
  return u * 100 < p
}

export function fireIntervalForPicks(n = 0) {
  return FIRE_INTERVAL / ONLY_FAST_MUL ** Math.max(0, n | 0)
}

export function leftoverDamage(dmg, hpBefore) {
  return Math.max(0, dmg - Math.max(0, hpBefore))
}

export function attackForChar(charId) {
  const id = resolveCharId({ charId })
  if (id === 'mage') return MAGE_ATTACK
  if (id === 'warrior') return WARRIOR_ATTACK
  return ATTACK_BASE
}

/** P20 开火音效钩子用：按角色返回 kind（游侠 shoot / 战士 slash / 法师 fireball）。 */
export function fireKindForChar(charId) {
  const id = resolveCharId({ charId })
  if (id === 'warrior') return 'slash'
  if (id === 'mage') return 'fireball'
  return 'shoot'
}

export function sheetFrameIndex(t, fps = SLASH_FPS, frames = SLASH_FRAMES) {
  const n = Math.max(1, frames | 0)
  return Math.floor(Math.max(0, t) * fps) % n
}

/** 游侠满蓄 ×1.25；战士随蓄力线性到 ×1.6（只用于长度）；法师随蓄力到 ×3。再叠大娃。 */
export function chargeSizeMul(ratio, giantMul = 1, charId = 'ranger') {
  const g = giantMul > 0 ? giantMul : 1
  const r = Math.max(0, Math.min(1, ratio))
  const id = resolveCharId({ charId })
  if (id === 'mage') {
    return g * (1 + (MAGE_FULL_SIZE - 1) * r)
  }
  if (id === 'warrior') {
    return g * (1 + WARRIOR_CHARGE_DMG * r)
  }
  return g * (r >= 1 ? 1 + CHARGE_SIZE_BONUS : 1)
}

export function slashLength(ratio, giantMul = 1) {
  return SLASH_RANGE * chargeSizeMul(ratio, giantMul, 'warrior')
}

export function slashThick(giantMul = 1) {
  const g = giantMul > 0 ? giantMul : 1
  return SLASH_THICK * g
}

export function resolveCharId(player) {
  const id = player?.charId
  if (id === 'warrior' || id === 'mage') return id
  return 'ranger'
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

export function giantSizeMul(picks, vajraComplete = false) {
  const n = Math.max(0, picks | 0)
  const per = vajraComplete ? 0.5 : 0.4
  return 1 + per * n
}

/** 四娃点燃 DPS（每层每秒占攻击的比例）。集齐后每层 40%，否则 30%。 */
export function fireDpsPerPick(vajraComplete = false) {
  return vajraComplete ? FIRE_DMG_PER_PICK_BOOST : FIRE_DMG_PER_PICK
}

/** 五娃减速幅度。集齐后 30%，否则 20%。 */
export function waterSlowPct(vajraComplete = false) {
  return vajraComplete ? WATER_SLOW_BOOST : WATER_SLOW_BASE
}

/** 五娃减速时长：基础 0.3s，每层 +0.2s。 */
export function waterSlowSec(picks = 1) {
  const n = Math.max(1, picks | 0)
  return WATER_SLOW_SEC + WATER_SLOW_ADD_SEC * (n - 1)
}

/** 高级「击退」：每层 +1 身位。 */
export function knockbackBonusForPicks(picks = 0) {
  return Math.max(0, picks | 0) * KNOCKBACK_BONUS_BODIES * BODY
}

/** 二娃四选一概率 %/层。集齐后 30%，否则 20%。 */
export function erseChancePerPick(vajraComplete = false) {
  return vajraComplete ? ERSE_CHANCE_PER_PICK_BOOST : ERSE_CHANCE_PER_PICK
}

/** 二娃四选一总概率（%）。层数越多越高，封顶 100。 */
export function erseChance(picks = 0, vajraComplete = false) {
  return Math.min(100, Math.max(0, picks | 0) * erseChancePerPick(vajraComplete))
}

/**
 * @param {{ chargeMax?: number }} [opts]
 */
export function createBow(opts = {}) {
  const atk0 = opts.attack ?? attackForChar(opts.charId)
  const weapon = {
    name: WEAPON_NAME,
    charId: resolveCharId({ charId: opts.charId }),
    chargeMax: opts.chargeMax ?? CHARGE_MAX_SEC,
    charge: 0,
    charging: false,
    fireCd: 0,
    fireInterval: FIRE_INTERVAL,
    extraShots: 0,
    backShots: 0,
    pierceBonus: 0,
    attack: atk0,
    dmgBonus: atk0 - ATTACK_BASE,
    giantPicks: 0,
    sizeMul: 1,
    empowerPicks: 0,
    critRate: 0,
    refinePicks: 0,
    onlyFastPicks: 0,
    ersePicks: 0,
    siwaPicks: 0,
    wuwaPicks: 0,
    knockbackPicks: 0,
    vajraComplete: false,
    dualShot: false,
    infiniteAmmo: Boolean(opts.infiniteAmmo),
    mag: 0,
    magSize: 0,
    reloading: false,
    reloadLeft: 0,
    reloadSec: opts.chargeMax ?? CHARGE_MAX_SEC,
    damage: atk0,
    applyUpgrade,
    setInfiniteAmmo(v) {
      weapon.infiniteAmmo = Boolean(v)
    },
    setVajraComplete(on) {
      weapon.vajraComplete = Boolean(on)
      weapon.sizeMul = giantSizeMul(weapon.giantPicks, weapon.vajraComplete)
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
      weapon.sizeMul = giantSizeMul(weapon.giantPicks, weapon.vajraComplete)
      return true
    }
    if (id === 'erse') {
      weapon.ersePicks = (weapon.ersePicks || 0) + 1
      return true
    }
    if (id === 'siwa') {
      weapon.siwaPicks = (weapon.siwaPicks || 0) + 1
      return true
    }
    if (id === 'wuwa') {
      weapon.wuwaPicks = (weapon.wuwaPicks || 0) + 1
      return true
    }
    if (id === 'knockback') {
      weapon.knockbackPicks = (weapon.knockbackPicks || 0) + 1
      return true
    }
    if (id === 'empower_shot') {
      weapon.empowerPicks += 1
      const who = resolveCharId({ charId: weapon.charId })
      if (who === 'ranger' && weapon.empowerPicks === 1) bumpAttack(EMPOWER_RANGER_FIRST)
      else bumpAttack(EMPOWER_ATK)
      return true
    }
    if (id === 'crit') {
      weapon.critRate = (weapon.critRate || 0) + CRIT_CHANCE_PER_PICK
      return true
    }
    if (id === 'refine') {
      weapon.refinePicks = (weapon.refinePicks || 0) + 1
      return true
    }
    if (id === 'only_fast') {
      weapon.onlyFastPicks = (weapon.onlyFastPicks || 0) + 1
      weapon.fireInterval = fireIntervalForPicks(weapon.onlyFastPicks)
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
