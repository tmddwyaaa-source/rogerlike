/**
 * M4 玩家：游侠。贴图 + 阴影；火柴人仅作无 Image 时兜底。
 *
 * M5 可读/写：facingDir ('D'|'S'|'U')、flipX、charging、attackT。
 * P5：player.queueLevelUpFx(n)
 * P9：e.code WASD + clearMovementKeys；blur / 页面隐藏清键。
 */
import {
  BODY,
  BODY_W,
  SPEED_PX_PER_UNIT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  screenToWorld,
} from '../constants.js'
import {
  HURT_SEC,
  drawRanger,
  facingFromAngle,
  loadRangerAssets,
  resolveAnim,
} from '../render/ranger.js'
import { drawStickman } from '../render/stickman.js'
import {
  drawLevelUpFx,
  hasLevelUpFx,
  levelUpFxBusy,
  levelUpFxRemaining,
  loadLevelUpFx,
  queueLevelUpFx as enqueueLevelUp,
  stepLevelUpFx,
} from '../render/levelup.js'

export { drawStickman, STICKMAN_H, STICKMAN_W } from '../render/stickman.js'
export {
  drawRanger,
  facingFromAngle,
  loadRangerAssets,
  resolveAnim,
} from '../render/ranger.js'
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
/** 设计移速单位 1.20 */
export const PLAYER_SPEED_UNITS = 1.2
export const PLAYER_SPEED = PLAYER_SPEED_UNITS * SPEED_PX_PER_UNIT
export const IFRAME_SEC = 0.85
export const SCATTER_COUNT = 16
export const SCATTER_LIFE = 0.7
export const WALK_FPS = 10

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

/**
 * @param {{
 *   x?: number, y?: number, speed?: number, speedUnits?: number,
 *   keys?: object, random?: () => number, godMode?: boolean, name?: string,
 * }} [opts]
 */
export function createPlayer(opts = {}) {
  const random = opts.random ?? Math.random
  const keys = opts.keys ?? { w: false, a: false, s: false, d: false }
  let unbind = () => {}
  const speedUnits = opts.speedUnits ?? PLAYER_SPEED_UNITS

  const player = {
    name: opts.name ?? CHAR_NAME,
    x: opts.x ?? WORLD_WIDTH / 2,
    y: opts.y ?? WORLD_HEIGHT / 2,
    w: BODY_W,
    h: BODY,
    /** 接触判定用缩小 hurtbox */
    hurtW: Math.max(4, Math.round(BODY_W * 0.55)),
    hurtH: Math.max(6, Math.round(BODY * 0.45)),
    hp: HP_MAX,
    hpMax: HP_MAX,
    speedUnits,
    speed: opts.speed ?? speedUnits * SPEED_PX_PER_UNIT,
    facing: 0,
    facingDir: 'S',
    flipX: false,
    charging: false,
    attackT: 0,
    hurtT: 0,
    deathT: 0,
    animTime: 0,
    anim: 'Idle',
    invuln: 0,
    scatter: [],
    levelUpFx: [],
    walkFrame: 0,
    moving: false,
    godMode: Boolean(opts.godMode),
    keys,
    update,
    takeDamage,
    heal,
    addVitality,
    lookAt,
    isInvincible: () => player.invuln > 0,
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
    let next = player.hp - n
    if (player.godMode) next = Math.max(1, next)
    if (next === player.hp) return false
    player.hp = Math.max(0, next)
    player.invuln = IFRAME_SEC
    player.hurtT = HURT_SEC
    spawnScatter(player, random)
    return true
  }

  function heal(n = 1) {
    if (n <= 0 || player.hp <= 0) return false
    const next = Math.min(player.hpMax, player.hp + n)
    if (next === player.hp) return false
    player.hp = next
    return true
  }

  function addVitality() {
    player.hpMax += 1
    player.hp = Math.min(player.hpMax, player.hp + 1)
    return true
  }

  function update(dt) {
    if (dt <= 0) return
    player.animTime += dt
    stepLevelUpFx(player, dt)
    if (player.invuln > 0) {
      player.invuln = Math.max(0, player.invuln - dt)
    }
    if (player.hurtT > 0) {
      player.hurtT = Math.max(0, player.hurtT - dt)
    }
    if (player.attackT > 0) {
      player.attackT = Math.max(0, player.attackT - dt)
    }
    stepScatter(player, dt)
    applyFacing()

    if (player.hp <= 0) {
      player.moving = false
      player.charging = false
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
    drawLevelUpFx(ctx, player)
  }

  async function loadAssets() {
    await Promise.all([loadRangerAssets(), loadLevelUpFx()])
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
