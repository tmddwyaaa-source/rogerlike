/**
 * M4 自测。运行：node src/game/player/selftest.mjs
 */
import { BODY, WORLD_WIDTH, WORLD_HEIGHT } from '../constants.js'
import {
  ARMOR_OUTLINE,
  CHAR_NAME,
  HP_MAX,
  LEVELUP_LIFE,
  LEVELUP_SRC,
  LEVELUP_STAGGER,
  PLAYER_SPEED,
  PLAYER_SPEED_UNITS,
  UNLOCK_BASE_SEC,
  UNLOCK_PER_LAYER_SEC,
  UNLOCK_PULSE_INTERVAL_SEC,
  UNLOCK_RADIUS,
  UNLOCK_RADIUS_UNITS,
  UNLOCK_RING_COLOR,
  UNLOCK_RING_LIFE_SEC,
  unlockDurationFor,
  unlockRingAlpha,
  unlockRingProgress,
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
  DMG_CRIT_BASE_HOLD,
  DMG_CRIT_COLOR,
  DMG_CRIT_ROLL,
  DMG_LIFE,
  DMG_TILE,
  dmgDisplayValue,
  dmgOutlineKind,
  drawDamageNums,
  getDamageNums,
  resetDamageNums,
  spawnDamageNum,
  spawnHealNum as spawnHealFromRender,
  updateDamageNums,
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

// —— P25 三娃护甲 ——
assert('armor default 0', player.armor === 0 && player.getArmor() === 0)
const armorPlayer = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
assert('getArmor fn exported', typeof armorPlayer.getArmor === 'function' && typeof armorPlayer.addArmor === 'function')
assert('armor 0 to start', armorPlayer.armor === 0)
assert('addArmor +1', armorPlayer.addArmor() === 1 && armorPlayer.armor === 1)
const armorHp0 = armorPlayer.hp
armorPlayer.invuln = 0
assert('armor blocks damage no hp loss', armorPlayer.takeDamage(1) === false && armorPlayer.hp === armorHp0 && armorPlayer.armor === 0)
armorPlayer.addArmor(3)
assert('addArmor stacks 3', armorPlayer.armor === 3)
armorPlayer.invuln = 0
armorPlayer.takeDamage(1)
assert('armor consumes 1 layer', armorPlayer.armor === 2 && armorPlayer.hp === armorHp0)
armorPlayer.invuln = 0
armorPlayer.takeDamage(1)
assert('armor consumes 2nd layer', armorPlayer.armor === 1 && armorPlayer.hp === armorHp0)
armorPlayer.invuln = 0
armorPlayer.takeDamage(1)
assert('armor infinite stack consumes all', armorPlayer.armor === 0 && armorPlayer.hp === armorHp0)
let armorHurt = 0
const armorListener = createPlayer({
  keys: { w: false, a: false, s: false, d: false },
  onHurt: () => { armorHurt += 1 },
})
armorListener.armor = 1
armorListener.invuln = 0
assert('armor block no onHurt', armorListener.takeDamage(1) === false && armorHurt === 0 && armorListener.armor === 0 && armorListener.hp === 3)
assert('ARMOR_OUTLINE 黄边', ARMOR_OUTLINE === '#e0b84a')
// P27：护盾视觉改为阴影素材描黄（去矩形），draw 不再用 fillRect 画边框矩形；带甲 draw 不抛错。
const armored = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
armored.armor = 1
armored.invuln = 0
let armorDrawOk = true
try {
  armored.draw({
    fillRect() {},
    fillStyle: '',
    globalAlpha: 1,
    beginPath() {},
    arc() {},
    stroke() {},
  })
} catch {
  armorDrawOk = false
}
assert('armor draw no throw / armor intact', armorDrawOk && armored.armor === 1 && armored.getArmor() === 1)

// —— P25 六娃失锁脉冲（角色侧） ——
assert('unlock base 1.0', UNLOCK_BASE_SEC === 1.0)
assert('unlock per layer 0.5', UNLOCK_PER_LAYER_SEC === 0.5)
assert('unlock interval 10', UNLOCK_PULSE_INTERVAL_SEC === 10)
assert('unlock radius 3 body', UNLOCK_RADIUS_UNITS === 3 && UNLOCK_RADIUS === 3 * BODY)
assert('unlockDurationFor 0', unlockDurationFor(0) === 1.0)
assert('unlockDurationFor 1', unlockDurationFor(1) === 1.5)
assert('unlockDurationFor 2', unlockDurationFor(2) === 2.0)
assert('unlockDurationFor floor neg', unlockDurationFor(-3) === 1.0)
const unlockPlayer = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
assert('unlockLevel default 0', unlockPlayer.unlockLevel === 0)
assert('addUnlockLevel +1', unlockPlayer.addUnlockLevel() === 1 && unlockPlayer.unlockLevel === 1)
assert('currentUnlockDuration 1 layer', unlockPlayer.currentUnlockDuration() === 1.5)
assert('setUnlockLevel 2', unlockPlayer.setUnlockLevel(2) === 2 && unlockPlayer.unlockLevel === 2)
assert('currentUnlockDuration 2 layers', unlockPlayer.currentUnlockDuration() === 2.0)
const pulsePlayer = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
pulsePlayer.setUnlockLevel(1)
const near = { x: pulsePlayer.x + UNLOCK_RADIUS - 2, y: pulsePlayer.y, hp: 10 }
const far = { x: pulsePlayer.x + UNLOCK_RADIUS + 5, y: pulsePlayer.y, hp: 10 }
const applied = pulsePlayer.applyUnlockPulse([near, far])
assert('pulse marks near only', applied === 1 && (near.unlockT ?? 0) > 0 && far.unlockT == null)
assert('isTargetBlind / isEnemyUnlocked true/false', pulsePlayer.isTargetBlind(near) === true && pulsePlayer.isEnemyUnlocked(near) === true && pulsePlayer.isTargetBlind(far) === false && pulsePlayer.isEnemyUnlocked(far) === false)
assert('unlockRemaining', pulsePlayer.unlockRemaining(near) > 0 && pulsePlayer.unlockRemaining(far) === 0)
// 周期脉冲：满 10 秒自动触发
let pulseHook = 0
const list = [near, far]
const periodic = createPlayer({
  keys: { w: false, a: false, s: false, d: false },
  random: () => 0.5,
  getTargets: () => list,
  onUnlockPulse: () => { pulseHook += 1 },
})
periodic.setUnlockLevel(1)
periodic.update(UNLOCK_PULSE_INTERVAL_SEC - 0.1)
assert('no pulse before interval', pulseHook === 0)
periodic.update(0.2)
assert('pulse fires at interval', pulseHook >= 1 && (near.unlockT ?? 0) > 0 && periodic.isTargetBlind(near) === true && periodic.isEnemyUnlocked(near) === true)
// M6/enemies 负责衰减 unlockT；M4 只写不衰减（模拟敌人侧消费）
near.unlockT = 0
assert('unlock expires via unlockT=0', periodic.isTargetBlind(near) === false && periodic.isEnemyUnlocked(near) === false && periodic.unlockRemaining(near) === 0)
near.unlockT = 0.3
assert('unlockRemaining reads countdown', Math.abs(periodic.unlockRemaining(near) - 0.3) < 1e-9)
// P27 六娃扩散圈：#3F48CC，每次脉冲生成，越近边缘越淡、不超范围。
assert('unlock ring color #3F48CC', UNLOCK_RING_COLOR === '#3F48CC')
assert('unlock ring life >0', UNLOCK_RING_LIFE_SEC > 0)
assert('pulse spawns ring', periodic.unlockRings.length >= 1 && periodic.unlockRings[0].r === UNLOCK_RADIUS && periodic.unlockRings[0].dur === UNLOCK_RING_LIFE_SEC)
const sampleRing = periodic.unlockRings[0]
assert('ring progress bounds', unlockRingProgress({ t: 0, dur: 1 }) === 0 && unlockRingProgress({ t: 0.5, dur: 1 }) === 0.5 && unlockRingProgress({ t: 2, dur: 1 }) === 1)
assert('ring alpha fades to edge', unlockRingAlpha({ t: 0, dur: 1 }) === 1 && unlockRingAlpha({ t: 1, dur: 1 }) === 0)
sampleRing.t = UNLOCK_RING_LIFE_SEC
periodic.update(0.01)
assert('ring expires', periodic.unlockRings.length === 0)

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

// —— P28 B3 伤害数字：实际值 + 暴击动画（非暴击 → ×倍率红字 → 滚动成实际） ——
resetDamageNums()
const critIt = spawnDamageNum(0, 0, 30, 'crit', { base: 20, crit: true, critMul: 1.5, damage: 30 })
assert('crit flagged', critIt.crit === true && critIt.base === 20 && critIt.critMul === 1.5)
assert('crit life = base+roll+life', critIt.life === DMG_CRIT_BASE_HOLD + DMG_CRIT_ROLL + DMG_LIFE)
assert('crit shows base first', dmgDisplayValue(critIt) === 20)
assert('crit kind by base', critIt.kind === 'none')
updateDamageNums(DMG_CRIT_BASE_HOLD + 0.01)
assert('crit rolls after hold', critIt.phase === 'roll' && dmgDisplayValue(critIt) < 30)
updateDamageNums(DMG_CRIT_ROLL + 0.01)
assert('crit reaches actual', dmgDisplayValue(critIt) === 30)
assert('crit still alive + red', critIt.life > 0 && DMG_CRIT_COLOR === '#c42b2b')
resetDamageNums()
const norm = spawnDamageNum(0, 0, 20)
assert('non-crit shows actual', norm.crit === false && dmgDisplayValue(norm) === 20)
resetDamageNums()
const tagTexts = []
spawnDamageNum(0, 0, 30, 'c1', { base: 20, crit: true, critMul: 1.5, damage: 30 })
const drawnCrit = drawDamageNums({
  drawImage() {},
  fillRect() {},
  fillStyle: '',
  globalAlpha: 1,
  fillText(t) { tagTexts.push(t) },
  font: '',
  textAlign: '',
  textBaseline: '',
})
assert('crit tag ×倍率 rendered', drawnCrit > 0 && tagTexts.some((t) => t.includes('1.5')))
resetDamageNums()

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
