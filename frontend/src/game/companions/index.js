/**
 * M11 跟班门面。独立体系：无血、无击退、不进 combat.targets。
 * 接线（M1）：createCompanions({ player, getTargets, getAttack })
 *   playing 时 update(dt)；draw 在世界坐标（translate(-cam) 之后）。
 */
import { BODY, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import {
  BLACK_KEY,
  CONTACT_INSET_RATIO,
  GOBLIN_DRAW,
  GOBLIN_FOLLOW_DIST,
  GOBLIN_INTERVAL,
  GOBLIN_MAX_TARGETS,
  GOBLIN_SRC,
  RABBIT_MAX_TARGETS,
  RABBIT_SRC,
  goblinDamage,
  rabbitDamage,
  slotPos,
} from './constants.js'

export {
  BLACK_KEY,
  CONTACT_INSET_RATIO,
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
  goblinDamage,
  rabbitDamage,
  ringRadius,
  slotPos,
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
 * 地精：重叠才进候选。≥2 且彼此重叠才打 2 个；否则只打最近 1 个。
 */
function pickGoblinVictims(g, targets) {
  const overlapping = pickOverlapping(g, targets)
  if (!overlapping.length) return []
  const first = overlapping[0]
  for (let i = 1; i < overlapping.length; i++) {
    if (overlapsDraw(first, overlapping[i])) {
      return [first, overlapping[i]].slice(0, GOBLIN_MAX_TARGETS)
    }
  }
  return [first]
}

function pickRabbitVictims(g, targets) {
  return pickOverlapping(g, targets).slice(0, RABBIT_MAX_TARGETS)
}

function moveToward(ent, tx, ty, dt) {
  const dx = tx - ent.x
  const dy = ty - ent.y
  const len = Math.hypot(dx, dy)
  if (len < 0.01) return
  const step = ent.speed * dt
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
 *   player?: { x: number, y: number, speed?: number, attack?: number },
 *   getTargets?: () => object[],
 *   getAttack?: () => number,
 * }} [opts]
 */
export function createCompanions(opts = {}) {
  const player = opts.player
  const getTargets = opts.getTargets ?? (() => [])
  const getAttack = opts.getAttack ?? (() => player?.attack ?? 0)
  const list = []
  let goblinSheet = null
  let rabbitSheet = null
  let companionBonus = 0

  function strike(g, targets) {
    const rabbit = g.kind === 'rabbit'
    const victims = rabbit ? pickRabbitVictims(g, targets) : pickGoblinVictims(g, targets)
    const dmg = rabbit
      ? rabbitDamage(companionBonus)
      : goblinDamage(getAttack(), companionBonus)
    for (const v of victims) {
      if (typeof v.takeHit === 'function') v.takeHit(dmg)
      else if (typeof v.hp === 'number') v.hp -= dmg
    }
  }

  function addDamageBonus(n = 0) {
    companionBonus += Number(n) || 0
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
      speed: player?.speed ?? 0,
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

  function chaseStillValid(g, targets) {
    const t = g.chase
    return Boolean(t) && isLive(t) && targets.includes(t)
  }

  function assignChases(targets) {
    const live = liveList(targets)
    for (const g of list) {
      if (!chaseStillValid(g, targets)) g.chase = null
    }
    const claimed = new Set()
    for (const g of list) {
      if (g.chase) claimed.add(g.chase)
    }
    for (const g of list) {
      if (g.chase) continue
      const free = live.filter((e) => !claimed.has(e))
      const pool = free.length ? free : live
      const pick = nearestTo(g, pool)
      g.chase = pick
      if (pick && free.length) claimed.add(pick)
    }
  }

  function update(dt) {
    if (!(dt > 0)) return
    const targets = getTargets() ?? []
    const n = list.length
    assignChases(targets)
    for (let i = 0; i < n; i++) {
      const g = list[i]
      const chase = g.chase
      if (chase) {
        const peers = []
        for (let j = 0; j < n; j++) {
          if (list[j].chase === chase) peers.push(j)
        }
        const slotN = peers.length
        const slotI = peers.indexOf(i)
        const goal = contactGoal(g, chase, slotI, slotN, player)
        moveToward(g, goal.x, goal.y, dt)
      } else if (player) {
        const slot = slotPos(player.x, player.y, i, n, GOBLIN_FOLLOW_DIST)
        moveToward(g, slot.x, slot.y, dt)
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
    const [gImg, rImg] = await Promise.all([loadImage(GOBLIN_SRC), loadImage(RABBIT_SRC)])
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
    return { goblinSheet, rabbitSheet }
  }

  function draw(ctx) {
    if (!ctx) return
    for (const g of list) {
      if (g.kind === 'rabbit') {
        drawSprite(ctx, rabbitSheet, g, { a: '#6a4030', b: '#e8c8b0' })
      } else {
        drawSprite(ctx, goblinSheet, g, { a: '#2a4a28', b: '#7cbc5a' })
      }
    }
  }

  return {
    list,
    addGoblin,
    addRabbit,
    addDamageBonus,
    update,
    draw,
    loadAssets,
    getDamageBonus: () => companionBonus,
  }
}
