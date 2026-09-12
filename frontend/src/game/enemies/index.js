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
  ANIM_FRAME_SEC,
  BLACK_KEY,
  ARMOR_OUTLINE,
  BULLET_OUTLINE,
  CREEP_ANIM_SEC,
  CREEP_DRAW,
  CREEP_FRAME_KINDS,
  CREEP_FRAME_NAMES,
  CREEP_FRAMES,
  GRAY_DRAW,
  GRAY_SRC,
  creepFrameSrcs,
  ICE_BULLET_DRAW,
  ICE_BULLET_SPRITE_DRAW,
  ICE_BULLET_SRC,
  ICE_BULLET_TIP_ANGLE,
  ICE_BULLET_TIP_OFFSET,
  ICE_MAN_ANIM_SEC,
  ICE_MAN_DRAW,
  ICE_MAN_FRAME_NAMES,
  ICE_MAN_FRAMES,
  iceManFrameSrcs,
  ORCHID_DRAW,
  ELITE_OUTLINE,
  SCORPION_BULLET_SRC,
  SCORPION_BULLET_SPRITE_DRAW,
} from './constants.js'

export { outlinePixels, outlineSheet } from './outline.js'

export {
  ANIM_FPS,
  ANIM_FRAME_SEC,
  ARMOR_OUTLINE,
  BULLET_OUTLINE,
  CREEP_ANIM_FPS,
  CREEP_ANIM_SEC,
  CREEP_DRAW,
  CREEP_FRAME_KINDS,
  CREEP_FRAME_NAMES,
  CREEP_FRAME_SEC,
  CREEP_FRAMES,
  CREEP_SRC,
  GRAY_DRAW,
  GRAY_SRC,
  creepFrameSrcs,
  ICE_BULLET_DRAW,
  ICE_BULLET_SRC,
  ICE_BULLET_SPRITE_DRAW,
  ICE_BULLET_TIP_ANGLE,
  ICE_BULLET_TIP_OFFSET,
  ICE_MAN_ANIM_SEC,
  ICE_MAN_DRAW,
  ICE_MAN_FRAME_NAMES,
  ICE_MAN_FRAMES,
  ICE_MAN_SRC,
  iceManFrameSrcs,
  ORCHID_SRC,
  SCORPION_BULLET_SRC,
  SCORPION_BULLET_SPRITE_DRAW,
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

/**
 * P42：按时间取帧内核（纯函数，便于断言）。帧时长 0.1s（10fps），对帧数取模、无限循环。
 * 越界 / 负时间 / 非有限数 / 非法帧数一律兜底到第 0 帧，不抛错、不产生越界索引。
 * @param {number} t 该实例的动画时间（秒）
 * @param {number} frames 帧数
 * @returns {number} 合法帧索引 [0, frames-1]
 */
export function animFrameAt(t, frames) {
  const n = Number.isFinite(frames) ? Math.floor(frames) : 0
  if (n <= 0) return 0
  if (!Number.isFinite(t) || t <= 0) return 0
  // 0.3 / 0.1 在 IEEE754 下是 2.9999999999999996，加极小量再向下取整，避免少走一帧。
  const i = Math.floor(t / ANIM_FRAME_SEC + 1e-9)
  if (!Number.isFinite(i) || i < 0) return 0
  return i % n
}

/**
 * P42 批次4：小怪按时间取帧（纯函数）。4 帧一轮 0.4s：t=0/0.1/0.2/0.3 → 0/1/2/3，t=0.4 回 0。
 * @param {string} _kind 小怪键（为将来按怪分口径预留；当前 8 种共用同一口径）
 * @param {number} t 该实例的动画时间（秒）
 * @param {number} [frames] 帧数，默认 CREEP_FRAMES
 */
export function creepFrameAt(_kind, t, frames = CREEP_FRAMES) {
  return animFrameAt(t, frames)
}

/** P42 批次6：冰人按时间取帧（纯函数）。6 帧一轮 0.6s：t=0..0.5 → 0..5，t=0.6 回 0。 */
export function iceManFrameAt(t, frames = ICE_MAN_FRAMES) {
  return animFrameAt(t, frames)
}

/**
 * P42 批次6 R3：冰人子弹的绘制旋转角（纯函数）= 飞行角 + 源图尖头补偿。
 * 源图冰锥尖头朝 -Y（实测），补偿 ICE_BULLET_TIP_OFFSET = +π/2 后，尖头在任意飞行角都朝前。
 * @param {number} vx 速度 x（像素/秒）
 * @param {number} vy 速度 y（像素/秒）
 */
export function iceBulletRotation(vx, vy) {
  return Math.atan2(vy ?? 0, vx ?? 0) + ICE_BULLET_TIP_OFFSET
}

/** P42：相位用 random() 的 kind（批次4 已验收口径，保持不变）。 */
const RANDOM_PHASE_KINDS = new Set([
  'creep',
  'snail',
  'slime_x1',
  'slime_x3',
  'scorpion',
  'stinger',
  'orchid',
])

/** P42：走序列帧的 kind（灰树不经 spawnMob，在 spawnGrayAt 里单独挂相位）。 */
const ANIMATED_KINDS = new Set([...RANDOM_PHASE_KINDS, 'ice_man'])

/** kind（+ 裂怪的 speedKind）→ 序列帧表键。 */
function animKeyOf(ent) {
  if (ent?.kind === 'creep') return ent.speedKind === 'split' ? 'split' : 'creep'
  return ent?.kind
}

/** 全部序列帧表（键 → 文件名数组）。灰树不在内（批次7 已回单帧）。 */
const ANIM_FRAME_NAMES = {
  ...CREEP_FRAME_NAMES,
  ice_man: ICE_MAN_FRAME_NAMES,
}

/** 该怪一轮的帧数（表项缺失时退回 CREEP_FRAMES）。 */
function animFramesOf(key) {
  const n = ANIM_FRAME_NAMES[key]?.length
  return Number.isFinite(n) && n > 0 ? n : CREEP_FRAMES
}

/** 该怪一轮的秒数（相位按各自轮长折算）。 */
function animCycleOf(key) {
  if (key === 'ice_man') return ICE_MAN_ANIM_SEC
  return CREEP_ANIM_SEC
}

/**
 * P42：冰人的实例相位**刻意不消耗 random()**，改用按实例序号的金比错开 ——
 * 生成管线里有既有断言按顺序取随机数（如灰树自伤 rolls=[0,0.99]），多掷一次会打乱它们。
 */
let animSeq = 0
const ANIM_PHASE_STEP = 0.6180339887498949
function nextAnimPhase() {
  animSeq = (animSeq + 1) % 4096
  return (animSeq * ANIM_PHASE_STEP) % 1
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

/**
 * 选中该帧的贴图（含护甲黄边 / 精英紫边变体）。
 * sheets 为按帧序的数组时按 frame 取帧；该帧缺图（加载失败 / 未接线）则退回第 0 帧。
 * @returns {*} 可用贴图，或 null（交给兜底色块）
 */
function spriteOf(sheets, ent, frame) {
  const list = Array.isArray(sheets) ? sheets : [sheets]
  const n = list.length
  const fi = Number.isFinite(frame) ? Math.floor(frame) : 0
  const order = fi > 0 && n > 0 ? [((fi % n) + n) % n, 0] : [0]
  for (const i of order) {
    const s = list[i]
    if (!s) continue
    const spr =
      ent.elite && ent.armor > 0 && s.eliteArmored
        ? s.eliteArmored
        : ent.elite && s.elite
          ? s.elite
          : (ent.armor ?? 0) > 0 && s.armored
            ? s.armored
            : s
    if (spr && (spr.naturalWidth || spr.width)) return spr
  }
  return null
}

function drawSprite(ctx, sheets, ent, fallback, frame = 0) {
  const dx = Math.round(ent.x - ent.w / 2)
  const dy = Math.round(ent.y - ent.h / 2)
  const spr = spriteOf(sheets, ent, frame)
  if (spr) {
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
  /** P42：8 种小怪各 4 帧贴图数组（按帧序，元素为 sheet() 抠图/描边结果）。 */
  let creepSheets = null
  let snailSheets = null
  let splitSheets = null
  let slimeX1Sheets = null
  let slimeX3Sheets = null
  let orchidSheets = null
  let scorpionSheets = null
  let stingerSheets = null
  /** 冰人 6 帧贴图（按帧序数组）；灰树单帧；两类弹体各自的贴图。 */
  let iceManSheets = null
  let graySprite = null
  let iceBulletSheet = null
  let scorpionBulletSheet = null

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
    if (ANIMATED_KINDS.has(kind)) {
      // P42 序列帧：每只怪按实例错开相位（同屏不整齐划一）；动画时间只在 update（=playing）里推进。
      mob.animPhase = RANDOM_PHASE_KINDS.has(kind) ? random() : nextAnimPhase()
      mob.animT = 0
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

  /**
   * P42 批次7 R1④：通用怪物弹体（物理/命中/生命期两类共用；判定盒一律 ICE_BULLET_DRAW）。
   * `kind` 决定贴图与绘制口径：'ice' = 冰锥（旋转 + 尖端补偿），'scorpion' = 旧弹体（轴对齐、不补偿）。
   */
  function spawnBullet(x, y, tx, ty, speed, dmg, kind) {
    const dx = (tx ?? x) - x
    const dy = (ty ?? y) - y
    const len = Math.hypot(dx, dy) || 1
    const spd = speed ?? ICE_BULLET_SPEED
    iceBullets.push({
      kind,
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

  /** 冰人：冰锥弹（弹幕 + 近身接触都用这条）。 */
  function spawnIceBullet(x, y, tx, ty, speed = ICE_BULLET_SPEED, dmg = 1) {
    return spawnBullet(x, y, tx, ty, speed, dmg, 'ice')
  }

  /** 蝎子怪：旧弹体（怪物子弹.png）。速度/伤害/发射节奏沿用原常量，与冰人彻底分开。 */
  function spawnScorpionBullet(x, y, tx, ty, speed = SCORPION_BULLET_SPEED, dmg = 1) {
    return spawnBullet(x, y, tx, ty, speed, dmg, 'scorpion')
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
      // P42 批次7 R2：灰树回单帧 —— 不再有 animPhase / animT（无序列帧状态）。
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

  /** 场上敌方弹体的 kind 白名单：只有冰人的冰锥与蝎子怪的旧弹体（其它 kind 一律不碰）。 */
  const ENEMY_BULLET_KINDS = new Set(['ice', 'scorpion'])

  /**
   * P42 批次8 R1：按**圆形区域**清除敌方弹体（战士斩返：弹反即消失）。
   * 只删 iceBullets 里 kind ∈ {ice, scorpion} 的条目 —— 不动任何实体（targets）、bursts、particles，
   * 也不改弹体生成 / 速度 / 伤害 / 判定 / 绘制。
   * 边界：圆内或正好压在圆上算命中（闭圆）；参数非法（非有限数 / 负半径 / 缺参）或场上无弹体 → 返回 0，不抛错。
   * @param {{ x?: number, y?: number, radius?: number }} [circle] 以角色为中心的圆
   * @returns {number} 被清除的敌方弹体数量
   */
  function clearBulletsIn(circle) {
    const cx = circle?.x
    const cy = circle?.y
    const r = circle?.radius
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r) || r < 0) return 0
    const r2 = r * r
    let removed = 0
    for (let i = iceBullets.length - 1; i >= 0; i--) {
      const b = iceBullets[i]
      if (!ENEMY_BULLET_KINDS.has(b?.kind)) continue
      const dx = b.x - cx
      const dy = b.y - cy
      if (dx * dx + dy * dy > r2) continue
      iceBullets.splice(i, 1)
      removed += 1
    }
    return removed
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
      // P42 序列帧：动画时间只随本窗 update 的 dt 推进；暂停/升级时 match.js 不调 update ⇒ 整帧停住。
      if (ent.animPhase !== undefined) ent.animT = (ent.animT ?? 0) + dt
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
            spawnScorpionBullet(ent.x, ent.y, player.x, player.y, SCORPION_BULLET_SPEED)
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
    // P42 批次7：8 种小怪 ×4 帧 + 冰人 ×6 帧 = 38 张序列帧；灰树回单帧；两类弹体各一张。
    const [animImgs, iceImgs, grayImg, iceBulletImg, scorpionBulletImg] = await Promise.all([
      Promise.all(
        CREEP_FRAME_KINDS.map((key) =>
          Promise.all(creepFrameSrcs(key).map((src) => loadImage(src))),
        ),
      ),
      Promise.all(iceManFrameSrcs().map((src) => loadImage(src))),
      loadImage(GRAY_SRC),
      loadImage(ICE_BULLET_SRC),
      loadImage(SCORPION_BULLET_SRC),
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
    const sheetsByKey = {}
    CREEP_FRAME_KINDS.forEach((key, i) => {
      sheetsByKey[key] = (animImgs[i] ?? []).map((img) => sheet(img))
    })
    creepSheets = sheetsByKey.creep
    splitSheets = sheetsByKey.split
    snailSheets = sheetsByKey.snail
    slimeX1Sheets = sheetsByKey.slime_x1
    slimeX3Sheets = sheetsByKey.slime_x3
    scorpionSheets = sheetsByKey.scorpion
    stingerSheets = sheetsByKey.stinger
    orchidSheets = sheetsByKey.orchid
    // 冰人 6 帧：与 8 种小怪同样抠黑 + 描边变体。
    iceManSheets = iceImgs.map((img) => sheet(img))
    // 灰树：单帧，沿用原「不抠黑、直接画」路径（不预加载 灰树-2/-3/-4.png）。
    graySprite = grayImg
    // 两类弹体各自的贴图（同一条蓝色描边）；冰锥只给冰人，怪物子弹只给蝎子怪。
    iceBulletSheet = outlineSheet(chromaBlack(iceBulletImg), BULLET_OUTLINE)
    scorpionBulletSheet = outlineSheet(chromaBlack(scorpionBulletImg), BULLET_OUTLINE)
    return {
      creepSheets,
      snailSheets,
      splitSheets,
      slimeX1Sheets,
      slimeX3Sheets,
      iceManSheets,
      orchidSheets,
      scorpionSheets,
      stingerSheets,
      iceBulletSheet,
      scorpionBulletSheet,
      graySprite,
    }
  }

  /** P42：该实例当前应画的帧（时间驱动 + 本实例相位）。小怪 / 冰人共用（灰树、木桩单帧）。 */
  function animFrameOf(ent) {
    if (!ent) return 0
    const key = animKeyOf(ent)
    const t = (ent.animT ?? 0) + (ent.animPhase ?? 0) * animCycleOf(key)
    return animFrameAt(t, animFramesOf(key))
  }

  /** 批次4 的旧名（等价于 animFrameOf），保留以免断掉既有接线/断言。 */
  const creepFrameOf = animFrameOf

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
      // P42：小怪 / 冰人 / 灰树按「时间取帧」画序列帧（木桩仍是单帧）。
      const frame = animFrameOf(ent)
      if (ent.kind === 'creep') {
        if (ent.speedKind === 'split') {
          drawSprite(ctx, splitSheets, ent, { a: '#4a3028', b: '#d07040' }, frame)
        } else {
          drawSprite(ctx, creepSheets, ent, { a: '#3a2a22', b: '#c45a3a' }, frame)
        }
      } else if (ent.kind === 'snail') {
        drawSprite(ctx, snailSheets, ent, { a: '#5a4030', b: '#c4a070' }, frame)
      } else if (ent.kind === 'slime_x1') {
        drawSprite(ctx, slimeX1Sheets, ent, { a: '#3a6a4a', b: '#7ec88a' }, frame)
      } else if (ent.kind === 'slime_x3') {
        drawSprite(ctx, slimeX3Sheets, ent, { a: '#2a5a3a', b: '#5eaa6a' }, frame)
      } else if (ent.kind === 'ice_man') {
        drawSprite(ctx, iceManSheets, ent, { a: '#2a4a6a', b: '#7ec8e8' }, frame)
        if (ent.dashPhase === 'telegraph') {
          ctx.strokeStyle = '#e8f4ff'
          ctx.strokeRect(Math.round(ent.x - ent.w / 2) - 1, Math.round(ent.y - ent.h / 2) - 1, ent.w + 2, ent.h + 2)
        }
      } else if (ent.kind === 'orchid') {
        drawSprite(ctx, orchidSheets, ent, { a: '#3a2050', b: '#c878d0' }, frame)
      } else if (ent.kind === 'scorpion') {
        drawSprite(ctx, scorpionSheets, ent, { a: '#3a2010', b: '#c87828' }, frame)
      } else if (ent.kind === 'stinger') {
        drawSprite(ctx, stingerSheets, ent, { a: '#4a2a1a', b: '#d87838' }, frame)
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
      if (b.kind === 'scorpion') drawScorpionBullet(ctx, b)
      else drawIceBullet(ctx, b)
    }
  }

  /**
   * P42 批次6 R3（只属于冰人）：冰锥按飞行角旋转绘制，尖头朝前。
   * 源图尖头朝 -Y，故旋转 = atan2(vy, vx) + ICE_BULLET_TIP_OFFSET；判定尺寸仍用 b.w / b.h（未改）。
   */
  function drawIceBullet(ctx, b) {
    const spr = spriteOf(iceBulletSheet, b, 0)
    if (!spr) {
      drawSprite(ctx, iceBulletSheet, b, { a: '#1a3048', b: '#80d0ff' })
      return
    }
    const sw = spr.naturalWidth || spr.width
    const sh = spr.naturalHeight || spr.height
    const size = ICE_BULLET_SPRITE_DRAW
    ctx.save()
    ctx.translate(Math.round(b.x), Math.round(b.y))
    ctx.rotate(iceBulletRotation(b.vx ?? 0, b.vy ?? 0))
    ctx.drawImage(spr, 0, 0, sw, sh, -size / 2, -size / 2, size, size)
    ctx.restore()
  }

  /**
   * P42 批次7 R1（只属于蝎子怪）：观感回到批次6 之前 —— 怪物子弹.png、轴对齐、尺寸 = 判定盒(4)、
   * **不旋转、不加尖头角补偿**；与冰人的 drawIceBullet 是两条独立路径。
   */
  function drawScorpionBullet(ctx, b) {
    const spr = spriteOf(scorpionBulletSheet, b, 0)
    const size = SCORPION_BULLET_SPRITE_DRAW
    const dx = Math.round(b.x - size / 2)
    const dy = Math.round(b.y - size / 2)
    if (spr) {
      const sw = spr.naturalWidth || spr.width
      const sh = spr.naturalHeight || spr.height
      ctx.drawImage(spr, 0, 0, sw, sh, dx, dy, size, size)
      return
    }
    ctx.fillStyle = '#1a3048'
    ctx.fillRect(dx, dy, size, size)
    ctx.fillStyle = '#80d0ff'
    ctx.fillRect(dx + 4, dy + 4, 6, 6)
  }

  /** P42 批次7 R2：灰树单帧（只用 灰树.png 第 1 帧，不按时间取帧）。 */
  function drawGray(ctx, ent) {
    const dx = Math.round(ent.x - ent.w / 2)
    const dy = Math.round(ent.y - ent.h / 2)
    const spr = graySprite
    if (spr && (spr.naturalWidth || spr.width)) {
      const sw = spr.naturalWidth || spr.width
      const sh = spr.naturalHeight || spr.height
      ctx.drawImage(spr, 0, 0, sw, sh, dx, dy, ent.w, ent.h)
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
    clearBulletsIn,
    animFrameOf,
    creepFrameOf,
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
