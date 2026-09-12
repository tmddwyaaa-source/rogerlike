/**
 * M5 蓄力箭自测。运行：在 frontend/ 下 `node src/game/combat/selftest.mjs`
 */
import { BODY, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  ATTACK_BASE,
  CHARGE_MAX_SEC,
  CHARGE_SIZE_BONUS,
  CHARGE_UPGRADE,
  CRIT_CHANCE_PER_PICK,
  CRIT_DAMAGE_MUL,
  critChanceForRoll,
  critDamageMul,
  DMG_MAX,
  DMG_MIN,
  DUAL_SPREAD_DEG,
  EMPOWER_ATK,
  EMPOWER_FULL_MUL,
  EMPOWER_PIERCE,
  EMPOWER_RANGER_FIRST,
  EMPOWER_SPEED,
  EMPOWER_SRC,
  FIRE_INTERVAL,
  fireIntervalForPicks,
  HIT_RADIUS,
  KNOCKBACK_DIST,
  MAGE_ATTACK,
  MAGE_EXPAND_SEC,
  MAGE_FULL_SIZE,
  ONLY_FAST_MUL,
  ORB_DRAW,
  POWER_DMG,
  SCATTER_DMG_PENALTY,
  SLASH_BODY_FRONT,
  SLASH_DRAW,
  SLASH_RANGE,
  SLASH_THICK,
  WARRIOR_ATTACK,
  WARRIOR_FULL_SIZE,
  applyKnockback,
  attackForChar,
  chargeRatio,
  chargeSizeMul,
  createBow,
  createCombat,
  damageForCharge,
  fireAngles,
  fireKindForChar,
  giantSizeMul,
  knockbackForCharge,
  leftoverDamage,
  obbHitsAabb,
  pierceForChar,
  pierceForCharge,
  rollCrit,
  sheetFrameIndex,
  shotDamage,
  slashLength,
  slashThick,
  warriorKnockback,
  FIRE_DURATION_SEC,
  FIRE_DMG_PER_PICK,
  FIRE_DMG_PER_PICK_BOOST,
  PULSE_INTERVAL_SEC,
  PULSE_RADIUS_MUL,
  PULSE_DMG_MUL,
  PULSE_SLOW,
  PULSE_SLOW_SEC,
  fireDpsPerPick,
  waterSlowPct,
  waterSlowSec,
  knockbackBonusForPicks,
  BASE_KNOCKBACK_BODIES,
  erseChance,
  erseChancePerPick,
  RAPID_EXTRA_CD_SEC,
  RAPID_UNCHARGED_CHANCE,
  RAPID_EXTRA_DELAY_SEC,
  PIERCE_AMP_STEP,
  SP_POWER_DMG,
  REFINE_CRIT_RATE_PER_PICK,
  REFINE_CRIT_DMG_PER_STEP,
  REFINE_CRIT_STEP,
  STEADY_CRIT_RATE_BONUS,
  ceilDamage,
} from './index.js'

let failed = 0
function assert(name, cond) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  facing: 0,
  charging: false,
  attackT: 0,
  lookAt(wx, wy) {
    this.facing = Math.atan2(wy - this.y, wx - this.x)
  },
  setCharging(v) {
    this.charging = Boolean(v)
  },
}

function makeCreep(dx, hp = 80) {
  return {
    x: player.x + dx,
    y: player.y,
    w: 16,
    h: 16,
    hp,
    knockbackable: true,
  }
}

const bow = createBow()
assert('no mag', bow.mag === 0 && bow.magSize === 0 && bow.reloading === false)
assert('charge max 0.75', bow.chargeMax === CHARGE_MAX_SEC && CHARGE_MAX_SEC === 0.75)
assert('attack base 20', bow.attack === ATTACK_BASE && ATTACK_BASE === 20)
assert('uncharged = attack', damageForCharge(0) === ATTACK_BASE && damageForCharge(0) === DMG_MIN)
assert('full = attack×2', damageForCharge(1) === ATTACK_BASE * 2 && damageForCharge(1) === DMG_MAX)
assert('lerp mid', damageForCharge(0.5) === ATTACK_BASE * 1.5)
assert('not hardcoded 20–40', damageForCharge(1, 28) === 56 && damageForCharge(0, 17) === 17)
assert('kb lerp 1→2 BODY', knockbackForCharge(0) === BODY && knockbackForCharge(1) === BODY * 2)
assert('pierce only full', pierceForCharge(0.99) === 0 && pierceForCharge(1) === 1)
assert('pierce +1 tap hits 2', pierceForCharge(0, 1) === 1)
assert('pierce +1 full hits 3', pierceForCharge(1, 1) === 2)
assert('shotDamage uses attack', shotDamage(0, 28) === 28 && shotDamage(1, 28) === 56)
assert('giant 1st ×1.4', giantSizeMul(1) === 1.4)
assert('giant 2nd ×1.8', giantSizeMul(2) === 1.8)
assert('full size ×1.25', chargeSizeMul(1, 1) === 1 + CHARGE_SIZE_BONUS)
assert('tap size ×1', chargeSizeMul(0, 1) === 1)
assert('giant+full size', Math.abs(chargeSizeMul(1, 2) - 2.5) < 1e-9)
assert('mage sizeMul 3', Math.abs(chargeSizeMul(1, 1, 'mage') - MAGE_FULL_SIZE) < 1e-9 && MAGE_FULL_SIZE === 3)
assert('mage tap sizeMul 1', chargeSizeMul(0, 1, 'mage') === 1)
assert('mage giant+full', Math.abs(chargeSizeMul(1, 1.4, 'mage') - 3 * 1.4) < 1e-9)
assert('warrior full sizeMul 1.6', Math.abs(chargeSizeMul(1, 1, 'warrior') - WARRIOR_FULL_SIZE) < 1e-9)
assert('warrior tap sizeMul 1', chargeSizeMul(0, 1, 'warrior') === 1)
assert('warrior mid sizeMul 1.3', Math.abs(chargeSizeMul(0.5, 1, 'warrior') - 1.3) < 1e-9)
assert('SLASH_RANGE BODY', SLASH_RANGE === BODY && Math.abs(SLASH_THICK - BODY * 0.5) < 1e-9)
assert('slashLength tap/full', slashLength(0) === BODY && Math.abs(slashLength(1) - BODY * 1.6) < 1e-9)
assert(
  '3 giant full ~77',
  Math.abs(slashLength(1, giantSizeMul(3)) - BODY * 1.6 * 2.2) < 1e-9 &&
    Math.abs(slashThick(giantSizeMul(3)) - SLASH_THICK * 2.2) < 1e-9,
)
assert('warrior mid dmg', shotDamage(0.5, 22, { charId: 'warrior' }) === 28.6)
assert('attackForChar', attackForChar('mage') === MAGE_ATTACK && attackForChar('warrior') === WARRIOR_ATTACK && attackForChar('ranger') === ATTACK_BASE)
assert('mage pierce always 0', pierceForChar('mage', 0) === 0 && pierceForChar('mage', 1, 2) === 0)
assert('mage tap dmg 25', shotDamage(0, 25, { charId: 'mage' }) === 25)
assert('mage full dmg 37.5', shotDamage(1, 25, { charId: 'mage' }) === 37.5)
assert('mage pierce1 full 42.5', shotDamage(1, 25, { charId: 'mage', pierceBonus: 1 }) === 42.5)
assert('warrior full dmg ×1.6', shotDamage(1, 22, { charId: 'warrior' }) === 35.2)
assert('warrior infinite pierce', pierceForChar('warrior', 0) >= 99 && pierceForChar('warrior', 1) >= 99)
assert('warriorKnockback 0/BODY', warriorKnockback(0) === 0 && warriorKnockback(2) === BODY)
assert('crit 0 never', rollCrit(0, () => 0) === false)
assert('crit 100 always', rollCrit(100, () => 0.99) === true && CRIT_CHANCE_PER_PICK === 10 && CRIT_DAMAGE_MUL === 1.5)
assert('crit cap 150→100', critChanceForRoll(150) === 100)
assert('refine 30% ×1.7', Math.abs(critDamageMul(30, 1) - 1.7) < 1e-9)
assert('only_fast /1.2', Math.abs(fireIntervalForPicks(1) - FIRE_INTERVAL / ONLY_FAST_MUL) < 1e-9)
assert('leftover', leftoverDamage(50, 22) === 28)
assert('sheet frame 0', sheetFrameIndex(0) === 0)
assert('sheet frame 5', sheetFrameIndex(5 / 12) === 5)
assert('sheet loops', sheetFrameIndex(6 / 12) === 0)
assert('EMPOWER_FULL_MUL 2.5', EMPOWER_FULL_MUL === 2.5 && EMPOWER_PIERCE === 2)
assert('EMPOWER_SRC laser', typeof EMPOWER_SRC === 'string' && String(EMPOWER_SRC).includes('强化箭矢x'))
assert('EMPOWER_SPEED 680', EMPOWER_SPEED === 680)

const creep = makeCreep(40)
const combat = createCombat({ player, targets: [creep], weapon: bow })
assert('tryFire full', combat.tryFire(1) === true)
assert('one arrow', combat.bullets.length === 1)
assert('attackT set', player.attackT > 0)
for (let i = 0; i < 30; i++) combat.update(0.016)
assert('full dmg 40', creep.hp === 80 - DMG_MAX)
assert(
  'full knockback 2.5 BODY',
  Math.abs(creep.x - (player.x + 40 + BODY * 2.5)) < 0.5,
)

const tap = makeCreep(40)
const cTap = createCombat({ player, targets: [tap] })
cTap.beginCharge()
assert('charging on', player.charging === true && cTap.charging === true)
cTap.releaseCharge()
for (let i = 0; i < 30; i++) cTap.update(0.016)
assert('tap dmg 20', tap.hp === 80 - DMG_MIN)
assert('tap kb 1.5 BODY', Math.abs(tap.x - (player.x + 40 + BODY * 1.5)) < 0.5)

