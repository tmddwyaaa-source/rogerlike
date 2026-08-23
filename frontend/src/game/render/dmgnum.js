/**
 * 伤害/回血数字：游戏数字/tile_0-9.png，按单位分开上浮。
 * 黑底抠透明；≥100 黄边、≥200 红边；回血强制绿边（1px 程序描边）。
 * M5/M11：命中后 spawnDamageNum；M1/M6 回血 spawnHealNum。
 */
import { assetUrl } from '../../assetUrl.js'

export const DMG_TILE = 16
/** 同一串数字格子推进（小于 tile，收紧间距）。 */
export const DMG_ADVANCE = 12
export const DMG_LIFE = 0.75
export const DMG_RISE = 28
export const DMG_STAGGER_Y = 8
export const BLACK_KEY = 12
export const DMG_YELLOW = '#e0b84a'
export const DMG_RED = '#c42b2b'
export const DMG_GREEN = '#3dbf5a'

const digits = {
  none: new Array(10).fill(null),
  yellow: new Array(10).fill(null),
  red: new Array(10).fill(null),
  green: new Array(10).fill(null),
}
let pending = null
const items = []

export function dmgOutlineKind(amount) {
  const n = Number(amount) || 0
  if (n >= 200) return 'red'
  if (n >= 100) return 'yellow'
  return 'none'
}

function hexRgb(hex) {
  const h = hex.replace('#', '')
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ]
}

function chromaBlack(img) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth || img.width
  c.height = img.naturalHeight || img.height
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const data = g.getImageData(0, 0, c.width, c.height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] < BLACK_KEY && px[i + 1] < BLACK_KEY && px[i + 2] < BLACK_KEY) {
      px[i + 3] = 0
    }
  }
  g.putImageData(data, 0, 0)
  return c
}

/** 给不透明像素描 1px 外边，再叠回原图。 */
function outlineSheet(srcCanvas, hex) {
  const w = srcCanvas.width
  const h = srcCanvas.height
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const g = out.getContext('2d')
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h)
  const ring = g.createImageData(w, h)
  const s = src.data
  const d = ring.data
  const [or, og, ob] = hexRgb(hex)
  const aAt = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0
    return s[(y * w + x) * 4 + 3]
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (s[i + 3] > 0) continue
      if (aAt(x - 1, y) || aAt(x + 1, y) || aAt(x, y - 1) || aAt(x, y + 1)) {
        d[i] = or
        d[i + 1] = og
        d[i + 2] = ob
        d[i + 3] = 255
      }
    }
  }
  g.putImageData(ring, 0, 0)
  g.drawImage(srcCanvas, 0, 0)
  return out
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

export function loadDamageNums() {
  if (digits.none[0]) return Promise.resolve(digits)
  if (pending) return pending
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }
  pending = Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      const img = await loadImage(assetUrl(`assets/游戏数字/tile_${i}.png`))
      const base = chromaBlack(img)
      return {
        none: base,
        yellow: outlineSheet(base, DMG_YELLOW),
        red: outlineSheet(base, DMG_RED),
        green: outlineSheet(base, DMG_GREEN),
      }
    }),
  )
    .then((sheets) => {
      for (let i = 0; i < 10; i++) {
        digits.none[i] = sheets[i].none
        digits.yellow[i] = sheets[i].yellow
        digits.red[i] = sheets[i].red
        digits.green[i] = sheets[i].green
      }
      return digits
    })
    .catch(() => null)
  return pending
}

export function getDamageNums() {
  return items
}

export function resetDamageNums() {
  items.length = 0
}

function countActiveFor(unit) {
  if (unit == null) return 0
  let n = 0
  for (const it of items) {
    if (it.unit === unit && it.life > 0) n += 1
  }
  return n
}

function spawnNum(x, y, amount, unitId, kind) {
  const n = Math.max(0, Math.floor(Number(amount) || 0))
  const unit = unitId ?? null
  const stack = countActiveFor(unit)
  items.push({
    x,
    y: y - 10 - stack * DMG_STAGGER_Y,
    amount: n,
    kind: kind ?? dmgOutlineKind(n),
    unit,
    life: DMG_LIFE,
  })
  return items[items.length - 1]
}

/**
 * 每个受伤单位自己一组数字；同一单位连续受伤则错开上浮。
 * @param {number} x
 * @param {number} y
 * @param {number} amount
 * @param {object|string|number} [unitId] 目标实体或稳定 id
 */
export function spawnDamageNum(x, y, amount, unitId) {
  return spawnNum(x, y, amount, unitId)
}

/** 回血数字强制绿边，不走 ≥100 黄 / ≥200 红。 */
export function spawnHealNum(x, y, amount, unitId) {
  return spawnNum(x, y, amount, unitId, 'green')
}

export function updateDamageNums(dt) {
  if (dt <= 0) return
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    it.y -= DMG_RISE * dt
    it.life -= dt
    if (it.life <= 0) items.splice(i, 1)
  }
}

function paintFallbackDigit(ctx, d, x, y, kind) {
  if (kind === 'yellow') ctx.fillStyle = DMG_YELLOW
  else if (kind === 'red') ctx.fillStyle = DMG_RED
  else if (kind === 'green') ctx.fillStyle = DMG_GREEN
  else ctx.fillStyle = '#2c2c28'
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 6, DMG_TILE + 2)
  ctx.fillStyle = '#f4e8c0'
  ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 2, 3 + (d % 5))
}

export function drawDamageNums(ctx, palettes = digits) {
  if (!ctx || !items.length) return 0
  let drawn = 0
  for (const it of items) {
    const kind = it.kind || dmgOutlineKind(it.amount)
    const tiles = palettes[kind] || palettes.none || palettes
    const ready = tiles[0] && ctx.drawImage
    const text = String(it.amount)
    const w = (text.length - 1) * DMG_ADVANCE + DMG_TILE
    let ox = Math.round(it.x - w / 2)
    const oy = Math.round(it.y - DMG_TILE / 2)
    const fade = Math.max(0, Math.min(1, it.life / 0.2))
    const prev = ctx.globalAlpha
    if (typeof prev === 'number') ctx.globalAlpha = fade
    for (const ch of text) {
      const d = ch.charCodeAt(0) - 48
      if (d < 0 || d > 9) continue
      if (ready) {
        ctx.drawImage(tiles[d], ox, oy, DMG_TILE, DMG_TILE)
      } else if (ctx.fillRect) {
        paintFallbackDigit(ctx, d, ox, oy, kind)
      }
      ox += DMG_ADVANCE
      drawn += 1
    }
    if (typeof prev === 'number') ctx.globalAlpha = prev
  }
  return drawn
}
