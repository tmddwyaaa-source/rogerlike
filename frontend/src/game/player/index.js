/**
 * M4 玩家：游侠。贴图 + 阴影；火柴人仅作无 Image 时兜底。
 *
 * M5 可读/写：facingDir ('D'|'S'|'U')、flipX、charging、attackT。
 * P5：player.queueLevelUpFx(n)
 * P13：法师 2 心 / 战士 4 心；伤害数字收间距、≥100 黄边 ≥200 红边。
 * P14：回血绿边 spawnHealNum；开局目标 queueObjectiveFx（不自动开始）。
 * P15：局内不再画开局目标字。
 * P25：三娃护甲（armor / addArmor / getArmor）、六娃失锁脉冲（unlockLevel / applyUnlockPulse / unlockDurationFor）。
 * P42：受击后限时移速加成 applyHurtSpeedBuff（增量法，不改 speedUnits；计时走 update；死亡不再生效）。
 * P42：power「定神」applyPower('steady') / consumeSteadyCrit（静止 0.15s 就绪；只有 WASD 移动会打断，瞄准/蓄力/攻击后摇/受击都不打断；暴击判定在战斗侧）。
 * P42 批次7：小金刚「再获得一次」玩家侧——setVajraComplete(on) 后三娃护甲按层数 ×2、六娃失锁按 picks+1 层（取代旧的「效果值 +10%」口径）。
 * P42 批次7：生生不息档 8 复活接口 tryRevive / isReviveReady / reviveHealsLeft（冷却 = 复活后再发生 5 次真实回血；档位判定由 M1 接线）。
 */
import {
  BODY,
  BODY_W,
  SPEED_PX_PER_UNIT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  screenToWorld,
} from '../constants.js'
import { drawStickman } from '../render/stickman.js'
import {
  CHAR_DISPLAY,
  DEATH_ANIM_SEC,
  HURT_SEC,
  deathAnimDone,
  drawRanger,
  facingFromAngle,
  loadRangerAssets,
  resolveAnim,
  resolveCharId,
} from '../render/ranger.js'
import { loadDamageNums } from '../render/dmgnum.js'
import {
  drawLevelUpFx,
  hasLevelUpFx,
  levelUpFxBusy,
  levelUpFxRemaining,
  loadLevelUpFx,
  queueLevelUpFx as enqueueLevelUp,
  stepLevelUpFx,
} from '../render/levelup.js'
import {
  drawObjectiveFx,
  queueObjectiveFx as enqueueObjective,
  resetObjectiveFx,
  stepObjectiveFx,
} from '../render/objective.js'

export { drawStickman, STICKMAN_H, STICKMAN_W } from '../render/stickman.js'
export {
  CHAR_DISPLAY,
  CHAR_FOLDERS,
  DEATH_ANIM_SEC,
  deathAnimDone,
  drawRanger,
  facingFromAngle,
  loadRangerAssets,
  resolveAnim,
  resolveCharId,
} from '../render/ranger.js'
export {
  drawDamageNums,
  loadDamageNums,
  resetDamageNums,
  spawnDamageNum,
  spawnHealNum,
  updateDamageNums,
} from '../render/dmgnum.js'
export {
  OBJECTIVE_LIFE,
  OBJECTIVE_TEXT,
  drawObjectiveFx,
  hasObjectiveFx,
  queueObjectiveFx,
  resetObjectiveFx,
  stepObjectiveFx,
} from '../render/objective.js'
export {
  LEVELUP_LIFE,
  LEVELUP_SRC,
  LEVELUP_STAGGER,
  drawLevelUpFx,
  hasLevelUpFx,
  levelUpFxBusy,
  levelUpFxRemaining,
  loadLevelUpFx,
  queueLevelUpFx,
} from '../render/levelup.js'

