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
  SPAWN_WARN_SEC,
  STINGER_ADVANCED_CHANCE,
  STINGER_CRYSTALS,
  STINGER_INTERVAL,
  STINGER_UNLOCK_SEC,
  stingerHp,
  stingerSpawnCount,
  stingerSpeedPx,
  ICE_MAN_ADVANCED_CHANCE,
  SCORPION_FIRST_SHOT_RAND_MAX_SEC,
  ELITE_ADVANCED_CHANCE,
  ELITE_CHANCE_BASE,
  ELITE_CHANCE_PER_MIN,
  ICE_BULLET_DMG,
  ICE_LEAVE_MARGIN,
} from '../spawner/index.js'
import { applyOrchidHeal, stepIceManMove, stepIceManRegen, stepOrchidMove } from './ice.js'
import { stepScorpionMove } from './scorpion.js'
import { outlineSheet } from './outline.js'
import { drawStickman, STICKMAN_H, STICKMAN_W } from '../render/stickman.js'
import {
  BLACK_KEY,
  ARMOR_OUTLINE,
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
  STINGER_SRC,
  ELITE_OUTLINE,
  ICE_BULLET_OUTLINE,
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
  STINGER_SRC,
  ELITE_OUTLINE,
  ICE_BULLET_OUTLINE,
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
  SPAWN_WARN_SEC,
  STINGER_ADVANCED_CHANCE,
  STINGER_CRYSTALS,
  STINGER_INTERVAL,
  STINGER_UNLOCK_SEC,
  stingerHp,
  stingerSpawnCount,
  stingerSpeedMul,
  stingerSpeedPx,
  ICE_MAN_ADVANCED_CHANCE,
  SCORPION_SHOT_PERIOD,
  SCORPION_FIRST_SHOT_RAND_MAX_SEC,
  ELITE_CHANCE_BASE,
  ELITE_CHANCE_PER_MIN,
  ELITE_ADVANCED_CHANCE,
  ICE_BULLET_DMG,
  ICE_LEAVE_MARGIN,
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
  const spr =
    ent.elite && ent.armor > 0 && sheet?.eliteArmored
      ? sheet.eliteArmored
      : ent.elite && sheet?.elite
        ? sheet.elite
        : (ent.armor ?? 0) > 0 && sheet?.armored
          ? sheet.armored
          : sheet
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
  let stingerAcc = 0
  let grayStarted = false
  let snailStarted = false
  let slimeStarted = false
  let scorpionStarted = false
  let stingerStarted = false
  let iceManDeaths = 0
  let iceRespawnAt = null
  let elapsed = 0
  /** P25 生成预警：待生成队列 { kind, x, y, hp, ready }。 */
  const pending = []
  /** P26 四娃/五娃效果粒子：{ x, y, vy, life, maxLife, kind: 'burn' | 'slow', src }。 */
  const particles = []
  const BURN_PARTICLE_INTERVAL = 0.15
  const SLOW_PARTICLE_INTERVAL = 0.2
  const PARTICLE_LIFE = 0.7
  const PARTICLE_RISE = 26
  let mushroomSheet = null
  let snailSheet = null
  let splitSheet = null
  let slimeX1Sheet = null
  let slimeX3Sheet = null
  let iceManSheet = null
  let orchidSheet = null
  let scorpionSheet = null
  let stingerSheet = null
  let iceBulletSheet = null
  let graySprite = null

  function extraHp() {
    const n = opts.getHpGrowthAdd?.()
    return Number.isFinite(n) ? n : 0
  }

  function liveOf(kind) {
    return targets.filter((e) => e.kind === kind && e.hp > 0)
  }

  /** P26 五娃减速消费：slowLeft>0 时移动乘 slowFactor（否则正常）。 */
  function effSpd(ent, base) {
    return (ent.slowLeft ?? 0) > 0 ? base * (ent.slowFactor ?? 1) : base
  }

  /** P26 四娃/五娃粒子：效果激活时生成上升粒子，效果结束或怪物死亡即移除。 */
  function tickParticles(dt) {
    for (const ent of targets) {
      if (ent.hp <= 0) continue
      if ((ent.burnLeft ?? 0) > 0) {
        ent.burnAcc = (ent.burnAcc ?? 0) + dt
        while (ent.burnAcc >= BURN_PARTICLE_INTERVAL) {
          ent.burnAcc -= BURN_PARTICLE_INTERVAL
          particles.push({
            x: ent.x + (random() - 0.5) * ent.w,
            y: ent.y - ent.h * 0.4,
            vy: -PARTICLE_RISE,
            life: PARTICLE_LIFE,
            maxLife: PARTICLE_LIFE,
            kind: 'burn',
            src: ent,
          })
        }
      }
      if ((ent.slowLeft ?? 0) > 0) {
        ent.slowAcc = (ent.slowAcc ?? 0) + dt
        while (ent.slowAcc >= SLOW_PARTICLE_INTERVAL) {
          ent.slowAcc -= SLOW_PARTICLE_INTERVAL
          particles.push({
            x: ent.x + (random() - 0.5) * ent.w,
            y: ent.y - ent.h * 0.4,
            vy: -PARTICLE_RISE,
            life: PARTICLE_LIFE,
            maxLife: PARTICLE_LIFE,
            kind: 'slow',
            src: ent,
          })
        }
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      const src = p.src
      const ended =
        !src ||
        src.hp <= 0 ||
        (p.kind === 'burn' ? (src.burnLeft ?? 0) <= 0 : (src.slowLeft ?? 0) <= 0)
      if (ended) {
        particles.splice(i, 1)
        continue
      }
      p.y += p.vy * dt
      p.life -= dt
      if (p.life <= 0) particles.splice(i, 1)
    }
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
      // P25 蝎子独立 CD：首射随机 0~5s 错峰，之后各自 5s 节奏。
      shotCd: random() * SCORPION_FIRST_SHOT_RAND_MAX_SEC,
      contactDamage: 1,
    })
  }

  function spawnStingerAt(x, y, hp) {
    const h = hp ?? stingerHp(elapsed, extraHp())
    return spawnMob('stinger', x, y, {
      name: '毒刺怪',
      speedKind: 'stinger',
      hp: h,
      maxHp: h,
      knockbackResist: BODY,
      contactDamage: 1,
    })
  }

  /** P25 六娃失锁消费：读 M4 导出的失锁状态（只读本模块），真则近战不靠近、远程不开火。 */
  function isBlind(ent) {
    if (hooks.isTargetBlind?.(ent)) return true
    if (typeof opts.player?.isTargetBlind === 'function' && opts.player.isTargetBlind(ent)) return true
    return (ent.unlockT ?? 0) > 0
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
      contactDamage: ICE_BULLET_DMG,
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

  function spawnIceBullet(x, y, tx, ty, speed = ICE_BULLET_SPEED, dmg = 1) {
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
      dmg,
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

  const ELITE_KINDS = new Set(['creep', 'snail', 'slime_x1', 'scorpion', 'stinger'])

  function isEliteKind(kind) {
    return ELITE_KINDS.has(kind)
  }

  /** P27 强化怪（难度二）：概率 min(1, 0.02 + 0.02×floor(分钟))；难度一恒 false。 */
  function rollElite() {
    if (extraHp() <= 0) return false
    const p = Math.min(1, ELITE_CHANCE_BASE + ELITE_CHANCE_PER_MIN * Math.floor(elapsed / 60))
    return random() < p
  }

  function applyElite(ent) {
    ent.hp *= 2
    ent.maxHp *= 2
    ent.knockbackResist = (ent.knockbackResist ?? 0) + BODY
    ent.elite = true
    return ent
  }

  function spawnKind(kind, x, y, hp, opts = {}) {
    let ent
    if (kind === 'creep') ent = spawnCreepAt(x, y, opts.speedKind ?? 'regular', hp)
    else if (kind === 'snail') ent = spawnSnailAt(x, y, hp)
    else if (kind === 'slime_x1') ent = spawnSlimeX1At(x, y, hp)
    else if (kind === 'scorpion') ent = spawnScorpionAt(x, y, hp)
    else if (kind === 'stinger') ent = spawnStingerAt(x, y, hp)
    else ent = spawnGrayAt(x, y, hp)
    if (opts.elite) applyElite(ent)
    return ent
  }

  /** P27 红圈全怪：只对「可生成敌人」显示出生前红圈；灰树/boss/兰花/树/木桩不加。 */
  const SPAWN_WARN_KINDS = new Set(['creep', 'snail', 'slime_x1', 'scorpion', 'stinger'])

  /** P25 生成预警：先入 pending，SPAWN_WARN_SEC 后才真正出生（这期间画红圈）。 */
  function trySpawn(kind, hp, tFocus, camera) {
    const pos = pickNearOutOfView(tFocus, camera, random, BODY)
    if (!SPAWN_WARN_KINDS.has(kind)) return spawnKind(kind, pos.x, pos.y, hp)
    const elite = isEliteKind(kind) && rollElite()
    pending.push({
      kind,
      x: pos.x,
      y: pos.y,
      hp,
      ready: elapsed + SPAWN_WARN_SEC,
      speedKind: kind === 'creep' ? 'regular' : undefined,
      elite,
    })
  }

  function tickPendings(player) {
    for (let i = pending.length - 1; i >= 0; i--) {
      const p = pending[i]
      if (elapsed < p.ready - 1e-9) continue
      spawnKind(p.kind, p.x, p.y, p.hp, { speedKind: p.speedKind, elite: p.elite })
      pending.splice(i, 1)
    }
  }

  /** 高级结晶掉落：每个独立掷 advancedChance；优先走 M7 的 spawnCrystalAt。 */
  function spawnDrop(x, y, advanced) {
    if (advanced && typeof hooks.spawnCrystalAt === 'function') {
      hooks.spawnCrystalAt(x, y, { advanced: true })
      return
    }
    hooks.spawnCrystal?.(x, y)
  }

  function dropCrystals(x, y, n, advancedChance = 0) {
    for (let i = 0; i < n; i++) {
      const jx = (random() - 0.5) * BODY
      const jy = (random() - 0.5) * BODY
      const advanced = advancedChance > 0 && random() < advancedChance
      spawnDrop(x + jx, y + jy, advanced)
    }
  }

  function dropIceCrystals(ent) {
    dropCrystals(ent.x, ent.y, ICE_MAN_CRYSTALS, ICE_MAN_ADVANCED_CHANCE)
  }

  /** 普通怪结晶数量（强化怪沿用同数量，仅概率不同）。 */
  function normalCrystalCount(ent) {
    if (ent.kind === 'scorpion') return SCORPION_CRYSTALS
    if (ent.kind === 'slime_x1') return SLIME_X1_CRYSTALS
    if (ent.kind === 'stinger') return STINGER_CRYSTALS
    if (ent.kind === 'slime_x3') return rollSlimeX3Crystals(random)
    if (ent.kind === 'orchid' || ent.kind === 'dummy') return 0
    return 1
  }

  function killCreep(ent) {
    if (ent.kind === 'ice_man') {
      iceManDeaths += 1
      iceRespawnAt = elapsed + ICE_MAN_RESPAWN_SEC
      dropIceCrystals(ent)
      hooks.onKill?.(ent)
      return
    }
    if (ent.elite) {
      const n = normalCrystalCount(ent)
      dropCrystals(ent.x, ent.y, n, ELITE_ADVANCED_CHANCE)
      if (n > 0) hooks.onExp?.(n)
      hooks.onKill?.(ent)
      return
    }
    if (ent.kind === 'stinger') {
      dropCrystals(ent.x, ent.y, STINGER_CRYSTALS, STINGER_ADVANCED_CHANCE)
      hooks.onExp?.(STINGER_CRYSTALS)
      hooks.onKill?.(ent)
      return
    }
    const n = normalCrystalCount(ent)
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
    // P25 六娃失锁：近战不靠近。
    if (isBlind(ent)) return
    let spd
    if (ent.kind === 'slime_x1') {
      ent.speedMul = slimeX1SpeedMul(elapsed)
      spd = SPEED_PX_PER_UNIT * ent.speedMul
    } else if (ent.kind === 'slime_x3') {
      spd = SPEED_PX_PER_UNIT * (ent.speedMul ?? slimeX1SpeedMul(elapsed) + SLIME_X3_SPEED_BONUS)
    } else if (ent.kind === 'snail') spd = snailSpeedPx(elapsed)
    else if (ent.kind === 'stinger') spd = stingerSpeedPx(elapsed)
    else if (ent.speedKind === 'split') spd = splitSpeedPx(tier)
    else spd = creepSpeedPx(tier)
    spd = effSpd(ent, spd)
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
      focus.takeDamage?.(ent.contactDamage ?? 1)
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
        // P27 红圈全怪：裂怪也走待生成红圈；强化怪同样掷概率。
        pending.push({
          kind: 'creep',
          x: pos.x,
          y: pos.y,
          hp,
          ready: elapsed + SPAWN_WARN_SEC,
          speedKind: 'split',
          elite: isEliteKind('creep') && rollElite(),
        })
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
    if (elapsed < STINGER_UNLOCK_SEC) {
      while (creepAcc >= cInt) {
        creepAcc -= cInt
        spawnWave('creep', mushroomSpawnCount(elapsed), rate, mushroomHp(elapsed, extraHp()), focus, camera)
      }
    } else {
      // P25：300s 起蘑菇怪停刷，刷怪位由毒刺怪接管（场上存量保留至死亡）。
      creepAcc = 0
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

    if (elapsed < STINGER_UNLOCK_SEC) {
      stingerAcc = 0
      stingerStarted = false
    } else if (!stingerStarted) {
      stingerStarted = true
      spawnWave('stinger', stingerSpawnCount(elapsed), rate, stingerHp(elapsed, extraHp()), focus, camera)
      stingerAcc = 0
    } else {
      stingerAcc += dt
      while (stingerAcc >= STINGER_INTERVAL) {
        stingerAcc -= STINGER_INTERVAL
        spawnWave('stinger', stingerSpawnCount(elapsed), rate, stingerHp(elapsed, extraHp()), focus, camera)
      }
    }

    if (
      elapsed >= ICE_MAN_UNLOCK_SEC &&
      liveOf('ice_man').length === 0 &&
      (iceRespawnAt == null || elapsed >= iceRespawnAt) &&
      focus &&
      camera
    ) {
      // P27：boss 不加红圈预警，直接出生。
      const pos = pickNearOutOfView(focus, camera, random, BODY)
      spawnIceManAt(pos.x, pos.y, focus, iceManRespawnHp(iceManDeaths))
    }
  }

  function fireBarrageShot(shot, camera, player) {
    const pts = barragePoints(shot.group, camera)
    const pt = pts[shot.i]
    if (!pt || !player) return
    spawnIceBullet(pt.x, pt.y, player.x, player.y, ICE_BULLET_SPEED, ICE_BULLET_DMG)
  }

  function tickIceAbilities(ent, player, camera, dt) {
    if (ent.kind !== 'ice_man' || ent.hp <= 0) return
    // P25 六娃失锁：不锁定角色，不新开冲刺/弹幕（已在飞/已在冲的跑完）。
    const blind = isBlind(ent)

    if (ent.dashPhase === 'telegraph') {
      ent.dashT -= dt
      if (ent.dashT <= 0 && player && !blind) {
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
      } else if (ent.dashT <= 0 && blind) {
        ent.dashPhase = 'idle'
        ent.dashCd = ICE_DASH_PERIOD
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
      if (ent.dashCd <= 0 && !blind) {
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
      if (ent.barrageCd <= 0 && camera && !blind) {
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
          player.takeDamage?.(b.dmg ?? 1)
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
        const mode = stepScorpionMove(ent, player, dt, effSpd(ent, scorpionSpeedPx(elapsed)))
        if (mode === 'hold' && player && !isBlind(ent)) {
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
      if ((ent.unlockT ?? 0) > 0) {
        ent.unlockT = Math.max(0, ent.unlockT - dt)
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
    tickPendings(player)
    tickParticles(dt)
    tickSpawns(dt, player, camera, tier, spawnRate)
  }

  async function loadAssets() {
    if (typeof Image === 'undefined') return null
    const [mushImg, snailImg, splitImg, slime1Img, slime3Img, iceImg, orchidImg, scorpImg, stingerImg, bulletImg, grayImg] =
      await Promise.all([
        loadImage(CREEP_SRC),
        loadImage(SNAIL_SRC),
        loadImage(SPLIT_SRC),
        loadImage(SLIME_X1_SRC),
        loadImage(SLIME_X3_SRC),
        loadImage(ICE_MAN_SRC),
        loadImage(ORCHID_SRC),
        loadImage(SCORPION_SRC),
        loadImage(STINGER_SRC),
        loadImage(ICE_BULLET_SRC),
        loadImage(GRAY_SRC),
      ])
    const sheet = (img) => {
      try {
        const base = chromaBlack(img)
        base.armored = outlineSheet(base, ARMOR_OUTLINE)
        base.elite = outlineSheet(base, ELITE_OUTLINE)
        base.eliteArmored = outlineSheet(base.armored, ELITE_OUTLINE)
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
    stingerSheet = sheet(stingerImg)
    // P27 冰人子弹：素材最外圈蓝色。
    iceBulletSheet = outlineSheet(chromaBlack(bulletImg), ICE_BULLET_OUTLINE)
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
      stingerSheet,
      iceBulletSheet,
      graySprite,
    }
  }

  function draw(ctx) {
    if (!ctx) return
    // P25 生成预警：出生前落点画红色空心圈占位。
    ctx.strokeStyle = '#ff4040'
    ctx.lineWidth = 1
    for (const p of pending) {
      if (elapsed >= p.ready - 1e-9) continue
      const radius = p.kind === 'ice_man' ? ICE_MAN_DRAW / 2 : CREEP_DRAW / 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
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
      } else if (ent.kind === 'stinger') {
        drawSprite(ctx, stingerSheet, ent, { a: '#4a2a1a', b: '#d87838' })
      } else if (ent.kind === 'dummy') {
        drawStickman(ctx, ent)
      }
    }
    // P26 四娃/五娃粒子：越升颜色越浅（越靠近生命末端越浅）。
    for (const p of particles) {
      const t = 1 - Math.max(0, p.life) / p.maxLife
      const a = 0.2 + 0.8 * (p.life / p.maxLife)
      const px = Math.round(p.x)
      const py = Math.round(p.y)
      if (p.kind === 'burn') {
        ctx.fillStyle = `rgba(255, ${Math.round(60 + 120 * t)}, ${Math.round(50 + 150 * t)}, ${a})`
      } else {
        ctx.fillStyle = `rgba(${Math.round(70 + 120 * t)}, ${Math.round(140 + 110 * t)}, 255, ${a})`
      }
      ctx.fillRect(px - 1, py - 1, 2, 2)
      ctx.fillRect(px - 3, py + 1, 2, 2)
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
    spawnStingerAt,
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
    stingers: () => liveOf('stinger'),
    pending,
    particles,
    slimesX1: () => liveOf('slime_x1'),
    slimesX3: () => liveOf('slime_x3'),
    iceMen: () => liveOf('ice_man'),
    orchids: () => liveOf('orchid'),
    dummies: () => liveOf('dummy'),
    iceBullets,
    grayTrees: () => liveOf('gray'),
  }
}
