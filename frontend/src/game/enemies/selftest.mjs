/**
 * M6 逻辑自测（不依赖浏览器 / 不改 engine）。
 * 运行：在 frontend/ 下 `node src/game/enemies/selftest.mjs`
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BODY,
  SPEED_PX_PER_UNIT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../constants.js'
import {
  CREEP_ANIM_FPS,
  CREEP_ANIM_SEC,
  CREEP_DRAW,
  CREEP_FRAME_KINDS,
  CREEP_FRAME_NAMES,
  CREEP_FRAME_SEC,
  CREEP_FRAMES,
  CREEP_HP,
  CREEP_SRC,
  creepFrameAt,
  SNAIL_SRC,
  SPLIT_SRC,
  SLIME_X1_SRC,
  SLIME_X3_SRC,
  ICE_MAN_SRC,
  ORCHID_SRC,
  ICE_BULLET_SRC,
  ARMOR_DMG_MUL,
  ARMOR_OUTLINE,
  GRAY_BURST_COUNT,
  GRAY_BURST_DELAY,
  GRAY_BURST_RADIUS,
  GRAY_SELF_PERIOD,
  GRAY_UNLOCK_SEC,
  SNAIL_UNLOCK_SEC,
  SLIME_X1_UNLOCK_SEC,
  SLIME_X3_INVULN_SEC,
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
  ICE_MAN_HP,
  ICE_MAN_CRYSTALS,
  ICE_MAN_DRAW,
  ICE_MAN_KNOCKBACK_SCALE,
  ICE_MAN_RESPAWN_SEC,
  ICE_MAN_UNLOCK_SEC,
  iceManRespawnHp,
  ICE_ORCHID_COUNT,
  ICE_ORCHID_PERIOD,
  ICE_REGEN_DELAY_SEC,
  ICE_REGEN_PER_SEC,
  ICE_REGEN_RANGE,
  SCORPION_SRC,
  SCORPION_UNLOCK_SEC,
  DUMMY_HP,
  DUMMY_OFFSET,
  DUMMY_REGEN_PER_SEC,
  ORCHID_HEAL_AMOUNT,
  ORCHID_HEAL_PERIOD,
  ORCHID_HEAL_RANGE,
  ORCHID_HP,
  ORCHID_SPEED_MUL,
  cameraCorners,
  cameraEdgeMids,
  createEnemies,
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
  planBarrageSet,
  rollIceDashCount,
  outlinePixels,
  scorpionHp,
  scorpionSpawnCount,
  scorpionSpeedMul,
  STINGER_ADVANCED_CHANCE,
  STINGER_CRYSTALS,
  STINGER_SRC,
  STINGER_UNLOCK_SEC,
  SPAWN_WARN_SEC,
  ICE_MAN_ADVANCED_CHANCE,
  SCORPION_SHOT_PERIOD,
  SCORPION_FIRST_SHOT_RAND_MAX_SEC,
  stingerHp,
  stingerSpawnCount,
  stingerSpeedMul,
  ELITE_CHANCE_BASE,
  ELITE_CHANCE_PER_MIN,
  ELITE_ADVANCED_CHANCE,
  ELITE_OUTLINE,
  ICE_BULLET_OUTLINE,
  ICE_BULLET_DMG,
  ICE_LEAVE_MARGIN,
} from './index.js'
import {
  GRAY_HP0,
  GRAY_SELF_DMG_MAX0,
  graySelfDmgMax,
  pickNearOutOfView,
  SCORPION_BULLET_SPEED,
  SCORPION_CHASE_RANGE,
  SCORPION_CRYSTALS,
  SCORPION_FLEE_STOP,
  SCORPION_HOLD_RANGE,
} from '../spawner/index.js'

let failed = 0
function assert(name, cond) {
  if (cond) {
    console.log(`PASS  ${name}`)
  } else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

/** P42 批次4：序列帧素材磁盘目录（frontend/public/assets/小怪/）。 */
const CREEP_ASSET_DIR = fileURLToPath(new URL('../../../public/assets/小怪/', import.meta.url))

function makeFocus() {
  return {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    w: 7,
    h: BODY,
    hp: 3,
    speed: 88,
    takeDamage(n = 1) {
      this.hp -= n
      return true
    },
  }
}

const focus = makeFocus()
const camera = {
  x: focus.x - VIEW_WIDTH / 2,
  y: focus.y - VIEW_HEIGHT / 2,
}

assert('tier 0 at t=0', difficultyTier(0) === 0)
assert('tier 1 at t=45', difficultyTier(45) === 1)
assert('mushroom hp 32+15t', mushroomHp(0) === 32 && mushroomHp(45) === 47 && mushroomHp(90) === 62)
assert('mushroom wave 5+floor(s/120)', mushroomSpawnCount(0) === 5 && mushroomSpawnCount(119) === 5 && mushroomSpawnCount(120) === 6 && mushroomSpawnCount(240) === 7)
assert('mushroom interval always 5', mushroomSpawnInterval() === 5 && creepSpawnInterval(99) === 5)
assert('no mushroom cap at 99min', mushroomSpawnCount(99 * 60) === 5 + 49)
assert('speed mul t0 = 0.62', creepSpeedMul(0) === 0.62)
assert('speed mul t1 = 0.64', Math.abs(creepSpeedMul(1) - 0.64) < 1e-12)
assert('speed mul cap 1.4', creepSpeedMul(99) === 1.4)
assert('split mul t0 = 0.77', splitSpeedMul(0) === 0.77)
assert('split mul t1 = 0.79', Math.abs(splitSpeedMul(1) - 0.79) < 1e-12)
assert('split mul cap 1.4', splitSpeedMul(99) === 1.4)
assert('creep px t0 = 0.62×80', creepSpeedPx(0) === 0.62 * SPEED_PX_PER_UNIT)
assert('split px t0 = 0.77×80', splitSpeedPx(0) === 0.77 * SPEED_PX_PER_UNIT)
assert('sprite frame 0 is 蘑菇怪.png', CREEP_SRC.includes('蘑菇怪.png'))
assert('snail sprite 蜗牛怪.png', SNAIL_SRC.includes('蜗牛怪.png'))
assert('split sprite 裂怪.png', SPLIT_SRC.includes('裂怪.png'))
assert('split src is not mushroom', !SPLIT_SRC.includes('蘑菇怪'))
assert('scaledWave 4×2 = 8', scaledWaveCount(4, 2) === 8)
assert('scaledWave 3×1.5 = 5', scaledWaveCount(3, 1.5) === 5)
assert('scaledWave min 1', scaledWaveCount(4, 0) === 1)
assert('snail unlock 120', SNAIL_UNLOCK_SEC === 120)
assert('snail count 120s = 4', snailSpawnCount(119) === 0 && snailSpawnCount(120) === 4)
assert('snail count +1 /45s', snailSpawnCount(165) === 5)
assert('snail hp 50 +25/40s', snailHp(120) === 50 && snailHp(160) === 75)
assert('snail speed 0.62 +0.01/45s no cap', snailSpeedMul(120) === 0.62 && Math.abs(snailSpeedMul(165) - 0.63) < 1e-12 && snailSpeedMul(120 + 45 * 80) > 1.4)
assert('snail px t0', snailSpeedPx(120) === 0.62 * SPEED_PX_PER_UNIT)
assert('gray wave always 2 / interval 5s', grayTreeSpawnCount(0) === 2 && grayTreeSpawnCount(2) === 2 && grayTreeSpawnInterval(0) === 5)
assert(
  'gray interval t2 = 5*0.94^2',
  Math.abs(grayTreeSpawnInterval(2) - 5 * 0.94 ** 2) < 1e-12,
)
assert('gray unlock 30s', GRAY_UNLOCK_SEC === 30)
assert('gray self period 3s', GRAY_SELF_PERIOD === 3)
assert('roll 1 at 0', rollGraySelfDamage(() => 0) === 1)
assert('roll 8 at 0.99 t0', rollGraySelfDamage(() => 0.99) === 8)
assert('self dmg max 8+min', GRAY_SELF_DMG_MAX0 === 8 && graySelfDmgMax(0) === 8 && graySelfDmgMax(60) === 9)
assert('gray hp t0 = 80', grayTreeHp(0) === GRAY_HP0 && GRAY_HP0 === 80)
assert('gray hp t1 = 80*1.15', Math.abs(grayTreeHp(1) - 80 * 1.15) < 1e-12)

