import { assetUrl } from '../../assetUrl.js'
import { BODY } from '../constants.js'

/** 蘑菇怪 / 蜗牛怪绘制约 16px；源图 32×32 单帧缩放到此。 */
export const CREEP_DRAW = 16
/** P42：8 种小怪各 4 帧序列（每帧 32×32 独立 PNG），无限循环。 */
export const CREEP_FRAMES = 4
/** 帧时长 0.1s ≈ 10fps；与游侠 `render/ranger.js` 的 ANIM_FPS 同一套「按时间取帧」口径，不用逐帧计数。 */
export const CREEP_ANIM_FPS = 10
/** 单帧时长（秒）。 */
export const CREEP_FRAME_SEC = 1 / CREEP_ANIM_FPS
/** 一轮时长（秒）= 4 帧 × 0.1s = 0.4s。 */
export const CREEP_ANIM_SEC = CREEP_FRAMES * CREEP_FRAME_SEC

/**
 * P42 序列帧文件名表：第 1 帧 `X.png`，其后 `X-2.png` / `X-3.png` / `X-4.png`。
 * 只含本轮派工的 8 种小怪：蘑菇怪 / 裂怪 / 蜗牛怪 / 史莱姆x-1 / 史莱姆x-3 / 蝎子怪 / 毒刺怪 / 兰花。
 * 冰人（boss）、灰树、木桩不在此表，沿用原单帧路径。
 */
export const CREEP_FRAME_NAMES = {
  creep: ['蘑菇怪.png', '蘑菇怪-2.png', '蘑菇怪-3.png', '蘑菇怪-4.png'],
  split: ['裂怪.png', '裂怪-2.png', '裂怪-3.png', '裂怪-4.png'],
  snail: ['蜗牛怪.png', '蜗牛怪-2.png', '蜗牛怪-3.png', '蜗牛怪-4.png'],
  slime_x1: ['史莱姆x-1.png', '史莱姆x-1-2.png', '史莱姆x-1-3.png', '史莱姆x-1-4.png'],
  slime_x3: ['史莱姆x-3.png', '史莱姆x-3-2.png', '史莱姆x-3-3.png', '史莱姆x-3-4.png'],
  scorpion: ['蝎子怪.png', '蝎子怪-2.png', '蝎子怪-3.png', '蝎子怪-4.png'],
  stinger: ['毒刺怪.png', '毒刺怪-2.png', '毒刺怪-3.png', '毒刺怪-4.png'],
  orchid: ['兰花.png', '兰花-2.png', '兰花-3.png', '兰花-4.png'],
}

/** 8 种序列帧小怪的键（顺序 = CREEP_FRAME_NAMES 键序）；加载 / 绘制 / 自测共用同一来源。 */
export const CREEP_FRAME_KINDS = Object.keys(CREEP_FRAME_NAMES)

/** 某种怪按帧序的 4 个资源 URL（按 CREEP_FRAMES 截断）。 */
export function creepFrameSrcs(key) {
  return (CREEP_FRAME_NAMES[key] ?? [])
    .slice(0, CREEP_FRAMES)
    .map((name) => assetUrl(`assets/小怪/${name}`))
}

/** 单帧源（= 序列第 0 帧）：沿用旧导出名，语义为「这种怪的第 1 帧」。 */
export const CREEP_SRC = creepFrameSrcs('creep')[0]
export const SNAIL_SRC = creepFrameSrcs('snail')[0]
export const SCORPION_SRC = creepFrameSrcs('scorpion')[0]
export const STINGER_SRC = creepFrameSrcs('stinger')[0]
export const SPLIT_SRC = creepFrameSrcs('split')[0]
export const SLIME_X1_SRC = creepFrameSrcs('slime_x1')[0]
export const SLIME_X3_SRC = creepFrameSrcs('slime_x3')[0]
export const ICE_MAN_SRC = assetUrl('assets/小怪/冰人.png')
export const ORCHID_SRC = creepFrameSrcs('orchid')[0]
export const ICE_BULLET_SRC = assetUrl('assets/子弹/怪物子弹.png')
export const ICE_MAN_DRAW = 48
/** 有甲时不透明像素 1px 黄边（同伤害数字黄）。 */
export const ARMOR_OUTLINE = '#e0b84a'
/** P27 强化怪：素材最外圈紫色。 */
export const ELITE_OUTLINE = '#7a2fd6'
/** P27 冰人子弹：素材最外圈蓝色。 */
export const ICE_BULLET_OUTLINE = '#3f9fff'
export const ORCHID_DRAW = 16
export const ICE_BULLET_DRAW = 4

/** 与 M7 普通树同量级：约 3 身位高。 */
export const GRAY_DRAW = Math.round(BODY * 2.5)
export const GRAY_SRC = assetUrl('assets/树木/灰树.png')

export const BLACK_KEY = 12
