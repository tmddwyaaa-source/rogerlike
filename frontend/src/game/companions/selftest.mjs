/**
 * M11 跟班自测（不依赖浏览器 / 不改 match / ui / enemies）。
 * 运行：在 frontend/ 下 `node src/game/companions/selftest.mjs`
 */
import { BODY, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  BAT_DMG,
  BAT_KILL_HEAL_EVERY,
  BAT_MAX_TARGETS,
  BAT_SRC,
  EGG_SRC,
  GOBLIN_DRAW,
  GOBLIN_FOLLOW_DIST,
  GOBLIN_INTERVAL,
  GOBLIN_MAX_TARGETS,
  GOBLIN_SRC,
  RABBIT_DMG,
  RABBIT_SRC,
  batDamage,
  createCompanions,
  eggDamage,
  eggStage,
  goblinDamage,
  rabbitDamage,
  unityAtkBonus,
  unityDamageAdd,
  unityEliteFlat,
  unityExtraTargets,
  unityFlat,
  unitySpeedBonus,
} from './index.js'

let failed = 0
function assert(name, cond) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

function dummy(x, y, hp = 100, size = GOBLIN_DRAW) {
  return {
    x,
    y,
    w: size,
    h: size,
    hp,
    dead: false,
    takeHit(dmg) {
      this.hp -= dmg
    },
  }
}

function overlapsDraw(a, b) {
  const aw = a.w ?? 0
  const ah = a.h ?? 0
  const bw = b.w ?? 0
  const bh = b.h ?? 0
  const ax = a.x - aw / 2
  const ay = a.y - ah / 2
  const bx = b.x - bw / 2
  const by = b.y - bh / 2
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function makePack(player, foes, getAttack, extra = {}) {
  return createCompanions({
    player,
    getTargets: () => foes,
    getAttack,
    ...extra,
  })
}

assert('src 跟班/地精.png', GOBLIN_SRC === '/assets/跟班/地精.png')
assert('src 跟班/兔子.png', RABBIT_SRC === '/assets/跟班/兔子.png')
assert('src 跟班/蝙蝠.png', BAT_SRC === '/assets/跟班/蝙蝠.png')
assert('bat dmg 7', batDamage(0) === BAT_DMG && BAT_DMG === 7)
assert('bat dmg +10 = 17', batDamage(10) === 17)
assert('bat max 1 / heal every 200', BAT_MAX_TARGETS === 1 && BAT_KILL_HEAL_EVERY === 200)
assert('draw 16', GOBLIN_DRAW === 16)
assert('interval 0.4', GOBLIN_INTERVAL === 0.4)
assert('max targets 2', GOBLIN_MAX_TARGETS === 2)
assert('follow dist = BODY', GOBLIN_FOLLOW_DIST === BODY)
assert('dmg attack20 = 27', goblinDamage(20) === 27)
assert('dmg attack21 = 28', goblinDamage(21) === Math.ceil(15 + 0.6 * 21))
assert('dmg 0 = 15', goblinDamage(0) === 15)
assert('dmg 20 + bonus10 = 37', goblinDamage(20, 10) === 37)
assert('rabbit dmg 20', rabbitDamage(0) === RABBIT_DMG && RABBIT_DMG === 20)
assert('rabbit dmg +10 = 30', rabbitDamage(10) === 30)
assert('egg src x', String(EGG_SRC[1]).includes('奇怪的蛋-x.png'))
assert('egg stage 0/99=1 100=2 300=3', eggStage(0) === 1 && eggStage(99) === 1 && eggStage(100) === 2 && eggStage(299) === 2 && eggStage(300) === 3)
assert('egg dmg s1 atk20 = 4', eggDamage(20, 1) === 4)
assert('egg dmg s2 atk20 = 10', eggDamage(20, 2) === 10)
assert('egg dmg s3 atk20 = 16', eggDamage(20, 3) === 16)
assert('egg dmg s1 +100 kills = 5', eggDamage(20, 1, 100) === 5)
assert('egg dmg s1 +bonus10 = 14', eggDamage(20, 1, 0, 10) === 14)
assert(
  'unity 0/1 = 0',
  unityFlat(0) === 0 && unityAtkBonus(0, 20) === 0 && unityExtraTargets(0) === 0 &&
    unityEliteFlat(0) === 0 && unitySpeedBonus(0) === 0 &&
    unityFlat(1) === 0 && unityAtkBonus(1, 20) === 0 && unityExtraTargets(1) === 0 &&
    unityEliteFlat(1) === 0 && unitySpeedBonus(1) === 0,
)
assert('unity 2 flat +5', unityFlat(2) === 5 && unityDamageAdd(2, 20) === 5)
assert('unity 4 atk20 +4', unityAtkBonus(4, 20) === 4 && unityDamageAdd(4, 20) === 9)
assert('unity 6 extra target 1', unityExtraTargets(6) === 1)
assert(
  'unity 8 elite flat +10 / speed +16',
  unityEliteFlat(8) === 10 && unitySpeedBonus(8) === 16 && unityDamageAdd(8, 20) === 19,
)

const origin = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }

{
  const player = { x: origin.x, y: origin.y, speed: 96, attack: 20 }
  const foes = []
  const pack = makePack(player, foes, () => player.attack)
  assert(
    'exports addGoblin/addRabbit/addEgg/addBat/setUnityTier/update/draw/addDamageBonus',
    typeof pack.addGoblin === 'function' &&
      typeof pack.addRabbit === 'function' &&
      typeof pack.addEgg === 'function' &&
      typeof pack.addBat === 'function' &&
      typeof pack.setUnityTier === 'function' &&
      typeof pack.update === 'function' &&
      typeof pack.draw === 'function' &&
      typeof pack.addDamageBonus === 'function',
  )
  assert('list empty', pack.list.length === 0)
  const g1 = pack.addGoblin()
  assert('one goblin', pack.list.length === 1 && g1.kind === 'goblin' && g1.name === '地精')
  assert('no hp', g1.hp === undefined)
  assert('no takeHit', typeof g1.takeHit !== 'function')
  assert('knockbackable false', g1.knockbackable === false)
  assert('speed snapshot 96', g1.speed === 96)
  assert('not in getTargets', !foes.includes(g1))
  assert('addGoblin does not +10', pack.getDamageBonus() === 0)
  player.speed = 200
  const g2 = pack.addGoblin()
  assert('stack two', pack.list.length === 2)
  assert('g1 speed frozen', g1.speed === 96)
  assert('g2 speed = add-time 200', g2.speed === 200)
  assert('two addGoblin still bonus 0', pack.getDamageBonus() === 0)
  assert(
    'two goblins spawn separated',
    Math.hypot(g1.x - g2.x, g1.y - g2.y) >= GOBLIN_DRAW - 0.01,
  )
}