const ring = pickNearOutOfView(focus, camera, () => 0.5, BODY)
const dist = Math.hypot(ring.x - focus.x, ring.y - focus.y)
assert('ring near ≤1000', dist <= 1000 + 1e-6)
assert(
  'ring out of view',
  ring.x < camera.x ||
    ring.x >= camera.x + VIEW_WIDTH ||
    ring.y < camera.y ||
    ring.y >= camera.y + VIEW_HEIGHT,
)

{
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 80, focus.y, 'regular')
  assert('mushroom hp 32', creep.hp === CREEP_HP && creep.hp === 32)
  assert('mushroom name 蘑菇怪', creep.name === '蘑菇怪')
  assert('mushroom armor 0', (creep.armor ?? 0) === 0)
  assert('mushroom knockbackable resist 0', creep.knockbackable === true && (creep.knockbackResist || 0) === 0)
  assert('mushroom in targets', foes.targets.includes(creep))
  foes.update(1, focus, camera, 0)
  assert(
    'regular speed 0.62 units (not × player)',
    Math.abs(creep.x - (focus.x + 80 - creepSpeedPx(0))) < 1e-6,
  )
}

{
  const fast = makeFocus()
  fast.speed = 400
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(fast.x + 80, fast.y, 'regular')
  foes.update(1, fast, camera, 0)
  assert(
    'ignores player.speed',
    Math.abs(creep.x - (fast.x + 80 - creepSpeedPx(0))) < 1e-6,
  )
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const split = foes.spawnCreepAt(focus.x + 200, focus.y, 'split')
  assert('split name 裂怪', split.name === '裂怪' && split.speedKind === 'split')
  const x0 = split.x
  foes.update(1, focus, camera, 0)
  const moved = x0 - split.x
  assert('split speed 0.77 units', Math.abs(moved - splitSpeedPx(0)) < 1e-6)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const snail = foes.spawnSnailAt(focus.x + 80, focus.y)
  assert('snail hp 50 at t0', snail.hp === 50)
  assert('snail born armor 1', snail.armor === 1)
  assert('snail knockbackResist = BODY', snail.knockbackResist === BODY)
  foes.update(1, focus, camera, 0)
  assert(
    'snail speed 0.62 units',
    Math.abs(snail.x - (focus.x + 80 - snailSpeedPx(0))) < 1e-6,
  )
}

{
  let crystals = 0
  let exp = 0
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      spawnCrystal() {
        crystals += 1
      },
      onExp(n) {
        exp += n
      },
    },
  })
  const creep = foes.spawnCreepAt(focus.x + 200, focus.y, 'regular')
  creep.takeHit(15)
  assert('takeHit −15', creep.hp === 17)
  creep.takeHit(17)
  foes.update(0.01, focus, camera, 0)
  assert('creep death drops 1 crystal + 1 exp', crystals === 1 && exp === 1)
  assert('dead creep removed', !foes.targets.includes(creep))
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const snail = foes.spawnSnailAt(focus.x + 180, focus.y)
  assert('armor mul 0.7', ARMOR_DMG_MUL === 0.7)
  assert('armor outline pixel yellow', ARMOR_OUTLINE === '#e0b84a')
  const dealtArmor = snail.takeHit(20)
  assert('takeHit armor returns 14', dealtArmor === 14 && snail.hp === 36 && snail.armor === 0)
  const dealtFull = snail.takeHit(20)
  assert('takeHit no armor returns 20', dealtFull === 20 && snail.hp === 16)
  const creep = foes.spawnCreepAt(focus.x + 40, focus.y, 'regular')
  creep.armor = 2
  creep.takeHit(10)
  creep.takeHit(10)
  assert('armor stacks then gone', creep.hp === 18 && creep.armor === 0)
}

{
  const src = new Uint8ClampedArray(3 * 3 * 4)
  src[16] = 255
  src[17] = 255
  src[18] = 255
  src[19] = 255
  const out = outlinePixels(src, 3, 3)
  const px = (x, y) => {
    const i = (y * 3 + x) * 4
    return [out[i], out[i + 1], out[i + 2], out[i + 3]]
  }
  assert('outline path not strokeRect', typeof outlinePixels === 'function')
  assert('outline N yellow', px(1, 0)[0] === 0xe0 && px(1, 0)[1] === 0xb8 && px(1, 0)[2] === 0x4a && px(1, 0)[3] === 255)
  assert('outline corner empty', px(0, 0)[3] === 0)
  assert('outline keeps center', px(1, 1)[0] === 255 && px(1, 1)[3] === 255)
}

{
  let crystals = 0
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      spawnCrystal() {
        crystals += 1
      },
    },
  })
  const snail = foes.spawnSnailAt(focus.x + 250, focus.y)
  snail.takeHit(99)
  foes.update(0.01, focus, camera, 0)
  assert('snail death drops 1 crystal', crystals === 1)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const gray = foes.spawnGrayAt(focus.x + 200, focus.y + 200, GRAY_HP0)
  assert('gray hp 80', gray.hp === 80)
  assert('gray not knockbackable', gray.knockbackable === false)
  foes.update(2.99, focus, camera, 0)
  assert('gray self no tick before 3s', gray.hp === 80)
  foes.update(0.02, focus, camera, 0)
  assert('gray self 3s roll 5 (rng=0.5)', gray.hp === 75)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const a = foes.spawnGrayAt(focus.x + 180, focus.y + 180, GRAY_HP0)
  foes.update(2, focus, camera, 0)
  const b = foes.spawnGrayAt(focus.x + 220, focus.y + 220, GRAY_HP0)
  foes.update(1.05, focus, camera, 0)
  assert('gray self timers independent', a.hp === 75 && b.hp === 80)
}