const hold = makeCreep(40)
const cHold = createCombat({ player, targets: [hold] })
cHold.beginCharge()
cHold.update(CHARGE_MAX_SEC)
assert('held full', Math.abs(cHold.getCharge() - CHARGE_MAX_SEC) < 1e-9)
cHold.releaseCharge()
for (let i = 0; i < 30; i++) cHold.update(0.016)
assert('held dmg 40', hold.hp === 80 - DMG_MAX)

const cCd = createCombat({ player, targets: [] })
assert('interval blocks', cCd.tryFire(1) === true && cCd.tryFire(1) === false)

const a = makeCreep(36, 80)
const b = makeCreep(90, 80)
const cPierce = createCombat({ player, targets: [a, b] })
cPierce.tryFire(1)
for (let i = 0; i < 50; i++) cPierce.update(0.016)
assert('full pierce 2 creeps', a.hp === 80 - DMG_MAX && b.hp === 80 - DMG_MAX)

const c1 = makeCreep(36, 80)
const c2 = makeCreep(90, 80)
const cNo = createCombat({ player, targets: [c1, c2] })
cNo.tryFire(0)
for (let i = 0; i < 50; i++) cNo.update(0.016)
assert('no pierce uncharged', c1.hp === 80 - DMG_MIN && c2.hp === 80)

const tree = {
  x: player.x + 40,
  y: player.y,
  w: 20,
  h: 20,
  hp: 50,
  knockbackable: false,
}
const treeX = tree.x
applyKnockback(tree, 1, 0)
assert('tree no knockback', tree.x === treeX)

const snail = {
  x: player.x,
  y: player.y,
  knockbackable: true,
  knockbackResist: BODY,
}
assert(
  'resist BODY uncharged → 0',
  applyKnockback(snail, 1, 0, BODY) === false && snail.x === player.x,
)
assert(
  'resist BODY full → 1 BODY',
  applyKnockback(snail, 1, 0, BODY * 2) === true &&
    Math.abs(snail.x - (player.x + BODY)) < 1e-9,
)

const mush = { x: player.x, y: player.y, knockbackable: true }
assert(
  'no resist keeps dist',
  applyKnockback(mush, 1, 0, BODY) === true &&
    Math.abs(mush.x - (player.x + BODY)) < 1e-9,
)

const scaled = { x: player.x, y: player.y, knockbackable: true, knockbackScale: 0.5 }
assert(
  'knockbackScale 0.5',
  applyKnockback(scaled, 1, 0, BODY) === true &&
    Math.abs(scaled.x - (player.x + BODY * 0.5)) < 1e-9,
)

const snailTap = makeCreep(40)
snailTap.knockbackResist = BODY
const cSnail = createCombat({ player, targets: [snailTap] })
const snailX = snailTap.x
cSnail.tryFire(0)
for (let i = 0; i < 30; i++) cSnail.update(0.016)
assert('combat uncharged + resist → 0.5 BODY', Math.abs(snailTap.x - (snailX + BODY * 0.5)) < 0.5)

let worldHits = 0
const cWorld = createCombat({
  player,
  targets: [],
  hooks: {
    hitWorld() {
      worldHits += 1
      return { hit: true }
    },
  },
})
cWorld.tryFire(1)
for (let i = 0; i < 40; i++) cWorld.update(0.016)
assert('hitWorld', worldHits >= 1)

const dualW = createBow()
const cDual = createCombat({ player, targets: [], weapon: dualW })
assert('scatter id', cDual.applyUpgrade('ammo_cap') === true && dualW.extraShots === 1)
assert('scatter −3 attack', dualW.attack === ATTACK_BASE - SCATTER_DMG_PENALTY && dualW.dmgBonus === -SCATTER_DMG_PENALTY)
cDual.tryFire(1)
assert('scatter two arrows', cDual.bullets.length === 2)
const step = (DUAL_SPREAD_DEG * Math.PI) / 180
const expect2 = fireAngles(player.facing, 1, 0)
const angs = cDual.bullets.map((ar) => ar.ang).sort((x, y) => x - y)
const expA = expect2.slice().sort((x, y) => x - y)
assert(
  'scatter spread',
  Math.abs(angs[0] - expA[0]) < 1e-9 && Math.abs(angs[1] - expA[1]) < 1e-9,
)
cDual.applyUpgrade('ammo_cap')
cDual.weapon.fireCd = 0
cDual.bullets.length = 0
cDual.tryFire(1)
assert('scatter stacks to 3', cDual.bullets.length === 3)
assert('scatter attack stacks', dualW.attack === ATTACK_BASE - SCATTER_DMG_PENALTY * 2)
assert('spread helper 2', fireAngles(0, 1, 0).length === 2 && Math.abs(fireAngles(0, 1, 0)[0] + step / 2) < 1e-9)

const eyesW = createBow()
const cEyes = createCombat({ player, targets: [], weapon: eyesW })
cEyes.applyUpgrade('eyes')
cEyes.tryFire(1)
assert('eyes back + front', cEyes.bullets.length === 2)
assert('eyes −3 attack', eyesW.attack === ATTACK_BASE - SCATTER_DMG_PENALTY)
const back = cEyes.bullets.find((ar) => Math.abs(ar.ang - (player.facing + Math.PI)) < 1e-9)
assert('eyes rear angle', Boolean(back))

const pW = createBow()
const cP = createCombat({ player, targets: [], weapon: pW })
cP.applyUpgrade('pierce')
cP.applyUpgrade('power')
assert('POWER_DMG is 10', POWER_DMG === 10)
assert('power +10 attack', pW.attack === ATTACK_BASE + POWER_DMG && pW.dmgBonus === POWER_DMG && pW.pierceBonus === 1)
const pSolo = {
  x: player.x,
  y: player.y,
  facing: 0,
  lookAt() {},
  setCharging() {},
}
const pHit = makeCreep(40, 200)
const cPHit = createCombat({ player: pSolo, targets: [pHit], weapon: createBow() })
cPHit.applyUpgrade('power')
cPHit.tryFire(1)
for (let i = 0; i < 30; i++) cPHit.update(0.016)
assert('power full = attack×2', pHit.hp === 200 - (ATTACK_BASE + POWER_DMG) * 2)
assert('power writes player.attack', pSolo.attack === ATTACK_BASE + POWER_DMG)

const attrP = {
  x: player.x,
  y: player.y,
  facing: 0,
  attack: 30,
  lookAt() {},
  setCharging() {},
}
const attrHit = makeCreep(40, 200)
const cAttr = createCombat({ player: attrP, targets: [attrHit] })
assert('reads player.attack', cAttr.weapon.attack === 30)
cAttr.tryFire(0)
for (let i = 0; i < 30; i++) cAttr.update(0.016)
assert('uncharged uses player.attack', attrHit.hp === 200 - 30)
const tapP = makeCreep(36, 80)
const farP = makeCreep(90, 80)
const cTapP = createCombat({ player, targets: [tapP, farP], weapon: createBow() })
cTapP.applyUpgrade('pierce')
cTapP.tryFire(0)
for (let i = 0; i < 50; i++) cTapP.update(0.016)
assert('tap pierce +1 hits 2', tapP.hp < 80 && farP.hp < 80)

const gW = createBow()
const cG = createCombat({ player, targets: [], weapon: gW })
cG.applyUpgrade('giant')
cG.tryFire(1)
assert('giant+full radius ×1.75', Math.abs(cG.bullets[0].radius - HIT_RADIUS * 1.4 * 1.25) < 1e-9)
cG.applyUpgrade('giant')
cG.weapon.fireCd = 0
cG.bullets.length = 0
cG.tryFire(1)
assert('giant 2nd+full ×2.25', Math.abs(cG.bullets[0].sizeMul - 1.8 * 1.25) < 1e-9)

const ch = createBow()
const cCh = createCombat({ player, targets: [], weapon: ch })
// P42：技巧每层 −0.15（原 −0.20）。0.75 → 0.60 → 0.45 → 0.30 → 0.15 → 0 共 5 次到 0。
assert(
  'charge -0.15',
  CHARGE_UPGRADE === 0.15 &&
    cCh.applyUpgrade('reload') === true &&
    Math.abs(ch.chargeMax - 0.6) < 1e-9 &&
    Math.abs(ch.reloadSec - 0.6) < 1e-9,
)
cCh.applyUpgrade('reload')
cCh.applyUpgrade('reload')
cCh.applyUpgrade('reload')
const chargeAfter4 = ch.chargeMax // 第 4 次应为 0.15，尚未到 0（每层 −0.20 时这里已提前钳到 0）
cCh.applyUpgrade('reload')
assert(
  'charge 5 picks to 0',
  Math.abs(chargeAfter4 - CHARGE_UPGRADE) < 1e-9 && chargeAfter4 > 0 && ch.chargeMax === 0,
)
assert('charge clamped 0', ch.chargeMax === 0)
assert('charge 0 still ok', cCh.applyUpgrade('reload') === true && ch.chargeMax === 0)
cCh.beginCharge()
assert('no charge needed → instant shot', cCh.bullets.length === 1 && cCh.charging === false)

