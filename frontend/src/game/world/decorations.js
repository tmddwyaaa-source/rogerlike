import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants.js'
import { assetUrl } from '../../assetUrl.js'
import {
  DECOR_DRAW_SCALE,
  DECOR_PADDING,
  DECOR_STICK_COUNT,
  DECOR_STICK_MIN_SIZE,
  DECOR_STICK_SOURCES,
  DECOR_STONE_COUNT,
  DECOR_STONE_MIN_SIZE,
  DECOR_STONE_SOURCES,
} from './constants.js'

/** 按装饰物类别取"最长边保底像素"。 */
function kindMinSize(kind) {
  return kind === 'stick' ? DECOR_STICK_MIN_SIZE : DECOR_STONE_MIN_SIZE
}

/** 播种期碰撞盒：用保底尺寸的方形近似（素材本身接近方形）。 */
function placeBox(kind) {
  const m = kindMinSize(kind)
  return { w: m, h: m }
}

/** 实际绘制尺寸：源图 × DECOR_DRAW_SCALE，但最长边不低于保底像素。 */
function drawSizeFor(it, img) {
  const min = kindMinSize(it.kind)
  if (img && img.complete && img.naturalWidth && img.naturalHeight) {
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const s = Math.max(DECOR_DRAW_SCALE, min / Math.max(nw, nh))
    return { w: Math.max(1, Math.round(nw * s)), h: Math.max(1, Math.round(nh * s)) }
  }
  return { w: it.w, h: it.h }
}

/** Fisher–Yates 洗牌，让火柴堆/石头在全图交错分布。 */
function shuffle(arr, random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
}

/**
 * M7 背景装饰物：火柴堆 / 石头。
 * 静态背景、不可交互、不碰撞，绘制在草地之上、实体树/怪之下。
 * 抖动网格播种：世界按 cell 划分、每格至多一个、格内随机偏移，
 * 保证数量精确可达、分布均匀、天然不重叠。
 */
export function createDecorationField(opts = {}) {
  const random = opts.random ?? Math.random
  const items = []
  const sprites = {}

  /** AABB 重叠判定（含 padding），避免与已有树/装饰物重叠。 */
  function occupied(x, y, w, h, trees) {
    const pad = DECOR_PADDING
    for (const t of trees || []) {
      const tw = t.w ?? 16
      const th = t.h ?? 16
      if (
        x < t.x + tw / 2 + pad &&
        x + w > t.x - tw / 2 - pad &&
        y < t.y + th / 2 + pad &&
        y + h > t.y - th / 2 - pad
      )
        return true
    }
    for (const d of items) {
      if (
        x < d.x + d.w / 2 + pad &&
        x + w > d.x - d.w / 2 - pad &&
        y < d.y + d.h / 2 + pad &&
        y + h > d.y - d.h / 2 - pad
      )
        return true
    }
    return false
  }

  /** 抖动网格播种：火柴堆 ~DECOR_STICK_COUNT、石头 ~DECOR_STONE_COUNT（=×3）。 */
  function seed(trees, worldW, worldH, counts = {}) {
    const sticks = counts.sticks ?? DECOR_STICK_COUNT
    const stones = counts.stones ?? DECOR_STONE_COUNT
    const total = sticks + stones
    if (total <= 0) return 0

    // 网格目标格数 = 总数 × 1.4（留出被树/边缘占用的余量，数量仍可达）。
    const targetCells = total * 1.4
    const cellSize = Math.max(24, Math.ceil(Math.sqrt((worldW * worldH) / targetCells)))
    const cols = Math.max(1, Math.floor(worldW / cellSize))
    const rows = Math.max(1, Math.floor(worldH / cellSize))

    const cells = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          x: (c + 0.5) * cellSize,
          y: (r + 0.5) * cellSize,
          // 格内随机偏移，控制在不越出本格太远，避免相邻格重叠。
          jx: (random() - 0.5) * (cellSize * 0.8),
          jy: (random() - 0.5) * (cellSize * 0.8),
        })
      }
    }
    shuffle(cells, random)

    let placed = 0
    let idx = 0

    /** 从当前游标往后找空位放一个；找不到则返回 false（结束播种）。 */
    function place(kind, src) {
      const box = placeBox(kind)
      for (; idx < cells.length; idx++) {
        const cell = cells[idx]
        const x = cell.x + cell.jx
        const y = cell.y + cell.jy
        if (!occupied(x, y, box.w, box.h, trees)) {
          items.push({ kind, x, y, w: box.w, h: box.h, src })
          placed += 1
          return true
        }
      }
      return false
    }

    for (let i = 0; i < sticks; i++) {
      const src = DECOR_STICK_SOURCES[i % DECOR_STICK_SOURCES.length]
      if (!place('stick', src)) break
    }
    for (let i = 0; i < stones; i++) {
      const src = DECOR_STONE_SOURCES[i % DECOR_STONE_SOURCES.length]
      if (!place('stone', src)) break
    }
    return placed
  }

  async function loadAssets() {
    if (typeof Image === 'undefined') return
    const sources = new Set([...DECOR_STICK_SOURCES, ...DECOR_STONE_SOURCES])
    for (const src of sources) {
      const img = new Image()
      img.src = assetUrl('assets/装饰物/' + src)
      try {
        await img.decode()
      } catch {
        /* 保留 img，complete 时仍可用 */
      }
      sprites[src] = img
    }
  }

  function draw(ctx, camera) {
    const x0 = camera?.x ?? -Infinity
    const y0 = camera?.y ?? -Infinity
    const x1 = x0 + VIEW_WIDTH
    const y1 = y0 + VIEW_HEIGHT
    for (const it of items) {
      const img = sprites[it.src]
      const size = drawSizeFor(it, img)
      const w = size.w
      const h = size.h
      if (it.x + w / 2 < x0 || it.x - w / 2 > x1 || it.y + h / 2 < y0 || it.y - h / 2 > y1) continue
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, Math.round(it.x - w / 2), Math.round(it.y - h / 2), w, h)
      } else {
        drawFallback(ctx, it)
      }
    }
  }

  function drawFallback(ctx, it) {
    const x = Math.round(it.x - it.w / 2)
    const y = Math.round(it.y - it.h / 2)
    if (it.kind === 'stick') {
      ctx.fillStyle = '#8a5a2b'
      ctx.fillRect(x + 1, y + 3, it.w - 2, 3)
      ctx.fillStyle = '#e0823c'
      ctx.fillRect(x + 2, y + 2, it.w - 4, 2)
    } else {
      ctx.fillStyle = '#9aa0a6'
      ctx.fillRect(x + 1, y + 1, it.w - 2, it.h - 2)
      ctx.fillStyle = '#c9cdd1'
      ctx.fillRect(x + 2, y + 2, it.w - 4, it.h - 4)
    }
  }

  return { items, seed, loadAssets, draw, occupied, sprites }
}
