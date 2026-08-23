/**
 * M4 自测。运行：node src/game/player/selftest.mjs
 */
import { BODY, WORLD_WIDTH, WORLD_HEIGHT } from '../constants.js'
import {
  CHAR_NAME,
  HP_MAX,
  LEVELUP_LIFE,
  LEVELUP_SRC,
  LEVELUP_STAGGER,
  PLAYER_SPEED,
  PLAYER_SPEED_UNITS,
  attachPlayer,
  applyMovementCode,
  clearMovementKeys,
  createPlayer,
  deathAnimDone,
  facingFromAngle,
  hasLevelUpFx,
  hasObjectiveFx,
  levelUpFxBusy,
  levelUpFxRemaining,
  OBJECTIVE_LIFE,
  OBJECTIVE_TEXT,
  queueLevelUpFx,
  queueObjectiveFx,
  resolveAnim,
  spawnHealNum,
} from './index.js'
import { STICKMAN_H, STICKMAN_W, drawStickman, WALK_FRAME_COUNT } from '../render/stickman.js'
import { FRAME_H, FRAME_W, SHEET_FRAMES, SPRITE_FOOT_Y, drawRanger } from '../render/ranger.js'
import {
  DMG_ADVANCE,
  DMG_TILE,
  dmgOutlineKind,
  getDamageNums,
  resetDamageNums,
  spawnDamageNum,
  spawnHealNum as spawnHealFromRender,
} from '../render/dmgnum.js'

let failed = 0
function assert(name, cond) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

assert('CHAR_NAME 游侠', CHAR_NAME === '游侠')
assert('size 11×22', STICKMAN_W === 11 && STICKMAN_H === 22 && BODY === 22)
assert('walk frames ≥5', WALK_FRAME_COUNT >= 5)
assert('ranger cell 32×32', FRAME_W === 32 && FRAME_H === 32)
assert('sprite foot row', SPRITE_FOOT_Y === 21)
assert('sheets D/S/U walk=6 idle=4', SHEET_FRAMES.Walk === 6 && SHEET_FRAMES.Idle === 4)
assert('speed units 1.2', PLAYER_SPEED_UNITS === 1.2 && PLAYER_SPEED === 96)

const keys = { w: false, a: false, s: false, d: false }
const player = createPlayer({ keys, random: () => 0.5 })
assert('name 游侠', player.name === '游侠')
assert('default charId ranger', player.charId === 'ranger')
assert('hp 3', player.hp === HP_MAX)
assert('charging default false', player.charging === false)
assert('facingDir exposed', typeof player.facingDir === 'string')
assert('setCharging', typeof player.setCharging === 'function')

keys.w = true
const y0 = player.y
player.update(0.05)
assert('W up', player.y < y0)
assert('moving anim', player.moving && player.walkFrame > 0)
assert('walk anim name', player.anim === 'Walk')
keys.w = false
player.update(0.05)
assert('idle anim', player.anim === 'Idle')

assert('applyMovementCode KeyW', applyMovementCode(keys, 'KeyW', true) && keys.w === true)
applyMovementCode(keys, 'KeyW', false)
assert('code keyup clears W', keys.w === false)
applyMovementCode(keys, 'KeyA', true)
applyMovementCode(keys, 'KeyS', true)
applyMovementCode(keys, 'KeyD', true)
player.clearMovementKeys()
assert(
  'clearMovementKeys all up',
  keys.w === false && keys.a === false && keys.s === false && keys.d === false,
)
applyMovementCode(keys, 'KeyW', true)
const yStuck = player.y
player.update(0.05)
assert('held W still moves', player.y < yStuck)
clearMovementKeys(player)
player.update(0.05)
assert('cleared stops', player.moving === false && player.anim === 'Idle')

player.lookAt(player.x + 20, player.y)
assert('face right → S flip（原图朝左）', player.facingDir === 'S' && player.flipX === true)
player.lookAt(player.x - 20, player.y)
assert('face left → S 不翻转', player.facingDir === 'S' && player.flipX === false)
player.lookAt(player.x, player.y + 20)
assert('face down → D', player.facingDir === 'D')
player.lookAt(player.x, player.y - 20)
assert('face up → U', player.facingDir === 'U')

const right = facingFromAngle(0)
const down = facingFromAngle(Math.PI / 2)
const left = facingFromAngle(Math.PI)
const up = facingFromAngle(-Math.PI / 2)
assert(
  'angle map S 右翻左不翻',
  right.facingDir === 'S' &&
    right.flipX === true &&
    down.facingDir === 'D' &&
    left.facingDir === 'S' &&
    left.flipX === false &&
    up.facingDir === 'U',
)

