/**
 * M6 刷怪环与难度一公式。常量集中于此，供 enemies 门面调用。
 *
 * P3：移速是设计单位固定值，禁止再乘 player.speed。
 * P6：蘑菇怪血/波数按存活秒；蜗牛怪从 120s 起算；spawnRate 只乘每波数量。
 */
import {
  SPAWN_R_NEAR,
  SPEED_PX_PER_UNIT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  isNearAndOutOfView,
} from '../constants.js'

export const DIFFICULTY_STEP_SEC = 45

export const CREEP_HP = 27
export const CREEP_SPAWN_COUNT0 = 5
export const CREEP_INTERVAL0 = 5
export const CREEP_SPEED_MUL0 = 0.75
export const SPLIT_SPEED_MUL0 = 0.9
export const SPEED_MUL_PER_TIER = 0.08
export const SPEED_MUL_CAP = 1.4
export const MUSHROOM_HP_PER_TIER = 5
export const MUSHROOM_COUNT_STEP_SEC = 120

export const SNAIL_UNLOCK_SEC = 120
export const SNAIL_HP0 = 45
export const SNAIL_HP_PER = 10
export const SNAIL_HP_STEP_SEC = 40
export const SNAIL_COUNT0 = 4
export const SNAIL_COUNT_STEP_SEC = 45
export const SNAIL_INTERVAL = 5
export const SNAIL_SPEED0 = 0.75
export const SNAIL_SPEED_PER = 0.07
export const SNAIL_SPEED_STEP_SEC = 45

export const GRAY_HP0 = 25
export const GRAY_HP_GROWTH = 0.15
/** P2.1：存活满此时长才开始刷灰树。 */
export const GRAY_UNLOCK_SEC = 30
/** P2.1：每棵独立周期；禁止全局统一扣血。 */
export const GRAY_SELF_PERIOD = 3
export const GRAY_SELF_DMG_MIN = 1
export const GRAY_SELF_DMG_MAX = 5
export const GRAY_BURST_DELAY = 1
export const GRAY_BURST_COUNT = 4
/** 裂怪绕爆点半径；与 CREEP_DRAW（1 绘制宽）对齐。 */
export const GRAY_BURST_RADIUS = 16
export const GRAY_SPAWN_COUNT0 = 2
export const GRAY_SPAWN_COUNT_CAP = 6
export const GRAY_INTERVAL0 = 5
export const GRAY_INTERVAL_MIN = 2
export const GRAY_INTERVAL_DECAY = 0.94

const VIEW_HALF_DIAG = Math.hypot(VIEW_WIDTH, VIEW_HEIGHT) / 2

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

export function difficultyTier(elapsedSec) {
  return Math.floor(Math.max(0, elapsedSec) / DIFFICULTY_STEP_SEC)
}

/** 蘑菇怪每波：5 + floor(秒/120)，无上限。参数为存活秒。 */
export function mushroomSpawnCount(elapsedSec) {
  return CREEP_SPAWN_COUNT0 + Math.floor(Math.max(0, elapsedSec) / MUSHROOM_COUNT_STEP_SEC)
}

export function mushroomSpawnInterval() {
  return CREEP_INTERVAL0
}

/** 蘑菇怪生命：27 + 5×floor(秒/45)，生成时结算。 */
export function mushroomHp(elapsedSec) {
  return CREEP_HP + MUSHROOM_HP_PER_TIER * difficultyTier(elapsedSec)
}

/** 别名：参数改为存活秒。 */
export function creepSpawnCount(elapsedSec) {
  return mushroomSpawnCount(elapsedSec)
}

export function creepSpawnInterval(_t) {
  return CREEP_INTERVAL0
}

/** 常规蘑菇怪设计单位：min(1.4, 0.75 + 0.08t)，t=floor(秒/45) */
export function creepSpeedMul(t) {
  return Math.min(SPEED_MUL_CAP, CREEP_SPEED_MUL0 + SPEED_MUL_PER_TIER * t)
}

/** 灰树裂怪设计单位：min(1.4, 0.9 + 0.08t) */
export function splitSpeedMul(t) {
  return Math.min(SPEED_MUL_CAP, SPLIT_SPEED_MUL0 + SPEED_MUL_PER_TIER * t)
}

export function creepSpeedPx(t) {
  return SPEED_PX_PER_UNIT * creepSpeedMul(t)
}

export function splitSpeedPx(t) {
  return SPEED_PX_PER_UNIT * splitSpeedMul(t)
}

export function snailAge(elapsedSec) {
  return Math.max(0, elapsedSec - SNAIL_UNLOCK_SEC)
}

export function snailHp(elapsedSec) {
  return SNAIL_HP0 + SNAIL_HP_PER * Math.floor(snailAge(elapsedSec) / SNAIL_HP_STEP_SEC)
}

export function snailSpawnCount(elapsedSec) {
  if (elapsedSec < SNAIL_UNLOCK_SEC) return 0
  return SNAIL_COUNT0 + Math.floor(snailAge(elapsedSec) / SNAIL_COUNT_STEP_SEC)
}

/** 蜗牛移速设计单位：0.75 + 0.07×floor((秒-120)/45)，不套 1.4 帽 */
export function snailSpeedMul(elapsedSec) {
  return SNAIL_SPEED0 + SNAIL_SPEED_PER * Math.floor(snailAge(elapsedSec) / SNAIL_SPEED_STEP_SEC)
}

export function snailSpeedPx(elapsedSec) {
  return SPEED_PX_PER_UNIT * snailSpeedMul(elapsedSec)
}

