/**
 * M6 刷怪环与难度一公式。常量集中于此，供 enemies 门面调用。
 *
 * P3：移速是设计单位固定值，禁止再乘 player.speed。
 * P6：蘑菇怪血/波数按存活秒；蜗牛怪从 120s 起算；spawnRate 只乘每波数量。
 */
import {
  BODY,
  SPAWN_R_NEAR,
  SPEED_PX_PER_UNIT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  isInView,
  isNearAndOutOfView,
} from '../constants.js'

export const DIFFICULTY_STEP_SEC = 45

/** P25 生成预警：出生前落点先显示红圈此时长再出现。 */
export const SPAWN_WARN_SEC = 0.8
/** P25 环绕生成：落在视野边缘外 1～3 身位环带。 */
export const SPAWN_PAD_MIN = BODY
export const SPAWN_PAD_MAX = BODY * 3

export const CREEP_HP = 32
export const CREEP_SPAWN_COUNT0 = 5
export const CREEP_INTERVAL0 = 5
export const CREEP_SPEED_MUL0 = 0.62
export const SPLIT_SPEED_MUL0 = 0.77
export const SPEED_MUL_PER_TIER = 0.03
export const SPEED_MUL_CAP = 1.4
export const ARMOR_DMG_MUL = 0.7
export const MUSHROOM_HP_PER_TIER = 15
export const MUSHROOM_COUNT_STEP_SEC = 120

export const SNAIL_UNLOCK_SEC = 120
export const SNAIL_HP0 = 50
export const SNAIL_HP_PER = 25
export const SNAIL_HP_STEP_SEC = 40
export const SNAIL_COUNT0 = 4
export const SNAIL_COUNT_STEP_SEC = 45
export const SNAIL_INTERVAL = 5
export const SNAIL_SPEED0 = 0.62
export const SNAIL_SPEED_PER = 0.02
export const SNAIL_SPEED_STEP_SEC = 45

export const GRAY_HP0 = 80
export const GRAY_HP_GROWTH = 0.15
/** P2.1：存活满此时长才开始刷灰树。 */
export const GRAY_UNLOCK_SEC = 30
/** P2.1：每棵独立周期；禁止全局统一扣血。 */
export const GRAY_SELF_PERIOD = 3
export const GRAY_SELF_DMG_MIN = 1
/** t=0 自损上限；完整上限 = 8 + floor(秒/60)。 */
export const GRAY_SELF_DMG_MAX0 = 8
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

/** 蘑菇怪生命：32 + (10+extra)×floor(秒/45)，生成时结算。 */
export function mushroomHp(elapsedSec, extra = 0) {
  return CREEP_HP + (MUSHROOM_HP_PER_TIER + extra) * difficultyTier(elapsedSec)
}

/** 别名：参数改为存活秒。 */
export function creepSpawnCount(elapsedSec) {
  return mushroomSpawnCount(elapsedSec)
}

export function creepSpawnInterval(_t) {
  return CREEP_INTERVAL0
}

/** 常规蘑菇怪设计单位：min(1.4, 0.62 + 0.04t)，t=floor(秒/45) */
export function creepSpeedMul(t) {
  return Math.min(SPEED_MUL_CAP, CREEP_SPEED_MUL0 + SPEED_MUL_PER_TIER * t)
}

/** 灰树裂怪设计单位：min(1.4, 0.77 + 0.04t) */
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

export function snailHp(elapsedSec, extra = 0) {
  return SNAIL_HP0 + (SNAIL_HP_PER + extra) * Math.floor(snailAge(elapsedSec) / SNAIL_HP_STEP_SEC)
}

export function snailSpawnCount(elapsedSec) {
  if (elapsedSec < SNAIL_UNLOCK_SEC) return 0
  return SNAIL_COUNT0 + Math.floor(snailAge(elapsedSec) / SNAIL_COUNT_STEP_SEC)
}

/** 蜗牛移速设计单位：0.62 + 0.03×floor((秒-120)/45)，不套 1.4 帽 */
export function snailSpeedMul(elapsedSec) {
  return SNAIL_SPEED0 + SNAIL_SPEED_PER * Math.floor(snailAge(elapsedSec) / SNAIL_SPEED_STEP_SEC)
}

export function snailSpeedPx(elapsedSec) {
  return SPEED_PX_PER_UNIT * snailSpeedMul(elapsedSec)
}