const eW = createBow()
const eP = {
  x: player.x,
  y: player.y,
  facing: 0,
  lookAt() {},
  setCharging() {},
}
const cE = createCombat({ player: eP, targets: [], weapon: eW })
assert('empower 1st', cE.applyUpgrade('empower_shot') === true && eW.empowerPicks === 1)
assert('empower 1st +5', eW.attack === ATTACK_BASE + EMPOWER_RANGER_FIRST)
cE.tryFire(1)
assert('empower full dmg ceil(atk×2.5)', cE.bullets[0].damage === Math.ceil((ATTACK_BASE + EMPOWER_RANGER_FIRST) * EMPOWER_FULL_MUL))
assert(
  'empower pierce +2',
  cE.bullets[0].pierceLeft === pierceForCharge(1, 0) + EMPOWER_PIERCE,
)
assert('empower speed 680', Math.abs(Math.hypot(cE.bullets[0].vx, cE.bullets[0].vy) - EMPOWER_SPEED) < 1e-6)
assert('empower kind', cE.bullets[0].kind === 'empower')
assert('empower laser draw', cE.bullets[0].drawW > cE.bullets[0].drawH * 2)
cE.weapon.fireCd = 0
cE.bullets.length = 0
cE.tryFire(0)
assert(
  'empower tap still normal',
  cE.bullets[0].kind === 'arrow' &&
    cE.bullets[0].damage === ATTACK_BASE + EMPOWER_RANGER_FIRST,
)
cE.applyUpgrade('empower_shot')
assert('empower 2nd +15', eW.attack === ATTACK_BASE + EMPOWER_RANGER_FIRST + EMPOWER_ATK)

const ovP = {
  x: player.x,
  y: player.y,
  facing: 0,
  lookAt() {},
  setCharging() {},
}
const ov1 = makeCreep(36, 22)
const ov2 = makeCreep(90, 40)
const ovW = createBow()
const cOv = createCombat({ player: ovP, targets: [ov1, ov2], weapon: ovW })
cOv.applyUpgrade('empower_shot')
cOv.tryFire(1)
const ovDmg = cOv.bullets[0].damage
cOv.bullets[0].pierceLeft = 0
for (let i = 0; i < 50; i++) cOv.update(0.016)
assert('overflow kills first', ov1.hp <= 0)
assert('overflow leftover next', ov2.hp === 40 - leftoverDamage(ovDmg, 22))

const wP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const cWar = createCombat({ player: wP, targets: [] })
assert('warrior attack 22', cWar.weapon.attack === WARRIOR_ATTACK && WARRIOR_ATTACK === 22)
cWar.tryFire(1)
const slash = cWar.bullets[0]
assert('warrior slash', slash.kind === 'slash' && slash.vx === 0 && slash.vy === 0)
assert('warrior full dmg ×1.6 live (35.2 ceil → 36)', Math.abs(slash.damage - 36) < 1e-9)
assert('warrior full sizeMul 1.6 live', Math.abs(slash.sizeMul - WARRIOR_FULL_SIZE) < 1e-9)
assert('warrior full kb 0.5 BODY', Math.abs(slash.knockback - BODY * 0.5) < 1e-9)
{
  const len = SLASH_RANGE * WARRIOR_FULL_SIZE
  const far = wP.x + SLASH_BODY_FRONT + len
  assert(
    'warrior full range ×1.6',
    Math.abs(slash.x - (wP.x + SLASH_BODY_FRONT + len / 2)) < 1e-6,
  )
  assert('warrior draw not past far', slash.x + slash.drawW / 2 <= far + 1e-6)
}
const sx = slash.x
cWar.update(0.25)
assert(
  'warrior slash stays',
  cWar.bullets[0] &&
    Math.abs(cWar.bullets[0].x - sx) < 1e-6 &&
    Math.abs(cWar.bullets[0].x - wP.x) < BODY * 3,
)
cWar.weapon.fireCd = 0
cWar.bullets.length = 0
cWar.tryFire(0)
assert('warrior tap sizeMul 1 live', cWar.bullets[0].sizeMul === 1)
assert(
  'warrior tap draw = 1 BODY',
  Math.abs(cWar.bullets[0].drawW - SLASH_RANGE) < 1e-9 &&
    Math.abs(cWar.bullets[0].drawH - SLASH_THICK) < 1e-9 &&
    cWar.bullets[0].drawW !== cWar.bullets[0].drawH,
)
assert(
  'warrior tap range from body front',
  Math.abs(cWar.bullets[0].x - (wP.x + SLASH_BODY_FRONT + SLASH_RANGE / 2)) < 1e-6,
)
cWar.weapon.fireCd = 0
cWar.bullets.length = 0
cWar.tryFire(0.5)
assert('warrior mid live dmg (28.6 ceil → 29)', Math.abs(cWar.bullets[0].damage - 29) < 1e-9)
assert('warrior mid live len', Math.abs(cWar.bullets[0].drawW - BODY * 1.3) < 1e-9)
assert('warrior mid thick no charge', Math.abs(cWar.bullets[0].drawH - SLASH_THICK) < 1e-9)

const wOnceP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const wOnce = {
  x: player.x + SLASH_RANGE,
  y: player.y,
  w: 16,
  h: 16,
  hp: 200,
  knockbackable: true,
}
const cOnce = createCombat({ player: wOnceP, targets: [wOnce] })
cOnce.tryFire(1)
const hpSpawn = wOnce.hp
assert('warrior hits once on spawn', hpSpawn < 200)
cOnce.update(0.016)
cOnce.update(0.2)
assert('warrior no second hit', wOnce.hp === hpSpawn)

const wTapP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const s1 = { x: player.x + SLASH_RANGE, y: player.y, w: 16, h: 16, hp: 80, knockbackable: true }
const s2 = { x: player.x + SLASH_RANGE + 6, y: player.y, w: 16, h: 16, hp: 80, knockbackable: true }
const s3 = { x: player.x + SLASH_RANGE - 6, y: player.y, w: 16, h: 16, hp: 80, knockbackable: true }
const cW2 = createCombat({ player: wTapP, targets: [s1, s2, s3] })
cW2.tryFire(0)
assert('warrior infinite hits all', [s1, s2, s3].every((c) => c.hp < 80))

const wKb0 = {
  x: player.x + SLASH_RANGE,
  y: player.y,
  w: 16,
  h: 16,
  hp: 200,
  knockbackable: true,
}
const wKbP0 = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const cKb0 = createCombat({ player: wKbP0, targets: [wKb0] })
cKb0.tryFire(0)
assert('warrior pierce0 kb 0.5 BODY', Math.abs(wKb0.x - (player.x + SLASH_RANGE + BODY * 0.5)) < 0.5)

const wKb2 = {
  x: player.x + SLASH_RANGE,
  y: player.y,
  w: 16,
  h: 16,
  hp: 200,
  knockbackable: true,
}
const wKbP2 = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const wKbW = createBow({ charId: 'warrior' })
const cKb2 = createCombat({ player: wKbP2, targets: [wKb2], weapon: wKbW })
cKb2.applyUpgrade('pierce')
cKb2.applyUpgrade('pierce')
cKb2.tryFire(0)
assert('warrior pierce2 kb 1.5 BODY', Math.abs(wKb2.x - (player.x + SLASH_RANGE + BODY * 1.5)) < 0.5)

const hugP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const hug = {
  x: player.x + SLASH_BODY_FRONT + 1,
  y: player.y,
  w: 16,
  h: 16,
  hp: 80,
  knockbackable: true,
}
const cHug = createCombat({ player: hugP, targets: [hug] })
cHug.tryFire(0)
assert('warrior face hug', hug.hp < 80)

const mP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'mage',
  lookAt() {},
  setCharging() {},
}
const cMage = createCombat({ player: mP, targets: [] })
assert('mage attack 25', cMage.weapon.attack === MAGE_ATTACK && MAGE_ATTACK === 25)
cMage.tryFire(0)
assert('mage tap dmg live 25', cMage.bullets[0].damage === 25)
cMage.weapon.fireCd = 0
cMage.bullets.length = 0
cMage.tryFire(1)
assert('mage orb', cMage.bullets[0].kind === 'orb')
assert('mage flies', Math.hypot(cMage.bullets[0].vx, cMage.bullets[0].vy) > 100)
assert('mage full sizeMul 3', Math.abs(cMage.bullets[0].sizeMul - MAGE_FULL_SIZE) < 1e-9)
assert('mage full dmg live 38 (37.5 ceil)', cMage.bullets[0].damage === 38)
cMage.applyUpgrade('pierce')
cMage.weapon.fireCd = 0
cMage.bullets.length = 0
cMage.tryFire(1)
assert('mage pierce1 full live 43 (42.5 ceil)', cMage.bullets[0].damage === 43)
cMage.weapon.fireCd = 0
cMage.bullets.length = 0
cMage.tryFire(0)
assert('mage tap draw < 9', cMage.bullets[0].drawW === ORB_DRAW && ORB_DRAW < 9 && ORB_DRAW >= 7)
cMage.applyUpgrade('empower_shot')
cMage.weapon.fireCd = 0
cMage.bullets.length = 0
cMage.tryFire(1)
assert('mage no empower_shot', cMage.bullets[0].kind === 'orb')

const mTapP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'mage',
  lookAt() {},
  setCharging() {},
}
const mNear = makeCreep(10, 80)
const mFar = makeCreep(80, 80)
const cMT = createCombat({ player: mTapP, targets: [mNear, mFar] })
cMT.tryFire(0)
for (let i = 0; i < 50; i++) cMT.update(0.016)
assert('mage tap vanish 1', mNear.hp < 80 && mFar.hp === 80 && cMT.bullets.length === 0)

const splashP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'mage',
  lookAt() {},
  setCharging() {},
}
const cluster = []
for (let i = 0; i < 5; i++) {
  cluster.push({
    x: player.x + 10,
    y: player.y + (i - 2) * 4,
    w: 16,
    h: 16,
    hp: 80,
    knockbackable: true,
  })
}
const cSplash = createCombat({ player: splashP, targets: cluster })
cSplash.tryFire(1)
let sawExpand = false
let fadeA = 1
for (let i = 0; i < 8; i++) {
  cSplash.update(0.016)
  if (cSplash.bullets[0]?.expanding) {
    sawExpand = true
    fadeA = cSplash.bullets[0].alpha
  }
}
assert('mage expand starts', sawExpand === true)
assert('mage expand fade', fadeA < 1)
assert('mage full expand all', cluster.every((c) => c.hp < 80))
const hps = cluster.map((c) => c.hp)
cSplash.update(0.08)
assert('mage expand once', cluster.every((c, i) => c.hp === hps[i]))
assert('MAGE_EXPAND_SEC 0.3', MAGE_EXPAND_SEC === 0.3)
cSplash.update(0.3)
assert('mage expand ends', cSplash.bullets.length === 0)

