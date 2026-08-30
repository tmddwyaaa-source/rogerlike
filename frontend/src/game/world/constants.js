import { assetUrl } from '../../assetUrl.js'
import { BODY } from '../constants.js'

export const TREE_HP_BASE = 50
export const TREE_HP_PER_TIER = 5
export const TREE_SPAWN_COUNT = 1
export const TREE_SPAWN_INTERVAL0 = 10
export const TREE_SPAWN_INTERVAL_MIN = 5
export const TREE_SPAWN_DECAY = 0.97
export const DIFFICULTY_STEP_SEC = 45

/** 开局视野外普通树数量 */
export const TREE_SEED_COUNT = 3

export const TREE_DRAW_H = BODY * 3
export const TREE_ASPECT = 51 / 77
export const TREE_DRAW_W = Math.round(TREE_DRAW_H * TREE_ASPECT)
export const TREE_SRC = assetUrl('assets/树木/浅树.png')

export const TREE_DROP_CRYSTALS_MIN = 3
/** 开局上限；之后每满 1 分钟 +2 → 3～(6+2×floor(秒/60)) */
export const TREE_DROP_CRYSTALS_MAX = 6
export const TREE_CRYSTAL_MAX_STEP = 2
export const TREE_CRYSTAL_MAX_PERIOD = 60
/** @deprecated 区间掉落，保留下限兼容 */
export const TREE_DROP_CRYSTALS = TREE_DROP_CRYSTALS_MIN
export const FRUIT_CHANCE = 0.3
export const FRUIT_HEAL = 1

export const MAGNET_RANGE = BODY * 2
/** 每次磁铁 +1 身位（加，不乘）。 */
export const MAGNET_BONUS_STEP = 1
export const PICKUP_COLLECT_RANGE = BODY * 0.55
/** 吸入飞行速度（90×1.5）。黑洞与普通吸附共用。 */
export const PICKUP_SPEED = 135

export const CRYSTAL_SIZE = 5
export const CRYSTAL_EXP = 1
export const ADVANCED_CRYSTAL_EXP = 6
export const CRYSTAL_COLOR = '#7ec8e8'
export const CRYSTAL_HI_COLOR = '#e8f7ff'
/** 高级结晶紫色外覆层颜色（零素材，程序绘制）。 */
export const ADVANCED_CRYSTAL_COLOR = '#8a3fd6'
/** 高级结晶紫色外覆层厚度：加宽紫十字并包住蓝十字，形成清晰紫边（四周+尖端各 r 像素）。 */
export const ADVANCED_CRYSTAL_RIM = 2
export const FRUIT_W = 11
export const FRUIT_H = 12

/** 背景装饰物：火柴堆 / 石头（=火柴堆×3），静态背景。 */
/** 绘制缩放：按源图原始像素 × DECOR_DRAW_SCALE，小到"地面点缀"。 */
export const DECOR_DRAW_SCALE = 1 / 3
/** 保底下限：最长边至少这么多像素，避免小到看不清。 */
export const DECOR_STICK_MIN_SIZE = 7
export const DECOR_STONE_MIN_SIZE = 6
export const DECOR_STICK_COUNT = 800
export const DECOR_STONE_COUNT = 2400
export const DECOR_STICK_SOURCES = ['火柴堆-1.png', '火柴堆-2.png', '火柴堆-3.png', '火柴堆-4.png']
export const DECOR_STONE_SOURCES = ['石头-5.png', '石头-6.png', '石头-7.png', '石头-8.png']
/** 装饰物之间 / 与树的额外间距，保证不重叠。 */
export const DECOR_PADDING = 8

export function difficultyTier(elapsedSec) {
  return Math.floor(Math.max(0, elapsedSec) / DIFFICULTY_STEP_SEC)
}

export function treeHpForTier(t, extra = 0) {
  return TREE_HP_BASE + (TREE_HP_PER_TIER + extra) * t
}

export function treeSpawnInterval(t) {
  return Math.max(
    TREE_SPAWN_INTERVAL_MIN,
    TREE_SPAWN_INTERVAL0 * TREE_SPAWN_DECAY ** t,
  )
}

export function treeCrystalMax(elapsedSec = 0) {
  const minutes = Math.floor(Math.max(0, elapsedSec) / TREE_CRYSTAL_MAX_PERIOD)
  return TREE_DROP_CRYSTALS_MAX + TREE_CRYSTAL_MAX_STEP * minutes
}

export function rollTreeCrystals(random = Math.random, elapsedSec = 0) {
  const min = TREE_DROP_CRYSTALS_MIN
  const max = treeCrystalMax(elapsedSec)
  const span = max - min + 1
  return min + Math.floor(random() * span)
}
