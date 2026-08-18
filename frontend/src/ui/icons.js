/**
 * 升级图标：局内优先读过审 PNG；没有则空白方块。
 * 程序字符画 ICON_MAPS 仅作遗留，不再用于局内。
 */
export const ICON_SIZE = 12
export const UPGRADE_ICON_DIR = '/assets/upgrades/'

export function upgradeIconUrl(id) {
  return `${UPGRADE_ICON_DIR}${encodeURIComponent(id)}.png`
}

/**
 * 局内图标策略：过审 PNG 用图，否则空白方块。永不回退到 ICON_MAPS 字符画。
 * @param {string} id
 * @param {boolean} hasApprovedPng 运行时目录是否已有 upgrades/{id}.png
 */
export function resolveUpgradeIcon(id, hasApprovedPng) {
  if (hasApprovedPng) {
    return { kind: 'png', url: upgradeIconUrl(id) }
  }
  return { kind: 'blank', url: null }
}

/** 未过审 / 未生成：浅底黑框空方块。 */
export function paintBlankIcon(ctx, ox = 0, oy = 0, scale = 1) {
  if (!ctx) return false
  const s = Math.max(1, scale | 0)
  const w = ICON_SIZE * s
  ctx.fillStyle = '#f4e8c0'
  ctx.fillRect(ox, oy, w, w)
  ctx.strokeStyle = '#2c2c28'
  ctx.lineWidth = Math.max(2, Math.round(s / 2))
  ctx.strokeRect(ox + 1, oy + 1, w - 2, w - 2)
  return true
}

/** 高级升级：左上角 3×3 逻辑像素红点（随 scale 放大）。 */
export const ADVANCED_DOT_SIZE = 3
export const ADVANCED_DOT_COLOR = '#c42b5a'

export function paintAdvancedDot(ctx, ox = 0, oy = 0, scale = 1) {
  if (!ctx) return false
  const s = Math.max(1, scale | 0)
  const d = ADVANCED_DOT_SIZE * s
  ctx.fillStyle = ADVANCED_DOT_COLOR
  ctx.fillRect(ox, oy, d, d)
  return true
}

export const ICON_PALETTE = {
  '.': null,
  k: '#2c2c28',
  w: '#f4e8c0',
  g: '#5a8f3a',
  l: '#c5e0a3',
  y: '#cec95f',
  r: '#c42b5a',
  b: '#5a4030',
  n: '#9e5a4f',
}

export const ICON_MAPS = {
  move_speed: [
    '............',
    '......kk....',
    '.....kwwk...',
    '....kwwlk...',
    '...kwwllk...',
    '..kgggggk...',
    '.kggggk.....',
    'kkgggk......',
    'k.kgk.......',
    '..kk........',
    '............',
    '............',
  ],
  ammo_cap: [
    '............',
    '..k....k....',
    '.kyk..kyk...',
    '..kykkyk....',
    '...kyyk.....',
    '..kykkyk....',
    '.kyk..kyk...',
    '..k....k....',
    '....kk......',
    '...kwwk.....',
    '....kk......',
    '............',
  ],
  reload: [
    '............',
    '....kkkk....',
    '...kllllk...',
    '..klk..klk..',
    '.klk....klk.',
    '.kl......lk.',
    '.klk....kk..',
    '..klk..k....',
    '...kllk.kk..',
    '....kk.kwwk.',
    '........kk..',
    '............',
  ],
  power: [
    '............',
    '.....kk.....',
    '....kyyk....',
    '...kyyyyk...',
    '..kyyyyyyk..',
    '.kyyyyyyyyk.',
    '..kkkykkkk..',
    '....kyk.....',
    '....kyk.....',
    '...kkykk....',
    '............',
    '............',
  ],
  survive: [
    '............',
    '...krk.krk..',
    '..krrrkrrrk.',
    '.krrrrrrrrk.',
    '.krrrrrrrrk.',
    '..krrrrrrk..',
    '...krrrrk...',
    '....krrk....',
    '.....kk.....',
    '............',
    '............',
    '............',
  ],
  recover: [
    '............',
    '.....kk.....',
    '....kwwk....',
    '...kwggwk...',
    '..kwggggwk..',
    '.kwggggggwk.',
    '..kwggggwk..',
    '...kwggwk...',
    '....kwwk....',
    '.....kk.....',
    '............',
    '............',
  ],
  earth: [
    '............',
    '.....kk.....',
    '....kggk....',
    '...kggggk...',
    '..kkggggkk..',
    '.kbbkggkbbk.',
    '..kbbbbbbk..',
    '...kbbbbk...',
    '....kbbk....',
    '.....kk.....',
    '............',
    '............',
  ],
  pierce: [
    '............',
    'k...........',
    '.k..........',
    '..kwwwwwk...',
    '...kwwwwk...',
    '....kwwwk...',
    '.....kwwk...',
    '......kwk...',
    '.......kk...',
    '........k...',
    '............',
    '............',
  ],
  eyes: [
    '............',
    '..kkkkkkkk..',
    '.kwwwwwwwwk.',
    '.kwkkwwkkwk.',
    '.kwwwwwwwwk.',
    '..kkkkkkkk..',
    '............',
    '..kk....kk..',
    '.kwwk..kwwk.',
    '..kk....kk..',
    '............',
    '............',
  ],
  giant: [
    '............',
    '...kkkkkk...',
    '..kyyyyyyk..',
    '.kyyyyyyyyk.',
    '.kykkyykkyk.',
    '.kyyyyyyyyk.',
    '..kyyyyyyk..',
    '...kkyykk...',
    '....kyyk....',
    '.....kk.....',
    '............',
    '............',
  ],
}

function fixRows(rows) {
  return rows.map((row) => row.padEnd(ICON_SIZE, '.').slice(0, ICON_SIZE))
}

export function iconRows(id) {
  const src = ICON_MAPS[id]
  if (!src) return null
  return fixRows(src)
}

export function paintIcon(ctx, id, ox = 0, oy = 0, scale = 1) {
  const rows = iconRows(id)
  if (!rows || !ctx) return false
  const s = Math.max(1, scale | 0)
  for (let y = 0; y < ICON_SIZE; y++) {
    for (let x = 0; x < ICON_SIZE; x++) {
      const color = ICON_PALETTE[rows[y][x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(ox + x * s, oy + y * s, s, s)
    }
  }
  return true
}

export function countInk(id) {
  const rows = iconRows(id)
  if (!rows) return 0
  let n = 0
  for (const row of rows) {
    for (const ch of row) {
      if (ICON_PALETTE[ch]) n += 1
    }
  }
  return n
}
