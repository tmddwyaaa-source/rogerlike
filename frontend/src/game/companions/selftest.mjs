/**
 * M11 跟班自测（不依赖浏览器 / 不改 match / ui / enemies）。
 * 运行：在 frontend/ 下 `node src/game/companions/selftest.mjs`
 */
import { existsSync } from 'node:fs'
import { BODY, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  BAT_DMG,
  BAT_KILL_HEAL_EVERY,
  BAT_MAX_TARGETS,
  BAT_SRC,
  COMPANIONSHIP_KILL_STEP,
  COMPANIONSHIP_RATE_BASE,
  COMPANIONSHIP_RATE_STEP,
  DEMON_ATK_RATIO,
  DEMON_COMFORT_RADIUS,
  DEMON_DMG_BASE,
  DEMON_KEEP_RADIUS,
  DEMON_MAX_TARGETS,
  DEMON_RELEASE_RADIUS,
  DEMON_SRC,
  DEMON_TARGET_RADIUS,
  EGG_SRC,
  GOBLIN_ANIM_SEC,
  GOBLIN_DRAW,
  GOBLIN_FOLLOW_DIST,
  GOBLIN_FRAMES,
  GOBLIN_FRAME_SEC,
  GOBLIN_FRAME_SRC,
  GOBLIN_INTERVAL,
  GOBLIN_MAX_TARGETS,
  GOBLIN_SRC,
  RABBIT_DMG,
  RABBIT_SRC,
  SLIME_GG_DMG,
  SLIME_GG_MAX_TARGETS,
  SLIME_GG_SRC,
  TAMER_DMG,
  TAMER_SPEED_ADD,
  batDamage,
  createCompanions,
  demonAttackPerBonus,
  demonDamage,
  eggDamage,
  eggStage,
  goblinDamage,
  goblinFrameAt,
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
assert('rabbit dmg 10', rabbitDamage(0) === RABBIT_DMG && RABBIT_DMG === 10)
assert('rabbit dmg +10 = 20', rabbitDamage(10) === 20)
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
  assert('rabbit collision pair: max 1', a.hp === 90 && b.hp === 100)
  assert('rabbit far 0', far.hp === 100)
  pack.addDamageBonus(10)
  a.hp = 100
  r.atkAcc = 0
  pack.update(0.4)
  assert('rabbit 10+bonus10 = 20', a.hp === 80)
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
  assert('unity 6 rabbit targets 2', a.hp === 100 - 10 - 9 && b.hp === 100 - 10 - 9)
  pack.setUnityTier(2)
  a.hp = 100
  b.hp = 100
  r.atkAcc = 0
  pack.update(0.4)
  assert('unity drop to 2 rabbit max 1', a.hp === 85 && b.hp === 100)
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
  // R6：claimed 预登记（attempt=1 回归）。两只地精 g0（list 靠前）/ g1（list 靠后）、
  // 两只怪 X（距两只地精都最近）/ Y（更远）；人为让靠后的 g1 预先持有 X。
  // 进入分配循环前必须先把 g1.chase 预登记进 claimed，否则靠前的 g0 会先挑走 X
  //（违反设计表 §2.5 / GAME-SPEC §4.2「优先领尚未被其他跟班占用的活目标」）。
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const g0 = pack.addGoblin()
  const g1 = pack.addGoblin()
  g0.x = origin.x + 20
  g0.y = origin.y
  g1.x = origin.x + 40
  g1.y = origin.y
  const X = dummy(origin.x + 30, origin.y, 100000) // 距 g0(10px)/g1(10px) 都最近
  const Y = dummy(origin.x + 300, origin.y, 100000) // 更远
  foes.push(X, Y)
  g0.chase = null
  g1.chase = X // 靠后那只本帧已持有 X
  pack.update(0.05)
  assert(
    'goblin earlier in list does not steal target held by later goblin',
    g1.chase === X && g0.chase !== X && g0.chase === Y,
  )
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

assert('demon src', DEMON_SRC === '/assets/跟班/恶魔.png')
assert(
  'slime src',
  String(SLIME_GG_SRC[1]).includes('史莱姆g-1.png') && String(SLIME_GG_SRC[2]).includes('史莱姆g-2.png'),
)
assert('demon base/ratio', DEMON_DMG_BASE === 10 && DEMON_ATK_RATIO === 0.2)
assert('demon keep 3 body', DEMON_KEEP_RADIUS === 3 * BODY)
assert(
  'demon target radius 3 body / release 3.5 body',
  DEMON_TARGET_RADIUS === 3 * BODY &&
    DEMON_TARGET_RADIUS === 66 &&
    DEMON_RELEASE_RADIUS === 3.5 * BODY,
)
assert('demon max 1', DEMON_MAX_TARGETS === 1)
assert('demon dmg 14', demonDamage(20) === 14)
assert('demon dmg +bonus10 = 24', demonDamage(20, 10) === 24)
assert('demon link per 1/2 = 3/4', demonAttackPerBonus(1) === 3 && demonAttackPerBonus(2) === 4)
assert('tamer const', TAMER_DMG === 5 && TAMER_SPEED_ADD === 0.05 * 80)
assert('slime const', SLIME_GG_DMG === 5 && SLIME_GG_MAX_TARGETS === 1)
assert(
  'companionship const',
  COMPANIONSHIP_KILL_STEP === 100 && COMPANIONSHIP_RATE_BASE === 1 && COMPANIONSHIP_RATE_STEP === 0.5,
)

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  pack.addTamer()
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  foes.push(a)
  pack.update(0.4)
  assert('tamer goblin 27+5=32', a.hp === 68)
  pack.addTamer()
  assert('tamer count 2', pack.getTamerCount() === 2 && pack.getTamerDamageBonus() === 10)
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('tamer stack 27+10=37', a.hp === 63)
  const h = pack.addRabbit()
  assert(
    'new rabbit speed +0.05x2',
    Math.abs(h.speed - (0 + TAMER_SPEED_ADD * 2)) < 1e-6,
  )
  assert('tamer speed add 8', pack.getTamerSpeedAdd() === TAMER_SPEED_ADD * 2)
}

