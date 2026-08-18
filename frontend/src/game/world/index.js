/**
 * M7 环境与掉落门面。
 *
 * 本模块不改 engine.js。M9 / 引擎接线：
 *   const env = createEnvironment({ hooks: { onCrystal, onFruit } })
 *   await env.loadAssets()
 *   env.update(dt, followTarget, camera, elapsedSec)
 *   env.draw(ctx, camera)          // 须在 ctx.translate(-cam) 之后
 *   env.hitAt(bx, by, 15)          // M5 子弹
 *   env.collideSolid(player)       // M4 移动后
 *   env.spawnCrystal(x, y)         // M6 小怪掉落
 *   env.pullAllCrystals()          // 黑洞：结晶飞向角色
 *   env.addMagnet()                // 磁铁：吸取范围 ×1.5
 *   env.updatePickups(dt, player)  // 暂停时仍让结晶飞
 *   env.updatePickups(dt, player, { collect: false })  // 升级停顿：只飞不拾取
 */
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import { drawGrass } from '../render/grass.js'
import { FRUIT_CHANCE, MAGNET_MUL_STEP, TREE_SEED_COUNT, TREE_SPAWN_COUNT, TREE_SRC } from './constants.js'
import { createPickupField } from '../pickups/pickups.js'
import { createTreeField } from './trees.js'

export { drawGrass } from '../render/grass.js'
export {
  MAGNET_MUL_STEP,
  MAGNET_RANGE,
  PICKUP_SPEED,
  TREE_DRAW_H,
  TREE_DROP_CRYSTALS,
  TREE_HP_BASE,
  TREE_SEED_COUNT,
  TREE_SRC,
  treeCrystalMax,
  treeSpawnInterval,
} from './constants.js'

export function createEnvironment(opts = {}) {
  const mods = {
    extraTrees: 0,
    fruitBonus: 0,
    magnetMul: 1,
  }
  let sprite = null
  let elapsed = 0
  let seeded = false

  const pickups = createPickupField({
    ...opts,
    getFruitChance: () => Math.min(1, FRUIT_CHANCE + mods.fruitBonus),
    getMagnetMul: () => mods.magnetMul,
  })
  const trees = createTreeField({
    random: opts.random,
    onDestroyed: (tree) => pickups.spawnTreeDrops(tree.x, tree.y, elapsed),
    getWaveCount: () => TREE_SPAWN_COUNT + mods.extraTrees,
  })

  function ensureSeed(focus, camera) {
    if (seeded) return
    seeded = true
    const cx = focus?.x ?? WORLD_WIDTH / 2
    const cy = focus?.y ?? WORLD_HEIGHT / 2
    trees.seedAround(cx, cy, TREE_SEED_COUNT, camera)
  }

  async function loadAssets() {
    if (typeof Image === 'undefined') return null
    const img = new Image()
    img.src = TREE_SRC
    try {
      await img.decode()
      sprite = img
    } catch {
      sprite = img
    }
    return sprite
  }

  function update(dt, focus, camera, elapsedSec) {
    ensureSeed(focus, camera)
    elapsed = elapsedSec ?? elapsed + dt
    trees.update(dt, focus, camera, elapsed)
    pickups.update(dt, focus)
  }

  function draw(ctx, camera) {
    ensureSeed(null, camera)
    drawGrass(ctx, camera)
    trees.draw(ctx, sprite)
    pickups.draw(ctx)
  }

  return {
    trees: trees.trees,
    pickups: pickups.items,
    loadAssets,
    update,
    draw,
    hitAt: trees.hitAt,
    collideSolid: trees.collideSolid,
    spawnCrystal: pickups.spawnCrystal,
    spawnTreeDrops(x, y, elapsedSec) {
      return pickups.spawnTreeDrops(x, y, elapsedSec ?? elapsed)
    },
    seedAround: trees.seedAround,
    pullAllCrystals: pickups.pullAllCrystals,
    /** 兼容旧名：飞行吸入，不当帧清空。M1 接线后可直接调这个。 */
    vacuumCrystals: pickups.pullAllCrystals,
    updatePickups(dt, focus, opts) {
      pickups.update(dt, focus, opts)
    },
    magnetRange: pickups.crystalMagnetRange,
    mods,
    addEarth() {
      mods.extraTrees += 2
      mods.fruitBonus += 0.1
    },
    addMagnet() {
      mods.magnetMul *= MAGNET_MUL_STEP
    },
  }
}