const dmgLog = []
const dmgCreep = makeCreep(40)
const cDmg = createCombat({
  player: { x: player.x, y: player.y, facing: 0, lookAt() {}, setCharging() {} },
  targets: [dmgCreep],
  hooks: {
    onDamage(t, d) {
      dmgLog.push({ t, d })
    },
  },
})
cDmg.tryFire(1)
for (let i = 0; i < 30; i++) cDmg.update(0.016)
assert('onDamage on creep', dmgLog.length >= 1 && dmgLog[0].d > 0 && dmgLog[0].t === dmgCreep)

const sizeP = { x: player.x, y: player.y, facing: 0, lookAt() {}, setCharging() {} }
const cSz = createCombat({ player: sizeP, targets: [] })
cSz.tryFire(0)
assert('tap sizeMul 1', cSz.bullets[0].sizeMul === 1)
cSz.weapon.fireCd = 0
cSz.bullets.length = 0
cSz.tryFire(1)
assert('full sizeMul 1.25', Math.abs(cSz.bullets[0].sizeMul - 1.25) < 1e-9)

const crW = createBow()
assert('crit default 0', crW.critRate === 0)
assert('crit upgrade', crW.applyUpgrade('crit') === true && crW.critRate === CRIT_CHANCE_PER_PICK)
for (let i = 0; i < 9; i++) crW.applyUpgrade('crit')
assert('crit stacks to 100', crW.critRate === 100)
const crHit = makeCreep(40, 200)
const crP = {
  x: player.x,
  y: player.y,
  facing: 0,
  lookAt() {},
  setCharging() {},
}
const cCr = createCombat({ player: crP, targets: [crHit], weapon: crW })
cCr.tryFire(1)
for (let i = 0; i < 30; i++) cCr.update(0.016)
assert('crit 100% ×1.5', crHit.hp === 200 - DMG_MAX * CRIT_DAMAGE_MUL)

const ofW = createBow()
const ofMax = ofW.chargeMax
assert('only_fast', ofW.applyUpgrade('only_fast') === true)
assert(
  'only_fast interval',
  Math.abs(ofW.fireInterval - FIRE_INTERVAL / ONLY_FAST_MUL) < 1e-9 &&
    ofW.chargeMax === ofMax,
)
const ofC = createCombat({
  player: { x: player.x, y: player.y, facing: 0, lookAt() {}, setCharging() {} },
  targets: [],
  weapon: ofW,
})
ofC.tryFire(1)
assert('only_fast fireCd', Math.abs(ofC.weapon.fireCd - FIRE_INTERVAL / ONLY_FAST_MUL) < 1e-9)

const rfW = createBow()
assert('refine', rfW.applyUpgrade('refine') === true && rfW.refinePicks === 1)

const wEmpP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const cWEmp = createCombat({ player: wEmpP, targets: [] })
cWEmp.applyUpgrade('empower_shot')
assert('warrior empower 1st +15', cWEmp.weapon.attack === WARRIOR_ATTACK + EMPOWER_ATK)
cWEmp.tryFire(1)
assert('warrior empower no laser', cWEmp.bullets[0].kind === 'slash')

const g3W = createBow({ charId: 'warrior' })
const g3P = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const cG3 = createCombat({ player: g3P, targets: [], weapon: g3W })
cG3.applyUpgrade('giant')
cG3.applyUpgrade('giant')
cG3.applyUpgrade('giant')
cG3.tryFire(1)
assert(
  '3 giant slash not square',
  Math.abs(cG3.bullets[0].drawW - BODY * 1.6 * 2.2) < 1e-6 &&
    Math.abs(cG3.bullets[0].drawH - SLASH_THICK * 2.2) < 1e-6 &&
    cG3.bullets[0].drawW < 90 &&
    cG3.bullets[0].drawW > cG3.bullets[0].drawH * 2,
)

const sideP = {
  x: player.x,
  y: player.y,
  facing: 0,
  charId: 'warrior',
  lookAt() {},
  setCharging() {},
}
const side = {
  x: player.x + SLASH_BODY_FRONT + BODY / 2,
  y: player.y + 60,
  w: 16,
  h: 16,
  hp: 80,
  knockbackable: true,
}
const cSide = createCombat({ player: sideP, targets: [side] })
cSide.tryFire(0)
assert('obb misses far side', side.hp === 80)
assert(
  'obb helper',
  obbHitsAabb(0, 0, 0, 22, 11, { x: 5, y: -4, w: 8, h: 8 }) === true &&
    obbHitsAabb(0, 0, 0, 22, 11, { x: -2, y: 40, w: 8, h: 8 }) === false,
)

const treeLog = []
const treeT = {
  x: player.x + 40,
  y: player.y,
  w: 20,
  h: 20,
  hp: 50,
  knockbackable: false,
}
const cTreeD = createCombat({
  player: { x: player.x, y: player.y, facing: 0, lookAt() {}, setCharging() {} },
  targets: [treeT],
  hooks: {
    onDamage(t, d) {
      treeLog.push({ t, d })
    },
  },
})
cTreeD.tryFire(1)
for (let i = 0; i < 30; i++) cTreeD.update(0.016)
assert('tree onDamage', treeLog.length >= 1 && treeLog[0].t === treeT && treeLog[0].d > 0)

let slashWorld = 0
let slashDealt = 0
const cSlW = createCombat({
  player: {
    x: player.x,
    y: player.y,
    facing: 0,
    charId: 'warrior',
    lookAt() {},
    setCharging() {},
  },
  targets: [],
  hooks: {
    hitSlashAt(opts) {
      slashWorld += 1
      slashDealt = opts.thick
      return { hit: true, dealt: 9, tree: { x: 1, y: 2, knockbackable: false } }
    },
    onDamage() {},
  },
})
cSlW.tryFire(0)
assert('hitSlashAt OBB', slashWorld >= 1 && slashDealt === SLASH_THICK)

let takeHitN = 0
const thLog = []
const thCreep = makeCreep(40, 80)
thCreep.takeHit = (d) => {
  takeHitN += 1
  thCreep.hp -= 7
  return 7
}
const cTh = createCombat({
  player: { x: player.x, y: player.y, facing: 0, lookAt() {}, setCharging() {} },
  targets: [thCreep],
  hooks: {
    onDamage(t, d) {
      thLog.push(d)
    },
  },
})
cTh.tryFire(1)
for (let i = 0; i < 30; i++) cTh.update(0.016)
assert('uses takeHit', takeHitN >= 1)
// P28 B2：伤害数字为原始命中伤害（DMG_MAX），不因 takeHit 实际扣减而截断。
assert('pops raw damage not clamped', thLog[0] === DMG_MAX)

assert('FIRE_INTERVAL 0.48', FIRE_INTERVAL === 0.48)
assert('KNOCKBACK_DIST === BODY', KNOCKBACK_DIST === BODY)
assert('ratio helper', chargeRatio(0.375, 0.75) === 0.5)
assert('compat pistol alias', cCh.pistol === ch)
assert('no reload flag', cCh.isReloading() === false && cCh.getSwing() === 0)

const calls = []
const ctx = {
  fillRect(x, y, w, h) {
    calls.push({ x, y, w, h })
  },
  drawImage() {},
  save() {},
  restore() {},
  translate() {},
  rotate() {},
  fillStyle: '',
}
const vis = createCombat({ player })
vis.beginCharge()
vis.update(0.3)
vis.draw(ctx)
assert('charge bar drawn', calls.length > 0)

// P20：开火音效钩子 onFire（只回调不播音；单次开火只触发一次）
assert(
  'fireKindForChar map',
  fireKindForChar('ranger') === 'shoot' &&
    fireKindForChar('warrior') === 'slash' &&
    fireKindForChar('mage') === 'fireball' &&
    fireKindForChar(undefined) === 'shoot',
)
const mkFireP = (charId) => ({
  x: player.x,
  y: player.y,
  facing: 0,
  charId,
  lookAt() {},
  setCharging() {},
})
const mkOnFire = (log) => ({
  onFire(kind) {
    log.push(kind)
  },
})
const shootLog = []
const cSfx = createCombat({
  player: mkFireP(),
  targets: [],
  hooks: mkOnFire(shootLog),
})
cSfx.tryFire(1)
assert('onFire ranger shoot', shootLog.length === 1 && shootLog[0] === 'shoot')
assert('interval blocks onFire', cSfx.tryFire(1) === false && shootLog.length === 1)

const slashLog = []
const cSfxW = createCombat({
  player: mkFireP('warrior'),
  targets: [],
  hooks: mkOnFire(slashLog),
})
cSfxW.tryFire(1)
assert('onFire warrior slash', slashLog.length === 1 && slashLog[0] === 'slash')

const fireballLog = []
const cSfxM = createCombat({
  player: mkFireP('mage'),
  targets: [],
  hooks: mkOnFire(fireballLog),
})
cSfxM.tryFire(1)
assert('onFire mage fireball', fireballLog.length === 1 && fireballLog[0] === 'fireball')

const multiLog = []
const multiW = createBow()
const cSfxMulti = createCombat({
  player: mkFireP(),
  targets: [],
  weapon: multiW,
  hooks: mkOnFire(multiLog),
})
cSfxMulti.applyUpgrade('ammo_cap')
cSfxMulti.applyUpgrade('eyes')
cSfxMulti.applyUpgrade('empower_shot')
cSfxMulti.tryFire(1)
assert(
  'scatter+back+empower one onFire',
  cSfxMulti.bullets.length === 3 && multiLog.length === 1 && multiLog[0] === 'shoot',
)