{
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  assert('demon kind/name', d.kind === 'demon' && d.name === '恶魔')
  assert('demon no hp', d.hp === undefined)
  assert('demon no takeHit', typeof d.takeHit !== 'function')
  assert('demon knockbackable false', d.knockbackable === false)
  assert('demon count 1', pack.getDemonCount() === 1)
  assert('demon link 0', pack.getDemonAttackBonus() === 0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x - 80
  d.y = player.y
  const nearPlayer = dummy(player.x + 20, player.y)
  const nearSelf = dummy(d.x - 10, d.y)
  foes.push(nearPlayer, nearSelf)
  pack.update(0.05)
  assert('demon chases nearest-to-player', d.chase === nearPlayer)
  const x0 = d.x
  pack.update(0.05)
  assert('demon moves toward player target', d.x > x0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x
  d.y = player.y
  const a = dummy(d.x, d.y)
  foes.push(a)
  pack.update(0.4)
  assert('demon base 14 at attack 20', a.hp === 86)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x
  d.y = player.y
  pack.addDamageBonus(10)
  assert('demon link +6 for 10 bonus', pack.getDemonAttackBonus() === 6)
  const a = dummy(d.x, d.y)
  foes.push(a)
  d.atkAcc = 0
  pack.update(0.4)
  assert('demon damage 25 with link/bonus', a.hp === 75)
  const d2 = pack.addDemon()
  assert(
    'two demons +8 link',
    pack.getDemonCount() === 2 && d2.kind === 'demon' && pack.getDemonAttackBonus() === 8,
  )
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const [s1, s2] = pack.addSlimeGG()
  assert(
    'slime two companions',
    pack.list.length === 2 && s1.kind === 'slime' && s2.kind === 'slime' && pack.getSlimeCount() === 1,
  )
  assert('slime names', s1.name === '史莱姆g-1' && s2.name === '史莱姆g-2')
  assert('slime no hp', s1.hp === undefined)
  s1.x = player.x
  s1.y = player.y
  s2.x = player.x + 400
  s2.y = player.y
  const a = dummy(s1.x, s1.y)
  foes.push(a)
  pack.update(0.4)
  assert('slime base 5', a.hp === 95)
}

{
  // 软拉绳语义：远在拉绳外时，即使有更远的目标，也仍被渐近拉回角色（不是硬边界）。
  const player = { x: origin.x, y: origin.y, speed: 100 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x + 300
  d.y = player.y
  const far = dummy(player.x + 400, player.y, 100000)
  foes.push(far)
  const x0 = d.x
  pack.update(0.25)
  assert('demon far target: leash still pulls inward', Math.abs(d.x - player.x) < Math.abs(x0 - player.x))
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  let kills = 0
  const pack = makePack(player, foes, () => 20, { getKills: () => kills })
  pack.addCompanionship()
  assert('companion count 1', pack.getCompanionshipCount() === 1)
  assert('companion bonus 0 at 0 kills', pack.getCompanionshipDamageBonus() === 0)
  kills = 100
  pack.update(0.05)
  assert('100 kills +1.0', pack.getCompanionshipDamageBonus() === 1)
  kills = 200
  pack.update(0.05)
  assert('200 kills +2.0', pack.getCompanionshipDamageBonus() === 2)
  pack.addCompanionship()
  kills = 300
  pack.update(0.05)
  assert('300 kills uses new rate 1.5', pack.getCompanionshipDamageBonus() === 3.5)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  let kills = 250
  const pack = makePack(player, foes, () => 20, { getKills: () => kills })
  pack.addCompanionship()
  assert('first select at 250 no retroactive', pack.getCompanionshipDamageBonus() === 0)
  kills = 300
  pack.update(0.05)
  assert('cross 300 +1.0', pack.getCompanionshipDamageBonus() === 1)
}

{
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  assert('unity tier initial 0', pack.getUnityTier() === 0)
  assert(
    'companion base bonus initial 0',
    pack.getDamageBonus() === 0 && pack.getCompanionDamageBonus() === 0 && pack.getCompanionBonus() === 0,
  )
  const g = pack.addGoblin()
  g.x = player.x
  g.y = player.y
  const a = dummy(g.x, g.y)
  foes.push(a)
  pack.update(0.4)
  assert('unity tier 0 no gain', a.hp === 73)
  pack.setUnityTier(1)
  assert('tier 1 recorded but no gain', pack.getUnityTier() === 1 && pack.getCompanionBonus() === 0)
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('tier 1 below threshold no bonus', a.hp === 73)
  pack.setUnityTier(2)
  assert(
    'tier 2 gives flat +5',
    pack.getUnityTier() === 2 && pack.getCompanionBonus() === 5,
  )
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('tier 2 goblin 27+5=32', a.hp === 68)
  assert('damage getters exclude unity', pack.getDamageBonus() === 0 && pack.getCompanionDamageBonus() === 0)
  pack.setUnityTier(4)
  assert('tier 4 companion bonus 9', pack.getCompanionBonus() === 9)
  pack.setUnityTier(8)
  assert('tier 8 companion bonus 19', pack.getCompanionBonus() === 19)
  pack.setUnityTier(0)
  assert('reset tier 0', pack.getUnityTier() === 0 && pack.getCompanionBonus() === 0)
  a.hp = 100
  g.atkAcc = 0
  pack.update(0.4)
  assert('tier 0 clears unity gain', a.hp === 73)
}

assert('demon comfort radius 2 body', DEMON_COMFORT_RADIUS === 2 * BODY)

{
  const player = { x: origin.x, y: origin.y, speed: 100 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x + 120
  d.y = player.y
  for (let k = 0; k < 40; k++) pack.update(0.1)
  const pd = Math.hypot(d.x - player.x, d.y - player.y)
  assert('demon soft follow settles near comfort ring', pd <= DEMON_KEEP_RADIUS + 1 && pd > 10)
}

{
  const player = { x: origin.x, y: origin.y, speed: 100 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x + DEMON_KEEP_RADIUS + 2
  d.y = player.y
  const x0 = d.x
  pack.update(0.1)
  assert('demon at leash edge moves closer (no air wall)', d.x < x0)
}

{
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x - 80
  d.y = player.y
  const nearPlayer = dummy(player.x + 20, player.y)
  const nearSelf = dummy(d.x - 10, d.y)
  foes.push(nearPlayer, nearSelf)
  const x0 = d.x
  for (let k = 0; k < 12; k++) pack.update(0.05)
  assert('demon soft follow keeps nearest-to-player priority', d.chase === nearPlayer && d.x > x0)
}

{
  // R2：离角色最近的怪先被兔子锁定，恶魔不受占用限制，仍取同一只（不被迫改选第二近）。
  // R5 语义：被共享的目标必须落在「离角色 ≤3 身位」的索敌半径内，否则恶魔不会去锁它
  // （旧坐标 dist 20 同样在半径内，这里按新语义显式写成 2.5 身位）。
  const player = { x: origin.x, y: origin.y, speed: 80 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const r = pack.addRabbit()
  r.x = player.x + 10
  r.y = player.y
  r.speed = 0
  const nearest = dummy(player.x + 2.5 * BODY, player.y)
  const second = dummy(player.x + 300, player.y)
  foes.push(nearest, second)
  const d = pack.addDemon()
  d.x = player.x - 80
  d.y = player.y
  d.speed = 0
  pack.update(0.05)
  assert(
    'demon shares nearest target with other companion',
    Math.hypot(nearest.x - player.x, nearest.y - player.y) <= DEMON_TARGET_RADIUS &&
      Math.hypot(nearest.x - player.x, nearest.y - player.y) <
        Math.hypot(second.x - player.x, second.y - player.y) &&
      r.chase === nearest &&
      d.chase === nearest,
  )
}

{
  // R3 + R5：目标在 2.5 身位（索敌半径内）→ 恶魔离开舒适环追出去够它；
  // 随后目标跑出 3.5 身位滞回边界 → 恶魔放弃目标，被渐近拉回角色身边舒适环。
  // （旧断言「软拉绳可以离开 keep 半径」的场景目标是 5.7 身位外的怪，
  //   R5 收窄索敌半径后恶魔根本不会去追，故删除，改由本条覆盖「追出去 + 收绳回来」。）
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.x = player.x - DEMON_COMFORT_RADIUS
  d.y = player.y
  const foe = dummy(player.x + 2.5 * BODY, player.y, 100000)
  foes.push(foe)
  let touched = false
  for (let k = 0; k < 20; k++) {
    pack.update(0.1)
    if (overlapsDraw(d, foe)) touched = true
  }
  const sprint = Math.hypot(d.x - player.x, d.y - player.y)
  foe.x = player.x + 5 * BODY
  const hpAtRelease = foe.hp
  for (let k = 0; k < 80; k++) pack.update(0.1)
  const back = Math.hypot(d.x - player.x, d.y - player.y)
  // 无目标环绕是离散步进（每帧 8px 方向点），40 秒实测极限半径 ≈ comfort+1.34，容差取 +2。
  assert(
    'demon returns to player after sprint',
    touched &&
      sprint > DEMON_COMFORT_RADIUS &&
      d.chase === null &&
      back <= DEMON_COMFORT_RADIUS + 2 &&
      foe.hp === hpAtRelease,
  )
}

{
  // R5 滞回：已锁定目标在 3 身位外但没超 3.5 身位时仍保留锁定，超 3.5 身位才放弃。
  const player = { x: origin.x, y: origin.y, speed: 0 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  d.speed = 0
  const foe = dummy(player.x + 2 * BODY, player.y, 100000)
  foes.push(foe)
  pack.update(0.05)
  d.x = player.x - DEMON_COMFORT_RADIUS
  d.y = player.y
  foe.x = player.x + 3.2 * BODY
  pack.update(0.05)
  const kept = d.chase === foe
  foe.x = player.x + 3.6 * BODY
  pack.update(0.05)
  assert(
    'demon lock hysteresis: keeps target inside 3.5 body, drops beyond',
    kept && d.chase === null,
  )
}

{
  // R4：档 8 + 玩家优先目标是一只远怪时，其他跟班（地精）改派该远怪，
  // 恶魔豁免、仍取「半径内离角色最近」的那只。
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const foes = []
  let pri = null
  const pack = makePack(player, foes, () => 20, { getPriorityTarget: () => pri })
  const goblin = pack.addGoblin()
  const d = pack.addDemon()
  d.speed = 0
  const near = dummy(player.x + 2 * BODY, player.y)
  const far = dummy(player.x + 400, player.y)
  foes.push(near, far)
  pack.update(0.05)
  const beforeDemon = d.chase === near
  const beforeGoblin = goblin.chase === near
  pri = far
  pack.setUnityTier(8)
  pack.update(0.05)
  assert(
    'demon exempt from tier 8 priority target',
    beforeDemon && beforeGoblin && d.chase === near && goblin.chase === far,
  )
}

{
  // R5：目标在 5 身位（超出 3 身位索敌半径）→ 恶魔不锁定、不追击，
  // 停在离角色 ≤3 身位处环绕，该目标全程不掉血（跑 40 秒确认没被接触伤害）。
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  const foe = dummy(player.x + 5 * BODY, player.y, 100000)
  foes.push(foe)
  const hp0 = foe.hp
  let everLocked = false
  let maxPd = 0
  for (let k = 0; k < 400; k++) {
    pack.update(0.1)
    if (d.chase === foe) everLocked = true
    maxPd = Math.max(maxPd, Math.hypot(d.x - player.x, d.y - player.y))
  }
  assert(
    'demon ignores target beyond 3 body of player',
    !everLocked && d.chase === null && maxPd <= DEMON_TARGET_RADIUS && foe.hp === hp0,
  )
}

{
  // R5：目标在 2.5 身位（半径内）→ 恶魔能追到、真正接触并造成真实掉血
  // （证明不是「悬停在够不到的距离」的假跟随）。
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const foes = []
  const pack = makePack(player, foes, () => 20)
  const d = pack.addDemon()
  const foe = dummy(player.x + 2.5 * BODY, player.y, 100000)
  foes.push(foe)
  const hp0 = foe.hp
  let overlapped = false
  for (let k = 0; k < 60; k++) {
    pack.update(0.1)
    if (overlapsDraw(d, foe)) overlapped = true
  }
  assert(
    'demon hits target inside 3 body of player',
    d.chase === foe && overlapped && foe.hp <= hp0 - demonDamage(20),
  )
}

/* ------------------------------------------------------------------ *
 * P42 批次4（TASK-031 / M7）：地精 4 帧序列动画。
 * 口径与 TASK-030 一致：时间驱动 10fps / 0.4s 一轮 / 无限循环；
 * 多只地精相位错开；不影响索敌/跟随/伤害/暂停冻结。
 * ------------------------------------------------------------------ */

assert(
  'goblin frames 4',
  GOBLIN_FRAMES === 4 &&
    GOBLIN_FRAME_SEC === 0.1 &&
    GOBLIN_ANIM_SEC === GOBLIN_FRAME_SEC * GOBLIN_FRAMES &&
    Math.abs(GOBLIN_ANIM_SEC - 0.4) < 1e-9 &&
    GOBLIN_FRAME_SRC.length === 4 &&
    GOBLIN_FRAME_SRC[0] === GOBLIN_SRC,
)

assert(
  'goblin anim time driven',
  typeof goblinFrameAt === 'function' &&
    // t=0/0.1/0.2/0.3 → 帧 0/1/2/3；t=0.4 回到 0，再往后继续绕
    goblinFrameAt(0) === 0 &&
    goblinFrameAt(0.1) === 1 &&
    goblinFrameAt(0.2) === 2 &&
    goblinFrameAt(0.3) === 3 &&
    goblinFrameAt(0.4) === 0 &&
    goblinFrameAt(0.5) === 1 &&
    goblinFrameAt(0.7) === 3 &&
    goblinFrameAt(0.8) === 0 &&
    // 时间驱动而非逐帧计数：同一 t 恒等，调用次数 / 帧率都不影响
    goblinFrameAt(0.25) === goblinFrameAt(0.25) &&
    goblinFrameAt(0.25) === 2 &&
    // 越界 / 负时间兜底
    goblinFrameAt(-0.1) === 3 &&
    goblinFrameAt(-0.4) === 0 &&
    goblinFrameAt(-0.5) === 3 &&
    // 非有限值兜底，且结果恒落在合法帧区间
    [NaN, Infinity, -Infinity, undefined, null, 1e9, -1e9, 0.05, 0.3999999].every((t) => {
      const f = goblinFrameAt(t)
      return Number.isInteger(f) && f >= 0 && f < GOBLIN_FRAMES
    }) &&
    // 素材退化单帧时不越界
    goblinFrameAt(0.3, 1) === 0 &&
    goblinFrameAt(1.7, 2) === 1,
)

{
  // 三只地精：相位必须错开（同一时刻不能叠成同一帧）。
  let pick = 0
  const random = () => [0.05, 0.55, 0.95][pick++ % 3]
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const pack = makePack(player, [], () => 20, { random })
  const g1 = pack.addGoblin()
  const g2 = pack.addGoblin()
  const g3 = pack.addGoblin()
  const phases = [g1, g2, g3].map((g) => g.animPhase)
  pack.update(0.15)
  const frames = [g1, g2, g3].map((g) =>
    typeof pack.goblinFrameOf === 'function' ? pack.goblinFrameOf(g) : null,
  )
  assert(
    'goblin anim phase per instance',
    typeof pack.goblinFrameOf === 'function' &&
      new Set(phases).size === phases.length &&
      phases.every((p) => Number.isFinite(p) && p >= 0 && p < GOBLIN_ANIM_SEC + 1e-9) &&
      frames.every((f) => Number.isInteger(f) && f >= 0 && f < GOBLIN_FRAMES) &&
      new Set(frames).size > 1,
  )

  // 暂停冻结：时间只在 update 里推进，draw 与 dt<=0 都不推进
  const t0 = typeof pack.getAnimTime === 'function' ? pack.getAnimTime() : null
  pack.draw(null)
  pack.draw(null)
  pack.update(0)
  const t1 = typeof pack.getAnimTime === 'function' ? pack.getAnimTime() : null
  assert('goblin anim frozen without update', t0 > 0 && t1 === t0)
  // 动画不改变既有判定：三只地精仍是可索敌的普通跟班（无血、不可击退）
  assert(
    'goblin anim keeps companion contract',
    [g1, g2, g3].every((g) => g.kind === 'goblin' && g.knockbackable === false) &&
      pack.list.length === 3,
  )
}

assert(
  'goblin 4 frame assets exist',
  ['地精.png', '地精-2.png', '地精-3.png', '地精-4.png'].every(
    (f) =>
      existsSync(new URL(`../../../public/assets/跟班/${f}`, import.meta.url)) &&
      existsSync(new URL(`../../../../assets/source/跟班/${f}`, import.meta.url)),
  ) &&
    GOBLIN_FRAME_SRC.length === 4,
)

{
  // 搜剿自检：帧号算对了不等于真的换图——用假 Image + 记录型 ctx 证明
  // 随着时间推进，draw() 真的在 4 张不同贴图之间切换（否则整个动画是空壳）。
  const RealImage = globalThis.Image
  const srcs = []
  globalThis.Image = class {
    constructor() {
      this.naturalWidth = 32
      this.naturalHeight = 32
    }
    set src(v) {
      this._src = v
      srcs.push(v)
    }
    get src() {
      return this._src
    }
    decode() {
      return Promise.resolve()
    }
  }
  const player = { x: origin.x, y: origin.y, speed: 96 }
  const pack = makePack(player, [], () => 20, { random: () => 0.5 })
  let loaded = null
  try {
    loaded = await pack.loadAssets()
  } catch {
    loaded = null
  }
  const drawn = []
  const ctx = {
    drawImage(sheet) {
      drawn.push(sheet)
    },
  }
  pack.addGoblin()
  const seen = []
  for (let step = 0; step < 8; step++) {
    pack.update(GOBLIN_FRAME_SEC)
    drawn.length = 0
    pack.draw(ctx)
    if (drawn.length) seen.push(drawn[drawn.length - 1])
  }
  globalThis.Image = RealImage
  assert(
    'goblin anim draws 4 distinct frames',
    loaded?.goblinFrames?.length === 4 &&
      GOBLIN_FRAME_SRC.every((s) => srcs.includes(s)) &&
      seen.length === 8 &&
      new Set(seen).size === 4,
  )
}

console.log(failed ? `\nRESULT FAIL (${failed})` : '\nRESULT PASS')
process.exit(failed ? 1 : 0)
