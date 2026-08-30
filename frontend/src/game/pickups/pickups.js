import { BODY } from '../constants.js'
import {
  ADVANCED_CRYSTAL_COLOR,
  ADVANCED_CRYSTAL_EXP,
  ADVANCED_CRYSTAL_RIM,
  CRYSTAL_COLOR,
  CRYSTAL_EXP,
  CRYSTAL_HI_COLOR,
  CRYSTAL_SIZE,
  FRUIT_CHANCE,
  FRUIT_H,
  FRUIT_HEAL,
  FRUIT_W,
  MAGNET_RANGE,
  PICKUP_COLLECT_RANGE,
  PICKUP_SPEED,
  rollTreeCrystals,
} from '../world/constants.js'

/**
 * 结晶 / 水果拾取：2 身位吸附。
 * 小怪掉结晶走 spawnCrystal，供 M6 调用。
 *
 * @param {{
 *   random?: () => number,
 *   hooks?: { onCrystal?: (n: number) => void, onFruit?: (heal: number) => void }
 * }} [opts]
 */
export function createPickupField(opts = {}) {
  const random = opts.random ?? Math.random
  const hooks = opts.hooks ?? {}
  const items = []

  /** 默认普通结晶（1 经验）。advanced 标记高级结晶（紫边、6 经验）。 */
  function spawnCrystal(x, y, advanced = false) {
    return spawnCrystalAt(x, y, { advanced })
  }

  /** M6 掉落接口：可显式指定是否高级结晶。 */
  function spawnCrystalAt(x, y, { advanced = false } = {}) {
    items.push({
      type: 'crystal',
      x,
      y,
      vx: 0,
      vy: 0,
      w: CRYSTAL_SIZE,
      h: CRYSTAL_SIZE,
      advanced: !!advanced,
    })
  }

  /** n 个结晶均匀散在以 (x,y) 为心、半径 BODY 的圆盘内，避免叠成一点。 */
  function spawnCrystalBurst(x, y, n = 1) {
    const count = Math.max(0, n | 0)
    for (let i = 0; i < count; i++) {
      const ang = random() * Math.PI * 2
      const r = Math.sqrt(random()) * BODY
      spawnCrystal(x + Math.cos(ang) * r, y + Math.sin(ang) * r)
    }
  }

  function spawnFruit(x, y) {
    items.push({
      type: 'fruit',
      x,
      y,
      vx: 0,
      vy: 0,
      w: FRUIT_W,
      h: FRUIT_H,
    })
  }

  function spawnTreeDrops(x, y, elapsedSec = 0) {
    const n = rollTreeCrystals(random, elapsedSec)
    for (let i = 0; i < n; i++) {
      const jx = (random() - 0.5) * BODY
      const jy = (random() - 0.5) * BODY
      spawnCrystal(x + jx, y + jy)
    }
    if (random() < (typeof opts.getFruitChance === 'function' ? opts.getFruitChance() : FRUIT_CHANCE)) {
      spawnFruit(x + (random() - 0.5) * 6, y + (random() - 0.5) * 6)
    }
  }

  function magnetBonus() {
    return typeof opts.getMagnetBonus === 'function' ? opts.getMagnetBonus() : 0
  }

  function crystalMagnetRange() {
    return MAGNET_RANGE + BODY * magnetBonus()
  }

  /** 黑洞：只给结晶打强制吸入标记，不当帧删、不当帧给经验。水果不吸。 */
  function pullAllCrystals() {
    for (const it of items) {
      if (it.type === 'crystal') it.forcedPull = true
    }
  }

  /**
   * @param {number} dt
   * @param {{ x: number, y: number }} focus
   * @param {{ collect?: boolean }} [opts] collect:false 时只飞不拾取（升级停顿）
   */
  function update(dt, focus, opts = {}) {
    const collect = opts.collect !== false
    const crystalMagnet2 = crystalMagnetRange() * crystalMagnetRange()
    const fruitMagnet2 = MAGNET_RANGE * MAGNET_RANGE
    const collect2 = PICKUP_COLLECT_RANGE * PICKUP_COLLECT_RANGE
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]
      const dx = focus.x - it.x
      const dy = focus.y - it.y
      const d2 = dx * dx + dy * dy
      if (collect && d2 <= collect2) {
        if (it.type === 'fruit') hooks.onFruit?.(FRUIT_HEAL)
        else hooks.onCrystal?.(it.advanced ? ADVANCED_CRYSTAL_EXP : CRYSTAL_EXP)
        items.splice(i, 1)
        continue
      }
      const forced = it.type === 'crystal' && it.forcedPull
      const inRange =
        it.type === 'crystal' ? d2 <= crystalMagnet2 : d2 <= fruitMagnet2
      if ((forced || inRange) && d2 > 0) {
        const d = Math.sqrt(d2)
        it.x += (dx / d) * PICKUP_SPEED * dt
        it.y += (dy / d) * PICKUP_SPEED * dt
      }
    }
  }

  function draw(ctx) {
    for (const it of items) {
      if (it.type === 'fruit') drawFruit(ctx, it)
      else drawCrystal(ctx, it)
    }
  }

  return {
    items,
    spawnCrystal,
    spawnCrystalAt,
    spawnCrystalBurst,
    spawnFruit,
    spawnTreeDrops,
    pullAllCrystals,
    crystalMagnetRange,
    update,
    draw,
  }
}

function drawCrystal(ctx, it) {
  const s = it.w
  const x = Math.round(it.x)
  const y = Math.round(it.y)
  if (it.advanced) {
    // 明显外覆层：紫十字加宽并包住蓝十字，四周与尖端都露紫边（不再是只剩 2px 小尖）。
    const r = ADVANCED_CRYSTAL_RIM
    const t = 2 + r * 2
    const e = s + r * 2
    ctx.fillStyle = ADVANCED_CRYSTAL_COLOR
    ctx.fillRect(x - t / 2, y - e / 2, t, e) // 垂直外覆（宽臂 + 尖端）
    ctx.fillRect(x - e / 2, y - t / 2, e, t) // 水平外覆（宽臂 + 尖端）
  }
  ctx.fillStyle = CRYSTAL_COLOR
  ctx.fillRect(x - 1, y - s / 2, 2, s)
  ctx.fillRect(x - s / 2, y - 1, s, 2)
  ctx.fillStyle = CRYSTAL_HI_COLOR
  ctx.fillRect(x - 1, y - 1, 2, 2)
}

function drawFruit(ctx, it) {
  const x = Math.round(it.x - it.w / 2)
  const y = Math.round(it.y - it.h / 2)
  ctx.fillStyle = '#d42b2b'
  ctx.fillRect(x + 1, y, it.w - 2, it.h)
  ctx.fillRect(x, y + 1, it.w, it.h - 2)
  ctx.fillStyle = '#3d6b2a'
  ctx.fillRect(x + 3, y, 2, 2)
  ctx.fillStyle = '#ff6b5b'
  ctx.fillRect(x + 2, y + 2, 2, 2)
}
