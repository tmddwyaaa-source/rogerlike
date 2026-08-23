/**
 * M6 敌人门面：蘑菇怪 + 蜗牛怪 + 灰树。不改 engine / combat / player / world。
 *
 * M9 接线：
 *   const foes = createEnemies({
 *     player,
 *     hooks: { spawnCrystal: env.spawnCrystal, onExp },
 *   })
 *   await foes.loadAssets()
 *   createCombat({ player, targets: foes.targets, hooks: { hitWorld: env.hitAt } })
 *   foes.update(dt, player, camera, elapsedSec, spawnRate)
 *   foes.draw(ctx)   // 须在 ctx.translate(-cam) 之后
 */
import { BODY, BODY_W, SPEED_PX_PER_UNIT, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  CREEP_HP,
  GRAY_BURST_COUNT,
  GRAY_BURST_DELAY,
  GRAY_BURST_RADIUS,
  GRAY_SELF_PERIOD,
  GRAY_UNLOCK_SEC,
  ICE_BARRAGE_PATTERNS,
  ICE_BARRAGE_PERIOD,
  ICE_BULLET_SPEED,
  ICE_DASH_DIST,
  ICE_DASH_PERIOD,
  ICE_DASH_SPEED_MUL,
  ICE_DASH_TELEGRAPH,
  ICE_FLEE_HURT,
  ICE_FLEE_SEC,
  ARMOR_DMG_MUL,
  ICE_MAN_CRYSTALS,
  ICE_MAN_HP,
  ICE_MAN_KNOCKBACK_SCALE,
  ICE_MAN_RESPAWN_SEC,
  ICE_MAN_SPEED_MUL,
  ICE_MAN_UNLOCK_SEC,
  ICE_ORCHID_COUNT,
  ICE_ORCHID_PERIOD,
  ICE_REGEN_DELAY_SEC,
  ICE_REGEN_PER_SEC,
  ICE_REGEN_RANGE,
  iceManRespawnHp,
  DUMMY_FLASH_SEC,
  DUMMY_HP,
  DUMMY_OFFSET,
  DUMMY_REGEN_PER_SEC,
  ORCHID_HEAL_PERIOD,
  ORCHID_HEAL_RANGE,
  ORCHID_HP,
  SLIME_X1_CRYSTALS,
  SLIME_X1_INTERVAL,
  SLIME_X1_UNLOCK_SEC,
  SLIME_X3_INVULN_SEC,
  SLIME_X3_SPLIT_COUNT,
  SLIME_X3_SPEED_BONUS,
  SCORPION_BULLET_SPEED,
  SCORPION_CRYSTALS,
  SCORPION_INTERVAL,
  SCORPION_SHOT_PERIOD,
  SCORPION_UNLOCK_SEC,
  SNAIL_INTERVAL,
  SNAIL_UNLOCK_SEC,
  barragePoints,
  creepSpawnCount,
  creepSpawnInterval,
  creepSpeedMul,
  creepSpeedPx,
  difficultyTier,
  grayBurstOffset,
  grayTreeHp,
  grayTreeSpawnCount,
  grayTreeSpawnInterval,
  mushroomHp,
  mushroomSpawnCount,
  mushroomSpawnInterval,
  pickNearOutOfView,
  planBarrageSet,
  playerSpeedPx,
  playerSpeedUnits,
  rollGraySelfDamage,
  rollIceDashCount,
  rollSlimeX3Crystals,
  scaledWaveCount,
  scorpionHp,
  scorpionSpawnCount,
  scorpionSpeedMul,
  scorpionSpeedPx,
  shuffleCopy,
  slimeX1Hp,
  slimeX1SpawnCount,
  slimeX1SpeedMul,
  slimeX3HpFromParent,
  snailHp,
  snailSpawnCount,
  snailSpeedMul,
  snailSpeedPx,
  splitSpeedMul,
  splitSpeedPx,
} from '../spawner/index.js'
import { applyOrchidHeal, stepIceManMove, stepIceManRegen, stepOrchidMove } from './ice.js'
import { stepScorpionMove } from './scorpion.js'
import { outlineSheet } from './outline.js'
import { drawStickman, STICKMAN_H, STICKMAN_W } from '../render/stickman.js'
import {
  BLACK_KEY,
  CREEP_DRAW,
  CREEP_SRC,
  GRAY_DRAW,
  GRAY_SRC,
  ICE_BULLET_DRAW,
  ICE_BULLET_SRC,
  ICE_MAN_DRAW,
  ICE_MAN_SRC,
  ORCHID_DRAW,
  ORCHID_SRC,
  SCORPION_SRC,
  SLIME_X1_SRC,
  SLIME_X3_SRC,
  SNAIL_SRC,
  SPLIT_SRC,
} from './constants.js'

export { outlinePixels, outlineSheet } from './outline.js'

