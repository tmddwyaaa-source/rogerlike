/**
 * M4 自测。运行：node src/game/player/selftest.mjs
 */
import { readFileSync } from 'node:fs'
import { BODY, SPEED_PX_PER_UNIT, WORLD_WIDTH, WORLD_HEIGHT } from '../constants.js'
import {
  ARMOR_OUTLINE,
  CHAR_NAME,
  HP_MAX,
  LEVELUP_LIFE,
  LEVELUP_SRC,
  LEVELUP_STAGGER,
  PLAYER_SPEED,
  PLAYER_SPEED_UNITS,
  REVIVE_HEAL_COUNT,
  STEADY_STILL_SEC,
  VAJRA_REOBTAIN_LAYERS,
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
// 只读引用武器攻击间隔，用于断言「0.15s 静止阈值 < 0.48s 攻击间隔」（P42 批次 5 / TASK-034 R1②）。
import { FIRE_INTERVAL } from '../weapons/index.js'

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

// —— P42 批次 2 · 生生不息档 3：受击后限时移速加成（玩家侧，M3） ——
// 增量法：激活时 speed += units × SPEED_PX_PER_UNIT，到期把同一增量原样减回；全程不改 speedUnits。
// 这里用 ?.() 调用：接口未实现时断言直接 FAIL（而不是抛 TypeError 打断整个 selftest）。
const HURT_BUFF_UNITS = 0.2
const HURT_BUFF_SEC = 1.5
assert('applyHurtSpeedBuff exposed', typeof player.applyHurtSpeedBuff === 'function')

const applyBuff = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
const applySpeed0 = applyBuff.speed
applyBuff.applyHurtSpeedBuff?.(HURT_BUFF_UNITS, HURT_BUFF_SEC)
const applyBuffed = applyBuff.speed
assert(
  'hurt speed buff applies',
  SPEED_PX_PER_UNIT === 80 && applyBuffed === applySpeed0 + HURT_BUFF_UNITS * 80,
)
applyBuff.update(HURT_BUFF_SEC)
assert('hurt speed buff expires', applyBuffed > applySpeed0 && applyBuff.speed === applySpeed0)

const refreshBuff = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
const refreshSpeed0 = refreshBuff.speed
refreshBuff.applyHurtSpeedBuff?.(HURT_BUFF_UNITS, HURT_BUFF_SEC)
const refreshOnce = refreshBuff.speed
refreshBuff.update(1.0)
refreshBuff.applyHurtSpeedBuff?.(HURT_BUFF_UNITS, HURT_BUFF_SEC)
assert(
  'hurt speed buff refresh not stacking',
  refreshOnce === refreshSpeed0 + HURT_BUFF_UNITS * 80 &&
    refreshBuff.speed === refreshOnce &&
    refreshBuff.hurtSpeedT === HURT_BUFF_SEC,
)
refreshBuff.update(HURT_BUFF_SEC)
assert('hurt speed buff restored after refresh', refreshOnce > refreshSpeed0 && refreshBuff.speed === refreshSpeed0)

const keepBuff = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
const keepUnits0 = keepBuff.speedUnits
const keepSpeed0 = keepBuff.speed
keepBuff.applyHurtSpeedBuff?.(HURT_BUFF_UNITS, HURT_BUFF_SEC)
const keepEngaged = keepBuff.speed === keepSpeed0 + HURT_BUFF_UNITS * 80
keepBuff.update(0.5)
keepBuff.applyHurtSpeedBuff?.(HURT_BUFF_UNITS, HURT_BUFF_SEC)
keepBuff.update(HURT_BUFF_SEC)
assert(
  'hurt speed buff keeps speedUnits',
  keepUnits0 === PLAYER_SPEED_UNITS &&
    keepBuff.speedUnits === keepUnits0 &&
    keepEngaged &&
    keepBuff.speed === keepSpeed0,
)

const deadBuff = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
deadBuff.hp = 0
const deadSpeed0 = deadBuff.speed
deadBuff.applyHurtSpeedBuff?.(HURT_BUFF_UNITS, HURT_BUFF_SEC)
assert(
  'hurt speed buff dead no-op',
  typeof deadBuff.applyHurtSpeedBuff === 'function' &&
    deadBuff.speed === deadSpeed0 &&
    deadBuff.hurtSpeedT === 0,
)

// —— P42 批次 3 · power「定神」（玩家侧，M3）；批次 5：静止阈值 0.3s → 0.15s ——
// 连续静止 0.15s → 就绪（armed）→ 下一次攻击必暴；移动 / 攻击 / 受伤立即重置，死亡不再就绪。
// 本模块只提供状态与消费接口，**不实现暴击**（战斗侧 TASK-033 在暴击判定前调 consumeSteadyCrit）。
assert('steady still sec 0.15', STEADY_STILL_SEC === 0.15)

const steadyP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
assert(
  'power steady apply',
  typeof steadyP.applyPower === 'function' &&
    steadyP.applyPower('steady') === true &&
    steadyP.applyPower('rapid') === false &&
    steadyP.applyPower('pierce_amp') === false &&
    steadyP.applyPower('sp') === false,
)

const armP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
armP.applyPower?.('steady')
armP.update(0.14)
const armTooEarly = armP.steadyArmed === true
armP.update(0.01)
assert(
  'steady arms after 0.15s still',
  armTooEarly === false && armP.steadyArmed === true && armP.isSteadyArmed?.() === true,
)

const consumeP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
consumeP.applyPower?.('steady')
consumeP.update(0.15)
const consumeFirst = consumeP.consumeSteadyCrit?.() === true
const consumeSecond = consumeP.consumeSteadyCrit?.() === false
// 站着不动也要重新计满 0.15s，不能连吃。
consumeP.update(0.1)
const consumeThird = consumeP.consumeSteadyCrit?.() === false
assert('steady consumed once', consumeFirst && consumeSecond && consumeThird)

// R1②：0.15s < 武器攻击间隔 0.48s ⇒ 一直站着不动时，每次攻击消费掉就绪后，
// 到下一次攻击（0.48s）之前早已重新站满 0.15s —— 连打 3 次每次都能触发。
const repeatP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
repeatP.applyPower?.('steady')
const repeatHits = []
for (let i = 0; i < 3; i++) {
  repeatP.update(FIRE_INTERVAL)
  repeatHits.push(repeatP.consumeSteadyCrit?.() === true)
}
assert(
  'steady re-arms between attacks while standing still',
  STEADY_STILL_SEC < FIRE_INTERVAL && repeatHits.every(Boolean),
)

const moveKeys = { w: false, a: false, s: false, d: false }
const moveP = createPlayer({ keys: moveKeys, random: () => 0.5 })
moveP.applyPower?.('steady')
moveP.update(0.14)
const moveArmedBefore = moveP.steadyArmed === true
moveKeys.w = true
moveP.update(0.01)
moveKeys.w = false
moveP.update(0.1)
assert(
  'steady reset on move',
  moveArmedBefore === false &&
    moveP.steadyArmed === false &&
    // steadyT > 0 是防「恒真空壳」的前置条件：没实现时 steadyT 恒为 0，这条必须 FAIL。
    moveP.steadyT > 0 &&
    moveP.steadyT <= 0.1 + 1e-9 &&
    moveP.consumeSteadyCrit?.() === false,
)

// 2026-09-12 修补（TASK-043 R1）：**只有 WASD 位移输入打断**。
// 蓄力（按住左键，combat 每帧 setCharging(true)）与开火后摇（attackT>0）都**不再**打断 ——
// 之前把这两者算打断，而本作开火必须按住蓄力，于是按左键第一帧就清空就绪（实机：站着也吃不到定神）。
const chargeP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
chargeP.applyPower?.('steady')
chargeP.update(0.1)
chargeP.setCharging(true)
chargeP.update(0.1)
assert(
  'steady not broken by charging',
  chargeP.charging === true && chargeP.steadyArmed === true && chargeP.isSteadyArmed?.() === true,
)

const atkP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
atkP.applyPower?.('steady')
atkP.attackT = 0.5
atkP.update(0.2)
assert('steady not broken by attack', atkP.attackT > 0 && atkP.steadyArmed === true)

// 受击不打断（仍保留原有 invuln / hurtT 逻辑）。
const hurtP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
hurtP.applyPower?.('steady')
hurtP.update(0.15)
const hurtArmedBefore = hurtP.steadyArmed === true
hurtP.invuln = 0
hurtP.takeDamage(1)
assert(
  'steady not broken by hurt',
  hurtArmedBefore &&
    hurtP.hp === 2 &&
    hurtP.invuln > 0 &&
    hurtP.hurtT > 0 &&
    hurtP.steadyArmed === true &&
    hurtP.consumeSteadyCrit?.() === true,
)

// 打断条件只剩位移输入：按 WASD 立即清零，且必须重新站满 0.15s 才再次就绪。
const breakKeys = { w: false, a: false, s: false, d: false }
const breakP = createPlayer({ keys: breakKeys, random: () => 0.5 })
breakP.applyPower?.('steady')
breakP.update(0.15)
const breakArmed = breakP.steadyArmed === true
breakKeys.d = true
breakP.update(0.01)
const breakCleared =
  breakP.steadyArmed === false && breakP.steadyT === 0 && breakP.consumeSteadyCrit?.() === false
breakKeys.d = false
breakP.update(0.14)
const breakStillNotArmed = breakP.steadyArmed === false
breakP.update(0.01)
assert(
  'steady broken by move',
  breakArmed && breakCleared && breakStillNotArmed && breakP.steadyArmed === true,
)

// R1⑥ 真实输入路径（上一版盲区：只测了直接调 API）：不按 WASD、按住左键蓄力 0.5s
// （combat 每帧 setCharging(true)，期间鼠标瞄准改变朝向）→ 仍就绪 → 松手开火那一帧
// consumeSteadyCrit() 返回 true（此时 attackT 已被写入后摇，也不得影响消费）。
const realP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
realP.applyPower?.('steady')
let armedWhileCharging = false
for (let i = 0; i < 25; i++) {
  realP.setCharging(true)
  realP.lookAt(realP.x + 40, realP.y)
  realP.update(0.02)
  if (realP.steadyArmed === true) armedWhileCharging = true
}
realP.setCharging(false)
realP.attackT = 0.2
const realInputCrit = realP.consumeSteadyCrit?.() === true
assert('steady real input path fires crit', armedWhileCharging && realInputCrit)

const coP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
coP.applyPower?.('steady')
coP.applyHurtSpeedBuff?.(HURT_BUFF_UNITS, HURT_BUFF_SEC)
const coSpeed = coP.speed
coP.update(0.3)
assert(
  'steady coexist with timers',
  coP.steadyArmed === true &&
    coP.invuln === 0 &&
    coP.hurtT === 0 &&
    coP.hurtSpeedT > 0 &&
    coP.speed === coSpeed,
)

const deadSteady = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
deadSteady.applyPower?.('steady')
deadSteady.update(0.3)
const deadArmedBefore = deadSteady.steadyArmed === true
deadSteady.hp = 0
deadSteady.update(0.01)
assert(
  'steady dead not armed',
  deadArmedBefore && deadSteady.steadyArmed === false && deadSteady.consumeSteadyCrit?.() === false,
)

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

// TASK-043 R2：暴击「×倍率」标签固定两位小数（1.5 → ×1.50、1.5667 → ×1.57、2.1667 → ×2.17、3.5 → ×3.50）。
const mulTexts = []
spawnDamageNum(0, 0, 30, 'm1', { base: 20, crit: true, critMul: 1.5, damage: 30 })
spawnDamageNum(0, 0, 47, 'm2', { base: 30, crit: true, critMul: 1.5667, damage: 47 })
spawnDamageNum(0, 0, 65, 'm3', { base: 30, crit: true, critMul: 2.1667, damage: 65 })
spawnDamageNum(0, 0, 105, 'm4', { base: 30, crit: true, critMul: 3.5, damage: 105 })
drawDamageNums({
  drawImage() {},
  fillRect() {},
  fillStyle: '',
  globalAlpha: 1,
  fillText(t) { mulTexts.push(t) },
  font: '',
  textAlign: '',
  textBaseline: '',
})
assert(
  'crit tag two decimals',
  mulTexts.includes('\u00d71.50') &&
    mulTexts.includes('\u00d71.57') &&
    mulTexts.includes('\u00d72.17') &&
    mulTexts.includes('\u00d73.50') &&
    mulTexts.every((t) => /^\u00d7\d+\.\d{2}$/.test(t)),
)
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

// —— P42 批次7 · 小金刚「再获得一次」玩家侧（三娃护甲 / 六娃失锁） ——
// 口径：集齐七兄弟后，该兄弟的升级效果按「再获得一次」生效（＝层数 +1），**不是**旧的「效果值 +10%」。
// 开关由 M1 在 match.js 的 syncVajra 里 setVajraComplete；player 自己不读羁绊档位。
const vajraP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
assert(
  'vajra flag default off + api',
  vajraP.getVajraComplete() === false &&
    typeof vajraP.setVajraComplete === 'function' &&
    typeof vajraP.effectiveUnlockLayers === 'function',
)
const armorPlain = vajraP.addArmor(1) // 未集齐：+1 层
vajraP.setVajraComplete(true)
const armorFirst = vajraP.addArmor(1) // 三娃选中：再获得一次 ⇒ +2 层
const armorSecond = vajraP.addArmor(1) // 此后每 N 级再触发：同样 +2 层
assert(
  'vajra reobtain sanwa',
  armorPlain === 1 &&
    armorFirst === 3 &&
    armorSecond === 5 &&
    vajraP.getArmor() === 5 &&
    vajraP.addArmor(0) === 5 &&
    VAJRA_REOBTAIN_LAYERS === 1,
)

const liuwaP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
liuwaP.addUnlockLevel(1)
const liuwaPlain = liuwaP.currentUnlockDuration() // 未集齐：1.0 + 0.5×1 = 1.5
liuwaP.setVajraComplete(true)
const liuwaReobtain = liuwaP.currentUnlockDuration() // 再获得一次：picks+1 ⇒ 1.0 + 0.5×2 = 2.0
liuwaP.addUnlockLevel(1)
const liuwaTwo = liuwaP.currentUnlockDuration() // 2 picks + 1 ⇒ 1.0 + 0.5×3 = 2.5
const pulseTarget = { x: liuwaP.x + 10, y: liuwaP.y, hp: 10 }
liuwaP.applyUnlockPulse([pulseTarget]) // 默认时长也走「picks+1」
const periodicTarget = { x: 0, y: 0, hp: 10 }
const periodicVajra = createPlayer({
  keys: { w: false, a: false, s: false, d: false },
  random: () => 0.5,
  getTargets: () => [periodicTarget],
})
periodicVajra.setUnlockLevel(1)
periodicVajra.setVajraComplete(true)
periodicTarget.x = periodicVajra.x + 10
periodicTarget.y = periodicVajra.y
periodicVajra.update(UNLOCK_PULSE_INTERVAL_SEC + 0.01) // 自动脉冲同样按 picks+1
assert(
  'vajra reobtain liuwa',
  liuwaPlain === 1.5 &&
    liuwaReobtain === 2.0 &&
    liuwaTwo === 2.5 &&
    liuwaP.effectiveUnlockLayers() === 3 &&
    pulseTarget.unlockT === 2.5 &&
    periodicTarget.unlockT === 2.0,
)

// 旧口径「效果值 +10%（加法）」已作废：player 侧不得再出现 ×1.1 / +10% / +0.25s 分支。
// （先去掉注释再扫源码，注释里允许写「旧 +10% 已作废」这类说明。）
const playerSrc = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
const playerCode = playerSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
assert(
  'vajra no more plus10 pct player',
  !/1\.1|\+\s*10\s*%|0\.25|plus10/i.test(playerCode) &&
    vajraP.getArmor() % 1 === 0 && // 护甲仍是整数层（不是 +10% 后的 1.1）
    liuwaReobtain === 2.0, // 六娃是 +0.5s 一层，不是 +10%（1.65 / 1.75）
)

// —— P42 批次7 · 生生不息档 8：受致命伤以 1 血复活（冷却 = 再发生 5 次真实回血） ——
const reviveP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
assert(
  'revive api exposed',
  typeof reviveP.tryRevive === 'function' &&
    typeof reviveP.isReviveReady === 'function' &&
    typeof reviveP.reviveHealsLeft === 'function' &&
    REVIVE_HEAL_COUNT === 5,
)
assert(
  'revive ready by default',
  reviveP.isReviveReady() === true && reviveP.reviveHealsLeft() === 0 && reviveP.reviveCdLeft === 0,
)

const deathlessP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
deathlessP.hp = 0
deathlessP.deathT = 0.4
const revived = deathlessP.tryRevive()
deathlessP.update(0.01)
assert(
  'revive sets hp 1',
  revived === true &&
    deathlessP.hp === 1 &&
    deathlessP.deathT === 0 &&
    deathlessP.anim !== 'Death' &&
    deathlessP.deathAnimDone() === false,
)
assert(
  'revive needs 5 heals',
  deathlessP.isReviveReady() === false &&
    deathlessP.reviveHealsLeft() === REVIVE_HEAL_COUNT &&
    deathlessP.reviveHealsLeft() === 5,
)
assert(
  'revive consumed once',
  deathlessP.tryRevive() === false && // 冷却中再调不可用
    deathlessP.hp === 1 &&
    deathlessP.reviveHealsLeft() === 5,
)

// 只有**真实回血**计数：满血不回血 / heal(0) / 死亡时 heal 都不计；heal(5) 按次算 1 次。
const noCountP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
noCountP.hp = 0
noCountP.tryRevive() // hp 1 / 冷却 5 次
const realHealed = noCountP.heal(5) === true // 1 → 3（hpMax 3）真实回血 ⇒ 计 1 次
const afterReal = noCountP.reviveHealsLeft()
const fullRefused = noCountP.heal(1) === false // 满血不回血 ⇒ 不计
const zeroRefused = noCountP.heal(0) === false // 非法 ⇒ 不计
noCountP.hp = 0
const deadRefused = noCountP.heal(1) === false // 死亡不治疗 ⇒ 不计
assert(
  'revive heal count only real heal',
  realHealed && afterReal === 4 && fullRefused && zeroRefused && deadRefused && noCountP.reviveHealsLeft() === 4,
)

const cdP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
cdP.hp = 0
cdP.tryRevive()
const cdSeq = []
for (let i = 0; i < 5; i++) {
  cdP.hp = 1
  cdP.heal(1) // 每次真实回血 −1
  cdSeq.push(cdP.reviveHealsLeft())
}
const readyAfter5 = cdP.isReviveReady() === true
cdP.hp = 0
const secondRevive = cdP.tryRevive() // 恢复就绪后可再次复活
assert(
  'heal counts toward revive cd',
  cdSeq.join(',') === '4,3,2,1,0' && readyAfter5 && secondRevive === true && cdP.hp === 1,
)

// 复活不可用时，死亡流程与既有行为完全不变。
const plainDeathP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
plainDeathP.hp = 0
plainDeathP.tryRevive() // 用掉就绪
plainDeathP.hp = 0
plainDeathP.update(0.01)
assert(
  'revive unavailable keeps death flow',
  plainDeathP.tryRevive() === false && plainDeathP.anim === 'Death' && plainDeathP.hp === 0,
)

// —— P42 批次8 · 回血飘字统一到 player.heal()（生存也飘；档 8 复活不飘） ——
// 出口只有一个：heal() 真实回血时飘**实际**回血量；满血/死亡/非法不飘；一共只飘一次。
const healNumP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
healNumP.hp = 1
resetDamageNums()
const healedForNum = healNumP.heal(1) // 1 → 2（hpMax 3）
const healItems = getDamageNums()
assert(
  'heal paints green number',
  healedForNum === true &&
    healItems.length === 1 && // 一次回血只飘一次
    healItems[0].kind === 'green' &&
    healItems[0].amount === 1 &&
    healItems[0].x === healNumP.x &&
    healItems[0].y === healNumP.y - 10 &&
    healItems[0].unit === healNumP,
)

resetDamageNums()
healNumP.hp = healNumP.hpMax // 满血
const fullHeal = healNumP.heal(1)
const fullHealItems = getDamageNums().length
healNumP.hp = 0 // 死亡
const deadHeal = healNumP.heal(1)
const zeroHeal = healNumP.heal(0)
assert(
  'heal full hp no number',
  fullHeal === false && fullHealItems === 0 && deadHeal === false && zeroHeal === false && getDamageNums().length === 0,
)

const vitP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
vitP.hp = 2 // hpMax 3
resetDamageNums()
const vitOk = vitP.addVitality() // 上限 3 → 4、当前血 2 → 3
const vitItems = getDamageNums()
assert(
  'vitality paints number',
  vitOk === true &&
    vitP.hpMax === 4 &&
    vitP.hp === 3 &&
    vitItems.length === 1 &&
    vitItems[0].kind === 'green' &&
    vitItems[0].amount === 1 &&
    vitItems[0].x === vitP.x &&
    vitItems[0].y === vitP.y - 10 &&
    vitItems[0].unit === vitP,
)

const reviveNumP = createPlayer({ keys: { w: false, a: false, s: false, d: false }, random: () => 0.5 })
reviveNumP.hp = 0
resetDamageNums()
const revivedForNum = reviveNumP.tryRevive() // 档 8 复活：hp 置 1，但**不是回血事件**
assert(
  'revive paints no number',
  revivedForNum === true && reviveNumP.hp === 1 && getDamageNums().length === 0,
)

console.log(failed === 0 ? '\nRESULT PASS' : `\nRESULT FAIL (${failed})`)
process.exit(failed === 0 ? 0 : 1)