export const SLIME_X1_UNLOCK_SEC = 180
export const SLIME_X1_HP0 = 120
export const SLIME_X1_HP_PER = 27
export const SLIME_X1_STEP_SEC = 45
export const SLIME_X1_INTERVAL = 15
export const SLIME_X1_COUNT0 = 6
export const SLIME_X1_SPEED0 = 0.87
export const SLIME_X1_SPEED_PER = 0.02
export const SLIME_X3_HP_FACTOR = 0.25
export const SLIME_X3_SPEED_BONUS = 0.1
export const SLIME_X1_CRYSTALS = 2
export const SLIME_X3_SPLIT_COUNT = 3
export const SLIME_X3_INVULN_SEC = 0.3

/** u = max(0, 秒 − 180) */
export function slimeAge(elapsedSec) {
  return Math.max(0, elapsedSec - SLIME_X1_UNLOCK_SEC)
}

export function slimeX1Hp(elapsedSec, extra = 0) {
  return SLIME_X1_HP0 + (SLIME_X1_HP_PER + extra) * Math.floor(slimeAge(elapsedSec) / SLIME_X1_STEP_SEC)
}

export function slimeX1SpawnCount(elapsedSec) {
  if (elapsedSec < SLIME_X1_UNLOCK_SEC) return 0
  return SLIME_X1_COUNT0 + Math.floor(slimeAge(elapsedSec) / SLIME_X1_STEP_SEC)
}

/** 0.87 + 0.03×floor(u/45)，不套 1.4 帽 */
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

export function graySelfDmgMax(elapsedSec = 0) {
  return GRAY_SELF_DMG_MAX0 + Math.floor(Math.max(0, elapsedSec) / 60)
}

/** 每棵灰树独立掷点：1～(8+floor(秒/60))。 */
export function rollGraySelfDamage(random, elapsedSec = 0) {
  const max = graySelfDmgMax(elapsedSec)
  const span = max - GRAY_SELF_DMG_MIN + 1
  return GRAY_SELF_DMG_MIN + Math.floor(random() * span)
}

export function grayTreeSpawnInterval(t) {
  return Math.max(GRAY_INTERVAL_MIN, GRAY_INTERVAL0 * GRAY_INTERVAL_DECAY ** t)
}

export function grayTreeHp(t) {
  return GRAY_HP0 * (1 + GRAY_HP_GROWTH * t)
}

/**
 * P25 环绕生成：优先落在「视野边缘外 1～3 身位」的矩形环带（从近到远包围角色），
 * 再兜底原环形带。均保证视野外且距焦点 ≤ SPAWN_R_NEAR。
 * @returns {{ x: number, y: number }}
 */