export {
  ARMOR_OUTLINE,
  CREEP_DRAW,
  CREEP_FRAMES,
  CREEP_SRC,
  GRAY_DRAW,
  GRAY_SRC,
  ICE_BULLET_SRC,
  ICE_MAN_DRAW,
  ICE_MAN_SRC,
  ORCHID_SRC,
  SCORPION_SRC,
  SLIME_X1_SRC,
  SLIME_X3_SRC,
  SNAIL_SRC,
  SPLIT_SRC,
} from './constants.js'

export {
  ARMOR_DMG_MUL,
  CREEP_HP,
  GRAY_BURST_COUNT,
  GRAY_BURST_DELAY,
  GRAY_BURST_RADIUS,
  GRAY_SELF_PERIOD,
  GRAY_UNLOCK_SEC,
  ICE_BARRAGE_PATTERNS,
  ICE_BARRAGE_PERIOD,
  ICE_BULLET_SPEED,
  ICE_DASH_DIST,
  ICE_DASH_MAX,
  ICE_DASH_MIN,
  ICE_DASH_PERIOD,
  ICE_DASH_TELEGRAPH,
  ICE_FLEE_HURT,
  ICE_FLEE_SEC,
  ICE_MAN_CRYSTALS,
  ICE_MAN_HP,
  ICE_MAN_KNOCKBACK_SCALE,
  ICE_MAN_RESPAWN_SEC,
  ICE_MAN_UNLOCK_SEC,
  ICE_ORCHID_COUNT,
  ICE_ORCHID_PERIOD,
  ICE_REGEN_DELAY_SEC,
  ICE_REGEN_PER_SEC,
  ICE_REGEN_RANGE,
  iceManRespawnHp,
  DUMMY_HP,
  DUMMY_OFFSET,
  DUMMY_REGEN_PER_SEC,
  ORCHID_HEAL_AMOUNT,
  ORCHID_HEAL_PERIOD,
  ORCHID_HEAL_RANGE,
  ORCHID_HP,
  ORCHID_SPEED_MUL,
  SLIME_X1_UNLOCK_SEC,
  SLIME_X3_INVULN_SEC,
  SCORPION_UNLOCK_SEC,
  SNAIL_UNLOCK_SEC,
  cameraCorners,
  cameraEdgeMids,
  creepSpawnCount,
  creepSpawnInterval,
  creepSpeedMul,
  creepSpeedPx,
  difficultyTier,
  grayBurstOffset,
  grayTreeHp,
  grayTreeSpawnCount,
  grayTreeSpawnInterval,
  mushroomHp,
  mushroomSpawnCount,
  mushroomSpawnInterval,
  planBarrageSet,
  rollGraySelfDamage,
  rollIceDashCount,
  rollSlimeX3Crystals,
  scaledWaveCount,
  scorpionHp,
  scorpionSpawnCount,
  scorpionSpeedMul,
  scorpionSpeedPx,
  slimeX1Hp,
  slimeX1SpawnCount,
  slimeX1SpeedMul,
  slimeX3HpFromParent,
  snailHp,
  snailSpawnCount,
  snailSpeedMul,
  snailSpeedPx,
  splitSpeedMul,
  splitSpeedPx,
} from '../spawner/index.js'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function chromaBlack(img) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth || img.width
  c.height = img.naturalHeight || img.height
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const data = g.getImageData(0, 0, c.width, c.height)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < BLACK_KEY && d[i + 1] < BLACK_KEY && d[i + 2] < BLACK_KEY) {
      d[i + 3] = 0
    }
  }
  g.putImageData(data, 0, 0)
  return c
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = src
    img
      .decode()
      .then(() => resolve(img))
      .catch(() => resolve(img))
  })
}

function drawSprite(ctx, sheet, ent, fallback) {
  const dx = Math.round(ent.x - ent.w / 2)
  const dy = Math.round(ent.y - ent.h / 2)
  const spr = (ent.armor ?? 0) > 0 && sheet?.armored ? sheet.armored : sheet
  if (spr && (spr.naturalWidth || spr.width)) {
    const sw = spr.naturalWidth || spr.width
    const sh = spr.naturalHeight || spr.height
    ctx.drawImage(spr, 0, 0, sw, sh, dx, dy, ent.w, ent.h)
    return
  }
  ctx.fillStyle = fallback.a
  ctx.fillRect(dx, dy, ent.w, ent.h)
  ctx.fillStyle = fallback.b
  ctx.fillRect(dx + 4, dy + 4, 6, 6)
}

/**
 * @param {{
 *   player?: { x: number, y: number, speed?: number, w?: number, h?: number, takeDamage?: Function },
 *   random?: () => number,
 *   hooks?: { spawnCrystal?: Function, onExp?: Function, onKill?: Function },
 * }} [opts]
 */
