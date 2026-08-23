/**
 * 伤害数字：每个受击单位单独飘字，用 游戏数字/tile_0..9。
 */
import { assetUrl } from '../../assetUrl.js'

export const DIGIT_SIZE = 16
export const DNUM_LIFE = 0.75
export const DNUM_RISE = 26
const BLACK_KEY = 12

const SRC = Array.from({ length: 10 }, (_, i) => assetUrl(`assets/游戏数字/tile_${i}.png`))

let sheets = null
let pending = null

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

export function loadDamageNumberAssets() {
  if (sheets) return Promise.resolve(sheets)
  if (pending) return pending
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }
  pending = Promise.all(SRC.map((src) => loadImage(src)))
    .then((imgs) => {
      sheets = imgs.map((img) => {
        try {
          return chromaBlack(img)
        } catch {
          return img
        }
      })
      return sheets
    })
    .catch(() => null)
  return pending
}

export function createDamageNumbers() {
  const floats = []

  function spawn(ent, amount) {
    if (!ent || !(amount > 0)) return false
    if (ent.knockbackable === false) return false
    const n = Math.max(1, Math.round(amount))
    const stack = floats.filter((f) => f.ent === ent).length
    floats.push({
      ent,
      x: ent.x,
      y: (ent.y ?? 0) - (ent.h ?? 16) / 2 - 2 - stack * 10,
      text: String(n),
      t: 0,
    })
    return true
  }

  function update(dt) {
    if (!(dt > 0)) return
    for (const f of floats) {
      f.t += dt
      f.y -= DNUM_RISE * dt
      if (f.ent) f.x = f.ent.x
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      if (floats[i].t >= DNUM_LIFE) floats.splice(i, 1)
    }
  }

  function drawDigit(ctx, ch, x, y, scale) {
    const d = ch.charCodeAt(0) - 48
    if (d < 0 || d > 9) return
    const img = sheets?.[d]
    const w = DIGIT_SIZE * scale
    if (img && (img.width || img.naturalWidth)) {
      ctx.drawImage(img, Math.round(x), Math.round(y), w, w)
      return
    }
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(Math.round(x), Math.round(y), w, w)
  }

  function draw(ctx) {
    if (!ctx || !floats.length) return
    const scale = 0.7
    const gw = DIGIT_SIZE * scale
    ctx.save()
    ctx.imageSmoothingEnabled = false
    for (const f of floats) {
      const a = 1 - f.t / DNUM_LIFE
      ctx.globalAlpha = Math.max(0, a)
      const total = f.text.length * gw
      let x = f.x - total / 2
      for (const ch of f.text) {
        drawDigit(ctx, ch, x, f.y, scale)
        x += gw
      }
    }
    ctx.restore()
  }

  return { spawn, update, draw, floats, loadAssets: loadDamageNumberAssets }
}