{
  const rolls = [0, 0.99]
  let i = 0
  const foes = createEnemies({ random: () => rolls[i++] ?? 0.5 })
  const a = foes.spawnGrayAt(focus.x + 160, focus.y + 160, GRAY_HP0)
  const b = foes.spawnGrayAt(focus.x + 240, focus.y + 240, GRAY_HP0)
  foes.update(3, focus, camera, 0)
  assert('gray self rolls independent', a.hp === 79 && b.hp === 72)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const gray = foes.spawnGrayAt(focus.x + 300, focus.y + 300, GRAY_HP0)
  gray.takeHit(99)
  foes.update(0.01, focus, camera, 0)
  assert('burst armed after destroy', foes.bursts.length === 1 && foes.creeps().length === 0)
  foes.update(0.01, focus, camera, GRAY_BURST_DELAY - 0.02)
  assert('no split yet before 1s', foes.creeps().length === 0)
  foes.update(0.01, focus, camera, GRAY_BURST_DELAY)
  assert(
    'gray burst splits armed (red circle)',
    foes.creeps().length === 0 &&
      foes.pending.length === GRAY_BURST_COUNT &&
      foes.pending.every((p) => p.speedKind === 'split'),
  )
  foes.update(0.8, focus, camera, GRAY_BURST_DELAY + 0.8)
  const splits = foes.creeps()
  assert(
    `gray burst +1.8s → ${GRAY_BURST_COUNT} split`,
    splits.length === GRAY_BURST_COUNT &&
      splits.every((c) => c.speedKind === 'split' && c.name === '裂怪') &&
      foes.bursts.length === 0,
  )
  const keys = new Set(splits.map((c) => `${c.x.toFixed(6)},${c.y.toFixed(6)}`))
  assert('split positions unique', keys.size === GRAY_BURST_COUNT)
  let minDist = Infinity
  for (let i = 0; i < splits.length; i++) {
    for (let j = i + 1; j < splits.length; j++) {
      minDist = Math.min(minDist, Math.hypot(splits[i].x - splits[j].x, splits[i].y - splits[j].y))
    }
  }
  assert('split spread ≥ 1 draw', minDist >= CREEP_DRAW - 1e-6)
  const origin = { x: focus.x + 300, y: focus.y + 300 }
  assert(
    'split not stacked on burst',
    splits.every((c) => Math.hypot(c.x - origin.x, c.y - origin.y) >= CREEP_DRAW - 1e-6),
  )
}

{
  const bumper = makeFocus()
  bumper.x = WORLD_WIDTH / 2 + 400
  bumper.y = WORLD_HEIGHT / 2 + 400
  const foes = createEnemies({ random: () => 0.5 })
  const wall = foes.spawnGrayAt(bumper.x, bumper.y, 25)
  foes.update(0.016, bumper, camera, 0)
  assert('bump gray → player −1', bumper.hp === 2)
  assert('bump destroys gray', !foes.targets.includes(wall))
  assert('bump queues burst', foes.bursts.length === 1)
}

{
  const victim = makeFocus()
  const foes = createEnemies({ random: () => 0.5 })
  foes.spawnCreepAt(victim.x, victim.y, 'regular')
  foes.update(0.016, victim, camera, 0)
  assert('creep contact → player −1', victim.hp === 2)
  assert('creep survives contact', foes.creeps().length === 1)
}

{
  const victim = makeFocus()
  const foes = createEnemies({ random: () => 0.5 })
  foes.spawnSnailAt(victim.x, victim.y)
  foes.update(0.016, victim, camera, 0)
  assert('snail contact → player −1', victim.hp === 2)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(4.99, focus, camera, 4.99)
  assert('no regular wave before 5s', wave.creeps().length === 0)
  wave.update(0.02, focus, camera, 5.01)
  assert('regular armed warn (pending 5)', wave.creeps().length === 0 && wave.pending.length === 5)
  wave.update(0.8, focus, camera, 5.81)
  assert('regular 5s/5', wave.creeps().length === 5)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(29.9, focus, camera, 29.9)
  assert('no gray before 30s', wave.grayTrees().length === 0)
  wave.update(0.12, focus, camera, 30.02)
  assert('gray first wave at 30s/2', wave.grayTrees().length === 2)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(5.01, focus, camera, 5.01, 2)
  assert('spawnRate 2 → 10 armed', wave.creeps().length === 0 && wave.pending.length === 10)
  wave.update(0.8, focus, camera, 5.81)
  assert('spawnRate 2 → 10 mushrooms /5s', wave.creeps().length === 10)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(119.9, focus, camera, 119.9)
  assert('no snail before 120s', wave.snails().length === 0)
  wave.update(0.2, focus, camera, 120.1)
  assert('snail armed warn', wave.snails().length === 0)
  wave.update(0.8, focus, camera, 120.9)
  assert('snail first wave at 120s/4', wave.snails().length === 4)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 120, 1.5)
  assert('spawnRate 1.5 → 6 armed', wave.snails().length === 0)
  wave.update(0.8, focus, camera, 120.8)
  assert('spawnRate 1.5 → 6 snails', wave.snails().length === 6)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 30, 2)
  assert('spawnRate 2 → 4 gray', wave.grayTrees().length === 4)
}

assert('slime unlock 180', SLIME_X1_UNLOCK_SEC === 180)
assert('slime hp 120+27u', slimeX1Hp(180) === 120 && slimeX1Hp(225) === 147)
assert('slime wave 6+floor(u/45)', slimeX1SpawnCount(179) === 0 && slimeX1SpawnCount(180) === 6 && slimeX1SpawnCount(225) === 7)
assert('slime speed 0.87+0.01u no cap', slimeX1SpeedMul(180) === 0.87 && Math.abs(slimeX1SpeedMul(225) - 0.88) < 1e-12 && slimeX1SpeedMul(180 + 45 * 80) > 1.4)
assert('x-3 hp ceil(0.25 spawnHp)', slimeX3HpFromParent(120) === 30 && slimeX3HpFromParent(142) === 36)
assert('x-3 drop 50%', rollSlimeX3Crystals(() => 0) === 0 && rollSlimeX3Crystals(() => 0.49) === 0 && rollSlimeX3Crystals(() => 0.5) === 1)
assert('burst offset 90deg ×4', (() => {
  const pts = [0, 1, 2, 3].map((k) => grayBurstOffset(k, 0, 0, GRAY_BURST_RADIUS))
  return new Set(pts.map((p) => `${p.x},${p.y}`)).size === 4
})())
assert('slime sprites', SLIME_X1_SRC.includes('史莱姆x-1.png') && SLIME_X3_SRC.includes('史莱姆x-3.png'))
assert('x-3 invuln 0.3s', SLIME_X3_INVULN_SEC === 0.3)

{
  const foes = createEnemies({ random: () => 0.5 })
  const x1 = foes.spawnSlimeX1At(focus.x + 80, focus.y)
  assert('x-1 name/hp/spawnHp', x1.name === '史莱姆x-1' && x1.hp === 120 && x1.spawnHp === 120)
  assert('x-1 knockbackable', x1.knockbackable === true && (x1.knockbackResist || 0) === 0)
  foes.update(1, focus, camera, 0)
  assert(
    'x-1 speed 0.87 units',
    Math.abs(x1.x - (focus.x + 80 - slimeX1SpeedMul(0) * SPEED_PX_PER_UNIT)) < 1e-6,
  )
}