export const CHAR_NAME = '游侠'
export const HP_MAX = 3
/** 按角色初始心数。HP_MAX 仍是游侠默认。 */
export const HP_BY_CHAR = {
  ranger: 3,
  warrior: 4,
  mage: 2,
}
/** 设计移速单位 1.20 */
export const PLAYER_SPEED_UNITS = 1.2
export const PLAYER_SPEED = PLAYER_SPEED_UNITS * SPEED_PX_PER_UNIT
export const IFRAME_SEC = 0.85
export const SCATTER_COUNT = 16
export const SCATTER_LIFE = 0.7
export const WALK_FPS = 10

/**
 * P42 生生不息档 3：受击后 1.5s 移速 +0.20 设计单位。
 * 只在本模块给默认值/文档口径；触发与档位判定由 M6 定义、M1 在 match.js 的 onHurt 里接线。
 */
export const HURT_SPEED_BUFF_UNITS = 0.2
export const HURT_SPEED_BUFF_SEC = 1.5

/**
 * P42 power「定神」：连续静止 0.15s 进入就绪 → 下一次攻击必暴。
 *
 * 0.15s **短于武器攻击间隔 FIRE_INTERVAL（0.48s）**：站着不动时，每次攻击消费掉就绪后，
 * 到下一次攻击前早已重新站满 0.15s —— 所以「一直站着 = 每次攻击都能触发」是计时自然覆盖的结果，
 * 本模块不需要额外实现。
 *
 * 2026-09-12 修补（用户实机反馈「站着完全吃不到定神」）：**只有 WASD 位移输入会清零重算**。
 * 本作开火是「按住左键蓄力 → 松手射出」，之前把 charging / attackT 也算打断，导致按左键第一帧
 * 就清空就绪；受击同理。现在瞄准（mousemove 改 facing）、蓄力、攻击后摇、受击都不打断，
 * 死亡（hp<=0）仍清零。
 *
 * 本模块只维护「静止计时 + 就绪状态 + 消费接口」；暴击本身由战斗侧（TASK-042/033）在暴击判定前调
 * `consumeSteadyCrit()` 决定，玩家侧不实现暴击。
 */
export const STEADY_STILL_SEC = 0.15

/**
 * P42 批次7：小金刚「再获得一次」——集齐七兄弟后，每个兄弟的升级效果**按层数 +1 生效**。
 *
 * 玩家侧覆盖两个兄弟，都靠 `setVajraComplete(true)` 开关（由 M1 在 match.js 的 syncVajra 里接线，
 * player 自己**不读**羁绊档位）：
 * - **三娃**（护甲）：再获得一次 = 同一份护甲再发一次 ⇒ `addArmor(n)` 实际 +2n 层（1 层 → 2 层）；
 * - **六娃**（失锁）：时长公式按 `picks + 1` 层算 ⇒ `1.0s + 0.5s × (层数 + 1)`。
 *
 * **旧的「效果值 +10%（加法）」口径作废**（三娃 +1 层甲 / 六娃 +0.25s）：player 侧不留任何
 * ×1.1 / +10% / +0.25s 分支 —— 那是「加法百分比」，与「再获得一次」是两回事。
 */
export const VAJRA_REOBTAIN_LAYERS = 1

/**
 * P42 批次7 · 生生不息**档 8**：受致命伤时以 **1 血复活**。
 * 冷却口径 = 复活后需要再发生 **5 次真实回血**（每次 `heal()` 真的增加了 hp 计 1 次，满血不回血不计）。
 */
export const REVIVE_HEAL_COUNT = 5

/** P25 三娃护甲：整数层，可无限叠，抵挡一次完整伤害。 */
export const ARMOR_OUTLINE = '#e0b84a'

/** P25 六娃失锁脉冲（角色侧常量）。 */
export const UNLOCK_PULSE_INTERVAL_SEC = 10
export const UNLOCK_RADIUS_UNITS = 3
export const UNLOCK_RADIUS = UNLOCK_RADIUS_UNITS * BODY
export const UNLOCK_BASE_SEC = 1.0
export const UNLOCK_PER_LAYER_SEC = 0.5

