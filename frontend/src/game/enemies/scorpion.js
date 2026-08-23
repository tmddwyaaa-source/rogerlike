/**
 * 蝎子怪移动：>8 身位靠近；3～8 站住；<3 背离到 7 身位。
 */
import { BODY, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  SCORPION_CHASE_RANGE,
  SCORPION_FLEE_STOP,
  SCORPION_HOLD_RANGE,
} from '../spawner/index.js'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function worldClamp(ent) {
  ent.x = clamp(ent.x, BODY, WORLD_WIDTH - BODY)
  ent.y = clamp(ent.y, BODY, WORLD_HEIGHT - BODY)
}

export function stepScorpionMove(ent, player, dt, spd) {
  if (ent.hp <= 0) return 'idle'
  if (!player) {
    worldClamp(ent)
    return 'idle'
  }
  const dx = player.x - ent.x
  const dy = player.y - ent.y
  const dist = Math.hypot(dx, dy)
  if (dist > SCORPION_CHASE_RANGE) {
    if (dist > 0.01) {
      ent.x += (dx / dist) * spd * dt
      ent.y += (dy / dist) * spd * dt
    }
    worldClamp(ent)
    return 'chase'
  }
  if (dist < SCORPION_HOLD_RANGE) {
    if (dist > 0.01) {
      const need = SCORPION_FLEE_STOP - dist
      const step = Math.min(spd * dt, Math.max(0, need))
      ent.x -= (dx / dist) * step
      ent.y -= (dy / dist) * step
    } else {
      ent.x -= spd * dt
    }
    worldClamp(ent)
    return 'flee'
  }
  worldClamp(ent)
  return 'hold'
}
