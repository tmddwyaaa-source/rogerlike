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
 *   env.addEarth()                 // 大地啊：普通树每波 +2 棵、果实概率 +10%/层、结晶掉落上限 +2/层（可叠）
 *   env.earthPicks()               // 大地啊已选层数（= mods.extraTrees ÷ TREE_EXTRA_PER_EARTH）
 *   env.getTreeAnimTime()          // 普通树动画时间：只在 update(dt>0) 推进（4 帧 / 0.1s 一帧 / 0.4s 一轮）
 *   env.treeFrameIndexOf(tree)     // 该树此刻的帧号（时间驱动 + 每树相位错开）
 *   env.updatePickups(dt, player)  // 暂停时仍让结晶飞
 *   env.updatePickups(dt, player, { collect: false })  // 升级停顿：只飞不拾取
 */
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants.js'
import { drawGrass } from '../render/grass.js'
import { FRUIT_CHANCE, MAGNET_BONUS_STEP, TREE_EXTRA_PER_EARTH, TREE_FRAME_SEC, TREE_FRAME_SOURCES, TREE_SEED_COUNT, TREE_SPAWN_COUNT, TREE_SRC, earthPicksFromExtraTrees, treeDropElapsed, treeFrameAt, treePhaseForIndex } from './constants.js'
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
  TREE_ANIM_SEC,
  TREE_CRYSTAL_EARTH_STEP,
  TREE_EXTRA_PER_EARTH,
  TREE_FRAMES,
  TREE_FRAME_SEC,
  TREE_FRAME_SOURCES,
  earthPicksFromExtraTrees,
  treeDropElapsed,
  treeFrameAt,
  treePhaseForIndex,
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

  /**
   * P42 批次5（TASK-035）：大地啊已选层数。
   * 沿用 `mods.extraTrees`（每层 +TREE_EXTRA_PER_EARTH 棵）反推，不新起平行计数。
   */
  function earthPicks() {
    return earthPicksFromExtraTrees(mods.extraTrees)
  }

  /** 掉落用的时间轴：把 earth 层数折算进去（等价于上限 +2/层），掉落模块本身不用改。 */
  function dropElapsed(sec) {
    return treeDropElapsed(sec, earthPicks())
  }

  // —— P42 批次6（TASK-040）：普通树（浅树）4 帧序列动画 ——
  /** 4 帧贴图；未 loadAssets / node 环境为空数组 ⇒ 走 trees.js 既有兜底色块。 */
  let treeFrames = []
  /** 动画时间只在 update 里推进；draw 不推进（暂停/升级 match 不调 update ⇒ 整帧停住）。 */
  let treeAnimT = 0

  function animUsable(img) {
    return !!(img && img.complete !== false && (img.naturalWidth || img.width))
  }

  function firstUsableTreeFrame() {
    for (const f of treeFrames) {
      if (animUsable(f)) return f
    }
    return null
  }

  /**
   * 每棵树的相位（秒）：按实例下标占满一轮 4 个帧桶（0/0.1/0.2/0.3）。
   * 刻意不消耗 random()：刷树位置用的是同一条随机序列，动画不该打乱它。
   */
  function ensureTreePhases() {
    const list = trees.trees
    for (let i = 0; i < list.length; i++) {
      const tree = list[i]
      if (tree && !Number.isFinite(tree.animPhase)) tree.animPhase = treePhaseForIndex(i)
    }
  }

  /** 该树此刻的帧号（时间驱动 + 自身相位）。 */
  function treeFrameIndexOf(tree) {
    const n = treeFrames.length
    if (!n || !tree) return 0
    return treeFrameAt(treeAnimT + (tree.animPhase ?? 0), n, TREE_FRAME_SEC)
  }

  /** 该树此刻的贴图；所选帧缺图则退回第一个可用帧（通常是第 0 帧），全缺返回 null。 */
  function treeSpriteOf(tree) {
    if (!treeFrames.length) return null
    const chosen = treeFrames[treeFrameIndexOf(tree)]
    return animUsable(chosen) ? chosen : firstUsableTreeFrame()
  }

  function drawTrees(ctx) {
    if (!firstUsableTreeFrame()) {
      trees.draw(ctx, null)
      return
    }
    for (const tree of trees.trees) {
      const spr = treeSpriteOf(tree)
      const dx = Math.round(tree.x - tree.w / 2)
      const dy = Math.round(tree.y - tree.h / 2)
      ctx.drawImage(
        spr,
        0,
        0,
        spr.naturalWidth || spr.width,
        spr.naturalHeight || spr.height,
        dx,
        dy,
        tree.w,
        tree.h,
      )
    }
  }

  const pickups = createPickupField({
    ...opts,
    getFruitChance: () => Math.min(1, FRUIT_CHANCE + mods.fruitBonus),
    getMagnetBonus: () => mods.magnetBonus,
  })
  const trees = createTreeField({
    random: opts.random,
    onDestroyed: (tree) => pickups.spawnTreeDrops(tree.x, tree.y, dropElapsed(elapsed)),
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
    // P42 批次6：4 帧按序并发加载；任一张失败只是那张 naturalWidth=0，
    // 取帧时退回第一个可用帧（通常是第 0 帧），不崩。
    treeFrames = await Promise.all(
      TREE_FRAME_SOURCES.map((src) => {
        const img = new Image()
        img.src = src
        return img
          .decode()
          .then(() => img)
          .catch(() => img)
      }),
    )
    sprite = treeFrames[0] ?? null
    await decorations.loadAssets()
    return sprite
  }

  function update(dt, focus, camera, elapsedSec) {
    ensureSeed(focus, camera)
    elapsed = elapsedSec ?? elapsed + dt
    // 动画时间只随本窗 update 的 dt 推进；暂停/升级时 match 不调 update ⇒ 整帧停住。
    if (dt > 0) treeAnimT += dt
    ensureTreePhases()
    trees.update(dt, focus, camera, elapsed)
    ensureTreePhases()
    pickups.update(dt, focus)
  }

  function draw(ctx, camera) {
    ensureSeed(null, camera)
    ensureTreePhases()
    drawGrass(ctx, camera)
    decorations.draw(ctx, camera)
    drawTrees(ctx)
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
      return pickups.spawnTreeDrops(x, y, dropElapsed(elapsedSec ?? elapsed))
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
    /** P42 批次5：大地啊层数（= mods.extraTrees ÷ TREE_EXTRA_PER_EARTH），供查收/断言读取。 */
    earthPicks,
    /** P42 批次6：普通树动画时间（只在 update(dt>0) 里推进）。 */
    getTreeAnimTime: () => treeAnimT,
    /** P42 批次6：该树此刻的帧号（0..3，时间驱动 + 自身相位）。 */
    treeFrameIndexOf,
    /** P42 批次6：4 帧贴图（未加载时为 []）。 */
    treeFrames: () => treeFrames,
    addEarth() {
      mods.extraTrees += TREE_EXTRA_PER_EARTH
      mods.fruitBonus += 0.1
    },
    addMagnet() {
      mods.magnetBonus += MAGNET_BONUS_STEP
    },
  }
}