/** P27 六娃失锁扩散圈。 */
export const UNLOCK_RING_COLOR = '#3F48CC'
export const UNLOCK_RING_LIFE_SEC = 0.6

/** 失锁时长：基础 1.0s，每层 +0.5s。 */
export function unlockDurationFor(layers) {
  return UNLOCK_BASE_SEC + UNLOCK_PER_LAYER_SEC * Math.max(0, layers | 0)
}

/** P27 扩散圈进度 0→1；接近边缘(1) 时颜色最淡。 */
export function unlockRingProgress(ring) {
  if (!ring || !(ring.dur > 0)) return 0
  return Math.max(0, Math.min(1, (ring.t ?? 0) / ring.dur))
}

/** P27 扩散圈透明度：越接近范围边缘越淡。 */
export function unlockRingAlpha(ring) {
  return 1 - unlockRingProgress(ring)
}

const CODE_TO_WASD = {
  KeyW: 'w',
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
}

/** 用 KeyboardEvent.code，避免输入法把 keyup 吃掉导致粘键。 */
export function applyMovementCode(keys, code, down) {
  const slot = CODE_TO_WASD[code]
  if (!slot || !keys) return false
  keys[slot] = Boolean(down)
  return true
}

/** 升级/暂停/失焦时由 M1 或本模块调用。 */
export function clearMovementKeys(target) {
  const k = target?.keys ?? target
  if (!k) return
  k.w = false
  k.a = false
  k.s = false
  k.d = false
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function spawnScatter(player, random) {
  for (let i = 0; i < SCATTER_COUNT; i++) {
    const ang = (Math.PI * 2 * i) / SCATTER_COUNT + random() * 0.5
    const spd = 40 + random() * 80
    player.scatter.push({
      x: player.x + (random() - 0.5) * BODY_W,
      y: player.y + (random() - 0.5) * BODY,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: SCATTER_LIFE * (0.55 + random() * 0.45),
      color: random() < 0.35 ? '#d4c4a8' : '#2c2c28',
    })
  }
}

function stepScatter(player, dt) {
  for (let i = player.scatter.length - 1; i >= 0; i--) {
    const p = player.scatter[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 50 * dt
    p.life -= dt
    if (p.life <= 0) player.scatter.splice(i, 1)
  }
}

function drawScatter(ctx, player) {
  for (const p of player.scatter) {
    ctx.fillStyle = p.color
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
  }
}

/** P27 六娃失锁扩散圈：每次脉冲从角色向外扩散，接近边缘越淡，不超范围。 */
function stepUnlockRings(player, dt) {
  for (let i = player.unlockRings.length - 1; i >= 0; i--) {
    const ring = player.unlockRings[i]
    ring.t += dt
    if (ring.t >= ring.dur) player.unlockRings.splice(i, 1)
  }
}

function drawUnlockRings(ctx, player) {
  const rings = player.unlockRings
  if (!ctx || !rings || !rings.length) return
  if (typeof ctx.beginPath !== 'function' || typeof ctx.arc !== 'function') return
  const prevAlpha = ctx.globalAlpha
  for (const ring of rings) {
    const progress = unlockRingProgress(ring)
    const radius = ring.r * progress
    if (radius <= 0.5) continue
    ctx.globalAlpha = Math.max(0, Math.min(1, unlockRingAlpha(ring)))
    ctx.strokeStyle = UNLOCK_RING_COLOR
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = prevAlpha
}

/**
 * P21：opts.onHurt 在实际扣血时被调用一次（无敌挡掉 / godMode 兜底不扣血不调；死亡那下也调）。
 * P25：armor 可叠护甲（addArmor / getArmor）；六娃失锁脉冲（addUnlockLevel / applyUnlockPulse）。
 *
 * @param {{
 *   x?: number, y?: number, speed?: number, speedUnits?: number,
 *   keys?: object, random?: () => number, godMode?: boolean, name?: string,
 *   charId?: 'ranger'|'warrior'|'mage', onHurt?: () => void,
 *   getTargets?: () => object[], onUnlockPulse?: (info: object) => void,
 * }} [opts]
 */
export function createPlayer(opts = {}) {
  const random = opts.random ?? Math.random
  const keys = opts.keys ?? { w: false, a: false, s: false, d: false }
  let unbind = () => {}
  const speedUnits = opts.speedUnits ?? PLAYER_SPEED_UNITS
  const charId = resolveCharId(opts.charId)
  const hp0 = HP_BY_CHAR[charId] ?? HP_MAX
  const onHurt = opts.onHurt
  const getTargets = opts.getTargets
  const onUnlockPulse = opts.onUnlockPulse

  const player = {
    charId,
    name: opts.name ?? CHAR_DISPLAY[charId] ?? CHAR_NAME,
    x: opts.x ?? WORLD_WIDTH / 2,
    y: opts.y ?? WORLD_HEIGHT / 2,
    w: BODY_W,
    h: BODY,
    /** 接触判定用缩小 hurtbox */
    hurtW: Math.max(4, Math.round(BODY_W * 0.55)),
    hurtH: Math.max(6, Math.round(BODY * 0.45)),
    hp: hp0,
    hpMax: hp0,
    speedUnits,
    speed: opts.speed ?? speedUnits * SPEED_PX_PER_UNIT,
    facing: 0,
    facingDir: 'S',
    flipX: false,
    charging: false,
    attackT: 0,
    hurtT: 0,
    /** P42 受击限时移速加成剩余秒数 / 本次已加上的 px/s 增量（到期原样减回）。 */
    hurtSpeedT: 0,
    hurtSpeedDelta: 0,
    /**
     * P42 power「定神」：是否已获得 / 连续静止秒数 / 是否已就绪（下次攻击必暴）。
     * 与 invuln / hurtT / hurtSpeedT 各自独立计时，互不影响。
     */
    steadyEnabled: false,
    steadyT: 0,
    steadyArmed: false,
    /** P42 批次7：小金刚集齐标记（M1 在 match.js 的 syncVajra 里 setVajraComplete；player 不读羁绊档位）。 */
    vajraComplete: false,
    /** P42 批次7 · 档 8 复活：是否就绪 / 复活后还差几次真实回血才恢复就绪（只读查询走 reviveHealsLeft()）。 */
    reviveReady: true,
    reviveCdLeft: 0,
    deathT: 0,
    animTime: 0,
    anim: 'Idle',
    invuln: 0,
    armor: 0,
    unlockLevel: 0,
    unlockTimer: 0,
    unlockPulseCount: 0,
    unlockRings: [],
    scatter: [],
    levelUpFx: [],
    objectiveT: 0,
    walkFrame: 0,
    moving: false,
    godMode: Boolean(opts.godMode),
    keys,
    update,
    takeDamage,
    heal,
    applyHurtSpeedBuff,
    /** P42 power：本模块只认 `'steady'`，其它 id 返回 false（由战斗侧处理）。 */
    applyPower,
    consumeSteadyCrit,
    isSteadyArmed: () => player.steadyEnabled && player.steadyArmed,
    addVitality,
    addEmptyHpMax,
    lookAt,
    isInvincible: () => player.invuln > 0,
    addArmor,
    getArmor,
    addUnlockLevel,
    setUnlockLevel,
    currentUnlockDuration,
    /** P42 批次7：小金刚「再获得一次」开关与六娃当前生效层数。 */
    setVajraComplete,
    getVajraComplete,
    effectiveUnlockLayers,
    /** P42 批次7 · 档 8 复活接口（档位判定由 M1 接线，player 只认「就绪/冷却」）。 */
    tryRevive,
    isReviveReady,
    reviveHealsLeft,
    applyUnlockPulse,
    isTargetBlind,
    isEnemyUnlocked,
    unlockRemaining,
    deathAnimDone: () => deathAnimDone(player),
    draw,
    loadAssets,
    bindInput,
    unbindInput: () => unbind(),
    setGodMode(v) {
      player.godMode = Boolean(v)
    },
    setCharging(v) {
      player.charging = Boolean(v)
    },
    queueLevelUpFx(n = 1) {
      return enqueueLevelUp(player, n, random)
    },
    queueObjectiveFx() {
      return enqueueObjective(player)
    },
    resetObjectiveFx() {
      resetObjectiveFx(player)
    },
    hasLevelUpFx() {
      return hasLevelUpFx(player)
    },
    levelUpFxBusy() {
      return levelUpFxBusy(player)
    },
    levelUpFxRemaining() {
      return levelUpFxRemaining(player)
    },
    clearMovementKeys() {
      clearMovementKeys(keys)
    },
  }

  function applyFacing() {
    const f = facingFromAngle(player.facing)
    player.facingDir = f.facingDir
    player.flipX = f.flipX
  }

  function lookAt(wx, wy) {
    player.facing = Math.atan2(wy - player.y, wx - player.x)
    applyFacing()
  }

  function takeDamage(n = 1) {
    if (n <= 0 || player.hp <= 0 || player.invuln > 0) return false
    // P25 三娃护甲：先扣 1 层，抵挡该次完整伤害（该次不掉血，不触发 onHurt）。
    if (player.armor > 0) {
      player.armor -= 1
      player.invuln = IFRAME_SEC
      player.hurtT = HURT_SEC
      spawnScatter(player, random)
      return false
    }
    let next = player.hp - n
    if (player.godMode) next = Math.max(1, next)
    if (next === player.hp) return false
    player.hp = Math.max(0, next)
    player.invuln = IFRAME_SEC
    player.hurtT = HURT_SEC
    spawnScatter(player, random)
    onHurt?.()
    return true
  }

  function heal(n = 1) {
    if (n <= 0 || player.hp <= 0) return false
    const next = Math.min(player.hpMax, player.hp + n)
    if (next === player.hp) return false
    player.hp = next
    // P42 批次7 · 档 8：**真实回血**各计 1 次（按次不按血量）；满血 / 死亡 / 非法调用在上面已 return，不计。
    stepReviveCooldown()
    return true
  }

  /**
   * P42 生生不息档 3：受击后限时移速加成（增量法）。
   *
   * - 激活：`player.speed += units * SPEED_PX_PER_UNIT`；到期把**同一增量原样减回**。
   * - **不改 `player.speedUnits`**：敏捷 / 天行健 是直接改 speedUnits 与 speed 的（见 ui/session.js），
   *   增量法与之相加互不打架、到期也不会把它们加的那份一起抹掉。
   * - 计时期间再次调用**只刷新计时、不叠加速度**（连续受击不滚雪球），沿用首次生效的增量。
   * - 与 invuln / hurtT 各自独立计时；玩家已死亡时不再生效（死亡那次 onHurt 也不会挂上）。
   *
   * @param {number} units 设计单位增量（档 3 = 0.20）
   * @param {number} sec 持续秒数（档 3 = 1.5）
   * @returns {boolean} 是否处于加成生效状态
   */
  function applyHurtSpeedBuff(units, sec) {
    const u = Number(units)
    const s = Number(sec)
    if (player.hp <= 0) return false
    if (!Number.isFinite(u) || u <= 0 || !Number.isFinite(s) || s <= 0) return false
    if (player.hurtSpeedT > 0) {
      // 已在加成中：只刷新计时，速度不叠。
      player.hurtSpeedT = s
      return true
    }
    const delta = u * SPEED_PX_PER_UNIT
    player.hurtSpeedDelta = delta
    player.speed += delta
    player.hurtSpeedT = s
    return true
  }

  /** P42 定神：清空静止计时与就绪状态（移动 / 攻击 / 受伤 / 死亡时调用）。 */
  function resetSteady() {
    player.steadyT = 0
    player.steadyArmed = false
  }

  /**
   * P42 power「定神」（玩家侧）：只维护静止计时与就绪状态，**不实现暴击**。
   *
   * - UI/M6 授予 power 时把同一 id 交给战斗侧与本模块（契约 `ctx.player.applyPower(id)`）；
   *   本模块只认 `'steady'` → 启用并返回 true；其它 id（`'rapid'` / `'pierce_amp'` / `'sp'`）返回 false。
   * - 重复调用同一个 id 幂等（UI 侧保证唯一性，这里不重置已累计的静止计时）。
   *
   * @param {string} id
   * @returns {boolean} 是否由本模块处理
   */
  function applyPower(id) {
    if (id !== 'steady') return false
    if (!player.steadyEnabled) {
      player.steadyEnabled = true
      resetSteady()
    }
    return true
  }

  /**
   * P42 定神消费接口：就绪时返回 true 并**立即清零**（只作用于下一次攻击，不能连吃）；
   * 未就绪 / 未获得 / 已死亡返回 false。战斗侧（TASK-027）在暴击判定前调用。
   */
  function consumeSteadyCrit() {
    if (!player.steadyEnabled || player.hp <= 0 || !player.steadyArmed) return false
    resetSteady()
    return true
  }

  /**
   * P42 定神计时：连续 `STEADY_STILL_SEC`（0.15s）**没有 WASD 位移输入**才就绪。
   *
   * 2026-09-12 修补：打断条件**只保留位移输入**。`charging`（按住左键蓄力）与 `attackT>0`
   * （开火后摇）都**不再**打断 —— 否则「按住蓄力」这一必要操作会让定神永远来不及就绪
   * （实机表现为「站着也吃不到 +100 暴击」）；受击同样不打断（见 takeDamage）。
   * 用本帧输入判定，不依赖 update 内部对 player.moving 的赋值顺序。
   * 与 invuln / hurtT / hurtSpeedT 各自独立，互不影响；死亡（hp<=0）仍清零、不再就绪。
   */
  function stepSteady(dt) {
    if (!player.steadyEnabled) return
    if (player.hp <= 0) {
      resetSteady()
      return
    }
    const movingInput = Boolean(keys.w || keys.a || keys.s || keys.d)
    if (movingInput) {
      resetSteady()
      return
    }
    player.steadyT += dt
    if (player.steadyT >= STEADY_STILL_SEC - 1e-9) {
      player.steadyArmed = true
    }
  }

  function addVitality() {
    player.hpMax += 1
    player.hp = Math.min(player.hpMax, player.hp + 1)
    return true
  }

  function addEmptyHpMax() {
    player.hpMax += 1
    return true
  }

  /**
   * P42 批次7：小金刚集齐标记（M1 在 match.js 的 syncVajra 里接线，与 `combat.setVajraComplete` 同一处）。
   * player **不读**羁绊档位，只认这个开关。
   */
  function setVajraComplete(on) {
    player.vajraComplete = Boolean(on)
    return player.vajraComplete
  }

  function getVajraComplete() {
    return player.vajraComplete
  }

  /** P42 批次7：六娃失锁的**生效层数** = 已选层数 +（小金刚「再获得一次」的 1 层）。 */
  function effectiveUnlockLayers() {
    return player.unlockLevel + (player.vajraComplete ? VAJRA_REOBTAIN_LAYERS : 0)
  }

  function addArmor(n = 1) {
    const add = Math.max(0, Math.floor(Number(n) || 0))
    // P42 批次7：小金刚「再获得一次」= 同一份护甲再发一次 ⇒ 实际 +2n 层（1 层 → 2 层，整数层不变）。
    const grant = player.vajraComplete ? add * 2 : add
    player.armor += grant
    return player.armor
  }

  function getArmor() {
    return player.armor
  }

  function addUnlockLevel(n = 1) {
    const add = Math.max(0, Math.floor(Number(n) || 0))
    player.unlockLevel += add
    return player.unlockLevel
  }

  function setUnlockLevel(n) {
    player.unlockLevel = Math.max(0, Math.floor(Number(n) || 0))
    return player.unlockLevel
  }

  function currentUnlockDuration() {
    // P42 批次7：六娃按 picks+1 生效（小金刚「再获得一次」）。
    return unlockDurationFor(effectiveUnlockLayers())
  }

  /**
   * P42 批次7 · 生生不息档 8：致命伤 → **1 血复活**（接口层，只提供「就绪 / 冷却」）。
   *
   * - 由 M1 在 `match.js` 的 `onHurt` 里按「生生不息档位 ≥ 8 且 hp ≤ 0」调用；player 不读羁绊档位。
   * - 就绪 → `hp` 置 1、清掉死亡计时（**不进死亡流程**）、消耗这次机会并进入冷却（再发生
   *   `REVIVE_HEAL_COUNT` 次真实回血后恢复就绪），返回 true；
   * - 未就绪 → 返回 false；此时死亡流程与既有行为**完全不变**。
   */
  function tryRevive() {
    if (!player.reviveReady) return false
    player.reviveReady = false
    player.reviveCdLeft = REVIVE_HEAL_COUNT
    player.hp = 1
    player.deathT = 0
    return true
  }

  function isReviveReady() {
    return player.reviveReady
  }

  /** 还差几次真实回血才恢复就绪；已就绪返回 0。 */
  function reviveHealsLeft() {
    return player.reviveReady ? 0 : player.reviveCdLeft
  }

  /** P42 批次7：一次**真实回血**记 1 次；满 5 次恢复就绪（每次 heal 调用算 1 次，不按回血量）。 */
  function stepReviveCooldown() {
    if (player.reviveReady) return
    player.reviveCdLeft -= 1
    if (player.reviveCdLeft <= 0) {
      player.reviveCdLeft = 0
      player.reviveReady = true
    }
  }

  /** P25/P30 六娃失锁：对 3 身位内活敌写入剩余秒数 unlockT（M6/enemies 只读并负责衰减）。 */
  function applyUnlockPulse(targets, duration) {
    const dur = duration ?? unlockDurationFor(effectiveUnlockLayers())
    if (!Array.isArray(targets)) return 0
    const r = UNLOCK_RADIUS
    let n = 0
    for (const t of targets) {
      if (!t || (t.hp != null && t.hp <= 0)) continue
      const d = Math.hypot((t.x ?? 0) - player.x, (t.y ?? 0) - player.y)
      if (d <= r) {
        t.unlockT = Math.max(t.unlockT ?? 0, dur)
        n += 1
      }
    }
    return n
  }

  /** M6/enemies 约定读取的失锁状态接口：目标此刻是否失锁（不锁定角色）。 */
  function isTargetBlind(ent) {
    return (ent?.unlockT ?? 0) > 0
  }

  function isEnemyUnlocked(ent) {
    return isTargetBlind(ent)
  }

  function unlockRemaining(ent) {
    return Math.max(0, ent?.unlockT ?? 0)
  }

  function stepUnlockPulse(dt) {
    if (player.unlockLevel <= 0 || player.hp <= 0) return
    player.unlockTimer += dt
    while (player.unlockTimer >= UNLOCK_PULSE_INTERVAL_SEC) {
      player.unlockTimer -= UNLOCK_PULSE_INTERVAL_SEC
      player.unlockPulseCount += 1
      const duration = unlockDurationFor(effectiveUnlockLayers())
      // P27 扩散圈特效：每次脉冲从角色中心扩散。
      player.unlockRings.push({
        x: player.x,
        y: player.y,
        t: 0,
        dur: UNLOCK_RING_LIFE_SEC,
        r: UNLOCK_RADIUS,
      })
      const targets = getTargets?.()
      let count = 0
      if (Array.isArray(targets)) {
        count = applyUnlockPulse(targets, duration)
      }
      onUnlockPulse?.({ duration, count, radius: UNLOCK_RADIUS })
    }
  }

  function update(dt) {
    if (dt <= 0) return
    player.animTime += dt
    stepLevelUpFx(player, dt)
    stepObjectiveFx(player, dt)
    // P42 定神：只按本帧 WASD 位移输入判定（蓄力 / 攻击后摇 / 受击不打断）。
    stepSteady(dt)
    if (player.invuln > 0) {
      player.invuln = Math.max(0, player.invuln - dt)
    }
    if (player.hurtT > 0) {
      player.hurtT = Math.max(0, player.hurtT - dt)
    }
    if (player.attackT > 0) {
      player.attackT = Math.max(0, player.attackT - dt)
    }
    if (player.hurtSpeedT > 0) {
      // P42：限时移速加成到期，把同一增量原样减回。
      player.hurtSpeedT = Math.max(0, player.hurtSpeedT - dt)
      if (player.hurtSpeedT <= 0) {
        player.hurtSpeedT = 0
        player.speed -= player.hurtSpeedDelta
        player.hurtSpeedDelta = 0
      }
    }
    stepScatter(player, dt)
    stepUnlockPulse(dt)
    stepUnlockRings(player, dt)
    applyFacing()

    if (player.hp <= 0) {
      player.moving = false
      player.charging = false
      resetObjectiveFx(player)
      player.deathT += dt
      player.anim = 'Death'
      return
    }

    let mx = 0
    let my = 0
    if (keys.w) my -= 1
    if (keys.s) my += 1
    if (keys.a) mx -= 1
    if (keys.d) mx += 1
    player.moving = mx !== 0 || my !== 0
    if (player.moving) {
      const len = Math.hypot(mx, my)
      player.x += (mx / len) * player.speed * dt
      player.y += (my / len) * player.speed * dt
      player.walkFrame += WALK_FPS * dt
    } else {
      player.walkFrame = 0
    }
    player.x = clamp(player.x, BODY, WORLD_WIDTH - BODY)
    player.y = clamp(player.y, BODY, WORLD_HEIGHT - BODY)
    player.anim = resolveAnim(player)
  }

  function draw(ctx) {
    drawScatter(ctx, player)
    if (!drawRanger(ctx, player) && player.hp > 0) {
      drawStickman(ctx, player)
    }
    drawUnlockRings(ctx, player)
    drawLevelUpFx(ctx, player)
    drawObjectiveFx(ctx, player)
  }

  async function loadAssets() {
    await Promise.all([
      loadRangerAssets(player.charId),
      loadLevelUpFx(),
      loadDamageNums(),
    ])
  }

  function bindInput(io = {}) {
    unbind()
    if (typeof window === 'undefined') return

    const onDown = (e) => {
      applyMovementCode(keys, e.code, true)
    }
    const onUp = (e) => {
      applyMovementCode(keys, e.code, false)
    }
    const onBlur = () => {
      clearMovementKeys(keys)
    }
    const onVis = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        clearMovementKeys(keys)
      }
    }
    const onMove = (e) => {
      const canvas = io.canvas
      if (!canvas || !io.camera || !io.getScale) return
      const rect = canvas.getBoundingClientRect()
      const scale = io.getScale()
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        io.camera,
        scale,
      )
      lookAt(world.x, world.y)
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener?.('visibilitychange', onVis)
    const moveTarget = io.canvas || window
    moveTarget.addEventListener('mousemove', onMove)
    unbind = () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener?.('visibilitychange', onVis)
      moveTarget.removeEventListener('mousemove', onMove)
      unbind = () => {}
    }
  }

  applyFacing()
  void loadAssets()
  return player
}

export function attachPlayer(engine, canvas) {
  const player = createPlayer()
  void player.loadAssets()
  engine?.setFollowTarget?.(player)
  if (typeof window !== 'undefined') {
    player.bindInput({
      canvas,
      camera: engine?.camera,
      getScale: engine?.getScale,
    })
  }
  return player
}
