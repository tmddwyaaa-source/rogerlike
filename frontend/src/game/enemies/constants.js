import { assetUrl } from '../../assetUrl.js'
import { BODY } from '../constants.js'

/** 蘑菇怪 / 蜗牛怪绘制约 16px；源图 32×32 单帧缩放到此。 */
export const CREEP_DRAW = 16
/** P42 序列帧统一口径：0.1s/帧（10fps）；与游侠 `render/ranger.js` 的 ANIM_FPS 同一套「按时间取帧」，不用逐帧计数。 */
export const ANIM_FPS = 10
/** 单帧时长（秒）。 */
export const ANIM_FRAME_SEC = 1 / ANIM_FPS
/** P42：8 种小怪各 4 帧序列（每帧 32×32 独立 PNG），无限循环。 */
export const CREEP_FRAMES = 4
/** 兼容旧名（= ANIM_FPS）。 */
export const CREEP_ANIM_FPS = ANIM_FPS
/** 兼容旧名（= ANIM_FRAME_SEC）。 */
export const CREEP_FRAME_SEC = ANIM_FRAME_SEC
/** 一轮时长（秒）= 4 帧 × 0.1s = 0.4s。 */
export const CREEP_ANIM_SEC = CREEP_FRAMES * ANIM_FRAME_SEC

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
export const ORCHID_SRC = creepFrameSrcs('orchid')[0]

/** P42 批次6：冰人（Boss）6 帧序列，0.1s/帧 ⇒ 0.6s 一轮。 */
export const ICE_MAN_FRAMES = 6
export const ICE_MAN_FRAME_NAMES = [
  '冰人.png',
  '冰人-2.png',
  '冰人-3.png',
  '冰人-4.png',
  '冰人-5.png',
  '冰人-6.png',
]
export const ICE_MAN_ANIM_SEC = ICE_MAN_FRAMES * ANIM_FRAME_SEC

/** 冰人按帧序的 6 个资源 URL。 */
export function iceManFrameSrcs() {
  return ICE_MAN_FRAME_NAMES.slice(0, ICE_MAN_FRAMES).map((name) => assetUrl(`assets/小怪/${name}`))
}

export const ICE_MAN_SRC = iceManFrameSrcs()[0]

/**
 * P42 批次7 R1：**两类怪物弹体彻底拆开**（批次6 把 spawnIceBullet 的贴图换成冰锥后，蝎子怪的子弹也一起变成冰锥了）。
 * - 通用（两类共用）：判定盒 ICE_BULLET_DRAW、描边色 BULLET_OUTLINE；物理/命中/生命期同一套。
 * - 冰人：冰锥贴图 + ICE_BULLET_SPRITE_DRAW(12) + 尖头角补偿。
 * - 蝎子怪：旧贴图 怪物子弹.png + 绘制尺寸 = 判定盒(4) + **不旋转、不补偿**。
 */
export const ICE_BULLET_SRC = assetUrl('assets/子弹/冰锥.png')
export const ICE_BULLET_TIP_ANGLE = -Math.PI / 2
export const ICE_BULLET_TIP_OFFSET = -ICE_BULLET_TIP_ANGLE
/** 冰锥贴图绘制边长（纯视觉，只属于冰人）。判定仍用 ICE_BULLET_DRAW，未改。 */
export const ICE_BULLET_SPRITE_DRAW = 12
/** 蝎子怪弹体贴图：批次6 之前的旧素材（原生 4×4）。 */
export const SCORPION_BULLET_SRC = assetUrl('assets/子弹/怪物子弹.png')
/** 蝎子怪弹体绘制边长 = 判定盒（4）：批次6 之前就是轴对齐 4×4，观感与判定一致。 */
export const SCORPION_BULLET_SPRITE_DRAW = 4
export const ICE_MAN_DRAW = 48
/** 有甲时不透明像素 1px 黄边（同伤害数字黄）。 */
export const ARMOR_OUTLINE = '#e0b84a'
/** P27 强化怪：素材最外圈紫色。 */
export const ELITE_OUTLINE = '#7a2fd6'
/** 怪物弹体共用的蓝色描边（两类弹体都用；贴图/尺寸各自独立，见上）。 */
export const BULLET_OUTLINE = '#3f9fff'
/** 兼容旧名（= BULLET_OUTLINE）。 */
export const ICE_BULLET_OUTLINE = BULLET_OUTLINE
export const ORCHID_DRAW = 16
/** 怪物弹体判定盒（两类共用）。 */
export const ICE_BULLET_DRAW = 4

/** 与 M7 普通树同量级：约 3 身位高。 */
export const GRAY_DRAW = Math.round(BODY * 2.5)
/** P42 批次7 R2：灰树**回单帧**（树木不适合序列帧）。只用第 1 帧；灰树-2/-3/-4.png 留在磁盘上不再引用。 */
export const GRAY_SRC = assetUrl('assets/树木/灰树.png')

export const BLACK_KEY = 12
