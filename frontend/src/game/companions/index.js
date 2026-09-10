/**
 * M11 跟班门面。独立体系：无血、无击退、不进 combat.targets。
 * 接线（M1）：createCompanions({ player, getTargets, getAttack, getPriorityTarget })
 *   playing 时 update(dt)；draw 在世界坐标（translate(-cam) 之后）。
 * getPriorityTarget：万物一心档 8 索敌优先（活目标且在 targets 内，否则回退常规）。
 */
import { BODY, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  BAT_KILL_HEAL_EVERY,
  BAT_MAX_TARGETS,
  BAT_SRC,
  BLACK_KEY,
  COMPANIONSHIP_KILL_STEP,
  COMPANIONSHIP_RATE_BASE,
  COMPANIONSHIP_RATE_STEP,
  CONTACT_INSET_RATIO,
  DEMON_ATK_RATIO,
  DEMON_COMFORT_RADIUS,
  DEMON_DMG_BASE,
  DEMON_KEEP_RADIUS,
  DEMON_MAX_TARGETS,
  DEMON_RELEASE_RADIUS,
  DEMON_SRC,
  DEMON_TARGET_RADIUS,
  EGG_MAX_TARGETS,
  EGG_SRC,
  GOBLIN_DRAW,
  GOBLIN_FOLLOW_DIST,
  GOBLIN_INTERVAL,
  GOBLIN_MAX_TARGETS,
  GOBLIN_SRC,
  RABBIT_MAX_TARGETS,
  RABBIT_SRC,
  SLIME_GG_DMG,
  SLIME_GG_MAX_TARGETS,
  SLIME_GG_SRC,
  TAMER_DMG,
  TAMER_SPEED_ADD,
  UNITY_TIER_ELITE,
  batDamage,
  demonAttackPerBonus,
  demonDamage,
  eggDamage,
  eggStage,
  goblinDamage,
  rabbitDamage,
  slotPos,
  unityDamageAdd,
  unityExtraTargets,
  unitySpeedBonus,
} from './constants.js'

export {
  BAT_DMG,
  BAT_KILL_HEAL_EVERY,
  BAT_MAX_TARGETS,
  BAT_SRC,
  BLACK_KEY,
  COMPANIONSHIP_KILL_STEP,
  COMPANIONSHIP_RATE_BASE,
  COMPANIONSHIP_RATE_STEP,
  CONTACT_INSET_RATIO,
  DEMON_ATK_RATIO,
  DEMON_COMFORT_RADIUS,
  DEMON_DMG_BASE,
  DEMON_KEEP_RADIUS,
  DEMON_MAX_TARGETS,
  DEMON_RELEASE_RADIUS,
  DEMON_SRC,
  DEMON_TARGET_RADIUS,
  EGG_KILL_BONUS_EVERY,
  EGG_MAX_TARGETS,
  EGG_MUL,
  EGG_SRC,
  EGG_STAGE2_KILLS,
  EGG_STAGE3_KILLS,
  GOBLIN_DRAW,
  GOBLIN_DMG_ATK_RATIO,
  GOBLIN_DMG_BASE,
  GOBLIN_FOLLOW_DIST,
  GOBLIN_INTERVAL,
  GOBLIN_MAX_TARGETS,
  GOBLIN_SRC,
  RABBIT_DMG,
  RABBIT_MAX_TARGETS,
  RABBIT_SRC,
  SLIME_GG_DMG,
  SLIME_GG_MAX_TARGETS,
  SLIME_GG_SRC,
  TAMER_DMG,
  TAMER_SPEED_ADD,
  UNITY_ATK_SHARE,
  UNITY_ELITE_FLAT,
  UNITY_FLAT,
  UNITY_SPEED_ADD,
  UNITY_TIER_ATK,
  UNITY_TIER_ELITE,
  UNITY_TIER_FLAT,
  UNITY_TIER_TARGETS,
  batDamage,
  demonAttackPerBonus,
  demonDamage,
  eggDamage,
  eggStage,
  goblinDamage,
  rabbitDamage,
  ringRadius,
  slotPos,
  unityAtkBonus,
  unityDamageAdd,
  unityEliteFlat,
  unityExtraTargets,
  unityFlat,
  unitySpeedBonus,
} from './constants.js'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function dist(a, b) {
  return Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0))
}