const fastLog = []
const fastW = createBow()
fastW.setInfiniteAmmo(true)
const cSfxFast = createCombat({
  player: mkFireP(),
  targets: [],
  weapon: fastW,
  hooks: mkOnFire(fastLog),
})
cSfxFast.beginCharge()
assert(
  'instant mode onFire',
  cSfxFast.bullets.length === 1 && fastLog.length === 1 && fastLog[0] === 'shoot',
)

// P25 M5：四娃点燃 / 五娃减速 / 高级击退 / 七色脉冲 / 集齐后效果 +10%
assert('FIRE_DURATION_SEC 3', FIRE_DURATION_SEC === 3)
assert('FIRE_DMG_PER_PICK 0.3/0.4', FIRE_DMG_PER_PICK === 0.3 && FIRE_DMG_PER_PICK_BOOST === 0.4)
assert('fireDpsPerPick boost', fireDpsPerPick(false) === 0.3 && fireDpsPerPick(true) === 0.4)
assert('waterSlowPct boost', waterSlowPct(false) === 0.2 && waterSlowPct(true) === 0.3)
assert('waterSlowSec layers', waterSlowSec(1) === 0.3 && Math.abs(waterSlowSec(2) - 0.5) < 1e-9)
assert('BASE_KNOCKBACK_BODIES 0.5', BASE_KNOCKBACK_BODIES === 0.5)
assert('knockback bonus 2 picks = 2 BODY', Math.abs(knockbackBonusForPicks(2) - BODY * 2) < 1e-9)
assert('erse chance base', erseChance(1, false) === 20 && erseChance(3, false) === 60)
assert('erse chance boost', erseChance(1, true) === 30 && erseChance(4, true) === 100)
assert('erse chance cap', erseChance(6, false) === 100)

{
  const eW = createBow()
  assert('erse picks', eW.applyUpgrade('erse') === true && eW.ersePicks === 1)
}

const fireP2 = mkFireP()
const fireW2 = createBow()
const fireHit2 = makeCreep(40, 200)
const cFire2 = createCombat({ player: fireP2, targets: [fireHit2], weapon: fireW2 })
cFire2.applyUpgrade('siwa')
assert('siwa picks', fireW2.siwaPicks === 1)
cFire2.tryFire(1)
for (let i = 0; i < 30; i++) cFire2.update(0.016)
assert('ignite applied', fireHit2.burnLeft > 2 && fireHit2.burnLeft <= FIRE_DURATION_SEC)
assert('ignite dps 30% atk', Math.abs(fireHit2.burnDps - ATTACK_BASE * 0.3) < 1e-9)
const hpAfterHit = fireHit2.hp
for (let i = 0; i < 60; i++) cFire2.update(1 / 60)
assert('burn tick ~6 per sec', Math.abs(fireHit2.hp - hpAfterHit + ATTACK_BASE * 0.3) < 0.01)

const waterP2 = mkFireP()
const waterW2 = createBow()
const waterHit2 = makeCreep(40, 200)
const cWater2 = createCombat({ player: waterP2, targets: [waterHit2], weapon: waterW2 })
cWater2.applyUpgrade('wuwa')
cWater2.applyUpgrade('wuwa')
cWater2.tryFire(1)
for (let i = 0; i < 20; i++) cWater2.update(0.016)
assert('slow factor 0.8', Math.abs(waterHit2.slowFactor - 0.8) < 1e-9)
assert('slow left > 0.1', waterHit2.slowLeft > 0.1)

const kbP2 = mkFireP()
const kbW2 = createBow()
const kbHit2 = makeCreep(40, 200)
const p25KbC = createCombat({ player: kbP2, targets: [kbHit2], weapon: kbW2 })
p25KbC.applyUpgrade('knockback')
assert('knockback picks', kbW2.knockbackPicks === 1)
p25KbC.tryFire(1)
for (let i = 0; i < 30; i++) p25KbC.update(0.016)
assert('knockback +1 BODY advanced', Math.abs(kbHit2.x - (player.x + 40 + BODY * 3.5)) < 0.5)

const pulseP2 = mkFireP()
const pulseW2 = createBow()
const pulseHit2 = makeCreep(BODY, 200)
const cPulse2 = createCombat({ player: pulseP2, targets: [pulseHit2], weapon: pulseW2 })
cPulse2.setVajraComplete(true)
assert('vajra flag', cPulse2.getVajraComplete() === true && pulseW2.vajraComplete === true)
cPulse2.update(PULSE_INTERVAL_SEC)
assert('pulse dmg attack×1.3', Math.abs(pulseHit2.hp - (200 - ATTACK_BASE * PULSE_DMG_MUL)) < 1e-9)
assert('pulse slow 30%/0.4s', Math.abs(pulseHit2.slowFactor - (1 - PULSE_SLOW)) < 1e-9 && pulseHit2.slowLeft === PULSE_SLOW_SEC)
assert('pulse constants', PULSE_RADIUS_MUL === 1.5 && PULSE_DMG_MUL === 1.3 && PULSE_SLOW === 0.3 && PULSE_SLOW_SEC === 0.4)

{
  const gW2 = createBow()
  gW2.applyUpgrade('giant')
  assert('giant base 1.4', Math.abs(gW2.sizeMul - 1.4) < 1e-9)
  gW2.setVajraComplete(true)
  assert('giant boost 1.5', Math.abs(gW2.sizeMul - 1.5) < 1e-9)
  assert('giantSizeMul boost', Math.abs(giantSizeMul(1, true) - 1.5) < 1e-9)
}

const fbP2 = mkFireP()
const fbW2 = createBow()
fbW2.applyUpgrade('siwa')
fbW2.setVajraComplete(true)
const fbHit2 = makeCreep(40, 200)
const cFb2 = createCombat({ player: fbP2, targets: [fbHit2], weapon: fbW2 })
cFb2.tryFire(1)
for (let i = 0; i < 30; i++) cFb2.update(0.016)
assert('fire boost dps 40%', Math.abs(fbHit2.burnDps - ATTACK_BASE * 0.4) < 1e-9)

// P28 B2/B3：伤害数字传实际伤害（不按剩余血量截断）+ 暴击倍率信息
const truncP = mkFireP()
const truncW = createBow()
const truncHit = makeCreep(40, 5)
// 真实敌人 takeHit：hp 会被钳到 0，且返回实扣（血量封顶）。用它才能验证「显示不按余血截断」。
truncHit.takeHit = (dmg) => {
  const before = truncHit.hp
  const dealt = Math.min(before, dmg)
  truncHit.hp = Math.max(0, before - dmg)
  return dealt
}
const truncLog = []
const cTrunc = createCombat({
  player: truncP,
  targets: [truncHit],
  weapon: truncW,
  hooks: { onDamage: (t, d, meta) => truncLog.push({ t, d, meta }) },
})
cTrunc.tryFire(1)
for (let i = 0; i < 30; i++) cTrunc.update(0.016)
assert('damage not truncated by hp', truncLog.length >= 1 && truncLog[0].d === DMG_MAX)
assert('non-crit meta', truncLog[0].meta && truncLog[0].meta.crit === false && truncLog[0].meta.critMul === 1)

const critP = mkFireP()
const critW = createBow()
critW.critRate = 100
const critHit = makeCreep(40, 200)
const critLog = []
const cCrit = createCombat({
  player: critP,
  targets: [critHit],
  weapon: critW,
  hooks: { onDamage: (t, d, meta) => critLog.push({ t, d, meta }) },
})
cCrit.tryFire(1)
for (let i = 0; i < 30; i++) cCrit.update(0.016)
assert('crit dmg full', critLog.length >= 1 && Math.abs(critLog[0].d - DMG_MAX * CRIT_DAMAGE_MUL) < 1e-9)
assert('crit meta', critLog[0].meta.crit === true && critLog[0].meta.critMul === CRIT_DAMAGE_MUL && Math.abs(critLog[0].meta.base - DMG_MAX) < 1e-9)

// P42 批次2 R1：荆棘（受击时对 4 身位内活敌结算一次伤害；掷暴击；不附带点燃/减速/击退）
const thornBurstOf = (c, origin) => (typeof c?.thornBurst === 'function' ? c.thornBurst(origin) : undefined)
const thornPicksOf = (c) => (typeof c?.getThornPicks === 'function' ? c.getThornPicks() : undefined)
const setThornPicksOn = (c, n) => {
  if (typeof c?.setThornPicks === 'function') c.setThornPicks(n)
}