player.setCharging(true)
player.update(0.01)
assert('charging → Attack', resolveAnim(player) === 'Attack' && player.anim === 'Attack')
player.setCharging(false)

player.godMode = true
player.hp = 1
assert('god floor', player.takeDamage(1) === false && player.hp === 1)
player.godMode = false
player.invuln = 0
player.hp = 2
assert('damage', player.takeDamage(1) === true && player.hp === 1)
assert('hurtT armed', player.hurtT > 0 && resolveAnim(player) === 'Hurt')
player.update(0.01)
assert('hurt anim', player.anim === 'Hurt')

let hurtCalls = 0
const hurtListener = createPlayer({
  keys: { w: false, a: false, s: false, d: false },
  onHurt: () => {
    hurtCalls += 1
  },
})
assert('onHurt real deduct fires once', hurtListener.takeDamage(1) === true && hurtCalls === 1)
assert('onHurt invuln blocks', hurtListener.takeDamage(1) === false && hurtCalls === 1)
hurtListener.invuln = 0
hurtListener.hp = 1
assert(
  'onHurt death blow fires',
  hurtListener.takeDamage(1) === true && hurtListener.hp === 0 && hurtCalls === 2,
)
assert('onHurt dead no refire', hurtListener.takeDamage(1) === false && hurtCalls === 2)

let godCalls = 0
const godListener = createPlayer({
  keys: { w: false, a: false, s: false, d: false },
  godMode: true,
  onHurt: () => {
    godCalls += 1
  },
})
assert('onHurt n<=0 no call', godListener.takeDamage(0) === false && godCalls === 0)
assert(
  'onHurt god real deduct fires',
  godListener.takeDamage(1) === true && godListener.hp === 2 && godCalls === 1,
)
godListener.hp = 1
assert('onHurt god floor no call', godListener.takeDamage(1) === false && godCalls === 1)

assert('ranger skip without sheets', drawRanger({ fillRect() {}, fillStyle: '' }, player) === false)

const calls = []
drawStickman(
  {
    fillRect(x, y, w, h) {
      calls.push({ x, y, w, h })
    },
    fillStyle: '',
  },
  { x: 100, y: 200, facing: 0, invuln: 0, walkFrame: 2, moving: true },
)
assert('stickman fallback pixels', calls.length > 0)

const engine = {
  camera: { x: 0, y: 0 },
  getScale: () => 1,
  setFollowTarget() {},
}
assert('attach', attachPlayer(engine).x === WORLD_WIDTH / 2)
assert('world', WORLD_HEIGHT === BODY * 500)
assert('loadAssets fn', typeof player.loadAssets === 'function')

assert('LEVELUP_SRC', LEVELUP_SRC === '/assets/fx/levelup.png')
assert('queueLevelUpFx exported', typeof queueLevelUpFx === 'function')
assert('queue 0', player.queueLevelUpFx(0) === 0 && player.levelUpFx.length === 0)
assert('idle not busy', player.hasLevelUpFx() === false && player.levelUpFxBusy() === false)
assert('idle remaining 0', player.levelUpFxRemaining() === 0 && hasLevelUpFx(player) === false)
const spawned = player.queueLevelUpFx(3)
assert('queue 3 → 3 pops not +3', spawned === 3 && player.levelUpFx.length === 3)
assert('busy while queued', player.levelUpFxBusy() === true && hasLevelUpFx(player) === true)
assert('remaining > 0', player.levelUpFxRemaining() > LEVELUP_LIFE)
assert(
  'staggered delays',
  player.levelUpFx[0].delay === 0 &&
    Math.abs(player.levelUpFx[1].delay - LEVELUP_STAGGER) < 1e-9 &&
    Math.abs(player.levelUpFx[2].delay - LEVELUP_STAGGER * 2) < 1e-9,
)
player.update(0.01)
assert('first +1 unlocked', player.levelUpFx[0].x != null && player.levelUpFx[1].x == null)

const fxOnly = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
fxOnly.hp = 0
fxOnly.queueLevelUpFx(1)
fxOnly.update(0.01)
const plusPixels = []
fxOnly.draw({
  fillRect(x, y, w, h) {
    plusPixels.push({ x, y, w, h })
  },
  fillStyle: '',
  globalAlpha: 1,
})
assert('program +1 pixels', plusPixels.length > 0)
player.update(LEVELUP_LIFE + LEVELUP_STAGGER * 2 + 0.05)
assert('fx expired', player.levelUpFx.length === 0)
assert('busy false after expire', player.levelUpFxBusy() === false && levelUpFxBusy(player) === false)
assert('remaining 0 after expire', player.levelUpFxRemaining() === 0 && levelUpFxRemaining(player) === 0)

