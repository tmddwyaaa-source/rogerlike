import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants.js'

/** 浅树.png 主色（叶亮 / 叶暗 / 树干），草地对齐此板。 */
export const TREE_LEAF_LIT = '#cec95f'
export const TREE_LEAF_SHADE = '#a9a33e'
export const TREE_TRUNK = '#9e5a4f'

/** 底色沿用 M3 CLEAR_COLOR，点缀浅树叶绿，避免整图过黄。 */
export const GRASS_BASE = '#c5e0a3'
export const GRASS_TUFT = '#b8d06a'
export const GRASS_DOT = '#cec95f'
export const GRASS_SHADOW = '#9aaa58'

const TILE = 8

function hash2(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return (n ^ (n >>> 16)) >>> 0
}

/**
 * 在已 translate(-cam) 的世界坐标系下，只画视野内草地。
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number }} camera
 */
export function drawGrass(ctx, camera) {
  const x0 = Math.floor(camera.x / TILE) * TILE
  const y0 = Math.floor(camera.y / TILE) * TILE
  const x1 = camera.x + VIEW_WIDTH
  const y1 = camera.y + VIEW_HEIGHT

  ctx.fillStyle = GRASS_BASE
  ctx.fillRect(Math.floor(camera.x), Math.floor(camera.y), VIEW_WIDTH + 1, VIEW_HEIGHT + 1)

  for (let y = y0; y <= y1; y += TILE) {
    const iy = (y / TILE) | 0
    for (let x = x0; x <= x1; x += TILE) {
      const h = hash2((x / TILE) | 0, iy)
      const kind = h & 31
      if (kind === 0 || kind === 8) {
        ctx.fillStyle = GRASS_TUFT
        ctx.fillRect(x + (h & 3), y + ((h >> 2) & 3), 2, 2)
      } else if (kind === 1) {
        ctx.fillStyle = GRASS_DOT
        ctx.fillRect(x + ((h >> 4) & 7), y + ((h >> 8) & 7), 1, 1)
      } else if (kind === 2) {
        ctx.fillStyle = GRASS_SHADOW
        ctx.fillRect(x + ((h >> 5) & 5), y + ((h >> 9) & 5), 3, 1)
      }
    }
  }
}
