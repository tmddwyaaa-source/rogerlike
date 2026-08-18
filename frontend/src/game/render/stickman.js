/** 「这个人」程序像素火柴人：宽 ≤11、高 ≤22，行走 ≥5 帧。 */
export const STICKMAN_W = 11
export const STICKMAN_H = 22

const SKIN = '#d4c4a8'
const INK = '#2c2c28'
const SHIRT = '#3d5a2a'
const FLASH = '#f4f0e8'

/**
 * 每帧 11×22。`.` 空、`x` 墨、`o` 肤、`s` 衣。
 * 5 帧行走循环；默认朝右，朝左整行镜像。
 */
const FRAMES = [
  // idle / stride 0
  [
    '...xxx.....',
    '..xooox....',
    '..xooox....',
    '...xxx.....',
    '....x......',
    '..sssss....',
    '.s.sss.s...',
    's..sss..s..',
    '...sss.....',
    '....x......',
    '...x.x.....',
    '...x.x.....',
    '...x.x.....',
    '..x...x....',
    '..x...x....',
    '.x.....x...',
    '.x.....x...',
    'xx.....xx..',
    '...........',
    '...........',
    '...........',
    '...........',
  ],
  // step R
  [
    '...xxx.....',
    '..xooox....',
    '..xooox....',
    '...xxx.....',
    '....x......',
    '..sssss....',
    '.s.sss.s...',
    's..sss..s..',
    '...sss.....',
    '....x......',
    '...x..x....',
    '...x...x...',
    '..x....x...',
    '.x......x..',
    'x.......x..',
    '........xx.',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
  ],
  // pass
  [
    '...xxx.....',
    '..xooox....',
    '..xooox....',
    '...xxx.....',
    '....x......',
    '..sssss....',
    's.sss.s....',
    's.sss..s...',
    '..sss......',
    '...x.......',
    '..x.x......',
    '..x.x......',
    '.x...x.....',
    '.x...x.....',
    'x.....x....',
    'x.....xx...',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
  ],
  // step L
  [
    '...xxx.....',
    '..xooox....',
    '..xooox....',
    '...xxx.....',
    '....x......',
    '..sssss....',
    '.s.sss.s...',
    '..sss..s.s.',
    '...sss.....',
    '....x......',
    '..x..x.....',
    '.x...x.....',
    '.x....x....',
    'x......x...',
    'x.......x..',
    'xx.........',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
  ],
  // recover
  [
    '...xxx.....',
    '..xooox....',
    '..xooox....',
    '...xxx.....',
    '....x......',
    '..sssss....',
    '.s.sss.s...',
    's..sss..s..',
    '...sss.....',
    '....x......',
    '...x.x.....',
    '...x.x.....',
    '..x...x....',
    '..x...x....',
    '.x.....x...',
    'xx.....x...',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........',
  ],
]

function colorOf(ch, flash) {
  if (ch === '.') return null
  if (flash) return FLASH
  if (ch === 'o') return SKIN
  if (ch === 's') return SHIRT
  return INK
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, facing?: number, invuln?: number, walkFrame?: number, moving?: boolean }} player
 */
export function drawStickman(ctx, player) {
  const inv = player.invuln ?? 0
  if (inv > 0 && Math.floor(inv * 12) % 2 === 0) return

  const flash = inv > 0
  const faceLeft = Math.cos(player.facing ?? 0) < 0
  const fi =
    player.moving === false
      ? 0
      : Math.floor(player.walkFrame ?? 0) % FRAMES.length
  const rows = FRAMES[fi]
  const ox = Math.round(player.x - STICKMAN_W / 2)
  const oy = Math.round(player.y - STICKMAN_H / 2)

  for (let row = 0; row < STICKMAN_H; row++) {
    const line = rows[row] || '...........'
    for (let col = 0; col < STICKMAN_W; col++) {
      const ch = faceLeft ? line[STICKMAN_W - 1 - col] : line[col]
      const fill = colorOf(ch, flash)
      if (!fill) continue
      ctx.fillStyle = fill
      ctx.fillRect(ox + col, oy + row, 1, 1)
    }
  }
}

export const WALK_FRAME_COUNT = FRAMES.length