export const SLIME_X1_UNLOCK_SEC = 300
export const SLIME_X1_HP0 = 85
export const SLIME_X1_HP_PER = 12
export const SLIME_X1_STEP_SEC = 45
export const SLIME_X1_INTERVAL = 15
export const SLIME_X1_COUNT0 = 6
export const SLIME_X1_SPEED0 = 1
export const SLIME_X1_SPEED_PER = 0.07
export const SLIME_X3_HP_FACTOR = 0.25
export const SLIME_X3_SPEED_BONUS = 0.1
export const SLIME_X1_CRYSTALS = 2
export const SLIME_X3_SPLIT_COUNT = 3
export const SLIME_X3_INVULN_SEC = 0.3

/** u = max(0, 秒 − 300) */
export function slimeAge(elapsedSec) {
  return Math.max(0, elapsedSec - SLIME_X1_UNLOCK_SEC)
}

export function slimeX1Hp(elapsedSec) {
  return SLIME_X1_HP0 + SLIME_X1_HP_PER * Math.floor(slimeAge(elapsedSec) / SLIME_X1_STEP_SEC)
}

export function slimeX1SpawnCount(elapsedSec) {
  if (elapsedSec < SLIME_X1_UNLOCK_SEC) return 0
  return SLIME_X1_COUNT0 + Math.floor(slimeAge(elapsedSec) / SLIME_X1_STEP_SEC)
}

/** 1.00 + 0.07×floor(u/45)，不套 1.4 帽 */
export function slimeX1SpeedMul(elapsedSec) {
  return SLIME_X1_SPEED0 + SLIME_X1_SPEED_PER * Math.floor(slimeAge(elapsedSec) / SLIME_X1_STEP_SEC)
}

/** 史莱姆x-3：0 或 1 结晶，各 50%。rng() < 0.5 → 0。 */
export function rollSlimeX3Crystals(rng) {
  return rng() < 0.5 ? 0 : 1
}

/** 灰树裂怪绕爆点：夹角 90°（4 只），半径 ≥ 1 绘制宽。 */
export function grayBurstOffset(k, originX, originY, radius = GRAY_BURST_RADIUS, count = GRAY_BURST_COUNT) {
  const ang = (k * Math.PI * 2) / count
  return {
    x: originX + Math.cos(ang) * radius,
    y: originY + Math.sin(ang) * radius,
  }
}

export function slimeX1SpeedPx(elapsedSec) {
  return SPEED_PX_PER_UNIT * slimeX1SpeedMul(elapsedSec)
}

export function slimeX3HpFromParent(spawnHp) {
  return Math.ceil((spawnHp ?? 0) * SLIME_X3_HP_FACTOR)
}

/** 测试倍率：round(基础×倍率) 且至少 1。不要拿去乘 dt。 */
export function scaledWaveCount(base, spawnRate = 1) {
  const rate = spawnRate == null ? 1 : spawnRate
  return Math.max(1, Math.round(base * rate))
}

/** P2.1：开始后仍每波 2 棵（难度阶不涨数量）。 */
export function grayTreeSpawnCount(_t) {
  return GRAY_SPAWN_COUNT0
}

/** 每棵灰树独立掷点：1～5。 */
export function rollGraySelfDamage(random) {
  const span = GRAY_SELF_DMG_MAX - GRAY_SELF_DMG_MIN + 1
  return GRAY_SELF_DMG_MIN + Math.floor(random() * span)
}

export function grayTreeSpawnInterval(t) {
  return Math.max(GRAY_INTERVAL_MIN, GRAY_INTERVAL0 * GRAY_INTERVAL_DECAY ** t)
}

export function grayTreeHp(t) {
  return GRAY_HP0 * (1 + GRAY_HP_GROWTH * t)
}

/**
 * 环形带选点：视野矩形外、距焦点 ≤ SPAWN_R_NEAR。
 * @returns {{ x: number, y: number }}
 */
export function pickNearOutOfView(focus, camera, random, margin = 14) {
  const rMin = VIEW_HALF_DIAG + 24
  const rMax = SPAWN_R_NEAR
  const span = Math.max(8, rMax - rMin)
  for (let i = 0; i < 40; i++) {
    const ang = random() * Math.PI * 2
    const r = rMin + random() * span
    const x = clamp(focus.x + Math.cos(ang) * r, margin, WORLD_WIDTH - margin)
    const y = clamp(focus.y + Math.sin(ang) * r, margin, WORLD_HEIGHT - margin)
    if (isNearAndOutOfView(x, y, focus.x, focus.y, camera, SPAWN_R_NEAR)) {
      return { x, y }
    }
  }
  const candidates = [
    { x: camera.x + VIEW_WIDTH + 32, y: focus.y },
    { x: camera.x - 32, y: focus.y },
    { x: focus.x, y: camera.y + VIEW_HEIGHT + 32 },
    { x: focus.x, y: camera.y - 32 },
  ]
  for (const p of candidates) {
    p.x = clamp(p.x, margin, WORLD_WIDTH - margin)
    p.y = clamp(p.y, margin, WORLD_HEIGHT - margin)
    if (isNearAndOutOfView(p.x, p.y, focus.x, focus.y, camera, SPAWN_R_NEAR)) return p
  }
  return {
    x: clamp(focus.x + rMin, margin, WORLD_WIDTH - margin),
    y: clamp(focus.y, margin, WORLD_HEIGHT - margin),
  }
}
