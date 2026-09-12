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

/** P42 批次6（TASK-040）：普通树（浅树）4 帧序列动画 —— 与批次 4/5 同一套时间驱动口径。 */
export const TREE_FRAMES = 4
export const TREE_ANIM_FPS = 10
/** 单帧时长 0.1s（≈10fps）。 */
export const TREE_FRAME_SEC = 1 / TREE_ANIM_FPS
/** 一轮 0.4s（4 帧 × 0.1s），无限循环。 */
export const TREE_ANIM_SEC = TREE_FRAMES * TREE_FRAME_SEC
/** 第 1 帧仍是既有 TREE_SRC，向后兼容旧引用。 */
export const TREE_FRAME_SOURCES = [
  TREE_SRC,
  assetUrl('assets/树木/浅树-2.png'),
  assetUrl('assets/树木/浅树-3.png'),
  assetUrl('assets/树木/浅树-4.png'),
]

/**
 * 普通树按时间取帧（纯函数，便于断言）：帧索引只由 t 决定，调用次数/帧率都不影响。
 * 对帧数取模无限循环；越界与负时间走 `((i % n) + n) % n` 回绕（与批次6 地精口径一致），
 * 非有限值（NaN/±Infinity）按 t=0；非法 frames/帧时长回落到默认，结果恒在 [0, n)。
 */
export function treeFrameAt(t, frames = TREE_FRAMES, frameSec = TREE_FRAME_SEC) {
  const fn = Math.floor(Number(frames))
  const n = Number.isFinite(fn) && fn >= 1 ? fn : TREE_FRAMES
  const rawStep = Number(frameSec)
  const step = Number.isFinite(rawStep) && rawStep > 0 ? rawStep : TREE_FRAME_SEC
  const sec = Number(t)
  const safe = Number.isFinite(sec) ? sec : 0
  // +1e-9：0.3 / 0.1 在 IEEE754 下是 2.9999999999999996，不留容差会在 t=0.3 停在上一帧。
  const i = Math.floor(safe / step + 1e-9)
  return ((i % n) + n) % n
}

/**
 * 相位错开：按实例序号占满一轮里的 4 个帧桶（0/0.1/0.2/0.3）。
 * 刻意**不消耗 random()**：刷树位置用的是同一条随机序列，动画不该打乱它。
 * ≥5 棵时序列号取模会回到同一桶（全长只有 4 帧），与批次6 跟班的取舍一致。
 */
export function treePhaseForIndex(i = 0) {
  const n = Number.isFinite(i) ? Math.floor(i) : 0
  return (((n % TREE_FRAMES) + TREE_FRAMES) % TREE_FRAMES) * TREE_FRAME_SEC
}

export const TREE_DROP_CRYSTALS_MIN = 3
/** 开局上限；之后每满 1 分钟 +2 → 3～(6+2×floor(秒/60)) */
export const TREE_DROP_CRYSTALS_MAX = 6
export const TREE_CRYSTAL_MAX_STEP = 2
export const TREE_CRYSTAL_MAX_PERIOD = 60
/** P42 批次5：大地啊（earth）每层把普通树掉落的结晶**上限**再抬 +2（可叠）；下限与每分钟 +2 的节奏不变。 */
export const TREE_CRYSTAL_EARTH_STEP = 2
/** 大地啊每层同时 +2 棵普通树（既有行为）。抽成常量，供 earthPicks 反推，避免出现第二份 earth 计数。 */
export const TREE_EXTRA_PER_EARTH = 2
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

/**
 * 普通树掉落的结晶数量**上限**：`TREE_DROP_CRYSTALS_MAX + 2×floor(秒/60) + 2×earthPicks`。
 * 下限恒为 `TREE_DROP_CRYSTALS_MIN`；`earthPicks` 缺省 0 ⇒ 与旧口径逐值相同（每分钟 +2 不变）。
 */
export function treeCrystalMax(elapsedSec = 0, earthPicks = 0) {
  const minutes = Math.floor(Math.max(0, elapsedSec) / TREE_CRYSTAL_MAX_PERIOD)
  const picks = Math.floor(Math.max(0, Number.isFinite(earthPicks) ? earthPicks : 0))
  return (
    TREE_DROP_CRYSTALS_MAX +
    TREE_CRYSTAL_MAX_STEP * minutes +
    TREE_CRYSTAL_EARTH_STEP * picks
  )
}

/** 区间掉落：3 ～ treeCrystalMax(秒, earth 层数)，均匀取整。 */
export function rollTreeCrystals(random = Math.random, elapsedSec = 0, earthPicks = 0) {
  const min = TREE_DROP_CRYSTALS_MIN
  const max = treeCrystalMax(elapsedSec, earthPicks)
  const span = max - min + 1
  return min + Math.floor(random() * span)
}

/**
 * P42 批次5（TASK-035）：大地啊已选层数。
 * **沿用本模块既有的 earth 计数来源**（`mods.extraTrees` 每层 +TREE_EXTRA_PER_EARTH 棵），
 * 不新起一份平行状态；因此这里是「除以每层增量」的反推，而不是另存一个计数器。
 */
export function earthPicksFromExtraTrees(extraTrees = 0) {
  const n = Number.isFinite(extraTrees) ? extraTrees : 0
  return Math.floor(Math.max(0, n) / TREE_EXTRA_PER_EARTH)
}

/**
 * P42 批次5：把「大地啊层数」折算成掉落用的时间轴偏移。
 * 每层等价于提前一个 TREE_CRYSTAL_MAX_PERIOD（整数层 ⇒ 恰好 +TREE_CRYSTAL_EARTH_STEP 上限），
 * 即 `treeCrystalMax(sec + 60×picks, 0) === treeCrystalMax(sec, picks)`。
 * 掉落模块只吃 elapsedSec，故用这个等价折算把 earth 加成喂进去，而不去动掉落模块本身。
 */
export function treeDropElapsed(elapsedSec = 0, earthPicks = 0) {
  const sec = Number.isFinite(elapsedSec) ? elapsedSec : 0
  const picks = Math.floor(Math.max(0, Number.isFinite(earthPicks) ? earthPicks : 0))
  return Math.max(0, sec) + TREE_CRYSTAL_MAX_PERIOD * picks
}