{
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  player.speed = 400
  const chase = dummy(player.x + 200, player.y)
  foes.push(chase)
  const x0 = g.x
  pack.update(0.25)
  const moved = g.x - x0
  assert('move uses snapshotted speed not later player.speed', Math.abs(moved - 96 * 0.25) < 1e-6)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x - 80
  g.y = player.y
  const nearPlayer = dummy(player.x + 20, player.y)
  const nearSelf = dummy(g.x - 10, g.y)
  foes.push(nearPlayer, nearSelf)
  const x0 = g.x
  pack.update(0.2)
  assert('goblin claims nearest-to-self unclaimed', g.x < x0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const a = pack.addGoblin()
  const b = pack.addGoblin()
  a.x = player.x - 80
  a.y = player.y
  b.x = player.x + 80
  b.y = player.y
  const eLeft = dummy(player.x - 200, player.y)
  const eRight = dummy(player.x + 200, player.y)
  foes.push(eLeft, eRight)
  const ax0 = a.x
  const bx0 = b.x
  pack.update(0.2)
  assert('two companions split two far enemies', a.x < ax0 && b.x > bx0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const first = dummy(player.x + 80, player.y)
  foes.push(first)
  pack.update(0.05)
  const closer = dummy(player.x - 20, player.y)
  foes.push(closer)
  const x0 = g.x
  pack.update(0.2)
  assert('lock keeps first target while alive', g.x > x0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const r = pack.addRabbit()
  r.x = player.x + 100
  r.y = player.y
  const nearPlayer = dummy(player.x + 20, player.y)
  const nearSelf = dummy(r.x + 10, r.y)
  foes.push(nearPlayer, nearSelf)
  const x0 = r.x
  pack.update(0.2)
  assert('rabbit chase nearest-to-self (not nearest-to-player)', r.x > x0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 200 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const r = pack.addRabbit()
  const foe = dummy(player.x + 80, player.y)
  r.x = foe.x + 50
  r.y = foe.y
  r.speed = 200
  foes.push(foe)
  pack.update(2)
  assert('rabbit cut-in overlaps from behind', overlapsDraw(r, foe))
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const far = dummy(g.x + 80, g.y)
  foes.push(far)
  pack.update(0.4)
  assert('no overlap: 0 damage', far.hp === 100)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const hit = dummy(g.x + 4, g.y)
  const miss = dummy(g.x + 80, g.y)
  const hx = hit.x
  const hy = hit.y
  foes.push(hit, miss)
  pack.update(0.39)
  assert('overlap: no strike before 0.4s', hit.hp === 100)
  pack.update(0.02)
  assert('overlap: hit 1 for 27', hit.hp === 73)
  assert('far still 0', miss.hp === 100)
  assert('no knockback', hit.x === hx && hit.y === hy)
  pack.update(0.1)
  assert('not every frame', hit.hp === 73)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x - 10, g.y)
  const b = dummy(g.x + 15, g.y)
  foes.push(a, b)
  pack.update(0.4)
  assert('two overlap goblin but not each other: only nearest', a.hp === 73 && b.hp === 100)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  const b = dummy(g.x + 4, g.y)
  const c = dummy(g.x + 80, g.y)
  foes.push(a, b, c)
  pack.update(0.4)
  assert('pair overlap each other: hit 2', a.hp === 73 && b.hp === 73)
  assert('third not overlapping: 0', c.hp === 100)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  foes.push(a)
  pack.addDamageBonus(10)
  assert('bonus 10 stored', pack.getDamageBonus() === 10)
  pack.update(0.4)
  assert('bonus 10 attack 20 → 37', a.hp === 63)
  pack.addGoblin()
  assert('addGoblin after bonus does not extra +10', pack.getDamageBonus() === 10)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  let attackNow = 20
  const pack = makePack(player, foes, () => attackNow)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  foes.push(a)
  pack.update(0.4)
  assert('live attack 20 → 27', a.hp === 73)
  attackNow = 30
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('live attack not snapshot', a.hp === 100 - goblinDamage(30))
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const dead = dummy(g.x + 1, g.y, 0)
  dead.dead = true
  const live = dummy(g.x + 4, g.y, 50)
  foes.push(dead, live)
  pack.update(0.4)
  assert('skip dead', live.hp === 50 - 27 && dead.hp === 0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x + 400
  g.y = player.y
  const distBefore = Math.hypot(g.x - player.x, g.y - player.y)
  pack.update(1)
  const distAfter = Math.hypot(g.x - player.x, g.y - player.y)
  assert('no enemies: close toward player', distAfter < distBefore)
  pack.update(10)
  const distPark = Math.hypot(g.x - player.x, g.y - player.y)
  assert('no enemies: park near player', distPark <= GOBLIN_FOLLOW_DIST + 0.5)
  pack.update(0)
  pack.draw(null)
  assert('dt<=0 / draw null no throw', pack.list.length === 1)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x - 40
  g.y = player.y
  const gray = dummy(player.x + 20, player.y, 25)
  gray.kind = 'gray'
  foes.push(gray)
  const x0 = g.x
  pack.update(0.1)
  assert('gray counts as chase target', g.x > x0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 400 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const a = pack.addGoblin()
  const b = pack.addGoblin()
  pack.update(2)
  assert(
    'follow slots stay separated',
    Math.hypot(a.x - b.x, a.y - b.y) >= GOBLIN_DRAW - 0.01,
  )
  const foe = dummy(player.x + 120, player.y)
  foes.push(foe)
  pack.update(2)
  assert('share target: both overlap enemy', overlapsDraw(a, foe) && overlapsDraw(b, foe))
  assert(
    'share target: not stacked',
    Math.hypot(a.x - b.x, a.y - b.y) > 1,
  )
}

{
  const player = { x: origin.x, y: origin.y, speed: 80, attack: 20 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const r = pack.addRabbit()
  assert('rabbit kind/name', r.kind === 'rabbit' && r.name === '兔子')
  assert('rabbit no hp', r.hp === undefined)
  assert('rabbit no takeHit', typeof r.takeHit !== 'function')
  assert('rabbit knockbackable false', r.knockbackable === false)
  assert('addRabbit does not +10', pack.getDamageBonus() === 0)
  r.x = player.x
  r.y = player.y
  r.speed = 0
  const a = dummy(r.x, r.y)
  const b = dummy(r.x + 4, r.y)
  const far = dummy(r.x + 80, r.y)
  foes.push(a, b, far)
  pack.update(0.4)
  assert('rabbit collision pair: max 1', a.hp === 80 && b.hp === 100)
  assert('rabbit far 0', far.hp === 100)
  pack.addDamageBonus(10)
  a.hp = 100
  r.atkAcc = 0
  pack.update(0.4)
  assert('rabbit 20+bonus10 = 30', a.hp === 70)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const hits = []
  const pack = makePack(player, foes, () => 20, {
    hooks: {
      onDamage(target, dmg) {
        hits.push({ target, dmg })
      },
    },
  })
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  foes.push(a)
  pack.update(0.4)
  assert('spawn onDamage after hit', hits.length === 1 && hits[0].target === a && hits[0].dmg === 27)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const hits = []
  const pack = makePack(player, foes, () => 20, {
    spawnDamageNum(x, y, dmg, unit) {
      hits.push({ x, y, dmg, unit })
    },
  })
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  const b = dummy(g.x + 4, g.y)
  foes.push(a, b)
  pack.update(0.4)
  assert('two units two pops', hits.length === 2)
  assert('pops not summed', hits[0].dmg === 27 && hits[1].dmg === 27)
  assert('separate units', hits[0].unit !== hits[1].unit)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const e = pack.addEgg()
  assert('egg kind/name', e.kind === 'egg' && e.name === '奇怪的蛋')
  assert('egg no hp', e.hp === undefined)
  assert('egg knockbackable false', e.knockbackable === false)
  assert('egg kills 0', e.eggKills === 0)
  assert('addEgg does not +10', pack.getDamageBonus() === 0)
  const e2 = pack.addEgg()
  assert(
    'two eggs spawn separated',
    Math.hypot(e.x - e2.x, e.y - e2.y) >= GOBLIN_DRAW - 0.01,
  )
}

{
  let kills = 0
  const player = { x: origin.x, y: origin.y, speed: 0, attack: 20 }
  const foes = []
  const pack = makePack(player, foes, () => 20, { getKills: () => kills })
  const egg = pack.addEgg()
  egg.x = player.x
  egg.y = player.y
  const a = dummy(egg.x, egg.y)
  const b = dummy(egg.x + 4, egg.y)
  foes.push(a, b)
  pack.update(0.4)
  assert('stage1 hits 1 for 4', a.hp === 96 && b.hp === 100)

  kills = 100
  a.hp = 100
  b.hp = 100
  egg.atkAcc = 0
  pack.update(0.4)
  assert('stage2 50% hits overlapping pair', a.hp === 90 && b.hp === 90)

  kills = 300
  a.hp = 100
  b.hp = 100
  const c = dummy(egg.x + 2, egg.y)
  foes.push(c)
  egg.atkAcc = 0
  pack.update(0.4)
  assert('stage3 80% hits 3 overlapping', a.hp === 84 && b.hp === 84 && c.hp === 84)

  egg.eggKills = 100
  a.hp = 100
  egg.atkAcc = 0
  pack.update(0.4)
  assert('egg own 100 kills +1', a.hp === 83)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20, { getKills: () => 0 })
  const egg = pack.addEgg()
  egg.x = player.x
  egg.y = player.y
  const victim = dummy(egg.x, egg.y, 4)
  foes.push(victim)
  pack.update(0.4)
  assert('egg kill increments eggKills', victim.hp <= 0 && egg.eggKills === 1)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const bat = pack.addBat()
  assert('bat kind/name', bat.kind === 'bat' && bat.name === '蝙蝠')
  assert('bat no hp', bat.hp === undefined)
  assert('bat no takeHit', typeof bat.takeHit !== 'function')
  assert('bat knockbackable false', bat.knockbackable === false)
  assert('bat kills 0', bat.batKills === 0)
  assert('addBat does not +10', pack.getDamageBonus() === 0)
  const bat2 = pack.addBat()
  assert(
    'two bats spawn separated',
    Math.hypot(bat.x - bat2.x, bat.y - bat2.y) >= GOBLIN_DRAW - 0.01,
  )
  bat.x = player.x
  bat.y = player.y
  bat.speed = 0
  bat2.x = player.x + 200
  bat2.y = player.y
  bat2.speed = 0
  const a = dummy(bat.x, bat.y)
  const b = dummy(bat.x + 4, bat.y)
  const far = dummy(bat.x + 80, bat.y)
  foes.push(a, b, far)
  pack.update(0.4)
  assert('bat collision pair: max 1', a.hp === 93 && b.hp === 100)
  assert('bat far 0', far.hp === 100)
  pack.addDamageBonus(10)
  a.hp = 100
  bat.atkAcc = 0
  pack.update(0.4)
  assert('bat 7+bonus10 = 17', a.hp === 83)
}

{
  let heals = 0
  let playerKills = 999
  const player = {
    x: origin.x,
    y: origin.y,
    speed: 0,
    heal(n) {
      heals += n
    },
  }
  const foes = []
  const pack = makePack(player, foes, () => 20, { getKills: () => playerKills })
  const bat = pack.addBat()
  bat.x = player.x
  bat.y = player.y
  bat.speed = 0
  bat.batKills = 199
  const victim = dummy(bat.x, bat.y, 7)
  foes.push(victim)
  pack.update(0.4)
  assert('bat 200th kill heals 1', victim.hp <= 0 && bat.batKills === 200 && heals === 1)
  assert('player getKills unused for bat heal', playerKills === 999)
}

{
  let heals = 0
  const player = {
    x: origin.x,
    y: origin.y,
    speed: 0,
  }
  const foes = []
  const pack = makePack(player, foes, () => 20, {
    hooks: {
      onHeal(n) {
        heals += n
      },
    },
  })
  const bat = pack.addBat()
  bat.x = player.x
  bat.y = player.y
  bat.speed = 0
  bat.batKills = 199
  const victim = dummy(bat.x, bat.y, 7)
  foes.push(victim)
  pack.update(0.4)
  assert('hooks.onHeal when no player.heal', victim.hp <= 0 && heals === 1)
}

{
  let heals = 0
  const player = {
    x: origin.x,
    y: origin.y,
    speed: 0,
    heal(n) {
      heals += n
    },
  }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const a = pack.addBat()
  const b = pack.addBat()
  a.x = player.x
  a.y = player.y
  a.speed = 0
  a.batKills = 199
  b.x = player.x + 200
  b.y = player.y
  b.speed = 0
  b.batKills = 199
  const victim = dummy(a.x, a.y, 7)
  foes.push(victim)
  pack.update(0.4)
  assert('two bats count separately', a.batKills === 200 && b.batKills === 199 && heals === 1)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  foes.push(a)
  pack.setUnityTier(2)
  pack.update(0.4)
  assert('unity 2 goblin +5', a.hp === 100 - 27 - 5)
  pack.setUnityTier(2)
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('unity 2 recall does not stack', a.hp === 68)
  pack.addDamageBonus(10)
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('unity +5 separate from goblin +10', a.hp === 100 - 37 - 5)
  pack.setUnityTier(0)
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('unity 0 clears flat', a.hp === 63)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  foes.push(a)
  pack.setUnityTier(4)
  pack.update(0.4)
  assert('unity 4 atk20 goblin +5+4', a.hp === 100 - 27 - 9)
  pack.setUnityTier(8)
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('unity 8 goblin +5+4+10', a.hp === 100 - 27 - 19)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const r = pack.addRabbit()
  r.x = player.x
  r.y = player.y
  r.speed = 0
  const a = dummy(r.x, r.y)
  const b = dummy(r.x + 4, r.y)
  foes.push(a, b)
  pack.setUnityTier(6)
  pack.update(0.4)
  assert('unity 6 rabbit targets 2', a.hp === 100 - 20 - 9 && b.hp === 100 - 20 - 9)
  pack.setUnityTier(2)
  a.hp = 100
  b.hp = 100
  r.atkAcc = 0
  pack.update(0.4)
  assert('unity drop to 2 rabbit max 1', a.hp === 75 && b.hp === 100)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  g.speed = 96
  const far = dummy(g.x + 400, g.y)
  foes.push(far)
  const x0 = g.x
  pack.setUnityTier(8)
  pack.update(0.25)
  assert('unity 8 speed +16 px/s', Math.abs(g.x - x0 - (96 + 16) * 0.25) < 1e-6)
  pack.setUnityTier(2)
  const x1 = g.x
  pack.update(0.25)
  assert('unity drop to 2 speed back', Math.abs(g.x - x1 - 96 * 0.25) < 1e-6)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  let pri = null
  const pack = makePack(player, foes, () => 20, {
    getPriorityTarget: () => pri,
  })
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const near = dummy(g.x + 10, g.y)
  const far = dummy(g.x + 300, g.y)
  foes.push(near, far)
  pack.update(0.05)
  assert('goblin first chases nearest', g.chase === near)
  pack.setUnityTier(8)
  pri = far
  pack.update(0.05)
  assert('tier 8 goblin priority overrides lock', g.chase === far)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  let pri = null
  const pack = makePack(player, foes, () => 20, {
    getPriorityTarget: () => pri,
  })
  const r = pack.addRabbit()
  r.x = player.x
  r.y = player.y
  r.speed = 80
  const nearSelf = dummy(r.x - 10, r.y)
  const far = dummy(r.x + 300, r.y)
  foes.push(nearSelf, far)
  pack.setUnityTier(6)
  const x0 = r.x
  pack.update(0.05)
  assert('tier 6 priority inactive: rabbit nearest', r.chase === nearSelf && r.x < x0)
  pack.setUnityTier(8)
  pri = far
  const x1 = r.x
  pack.update(0.05)
  assert('tier 8 priority overrides rabbit nearest', r.chase === far && r.x > x1)
  far.dead = true
  far.hp = 0
  pack.update(0.05)
  assert('dead priority falls back to nearest', r.chase === nearSelf)
  pri = dummy(r.x + 500, r.y)
  pack.update(0.05)
  assert('priority outside targets falls back', r.chase === nearSelf)
  pri = null
  pack.update(0.05)
  assert('null priority falls back', r.chase === nearSelf)
}

console.log(failed ? `\nRESULT FAIL (${failed})` : '\nRESULT PASS')
process.exit(failed ? 1 : 0)
