/**
 * 冰人 / 兰花移动与治疗（不追玩家）。刷怪与弹幕队列在 enemies 门面。
 */
import { BODY, SPEED_PX_PER_UNIT, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  ICE_DASH_DIST,
  ICE_DASH_SPEED_MUL,
  ICE_FLEE_SPEED_ADD,
  ICE_MAN_HP,
  ICE_REGEN_DELAY_SEC,
  ICE_REGEN_PER_SEC,
  ICE_REGEN_RANGE,
  ICE_VIEW_PAD,
  ICE_LEAVE_MARGIN,
  ORCHID_ARMOR_EVERY,
  ORCHID_HEAL_AMOUNT,
  ORCHID_SPEED_MUL,
  clampToView,
  inCameraView,
  lowestHpTarget,
  playerSpeedPx,
  playerSpeedUnits,
} from '../spawner/index.js'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function moveToward(ent, tx, ty, spd, dt) {
  const dx = tx - ent.x
  const dy = ty - ent.y
  const len = Math.hypot(dx, dy)
  if (len <= 0.01) return len
  const step = Math.min(len, spd * dt)
  ent.x += (dx / len) * step
  ent.y += (dy / len) * step
  return len - step
}

function worldClamp(ent) {
  ent.x = clamp(ent.x, BODY, WORLD_WIDTH - BODY)
  ent.y = clamp(ent.y, BODY, WORLD_HEIGHT - BODY)
}

export function stepIceManMove(ent, player, camera, dt, random) {
  if (ent.hp <= 0) return
  // P26 五娃减速：slowLeft>0 时移动乘 slowFactor（消费端，不改 combat 写入逻辑）。
  const slow = (ent.slowLeft ?? 0) > 0 ? (ent.slowFactor ?? 1) : 1
  if ((ent.fleeT ?? 0) > 0) {
    ent.fleeT = Math.max(0, ent.fleeT - dt)
    if (ent.fleeT <= 0) ent.hurtAcc = 0
  }

  if (ent.dashPhase === 'telegraph') {
    worldClamp(ent)
    return
  }

  if (ent.dashPhase === 'dash') {
    const spd = (ent.dashSpd ?? playerSpeedPx(player) * ICE_DASH_SPEED_MUL) * slow
    const dx = ent.dashDx ?? 0
    const dy = ent.dashDy ?? 0
    const left = Math.max(0, ICE_DASH_DIST - (ent.dashTraveled ?? 0))
    const step = Math.min(spd * dt, left)
    ent.x += dx * step
    ent.y += dy * step
    ent.dashTraveled = (ent.dashTraveled ?? 0) + step
    worldClamp(ent)
    return
  }

  const flee = (ent.fleeT ?? 0) > 0
  if (flee && player) {
    // P27：冰人可离开视野；逃跑不强制回视图。
    const spd = SPEED_PX_PER_UNIT * (playerSpeedUnits(player) + ICE_FLEE_SPEED_ADD) * slow
    const dx = ent.x - player.x
    const dy = ent.y - player.y
    const len = Math.hypot(dx, dy) || 1
    ent.x += (dx / len) * spd * dt
    ent.y += (dy / len) * spd * dt
    worldClamp(ent)
    return
  }

  const spd = (ent.wanderSpd ?? SPEED_PX_PER_UNIT * 0.7 * 1.2) * slow
  // P27：仅当完全离开视野（超出 1 身位）且未逃跑时才回可见范围。
  if (camera && !inCameraView(ent.x, ent.y, camera, ICE_LEAVE_MARGIN)) {
    const c = clampToView(ent.x, ent.y, camera, ICE_LEAVE_MARGIN)
    moveToward(ent, c.x, c.y, spd, dt)
    worldClamp(ent)
    return
  }

  ent.wanderT = (ent.wanderT ?? 0) - dt
  if (ent.wanderT <= 0) {
    const ang = random() * Math.PI * 2
    ent.wanderDx = Math.cos(ang)
    ent.wanderDy = Math.sin(ang)
    ent.wanderT = 0.7 + random() * 1.1
  }
  ent.x += (ent.wanderDx ?? 1) * spd * dt
  ent.y += (ent.wanderDy ?? 0) * spd * dt
  worldClamp(ent)
}

/** P21 脱战回血：ICE_REGEN_RANGE 内无角色持续 ICE_REGEN_DELAY_SEC 后每 1 秒回 ICE_REGEN_PER_SEC；进范围立即停并重置。 */
export function stepIceManRegen(ent, player, dt, hooks) {
  if (ent.hp <= 0) return
  const inRange =
    player != null &&
    player.hp > 0 &&
    Math.hypot(player.x - ent.x, player.y - ent.y) <= ICE_REGEN_RANGE
  if (inRange) {
    ent.regenLonelySec = 0
    ent.regenTickAcc = 0
    return
  }
  ent.regenLonelySec = (ent.regenLonelySec ?? 0) + dt
  if (ent.regenLonelySec < ICE_REGEN_DELAY_SEC) return
  const active = Math.min(dt, ent.regenLonelySec - ICE_REGEN_DELAY_SEC)
  ent.regenTickAcc = (ent.regenTickAcc ?? 0) + active
  while (ent.regenTickAcc >= 1) {
    ent.regenTickAcc -= 1
    const cap = ent.maxHp ?? ICE_MAN_HP
    const n = Math.min(ICE_REGEN_PER_SEC, cap - ent.hp)
    if (n <= 0) continue
    ent.hp += n
    hooks?.onHeal?.(ent, n)
  }
}

export function stepOrchidMove(ent, others, dt) {
  if (ent.hp <= 0) return
  const tgt = lowestHpTarget(ent, others)
  const slow = (ent.slowLeft ?? 0) > 0 ? (ent.slowFactor ?? 1) : 1
  const spd = SPEED_PX_PER_UNIT * ORCHID_SPEED_MUL * slow
  if (tgt) moveToward(ent, tgt.x, tgt.y, spd, dt)
  worldClamp(ent)
}

function grantArmorNear(orchid, others) {
  const r = orchid.healRange
  for (const e of others) {
    if (e === orchid || e.hp <= 0) continue
    if (e.kind === 'dummy' || e.kind === 'gray') continue
    if (Math.hypot(e.x - orchid.x, e.y - orchid.y) > r) continue
    e.armor = (e.armor ?? 0) + 1
  }
}

export function applyOrchidHeal(orchid, others, hooks) {
  const r = orchid.healRange
  let healed = false
  for (const e of others) {
    if (e === orchid || e.hp <= 0) continue
    if (Math.hypot(e.x - orchid.x, e.y - orchid.y) > r) continue
    const cap = e.maxHp ?? e.hp
    const room = cap - e.hp
    if (room <= 0) continue
    const n = Math.min(ORCHID_HEAL_AMOUNT, room)
    e.hp += n
    healed = true
    hooks.onHeal?.(e, n)
  }
  if (!healed) return
  orchid.healSuccesses = (orchid.healSuccesses ?? 0) + 1
  if (orchid.healSuccesses % ORCHID_ARMOR_EVERY === 0) {
    grantArmorNear(orchid, others)
  }
}