{
  let crystals = 0
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      spawnCrystal() {
        crystals += 1
      },
    },
  })
  const x1 = foes.spawnSlimeX1At(focus.x + 300, focus.y + 300)
  x1.takeHit(200)
  foes.update(0.01, focus, camera, 0)
  assert('x-1 death 2 crystals', crystals === 2)
  assert('x-1 splits into 3 x-3', foes.slimesX1().length === 0 && foes.slimesX3().length === 3)
  const kids = foes.slimesX3()
  assert(
    'x-3 hp/speed snapshot',
    kids.every((c) => c.hp === 30 && c.name === '史莱姆x-3' && Math.abs(c.speedMul - 0.97) < 1e-12),
  )
  const hp0 = kids[0].hp
  assert('x-3 invuln takeHit returns 0', kids[0].takeHit(99) === 0)
  assert('x-3 invuln takeHit no dmg', kids[0].hp === hp0)
  foes.update(0.29, focus, camera, 0)
  kids[0].takeHit(99)
  assert('x-3 still invuln before 0.3s', kids[0].hp === hp0 && foes.slimesX3().length === 3)
  foes.update(0.02, focus, camera, 0)
  for (const k of kids) k.takeHit(99)
  foes.update(0.01, focus, camera, 0)
  assert('x-3 death rng 0.5 → 1 each', crystals === 5 && foes.slimesX3().length === 0)
}

{
  let crystals = 0
  const foes = createEnemies({
    random: () => 0,
    hooks: {
      spawnCrystal() {
        crystals += 1
      },
    },
  })
  const x1 = foes.spawnSlimeX1At(focus.x + 320, focus.y + 320)
  x1.takeHit(200)
  foes.update(0.01, focus, camera, 0)
  const kids = foes.slimesX3()
  foes.update(0.3, focus, camera, 0)
  for (const k of kids) k.takeHit(99)
  foes.update(0.01, focus, camera, 0)
  assert('x-3 death rng 0 → 0 crystals', crystals === 2 && foes.slimesX3().length === 0)
}

{
  const victim = makeFocus()
  const foes = createEnemies({ random: () => 0.5 })
  foes.spawnSlimeX3At(victim.x, victim.y, { spawnHp: 85, speedMul: 1 })
  foes.update(0.016, victim, camera, 0)
  assert('x-3 invuln no contact', victim.hp === 3 && foes.slimesX3().length === 1)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  foes.update(0.01, focus, camera, 285)
  const x1 = foes.spawnSlimeX1At(focus.x + 400, focus.y + 400)
  assert('x-1 hp at 285s = 174', x1.hp === 174 && x1.spawnHp === 174)
  x1.takeHit(200)
  foes.update(0.01, focus, camera, 285)
  const kids = foes.slimesX3()
  assert('x-3 hp from spawnHp 174', kids.length === 3 && kids[0].hp === 44)
  assert('x-3 speed = death mul +0.10', Math.abs(kids[0].speedMul - (slimeX1SpeedMul(285) + 0.1)) < 1e-12)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 179.9)
  assert('no slime before 180s', wave.slimesX1().length === 0)
  wave.update(0.2, focus, camera, 180.1)
  assert('slime armed warn', wave.slimesX1().length === 0)
  wave.update(0.8, focus, camera, 180.9)
  assert('slime first wave at 180s/6', wave.slimesX1().length === 6)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 180, 2)
  assert('spawnRate 2 → 12 armed', wave.slimesX1().length === 0)
  wave.update(0.8, focus, camera, 180.8)
  assert('spawnRate 2 → 12 slimes', wave.slimesX1().length === 12)
}

assert('ice unlock 420', ICE_MAN_UNLOCK_SEC === 420)
assert('ice hp 4000', ICE_MAN_HP === 4000)
assert('ice draw 48', ICE_MAN_DRAW === 48)
assert('ice bullet 200', ICE_BULLET_SPEED === 200)
assert('ice knockback 0.3', ICE_MAN_KNOCKBACK_SCALE === 0.3)
assert('ice advanced chance 0.1', ICE_MAN_ADVANCED_CHANCE === 0.1)
assert('ice dash 1–6 / 8 body', ICE_DASH_MIN === 1 && ICE_DASH_MAX === 6 && ICE_DASH_DIST === BODY * 8)
assert('ice dash roll 1–6', rollIceDashCount(() => 0) === 1 && rollIceDashCount(() => 0.99) === 6)
assert('ice dash/barrage/orchid periods', ICE_DASH_PERIOD === 12 && ICE_BARRAGE_PERIOD === 17 && ICE_ORCHID_PERIOD === 32)
assert('ice respawn 180 / 150 crystal / ×1.4', ICE_MAN_RESPAWN_SEC === 180 && ICE_MAN_CRYSTALS === 150 && iceManRespawnHp(1) === 5600)
assert('ice telegraph 0.25', ICE_DASH_TELEGRAPH === 0.25)
assert('ice flee 400/10s', ICE_FLEE_HURT === 400 && ICE_FLEE_SEC === 10)
assert('orchid hp 1 speed 1.17', ORCHID_HP === 1 && ORCHID_SPEED_MUL === 1.17)
assert('orchid heal 10 / 3 body / 15s', ORCHID_HEAL_AMOUNT === 10 && ORCHID_HEAL_RANGE === BODY * 3 && ORCHID_HEAL_PERIOD === 15)
assert('orchid count 3 / armor every 2', ICE_ORCHID_COUNT === 3)
assert('barrage patterns 4', ICE_BARRAGE_PATTERNS.length === 4)
assert('camera 4 corners', cameraCorners(camera).length === 4)
assert('camera 4 mids', cameraEdgeMids(camera).length === 4)
assert('plan barrage 16 shots', planBarrageSet(ICE_BARRAGE_PATTERNS).length === 16)
assert('ice sprites', ICE_MAN_SRC.includes('冰人.png') && ORCHID_SRC.includes('兰花.png') && ICE_BULLET_SRC.includes('怪物子弹.png'))

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 419.9)
  assert('no ice before 420s', wave.iceMen().length === 0)
  wave.update(0.2, focus, camera, 420.1)
  assert('ice first at 420s/1', wave.iceMen().length === 1)
  const boss = wave.iceMen()[0]
  assert('ice hp/scale', boss.hp === 4000 && boss.knockbackScale === 0.3 && boss.name === '冰人')
  assert('ice hurtbox follows draw', boss.w === 48 && boss.h === 48 && boss.hurtW === 24 && boss.hurtH === 24)
  wave.update(0.01, focus, camera, 421)
  assert('ice no respawn while alive', wave.iceMen().length === 1)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const boss = foes.spawnIceManAt(focus.x + 80, focus.y, { ...focus, speedUnits: 1.2, speed: 96 })
  assert(
    'ice wander snapshot 0.7',
    Math.abs(boss.wanderSpd - SPEED_PX_PER_UNIT * 1.2 * 0.7) < 1e-6,
  )
  boss.takeHit(400)
  assert('ice flee after 400', boss.fleeT === ICE_FLEE_SEC && boss.hp === 3600)
  boss.takeHit(50)
  assert('ice flee no extra acc', (boss.hurtAcc ?? 0) === 0 && boss.hp === 3550)
}

