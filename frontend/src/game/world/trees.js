import {
  BODY,
  BODY_W,
  SPAWN_R_NEAR,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  isNearAndOutOfView,
} from '../constants.js'
import {
  TREE_DRAW_H,
  TREE_DRAW_W,
  TREE_SPAWN_COUNT,
  difficultyTier,
  treeHpForTier,
  treeSpawnInterval,
} from './constants.js'
import { TREE_LEAF_LIT, TREE_LEAF_SHADE, TREE_TRUNK } from '../render/grass.js'

const VIEW_HALF_DIAG = Math.hypot(VIEW_WIDTH, VIEW_HEIGHT) / 2
const MIN_TREE_GAP = TREE_DRAW_H * 0.85
const HIT_PAD = 2

function aabb(tree) {
  return {
    x: tree.x - tree.w / 2,
    y: tree.y - tree.h / 2,
    w: tree.w,
    h: tree.h,
  }
}

function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

/**
 * 普通树：仅子弹可毁，碰撞只阻挡。
 * @param {{ random?: () => number, onDestroyed?: (tree: object) => void }} [opts]
 */
export function createTreeField(opts = {}) {
  const random = opts.random ?? Math.random
  const trees = []
  let spawnAcc = 0

  function occupied(x, y) {
    const gap2 = MIN_TREE_GAP * MIN_TREE_GAP
    for (const t of trees) {
      if (dist2(x, y, t.x, t.y) < gap2) return true
    }
    return false
  }

  function spawnAt(x, y, hp) {
    const w = TREE_DRAW_W
    const h = TREE_DRAW_H
    const tree = {
      x,
      y,
      w,
      h,
      hp,
      maxHp: hp,
      solid: true,
      kind: 'normal',
    }
    trees.push(tree)
    return tree
  }

  function trySpawnNear(focus, camera, hp) {
    const rMin = VIEW_HALF_DIAG + 24
    const rMax = SPAWN_R_NEAR
    for (let i = 0; i < 28; i++) {
      const ang = random() * Math.PI * 2
      const r = rMin + random() * Math.max(8, rMax - rMin)
      let x = focus.x + Math.cos(ang) * r
      let y = focus.y + Math.sin(ang) * r
      x = Math.max(hMargin(), Math.min(WORLD_WIDTH - hMargin(), x))
      y = Math.max(vMargin(), Math.min(WORLD_HEIGHT - vMargin(), y))
      if (!isNearAndOutOfView(x, y, focus.x, focus.y, camera, SPAWN_R_NEAR)) continue
      if (occupied(x, y)) continue
      return spawnAt(x, y, hp)
    }
    return null
  }

  function hMargin() {
    return TREE_DRAW_W / 2 + BODY
  }
  function vMargin() {
    return TREE_DRAW_H / 2 + BODY
  }

  /** 开局仅在「靠近且视野外」撒树（默认 3 棵）。 */
  function seedAround(cx, cy, count = 3, camera = null) {
    const hp = treeHpForTier(0)
    const cam =
      camera ??
      ({
        x: cx - VIEW_WIDTH / 2,
        y: cy - VIEW_HEIGHT / 2,
      })
    const focus = { x: cx, y: cy }
    let n = 0
    for (let i = 0; i < count * 12 && n < count; i++) {
      const t = trySpawnNear(focus, cam, hp)
      if (t) n += 1
    }
    return n
  }

  function update(dt, focus, camera, elapsedSec) {
    const t = difficultyTier(elapsedSec)
    const interval = treeSpawnInterval(t)
    spawnAcc += dt
    while (spawnAcc >= interval) {
      spawnAcc -= interval
      const hp = treeHpForTier(t)
      const n =
        typeof opts.getWaveCount === 'function' ? opts.getWaveCount() : TREE_SPAWN_COUNT
      for (let k = 0; k < n; k++) {
        trySpawnNear(focus, camera, hp)
      }
    }
  }

  /**
   * 子弹命中。碰撞/撞击不得调用本函数。
   * @returns {{ hit: boolean, destroyed: boolean, tree: object | null }}
   */
  function hitAt(x, y, damage, radius = HIT_PAD) {
    for (let i = trees.length - 1; i >= 0; i--) {
      const tree = trees[i]
      const b = aabb(tree)
      const cx = Math.max(b.x, Math.min(x, b.x + b.w))
      const cy = Math.max(b.y, Math.min(y, b.y + b.h))
      if (dist2(x, y, cx, cy) > radius * radius) continue
      tree.hp -= damage
      if (tree.hp <= 0) {
        trees.splice(i, 1)
        opts.onDestroyed?.(tree)
        return { hit: true, destroyed: true, tree }
      }
      return { hit: true, destroyed: false, tree }
    }
    return { hit: false, destroyed: false, tree: null }
  }

  /**
   * 把实体推出树 AABB。不扣树血、不销毁。
   * entity 以中心点计，默认宽高为火柴人 BODY_W × BODY。
   */
  function collideSolid(entity) {
    const ew = entity.w ?? BODY_W
    const eh = entity.h ?? BODY
    let blocked = false
    for (const tree of trees) {
      const b = aabb(tree)
      const ex = entity.x - ew / 2
      const ey = entity.y - eh / 2
      if (!overlaps(ex, ey, ew, eh, b.x, b.y, b.w, b.h)) continue
      blocked = true
      const overlapX = Math.min(ex + ew - b.x, b.x + b.w - ex)
      const overlapY = Math.min(ey + eh - b.y, b.y + b.h - ey)
      if (overlapX < overlapY) {
        entity.x += entity.x < tree.x ? -overlapX : overlapX
      } else {
        entity.y += entity.y < tree.y ? -overlapY : overlapY
      }
    }
    return blocked
  }

  function draw(ctx, sprite) {
    for (const tree of trees) {
      const dx = Math.round(tree.x - tree.w / 2)
      const dy = Math.round(tree.y - tree.h / 2)
      if (sprite && sprite.complete && sprite.naturalWidth) {
        ctx.drawImage(sprite, 0, 0, sprite.naturalWidth, sprite.naturalHeight, dx, dy, tree.w, tree.h)
      } else {
        drawFallbackTree(ctx, dx, dy, tree.w, tree.h)
      }
    }
  }

  return {
    trees,
    spawnAt,
    seedAround,
    trySpawnNear,
    update,
    hitAt,
    collideSolid,
    draw,
    aabb,
  }
}

function drawFallbackTree(ctx, x, y, w, h) {
  const tw = Math.max(2, Math.round(w * 0.22))
  const th = Math.round(h * 0.28)
  ctx.fillStyle = TREE_LEAF_SHADE
  ctx.fillRect(x + w * 0.12, y + h * 0.38, w * 0.76, h * 0.28)
  ctx.fillStyle = TREE_LEAF_LIT
  ctx.fillRect(x + w * 0.2, y + h * 0.12, w * 0.6, h * 0.32)
  ctx.fillRect(x + w * 0.28, y, w * 0.44, h * 0.22)
  ctx.fillStyle = TREE_TRUNK
  ctx.fillRect(x + (w - tw) / 2, y + h - th, tw, th)
}
