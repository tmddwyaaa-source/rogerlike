/**
 * M7 环境与掉落门面。
 *
 * 本模块不改 engine.js。M9 / 引擎接线：
 *   const env = createEnvironment({ hooks: { onCrystal, onFruit } })
 *   await env.loadAssets()
 *   env.update(dt, followTarget, camera, elapsedSec)
 *   env.draw(ctx, camera)          // 须在 ctx.translate(-cam) 之后
 *   env.hitAt(bx, by, 15)          // M5 子弹；返回 { hit, dealt, tree }
 *   env.hitSlashAt({ x, y, ang, length, thick, damage })  // 战士挥砍 OBB
 *   env.collideSolid(player)       // M4 移动后
 *   env.spawnCrystal(x, y)         // M6 小怪掉落（普通）
 *   env.spawnCrystalAt(x, y, { advanced })  // M6 高级结晶掉落接口 ({advanced?:boolean})
 *   env.spawnCrystalBurst(x, y, n) // 冰人等大量结晶，BODY 内抖动
 *   env.pullAllCrystals()          // 黑洞：结晶飞向角色
 *   env.addMagnet()                // 磁铁：吸取范围 +1 身位
 *   env.updatePickups(dt, player)  // 暂停时仍让结晶飞
 *   env.updatePickups(dt, player, { collect: false })  // 升级停顿：只飞不拾取
 */
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import { drawGrass } from '../render/grass.js'
import { FRUIT_CHANCE, MAGNET_BONUS_STEP, TREE_SEED_COUNT, TREE_SPAWN_COUNT, TREE_SRC } from './constants.js'
import { createPickupField } from '../pickups/pickups.js'
import { createTreeField } from './trees.js'
import { createDecorationField } from './decorations.js'

export { drawGrass } from '../render/grass.js'
export {
  MAGNET_BONUS_STEP,
  MAGNET_RANGE,
  PICKUP_SPEED,
  TREE_DRAW_H,
  TREE_DROP_CRYSTALS,
  TREE_HP_BASE,
  TREE_HP_PER_TIER,
  TREE_SEED_COUNT,
  TREE_SRC,
  CRYSTAL_EXP,
  ADVANCED_CRYSTAL_EXP,
  CRYSTAL_COLOR,
  CRYSTAL_HI_COLOR,
  ADVANCED_CRYSTAL_COLOR,
  ADVANCED_CRYSTAL_RIM,
  DECOR_STICK_COUNT,
  DECOR_STONE_COUNT,
  DECOR_STICK_SOURCES,
  DECOR_STONE_SOURCES,
  DECOR_PADDING,
  treeCrystalMax,
  treeHpForTier,
  treeSpawnInterval,
} from './constants.js'

export function createEnvironment(opts = {}) {
  const mods = {
    extraTrees: 0,
    fruitBonus: 0,
    magnetBonus: 0,
  }
  let sprite = null
  let elapsed = 0
  let seeded = false

  const pickups = createPickupField({
    ...opts,
    getFruitChance: () => Math.min(1, FRUIT_CHANCE + mods.fruitBonus),
    getMagnetBonus: () => mods.magnetBonus,
  })
  const trees = createTreeField({
    random: opts.random,
    onDestroyed: (tree) => pickups.spawnTreeDrops(tree.x, tree.y, elapsed),
    getWaveCount: () => TREE_SPAWN_COUNT + mods.extraTrees,
    getHpGrowthAdd: opts.getHpGrowthAdd,
  })
  const decorations = createDecorationField({ random: opts.random })

  function ensureSeed(focus, camera) {
    if (seeded) return
    seeded = true
    const cx = focus?.x ?? WORLD_WIDTH / 2
    const cy = focus?.y ?? WORLD_HEIGHT / 2
    trees.seedAround(cx, cy, TREE_SEED_COUNT, camera)
    // 背景装饰物：火柴堆 25 / 石头 75，避开已有树与彼此，静态不碰撞。
    decorations.seed(trees.trees, WORLD_WIDTH, WORLD_HEIGHT)
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
    await decorations.loadAssets()
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
    decorations.draw(ctx, camera)
    trees.draw(ctx, sprite)
    pickups.draw(ctx)
  }

  return {
    trees: trees.trees,
    pickups: pickups.items,
    decorations: decorations.items,
    decorationsField: decorations,
    loadAssets,
    update,
    draw,
    hitAt: trees.hitAt,
    hitSlashAt: trees.hitSlashAt,
    collideSolid: trees.collideSolid,
    spawnCrystal: pickups.spawnCrystal,
    spawnCrystalAt: pickups.spawnCrystalAt,
    spawnCrystalBurst: pickups.spawnCrystalBurst,
    spawnTreeDrops(x, y, elapsedSec) {
      return pickups.spawnTreeDrops(x, y, elapsedSec ?? elapsed)
    },
    seedAround: trees.seedAround,
    hpForTier: trees.hpForTier,
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
      mods.magnetBonus += MAGNET_BONUS_STEP
    },
  }
}