{
  let healed = 0
  const log = []
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      onHeal(ent, n) {
        healed += n
        log.push([ent.kind, n])
      },
    },
  })
  const boss = foes.spawnIceManAt(focus.x + 500, focus.y, { ...focus, speed: 96, speedUnits: 1.2 })
  // 固定 boss 不动，隔离测脱战回血（P27 冰人可离开视野后移动不定）。
  boss.wanderSpd = 0
  assert(
    'ice regen consts 3s/44px/20',
    ICE_REGEN_DELAY_SEC === 3 && ICE_REGEN_RANGE === BODY * 2 && ICE_REGEN_PER_SEC === 20,
  )
  boss.takeHit(100)
  assert('ice hurt to 3900', boss.hp === 3900)
  foes.update(3, focus, camera, 0)
  assert('ice no regen at 3s mark', boss.hp === 3900 && healed === 0)
  foes.update(1.01, focus, camera, 0)
  assert('ice regen +20 after lonely 4s', boss.hp === 3920 && healed === 20)
  assert('ice regen onHeal ice_man/20 green', log[0][0] === 'ice_man' && log[0][1] === 20)
  foes.update(1, focus, camera, 0)
  assert('ice regen every 1s', boss.hp === 3940 && healed === 40)
  const near = { ...focus, x: boss.x, y: boss.y }
  foes.update(2, near, camera, 0)
  assert('ice regen stops when player in range', boss.hp === 3940 && healed === 40)
  foes.update(2, focus, camera, 0)
  assert('ice regen delay restarts after reset', boss.hp === 3940 && healed === 40)
  foes.update(2.01, focus, camera, 0)
  assert('ice regen resumes after new 3s+1s', boss.hp === 3960 && healed === 60)
  boss.hp = boss.maxHp - 5
  foes.update(1.01, focus, camera, 0)
  assert('ice regen caps at maxHp', boss.hp === boss.maxHp && healed === 65)
  foes.update(1.01, focus, camera, 0)
  assert('ice regen full hp no onHeal', boss.hp === boss.maxHp && healed === 65)
  boss.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('dead ice no regen', foes.iceMen().length === 0 && healed === 65)
}

{
  const victim = makeFocus()
  const foes = createEnemies({ random: () => 0.5 })
  foes.spawnIceManAt(victim.x, victim.y, victim)
  foes.update(0.016, victim, camera, 0)
  assert('ice contact −2', victim.hp === 1)
}

{
  const victim = makeFocus()
  const foes = createEnemies({ random: () => 0.5 })
  const flower = foes.spawnOrchidAt(victim.x, victim.y)
  assert('orchid hp 1', flower.hp === 1 && flower.contactDamage === 0)
  foes.update(0.016, victim, camera, 0)
  assert('orchid no contact dmg', victim.hp === 3 && foes.orchids().length === 1)
}

{
  let healed = 0
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      onHeal(_ent, n) {
        healed += n
      },
    },
  })
  const creep = foes.spawnCreepAt(focus.x + 10, focus.y, 'regular', 27)
  creep.hp = 5
  foes.spawnOrchidAt(focus.x, focus.y)
  foes.update(15, focus, camera, 0)
  assert('orchid heal +10 cap', creep.hp === 15 && healed === 10)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 10, focus.y, 'regular', 27)
  creep.hp = 5
  const flower = foes.spawnOrchidAt(focus.x, focus.y)
  foes.update(15, focus, camera, 0)
  assert('1st heal no armor grant', creep.hp === 15 && (creep.armor ?? 0) === 0 && (flower.armor ?? 0) === 0)
  foes.update(15, focus, camera, 0)
  assert('2nd heal grants armor', creep.hp === 25 && creep.armor === 1 && (flower.armor ?? 0) === 0)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const low = foes.spawnCreepAt(focus.x + 120, focus.y, 'regular', 27)
  low.hp = 3
  const high = foes.spawnCreepAt(focus.x - 120, focus.y, 'regular', 27)
  high.hp = 20
  const flower = foes.spawnOrchidAt(focus.x, focus.y)
  foes.update(1, focus, camera, 0)
  assert('orchid chases lowest hp', flower.x > focus.x)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const boss = foes.spawnIceManAt(focus.x + 40, focus.y, { ...focus, speed: 96, speedUnits: 1.2 })
  foes.update(ICE_DASH_PERIOD + 0.01, focus, camera, 0)
  assert('ice dash telegraph after 12s', boss.dashPhase === 'telegraph')
  foes.update(ICE_DASH_TELEGRAPH + 0.01, focus, camera, 0)
  assert('ice dash starts', boss.dashPhase === 'dash' && boss.dashTx === focus.x)
  assert('ice dash not 0.4s', boss.dashPhase === 'dash' && (boss.dashTraveled ?? 0) < ICE_DASH_DIST)
  foes.update(0.15, focus, camera, 0)
  assert('ice dash still short of 8 body', boss.dashPhase === 'dash' && (boss.dashTraveled ?? 0) < ICE_DASH_DIST)
  foes.update(0.5, focus, camera, 0)
  assert('ice dash ends at 8 body', (boss.dashTraveled ?? 0) >= ICE_DASH_DIST - 1e-6)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const boss = foes.spawnIceManAt(focus.x + 40, focus.y, focus)
  boss.barrageCd = 0
  foes.update(0.016, focus, camera, 0)
  assert('ice barrage fires', foes.iceBullets.length >= 1 && boss.barrageShots != null)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const boss = foes.spawnIceManAt(focus.x + 40, focus.y, focus)
  foes.update(ICE_ORCHID_PERIOD + 0.01, focus, camera, 0)
  assert('ice orchid 3 at 32s', foes.orchids().length === 3 && boss.hp === 4000)
  boss.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('ice death keeps orchid', foes.iceMen().length === 0 && foes.orchids().length === 3)
  foes.update(ICE_ORCHID_PERIOD, focus, camera, 50)
  assert('dead ice no more orchid', foes.orchids().length === 3)
}

assert('scorpion unlock 300', SCORPION_UNLOCK_SEC === 300)
assert('scorpion hp 105+20u', scorpionHp(300) === 105 && scorpionHp(345) === 125)
assert('scorpion wave 2+floor(u/30)', scorpionSpawnCount(299) === 0 && scorpionSpawnCount(300) === 2 && scorpionSpawnCount(330) === 3)
assert('scorpion speed 0.8+0.04u', scorpionSpeedMul(300) === 0.8 && Math.abs(scorpionSpeedMul(345) - 0.84) < 1e-12)
assert('scorpion sprite / bullet 180', SCORPION_SRC.includes('蝎子怪.png') && SCORPION_BULLET_SPEED === 180)
assert('scorpion ranges 8/3/7', SCORPION_CHASE_RANGE === BODY * 8 && SCORPION_HOLD_RANGE === BODY * 3 && SCORPION_FLEE_STOP === BODY * 7)
assert('scorpion shot 5s / first 0-5s', SCORPION_SHOT_PERIOD === 5 && SCORPION_FIRST_SHOT_RAND_MAX_SEC === 5)

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 299.9)
  assert('no scorpion before 300s', wave.scorpions().length === 0)
  wave.update(0.2, focus, camera, 300.1)
  assert('scorpion armed warn', wave.scorpions().length === 0)
  wave.update(0.8, focus, camera, 300.9)
  assert('scorpion first wave at 300s/2', wave.scorpions().length === 2)
}

{
  let crystals = 0
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      spawnCrystal() {
        crystals += 1
      },
    },
  })
  const bug = foes.spawnScorpionAt(focus.x + BODY * 5, focus.y)
  assert('scorpion hp 105 / no armor', bug.hp === 105 && (bug.armor ?? 0) === 0 && bug.name === '蝎子怪')
  assert('scorpion first shot staggered 0-5s', bug.shotCd >= 0 && bug.shotCd <= SCORPION_FIRST_SHOT_RAND_MAX_SEC)
  bug.shotCd = 0
  foes.update(0.016, focus, camera, 0)
  assert('scorpion hold 3–8 shoots', foes.iceBullets.length >= 1)
  const near = foes.spawnScorpionAt(focus.x + 10, focus.y)
  const d0 = Math.hypot(near.x - focus.x, near.y - focus.y)
  foes.update(1, focus, camera, 0)
  const d1 = Math.hypot(near.x - focus.x, near.y - focus.y)
  assert('scorpion flee toward 7 body', d1 > d0 && d1 <= SCORPION_FLEE_STOP + 1e-6)
  const far = foes.spawnScorpionAt(focus.x + BODY * 12, focus.y)
  const f0 = far.x
  foes.update(1, focus, camera, 0)
  assert('scorpion chase >8', far.x < f0)
  bug.takeHit(200)
  foes.update(0.01, focus, camera, 0)
  assert('scorpion drops 2 crystals', crystals === SCORPION_CRYSTALS)
}

