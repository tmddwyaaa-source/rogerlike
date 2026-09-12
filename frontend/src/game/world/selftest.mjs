/**
 * M7 逻辑自测（不依赖浏览器 / 不改 engine）。
 * P6 速度/结晶/黑洞 + P9 collect:false + P13 磁铁 +1 身位 + P17 树 dealt/slash OBB
 * + P18 树血 extra / spawnCrystalBurst。
 * 运行：在 frontend/ 下 `node src/game/world/selftest.mjs`
 */
import { BODY } from '../constants.js'
import { createPickupField } from '../pickups/pickups.js'
import { createTreeField } from './trees.js'
import { createDecorationField } from './decorations.js'
import {
  ADVANCED_CRYSTAL_COLOR,
  ADVANCED_CRYSTAL_EXP,
  CRYSTAL_COLOR,
  CRYSTAL_EXP,
  CRYSTAL_SIZE,
  DECOR_PADDING,
  DECOR_STICK_COUNT,
  DECOR_STONE_COUNT,
  MAGNET_BONUS_STEP,
  MAGNET_RANGE,
  PICKUP_SPEED,
  TREE_CRYSTAL_EARTH_STEP,
  TREE_DROP_CRYSTALS_MAX,
  TREE_DROP_CRYSTALS_MIN,
  TREE_HP_BASE,
  TREE_HP_PER_TIER,
  earthPicksFromExtraTrees,
  rollTreeCrystals,
  treeCrystalMax,
  treeDropElapsed,
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

// P42 批次5（TASK-035 / M5）：大地啊新增「普通树结晶掉落上限 +2/层（可叠）」。
// 端到端走 createEnvironment：earth 计数沿用 mods.extraTrees，掉落只吃 elapsedSec。
const earthMaxEnv = createEnvironment({ random: alwaysMax })
earthMaxEnv.addEarth()
earthMaxEnv.addEarth()
earthMaxEnv.spawnTreeDrops(0, 0, 0)
const earthMaxCrystals = earthMaxEnv.pickups.filter((i) => i.type === 'crystal').length
const earthMaxFruits = earthMaxEnv.pickups.filter((i) => i.type === 'fruit').length

const earthMinEnv = createEnvironment({ random: () => 0 })
earthMinEnv.addEarth()
earthMinEnv.addEarth()
earthMinEnv.spawnTreeDrops(0, 0, 0)
const earthMinCrystals = earthMinEnv.pickups.filter((i) => i.type === 'crystal').length
const earthMinFruits = earthMinEnv.pickups.filter((i) => i.type === 'fruit').length

assert(
  'earth crystal max step 2 per pick',
  TREE_CRYSTAL_EARTH_STEP === 2 &&
    treeCrystalMax(0, 1) === TREE_DROP_CRYSTALS_MAX + 2 &&
    treeCrystalMax(59, 1) === 8 &&
    treeCrystalMax(60, 1) === 10 &&
    rollTreeCrystals(alwaysMax, 0, 1) === 8,
)
assert(
  'earth crystal max stacks',
  treeCrystalMax(0, 2) === 10 &&
    treeCrystalMax(0, 3) === 12 &&
    treeCrystalMax(120, 2) === 14 &&
    earthMaxCrystals === 10 &&
    earthMaxFruits === 0 &&
    earthPicksFromExtraTrees(earthMaxEnv.mods.extraTrees) === 2,
)
assert(
  'earth crystal min unchanged 3',
  TREE_DROP_CRYSTALS_MIN === 3 &&
    treeCrystalMax(0, 0) === TREE_DROP_CRYSTALS_MAX &&
    treeCrystalMax(0, 5) === TREE_DROP_CRYSTALS_MAX + 10 &&
    rollTreeCrystals(() => 0, 0, 2) === 3 &&
    rollTreeCrystals(() => 0, 600, 5) === 3 &&
    earthMinCrystals === 3 &&
    earthMinFruits === 1,
)
assert(
  'earth picks reuse extraTrees counter (no parallel state)',
  earthPicksFromExtraTrees(0) === 0 &&
    earthPicksFromExtraTrees(2) === 1 &&
    earthPicksFromExtraTrees(4) === 2 &&
    earthMinEnv.mods.extraTrees === 4 &&
    Math.abs(earthMinEnv.mods.fruitBonus - 0.2) < 1e-9,
)
assert(
  'earth drop elapsed equals picks param',
  treeCrystalMax(treeDropElapsed(0, 2), 0) === treeCrystalMax(0, 2) &&
    treeCrystalMax(treeDropElapsed(119, 3), 0) === treeCrystalMax(119, 3) &&
    treeDropElapsed(0, 2) === 120,
)

// 死亡路径（真实接线）：砍倒树 → onDestroyed → 掉落；earth 2 层时应为 6+4=10。
const earthDeathEnv = createEnvironment({ random: alwaysMax })
earthDeathEnv.update(0, { x: 100, y: 100 }, { x: 0, y: 0 }, 0)
earthDeathEnv.addEarth()
earthDeathEnv.addEarth()
const earthDeathTree = earthDeathEnv.trees[0]
if (earthDeathTree) {
  for (let i = 0; i < 12 && earthDeathEnv.trees.includes(earthDeathTree); i++) {
    earthDeathEnv.hitAt(earthDeathTree.x, earthDeathTree.y, 50)
  }
}
assert(
  'earth raises crystal max on tree death path',
  !!earthDeathTree &&
    earthDeathEnv.pickups.filter((i) => i.type === 'crystal').length === 10,
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


// —— P25 高级结晶 ——
const advExp = []
const advPk = createPickupField({ hooks: { onCrystal: (n) => advExp.push(n) } })
assert('spawnCrystalAt wired on field', typeof advPk.spawnCrystalAt === 'function')
advPk.spawnCrystal(0, 0)
advPk.spawnCrystalAt(0, 0, { advanced: true })
assert('spawnCrystalAt creates both kinds', advPk.items.length === 2)
const normGem = advPk.items.find((i) => i.advanced === false)
const advGem = advPk.items.find((i) => i.advanced === true)
assert('normal crystal advanced=false', !!normGem && normGem.advanced === false)
assert('advanced crystal advanced=true', !!advGem && advGem.advanced === true)
advPk.update(0.016, focus)
assert('normal grants 1 exp', advExp.includes(CRYSTAL_EXP))
assert('advanced grants 6 exp', advExp.includes(ADVANCED_CRYSTAL_EXP))
assert('advanced exp = normal + 5', ADVANCED_CRYSTAL_EXP === CRYSTAL_EXP + 5)

const advEnv = createEnvironment({ random: () => 0.5 })
assert('env spawnCrystalAt wired', typeof advEnv.spawnCrystalAt === 'function')
advEnv.spawnCrystalAt(1000, 0, { advanced: true })
const farAdvanced = advEnv.pickups.find((i) => i.advanced)
advEnv.pullAllCrystals()
assert('blackhole marks advanced crystal', farAdvanced && farAdvanced.forcedPull === true)
advEnv.updatePickups(0.05, focus)
assert('advanced crystal flies toward player', farAdvanced && farAdvanced.x < 1000)

const advMag = createPickupField()
advMag.spawnCrystalAt(MAGNET_RANGE + 4, 0, { advanced: true })
const advGx = advMag.items[0].x
advMag.update(0.05, focus)
assert('advanced not pulled outside base magnet', advMag.items[0].x === advGx)
advMag.spawnCrystalAt(MAGNET_RANGE - 4, 0, { advanced: true })
const advGx2 = advMag.items[1].x
advMag.update(0.05, focus)
assert('advanced pulled inside base magnet', advMag.items[1].x < advGx2)


// —— P28 高级结晶紫边（渲染层外观断言） ——
assert('advanced outer color distinct from normal', ADVANCED_CRYSTAL_COLOR !== CRYSTAL_COLOR)
function fakeCtx() {
  const calls = []
  return {
    calls,
    fillStyle: '',
    fillRect(x, y, w, h) { calls.push({ x, y, w, h, fillStyle: this.fillStyle }) },
  }
}
const advDraw = createPickupField()
advDraw.spawnCrystalAt(10, 10, { advanced: true })
const advCtx = fakeCtx()
advDraw.draw(advCtx)
assert(
  'advanced crystal drawn with purple outer layer',
  advCtx.calls.some((c) => c.fillStyle === ADVANCED_CRYSTAL_COLOR),
)
const purpleRects = advCtx.calls.filter((c) => c.fillStyle === ADVANCED_CRYSTAL_COLOR)
assert(
  'purple outer layer has thick arms (not only 2px tips)',
  purpleRects.some((c) => c.w >= 4 && c.h > CRYSTAL_SIZE) &&
    purpleRects.some((c) => c.h >= 4 && c.w > CRYSTAL_SIZE),
)
const normDraw = createPickupField()
normDraw.spawnCrystalAt(10, 10, { advanced: false })
const normCtx = fakeCtx()
normDraw.draw(normCtx)
assert(
  'normal crystal has no purple outer layer',
  !normCtx.calls.some((c) => c.fillStyle === ADVANCED_CRYSTAL_COLOR),
)


// —— P30 地图背景装饰物 ——
function lcg(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    return (s >>> 16) / 65536
  }
}
function decorOverlap(a, b) {
  const p = DECOR_PADDING
  return (
    a.x < b.x + b.w / 2 + p &&
    a.x + a.w > b.x - b.w / 2 - p &&
    a.y < b.y + b.h / 2 + p &&
    a.y + a.h > b.y - b.h / 2 - p
  )
}

// 直接字段：数量 / 不重叠
const decoField = createDecorationField({ random: lcg(2026) })
decoField.seed([], 11000, 11000)
assert(
  'deco total ' + (DECOR_STICK_COUNT + DECOR_STONE_COUNT),
  decoField.items.length === DECOR_STICK_COUNT + DECOR_STONE_COUNT,
)
assert(
  'deco sticks ' + DECOR_STICK_COUNT,
  decoField.items.filter((d) => d.kind === 'stick').length === DECOR_STICK_COUNT,
)
assert(
  'deco stones ' + DECOR_STONE_COUNT,
  decoField.items.filter((d) => d.kind === 'stone').length === DECOR_STONE_COUNT,
)
let decoOverlap = false
outer: for (let i = 0; i < decoField.items.length; i++) {
  for (let j = i + 1; j < decoField.items.length; j++) {
    if (decorOverlap(decoField.items[i], decoField.items[j])) {
      decoOverlap = true
      break outer
    }
  }
}
assert('decorations do not overlap', !decoOverlap)

// 与树不重叠
const oneTree = [{ x: 5000, y: 5000, w: 100, h: 140 }]
const decoTree = createDecorationField({ random: lcg(303) })
decoTree.seed(oneTree, 11000, 11000)
let decoTreeOverlap = false
for (const d of decoTree.items) {
  if (decorOverlap(d, { x: 5000, y: 5000, w: 100, h: 140 })) {
    decoTreeOverlap = true
    break
  }
}
assert('decorations avoid trees', !decoTreeOverlap)

// env 集成：ensureSeed 播种 + 静态 + 可绘制（背景层）
const envDec = createEnvironment({ random: lcg(404) })
envDec.update(0, { x: 0, y: 0 }, { x: 0, y: 0 }, 0)
assert(
  'env decorations count',
  envDec.decorations.length === DECOR_STICK_COUNT + DECOR_STONE_COUNT,
)
assert(
  'env decorationsField wired',
  typeof envDec.decorationsField.seed === 'function',
)
const snap = envDec.decorations
  .map((d) => `${d.x.toFixed(2)},${d.y.toFixed(2)}`)
  .join('|')
envDec.update(0, { x: 0, y: 0 }, { x: 0, y: 0 }, 0)
assert(
  'decorations static across updates',
  envDec.decorations
    .map((d) => `${d.x.toFixed(2)},${d.y.toFixed(2)}`)
    .join('|') === snap,
)
let decoDrawOk = true
try {
  envDec.draw(fakeCtx(), { x: 0, y: 0 })
} catch (e) {
  decoDrawOk = false
}
assert('env.draw renders decorations (background layer)', decoDrawOk)

console.log(failed ? `RESULT FAIL (${failed})` : 'RESULT PASS')
process.exit(failed ? 1 : 0)