function isLive(ent) {
  return Boolean(ent) && !ent.dead && (ent.hp ?? 0) > 0
}

function liveList(targets) {
  return (targets ?? []).filter(isLive)
}

function nearestTo(from, ents) {
  const live = liveList(ents)
  if (!live.length) return null
  let best = live[0]
  let bestD = dist(from, best)
  for (let i = 1; i < live.length; i++) {
    const d = dist(from, live[i])
    if (d < bestD) {
      best = live[i]
      bestD = d
    }
  }
  return best
}

function contactInset(companion, target) {
  const tw = target.w ?? GOBLIN_DRAW
  const th = target.h ?? GOBLIN_DRAW
  const cw = companion.w ?? GOBLIN_DRAW
  const ch = companion.h ?? GOBLIN_DRAW
  const max = Math.min((tw + cw) / 2, (th + ch) / 2)
  return Math.max(1, max * CONTACT_INSET_RATIO)
}

/**
 * 走进目标绘制矩形。兔子从怪朝角色一侧切入；多只共享时从不同接触角靠上。
 */
function contactGoal(g, target, shareI, shareN, player) {
  const inset = contactInset(g, target)
  if (g.kind === 'rabbit' && player) {
    const pdx = player.x - target.x
    const pdy = player.y - target.y
    const plen = Math.hypot(pdx, pdy)
    if (plen < 0.01) return { x: target.x, y: target.y }
    const nx = pdx / plen
    const ny = pdy / plen
    const px = -ny
    const py = nx
    const rdx = g.x - target.x
    const rdy = g.y - target.y
    const behind = rdx * nx + rdy * ny < 0
    const sideSign = rdx * px + rdy * py < 0 ? -1 : 1
    const side = behind ? inset : 0
    return {
      x: target.x + nx * inset + px * side * sideSign,
      y: target.y + ny * inset + py * side * sideSign,
    }
  }
  if (shareN <= 1) return { x: target.x, y: target.y }
  const ang = (Math.PI * 2 * shareI) / shareN
  return {
    x: target.x + Math.cos(ang) * inset,
    y: target.y + Math.sin(ang) * inset,
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

function pickOverlapping(g, targets) {
  const overlapping = liveList(targets).filter((e) => overlapsDraw(g, e))
  overlapping.sort((a, b) => dist(g, a) - dist(g, b))
  return overlapping
}

/**
 * 地精：重叠才进候选。彼此重叠才打多个；否则只打最近 1 个。
 * extra 来自万物一心档 6（基础 2 + extra）。
 */
function pickGoblinVictims(g, targets, extra = 0) {
  return pickChainVictims(g, targets, GOBLIN_MAX_TARGETS + extra)
}

function pickRabbitVictims(g, targets, maxN = RABBIT_MAX_TARGETS) {
  return pickOverlapping(g, targets).slice(0, maxN)
}

/** 与第一目标重叠的候选，最多 maxN（蛋二阶段 2、三阶段 3）。 */
function pickChainVictims(g, targets, maxN) {
  const overlapping = pickOverlapping(g, targets)
  if (!overlapping.length) return []
  const cap = Math.max(1, maxN | 0)
  const first = overlapping[0]
  if (cap <= 1) return [first]
  const rest = overlapping.slice(1).filter((e) => overlapsDraw(first, e))
  return [first, ...rest].slice(0, cap)
}

function moveToward(ent, tx, ty, dt, speed = ent.speed) {
  const dx = tx - ent.x
  const dy = ty - ent.y
  const len = Math.hypot(dx, dy)
  if (len < 0.01) return
  const step = speed * dt
  if (step >= len) {
    ent.x = tx
    ent.y = ty
    return
  }
  ent.x += (dx / len) * step
  ent.y += (dy / len) * step
}

function clampWorld(ent) {
  ent.x = clamp(ent.x, BODY, WORLD_WIDTH - BODY)
  ent.y = clamp(ent.y, BODY, WORLD_HEIGHT - BODY)
}

function chromaBlack(img) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth || img.width
  c.height = img.naturalHeight || img.height
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const data = g.getImageData(0, 0, c.width, c.height)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < BLACK_KEY && d[i + 1] < BLACK_KEY && d[i + 2] < BLACK_KEY) {
      d[i + 3] = 0
    }
  }
  g.putImageData(data, 0, 0)
  return c
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = src
    img
      .decode()
      .then(() => resolve(img))
      .catch(() => resolve(img))
  })
}

