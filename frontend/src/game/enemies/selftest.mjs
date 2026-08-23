/**
 * M6 逻辑自测（不依赖浏览器 / 不改 engine）。
 * 运行：在 frontend/ 下 `node src/game/enemies/selftest.mjs`
 */
import {
  BODY,
  SPEED_PX_PER_UNIT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../constants.js'
import {
  CREEP_DRAW,
  CREEP_HP,
  CREEP_SRC,
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
assert('mushroom hp 32+10t', mushroomHp(0) === 32 && mushroomHp(45) === 42 && mushroomHp(90) === 52)
assert('mushroom wave 5+floor(s/120)', mushroomSpawnCount(0) === 5 && mushroomSpawnCount(119) === 5 && mushroomSpawnCount(120) === 6 && mushroomSpawnCount(240) === 7)
assert('mushroom interval always 5', mushroomSpawnInterval() === 5 && creepSpawnInterval(99) === 5)
assert('no mushroom cap at 99min', mushroomSpawnCount(99 * 60) === 5 + 49)
assert('speed mul t0 = 0.62', creepSpeedMul(0) === 0.62)
assert('speed mul t1 = 0.66', Math.abs(creepSpeedMul(1) - 0.66) < 1e-12)
assert('speed mul cap 1.4', creepSpeedMul(99) === 1.4)
assert('split mul t0 = 0.77', splitSpeedMul(0) === 0.77)
assert('split mul t1 = 0.81', Math.abs(splitSpeedMul(1) - 0.81) < 1e-12)
assert('split mul cap 1.4', splitSpeedMul(99) === 1.4)
assert('creep px t0 = 0.62×80', creepSpeedPx(0) === 0.62 * SPEED_PX_PER_UNIT)
assert('split px t0 = 0.77×80', splitSpeedPx(0) === 0.77 * SPEED_PX_PER_UNIT)
assert('sprite is 蘑菇怪.png single frame', CREEP_SRC.includes('蘑菇怪.png'))
assert('snail sprite 蜗牛怪.png', SNAIL_SRC.includes('蜗牛怪.png'))
assert('split sprite 裂怪.png', SPLIT_SRC.includes('裂怪.png'))
assert('split src is not mushroom', !SPLIT_SRC.includes('蘑菇怪'))
assert('scaledWave 4×2 = 8', scaledWaveCount(4, 2) === 8)
assert('scaledWave 3×1.5 = 5', scaledWaveCount(3, 1.5) === 5)
assert('scaledWave min 1', scaledWaveCount(4, 0) === 1)
assert('snail unlock 120', SNAIL_UNLOCK_SEC === 120)
assert('snail count 120s = 4', snailSpawnCount(119) === 0 && snailSpawnCount(120) === 4)
assert('snail count +1 /45s', snailSpawnCount(165) === 5)
assert('snail hp 50 +20/40s', snailHp(120) === 50 && snailHp(160) === 70)
assert('snail speed 0.62 +0.03/45s no cap', snailSpeedMul(120) === 0.62 && Math.abs(snailSpeedMul(165) - 0.65) < 1e-12 && snailSpeedMul(120 + 45 * 30) > 1.4)
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
  const splits = foes.creeps()
  assert(
    `gray burst +1s → ${GRAY_BURST_COUNT} split`,
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
  assert('regular 5s/5', wave.creeps().length === 5)
  wave.update(24.9, focus, camera, 29.91)
  assert('no gray before 30s', wave.grayTrees().length === 0)
  wave.update(0.12, focus, camera, 30.03)
  assert('gray first wave at 30s/2', wave.grayTrees().length === 2)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(5.01, focus, camera, 5.01, 2)
  assert('spawnRate 2 → 10 mushrooms /5s', wave.creeps().length === 10)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(119.9, focus, camera, 119.9)
  assert('no snail before 120s', wave.snails().length === 0)
  wave.update(0.2, focus, camera, 120.1)
  assert('snail first wave at 120s/4', wave.snails().length === 4)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 120, 1.5)
  assert('spawnRate 1.5 → 6 snails', wave.snails().length === 6)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 30, 2)
  assert('spawnRate 2 → 4 gray', wave.grayTrees().length === 4)
}

assert('slime unlock 180', SLIME_X1_UNLOCK_SEC === 180)
assert('slime hp 120+22u', slimeX1Hp(180) === 120 && slimeX1Hp(225) === 142)
assert('slime wave 6+floor(u/45)', slimeX1SpawnCount(179) === 0 && slimeX1SpawnCount(180) === 6 && slimeX1SpawnCount(225) === 7)
assert('slime speed 0.87+0.03u no cap', slimeX1SpeedMul(180) === 0.87 && Math.abs(slimeX1SpeedMul(225) - 0.9) < 1e-12 && slimeX1SpeedMul(180 + 45 * 30) > 1.4)
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
  assert('x-1 hp at 285s = 164', x1.hp === 164 && x1.spawnHp === 164)
  x1.takeHit(200)
  foes.update(0.01, focus, camera, 285)
  const kids = foes.slimesX3()
  assert('x-3 hp from spawnHp 164', kids.length === 3 && kids[0].hp === 41)
  assert('x-3 speed = death mul +0.10', Math.abs(kids[0].speedMul - (slimeX1SpeedMul(285) + 0.1)) < 1e-12)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 179.9)
  assert('no slime before 180s', wave.slimesX1().length === 0)
  wave.update(0.2, focus, camera, 180.1)
  assert('slime first wave at 180s/6', wave.slimesX1().length === 6)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 180, 2)
  assert('spawnRate 2 → 12 slimes', wave.slimesX1().length === 12)
}

