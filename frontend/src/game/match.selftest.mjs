/**
 * M9 接线冒烟（无浏览器）：模块可装配 + 一帧 update 不抛错。
 * 运行：node src/game/match.selftest.mjs
 */
import { readFileSync } from 'node:fs'
import { createCombat } from './combat/index.js'
import { BODY, VIEW_HEIGHT, VIEW_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from './constants.js'
import { createEnemies } from './enemies/index.js'
import { createPlayer } from './player/index.js'
import { createEnvironment } from './world/index.js'
import { LOAD_GROUPS, vacuumAllCrystals } from './match.js'
import { applyUpgrade, createMatchUi } from '../ui/index.js'

let failed = 0
function assert(name, cond) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

const ui = createMatchUi()
ui.start('1')
const player = createPlayer({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 })
const camera = {
  x: player.x - VIEW_WIDTH / 2,
  y: player.y - VIEW_HEIGHT / 2,
}

let exp = 0
let kills = 0
const env = createEnvironment({
  hooks: {
    onCrystal: () => {
      exp += 1
    },
    onFruit: (n) => player.heal(n),
  },
})
const foes = createEnemies({
  player,
  random: () => 0.5,
  hooks: {
    spawnCrystal: (x, y) => env.spawnCrystal(x, y),
    onKill: () => {
      kills += 1
    },
  },
})
const combat = createCombat({
  player,
  targets: foes.targets,
  hooks: { hitWorld: (x, y, dmg, r) => env.hitAt(x, y, dmg, r) },
})

foes.spawnCreepAt(player.x + 40, player.y, 'regular')
assert('targets has creep', foes.targets.length >= 1)

player.lookAt(player.x + 40, player.y)
assert('fire ok', combat.tryFire() === true)
for (let i = 0; i < 40; i++) combat.update(0.016)
assert('creep took damage or dead', foes.creeps().every((c) => c.hp < 22) || foes.creeps().length === 0)
foes.update(0.01, player, camera, 0)
kills = 0

const creep = foes.spawnCreepAt(player.x + 20, player.y, 'regular')
creep.takeHit(99)
foes.update(0.01, player, camera, 0)
assert('kill increments', kills === 1)
assert('crystal spawned', env.pickups.some((p) => p.type === 'crystal'))

env.update(0.5, player, camera, 0)
assert('magnet/collect path ok', exp >= 0)

env.seedAround(player.x, player.y, 2)
const tree = env.trees[0]
const before = env.trees.length
const crystalBefore = env.pickups.filter((p) => p.type === 'crystal').length
env.hitAt(tree.x, tree.y, 999)
assert('tree destroy', env.trees.length === before - 1)
const crystalN = env.pickups.filter((p) => p.type === 'crystal').length - crystalBefore
assert('tree drops 3–6 crystals', crystalN >= 3 && crystalN <= 6)

const far = { x: player.x + 400, y: player.y }
env.spawnCrystal(far.x, far.y)
const marked = env.pickups.filter((p) => p.type === 'crystal')
const beforeVac = marked.length
const x0 = marked[marked.length - 1].x
assert('黑洞 apply 飞行', applyUpgrade('blackhole', { env, player }) === true)
assert(
  '黑洞不当帧删光',
  env.pickups.filter((p) => p.type === 'crystal').length === beforeVac,
)
assert('黑洞打上 forcedPull', env.pickups.some((p) => p.type === 'crystal' && p.forcedPull))
vacuumAllCrystals(env)
env.updatePickups(0.1, player)
const pulled = env.pickups.find((p) => p.type === 'crystal' && p.forcedPull)
assert('黑洞结晶在飞', pulled && pulled.x < x0)

player.update(0.016)
env.collideSolid(player)
ui.tick(0.016)
assert('session time', ui.session.elapsedSec > 0)
assert('world size', WORLD_WIDTH === BODY * 500 && WORLD_HEIGHT === BODY * 500)

const matchSrc = readFileSync(new URL('./match.js', import.meta.url), 'utf8')
const appSrc = readFileSync(new URL('../App.vue', import.meta.url), 'utf8')
const loadingSrc = readFileSync(new URL('../views/LoadingOverlay.vue', import.meta.url), 'utf8')
assert('four real load groups', LOAD_GROUPS.length === 4 && LOAD_GROUPS.includes('角色与开局特效') && LOAD_GROUPS.includes('跟班'))
assert('load progress reports counts and stage', matchSrc.includes('onLoadProgress') && matchSrc.includes('completed') && matchSrc.includes('total'))
assert(
  'input waits for loaded assets',
  matchSrc.indexOf('await companions.loadAssets()') < matchSrc.lastIndexOf('setInputEnabled(true)'),
)
assert('app blocks keys while loading', appSrc.includes('blockLoadingKeys') && appSrc.includes('LoadingOverlay'))
assert('progress overlay contracts', ['progress', 'stage', 'inset', 'pointer-events'].every((key) => loadingSrc.includes(key)))
assert('transitions freeze without reload', matchSrc.includes('setInputEnabled') && matchSrc.includes('inputEnabled') && appSrc.includes('onFrameTransition'))
assert('frame controls stay above loading', appSrc.includes('@frame-transition') && loadingSrc.includes('loading-overlay--frame'))
assert('no start setLevel', !matchSrc.includes('setLevel'))
assert('crystal queues +1', matchSrc.includes('queueLevelUpFx'))
assert('notifyExp returns gained', appSrc.includes('return getShell()?.notifyExp'))
assert(
  'crystal levelup freezes before tick',
  /env\.update[\s\S]*phase\(\) === 'levelup'[\s\S]*tryBeginUpgradeOffer[\s\S]*return[\s\S]*shell\.tick/.test(
    matchSrc,
  ),
)
assert(
  'pause still steps +1',
  matchSrc.includes('stepLevelUpFx'),
)
assert('live getSettings first', /readSettings[\s\S]*getSettings/.test(matchSrc))
assert('levelup offer after fx', matchSrc.includes('beginUpgradeOffer') && matchSrc.includes('levelUpFxBusy'))
assert('upgrade/levelup still flies pickups', matchSrc.includes('updatePickups'))
assert('upgrade collect false', matchSrc.includes('collect: false'))
assert('pause clears movement keys', matchSrc.includes('clearMovementKeys'))
assert('does not splice vacuum', !matchSrc.includes('items.splice'))
assert(
  'companions wired',
  matchSrc.includes("from './companions/index.js'") &&
    matchSrc.includes('createCompanions') &&
    matchSrc.includes('companions.update') &&
    matchSrc.includes('companions.draw') &&
    matchSrc.includes('getKills') &&
    matchSrc.includes('hitSlashAt'),
)
assert('begin passes charId', matchSrc.includes('charId'))
assert('waits deathAnimDone', matchSrc.includes('deathAnimDone'))
assert('draws damage nums', matchSrc.includes('drawDamageNums') && matchSrc.includes('updateDamageNums'))
assert('onDamage wired', matchSrc.includes('onDamage'))
assert('spawnDamageNum wired', matchSrc.includes('spawnDamageNum'))
assert('onHeal wired', matchSrc.includes('onHeal') && matchSrc.includes('spawnHealNum'))
assert('hpGrowthAdd wired', matchSrc.includes('getHpGrowthAdd') && matchSrc.includes("=== '2'"))
assert('spawnCrystalBurst wired', matchSrc.includes('spawnCrystalBurst'))
assert(
  'ice kill addBossKill',
  matchSrc.includes("ent?.kind === 'ice_man'") && matchSrc.includes('addBossKill'),
)
assert('no queueObjectiveFx on begin', !matchSrc.includes('queueObjectiveFx'))
assert('dummy wired', matchSrc.includes('setDummyEnabled') && matchSrc.includes('testDummy'))
assert('test elapsed on begin', matchSrc.includes('setElapsedSec') && matchSrc.includes('testElapsedSec'))
const shellSrc = readFileSync(new URL('../views/GameShell.vue', import.meta.url), 'utf8')
assert(
  'slider elapsed gated',
  shellSrc.includes('elapsedChanged') && shellSrc.includes('settings.testMode'),
)

let gobCalls = 0
let dmgBonus = 0
let eggCalls = 0
let batCalls = 0
assert(
  'goblin applyUpgrade + bonus',
  applyUpgrade('goblin', {
    companions: {
      addGoblin() { gobCalls += 1 },
      addDamageBonus(n) { dmgBonus += n },
    },
  }) === true && gobCalls === 1 && dmgBonus === 10,
)
assert(
  'strange_egg applyUpgrade',
  applyUpgrade('strange_egg', {
    companions: {
      addEgg() { eggCalls += 1 },
    },
  }) === true && eggCalls === 1,
)
assert(
  'bat applyUpgrade',
  applyUpgrade('bat', {
    companions: {
      addBat() { batCalls += 1 },
    },
  }) === true && batCalls === 1,
)

ui.session.addExp(15, { combat })
assert('match 升级先进 levelup', ui.session.phase === 'levelup')
player.queueLevelUpFx(1)
assert('fx busy blocks offer', player.levelUpFxBusy() === true)
assert('no offer yet', ui.session.offer.length === 0)

console.log(failed === 0 ? '\nRESULT PASS' : `\nRESULT FAIL (${failed})`)
process.exit(failed === 0 ? 0 : 1)
