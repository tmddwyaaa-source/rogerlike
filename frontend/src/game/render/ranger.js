/**
 * 游侠贴图：D/S/U × Idle/Walk/Attack/Hurt/Death + 脚下阴影。
 * 黑底抠透明。Image 不可用时（Node 自测）返回 null，由火柴人兜底。
 */
import { assetUrl } from '../../assetUrl.js'

export const FRAME_W = 32
export const FRAME_H = 32
/** 32 格里脚底所在行（贴图下半截大量留白）。阴影贴此对齐。 */
export const SPRITE_FOOT_Y = 21
export const SHADOW_W = 13
export const SHADOW_H = 6
/** 阴影上缘相对脚底上移，与脚重叠 2px，去掉悬空空白。 */
export const SHADOW_TUCK = 2
export const BLACK_KEY = 12

export const SHEET_FRAMES = {
  Idle: 4,
  Walk: 6,
  Attack: 4,
  Hurt: 2,
  Death: 8,
}

export const ANIM_FPS = {
  Idle: 6,
  Walk: 10,
  Attack: 12,
  Hurt: 10,
  Death: 8,
}

export const HURT_SEC = 0.22

const DIRS = ['D', 'S', 'U']
const ANIMS = ['Idle', 'Walk', 'Attack', 'Hurt', 'Death']

const SRC = {
  Shadow: assetUrl('assets/characters/Other/Shadow.png'),
}

for (const d of DIRS) {
  for (const a of ANIMS) {
    SRC[`${d}_${a}`] = assetUrl(`assets/characters/1/${d}_${a}.png`)
  }
}

let cache = null
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

export function loadRangerAssets() {
  if (cache) return Promise.resolve(cache)
  if (pending) return pending
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }
  pending = Promise.all(
    Object.entries(SRC).map(async ([key, src]) => {
      const img = await loadImage(src)
      const sheet = key === 'Shadow' ? img : chromaBlack(img)
      return [key, sheet]
    }),
  )
    .then((pairs) => {
      cache = Object.fromEntries(pairs)
      return cache
    })
    .catch(() => null)
  return pending
}

export function getRangerSheets() {
  return cache
}

/**
 * 由瞄准角得到 D/S/U。世界 +y 向下、+x 向右。
 * S 向原图默认朝左；瞄准右侧（cos>0）时水平翻转，使脸朝向鼠标。
 * @returns {{ facingDir: 'D'|'S'|'U', flipX: boolean }}
 */
export function facingFromAngle(facing = 0) {
  const c = Math.cos(facing)
  const s = Math.sin(facing)
  if (Math.abs(s) >= Math.abs(c)) {
    return { facingDir: s >= 0 ? 'D' : 'U', flipX: false }
  }
  return { facingDir: 'S', flipX: c > 0 }
}

export function resolveAnim(player) {
  if (player.hp <= 0) return 'Death'
  if ((player.hurtT ?? 0) > 0) return 'Hurt'
  if (player.charging || (player.attackT ?? 0) > 0) return 'Attack'
  if (player.moving) return 'Walk'
  return 'Idle'
}

function frameIndex(player, anim) {
  const n = SHEET_FRAMES[anim] || 1
  const fps = ANIM_FPS[anim] || 8
  if (anim === 'Walk') {
    return Math.floor(player.walkFrame ?? 0) % n
  }
  if (anim === 'Death') {
    return Math.min(n - 1, Math.floor((player.deathT ?? 0) * fps))
  }
  if (anim === 'Hurt') {
    return Math.min(n - 1, Math.floor((HURT_SEC - (player.hurtT ?? 0)) * fps))
  }
  if (anim === 'Attack') {
    const t = player.attackT ?? player.animTime ?? 0
    return Math.floor(t * fps) % n
  }
  return Math.floor((player.animTime ?? 0) * fps) % n
}

function footY(player) {
  return player.y + (player.h ?? FRAME_H) / 2
}

function spriteOrigin(player) {
  return {
    dx: player.x - FRAME_W / 2,
    dy: footY(player) - SPRITE_FOOT_Y,
  }
}

function drawShadow(ctx, player, sheets) {
  const sh = sheets?.Shadow
  if (!sh) return
  ctx.drawImage(
    sh,
    Math.round(player.x - SHADOW_W / 2),
    Math.round(footY(player) - SHADOW_TUCK),
    SHADOW_W,
    SHADOW_H,
  )
}

function blit(ctx, img, frame, dx, dy, flipX) {
  const sx = frame * FRAME_W
  ctx.save()
  ctx.imageSmoothingEnabled = false
  if (flipX) {
    ctx.translate(Math.round(dx + FRAME_W), Math.round(dy))
    ctx.scale(-1, 1)
    ctx.drawImage(img, sx, 0, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H)
  } else {
    ctx.drawImage(
      img,
      sx,
      0,
      FRAME_W,
      FRAME_H,
      Math.round(dx),
      Math.round(dy),
      FRAME_W,
      FRAME_H,
    )
  }
  ctx.restore()
}

/**
 * @returns {boolean} 是否已用贴图画完（false 则调用方用火柴人兜底）
 */
export function drawRanger(ctx, player, sheets = cache) {
  if (!sheets || !ctx.drawImage) return false

  const inv = player.invuln ?? 0
  const dead = (player.hp ?? 1) <= 0
  if (!dead && inv > 0 && Math.floor(inv * 12) % 2 === 0) {
    drawShadow(ctx, player, sheets)
    return true
  }

  const { facingDir, flipX } = {
    facingDir: player.facingDir || 'D',
    flipX: Boolean(player.flipX),
  }
  const anim = player.anim || resolveAnim(player)
  const key = `${facingDir}_${anim}`
  const img = sheets[key]
  const { dx, dy } = spriteOrigin(player)

  drawShadow(ctx, player, sheets)
  if (!img) return Boolean(sheets.Shadow)

  const fi = Math.max(0, frameIndex(player, anim))
  blit(ctx, img, fi, dx, dy, facingDir === 'S' && flipX)
  return true
}