{
  const thornP = mkFireP()
  const thornW = createBow()
  const tIn = makeCreep(BODY, 400)
  // P42 批次5 R1：半径改为「2 身位起、每多 1 层 +0.5 身位」，1 层边界就是 2 身位。
  const tEdge = makeCreep(BODY * 2, 400)
  const tOut = makeCreep(BODY * 2 + 1, 400)
  const cThorn = createCombat({ player: thornP, targets: [tIn, tEdge, tOut], weapon: thornW })
  setThornPicksOn(cThorn, 1)
  assert('thorn picks setter', thornPicksOf(cThorn) === 1)
  thornBurstOf(cThorn, thornP)
  assert(
    'thorn burst 1 pick dmg 150%',
    tIn.hp === 400 - ATTACK_BASE * 1.5 && tEdge.hp === 400 - ATTACK_BASE * 1.5,
  )
  assert('thorn range base 2 body', BODY * 2 === 44 && tEdge.hp < 400 && tOut.hp === 400)

  const t2 = makeCreep(BODY, 400)
  const cThorn2 = createCombat({ player: mkFireP(), targets: [t2], weapon: createBow() })
  setThornPicksOn(cThorn2, 2)
  thornBurstOf(cThorn2)
  assert('thorn burst 2 picks 200%', t2.hp === 400 - ATTACK_BASE * 2)

  const t0 = makeCreep(BODY, 400)
  const cThorn0 = createCombat({ player: mkFireP(), targets: [t0], weapon: createBow() })
  setThornPicksOn(cThorn0, 0)
  thornBurstOf(cThorn0)
  assert('thorn 0 picks no dmg', t0.hp === 400)

  const critW = createBow()
  critW.critRate = 100
  const tCrit = makeCreep(BODY, 400)
  const critMeta = []
  const cThornCrit = createCombat({
    player: mkFireP(),
    targets: [tCrit],
    weapon: critW,
    hooks: { onDamage: (t, d, meta) => critMeta.push({ t, d, meta }) },
  })
  setThornPicksOn(cThornCrit, 1)
  thornBurstOf(cThornCrit)
  assert(
    'thorn burst can crit',
    tCrit.hp === 400 - ATTACK_BASE * 1.5 * CRIT_DAMAGE_MUL &&
      critMeta.length === 1 &&
      critMeta[0].meta.crit === true &&
      Math.abs(critMeta[0].d - ATTACK_BASE * 1.5 * CRIT_DAMAGE_MUL) < 1e-9,
  )

  const statusW = createBow()
  statusW.applyUpgrade('siwa')
  statusW.applyUpgrade('wuwa')
  statusW.applyUpgrade('knockback')
  const tStatus = makeCreep(BODY, 400)
  const statusX = tStatus.x
  const cThornStatus = createCombat({ player: mkFireP(), targets: [tStatus], weapon: statusW })
  setThornPicksOn(cThornStatus, 1)
  thornBurstOf(cThornStatus)
  assert(
    'thorn burst no burn/slow/knockback',
    tStatus.hp === 400 - ATTACK_BASE * 1.5 &&
      !(tStatus.burnLeft > 0) &&
      !(tStatus.slowLeft > 0) &&
      tStatus.x === statusX,
  )

  // P42 批次5 R1：半径 = BODY × (2 + 0.5 × (层数 − 1))；伤害倍率不变（1.5 + 0.5 × (层数 − 1)）；0 层零伤害。
  const grow2In = makeCreep(BODY * 2.5, 400)
  const grow2Out = makeCreep(BODY * 2.5 + 1, 400)
  const cGrow2 = createCombat({ player: mkFireP(), targets: [grow2In, grow2Out], weapon: createBow() })
  setThornPicksOn(cGrow2, 2)
  thornBurstOf(cGrow2)
  const grow3In = makeCreep(BODY * 3, 400)
  const grow3Out = makeCreep(BODY * 3 + 1, 400)
  const cGrow3 = createCombat({ player: mkFireP(), targets: [grow3In, grow3Out], weapon: createBow() })
  setThornPicksOn(cGrow3, 3)
  thornBurstOf(cGrow3)
  assert(
    'thorn range grows 0.5 per pick',
    grow2In.hp === 400 - ATTACK_BASE * 2 && // 2 层：2.5 身位内命中（伤害倍率 ×2 不变）
      grow2Out.hp === 400 &&
      grow3In.hp === 400 - ATTACK_BASE * 2.5 && // 3 层：3 身位内命中（×2.5）
      grow3Out.hp === 400,
  )
  // 旧口径「固定 4 身位」在 1 层时已作废：4 身位处的敌人必须吃不到（标题保留旧子串，避免历史 grep 断链）。
  const far4 = makeCreep(BODY * 4, 400)
  const cFar4 = createCombat({ player: mkFireP(), targets: [far4], weapon: createBow() })
  setThornPicksOn(cFar4, 1)
  thornBurstOf(cFar4)
  assert('thorn range 4 body no longer hits', far4.hp === 400)
  const mul3 = makeCreep(BODY, 400)
  const cMul3 = createCombat({ player: mkFireP(), targets: [mul3], weapon: createBow() })
  setThornPicksOn(cMul3, 3)
  thornBurstOf(cMul3)
  assert(
    'thorn dmg mul unchanged',
    tIn.hp === 400 - ATTACK_BASE * 1.5 && // 1 层 ×1.5
      t2.hp === 400 - ATTACK_BASE * 2 && // 2 层 ×2.0
      mul3.hp === 400 - ATTACK_BASE * 2.5 && // 3 层 ×2.5
      t0.hp === 400, // 0 层零伤害
  )
}

// P42 批次3 R1/R2/R3：power「激发力量」战斗侧（连射 / 贯穿强化 / sp-power）
// 断言统一用可选调用（applyPowerOn）——接口未实现时只 FAIL 这几条，不打断整个 selftest，便于自证伪。
{
  const powerCombat = (rng, upgrades = []) => {
    const w = createBow()
    const c = createCombat({ player: mkFireP(), targets: [], weapon: w, rng })
    for (const id of upgrades) c.applyUpgrade(id)
    return c
  }
  const applyPowerOn = (c, id) =>
    typeof c?.applyPower === 'function' ? c.applyPower(id) : undefined
  const extras = (c) => c.bullets.filter((b) => b.extra === true).length
  // P42 批次5 R3：额外发比主发晚 0.2s，靠 update(dt) 真实计时推进（13 帧 ≈ 0.2167s > 0.2s）。
  const advance = (c, frames = 13) => {
    for (let i = 0; i < frames; i++) c.update(1 / 60)
  }

  // R1① applyPower 入口：rapid / pierce_amp / sp 归本模块处理；steady 及其它 id 返回 false。
  const cApply = powerCombat(() => 0.9)
  assert(
    'power rapid apply',
    typeof cApply.applyPower === 'function' &&
      applyPowerOn(cApply, 'rapid') === true &&
      applyPowerOn(cApply, 'rapid') === true &&
      applyPowerOn(cApply, 'steady') === false &&
      applyPowerOn(cApply, 'unknown_power') === false,
  )

  // R1② 不蓄力 50%：固定 rng 两侧各验一次（0.40 < 0.5 排定额外发；0.60 不排定）；额外发晚 0.2s 落地。
  const cRapidLow = powerCombat(() => 0.4)
  applyPowerOn(cRapidLow, 'rapid')
  cRapidLow.tryFire(0)
  const cRapidHigh = powerCombat(() => 0.6)
  applyPowerOn(cRapidHigh, 'rapid')
  cRapidHigh.tryFire(0)
  assert(
    'power rapid uncharged 50%',
    RAPID_UNCHARGED_CHANCE === 0.5 &&
      extras(cRapidLow) === 0 &&
      extras(cRapidHigh) === 0 &&
      (advance(cRapidLow), cRapidLow.bullets.length === 2 && extras(cRapidLow) === 1) &&
      (advance(cRapidHigh), cRapidHigh.bullets.length === 1 && extras(cRapidHigh) === 0),
  )

  // R1② 蓄力 100%：即使 rng 落在不触发侧，也排定额外发；额外发排在主发之后、晚 0.2s 落地。
  const cRapidFull = powerCombat(() => 0.99)
  applyPowerOn(cRapidFull, 'rapid')
  cRapidFull.tryFire(1)
  const fullSameFrame = cRapidFull.bullets.length
  advance(cRapidFull)
  assert(
    'power rapid charged 100%',
    fullSameFrame === 1 &&
      cRapidFull.bullets.length === 2 &&
      extras(cRapidFull) === 1 &&
      cRapidFull.bullets[0].extra !== true &&
      cRapidFull.bullets[1].extra === true,
  )

  // R1③ 额外发自带 0.75s 冷却（独立于武器 0.48s 攻击间隔）：冷却中蓄力也不排定，冷却到了才再排定。
  const cRapidCd = powerCombat(() => 0.99)
  applyPowerOn(cRapidCd, 'rapid')
  cRapidCd.tryFire(1)
  advance(cRapidCd)
  const rapidFirst = extras(cRapidCd)
  cRapidCd.weapon.fireCd = 0
  cRapidCd.bullets.length = 0
  cRapidCd.tryFire(1) // 攻击间隔已归零，但额外发冷却（0.75）未到
  advance(cRapidCd)
  const rapidDuringCd = extras(cRapidCd)
  cRapidCd.update(RAPID_EXTRA_CD_SEC)
  cRapidCd.weapon.fireCd = 0
  cRapidCd.bullets.length = 0
  cRapidCd.tryFire(1) // 冷却已到
  advance(cRapidCd)
  const rapidAfterCd = extras(cRapidCd)
  assert(
    'power rapid extra cd 0.75',
    RAPID_EXTRA_CD_SEC === 0.75 &&
      FIRE_INTERVAL === 0.48 &&
      rapidFirst === 1 &&
      rapidDuringCd === 0 &&
      rapidAfterCd === 1,
  )

  // R1④ 额外发吃既有加成（散射 / 大娃 / 攻击加成），且不改变主发：主发 2 支 + 额外 2 支，参数一一对应。
  const cBonus = powerCombat(() => 0.1, ['ammo_cap', 'giant'])
  applyPowerOn(cBonus, 'rapid')
  cBonus.tryFire(1)
  const mainShots = cBonus.bullets.filter((b) => b.extra !== true)
  advance(cBonus)
  const extraShots = cBonus.bullets.filter((b) => b.extra === true)
  const mainAngs = mainShots.map((b) => b.ang).sort((x, y) => x - y)
  const extraAngs = extraShots.map((b) => b.ang).sort((x, y) => x - y)
  assert(
    'power rapid extra eats existing bonuses',
    mainShots.length === 2 &&
      extraShots.length === 2 &&
      extraShots.every((b) => b.damage === mainShots[0].damage) &&
      extraShots.every((b) => Math.abs(b.sizeMul - mainShots[0].sizeMul) < 1e-9) &&
      extraAngs.length === mainAngs.length &&
      extraAngs.every((ang, i) => Math.abs(ang - mainAngs[i]) < 1e-9),
  )

  // R2① 贯穿强化：穿透 +1（唯一项，幂等），可与既有「穿透」升级叠加。
  const ampW = createBow()
  const cAmp = createCombat({ player: mkFireP(), targets: [], weapon: ampW })
  const ampApplied = applyPowerOn(cAmp, 'pierce_amp')
  const ampBonus1 = ampW.pierceBonus
  applyPowerOn(cAmp, 'pierce_amp')
  const ampBonus2 = ampW.pierceBonus
  cAmp.tryFire(1)
  const ampPierceLeft = cAmp.bullets[0]?.pierceLeft
  cAmp.applyUpgrade('pierce')
  assert(
    'power pierce_amp +1 pierce',
    ampApplied === true &&
      ampBonus1 === 1 &&
      ampBonus2 === 1 &&
      ampPierceLeft === pierceForChar('ranger', 1, 1) &&
      ampPierceLeft === 2 &&
      ampW.pierceBonus === 2,
  )

  // R2② 每穿 1 敌本次伤害 +50%：0 穿 ×1、1 穿 ×1.5、2 穿 ×2（满蓄 40 → 40 / 60 / 80）。
  const a1 = makeCreep(36, 500)
  const a2 = makeCreep(90, 500)
  const a3 = makeCreep(144, 500)
  const cAmpHit = createCombat({ player: mkFireP(), targets: [a1, a2, a3], weapon: createBow() })
  applyPowerOn(cAmpHit, 'pierce_amp')
  cAmpHit.tryFire(1)
  for (let i = 0; i < 60; i++) cAmpHit.update(0.016)
  assert(
    'power pierce_amp +50% per pierce',
    PIERCE_AMP_STEP === 0.5 &&
      a1.hp === 500 - DMG_MAX &&
      a2.hp === 500 - DMG_MAX * 1.5 &&
      a3.hp === 500 - DMG_MAX * 2,
  )

  // R3 sp-power：攻击 +20，可重复获得、可叠（两次 +40），走「力量 +10」同一条攻击加成通道。
  const spP = mkFireP()
  const spW = createBow()
  const cSp = createCombat({ player: spP, targets: [], weapon: spW })
  const spOnce = applyPowerOn(cSp, 'sp')
  const spAtk1 = spW.attack
  const spTwice = applyPowerOn(cSp, 'sp')
  const spAtk2 = spW.attack
  assert(
    'power sp +20 stackable',
    spOnce === true &&
      spTwice === true &&
      SP_POWER_DMG === 20 &&
      spAtk1 === ATTACK_BASE + 20 &&
      spAtk2 === ATTACK_BASE + 40 &&
      spW.dmgBonus === 40 &&
      spP.attack === ATTACK_BASE + 40,
  )
}