{
  // P25 六娃失锁消费：蝎子失锁时即使处于 3~8 身位也不开火。
  const foes = createEnemies({ random: () => 0.5 })
  const bug = foes.spawnScorpionAt(focus.x + BODY * 5, focus.y)
  bug.shotCd = 0
  bug.unlockT = 1
  foes.update(0.016, focus, camera, 0)
  assert('scorpion blind no fire', foes.iceBullets.length === 0)
}

{
  // P25 六娃失锁消费：近战敌人失锁时不靠近玩家。
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 200, focus.y, 'regular')
  creep.unlockT = 1
  const x0 = creep.x
  foes.update(1, focus, camera, 0)
  assert('creep blind no chase', Math.abs(creep.x - x0) < 1e-6)
}

{
  let crystals = 0
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      spawnCrystal() {
        crystals += 1
      },
    },
  })
  foes.update(0.2, focus, camera, 420.1)
  const boss = foes.iceMen()[0]
  assert('ice first 4000', boss && boss.hp === 4000)
  boss.takeHit(9999)
  foes.update(0.01, focus, camera, 421)
  assert('ice death 150 crystals', crystals === 150 && foes.iceMen().length === 0)
  foes.update(0.2, focus, camera, 421 + 179.9)
  assert('ice no respawn before 180s', foes.iceMen().length === 0)
  foes.update(0.2, focus, camera, 421 + 180)
  const again = foes.iceMen()[0]
  assert('ice respawn hp ×1.4', again && again.hp === 5600 && foes.iceMen().length === 1)
}

{
  const foes = createEnemies({ random: () => 0.5, getHpGrowthAdd: () => 5 })
  foes.update(0.01, focus, camera, 45)
  const creep = foes.spawnCreepAt(focus.x + 40, focus.y)
  assert('diff2 mushroom t1 = 32+20', creep.hp === 52 && mushroomHp(45, 5) === 52)
  foes.update(0.01, focus, camera, 160)
  const snail = foes.spawnSnailAt(focus.x + 80, focus.y)
  assert('diff2 snail extra on tier', snail.hp === 80 && snailHp(160, 5) === 80)
}

assert('dummy consts', DUMMY_HP === 999 && DUMMY_REGEN_PER_SEC === 500 && DUMMY_OFFSET === BODY * 3)

{
  const victim = makeFocus()
  const foes = createEnemies({ random: () => 0.5 })
  const dummy = foes.setDummyEnabled(true, victim)
  assert('dummy spawn right 3 body', dummy && dummy.x === victim.x + DUMMY_OFFSET && dummy.y === victim.y)
  assert('dummy 999 / no kb / no contact', dummy.hp === 999 && dummy.knockbackable === false && dummy.contactDamage === 0)
  dummy.x = victim.x
  dummy.y = victim.y
  foes.update(0.016, victim, camera, 0)
  assert('dummy contact 0', victim.hp === 3)
  dummy.hp = 100
  dummy.x += 10
  const x0 = dummy.x
  foes.update(1, victim, camera, 0)
  assert('dummy regen 500/s stay', dummy.hp === 600 && dummy.x === x0)
  dummy.hp = 800
  foes.update(1, victim, camera, 0)
  assert('dummy regen cap 999', dummy.hp === 999)
  assert('dummy takeHit returns 20', dummy.takeHit(20) === 20)
  assert('dummy flash on hit', dummy.hp === 979 && dummy.invuln > 0)
  foes.setDummyEnabled(true, victim)
  assert('dummy max 1', foes.dummies().length === 1)
  foes.setDummyEnabled(false, victim)
  assert('dummy removed', foes.dummies().length === 0)
}

// —— P25 毒刺怪 / 高级结晶 / 预警 / 环绕 / 失锁消费 ——
assert('stinger unlock 300', STINGER_UNLOCK_SEC === 300)
assert('stinger hp 260+25u', stingerHp(300) === 260 && stingerHp(345) === 285)
assert('stinger wave 6+floor(s/180)', stingerSpawnCount(299) === 0 && stingerSpawnCount(300) === 7 && stingerSpawnCount(540) === 9)
assert('stinger speed 0.70+0.04u no cap', Math.abs(stingerSpeedMul(300) - 0.7) < 1e-12 && Math.abs(stingerSpeedMul(345) - 0.74) < 1e-12 && stingerSpeedMul(300 + 45 * 40) > 1.4)
assert('stinger sprite 毒刺怪.png', STINGER_SRC.includes('毒刺怪.png'))
assert('stinger crystals 4 / advanced 0.2', STINGER_CRYSTALS === 4 && STINGER_ADVANCED_CHANCE === 0.2)
assert('spawn warn 0.8s', SPAWN_WARN_SEC === 0.8)

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 299.9)
  assert('no stinger before 300s', wave.stingers().length === 0)
  wave.update(0.2, focus, camera, 300.1)
  assert('mushroom stops at 300s', wave.creeps().length === 0)
  assert('stinger armed warn', wave.stingers().length === 0)
  wave.update(0.8, focus, camera, 300.9)
  assert('stinger first wave at 300s/7', wave.stingers().length === 7)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 300, 1)
  wave.update(5, focus, camera, 305)
  assert('mushroom stopped at ≥300s', wave.creeps().length === 0)
}

{
  let total = 0
  let advanced = 0
  const foes = createEnemies({
    random: () => 0.5,
    hooks: {
      spawnCrystal() {
        total += 1
      },
      spawnCrystalAt(_x, _y, opts) {
        total += 1
        if (opts?.advanced) advanced += 1
      },
    },
  })
  const st = foes.spawnStingerAt(focus.x + 200, focus.y)
  assert('stinger spawn hp/knockback BODY', st.hp === 260 && st.knockbackResist === BODY && st.name === '毒刺怪')
  st.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('stinger death 4 normal (rng0.5)', total === 4 && advanced === 0)
}

{
  let total = 0
  let advanced = 0
  const foes = createEnemies({
    random: () => 0,
    hooks: {
      spawnCrystal() {
        total += 1
      },
      spawnCrystalAt(_x, _y, opts) {
        total += 1
        if (opts?.advanced) advanced += 1
      },
    },
  })
  const st = foes.spawnStingerAt(focus.x + 200, focus.y)
  st.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('stinger death 4 advanced (rng0)', total === 4 && advanced === 4)
}

{
  let total = 0
  let advanced = 0
  const foes = createEnemies({
    random: () => 0,
    hooks: {
      spawnCrystal() {
        total += 1
      },
      spawnCrystalAt(_x, _y, opts) {
        total += 1
        if (opts?.advanced) advanced += 1
      },
    },
  })
  const boss = foes.spawnIceManAt(focus.x + 200, focus.y, focus)
  boss.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('ice death 150 advanced (rng0)', total === ICE_MAN_CRYSTALS && advanced === 150)
}