export function createEnemies(opts = {}) {
  const random = opts.random ?? Math.random
  const hooks = opts.hooks ?? {}
  /** 稳定引用，供 M5 createCombat({ targets }) 持有。 */
  const targets = []
  const bursts = []
  const iceBullets = []
  let dummyRef = null
  let creepAcc = 0
  let grayAcc = 0
  let snailAcc = 0
  let slimeAcc = 0
  let scorpionAcc = 0
  let grayStarted = false
  let snailStarted = false
  let slimeStarted = false
  let scorpionStarted = false
  let iceManDeaths = 0
  let iceRespawnAt = null
  let elapsed = 0
  let mushroomSheet = null
  let snailSheet = null
  let splitSheet = null
  let slimeX1Sheet = null
  let slimeX3Sheet = null
  let iceManSheet = null
  let orchidSheet = null
  let scorpionSheet = null
  let iceBulletSheet = null
  let graySprite = null

  function extraHp() {
    const n = opts.getHpGrowthAdd?.()
    return Number.isFinite(n) ? n : 0
  }

  function liveOf(kind) {
    return targets.filter((e) => e.kind === kind && e.hp > 0)
  }

  function bindTakeHit(ent, onDead) {
    ent.takeHit = (dmg) => {
      if (ent.hp <= 0 || dmg <= 0) return 0
      if ((ent.spawnInvuln ?? 0) > 0) return 0
      let applied = dmg
      if ((ent.armor ?? 0) > 0) {
        ent.armor -= 1
        applied = dmg * ARMOR_DMG_MUL
      }
      const dealt = Math.min(ent.hp, applied)
      ent.hp -= applied
      if (ent.hp <= 0) {
        ent.hp = 0
        onDead(ent)
      }
      return dealt
    }
  }

  function spawnMob(kind, x, y, extra) {
    const mob = {
      kind,
      x,
      y,
      w: CREEP_DRAW,
      h: CREEP_DRAW,
      hurtW: Math.round(CREEP_DRAW * 0.45),
      hurtH: Math.round(CREEP_DRAW * 0.45),
      knockbackable: true,
      dead: false,
      armor: 0,
      ...extra,
    }
    bindTakeHit(mob, () => {
      mob.dead = true
    })
    targets.push(mob)
    return mob
  }

  function spawnCreepAt(x, y, speedKind = 'regular', hp) {
    const h = hp ?? mushroomHp(elapsed, extraHp())
    return spawnMob('creep', x, y, {
      name: speedKind === 'split' ? '裂怪' : '蘑菇怪',
      speedKind,
      hp: h,
      maxHp: h,
      knockbackResist: 0,
    })
  }

  function spawnSnailAt(x, y, hp) {
    const h = hp ?? snailHp(elapsed, extraHp())
    return spawnMob('snail', x, y, {
      name: '蜗牛怪',
      speedKind: 'snail',
      hp: h,
      maxHp: h,
      knockbackResist: BODY,
      armor: 1,
    })
  }

  function spawnScorpionAt(x, y, hp) {
    const h = hp ?? scorpionHp(elapsed)
    return spawnMob('scorpion', x, y, {
      name: '蝎子怪',
      speedKind: 'scorpion',
      hp: h,
      maxHp: h,
      knockbackResist: 0,
      shotCd: 0,
      contactDamage: 1,
    })
  }

  function spawnSlimeX1At(x, y, hp) {
    const h = hp ?? slimeX1Hp(elapsed, extraHp())
    return spawnMob('slime_x1', x, y, {
      name: '史莱姆x-1',
      speedKind: 'slime_x1',
      hp: h,
      maxHp: h,
      spawnHp: h,
      speedMul: slimeX1SpeedMul(elapsed),
      knockbackResist: 0,
    })
  }

  function spawnSlimeX3At(x, y, parent) {
    const spawnHp = parent?.spawnHp ?? parent?.maxHp ?? slimeX1Hp(elapsed, extraHp())
    const h = slimeX3HpFromParent(spawnHp)
    const speedMul = (parent?.speedMul ?? slimeX1SpeedMul(elapsed)) + SLIME_X3_SPEED_BONUS
    return spawnMob('slime_x3', x, y, {
      name: '史莱姆x-3',
      speedKind: 'slime_x3',
      hp: h,
      maxHp: h,
      spawnHp: h,
      speedMul,
      knockbackResist: 0,
      spawnInvuln: SLIME_X3_INVULN_SEC,
    })
  }

  function bindIceManHit(ent) {
    const inner = ent.takeHit
    ent.takeHit = (dmg) => {
      if (ent.hp <= 0 || dmg <= 0) return 0
      const before = ent.hp
      const dealt = inner(dmg) ?? Math.max(0, before - ent.hp)
      if (dealt <= 0) return 0
      if ((ent.fleeT ?? 0) <= 0) {
        ent.hurtAcc = (ent.hurtAcc ?? 0) + dealt
        if (ent.hurtAcc >= ICE_FLEE_HURT) {
          ent.fleeT = ICE_FLEE_SEC
          ent.hurtAcc = 0
        }
      }
      return dealt
    }
  }

  function spawnIceManAt(x, y, player, hp) {
    const units = playerSpeedUnits(player)
    const h = hp ?? iceManRespawnHp(iceManDeaths)
    const ent = spawnMob('ice_man', x, y, {
      name: '冰人',
      w: ICE_MAN_DRAW,
      h: ICE_MAN_DRAW,
      hurtW: Math.round(ICE_MAN_DRAW * 0.5),
      hurtH: Math.round(ICE_MAN_DRAW * 0.5),
      hp: h,
      maxHp: h,
      knockbackResist: 0,
      knockbackScale: ICE_MAN_KNOCKBACK_SCALE,
      wanderSpd: SPEED_PX_PER_UNIT * units * ICE_MAN_SPEED_MUL,
      hurtAcc: 0,
      fleeT: 0,
      dashCd: ICE_DASH_PERIOD,
      dashPhase: 'idle',
      dashLeft: 0,
      dashT: 0,
      barrageCd: ICE_BARRAGE_PERIOD,
      barrageShots: null,
      barrageT: 0,
      orchidCd: ICE_ORCHID_PERIOD,
      contactDamage: 1,
    })
    bindIceManHit(ent)
    return ent
  }

  function spawnOrchidAt(x, y) {
    return spawnMob('orchid', x, y, {
      name: '兰花',
      w: ORCHID_DRAW,
      h: ORCHID_DRAW,
      hp: ORCHID_HP,
      maxHp: ORCHID_HP,
      knockbackResist: 0,
      healAcc: 0,
      healSuccesses: 0,
      healRange: ORCHID_HEAL_RANGE,
      contactDamage: 0,
    })
  }

  function bindDummyHit(ent) {
    const inner = ent.takeHit
    ent.takeHit = (dmg) => {
      if (ent.hp <= 0 || dmg <= 0) return 0
      const dealt = inner(dmg) ?? 0
      if (dealt > 0) {
        ent.invuln = DUMMY_FLASH_SEC
        ent.moving = true
        ent.walkFrame = ((ent.walkFrame ?? 0) + 1) % 5
      }
      return dealt
    }
  }

  function removeDummy() {
    if (!dummyRef) return
    const i = targets.indexOf(dummyRef)
    if (i >= 0) targets.splice(i, 1)
    dummyRef = null
  }

  function spawnDummyAt(x, y) {
    removeDummy()
    const ent = spawnMob('dummy', x, y, {
      name: '火柴人',
      w: STICKMAN_W,
      h: STICKMAN_H,
      hurtW: STICKMAN_W,
      hurtH: STICKMAN_H,
      hp: DUMMY_HP,
      maxHp: DUMMY_HP,
      knockbackable: false,
      knockbackResist: 0,
      contactDamage: 0,
      invuln: 0,
      walkFrame: 0,
      moving: false,
      facing: 0,
    })
    bindDummyHit(ent)
    dummyRef = ent
    return ent
  }

  function setDummyEnabled(on, player) {
    if (!on) {
      removeDummy()
      return null
    }
    if (dummyRef && dummyRef.hp > 0) return dummyRef
    const px = player?.x ?? WORLD_WIDTH / 2
    const py = player?.y ?? WORLD_HEIGHT / 2
    return spawnDummyAt(px + DUMMY_OFFSET, py)
  }

  function spawnIceBullet(x, y, tx, ty, speed = ICE_BULLET_SPEED) {
    const dx = (tx ?? x) - x
    const dy = (ty ?? y) - y
    const len = Math.hypot(dx, dy) || 1
    const spd = speed ?? ICE_BULLET_SPEED
    iceBullets.push({
      x,
      y,
      vx: (dx / len) * spd,
      vy: (dy / len) * spd,
      w: ICE_BULLET_DRAW,
      h: ICE_BULLET_DRAW,
      life: 5,
    })
  }

  function queueBurst(x, y) {
    bursts.push({ x, y, ready: elapsed + GRAY_BURST_DELAY })
  }

  function spawnGrayAt(x, y, hp) {
    const tree = {
      kind: 'gray',
      x,
      y,
      w: GRAY_DRAW,
      h: GRAY_DRAW,
      hurtW: Math.round(GRAY_DRAW * 0.35),
      hurtH: Math.round(GRAY_DRAW * 0.4),
      hp,
      maxHp: hp,
      knockbackable: false,
      dead: false,
      selfAcc: 0,
    }
    bindTakeHit(tree, () => {
      tree.dead = true
    })
    targets.push(tree)
    return tree
  }

  function trySpawn(kind, hp, tFocus, camera) {
    const pos = pickNearOutOfView(tFocus, camera, random, BODY)
    if (kind === 'creep') return spawnCreepAt(pos.x, pos.y, 'regular', hp)
    if (kind === 'snail') return spawnSnailAt(pos.x, pos.y, hp)
    if (kind === 'slime_x1') return spawnSlimeX1At(pos.x, pos.y, hp)
    if (kind === 'scorpion') return spawnScorpionAt(pos.x, pos.y, hp)
    return spawnGrayAt(pos.x, pos.y, hp)
  }

  function dropIceCrystals(ent) {
    const n = ICE_MAN_CRYSTALS
    if (typeof hooks.spawnCrystalBurst === 'function') {
      hooks.spawnCrystalBurst(ent.x, ent.y, n)
    } else {
      for (let i = 0; i < n; i++) {
        const jx = (random() - 0.5) * BODY
        const jy = (random() - 0.5) * BODY
        hooks.spawnCrystal?.(ent.x + jx, ent.y + jy)
      }
    }
  }

  function killCreep(ent) {
    if (ent.kind === 'ice_man') {
      iceManDeaths += 1
      iceRespawnAt = elapsed + ICE_MAN_RESPAWN_SEC
      dropIceCrystals(ent)
      hooks.onKill?.(ent)
      return
    }
    let n = 1
    if (ent.kind === 'slime_x1' || ent.kind === 'scorpion') n = ent.kind === 'scorpion' ? SCORPION_CRYSTALS : SLIME_X1_CRYSTALS
    else if (ent.kind === 'slime_x3') n = rollSlimeX3Crystals(random)
    else if (ent.kind === 'orchid' || ent.kind === 'dummy') n = 0
    for (let i = 0; i < n; i++) hooks.spawnCrystal?.(ent.x, ent.y)
    if (n > 0) hooks.onExp?.(n)
    hooks.onKill?.(ent)
  }

  function reap() {
    for (let i = targets.length - 1; i >= 0; i--) {
      const ent = targets[i]
      if (ent.hp > 0 && !ent.dead) continue
      if (ent.kind === 'dummy') dummyRef = null
      if (ent.kind === 'gray') queueBurst(ent.x, ent.y)
      else {
        if (ent.kind === 'slime_x1') {
          for (let k = 0; k < SLIME_X3_SPLIT_COUNT; k++) {
            spawnSlimeX3At(ent.x, ent.y, ent)
          }
        }
        killCreep(ent)
      }
      targets.splice(i, 1)
    }
  }

  function chase(ent, focus, dt, tier) {
    if (ent.kind === 'ice_man' || ent.kind === 'orchid' || ent.kind === 'dummy' || ent.kind === 'scorpion') return
    let spd
    if (ent.kind === 'slime_x1') {
      ent.speedMul = slimeX1SpeedMul(elapsed)
      spd = SPEED_PX_PER_UNIT * ent.speedMul
    } else if (ent.kind === 'slime_x3') {
      spd = SPEED_PX_PER_UNIT * (ent.speedMul ?? slimeX1SpeedMul(elapsed) + SLIME_X3_SPEED_BONUS)
    } else if (ent.kind === 'snail') spd = snailSpeedPx(elapsed)
    else if (ent.speedKind === 'split') spd = splitSpeedPx(tier)
    else spd = creepSpeedPx(tier)
    const dx = (focus?.x ?? ent.x) - ent.x
    const dy = (focus?.y ?? ent.y) - ent.y
    const len = Math.hypot(dx, dy)
    if (len > 0.01) {
      ent.x += (dx / len) * spd * dt
      ent.y += (dy / len) * spd * dt
    }
    ent.x = clamp(ent.x, BODY, WORLD_WIDTH - BODY)
    ent.y = clamp(ent.y, BODY, WORLD_HEIGHT - BODY)
  }

  function contactPlayer(focus) {
    if (!focus || focus.hp <= 0) return
    const pw = focus.hurtW ?? Math.max(4, Math.round((focus.w ?? BODY_W) * 0.55))
    const ph = focus.hurtH ?? Math.max(6, Math.round((focus.h ?? BODY) * 0.45))
    const px = focus.x - pw / 2
    const py = focus.y - ph / 2
    for (const ent of targets) {
      if (ent.hp <= 0 || (ent.spawnInvuln ?? 0) > 0) continue
      if (ent.kind === 'orchid' || ent.contactDamage === 0) continue
      const hw = ent.hurtW ?? Math.max(4, Math.round(ent.w * 0.4))
      const hh = ent.hurtH ?? Math.max(4, Math.round(ent.h * 0.4))
      const ex = ent.x - hw / 2
      const ey = ent.y - hh / 2
      if (!overlaps(px, py, pw, ph, ex, ey, hw, hh)) continue
      focus.takeDamage?.(1)
      if (ent.kind === 'gray') {
        ent.hp = 0
        ent.dead = true
      }
    }
  }

  function tickBursts() {
    for (let i = bursts.length - 1; i >= 0; i--) {
      if (elapsed < bursts[i].ready) continue
      const { x, y } = bursts[i]
      const hp = mushroomHp(elapsed, extraHp())
      const radius = Math.max(CREEP_DRAW, GRAY_BURST_RADIUS)
      for (let k = 0; k < GRAY_BURST_COUNT; k++) {
        const pos = grayBurstOffset(k, x, y, radius)
        spawnCreepAt(pos.x, pos.y, 'split', hp)
      }
      bursts.splice(i, 1)
    }
  }

  function spawnWave(kind, base, rate, hp, focus, camera) {
    const n = scaledWaveCount(base, rate)
    for (let k = 0; k < n; k++) trySpawn(kind, hp, focus, camera)
  }

  function tickSpawns(dt, focus, camera, tier, spawnRate = 1) {
    if (!focus || !camera) return
    const rate = spawnRate == null ? 1 : spawnRate

    creepAcc += dt
    const cInt = mushroomSpawnInterval()
    while (creepAcc >= cInt) {
      creepAcc -= cInt
      spawnWave('creep', mushroomSpawnCount(elapsed), rate, mushroomHp(elapsed, extraHp()), focus, camera)
    }

    if (elapsed < GRAY_UNLOCK_SEC) {
      grayAcc = 0
      grayStarted = false
    } else if (!grayStarted) {
      grayStarted = true
      spawnWave('gray', grayTreeSpawnCount(tier), rate, grayTreeHp(tier), focus, camera)
      grayAcc = 0
    } else {
      grayAcc += dt
      const gInt = grayTreeSpawnInterval(tier)
      while (grayAcc >= gInt) {
        grayAcc -= gInt
        spawnWave('gray', grayTreeSpawnCount(tier), rate, grayTreeHp(tier), focus, camera)
      }
    }

    if (elapsed < SNAIL_UNLOCK_SEC) {
      snailAcc = 0
      snailStarted = false
    } else if (!snailStarted) {
      snailStarted = true
      spawnWave('snail', snailSpawnCount(elapsed), rate, snailHp(elapsed, extraHp()), focus, camera)
      snailAcc = 0
    } else {
      snailAcc += dt
      while (snailAcc >= SNAIL_INTERVAL) {
        snailAcc -= SNAIL_INTERVAL
        spawnWave('snail', snailSpawnCount(elapsed), rate, snailHp(elapsed, extraHp()), focus, camera)
      }
    }

    if (elapsed < SLIME_X1_UNLOCK_SEC) {
      slimeAcc = 0
      slimeStarted = false
    } else if (!slimeStarted) {
      slimeStarted = true
      spawnWave(
        'slime_x1',
        slimeX1SpawnCount(elapsed),
        rate,
        slimeX1Hp(elapsed, extraHp()),
        focus,
        camera,
      )
      slimeAcc = 0
    } else {
      slimeAcc += dt
      while (slimeAcc >= SLIME_X1_INTERVAL) {
        slimeAcc -= SLIME_X1_INTERVAL
        spawnWave(
          'slime_x1',
          slimeX1SpawnCount(elapsed),
          rate,
          slimeX1Hp(elapsed, extraHp()),
          focus,
          camera,
        )
      }
    }

    if (elapsed < SCORPION_UNLOCK_SEC) {
      scorpionAcc = 0
      scorpionStarted = false
    } else if (!scorpionStarted) {
      scorpionStarted = true
      spawnWave('scorpion', scorpionSpawnCount(elapsed), rate, scorpionHp(elapsed), focus, camera)
      scorpionAcc = 0
    } else {
      scorpionAcc += dt
      while (scorpionAcc >= SCORPION_INTERVAL) {
        scorpionAcc -= SCORPION_INTERVAL
        spawnWave('scorpion', scorpionSpawnCount(elapsed), rate, scorpionHp(elapsed), focus, camera)
      }
    }

    if (
      elapsed >= ICE_MAN_UNLOCK_SEC &&
      liveOf('ice_man').length === 0 &&
      (iceRespawnAt == null || elapsed >= iceRespawnAt) &&
      focus &&
      camera
    ) {
      const pos = pickNearOutOfView(focus, camera, random, BODY)
      spawnIceManAt(pos.x, pos.y, focus)
    }
  }

  function fireBarrageShot(shot, camera, player) {
    const pts = barragePoints(shot.group, camera)
    const pt = pts[shot.i]
    if (!pt || !player) return
    spawnIceBullet(pt.x, pt.y, player.x, player.y)
  }

  function tickIceAbilities(ent, player, camera, dt) {
    if (ent.kind !== 'ice_man' || ent.hp <= 0) return

    if (ent.dashPhase === 'telegraph') {
      ent.dashT -= dt
      if (ent.dashT <= 0 && player) {
        const dx = player.x - ent.x
        const dy = player.y - ent.y
        const len = Math.hypot(dx, dy) || 1
        ent.dashPhase = 'dash'
        ent.dashDx = dx / len
        ent.dashDy = dy / len
        ent.dashTx = player.x
        ent.dashTy = player.y
        ent.dashTraveled = 0
        ent.dashSpd = playerSpeedPx(player) * ICE_DASH_SPEED_MUL
      }
    } else if (ent.dashPhase === 'dash') {
      if ((ent.dashTraveled ?? 0) >= ICE_DASH_DIST - 1e-6) {
        ent.dashLeft -= 1
        if (ent.dashLeft > 0) {
          ent.dashPhase = 'telegraph'
          ent.dashT = ICE_DASH_TELEGRAPH
        } else {
          ent.dashPhase = 'idle'
          ent.dashCd = ICE_DASH_PERIOD
        }
      }
    } else {
      ent.dashCd -= dt
      if (ent.dashCd <= 0) {
        ent.dashLeft = rollIceDashCount(random)
        ent.dashPhase = 'telegraph'
        ent.dashT = ICE_DASH_TELEGRAPH
      }
    }

    if (ent.barrageShots) {
      ent.barrageT += dt
      while (ent.barrageShots.length && ent.barrageShots[0].t <= ent.barrageT) {
        fireBarrageShot(ent.barrageShots.shift(), camera, player)
      }
      if (!ent.barrageShots.length) {
        ent.barrageShots = null
        ent.barrageCd = ICE_BARRAGE_PERIOD
      }
    } else {
      ent.barrageCd -= dt
      if (ent.barrageCd <= 0 && camera) {
        const patterns = shuffleCopy(ICE_BARRAGE_PATTERNS, random)
        ent.barrageShots = planBarrageSet(patterns)
        ent.barrageT = 0
        while (ent.barrageShots.length && ent.barrageShots[0].t <= 0) {
          fireBarrageShot(ent.barrageShots.shift(), camera, player)
        }
      }
    }

    if (liveOf('ice_man').length) {
      ent.orchidCd -= dt
      if (ent.orchidCd <= 0) {
        ent.orchidCd = ICE_ORCHID_PERIOD
        for (let i = 0; i < ICE_ORCHID_COUNT; i++) {
          const ang = random() * Math.PI * 2
          const r = 24 + random() * 36
          spawnOrchidAt(ent.x + Math.cos(ang) * r, ent.y + Math.sin(ang) * r)
        }
      }
    }
  }

  function tickIceBullets(dt, player) {
    for (let i = iceBullets.length - 1; i >= 0; i--) {
      const b = iceBullets[i]
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.life -= dt
      let hit = false
      if (player && player.hp > 0) {
        const pw = player.hurtW ?? Math.max(4, Math.round((player.w ?? BODY_W) * 0.55))
        const ph = player.hurtH ?? Math.max(6, Math.round((player.h ?? BODY) * 0.45))
        if (overlaps(player.x - pw / 2, player.y - ph / 2, pw, ph, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)) {
          player.takeDamage?.(1)
          hit = true
        }
      }
      if (hit || b.life <= 0) iceBullets.splice(i, 1)
    }
  }

  function tickOrchidHeals(dt) {
    for (const ent of targets) {
      if (ent.kind !== 'orchid' || ent.hp <= 0) continue
      ent.healAcc = (ent.healAcc ?? 0) + dt
      while (ent.healAcc >= ORCHID_HEAL_PERIOD) {
        ent.healAcc -= ORCHID_HEAL_PERIOD
        applyOrchidHeal(ent, targets, hooks)
      }
    }
  }

  function update(dt, focus, camera, elapsedSec, spawnRate = 1) {
    if (dt <= 0) return
    elapsed = elapsedSec ?? elapsed + dt
    const tier = difficultyTier(elapsed)
    const player = focus ?? opts.player

    for (const ent of targets) {
      if (ent.hp <= 0) continue
      if (ent.kind === 'ice_man') {
        stepIceManRegen(ent, player, dt, hooks)
        tickIceAbilities(ent, player, camera, dt)
        stepIceManMove(ent, player, camera, dt, random)
      } else if (ent.kind === 'orchid') {
        stepOrchidMove(ent, targets, dt)
      } else if (ent.kind === 'scorpion') {
        const mode = stepScorpionMove(ent, player, dt, scorpionSpeedPx(elapsed))
        if (mode === 'hold' && player) {
          ent.shotCd = (ent.shotCd ?? 0) - dt
          if (ent.shotCd <= 0) {
            spawnIceBullet(ent.x, ent.y, player.x, player.y, SCORPION_BULLET_SPEED)
            ent.shotCd = SCORPION_SHOT_PERIOD
          }
        }
      } else if (ent.kind !== 'gray' && ent.kind !== 'dummy') {
        chase(ent, player, dt, tier)
      }
    }
    for (const ent of targets) {
      if (ent.kind !== 'dummy' || ent.hp <= 0) continue
      ent.hp = Math.min(ent.maxHp ?? DUMMY_HP, ent.hp + DUMMY_REGEN_PER_SEC * dt)
      if ((ent.invuln ?? 0) > 0) {
        ent.invuln = Math.max(0, ent.invuln - dt)
        if (ent.invuln <= 0) ent.moving = false
      }
    }
    tickIceBullets(dt, player)
    contactPlayer(player)
    for (const ent of targets) {
      if ((ent.spawnInvuln ?? 0) > 0) {
        ent.spawnInvuln = Math.max(0, ent.spawnInvuln - dt)
      }
    }
    for (const ent of targets) {
      if (ent.kind === 'gray' && ent.hp > 0) {
        ent.selfAcc = (ent.selfAcc ?? 0) + dt
        while (ent.hp > 0 && ent.selfAcc >= GRAY_SELF_PERIOD) {
          ent.selfAcc -= GRAY_SELF_PERIOD
          ent.takeHit(rollGraySelfDamage(random, elapsed))
        }
      }
    }
    tickOrchidHeals(dt)
    reap()
    tickBursts()
    tickSpawns(dt, player, camera, tier, spawnRate)
  }

  async function loadAssets() {
    if (typeof Image === 'undefined') return null
    const [mushImg, snailImg, splitImg, slime1Img, slime3Img, iceImg, orchidImg, scorpImg, bulletImg, grayImg] =
      await Promise.all([
        loadImage(CREEP_SRC),
        loadImage(SNAIL_SRC),
        loadImage(SPLIT_SRC),
        loadImage(SLIME_X1_SRC),
        loadImage(SLIME_X3_SRC),
        loadImage(ICE_MAN_SRC),
        loadImage(ORCHID_SRC),
        loadImage(SCORPION_SRC),
        loadImage(ICE_BULLET_SRC),
        loadImage(GRAY_SRC),
      ])
    const sheet = (img) => {
      try {
        const base = chromaBlack(img)
        base.armored = outlineSheet(base)
        return base
      } catch {
        return img
      }
    }
    mushroomSheet = sheet(mushImg)
    snailSheet = sheet(snailImg)
    splitSheet = sheet(splitImg)
    slimeX1Sheet = sheet(slime1Img)
    slimeX3Sheet = sheet(slime3Img)
    iceManSheet = sheet(iceImg)
    orchidSheet = sheet(orchidImg)
    scorpionSheet = sheet(scorpImg)
    iceBulletSheet = sheet(bulletImg)
    graySprite = grayImg
    return {
      mushroomSheet,
      snailSheet,
      splitSheet,
      slimeX1Sheet,
      slimeX3Sheet,
      iceManSheet,
      orchidSheet,
      scorpionSheet,
      iceBulletSheet,
      graySprite,
    }
  }

  function draw(ctx) {
    if (!ctx) return
    for (const ent of targets) {
      if (ent.kind === 'gray') drawGray(ctx, ent)
    }
    for (const ent of targets) {
      if (ent.kind === 'creep') {
        if (ent.speedKind === 'split') {
          drawSprite(ctx, splitSheet, ent, { a: '#4a3028', b: '#d07040' })
        } else {
          drawSprite(ctx, mushroomSheet, ent, { a: '#3a2a22', b: '#c45a3a' })
        }
      } else if (ent.kind === 'snail') {
        drawSprite(ctx, snailSheet, ent, { a: '#5a4030', b: '#c4a070' })
      } else if (ent.kind === 'slime_x1') {
        drawSprite(ctx, slimeX1Sheet, ent, { a: '#3a6a4a', b: '#7ec88a' })
      } else if (ent.kind === 'slime_x3') {
        drawSprite(ctx, slimeX3Sheet, ent, { a: '#2a5a3a', b: '#5eaa6a' })
      } else if (ent.kind === 'ice_man') {
        drawSprite(ctx, iceManSheet, ent, { a: '#2a4a6a', b: '#7ec8e8' })
        if (ent.dashPhase === 'telegraph') {
          ctx.strokeStyle = '#e8f4ff'
          ctx.strokeRect(Math.round(ent.x - ent.w / 2) - 1, Math.round(ent.y - ent.h / 2) - 1, ent.w + 2, ent.h + 2)
        }
      } else if (ent.kind === 'orchid') {
        drawSprite(ctx, orchidSheet, ent, { a: '#3a2050', b: '#c878d0' })
      } else if (ent.kind === 'scorpion') {
        drawSprite(ctx, scorpionSheet, ent, { a: '#3a2010', b: '#c87828' })
      } else if (ent.kind === 'dummy') {
        drawStickman(ctx, ent)
      }
    }
    for (const b of iceBullets) {
      drawSprite(ctx, iceBulletSheet, b, { a: '#1a3048', b: '#80d0ff' })
    }
  }

  function drawGray(ctx, ent) {
    const dx = Math.round(ent.x - ent.w / 2)
    const dy = Math.round(ent.y - ent.h / 2)
    const spr = graySprite
    if (spr && spr.complete && spr.naturalWidth) {
      ctx.drawImage(
        spr,
        0,
        0,
        spr.naturalWidth,
        spr.naturalHeight,
        dx,
        dy,
        ent.w,
        ent.h,
      )
      return
    }
    ctx.fillStyle = '#6a6a62'
    ctx.fillRect(dx + ent.w * 0.15, dy + ent.h * 0.1, ent.w * 0.7, ent.h * 0.62)
    ctx.fillStyle = '#4a443c'
    ctx.fillRect(dx + ent.w * 0.4, dy + ent.h * 0.68, ent.w * 0.2, ent.h * 0.32)
  }

  return {
    targets,
    bursts,
    loadAssets,
    update,
    draw,
    spawnCreepAt,
    spawnSnailAt,
    spawnScorpionAt,
    spawnSlimeX1At,
    spawnSlimeX3At,
    spawnGrayAt,
    spawnIceManAt,
    spawnOrchidAt,
    spawnDummyAt,
    setDummyEnabled,
    removeDummy,
    creeps: () => liveOf('creep'),
    snails: () => liveOf('snail'),
    scorpions: () => liveOf('scorpion'),
    slimesX1: () => liveOf('slime_x1'),
    slimesX3: () => liveOf('slime_x3'),
    iceMen: () => liveOf('ice_man'),
    orchids: () => liveOf('orchid'),
    dummies: () => liveOf('dummy'),
    iceBullets,
    grayTrees: () => liveOf('gray'),
  }
}
