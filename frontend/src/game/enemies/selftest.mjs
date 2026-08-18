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
  GRAY_BURST_COUNT,
  GRAY_BURST_DELAY,
  GRAY_BURST_RADIUS,
  GRAY_SELF_PERIOD,
  GRAY_UNLOCK_SEC,
  SNAIL_UNLOCK_SEC,
  SLIME_X1_UNLOCK_SEC,
  SLIME_X3_INVULN_SEC,
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
} from './index.js'
import { GRAY_HP0, pickNearOutOfView } from '../spawner/index.js'

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
assert('mushroom hp 27+5t', mushroomHp(0) === 27 && mushroomHp(45) === 32 && mushroomHp(90) === 37)
assert('mushroom wave 5+floor(s/120)', mushroomSpawnCount(0) === 5 && mushroomSpawnCount(119) === 5 && mushroomSpawnCount(120) === 6 && mushroomSpawnCount(240) === 7)
assert('mushroom interval always 5', mushroomSpawnInterval() === 5 && creepSpawnInterval(99) === 5)
assert('no mushroom cap at 99min', mushroomSpawnCount(99 * 60) === 5 + 49)
assert('speed mul t0 = 0.75', creepSpeedMul(0) === 0.75)
assert('speed mul t1 = 0.83', Math.abs(creepSpeedMul(1) - 0.83) < 1e-12)
assert('speed mul cap 1.4', creepSpeedMul(99) === 1.4)
assert('split mul t0 = 0.9', splitSpeedMul(0) === 0.9)
assert('split mul t1 = 0.98', Math.abs(splitSpeedMul(1) - 0.98) < 1e-12)
assert('split mul cap 1.4', splitSpeedMul(99) === 1.4)
assert('creep px t0 = 0.75×80', creepSpeedPx(0) === 0.75 * SPEED_PX_PER_UNIT)
assert('split px t0 = 0.9×80', splitSpeedPx(0) === 0.9 * SPEED_PX_PER_UNIT)
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
assert('snail hp 45 +10/40s', snailHp(120) === 45 && snailHp(160) === 55)
assert('snail speed 0.75 +0.07/45s no cap', snailSpeedMul(120) === 0.75 && Math.abs(snailSpeedMul(165) - 0.82) < 1e-12 && snailSpeedMul(120 + 45 * 20) > 1.4)
assert('snail px t0', snailSpeedPx(120) === 0.75 * SPEED_PX_PER_UNIT)
assert('gray wave always 2 / interval 5s', grayTreeSpawnCount(0) === 2 && grayTreeSpawnCount(2) === 2 && grayTreeSpawnInterval(0) === 5)
assert(
  'gray interval t2 = 5*0.94^2',
  Math.abs(grayTreeSpawnInterval(2) - 5 * 0.94 ** 2) < 1e-12,
)
assert('gray unlock 30s', GRAY_UNLOCK_SEC === 30)
assert('gray self period 3s', GRAY_SELF_PERIOD === 3)
assert('roll 1 at 0', rollGraySelfDamage(() => 0) === 1)
assert('roll 5 at 0.99', rollGraySelfDamage(() => 0.99) === 5)
assert('gray hp t0 = 25', grayTreeHp(0) === GRAY_HP0)
assert('gray hp t1 = 25*1.15', Math.abs(grayTreeHp(1) - 25 * 1.15) < 1e-12)

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
  assert('mushroom hp 27', creep.hp === CREEP_HP && creep.hp === 27)
  assert('mushroom name 蘑菇怪', creep.name === '蘑菇怪')
  assert('mushroom knockbackable resist 0', creep.knockbackable === true && (creep.knockbackResist || 0) === 0)
  assert('mushroom in targets', foes.targets.includes(creep))
  foes.update(1, focus, camera, 0)
  assert(
    'regular speed 0.75 units (not × player)',
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
  assert('split speed 0.9 units', Math.abs(moved - splitSpeedPx(0)) < 1e-6)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const snail = foes.spawnSnailAt(focus.x + 80, focus.y)
  assert('snail hp 45 at t0', snail.hp === 45)
  assert('snail knockbackResist = BODY', snail.knockbackResist === BODY)
  foes.update(1, focus, camera, 0)
  assert(
    'snail speed 0.75 units',
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
  assert('takeHit −15', creep.hp === 12)
  creep.takeHit(12)
  foes.update(0.01, focus, camera, 0)
  assert('creep death drops 1 crystal + 1 exp', crystals === 1 && exp === 1)
  assert('dead creep removed', !foes.targets.includes(creep))
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
  assert('gray hp 25', gray.hp === 25)
  assert('gray not knockbackable', gray.knockbackable === false)
  foes.update(2.99, focus, camera, 0)
  assert('gray self no tick before 3s', gray.hp === 25)
  foes.update(0.02, focus, camera, 0)
  assert('gray self 3s roll 3 (rng=0.5)', gray.hp === 22)
}

{
  const foes = createEnemies({ random: () => 0.5 })
  const a = foes.spawnGrayAt(focus.x + 180, focus.y + 180, GRAY_HP0)
  foes.update(2, focus, camera, 0)
  const b = foes.spawnGrayAt(focus.x + 220, focus.y + 220, GRAY_HP0)
  foes.update(1.05, focus, camera, 0)
  assert('gray self timers independent', a.hp === 22 && b.hp === 25)
}

{
  const rolls = [0, 0.99]
  let i = 0
  const foes = createEnemies({ random: () => rolls[i++] ?? 0.5 })
  const a = foes.spawnGrayAt(focus.x + 160, focus.y + 160, GRAY_HP0)
  const b = foes.spawnGrayAt(focus.x + 240, focus.y + 240, GRAY_HP0)
  foes.update(3, focus, camera, 0)
  assert('gray self rolls independent', a.hp === 24 && b.hp === 20)
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

assert('slime unlock 300', SLIME_X1_UNLOCK_SEC === 300)
assert('slime hp 85+12u', slimeX1Hp(300) === 85 && slimeX1Hp(345) === 97)
assert('slime wave 6+floor(u/45)', slimeX1SpawnCount(299) === 0 && slimeX1SpawnCount(300) === 6 && slimeX1SpawnCount(345) === 7)
assert('slime speed 1.00+0.07u no cap', slimeX1SpeedMul(300) === 1 && Math.abs(slimeX1SpeedMul(345) - 1.07) < 1e-12 && slimeX1SpeedMul(300 + 45 * 30) > 1.4)
assert('x-3 hp ceil(0.25 spawnHp)', slimeX3HpFromParent(85) === 22 && slimeX3HpFromParent(97) === 25)
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
  assert('x-1 name/hp/spawnHp', x1.name === '史莱姆x-1' && x1.hp === 85 && x1.spawnHp === 85)
  assert('x-1 knockbackable', x1.knockbackable === true && (x1.knockbackResist || 0) === 0)
  foes.update(1, focus, camera, 0)
  assert(
    'x-1 speed 1.00 units',
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
  x1.takeHit(99)
  foes.update(0.01, focus, camera, 0)
  assert('x-1 death 2 crystals', crystals === 2)
  assert('x-1 splits into 3 x-3', foes.slimesX1().length === 0 && foes.slimesX3().length === 3)
  const kids = foes.slimesX3()
  assert(
    'x-3 hp/speed snapshot',
    kids.every((c) => c.hp === 22 && c.name === '史莱姆x-3' && Math.abs(c.speedMul - 1.1) < 1e-12),
  )
  const hp0 = kids[0].hp
  kids[0].takeHit(99)
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
  x1.takeHit(99)
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
  foes.update(0.01, focus, camera, 345)
  const x1 = foes.spawnSlimeX1At(focus.x + 400, focus.y + 400)
  assert('x-1 hp at 345s = 97', x1.hp === 97 && x1.spawnHp === 97)
  x1.takeHit(99)
  foes.update(0.01, focus, camera, 345)
  const kids = foes.slimesX3()
  assert('x-3 hp from spawnHp 97', kids.length === 3 && kids[0].hp === 25)
  assert('x-3 speed = death mul +0.10', Math.abs(kids[0].speedMul - (slimeX1SpeedMul(345) + 0.1)) < 1e-12)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 299.9)
  assert('no slime before 300s', wave.slimesX1().length === 0)
  wave.update(0.2, focus, camera, 300.1)
  assert('slime first wave at 300s/6', wave.slimesX1().length === 6)
}

{
  const wave = createEnemies({ random: () => 0.5 })
  wave.update(0.01, focus, camera, 300, 2)
  assert('spawnRate 2 → 12 slimes', wave.slimesX1().length === 12)
}

if (failed) {
  console.log(`RESULT FAIL (${failed})`)
  process.exit(1)
}
console.log('RESULT PASS')