// P42 批次5 R2/R3/R4：精益求精新公式 / 连射 0.2s 延迟 / 定神临时 +100 暴击率
{
  const mkRapidC = (rng) => createCombat({ player: mkFireP(), targets: [], weapon: createBow(), rng })
  const applyPower2 = (c, id) =>
    typeof c?.applyPower === 'function' ? c.applyPower(id) : undefined
  const extras2 = (c) => c.bullets.filter((b) => b.extra === true).length
  const advance2 = (c, frames = 13) => {
    for (let i = 0; i < frames; i++) c.update(1 / 60)
  }

  // R2① 每次「精益求精」+5 暴击率（可叠），层数照旧 +1。
  const refineW = createBow()
  const refineC = createCombat({ player: mkFireP(), targets: [], weapon: refineW })
  const critBefore = refineW.critRate
  const refineOnce = refineC.applyUpgrade('refine')
  const critAfter1 = refineW.critRate
  const refineTwice = refineC.applyUpgrade('refine')
  const critAfter2 = refineW.critRate
  assert(
    'refine adds 5 crit rate',
    REFINE_CRIT_RATE_PER_PICK === 5 &&
      critBefore === 0 &&
      refineOnce === true &&
      critAfter1 === 5 &&
      refineTwice === true &&
      critAfter2 === 10 &&
      refineW.refinePicks === 2 &&
      refineW.dmgBonus === 0,
  )

  // P42 批次6 R1：倍率 = 1.5 + 0.02 × (暴击率 / 3) × 层数（**连续算式**，不对 rate/3 取整）；层数 0 恒为 1.5。
  assert(
    'refine crit dmg per 3 rate',
    REFINE_CRIT_STEP === 3 &&
      REFINE_CRIT_DMG_PER_STEP === 0.02 &&
      Math.abs(critDamageMul(0, 1) - 1.5) < 1e-9 &&
      Math.abs(critDamageMul(3, 1) - 1.52) < 1e-9 &&
      Math.abs(critDamageMul(9, 1) - 1.56) < 1e-9 &&
      Math.abs(critDamageMul(30, 1) - 1.7) < 1e-9 &&
      critDamageMul(9, 0) === 1.5,
  )

  // P42 批次6 R1①：旧版 ceil(rate/3) 档位已作废（标题保留旧子串，避免 TASK-033 的历史 grep 断链）——
  // 现在 4 → 1.526…、7 → 1.546…、100 → 2.166…，既不是 ceil 档（1.54/1.56/2.18）也不是 floor 档。
  assert(
    'refine ceil rounding no longer applied',
    Math.abs(critDamageMul(4, 1) - 1.5266666666666666) < 1e-9 &&
      Math.abs(critDamageMul(7, 1) - 1.5466666666666666) < 1e-9 &&
      Math.abs(critDamageMul(100, 1) - 2.166666666666667) < 1e-9 &&
      Math.abs(critDamageMul(100, 1) - 2.18) > 1e-6 && // 不是 ceil 版
      Math.abs(critDamageMul(100, 1) - 2.16) > 1e-6, // 也不是 floor 版
  )

  // 按层数相乘（不是相加）。
  assert(
    'refine stacks by picks',
    Math.abs(critDamageMul(9, 2) - 1.62) < 1e-9 && // 1.5 + 0.02×3×2
      Math.abs(critDamageMul(9, 3) - 1.68) < 1e-9 && // 1.5 + 0.02×3×3
      Math.abs(critDamageMul(9, 1) - 1.56) < 1e-9 &&
      refineW.refinePicks === 2,
  )

  // 暴击率不设上限：超过 100 的部分照常进倍率（概率侧仍封顶 100）。
  assert(
    'refine counts over 100 rate',
    critChanceForRoll(120) === 100 &&
      Math.abs(critDamageMul(120, 1) - 2.3) < 1e-9 && // 1.5 + 0.02×40
      Math.abs(critDamageMul(150, 1) - 2.5) < 1e-9 && // 1.5 + 0.02×50
      Math.abs(critDamageMul(120, 2) - 3.1) < 1e-9, // ×2 层
  )

  // 端到端：暴击率 100（暴击 ×10）+ 精益求精 ×1 → 105 → 连续倍率 ×2.2 → 88（整数）实战生效。
  const liveRefineW = createBow()
  const liveRefineP = mkFireP()
  const liveRefineHit = makeCreep(40, 400)
  const liveRefineC = createCombat({
    player: liveRefineP,
    targets: [liveRefineHit],
    weapon: liveRefineW,
  })
  for (let i = 0; i < 10; i++) liveRefineC.applyUpgrade('crit')
  liveRefineC.applyUpgrade('refine')
  liveRefineC.tryFire(1)
  for (let i = 0; i < 30; i++) liveRefineC.update(0.016)
  assert(
    'refine live crit dmg',
    liveRefineW.critRate === 105 &&
      liveRefineW.refinePicks === 1 &&
      Math.abs(critDamageMul(105, 1) - 2.2) < 1e-9 &&
      liveRefineHit.hp === 400 - 88,
  )

  // R3 常量与计时：额外发晚 0.2s、不在同一帧生成、用 update(dt) 推进（12~14 帧 ≈ 0.2s）。
  const delayC = mkRapidC(() => 0.99)
  applyPower2(delayC, 'rapid')
  delayC.tryFire(1)
  const delaySameFrame = extras2(delayC)
  let framesToExtra = -1
  for (let i = 1; i <= 20; i++) {
    delayC.update(1 / 60)
    if (extras2(delayC) > 0) {
      framesToExtra = i
      break
    }
  }
  assert(
    'rapid extra delay 0.2',
    RAPID_EXTRA_DELAY_SEC === 0.2 &&
      delaySameFrame === 0 &&
      framesToExtra >= 12 &&
      framesToExtra <= 14,
  )

  // R3 不在同一帧：主发那一帧只有主发；推进一帧仍未出；0.2s 后才出。
  const nsfC = mkRapidC(() => 0.99)
  applyPower2(nsfC, 'rapid')
  nsfC.tryFire(1)
  const nsfFrame0 = { total: nsfC.bullets.length, extra: extras2(nsfC) }
  nsfC.update(1 / 60)
  const nsfFrame1 = { total: nsfC.bullets.length, extra: extras2(nsfC) }
  for (let i = 0; i < 20; i++) nsfC.update(1 / 60)
  assert(
    'rapid extra not same frame',
    nsfFrame0.total === 1 &&
      nsfFrame0.extra === 0 &&
      nsfFrame1.total === 1 &&
      nsfFrame1.extra === 0 &&
      extras2(nsfC) === 1,
  )

  // R3 额外冷却仍是 0.75s、主发间隔 0.48s 不受影响（延迟只是把落点推后 0.2s）。
  const cdKeepC = mkRapidC(() => 0.99)
  applyPower2(cdKeepC, 'rapid')
  cdKeepC.tryFire(1)
  const cdAfterSchedule = cdKeepC.getRapidCooldown()
  const mainFireCd = cdKeepC.weapon.fireCd
  advance2(cdKeepC)
  const cdExtra1 = extras2(cdKeepC)
  cdKeepC.weapon.fireCd = 0
  cdKeepC.bullets.length = 0
  cdKeepC.tryFire(1) // 额外冷却未到 → 不排定
  advance2(cdKeepC)
  const cdExtraBlocked = extras2(cdKeepC)
  cdKeepC.update(RAPID_EXTRA_CD_SEC)
  cdKeepC.weapon.fireCd = 0
  cdKeepC.bullets.length = 0
  cdKeepC.tryFire(1) // 冷却已到 → 再排定
  advance2(cdKeepC)
  const cdExtra2 = extras2(cdKeepC)
  assert(
    'rapid extra cd unchanged 0.75',
    RAPID_EXTRA_CD_SEC === 0.75 &&
      FIRE_INTERVAL === 0.48 &&
      Math.abs(cdAfterSchedule - RAPID_EXTRA_CD_SEC) < 1e-9 &&
      Math.abs(mainFireCd - FIRE_INTERVAL) < 1e-9 &&
      cdExtra1 === 1 &&
      cdExtraBlocked === 0 &&
      cdExtra2 === 1,
  )

  // R4 定神：本发暴击率临时 +100（只作用一次），基础 0 时必暴、下一发立刻回到原暴击率。
  const mkSteadyP = () => {
    const p = { ...mkFireP(), steadyArmed: true, steadyCalls: 0 }
    p.consumeSteadyCrit = function () {
      this.steadyCalls += 1
      if (!this.steadyArmed) return false
      this.steadyArmed = false
      return true
    }
    return p
  }
  const steadyP1 = mkSteadyP()
  const steadyW1 = createBow()
  const steadyC1 = createCombat({ player: steadyP1, targets: [], weapon: steadyW1 })
  steadyC1.tryFire(1)
  const steadyShot = steadyC1.bullets[0]
  steadyC1.weapon.fireCd = 0
  steadyC1.bullets.length = 0
  steadyC1.tryFire(1)
  const afterSteadyShot = steadyC1.bullets[0]
  assert(
    'steady adds 100 crit rate',
    STEADY_CRIT_RATE_BONUS === 100 &&
      steadyShot.crit === true &&
      Math.abs(steadyShot.damage - DMG_MAX * 1.5) < 1e-9 &&
      afterSteadyShot.crit === false &&
      Math.abs(afterSteadyShot.damage - DMG_MAX) < 1e-9,
  )

  // R4 那 100 点同时进 critDamageMul 档位，所以能吃精益求精（基础 30 + 100 = 130 → 44 档 × 2 层）。
  const steadyP2 = mkSteadyP()
  const steadyW2 = createBow()
  const steadyC2 = createCombat({ player: steadyP2, targets: [], weapon: steadyW2 })
  steadyC2.applyUpgrade('crit')
  steadyC2.applyUpgrade('crit')
  steadyC2.applyUpgrade('refine')
  steadyC2.applyUpgrade('refine')
  steadyC2.tryFire(1)
  const steadyFed = steadyC2.bullets[0]
  assert(
    'steady feeds refine',
    steadyW2.critRate === 30 &&
      steadyW2.refinePicks === 2 &&
      // 批次6：连续算式（不再 ceil 档位）→ 1.5 + 0.02 × (130/3) × 2 = 3.2333…，伤害 ceil 后 130
      Math.abs(critDamageMul(130, 2) - 3.2333333333333334) < 1e-9 &&
      steadyFed.crit === true &&
      steadyFed.damage === 130,
  )

  // R4 只作用一次：连续三次攻击，只有第一发暴击，且之后暴击率立刻回原值。
  const steadyP3 = mkSteadyP()
  const steadyW3 = createBow()
  const steadyC3 = createCombat({ player: steadyP3, targets: [], weapon: steadyW3 })
  const steadyShots = []
  for (let i = 0; i < 3; i++) {
    steadyC3.weapon.fireCd = 0
    steadyC3.bullets.length = 0
    steadyC3.tryFire(1)
    steadyShots.push({
      crit: steadyC3.bullets[0].crit,
      damage: steadyC3.bullets[0].damage,
      calls: steadyP3.steadyCalls,
    })
  }
  assert(
    'steady only once',
    steadyShots[0].crit === true &&
      steadyShots[0].calls === 1 &&
      steadyShots[1].crit === false &&
      steadyShots[2].crit === false &&
      steadyShots[1].calls === 2 &&
      steadyShots[1].damage === DMG_MAX &&
      steadyShots[2].damage === DMG_MAX,
  )
}