{
  let seed = 0
  const rng = () => ((seed += 0.13) % 1)
  const pts = []
  for (let i = 0; i < 24; i++) pts.push(pickNearOutOfView(focus, camera, rng, BODY))
  const out = (p) =>
    p.x < camera.x || p.x >= camera.x + VIEW_WIDTH || p.y < camera.y || p.y >= camera.y + VIEW_HEIGHT
  const left = pts.some((p) => p.x < camera.x)
  const right = pts.some((p) => p.x >= camera.x + VIEW_WIDTH)
  const top = pts.some((p) => p.y < camera.y)
  const bottom = pts.some((p) => p.y >= camera.y + VIEW_HEIGHT)
  assert('surround covers 4 sides', pts.every(out) && left && right && top && bottom)
  assert('surround near ≤1000', pts.every((p) => Math.hypot(p.x - focus.x, p.y - focus.y) <= 1000 + 1e-6))
}

{
  // 毒刺怪接触 −1 心。
  const victim = makeFocus()
  const foes = createEnemies({ random: () => 0.5 })
  foes.spawnStingerAt(victim.x, victim.y)
  foes.update(0.016, victim, camera, 0)
  assert('stinger contact −1', victim.hp === 2)
}

{
  // 未接线 spawnCrystalAt：高级结晶兜底仍落下（数量不少）。
  let total = 0
  const foes = createEnemies({
    random: () => 0,
    hooks: {
      spawnCrystal() {
        total += 1
      },
    },
  })
  const st = foes.spawnStingerAt(focus.x + 200, focus.y)
  st.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('stinger fallback still 4 crystals', total === 4)
}

{
  // 冰人失锁不新开弹幕；解除后正常开火。
  const foes = createEnemies({ random: () => 0.5 })
  const boss = foes.spawnIceManAt(focus.x + 40, focus.y, focus)
  boss.barrageCd = 0
  boss.unlockT = 2
  foes.update(0.016, focus, camera, 0)
  assert('ice blind no barrage', foes.iceBullets.length === 0 && boss.barrageShots == null)
  boss.unlockT = 0
  foes.update(0.016, focus, camera, 0)
  assert('ice not blind barrage fires', foes.iceBullets.length >= 1)
}

{
  // 蝎子一次开火后回到 5s 节奏。
  const foes = createEnemies({ random: () => 0.5 })
  const bug = foes.spawnScorpionAt(focus.x + BODY * 5, focus.y)
  bug.shotCd = 0
  foes.update(0.016, focus, camera, 0)
  assert('scorpion 5s cadence after fire', bug.shotCd === SCORPION_SHOT_PERIOD && foes.iceBullets.length >= 1)
}

// —— P26 毒刺怪 6 / 五娃减速消费 / 四娃五娃粒子 ——
{
  // slowLeft>0 → 移动乘 slowFactor。
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 80, focus.y, 'regular')
  creep.slowFactor = 0.5
  creep.slowLeft = 2
  foes.update(1, focus, camera, 0)
  const expected = focus.x + 80 - creepSpeedPx(0) * 0.5
  assert('slow consumes factor', Math.abs(creep.x - expected) < 1e-6)
}

{
  // slowLeft<=0 → 不减速（slowFactor 存在也无效）。
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 80, focus.y, 'regular')
  creep.slowFactor = 0.5
  creep.slowLeft = 0
  foes.update(1, focus, camera, 0)
  const expected = focus.x + 80 - creepSpeedPx(0)
  assert('slow off when slowLeft<=0', Math.abs(creep.x - expected) < 1e-6)
}

{
  // 四娃燃烧：burnLeft>0 生成红色粒子；结束即清空。
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 200, focus.y, 'regular')
  creep.burnLeft = 2
  foes.update(0.3, focus, camera, 0)
  assert('burn particles spawn', foes.particles.length > 0 && foes.particles.every((p) => p.kind === 'burn'))
  creep.burnLeft = 0
  foes.update(0.01, focus, camera, 0)
  assert('burn particles clear on end', foes.particles.length === 0)
}

{
  // 五娃减速：slowLeft>0 生成蓝色粒子；怪物死亡即清空。
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 200, focus.y, 'regular')
  creep.slowFactor = 0.5
  creep.slowLeft = 2
  foes.update(0.24, focus, camera, 0)
  assert('slow particles spawn', foes.particles.length > 0 && foes.particles.every((p) => p.kind === 'slow'))
  creep.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('slow particles clear on death', foes.particles.length === 0)
}

// —— P27 红圈全怪 / 冰人可离开视野 / 伤害2 / 子弹蓝 / 强化怪 ——
assert('elite outline purple', ELITE_OUTLINE === '#7a2fd6')
assert('ice bullet outline blue', ICE_BULLET_OUTLINE === '#3f9fff')
assert('ice bullet dmg 2', ICE_BULLET_DMG === 2)
assert('ice leave margin 1 body', ICE_LEAVE_MARGIN === BODY)
assert('elite chance consts', ELITE_CHANCE_BASE === 0.02 && ELITE_CHANCE_PER_MIN === 0.02 && ELITE_ADVANCED_CHANCE === 0.5)

{
  // 冰人完全离开视野且未逃跑 → 回视野；逃跑时可离开视野不回。
  const foes = createEnemies({ random: () => 0.5 })
  const boss = foes.spawnIceManAt(focus.x + 500, focus.y, { ...focus, speed: 96, speedUnits: 1.2 })
  boss.x = focus.x + VIEW_WIDTH + 100
  boss.y = focus.y
  const x0 = boss.x
  foes.update(1, focus, camera, 0)
  assert('ice returns when fully out & not flee', boss.x < x0)
  const foes2 = createEnemies({ random: () => 0.5 })
  const b2 = foes2.spawnIceManAt(focus.x + 500, focus.y, { ...focus, speed: 96, speedUnits: 1.2 })
  b2.x = focus.x + VIEW_WIDTH + 100
  b2.y = focus.y
  b2.fleeT = ICE_FLEE_SEC
  const f0 = b2.x
  foes2.update(1, focus, camera, 0)
  assert('ice flee can leave view', b2.x > f0)
}

{
  // 冰人弹幕子弹 dmg=2。
  const foes = createEnemies({ random: () => 0.5 })
  const boss = foes.spawnIceManAt(focus.x + 40, focus.y, focus)
  boss.barrageCd = 0
  foes.update(0.016, focus, camera, 0)
  assert('ice barrage bullet dmg 2', foes.iceBullets.some((b) => b.dmg === ICE_BULLET_DMG))
}

{
  // 强化怪（难度二）：掷中 → hp×2、击退抗性+1 身位、每颗结晶 50% 高级。
  let norm = 0
  let adv = 0
  const foes = createEnemies({
    random: () => 0,
    getHpGrowthAdd: () => 10,
    hooks: {
      spawnCrystal() {
        norm += 1
      },
      spawnCrystalAt(_x, _y, opts) {
        if (opts?.advanced) adv += 1
        else norm += 1
      },
    },
  })
  foes.update(0.2, focus, camera, 300.1)
  foes.update(0.8, focus, camera, 300.9)
  const st = foes.stingers()[0]
  assert('elite spawn exists', st && st.elite === true)
  assert('elite stinger hp ×2', st.hp === 520 && st.maxHp === 520)
  assert('elite knockback +1 body', st.knockbackResist === BODY * 2)
  st.takeHit(9999)
  foes.update(0.01, focus, camera, 300.9)
  assert('elite drops 4 crystals all advanced', norm === 0 && adv === 4)
}

