/**
 * M7 逻辑自测（不依赖浏览器 / 不改 engine）。
 * P6 速度/结晶/黑洞 + P9 collect:false + P13 磁铁 +1 身位 + P17 树 dealt/slash OBB
 * + P18 树血 extra / spawnCrystalBurst。
 * 运行：在 frontend/ 下 `node src/game/world/selftest.mjs`
 */
import { BODY } from '../constants.js'
import { createPickupField } from '../pickups/pickups.js'
import { createTreeField } from './trees.js'
import {
  MAGNET_BONUS_STEP,
  MAGNET_RANGE,
  PICKUP_SPEED,
  TREE_DROP_CRYSTALS_MIN,
  TREE_HP_BASE,
  TREE_HP_PER_TIER,
  treeCrystalMax,
  treeHpForTier,
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
assert('magnet bonus step 1', MAGNET_BONUS_STEP === 1)
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
assert('magnetBonus starts 0', magEnv.mods.magnetBonus === 0)
assert('range starts 2 BODY', magEnv.magnetRange() === MAGNET_RANGE)
const far = MAGNET_RANGE + 4
const magPk = createPickupField({ getMagnetBonus: () => magEnv.mods.magnetBonus })
magPk.spawnCrystal(far, 0)
const xBefore = magPk.items[0].x
magPk.update(0.05, focus)
assert('no pull outside 2 BODY before magnet', magPk.items[0].x === xBefore)

magEnv.addMagnet()
assert('addMagnet +1 BODY', magEnv.mods.magnetBonus === 1)
assert('range now 3 BODY', Math.abs(magEnv.magnetRange() - (MAGNET_RANGE + BODY)) < 1e-9)
magPk.update(0.05, focus)
assert('pull inside 3 BODY after magnet', magPk.items[0].x < xBefore)

magEnv.addMagnet()
assert('second magnet 4 BODY', magEnv.mods.magnetBonus === 2)
assert(
  'range now 4 BODY',
  Math.abs(magEnv.magnetRange() - (MAGNET_RANGE + BODY * 2)) < 1e-9,
)

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

const dmgField = createTreeField()
const dmgTree = dmgField.spawnAt(20, 0, 50)
const dmgHit = dmgField.hitAt(20, 0, 15)
assert('hitAt dealt', dmgHit.hit && dmgHit.dealt === 15 && dmgTree.hp === 35)
const dmgMiss = dmgField.hitAt(1000, 1000, 15)
assert('hitAt miss dealt 0', !dmgMiss.hit && dmgMiss.dealt === 0 && dmgMiss.tree === null)

const slashField = createTreeField()
const frontTree = slashField.spawnAt(10, 0, 50)
const sideTree = slashField.spawnAt(10, 80, 50)
const slashHit = slashField.hitSlashAt({
  x: 7,
  y: 0,
  ang: 0,
  length: BODY,
  thick: BODY * 0.5,
  damage: 10,
})
assert('slash hits front tree', slashHit.hit && slashHit.dealt === 10 && frontTree.hp === 40)
assert('slash misses far side tree', sideTree.hp === 50)
const slashMiss = slashField.hitSlashAt({
  x: 200,
  y: 0,
  ang: 0,
  length: BODY,
  thick: BODY * 0.5,
  damage: 10,
})
assert('slash miss dealt 0', !slashMiss.hit && slashMiss.dealt === 0)
assert('env hitSlashAt wired', typeof createEnvironment().hitSlashAt === 'function')

assert('treeHp t=0 → 50', treeHpForTier(0) === TREE_HP_BASE && treeHpForTier(0) === 50)
assert('treeHp t=1 → 55', treeHpForTier(1) === TREE_HP_BASE + TREE_HP_PER_TIER)
assert('treeHp t=1 extra 5 → 60', treeHpForTier(1, 5) === 60)
assert('treeHp t=0 extra still 50', treeHpForTier(0, 5) === 50)

const hpField = createTreeField()
assert('field t=0 hp 50', hpField.hpForTier(0) === 50)
assert('field t=1 hp 55', hpField.hpForTier(1) === 55)
const hpField2 = createTreeField({ getHpGrowthAdd: () => 5 })
assert('field t=1 extra 5 → 60', hpField2.hpForTier(1) === 60)
assert('field t=0 extra still 50', hpField2.hpForTier(0) === 50)
const envHp = createEnvironment({ getHpGrowthAdd: () => 5 })
assert('env t=1 extra 5 → 60', envHp.hpForTier(1) === 60)
assert('env t=0 extra still 50', envHp.hpForTier(0) === 50)

let seed = 1
const burstRng = () => {
  seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
  return (seed >>> 16) / 65536
}
const burstPk = createPickupField({ random: burstRng })
burstPk.spawnCrystalBurst(40, -10, 300)
const gems = burstPk.items.filter((i) => i.type === 'crystal')
assert('burst count 300', gems.length === 300)
assert(
  'burst spread ≤ BODY',
  gems.every((i) => Math.hypot(i.x - 40, i.y - (-10)) <= BODY + 1e-9),
)
const uniq = new Set(gems.map((i) => `${i.x.toFixed(4)},${i.y.toFixed(4)}`))
assert('burst 300 not stacked', uniq.size > 50)

const envBurst = createEnvironment({ random: burstRng })
assert('env spawnCrystalBurst wired', typeof envBurst.spawnCrystalBurst === 'function')
envBurst.spawnCrystalBurst(0, 0, 12)
assert(
  'env burst 12 within BODY',
  envBurst.pickups.length === 12 &&
    envBurst.pickups.every((i) => Math.hypot(i.x, i.y) <= BODY + 1e-9),
)

console.log(failed ? `RESULT FAIL (${failed})` : 'RESULT PASS')
process.exit(failed ? 1 : 0)