export function pickNearOutOfView(focus, camera, random, margin = 14) {
  for (let i = 0; i < 40; i++) {
    const pad = SPAWN_PAD_MIN + random() * (SPAWN_PAD_MAX - SPAWN_PAD_MIN)
    const x0 = camera.x - pad
    const y0 = camera.y - pad
    const x1 = camera.x + VIEW_WIDTH + pad
    const y1 = camera.y + VIEW_HEIGHT + pad
    const w = x1 - x0
    const h = y1 - y0
    const per = 2 * (w + h)
    const t = random() * per
    let x
    let y
    if (t < w) {
      x = x0 + t
      y = y0
    } else if (t < w + h) {
      x = x1
      y = y0 + (t - w)
    } else if (t < w + h + w) {
      x = x1 - (t - w - h)
      y = y1
    } else {
      x = x0
      y = y1 - (t - w - h - w)
    }
    x = clamp(x, margin, WORLD_WIDTH - margin)
    y = clamp(y, margin, WORLD_HEIGHT - margin)
    if (isNearAndOutOfView(x, y, focus.x, focus.y, camera, SPAWN_R_NEAR)) return { x, y }
  }
  const rMin = VIEW_HALF_DIAG + 24
  const rMax = SPAWN_R_NEAR
  const span = Math.max(8, rMax - rMin)
  for (let i = 0; i < 40; i++) {
    const ang = random() * Math.PI * 2
    const r = rMin + random() * span
    const x = clamp(focus.x + Math.cos(ang) * r, margin, WORLD_WIDTH - margin)
    const y = clamp(focus.y + Math.sin(ang) * r, margin, WORLD_HEIGHT - margin)
    if (isNearAndOutOfView(x, y, focus.x, focus.y, camera, SPAWN_R_NEAR)) return { x, y }
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

export const SCORPION_UNLOCK_SEC = 300
export const SCORPION_HP0 = 105
export const SCORPION_HP_PER = 20
export const SCORPION_HP_STEP_SEC = 45
export const SCORPION_COUNT0 = 2
export const SCORPION_COUNT_STEP_SEC = 30
export const SCORPION_INTERVAL = 20
export const SCORPION_SPEED0 = 0.8
export const SCORPION_SPEED_PER = 0.04
export const SCORPION_SPEED_STEP_SEC = 45
export const SCORPION_CRYSTALS = 2
export const SCORPION_CHASE_RANGE = BODY * 8
export const SCORPION_HOLD_RANGE = BODY * 3
export const SCORPION_FLEE_STOP = BODY * 7
export const SCORPION_SHOT_PERIOD = 5
export const SCORPION_FIRST_SHOT_RAND_MAX_SEC = 5
export const SCORPION_BULLET_SPEED = 180

export function scorpionAge(elapsedSec) {
  return Math.max(0, elapsedSec - SCORPION_UNLOCK_SEC)
}

export function scorpionHp(elapsedSec) {
  return SCORPION_HP0 + SCORPION_HP_PER * Math.floor(scorpionAge(elapsedSec) / SCORPION_HP_STEP_SEC)
}

export function scorpionSpawnCount(elapsedSec) {
  if (elapsedSec < SCORPION_UNLOCK_SEC) return 0
  return SCORPION_COUNT0 + Math.floor(scorpionAge(elapsedSec) / SCORPION_COUNT_STEP_SEC)
}

export function scorpionSpeedMul(elapsedSec) {
  return SCORPION_SPEED0 + SCORPION_SPEED_PER * Math.floor(scorpionAge(elapsedSec) / SCORPION_SPEED_STEP_SEC)
}

export function scorpionSpeedPx(elapsedSec) {
  return SPEED_PX_PER_UNIT * scorpionSpeedMul(elapsedSec)
}

/** P25 毒刺怪：300s 起接管蘑菇怪刷怪位；肉盾、击退抗性 1 身位、掉 4 结晶每个 20% 高级。 */
export const STINGER_UNLOCK_SEC = 300
export const STINGER_HP0 = 260
export const STINGER_HP_PER = 25
export const STINGER_HP_STEP_SEC = 45
export const STINGER_COUNT0 = 6
export const STINGER_COUNT_DIV = 180
export const STINGER_INTERVAL = 5
export const STINGER_SPEED0 = 0.7
export const STINGER_SPEED_PER = 0.04
export const STINGER_SPEED_STEP_SEC = 45
export const STINGER_CRYSTALS = 4
export const STINGER_ADVANCED_CHANCE = 0.2

/** P27 强化怪（难度二）：概率 min(1, 0.02 + 0.02×floor(分钟))；每颗结晶 50% 高级。 */
export const ELITE_CHANCE_BASE = 0.02
export const ELITE_CHANCE_PER_MIN = 0.02
export const ELITE_ADVANCED_CHANCE = 0.5

export function stingerAge(elapsedSec) {
  return Math.max(0, elapsedSec - STINGER_UNLOCK_SEC)
}

/** 毒刺怪血：260 + (25+extra)×floor((秒−300)/45)。 */
export function stingerHp(elapsedSec, extra = 0) {
  return STINGER_HP0 + (STINGER_HP_PER + extra) * Math.floor(stingerAge(elapsedSec) / STINGER_HP_STEP_SEC)
}

/** 每波 6 + floor(秒/180) 只；未到 300s 为 0。 */
export function stingerSpawnCount(elapsedSec) {
  if (elapsedSec < STINGER_UNLOCK_SEC) return 0
  return STINGER_COUNT0 + Math.floor(Math.max(0, elapsedSec) / STINGER_COUNT_DIV)
}

/** 0.70 + 0.04×floor((秒−300)/45)，无帽。 */
export function stingerSpeedMul(elapsedSec) {
  return STINGER_SPEED0 + STINGER_SPEED_PER * Math.floor(stingerAge(elapsedSec) / STINGER_SPEED_STEP_SEC)
}

export function stingerSpeedPx(elapsedSec) {
  return SPEED_PX_PER_UNIT * stingerSpeedMul(elapsedSec)
}

export const ICE_MAN_UNLOCK_SEC = 420
export const ICE_MAN_HP = 4000
/** P25：每个结晶独立 10% 概率为高级结晶。 */
export const ICE_MAN_ADVANCED_CHANCE = 0.1
/** P21 脱战回血：2 身位内无角色持续此时长后，每 1 秒回 ICE_REGEN_PER_SEC。 */
export const ICE_REGEN_DELAY_SEC = 3
export const ICE_REGEN_RANGE = BODY * 2
export const ICE_REGEN_PER_SEC = 20
export const ICE_MAN_HP_GROWTH = 1.4
export const ICE_MAN_RESPAWN_SEC = 180
export const ICE_MAN_CRYSTALS = 150

export function iceManRespawnHp(deaths) {
  return Math.round(ICE_MAN_HP * ICE_MAN_HP_GROWTH ** Math.max(0, deaths))
}
export const ICE_MAN_KNOCKBACK_SCALE = 0.3
export const ICE_MAN_SPEED_MUL = 0.7
export const ICE_FLEE_HURT = 400
export const ICE_FLEE_SEC = 10
export const ICE_FLEE_SPEED_ADD = 0.2
export const ICE_DASH_PERIOD = 12
export const ICE_DASH_TELEGRAPH = 0.25
export const ICE_DASH_DIST = BODY * 8
export const ICE_DASH_SPEED_MUL = 3.2
export const ICE_DASH_MIN = 1
export const ICE_DASH_MAX = 6
export const ICE_BARRAGE_PERIOD = 17
export const ICE_BARRAGE_PATTERN_GAP = 0.65
export const ICE_BARRAGE_SEQ_GAP = 0.15
export const ICE_BARRAGE_PATTERNS = ['corners_sim', 'cross_sim', 'corners_seq', 'cross_seq']
export const ICE_BULLET_SPEED = 200
export const ICE_BULLET_DMG = 2
export const ICE_ORCHID_PERIOD = 32
export const ICE_ORCHID_COUNT = 3
export const ORCHID_HP = 1
export const ORCHID_SPEED_MUL = 1.17
export const ORCHID_HEAL_PERIOD = 15
export const ORCHID_HEAL_AMOUNT = 10
export const ORCHID_ARMOR_EVERY = 2
export const ORCHID_HEAL_RANGE = BODY * 3
export const ICE_VIEW_PAD = 18
/** P27：冰人完全离开视野（超出 1 身位）且未逃跑时才回视野。 */
export const ICE_LEAVE_MARGIN = BODY
export const DUMMY_HP = 999
export const DUMMY_REGEN_PER_SEC = 500
export const DUMMY_OFFSET = BODY * 3
export const DUMMY_FLASH_SEC = 0.12

export function cameraCorners(camera) {
  return [
    { x: camera.x, y: camera.y },
    { x: camera.x + VIEW_WIDTH, y: camera.y },
    { x: camera.x, y: camera.y + VIEW_HEIGHT },
    { x: camera.x + VIEW_WIDTH, y: camera.y + VIEW_HEIGHT },
  ]
}

export function cameraEdgeMids(camera) {
  const mx = camera.x + VIEW_WIDTH / 2
  const my = camera.y + VIEW_HEIGHT / 2
  return [
    { x: mx, y: camera.y },
    { x: mx, y: camera.y + VIEW_HEIGHT },
    { x: camera.x, y: my },
    { x: camera.x + VIEW_WIDTH, y: my },
  ]
}

export function shuffleCopy(list, rng) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function rollIceDashCount(rng) {
  return ICE_DASH_MIN + Math.floor(rng() * (ICE_DASH_MAX - ICE_DASH_MIN + 1))
}

/** 一套弹幕：每条 { t, group:'corners'|'cross', i }，开火时用当时 camera。 */
export function planBarrageSet(patterns, gapPat = ICE_BARRAGE_PATTERN_GAP, gapSeq = ICE_BARRAGE_SEQ_GAP) {
  const shots = []
  let t = 0
  for (const p of patterns) {
    const group = p.startsWith('corners') ? 'corners' : 'cross'
    const seq = p.endsWith('seq')
    if (seq) {
      for (let i = 0; i < 4; i++) shots.push({ t: t + i * gapSeq, group, i })
      t += 3 * gapSeq + gapPat
    } else {
      for (let i = 0; i < 4; i++) shots.push({ t, group, i })
      t += gapPat
    }
  }
  return shots
}

export function barragePoints(group, camera) {
  return group === 'corners' ? cameraCorners(camera) : cameraEdgeMids(camera)
}

export function playerSpeedUnits(player) {
  if (player?.speedUnits != null) return player.speedUnits
  if (player?.speed != null) return player.speed / SPEED_PX_PER_UNIT
  return 1.2
}

export function playerSpeedPx(player) {
  if (player?.speed != null) return player.speed
  return playerSpeedUnits(player) * SPEED_PX_PER_UNIT
}

export function clampToView(x, y, camera, pad = ICE_VIEW_PAD) {
  const x0 = camera.x + pad
  const y0 = camera.y + pad
  const x1 = camera.x + VIEW_WIDTH - pad
  const y1 = camera.y + VIEW_HEIGHT - pad
  return {
    x: clamp(x, Math.min(x0, x1), Math.max(x0, x1)),
    y: clamp(y, Math.min(y0, y1), Math.max(y0, y1)),
  }
}

export function inCameraView(x, y, camera, pad = 0) {
  return isInView(x, y, camera, pad)
}

export function lowestHpTarget(self, list) {
  let best = null
  for (const e of list) {
    if (e === self || e.hp <= 0 || e.kind === 'dummy') continue
    if (!best || e.hp < best.hp) best = e
  }
  return best
}