function drawSprite(ctx, sheet, ent, fallback) {
  const dx = Math.round(ent.x - ent.w / 2)
  const dy = Math.round(ent.y - ent.h / 2)
  if (sheet && (sheet.naturalWidth || sheet.width)) {
    const sw = sheet.naturalWidth || sheet.width
    const sh = sheet.naturalHeight || sheet.height
    ctx.drawImage(sheet, 0, 0, sw, sh, dx, dy, ent.w, ent.h)
    return
  }
  ctx.fillStyle = fallback.a
  ctx.fillRect(dx, dy, ent.w, ent.h)
  ctx.fillStyle = fallback.b
  ctx.fillRect(dx + 4, dy + 4, 6, 6)
}

/**
 * @param {{
 *   player?: { x: number, y: number, speed?: number, attack?: number, heal?: Function },
 *   getTargets?: () => object[],
 *   getAttack?: () => number,
 *   getKills?: () => number,
 *   getPriorityTarget?: () => object,
 *   hooks?: { onDamage?: Function, spawnDamageNum?: Function, onHeal?: Function },
 *   spawnDamageNum?: Function,
 * }} [opts]
 */
export function createCompanions(opts = {}) {
  const player = opts.player
  const getTargets = opts.getTargets ?? (() => [])
  const getAttack = opts.getAttack ?? (() => player?.attack ?? 0)
  const getKills = opts.getKills ?? (() => 0)
  const getPriorityTarget = opts.getPriorityTarget ?? null
  const hooks = opts.hooks ?? {}
  const list = []
  let goblinSheet = null
  let rabbitSheet = null
  let batSheet = null
  const eggSheets = { 1: null, 2: null, 3: null }
  let demonSheet = null
  const slimeGGSheets = { 1: null, 2: null }
  let companionBonus = 0
  let unityTier = 0
  let tamerCount = 0
  let tamerDamageBonus = 0
  let tamerSpeedAdd = 0
  let demonCount = 0
  let demonAttackBonus = 0
  let slimeCount = 0
  let companionshipCount = 0
  let companionshipProgress = 0
  let companionshipDamageBonus = 0

  function unityAdd() {
    return unityDamageAdd(unityTier, getAttack())
  }

  function extraTargets() {
    return unityExtraTargets(unityTier)
  }

  function speedBonus() {
    return unitySpeedBonus(unityTier)
  }

  function companionExtras() {
    return companionBonus + tamerDamageBonus + companionshipDamageBonus
  }

  /** 恶魔联动口径：仅升级/羁绊额外加的跟班伤害（含万物一心档位加成）。 */
  function extraCompanionBonus() {
    return companionExtras() + unityAdd()
  }

  /** 恶魔对角色伤害的联动加值；未选恶魔为 0。 */
  function computeDemonAttackBonus() {
    if (demonCount <= 0) return 0
    const per = Math.floor(extraCompanionBonus() / 5)
    return per * demonAttackPerBonus(demonCount)
  }

  function recomputeDemonLink() {
    demonAttackBonus = computeDemonAttackBonus()
    if (typeof hooks.onDemonLink === 'function') hooks.onDemonLink(demonAttackBonus)
    return demonAttackBonus
  }

  function effectiveAttack() {
    return (Number(getAttack()) || 0) + demonAttackBonus
  }

  function tamerSpeedTotal() {
    return tamerSpeedAdd
  }

  function companionshipRate() {
    return COMPANIONSHIP_RATE_BASE + COMPANIONSHIP_RATE_STEP * Math.max(0, companionshipCount - 1)
  }

  function processCompanionship() {
    if (companionshipCount <= 0) return 0
    const marks = Math.floor((Number(getKills()) || 0) / COMPANIONSHIP_KILL_STEP)
    let gained = 0
    while (companionshipProgress < marks) {
      companionshipProgress += 1
      companionshipDamageBonus += companionshipRate()
      gained += companionshipRate()
    }
    if (gained > 0) recomputeDemonLink()
    return gained
  }

  function setUnityTier(tier) {
    const prev = unityTier
    unityTier = Math.max(0, Number(tier) || 0)
    if (unityTier !== prev) recomputeDemonLink()
    return unityTier
  }

  function tryHeal(amount) {
    const n = Number(amount) || 0
    if (!(n > 0)) return
    if (typeof player?.heal === 'function') player.heal(n)
    if (typeof hooks.onHeal === 'function') hooks.onHeal(n)
  }

  function emitDamage(target, dmg) {
    if (!target || !(dmg > 0)) return
    if (typeof hooks.onDamage === 'function') {
      hooks.onDamage(target, dmg)
      return
    }
    const spawn = opts.spawnDamageNum ?? hooks.spawnDamageNum
    if (typeof spawn === 'function') spawn(target.x, target.y, dmg, target)
  }

  function applyHits(g, victims, dmg) {
    for (const v of victims) {
      const wasLive = isLive(v)
      let dealt = dmg
      if (typeof v.takeHit === 'function') {
        const got = v.takeHit(dmg)
        if (typeof got === 'number') dealt = got
      } else if (typeof v.hp === 'number') v.hp -= dmg
      else continue
      emitDamage(v, dealt)
      if (g.kind === 'egg' && wasLive && !isLive(v)) {
        g.eggKills = (g.eggKills || 0) + 1
      }
      if (g.kind === 'bat' && wasLive && !isLive(v)) {
        g.batKills = (g.batKills || 0) + 1
        if (g.batKills % BAT_KILL_HEAL_EVERY === 0) tryHeal(1)
      }
    }
  }

  function strike(g, targets) {
    const extra = extraTargets()
    const add = unityAdd()
    const bc = companionExtras()
    if (g.kind === 'egg') {
      const stage = eggStage(getKills())
      const maxN = (EGG_MAX_TARGETS[stage] ?? 1) + extra
      applyHits(
        g,
        pickChainVictims(g, targets, maxN),
        eggDamage(getAttack(), stage, g.eggKills, bc) + add,
      )
      return
    }
    if (g.kind === 'rabbit' || g.kind === 'bat') {
      const baseMax = g.kind === 'bat' ? BAT_MAX_TARGETS : RABBIT_MAX_TARGETS
      const dmg =
        (g.kind === 'bat' ? batDamage(bc) : rabbitDamage(bc)) + add
      applyHits(g, pickRabbitVictims(g, targets, baseMax + extra), dmg)
      return
    }
    if (g.kind === 'demon') {
      const dmg = demonDamage(effectiveAttack(), bc) + add
      applyHits(g, pickRabbitVictims(g, targets, DEMON_MAX_TARGETS + extra), dmg)
      return
    }
    if (g.kind === 'slime') {
      const dmg = SLIME_GG_DMG + bc + add
      applyHits(g, pickRabbitVictims(g, targets, SLIME_GG_MAX_TARGETS + extra), dmg)
      return
    }
    applyHits(
      g,
      pickGoblinVictims(g, targets, extra),
      goblinDamage(getAttack(), bc) + add,
    )
  }

  function addDamageBonus(n = 0) {
    companionBonus += Number(n) || 0
    recomputeDemonLink()
    return companionBonus
  }

  function relayoutAroundPlayer() {
    const n = list.length
    const px = player?.x ?? 0
    const py = player?.y ?? 0
    for (let i = 0; i < n; i++) {
      const p = slotPos(px, py, i, n, GOBLIN_FOLLOW_DIST)
      list[i].x = p.x
      list[i].y = p.y
    }
  }

  function makeCompanion(kind, name) {
    return {
      kind,
      name,
      x: player?.x ?? 0,
      y: player?.y ?? 0,
      w: GOBLIN_DRAW,
      h: GOBLIN_DRAW,
      speed: (player?.speed ?? 0) + tamerSpeedTotal(),
      atkAcc: 0,
      knockbackable: false,
      chase: null,
    }
  }

  function addGoblin() {
    const g = makeCompanion('goblin', '地精')
    list.push(g)
    relayoutAroundPlayer()
    return g
  }

  function addRabbit() {
    const g = makeCompanion('rabbit', '兔子')
    list.push(g)
    relayoutAroundPlayer()
    return g
  }

  function addEgg() {
    const g = makeCompanion('egg', '奇怪的蛋')
    g.eggKills = 0
    list.push(g)
    relayoutAroundPlayer()
    return g
  }

  function addBat() {
    const g = makeCompanion('bat', '蝙蝠')
    g.batKills = 0
    list.push(g)
    relayoutAroundPlayer()
    return g
  }

  /** P28 B1 驯兽师：所有跟班伤害 +5、移速 +0.05（可叠）。 */
  function addTamer() {
    tamerCount += 1
    tamerDamageBonus += TAMER_DMG
    tamerSpeedAdd += TAMER_SPEED_ADD
    for (const g of list) g.speed += TAMER_SPEED_ADD
    recomputeDemonLink()
    return tamerCount
  }

  /**
   * P28 B4 恶魔：软拉绳跟随角色（可短时离开去够目标）、打 1 单位、
   * 永远取「离角色 3 身位内（DEMON_TARGET_RADIUS）」最近的那只活怪；半径内无目标就回角色身边。
   * 角色联动：getDemonAttackBonus() 产生的「角色伤害加值」由 M1/M8 接线到角色攻击，
   * getAttack() 应返回不含该联动加值的基础攻击，避免恶魔基础伤重复计入。
   */
  function addDemon() {
    demonCount += 1
    const g = makeCompanion('demon', '恶魔')
    g.demonIndex = demonCount
    list.push(g)
    relayoutAroundPlayer()
    recomputeDemonLink()
    return g
  }

  /** P28 B5 史莱姆gg：生成 g-1 / g-2 两跟班，基础伤 5。 */
  function addSlimeGG() {
    slimeCount += 1
    const g1 = makeCompanion('slime', '史莱姆g-1')
    g1.slimeVariant = 1
    const g2 = makeCompanion('slime', '史莱姆g-2')
    g2.slimeVariant = 2
    list.push(g1, g2)
    relayoutAroundPlayer()
    return [g1, g2]
  }

  /** P28 B6 伴我同行：仅角色击杀；每跨 100 杀按当时 rate 给跟班伤害加成。 */
  function addCompanionship() {
    const first = companionshipCount === 0
    companionshipCount += 1
    if (first) {
      companionshipProgress = Math.floor((Number(getKills()) || 0) / COMPANIONSHIP_KILL_STEP)
    }
    processCompanionship()
    recomputeDemonLink()
    return companionshipCount
  }

  function chaseStillValid(g, targets) {
    const t = g.chase
    return Boolean(t) && isLive(t) && targets.includes(t)
  }

  /** 万物一心档 8：优先角色正在攻击的活目标（须在 targets 内），失效回退常规索敌。 */
  function priorityChase(targets) {
    if (unityTier < UNITY_TIER_ELITE) return null
    if (typeof getPriorityTarget !== 'function') return null
    const t = getPriorityTarget()
    return isLive(t) && targets.includes(t) ? t : null
  }

  /**
   * R5 恶魔索敌：只在「距角色 ≤ DEMON_TARGET_RADIUS（3 身位）」的活怪里取最近的一只；
   * 已锁定目标要超出 DEMON_RELEASE_RADIUS（3.5 身位）才放弃——一点滞回避免目标在 3 身位
   * 边界上反复锁定/丢弃导致抖动。半径内没有任何目标时返回 null：恶魔不得再追任何东西，
   * 由 demonStep 的「无敌人」分支拉回角色身边环绕。
   */
  function demonTargetFor(g, targets, live) {
    if (!player) return null
    const cur = g.chase
    if (
      cur &&
      isLive(cur) &&
      targets.includes(cur) &&
      dist(player, cur) <= DEMON_RELEASE_RADIUS
    ) {
      return cur
    }
    return nearestTo(
      player,
      live.filter((e) => dist(player, e) <= DEMON_TARGET_RADIUS),
    )
  }

  /**
   * 索敌分配。R4：万物一心档 8 命中 priorityChase 时，其他跟班仍全体改派「玩家正在攻击的目标」，
   * 但恶魔豁免——仍走 demonTargetFor 的半径 + 最近规则（否则恶魔会被派去追远处的 Boss）。
   * R6：进入分配循环前先预登记本帧已持有的 chase，靠前的跟班不得抢走靠后跟班的目标。
   */
  function assignChases(targets) {
    const live = liveList(targets)
    const pri = priorityChase(targets)
    if (!pri) {
      for (const g of list) {
        if (g.kind !== 'demon' && !chaseStillValid(g, targets)) g.chase = null
      }
    }
    const claimed = new Set()
    // R6 预登记：先把本帧仍然有效、已被各跟班持有的 chase 全部登记进 claimed，
    // 再进入分配循环。否则「靠前的跟班先挑」，此刻 claimed 里还没有靠后跟班已持有的
    // 目标，靠前的会把它抢走——违反设计表 §2.5 / GAME-SPEC §4.2「优先领尚未被其他
    // 跟班占用的活目标」。恶魔仍每帧重算、不受 claimed 限制，故不参与预登记。
    for (const g of list) {
      if (g.chase) claimed.add(g.chase)
    }
    for (const g of list) {
      if (g.kind === 'demon') {
        // 恶魔不受「已被其他跟班占用」限制：允许与地精/兔子/蝙蝠选中同一只
        // （不再被迫改选第二近），且档 8 的优先目标对它无效。
        g.chase = demonTargetFor(g, targets, live)
        if (g.chase) claimed.add(g.chase)
        continue
      }
      if (pri) {
        g.chase = pri
        claimed.add(pri)
        continue
      }
      if (g.chase) {
        claimed.add(g.chase)
        continue
      }
      const free = live.filter((e) => !claimed.has(e))
      const pool = free.length ? free : live
      const pick = nearestTo(g, pool)
      g.chase = pick
      if (pick && free.length) claimed.add(pick)
    }
  }

  /**
   * P30 恶魔软性跟随：朝角色移动、靠近舒适距离减速/自然环绕；
   * P41 软拉绳：有目标时朝目标的外向分量按 pull<1 渐近保留，可离开角色去够目标，
   * 目标过远或消失则被渐近拉回角色身边舒适环。无 3 身位硬边界。
   */
  function demonStep(g, chase, player, dt, spd) {
    const px = player?.x ?? g.x
    const py = player?.y ?? g.y
    const dx = px - g.x
    const dy = py - g.y
    const pd = Math.hypot(dx, dy) || 0.0001
    const nx = dx / pd
    const ny = dy / pd
    const keep = DEMON_KEEP_RADIUS
    const comfort = DEMON_COMFORT_RADIUS
    // 软拉绳：pull 恒 < 1（渐进趋近），朝目标的外向分量永不归零 → 无硬墙。
    // 净方向为 0 的平衡点在 2×keep（6 身位）：拉绳范围内能追出去够到目标并打到，
    // 目标过远/消失时被渐近拉回角色身边舒适环。
    const pull = pd / (pd + keep * 2)
    let dirX = 0
    let dirY = 0
    if (chase) {
      const goal = contactGoal(g, chase, 0, 1, player)
      const gdx = goal.x - g.x
      const gdy = goal.y - g.y
      const gl = Math.hypot(gdx, gdy) || 0.0001
      dirX = (gdx / gl) * (1 - pull) + nx * pull
      dirY = (gdy / gl) * (1 - pull) + ny * pull
    } else {
      // 无敌人：绕舒适环自然环绕 + 轻微径向修正。
      const radial = clamp((pd - comfort) / keep, -1, 1)
      dirX = -ny * 0.7 + nx * radial
      dirY = nx * 0.7 + ny * radial
    }
    const dl = Math.hypot(dirX, dirY) || 1
    let speed = spd
    if (!chase) {
      // 接近舒适距离减速停下/慢速环绕。
      speed = spd * (0.25 + 0.75 * clamp(Math.abs(pd - comfort) / comfort, 0, 1))
    } else if (pull > 0) {
      speed = spd * (1 + pull * 0.25)
    }
    moveToward(g, g.x + (dirX / dl) * 8, g.y + (dirY / dl) * 8, dt, speed)
  }

  function update(dt) {
    if (!(dt > 0)) return
    processCompanionship()
    const targets = getTargets() ?? []
    const n = list.length
    const bonusSpd = speedBonus()
    assignChases(targets)
    for (let i = 0; i < n; i++) {
      const g = list[i]
      const spd = g.speed + bonusSpd
      const chase = g.chase
      if (g.kind === 'demon' && player) {
        demonStep(g, chase, player, dt, spd)
      } else if (chase) {
        const peers = []
        for (let j = 0; j < n; j++) {
          if (list[j].chase === chase) peers.push(j)
        }
        const slotN = peers.length
        const slotI = peers.indexOf(i)
        const goal = contactGoal(g, chase, slotI, slotN, player)
        moveToward(g, goal.x, goal.y, dt, spd)
      } else if (player) {
        const slot = slotPos(player.x, player.y, i, n, GOBLIN_FOLLOW_DIST)
        moveToward(g, slot.x, slot.y, dt, spd)
      }
      clampWorld(g)
      g.atkAcc += dt
      while (g.atkAcc >= GOBLIN_INTERVAL) {
        g.atkAcc -= GOBLIN_INTERVAL
        strike(g, targets)
      }
    }
  }

  async function loadAssets() {
    if (typeof Image === 'undefined') return null
    const [gImg, rImg, bImg, xImg, yImg, zImg, dImg, s1Img, s2Img] = await Promise.all([
      loadImage(GOBLIN_SRC),
      loadImage(RABBIT_SRC),
      loadImage(BAT_SRC),
      loadImage(EGG_SRC[1]),
      loadImage(EGG_SRC[2]),
      loadImage(EGG_SRC[3]),
      loadImage(DEMON_SRC),
      loadImage(SLIME_GG_SRC[1]),
      loadImage(SLIME_GG_SRC[2]),
    ])
    try {
      goblinSheet = chromaBlack(gImg)
    } catch {
      goblinSheet = gImg
    }
    try {
      rabbitSheet = chromaBlack(rImg)
    } catch {
      rabbitSheet = rImg
    }
    try {
      batSheet = chromaBlack(bImg)
    } catch {
      batSheet = bImg
    }
    try {
      demonSheet = chromaBlack(dImg)
    } catch {
      demonSheet = dImg
    }
    const eggImgs = [xImg, yImg, zImg]
    for (let i = 0; i < 3; i++) {
      try {
        eggSheets[i + 1] = chromaBlack(eggImgs[i])
      } catch {
        eggSheets[i + 1] = eggImgs[i]
      }
    }
    ;[s1Img, s2Img].forEach((img, idx) => {
      try {
        slimeGGSheets[idx + 1] = chromaBlack(img)
      } catch {
        slimeGGSheets[idx + 1] = img
      }
    })
    return { goblinSheet, rabbitSheet, batSheet, eggSheets, demonSheet, slimeGGSheets }
  }

  function draw(ctx) {
    if (!ctx) return
    for (const g of list) {
      if (g.kind === 'rabbit') {
        drawSprite(ctx, rabbitSheet, g, { a: '#6a4030', b: '#e8c8b0' })
      } else if (g.kind === 'egg') {
        const st = eggStage(getKills())
        drawSprite(ctx, eggSheets[st], g, { a: '#c4b070', b: '#fff4c8' })
      } else if (g.kind === 'bat') {
        drawSprite(ctx, batSheet, g, { a: '#3a2848', b: '#8a6aa0' })
      } else if (g.kind === 'demon') {
        drawSprite(ctx, demonSheet, g, { a: '#3a0c3f', b: '#b04fc0' })
      } else if (g.kind === 'slime') {
        const v = g.slimeVariant ?? 1
        drawSprite(ctx, slimeGGSheets[v], g, { a: '#2f8f5a', b: '#8fe3a5' })
      } else {
        drawSprite(ctx, goblinSheet, g, { a: '#2a4a28', b: '#7cbc5a' })
      }
    }
  }

  return {
    list,
    addGoblin,
    addRabbit,
    addEgg,
    addBat,
    addTamer,
    addDemon,
    addSlimeGG,
    addCompanionship,
    addDamageBonus,
    setUnityTier,
    getUnityTier: () => unityTier,
    getDamageBonus: () => companionBonus,
    getCompanionDamageBonus: () => companionExtras(),
    /** 跟班总加成（含万物一心档位）；unityTier=0 时仅为纯基础加成。 */
    getCompanionBonus: () => companionExtras() + unityAdd(),
    getExtraCompanionBonus: () => extraCompanionBonus(),
    getTamerCount: () => tamerCount,
    getTamerDamageBonus: () => tamerDamageBonus,
    getTamerSpeedAdd: () => tamerSpeedAdd,
    getDemonCount: () => demonCount,
    getDemonAttackBonus: () => demonAttackBonus,
    getSlimeCount: () => slimeCount,
    getCompanionshipCount: () => companionshipCount,
    getCompanionshipDamageBonus: () => companionshipDamageBonus,
    update,
    draw,
    loadAssets,
  }
}
