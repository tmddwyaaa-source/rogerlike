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
  SLIME_X1_CRYSTALS,
  SLIME_X1_INTERVAL,
  SLIME_X1_UNLOCK_SEC,
  SLIME_X3_INVULN_SEC,
  SLIME_X3_SPLIT_COUNT,
  SLIME_X3_SPEED_BONUS,
  SNAIL_INTERVAL,
  SNAIL_UNLOCK_SEC,
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
  rollGraySelfDamage,
  rollSlimeX3Crystals,
  scaledWaveCount,
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
import {
  BLACK_KEY,
  CREEP_DRAW,
  CREEP_SRC,
  GRAY_DRAW,
  GRAY_SRC,
  SLIME_X1_SRC,
  SLIME_X3_SRC,
  SNAIL_SRC,
  SPLIT_SRC,
} from './constants.js'

export {
  CREEP_DRAW,
  CREEP_FRAMES,
  CREEP_SRC,
  GRAY_DRAW,
  GRAY_SRC,
  SLIME_X1_SRC,
  SLIME_X3_SRC,
  SNAIL_SRC,
  SPLIT_SRC,
} from './constants.js'

export {
  CREEP_HP,
  GRAY_BURST_COUNT,
  GRAY_BURST_DELAY,
  GRAY_BURST_RADIUS,
  GRAY_SELF_PERIOD,
  GRAY_UNLOCK_SEC,
  SLIME_X1_UNLOCK_SEC,
  SLIME_X3_INVULN_SEC,
  SNAIL_UNLOCK_SEC,
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
  rollGraySelfDamage,
  rollSlimeX3Crystals,
  scaledWaveCount,
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
  if (sheet && (sheet.naturalWidth || sheet.width)) {
    const sw = sheet.naturalWidth || sheet.width
    const sh = sheet.naturalHeight || sheet.height
    ctx.drawImage(sheet, 0, 0, sw, sh, dx, dy, ent.w, ent.h)
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
  let creepAcc = 0
  let grayAcc = 0
  let snailAcc = 0
  let slimeAcc = 0
  let grayStarted = false
  let snailStarted = false
  let slimeStarted = false
  let elapsed = 0
  let mushroomSheet = null
  let snailSheet = null
  let splitSheet = null
  let slimeX1Sheet = null
  let slimeX3Sheet = null
  let graySprite = null

  function liveOf(kind) {
    return targets.filter((e) => e.kind === kind && e.hp > 0)
  }

  function bindTakeHit(ent, onDead) {
    ent.takeHit = (dmg) => {
      if (ent.hp <= 0 || dmg <= 0) return
      if ((ent.spawnInvuln ?? 0) > 0) return
      ent.hp -= dmg
      if (ent.hp <= 0) {
        ent.hp = 0
        onDead(ent)
      }
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
      ...extra,
    }
    bindTakeHit(mob, () => {
      mob.dead = true
    })
    targets.push(mob)
    return mob
  }

  function spawnCreepAt(x, y, speedKind = 'regular', hp) {
    const h = hp ?? mushroomHp(elapsed)
    return spawnMob('creep', x, y, {
      name: speedKind === 'split' ? '裂怪' : '蘑菇怪',
      speedKind,
      hp: h,
      maxHp: h,
      knockbackResist: 0,
    })
  }

  function spawnSnailAt(x, y, hp) {
    const h = hp ?? snailHp(elapsed)
    return spawnMob('snail', x, y, {
      name: '蜗牛怪',
      speedKind: 'snail',
      hp: h,
      maxHp: h,
      knockbackResist: BODY,
    })
  }

  function spawnSlimeX1At(x, y, hp) {
    const h = hp ?? slimeX1Hp(elapsed)
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
    const spawnHp = parent?.spawnHp ?? parent?.maxHp ?? slimeX1Hp(elapsed)
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
    return spawnGrayAt(pos.x, pos.y, hp)
  }

  function killCreep(ent) {
    let n = 1
    if (ent.kind === 'slime_x1') n = SLIME_X1_CRYSTALS
    else if (ent.kind === 'slime_x3') n = rollSlimeX3Crystals(random)
    for (let i = 0; i < n; i++) hooks.spawnCrystal?.(ent.x, ent.y)
    hooks.onExp?.(n)
    hooks.onKill?.(ent)
  }

  function reap() {
    for (let i = targets.length - 1; i >= 0; i--) {
      const ent = targets[i]
      if (ent.hp > 0 && !ent.dead) continue
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
      const hp = mushroomHp(elapsed)
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
      spawnWave('creep', mushroomSpawnCount(elapsed), rate, mushroomHp(elapsed), focus, camera)
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
      spawnWave('snail', snailSpawnCount(elapsed), rate, snailHp(elapsed), focus, camera)
      snailAcc = 0
    } else {
      snailAcc += dt
      while (snailAcc >= SNAIL_INTERVAL) {
        snailAcc -= SNAIL_INTERVAL
        spawnWave('snail', snailSpawnCount(elapsed), rate, snailHp(elapsed), focus, camera)
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
        slimeX1Hp(elapsed),
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
          slimeX1Hp(elapsed),
          focus,
          camera,
        )
      }
    }
  }

  function update(dt, focus, camera, elapsedSec, spawnRate = 1) {
    if (dt <= 0) return
    elapsed = elapsedSec ?? elapsed + dt
    const tier = difficultyTier(elapsed)
    const player = focus ?? opts.player

    for (const ent of targets) {
      if (ent.kind !== 'gray' && ent.hp > 0) chase(ent, player, dt, tier)
    }
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
          ent.takeHit(rollGraySelfDamage(random))
        }
      }
    }
    reap()
    tickBursts()
    tickSpawns(dt, player, camera, tier, spawnRate)
  }

  async function loadAssets() {
    if (typeof Image === 'undefined') return null
    const [mushImg, snailImg, splitImg, slime1Img, slime3Img, grayImg] = await Promise.all([
      loadImage(CREEP_SRC),
      loadImage(SNAIL_SRC),
      loadImage(SPLIT_SRC),
      loadImage(SLIME_X1_SRC),
      loadImage(SLIME_X3_SRC),
      loadImage(GRAY_SRC),
    ])
    const sheet = (img) => {
      try {
        return chromaBlack(img)
      } catch {
        return img
      }
    }
    mushroomSheet = sheet(mushImg)
    snailSheet = sheet(snailImg)
    splitSheet = sheet(splitImg)
    slimeX1Sheet = sheet(slime1Img)
    slimeX3Sheet = sheet(slime3Img)
    graySprite = grayImg
    return { mushroomSheet, snailSheet, splitSheet, slimeX1Sheet, slimeX3Sheet, graySprite }
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
      }
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
    spawnSlimeX1At,
    spawnSlimeX3At,
    spawnGrayAt,
    creeps: () => liveOf('creep'),
    snails: () => liveOf('snail'),
    slimesX1: () => liveOf('slime_x1'),
    slimesX3: () => liveOf('slime_x3'),
    grayTrees: () => liveOf('gray'),
  }
}