{
  // 难度一：不掷强化。
  const foes = createEnemies({ random: () => 0, getHpGrowthAdd: () => 0 })
  foes.update(0.2, focus, camera, 300.1)
  foes.update(0.8, focus, camera, 300.9)
  const st = foes.stingers()[0]
  assert('no elite in difficulty1', st && st.elite != true && st.hp === 260 && st.knockbackResist === BODY)
}

// —— P42 批次4：8 种小怪 4 帧序列动画（时间驱动 0.1s/帧 ≈ 10fps、0.4s 一轮无限循环） ——
assert(
  'creep frames 4',
  CREEP_FRAMES === 4 &&
    CREEP_ANIM_FPS === 10 &&
    Math.abs(CREEP_FRAME_SEC - 0.1) < 1e-12 &&
    Math.abs(CREEP_ANIM_SEC - 0.4) < 1e-12,
)

assert(
  'creep anim time driven',
  creepFrameAt('creep', 0, CREEP_FRAMES) === 0 &&
    creepFrameAt('creep', 0.1, CREEP_FRAMES) === 1 &&
    creepFrameAt('creep', 0.2, CREEP_FRAMES) === 2 &&
    creepFrameAt('creep', 0.3, CREEP_FRAMES) === 3 &&
    creepFrameAt('creep', 0.4, CREEP_FRAMES) === 0 &&
    creepFrameAt('creep', 0.5, CREEP_FRAMES) === 1 &&
    creepFrameAt('snail', 0.35, CREEP_FRAMES) === 3 &&
    creepFrameAt('orchid', 1, CREEP_FRAMES) === 2,
)

assert(
  'creep frame index wraps',
  creepFrameAt('creep', -1, 4) === 0 &&
    creepFrameAt('creep', -1e-9, 4) === 0 &&
    creepFrameAt('creep', 3.9, 4) === 3 &&
    creepFrameAt('creep', 4, 4) === 0 &&
    creepFrameAt('creep', 100.1, 4) === 1 &&
    creepFrameAt('creep', Number.NaN, 4) === 0 &&
    creepFrameAt('creep', Number.POSITIVE_INFINITY, 4) === 0 &&
    creepFrameAt('creep', 1, 0) === 0 &&
    creepFrameAt('creep', 1, -4) === 0 &&
    [0, 0.1, 0.2, 0.3, 0.4, 0.55, 7.77, 12345.6, -3].every((t) => {
      const i = creepFrameAt('creep', t, CREEP_FRAMES)
      return Number.isInteger(i) && i >= 0 && i < CREEP_FRAMES
    }),
)

assert(
  'creep anim one cycle wraps',
  [0, 0.1, 0.2, 0.3].every(
    (t) => creepFrameAt('creep', t, CREEP_FRAMES) === creepFrameAt('creep', t + CREEP_ANIM_SEC, CREEP_FRAMES),
  ),
)

{
  // R1⑤：8 种小怪 × 4 帧 = 32 张 PNG 全部在磁盘上（素材由 M1 双拷落盘，本任务不改素材）。
  const missing = []
  let count = 0
  for (const key of CREEP_FRAME_KINDS) {
    for (const name of CREEP_FRAME_NAMES[key] ?? []) {
      count += 1
      if (!fs.existsSync(path.join(CREEP_ASSET_DIR, name))) missing.push(`${key}:${name}`)
    }
  }
  assert('creep 4 frame assets exist', CREEP_FRAME_KINDS.length === 8 && count === 32 && missing.length === 0)
}

{
  // R2①：同屏多只各自相位 —— 同一时刻不整齐划一，且每只仍严格按时间口径循环。
  let n = 0
  const phases = [0.1, 0.9]
  const foes = createEnemies({ random: () => phases[n++] ?? 0.5 })
  const a = foes.spawnCreepAt(focus.x + 200, focus.y + 40, 'regular')
  const b = foes.spawnCreepAt(focus.x + 200, focus.y - 40, 'regular')
  const cycleOf = (ph) =>
    [0, 0.1, 0.2, 0.3].map((t) => creepFrameAt('creep', t + ph * CREEP_ANIM_SEC, CREEP_FRAMES)).join()
  const followsTime = (ent) =>
    foes.creepFrameOf(ent) ===
    creepFrameAt('creep', (ent.animT ?? 0) + ent.animPhase * CREEP_ANIM_SEC, CREEP_FRAMES)
  assert(
    'creep anim phase per instance',
    a.animPhase === 0.1 &&
      b.animPhase === 0.9 &&
      a.animPhase !== b.animPhase &&
      followsTime(a) &&
      followsTime(b) &&
      cycleOf(a.animPhase) !== cycleOf(b.animPhase),
  )
  foes.update(0.15, focus, camera, 0)
  foes.update(0.25, focus, camera, 0)
  assert(
    'creep anim phase holds over time',
    Math.abs(a.animT - 0.4) < 1e-9 && Math.abs(b.animT - 0.4) < 1e-9 && followsTime(a) && followsTime(b),
  )
}

{
  // R2②：序列动画不碰任何既有判定字段（hurtbox / 护甲 / 精英 / 击退抗性 / 生命）。
  const foes = createEnemies({ random: () => 0.5 })
  const snail = foes.spawnSnailAt(focus.x + 120, focus.y)
  const creep = foes.spawnCreepAt(focus.x + 160, focus.y, 'regular')
  const snap = (e) =>
    [e.w, e.h, e.hurtW, e.hurtH, e.armor, e.elite, e.knockbackResist, e.hp, e.maxHp].join(',')
  const before = [snap(snail), snap(creep)]
  const f0 = foes.creepFrameOf(creep)
  foes.update(CREEP_ANIM_SEC, focus, camera, 0)
  assert(
    'creep anim keeps gameplay fields',
    before[0] === snap(snail) && before[1] === snap(creep) && creep.animT === CREEP_ANIM_SEC,
  )
  assert('creep anim full cycle same frame', foes.creepFrameOf(creep) === f0)
}

{
  // R2③：暂停 / 升级时（playing 以外）match.js 不调 foes.update ⇒ 只有 update 推进动画，帧停住。
  const foes = createEnemies({ random: () => 0.5 })
  const creep = foes.spawnCreepAt(focus.x + 200, focus.y, 'regular')
  foes.update(0.25, focus, camera, 0)
  const t1 = creep.animT
  const f1 = foes.creepFrameOf(creep)
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    beginPath() {},
    arc() {},
    stroke() {},
    strokeRect() {},
    fillRect() {},
    drawImage() {},
  }
  foes.update(0, focus, camera, 0)
  foes.draw(ctx)
  assert(
    'creep anim paused when not playing',
    t1 === 0.25 &&
      creep.animT === t1 &&
      foes.creepFrameOf(creep) === f1 &&
      f1 === creepFrameAt('creep', 0.25 + creep.animPhase * CREEP_ANIM_SEC, CREEP_FRAMES),
  )
}

if (failed) {
  console.log(`RESULT FAIL (${failed})`)
  process.exit(1)
}
console.log('RESULT PASS')