// P42 批次6 修补（ROUND-014 TASK-042）：精益求精连续算式 / 伤害向上取整 / 定神 +100 进连续倍率
{
  // R1 连续算式：1.5 + 0.02 × (rate / 3) × picks —— 不对 rate/3 取整
  assert(
    'refine mul continuous no rounding',
    Math.abs(critDamageMul(7, 1) - 1.5466666666666666) < 1e-9 && // 7/3 不再爬档
      Math.abs(critDamageMul(4, 1) - 1.5266666666666666) < 1e-9 &&
      Math.abs(critDamageMul(100, 1) - 2.166666666666667) < 1e-9 &&
      Math.abs(critDamageMul(7, 1) - 1.56) > 1e-6 && // 旧 ceil 档位
      Math.abs(critDamageMul(7, 1) - 1.5) > 1e-6, // 旧 floor 档位
  )

  // R1 每 3 点暴击率 +0.02 倍率（manifest 参考值：rate 30 → 1.70、rate 120 → 2.30）
  assert(
    'refine mul per 3 rate 0.02',
    REFINE_CRIT_STEP === 3 &&
      REFINE_CRIT_DMG_PER_STEP === 0.02 &&
      Math.abs(critDamageMul(3, 1) - 1.52) < 1e-9 &&
      Math.abs(critDamageMul(30, 1) - 1.7) < 1e-9 &&
      Math.abs(critDamageMul(100, 1) - 2.166666666666667) < 1e-9 &&
      Math.abs(critDamageMul(120, 1) - 2.3) < 1e-9,
  )

  // R1 按层数相乘（manifest 参考值：3 层 rate 100 → 3.50）
  assert(
    'refine mul scales by picks',
    Math.abs(critDamageMul(9, 1) - 1.56) < 1e-9 &&
      Math.abs(critDamageMul(9, 2) - 1.62) < 1e-9 &&
      Math.abs(critDamageMul(9, 3) - 1.68) < 1e-9 &&
      Math.abs(critDamageMul(100, 2) - 2.8333333333333335) < 1e-9 &&
      Math.abs(critDamageMul(100, 3) - 3.5) < 1e-9,
  )

  // R1② 精益求精 0 层恒为 1.5（rate 多大都一样）
  assert(
    'refine mul 0 picks 1.5',
    critDamageMul(0, 0) === 1.5 &&
      critDamageMul(0, 1) === 1.5 &&
      critDamageMul(100, 0) === 1.5 &&
      critDamageMul(500, 0) === 1.5,
  )

  // R2 伤害向上取整助手：非整数进位、整数幂等、非有限值兜底 0
  assert(
    'damage ceil integer',
    ceilDamage(12.3) === 13 &&
      ceilDamage(0.4) === 1 &&
      ceilDamage(62.5) === 63 &&
      ceilDamage(40) === 40 &&
      ceilDamage(0) === 0 &&
      ceilDamage(88.00000000000001) === 89 && // 纯 Math.ceil，不做 epsilon 兜底
      ceilDamage(Number.NaN) === 0,
  )

  // R2 非暴击路径实战：战士半蓄 22×1.3=28.6 → 29；法师满蓄 25×1.5=37.5 → 38，
  // 且飘字（onDamage 的 d）与扣血完全一致、都是整数。
  {
    const wHit = makeCreep(40, 200)
    const wCombat = createCombat({
      player: mkFireP('warrior'),
      targets: [wHit],
      weapon: createBow({ charId: 'warrior' }),
    })
    wCombat.tryFire(0.5)
    const warriorDmg = wCombat.bullets[0].damage
    const mHit = makeCreep(40, 200)
    const mLog = []
    const mCombat = createCombat({
      player: mkFireP('mage'),
      targets: [mHit],
      weapon: createBow({ charId: 'mage' }),
      hooks: { onDamage: (t, d) => mLog.push(d) },
    })
    mCombat.tryFire(1)
    const mageDmg = mCombat.bullets[0].damage
    for (let i = 0; i < 30; i++) mCombat.update(0.016)
    assert(
      'damage ceil non crit',
      warriorDmg === 29 &&
        Number.isInteger(warriorDmg) &&
        mageDmg === 38 &&
        Number.isInteger(mageDmg) &&
        mHit.hp === 200 - 38 &&
        mLog.length === 1 &&
        mLog[0] === 38 &&
        Number.isInteger(mLog[0]),
    )
  }

  // R3 定神 +100 是「真实暴击率」，照常进连续倍率：直接构造「基础 0 + 100」= 100 →
  // 1.5 + 0.02 × (100 / 3) × 2 = 2.8333…（旧 ceil 口径会给 2.86 → 115，与本断言不同）
  {
    const steadyP = { ...mkFireP(), steadyArmed: true }
    steadyP.consumeSteadyCrit = function () {
      if (!this.steadyArmed) return false
      this.steadyArmed = false
      return true
    }
    const steadyW = createBow()
    steadyW.refinePicks = 2 // 基础暴击率仍为 0，纯构造「0 + 100」
    const steadyC = createCombat({ player: steadyP, targets: [], weapon: steadyW })
    steadyC.tryFire(1)
    const steadyShot = steadyC.bullets[0]
    assert(
      'steady 100 feeds continuous mul',
      steadyW.critRate === 0 &&
        STEADY_CRIT_RATE_BONUS === 100 &&
        Math.abs(critDamageMul(0 + STEADY_CRIT_RATE_BONUS, 2) - 2.8333333333333335) < 1e-9 &&
        steadyShot.crit === true &&
        steadyShot.damage === 114,
    )
  }
}

console.log(
  `\ncharge=${CHARGE_MAX_SEC}s attack=${ATTACK_BASE} full×2 interval=${FIRE_INTERVAL}s BODY=${BODY}`,
)
if (failed) {
  console.log(`RESULT  FAIL (${failed})`)
  process.exit(1)
}
console.log('RESULT  PASS')