assert('ice unlock 420', ICE_MAN_UNLOCK_SEC === 420)
assert('ice hp 3300', ICE_MAN_HP === 3300)
assert('ice draw 48', ICE_MAN_DRAW === 48)
assert('ice bullet 200', ICE_BULLET_SPEED === 200)
assert('ice knockback 0.5', ICE_MAN_KNOCKBACK_SCALE === 0.5)
assert('ice dash 1–6 / 8 body', ICE_DASH_MIN === 1 && ICE_DASH_MAX === 6 && ICE_DASH_DIST === BODY * 8)
assert('ice dash roll 1–6', rollIceDashCount(() => 0) === 1 && rollIceDashCount(() => 0.99) === 6)
assert('ice dash/barrage/orchid periods', ICE_DASH_PERIOD === 12 && ICE_BARRAGE_PERIOD === 22 && ICE_ORCHID_PERIOD === 32)
assert('ice respawn 180 / 300 crystal / ×1.4', ICE_MAN_RESPAWN_SEC === 180 && ICE_MAN_CRYSTALS === 300 && iceManRespawnHp(1) === 4620)
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
  assert('ice hp/scale', boss.hp === 3300 && boss.knockbackScale === 0.5 && boss.name === '冰人')
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
  assert('ice flee after 400', boss.fleeT === ICE_FLEE_SEC && boss.hp === 2900)
  boss.takeHit(50)
  assert('ice flee no extra acc', (boss.hurtAcc ?? 0) === 0 && boss.hp === 2850)
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
  assert(
    'ice regen consts 3s/44px/20',
    ICE_REGEN_DELAY_SEC === 3 && ICE_REGEN_RANGE === BODY * 2 && ICE_REGEN_PER_SEC === 20,
  )
  boss.takeHit(100)
  assert('ice hurt to 3200', boss.hp === 3200)
  foes.update(3, focus, camera, 0)
  assert('ice no regen at 3s mark', boss.hp === 3200 && healed === 0)
  foes.update(1.01, focus, camera, 0)
  assert('ice regen +20 after lonely 4s', boss.hp === 3220 && healed === 20)
  assert('ice regen onHeal ice_man/20 green', log[0][0] === 'ice_man' && log[0][1] === 20)
  foes.update(1, focus, camera, 0)
  assert('ice regen every 1s', boss.hp === 3240 && healed === 40)
  const near = { ...focus, x: boss.x, y: boss.y }
  foes.update(2, near, camera, 0)
  assert('ice regen stops when player in range', boss.hp === 3240 && healed === 40)
  foes.update(2, focus, camera, 0)
  assert('ice regen delay restarts after reset', boss.hp === 3240 && healed === 40)
  foes.update(2.01, focus, camera, 0)
  assert('ice regen resumes after new 3s+1s', boss.hp === 3260 && healed === 60)
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
  assert('ice contact −1', victim.hp === 2)
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
  assert('ice orchid 3 at 32s', foes.orchids().length === 3 && boss.hp === 3300)
  boss.takeHit(9999)
  foes.update(0.01, focus, camera, 0)
  assert('ice death keeps orchid', foes.iceMen().length === 0 && foes.orchids().length === 3)
  foes.update(ICE_ORCHID_PERIOD, focus, camera, 50)
  assert('dead ice no more orchid', foes.orchids().length === 3)
}

assert('scorpion unlock 300', SCORPION_UNLOCK_SEC === 300)
assert('scorpion hp 105+15u', scorpionHp(300) === 105 && scorpionHp(345) === 120)
assert('scorpion wave 2+floor(u/30)', scorpionSpawnCount(299) === 0 && scorpionSpawnCount(300) === 2 && scorpionSpawnCount(330) === 3)
assert('scorpion speed 0.8+0.05u', scorpionSpeedMul(300) === 0.8 && Math.abs(scorpionSpeedMul(345) - 0.85) < 1e-12)
assert('scorpion sprite / bullet 180', SCORPION_SRC.includes('蝎子怪.png') && SCORPION_BULLET_SPEED === 180)
assert('scorpion ranges 8/3/7', SCORPION_CHASE_RANGE === BODY * 8 && SCORPION_HOLD_RANGE === BODY * 3 && SCORPION_FLEE_STOP === BODY * 7)

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 299.9)
  assert('no scorpion before 300s', wave.scorpions().length === 0)
  wave.update(0.2, focus, camera, 300.1)
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
  assert('ice first 3300', boss && boss.hp === 3300)
  boss.takeHit(9999)
  foes.update(0.01, focus, camera, 421)
  assert('ice death 300 crystals', crystals === 300 && foes.iceMen().length === 0)
  foes.update(0.2, focus, camera, 421 + 179.9)
  assert('ice no respawn before 180s', foes.iceMen().length === 0)
  foes.update(0.2, focus, camera, 421 + 180)
  const again = foes.iceMen()[0]
  assert('ice respawn hp 4620', again && again.hp === 4620 && foes.iceMen().length === 1)
}

{
  const foes = createEnemies({ random: () => 0.5, getHpGrowthAdd: () => 5 })
  foes.update(0.01, focus, camera, 45)
  const creep = foes.spawnCreepAt(focus.x + 40, focus.y)
  assert('diff2 mushroom t1 = 32+15', creep.hp === 47 && mushroomHp(45, 5) === 47)
  foes.update(0.01, focus, camera, 160)
  const snail = foes.spawnSnailAt(focus.x + 80, focus.y)
  assert('diff2 snail extra on tier', snail.hp === 75 && snailHp(160, 5) === 75)
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

if (failed) {
  console.log(`RESULT FAIL (${failed})`)
  process.exit(1)
}
console.log('RESULT PASS')