assert('mage name', createPlayer({ charId: 'mage' }).name === '法师')
assert('mage 2 hp', createPlayer({ charId: 'mage' }).hp === 2 && createPlayer({ charId: 'mage' }).hpMax === 2)
assert('warrior name', createPlayer({ charId: 'warrior' }).name === '战士')
assert('warrior 4 hp', createPlayer({ charId: 'warrior' }).hp === 4 && createPlayer({ charId: 'warrior' }).hpMax === 4)
assert('ranger 3 hp', createPlayer({ charId: 'ranger' }).hp === 3)
assert('bad charId → ranger', createPlayer({ charId: 'nope' }).charId === 'ranger')
assert('Death 8 frames', SHEET_FRAMES.Death === 8)

const dying = createPlayer({ keys: { w: false, a: false, s: false, d: false } })
dying.hp = 0
dying.update(0.01)
assert('hp0 → Death', dying.anim === 'Death')
dying.deathT = 0.5
assert('death 0.5 not done', dying.deathAnimDone() === false && deathAnimDone(dying) === false)
dying.deathT = 1.0
assert('death 1.0 done', dying.deathAnimDone() === true)

const empty = createPlayer()
assert('empty hp start', empty.hp === 3 && empty.hpMax === 3)
empty.addEmptyHpMax()
assert('addEmptyHpMax', empty.hpMax === 4 && empty.hp === 3)

resetDamageNums()
spawnDamageNum(100, 200, 20, 'a')
spawnDamageNum(300, 200, 7, 'b')
assert('dmg queue 20', getDamageNums().length === 2)
assert('units not merged', getDamageNums()[0].amount === 20 && getDamageNums()[1].amount === 7)
spawnDamageNum(100, 200, 5, 'a')
assert('same unit stagger', getDamageNums().length === 3 && getDamageNums()[2].y < getDamageNums()[0].y)
assert('advance 12–13', DMG_ADVANCE >= 12 && DMG_ADVANCE <= 13 && DMG_ADVANCE < DMG_TILE)
assert('outline 99 none', dmgOutlineKind(99) === 'none')
assert('outline 100 yellow', dmgOutlineKind(100) === 'yellow' && dmgOutlineKind(199) === 'yellow')
assert('outline 200 red', dmgOutlineKind(200) === 'red')
resetDamageNums()
assert('spawn 100 yellow path', spawnDamageNum(0, 0, 100).kind === 'yellow')
assert('spawn 199 yellow path', spawnDamageNum(0, 0, 199).kind === 'yellow')
assert('spawn 200 red path', spawnDamageNum(0, 0, 200).kind === 'red')
resetDamageNums()
assert('heal fn exported', typeof spawnHealNum === 'function' && spawnHealNum === spawnHealFromRender)
assert('heal 20 green', spawnHealNum(0, 0, 20, 'h').kind === 'green')
assert('heal 200 still green', spawnHealNum(0, 0, 200).kind === 'green')
resetDamageNums()
assert('damage 20 still none', spawnDamageNum(0, 0, 20).kind === 'none')
assert('damage 100 still yellow', spawnDamageNum(0, 0, 100).kind === 'yellow')

assert('OBJECTIVE_TEXT kept', OBJECTIVE_LIFE === 5 && OBJECTIVE_TEXT === '目标：活够10分钟')
assert('queueObjectiveFx exported', typeof queueObjectiveFx === 'function')
const fresh = createPlayer({ keys: { w: false, a: false, s: false, d: false } })
assert('createPlayer does not start objective', fresh.objectiveT === 0 && hasObjectiveFx(fresh) === false)
fresh.queueObjectiveFx()
assert('queue is no-op', fresh.objectiveT === 0 && hasObjectiveFx(fresh) === false)
const objTexts = []
fresh.draw({
  fillRect() {},
  fillStyle: '',
  globalAlpha: 1,
  fillText(t) {
    objTexts.push(t)
  },
})
assert('no in-world objective text', !objTexts.includes(OBJECTIVE_TEXT))
const mid = createPlayer({ keys: { w: false, a: false, s: false, d: false } })
mid.objectiveT = 5
mid.resetObjectiveFx()
assert('reset clears', mid.objectiveT === 0)
const die = createPlayer({ keys: { w: false, a: false, s: false, d: false } })
die.objectiveT = 5
die.hp = 0
die.update(0.01)
assert('death clears objective', die.objectiveT === 0)

console.log(failed === 0 ? '\nRESULT PASS' : `\nRESULT FAIL (${failed})`)
process.exit(failed === 0 ? 0 : 1)
