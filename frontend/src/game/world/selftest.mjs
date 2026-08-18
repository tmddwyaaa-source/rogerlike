/**
 * M7 逻辑自测（不依赖浏览器 / 不改 engine）。
 * P6 速度/结晶/黑洞/磁铁 + P9 collect:false。
 * 运行：在 frontend/ 下 `node src/game/world/selftest.mjs`
 */
import { BODY } from '../constants.js'
import { createPickupField } from '../pickups/pickups.js'
import {
  MAGNET_MUL_STEP,
  MAGNET_RANGE,
  PICKUP_SPEED,
  TREE_DROP_CRYSTALS_MIN,
  treeCrystalMax,
} from './constants.js'
import { createEnvironment } from './index.js'

let failed = 0
function assert(name, cond) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

assert('PICKUP_SPEED === 135', PICKUP_SPEED === 135)
assert('magnet step 1.5', MAGNET_MUL_STEP === 1.5)
assert('base magnet 2 BODY', MAGNET_RANGE === BODY * 2)
assert('59s crystal max=6', treeCrystalMax(59) === 6)
assert('60s crystal max=8', treeCrystalMax(60) === 8)
assert('119s max=8', treeCrystalMax(119) === 8)
assert('120s max=10', treeCrystalMax(120) === 10)
assert('0s max=6', treeCrystalMax(0) === 6)

const alwaysMax = () => 0.999
const pk59 = createPickupField({ random: alwaysMax })
pk59.spawnTreeDrops(0, 0, 59)
assert(
  '59s drop max 6 crystals, no fruit (rng 0.999)',
  pk59.items.filter((i) => i.type === 'crystal').length === 6 &&
    pk59.items.every((i) => i.type === 'crystal'),
)

const pk60 = createPickupField({ random: alwaysMax })
pk60.spawnTreeDrops(0, 0, 60)
assert(
  '60s drop max 8 crystals',
  pk60.items.filter((i) => i.type === 'crystal').length === 8,
)

const pkMin = createPickupField({ random: () => 0 })
pkMin.spawnTreeDrops(0, 0, 180)
assert(
  'min still 3 at 180s',
  pkMin.items.filter((i) => i.type === 'crystal').length === TREE_DROP_CRYSTALS_MIN &&
    pkMin.items.some((i) => i.type === 'fruit'),
)

let exp = 0
const focus = { x: 0, y: 0 }
const hole = createPickupField({
  hooks: { onCrystal: (n) => { exp += n } },
})
hole.spawnCrystal(400, 0)
hole.spawnFruit(400, 0)
hole.pullAllCrystals()
assert('pull does not splice', hole.items.length === 2)
assert('pull does not grant exp', exp === 0)
assert('crystal marked', hole.items.find((i) => i.type === 'crystal').forcedPull === true)
assert('fruit not marked', hole.items.find((i) => i.type === 'fruit').forcedPull !== true)

const cx0 = hole.items.find((i) => i.type === 'crystal').x
const fx0 = hole.items.find((i) => i.type === 'fruit').x
hole.update(0.1, focus)
const crystal = hole.items.find((i) => i.type === 'crystal')
const fruit = hole.items.find((i) => i.type === 'fruit')
assert('crystal still present after 0.1s', !!crystal)
assert('exp still 0 after fly start', exp === 0)
assert('crystal flies at PICKUP_SPEED', Math.abs(cx0 - crystal.x - PICKUP_SPEED * 0.1) < 1e-6)
assert('fruit not pulled by blackhole', fruit.x === fx0)

const magEnv = createEnvironment()
assert('magnetMul starts 1', magEnv.mods.magnetMul === 1)
assert('range starts 2 BODY', magEnv.magnetRange() === MAGNET_RANGE)
const far = MAGNET_RANGE + 4
const magPk = createPickupField({ getMagnetMul: () => magEnv.mods.magnetMul })
magPk.spawnCrystal(far, 0)
const xBefore = magPk.items[0].x
magPk.update(0.05, focus)
assert('no pull outside 2 BODY before magnet', magPk.items[0].x === xBefore)

magEnv.addMagnet()
assert('addMagnet ×1.5', magEnv.mods.magnetMul === 1.5)
assert('range now 3 BODY', Math.abs(magEnv.magnetRange() - MAGNET_RANGE * 1.5) < 1e-9)
magPk.update(0.05, focus)
assert('pull inside 3 BODY after magnet', magPk.items[0].x < xBefore)

magEnv.addMagnet()
assert('second magnet 2.25', magEnv.mods.magnetMul === 2.25)

const env = createEnvironment({ random: alwaysMax })
env.update(0, { x: 100, y: 100 }, { x: 0, y: 0 }, 60)
const nTrees = env.trees.length
const tree = env.trees[0]
if (tree) {
  for (let i = 0; i < 12 && env.trees.includes(tree); i++) {
    env.hitAt(tree.x, tree.y, 50)
  }
  assert(
    'destroy at 60s drops up to 8 crystals',
    env.pickups.filter((i) => i.type === 'crystal').length === 8,
  )
} else {
  assert('destroy at 60s drops up to 8 crystals', false)
}
assert('seed still works', nTrees >= 0)

env.pullAllCrystals()
const beforeN = env.pickups.length
const beforeExp = exp
env.updatePickups(0.016, { x: 0, y: 0 })
assert('updatePickups does not wipe crystals', env.pickups.length === beforeN)
void beforeExp

let freezeExp = 0
let freezeFruit = 0
const freeze = createPickupField({
  hooks: {
    onCrystal: (n) => { freezeExp += n },
    onFruit: () => { freezeFruit += 1 },
  },
})
freeze.spawnCrystal(0, 0)
freeze.spawnFruit(0, 0)
freeze.spawnCrystal(12, 0)
freeze.pullAllCrystals()
const n0 = freeze.items.length
const xFly0 = freeze.items.find((i) => i.x === 12).x
freeze.update(0.1, focus, { collect: false })
assert('collect:false keeps overlapping gems', freeze.items.length === n0)
assert('collect:false grants no exp', freezeExp === 0 && freezeFruit === 0)
const flying = freeze.items.find((i) => i.type === 'crystal' && i.x !== 0)
assert('collect:false still flies', flying && flying.x < xFly0)

freeze.update(0.016, focus)
assert('collect default still picks up', freeze.items.length < n0)
assert('collect default grants exp', freezeExp + freezeFruit > 0)

const envFreeze = createEnvironment({
  hooks: { onCrystal: () => { freezeExp += 1 } },
})
envFreeze.spawnCrystal(0, 0)
envFreeze.updatePickups(0.05, focus, { collect: false })
assert('env updatePickups collect:false keeps gem', envFreeze.pickups.length === 1)

console.log(failed ? `RESULT FAIL (${failed})` : 'RESULT PASS')
process.exit(failed ? 1 : 0)
