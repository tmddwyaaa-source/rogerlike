/**
 * 升级 +1：角色周围上浮消失。
 * 有 /assets/fx/levelup.png 用图；否则程序像素「+1」。
 * M1 接线：player.queueLevelUpFx(n)
 */
export const LEVELUP_SRC = '/assets/fx/levelup.png'
export const LEVELUP_LIFE = 0.85
export const LEVELUP_STAGGER = 0.1
export const LEVELUP_RISE = 28
export const LEVELUP_INK = '#2c2c28'
export const LEVELUP_CREAM = '#f4e8c0'

/** 8×7 像素「+1」。`.` 空、`k` 墨、`w` 奶油描边。 */
export const PLUS_ONE = [
  '.k..kww.',
  'kkk.wwwk',
  '.k...wk.',
  '.....wk.',
  '.....wk.',
  '.w...wk.',
  '.ww.wwwk',
]

export const PLUS_ONE_W = 8
export const PLUS_ONE_H = 7

let sprite = null
let pending = null

export function getLevelUpSprite() {
  return sprite
}

export function loadLevelUpFx() {
  if (sprite) return Promise.resolve(sprite)
  if (pending) return pending
  if (typeof Image === 'undefined') return Promise.resolve(null)
  pending = new Promise((resolve) => {
    const img = new Image()
    img.src = LEVELUP_SRC
    img
      .decode()
      .then(() => {
        sprite = img
        resolve(img)
      })
      .catch(() => resolve(null))
  })
  return pending
}

function paintPlusOne(ctx, x, y) {
  const ox = Math.round(x - PLUS_ONE_W / 2)
  const oy = Math.round(y - PLUS_ONE_H / 2)
  for (let row = 0; row < PLUS_ONE_H; row++) {
    const line = PLUS_ONE[row]
    for (let col = 0; col < PLUS_ONE_W; col++) {
      const ch = line[col]
      if (ch === '.') continue
      ctx.fillStyle = ch === 'w' ? LEVELUP_CREAM : LEVELUP_INK
      ctx.fillRect(ox + col, oy + row, 1, 1)
    }
  }
}

function offsetFor(i, n, random) {
  const t = n <= 1 ? 0.5 : i / (n - 1)
  return {
    ox: (t - 0.5) * 16 + (random() - 0.5) * 4,
    oy: -12 - (random() * 5),
  }
}

/**
 * 一次升 n 级 → n 个独立 +1（错开），不是一个「+3」。
 * @returns {number} 实际入队数量
 */
export function queueLevelUpFx(player, n = 1, random = Math.random) {
  if (!player) return 0
  const count = Math.max(0, Math.floor(Number(n) || 0))
  if (!player.levelUpFx) player.levelUpFx = []
  for (let i = 0; i < count; i++) {
    const { ox, oy } = offsetFor(i, count, random)
    player.levelUpFx.push({
      delay: i * LEVELUP_STAGGER,
      life: LEVELUP_LIFE,
      x: null,
      y: null,
      ox,
      oy,
    })
  }
  return count
}

export function stepLevelUpFx(player, dt) {
  const list = player?.levelUpFx
  if (!list || dt <= 0) return
  for (let i = list.length - 1; i >= 0; i--) {
    const fx = list[i]
    let remain = dt
    if (fx.delay > 0) {
      fx.delay -= dt
      if (fx.delay > 0) continue
      remain = -fx.delay
      fx.delay = 0
    }
    if (fx.x == null) {
      fx.x = player.x + fx.ox
      fx.y = player.y + fx.oy
    }
    fx.y -= LEVELUP_RISE * remain
    fx.life -= remain
    if (fx.life <= 0) list.splice(i, 1)
  }
}

export function drawLevelUpFx(ctx, player, img = sprite) {
  const list = player?.levelUpFx
  if (!list || !ctx) return 0
  let drawn = 0
  for (const fx of list) {
    if (fx.delay > 0 || fx.x == null) continue
    const fade = Math.max(0, Math.min(1, fx.life / 0.22))
    const prev = ctx.globalAlpha
    if (typeof prev === 'number') ctx.globalAlpha = fade
    if (img && ctx.drawImage) {
      const w = img.naturalWidth || img.width || PLUS_ONE_W
      const h = img.naturalHeight || img.height || PLUS_ONE_H
      ctx.drawImage(
        img,
        Math.round(fx.x - w / 2),
        Math.round(fx.y - h / 2),
        w,
        h,
      )
    } else {
      paintPlusOne(ctx, fx.x, fx.y)
    }
    if (typeof prev === 'number') ctx.globalAlpha = prev
    drawn += 1
  }
  return drawn
}

/** 队列里还有 +1（含尚未出现的错开项）。 */
export function hasLevelUpFx(player) {
  return (player?.levelUpFx?.length ?? 0) > 0
}

/** 与 hasLevelUpFx 相同；M1 用 busy=false 再出三选一。 */
export function levelUpFxBusy(player) {
  return hasLevelUpFx(player)
}

/** 全部 +1 播完还要多久（秒）。空队列为 0。 */
export function levelUpFxRemaining(player) {
  const list = player?.levelUpFx
  if (!list?.length) return 0
  let max = 0
  for (const fx of list) {
    const t = Math.max(0, fx.delay ?? 0) + Math.max(0, fx.life ?? 0)
    if (t > max) max = t
  }
  return max
}
