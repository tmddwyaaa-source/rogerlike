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
export const FRUIT_W = 11
export const FRUIT_H = 12

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
