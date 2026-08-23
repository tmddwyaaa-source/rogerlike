/**
 * 甲：只给不透明像素描 1px 黄边（同 dmgnum outlineSheet），不用 strokeRect。
 */
import { ARMOR_OUTLINE } from './constants.js'

export { ARMOR_OUTLINE }

function hexRgb(hex) {
  const h = hex.replace('#', '')
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ]
}

/** 给不透明像素的四邻透明格铺 1px 色边，再叠回原像素。 */
export function outlinePixels(src, w, h, hex = ARMOR_OUTLINE) {
  const out = new Uint8ClampedArray(src.length)
  const [or, og, ob] = hexRgb(hex)
  const aAt = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0
    return src[(y * w + x) * 4 + 3]
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (src[i + 3] > 0) continue
      if (aAt(x - 1, y) || aAt(x + 1, y) || aAt(x, y - 1) || aAt(x, y + 1)) {
        out[i] = or
        out[i + 1] = og
        out[i + 2] = ob
        out[i + 3] = 255
      }
    }
  }
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] <= 0) continue
    out[i] = src[i]
    out[i + 1] = src[i + 1]
    out[i + 2] = src[i + 2]
    out[i + 3] = src[i + 3]
  }
  return out
}

export function outlineSheet(srcCanvas, hex = ARMOR_OUTLINE) {
  if (typeof document === 'undefined' || !srcCanvas?.getContext) return srcCanvas
  const w = srcCanvas.width
  const h = srcCanvas.height
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h)
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const g = out.getContext('2d')
  const ring = outlinePixels(src.data, w, h, hex)
  g.putImageData(new ImageData(ring, w, h), 0, 0)
  return out
}
