/**
 * M5 蓄力箭自测。运行：在 frontend/ 下 `node src/game/combat/selftest.mjs`
 */
import { BODY, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  ATTACK_BASE,
  CHARGE_MAX_SEC,
  CHARGE_UPGRADE,
  DMG_MAX,
  DMG_MIN,
  DUAL_SPREAD_DEG,
  FIRE_INTERVAL,
  HIT_RADIUS,
  KNOCKBACK_DIST,
  POWER_DMG,
  SCATTER_DMG_PENALTY,
  applyKnockback,
  chargeRatio,
  createBow,
  createCombat,
  damageForCharge,
  fireAngles,
  giantSizeMul,
  knockbackForCharge,
  pierceForCharge,
  shotDamage,
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
assert('giant 1st ×2', giantSizeMul(1) === 2)
assert('giant 2nd ×2.5', giantSizeMul(2) === 2.5)

const creep = makeCreep(40)
const combat = createCombat({ player, targets: [creep], weapon: bow })
assert('tryFire full', combat.tryFire(1) === true)
assert('one arrow', combat.bullets.length === 1)
assert('attackT set', player.attackT > 0)
for (let i = 0; i < 30; i++) combat.update(0.016)
assert('full dmg 40', creep.hp === 80 - DMG_MAX)
assert(
  'full knockback 2 BODY',
  Math.abs(creep.x - (player.x + 40 + BODY * 2)) < 0.5,
)

const tap = makeCreep(40)
const cTap = createCombat({ player, targets: [tap] })
cTap.beginCharge()
assert('charging on', player.charging === true && cTap.charging === true)
cTap.releaseCharge()
for (let i = 0; i < 30; i++) cTap.update(0.016)
assert('tap dmg 20', tap.hp === 80 - DMG_MIN)
assert('tap kb 1 BODY', Math.abs(tap.x - (player.x + 40 + BODY)) < 0.5)

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

const snailTap = makeCreep(40)
snailTap.knockbackResist = BODY
const cSnail = createCombat({ player, targets: [snailTap] })
const snailX = snailTap.x
cSnail.tryFire(0)
for (let i = 0; i < 30; i++) cSnail.update(0.016)
assert('combat uncharged + resist → 0 kb', Math.abs(snailTap.x - snailX) < 0.5)

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
assert('giant radius ×2', Math.abs(cG.bullets[0].radius - HIT_RADIUS * 2) < 1e-9)
cG.applyUpgrade('giant')
cG.weapon.fireCd = 0
cG.bullets.length = 0
cG.tryFire(1)
assert('giant 2nd ×2.5', Math.abs(cG.bullets[0].sizeMul - 2.5) < 1e-9)

const ch = createBow()
const cCh = createCombat({ player, targets: [], weapon: ch })
assert('charge -0.20', cCh.applyUpgrade('reload') === true && Math.abs(ch.chargeMax - 0.55) < 1e-9)
cCh.applyUpgrade('reload')
cCh.applyUpgrade('reload')
cCh.applyUpgrade('reload')
assert('charge clamped 0', ch.chargeMax === 0)
assert('charge 0 still ok', cCh.applyUpgrade('reload') === true && ch.chargeMax === 0)
cCh.beginCharge()
assert('no charge needed → instant shot', cCh.bullets.length === 1 && cCh.charging === false)

assert('FIRE_INTERVAL 0.21', FIRE_INTERVAL === 0.21)
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

console.log(
  `\ncharge=${CHARGE_MAX_SEC}s attack=${ATTACK_BASE} full×2 interval=${FIRE_INTERVAL}s BODY=${BODY}`,
)
if (failed) {
  console.log(`RESULT  FAIL (${failed})`)
  process.exit(1)
}
console.log('RESULT  PASS')
