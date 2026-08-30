import { assetUrl } from '../../assetUrl.js'
import { BODY } from '../constants.js'

/** 蘑菇怪 / 蜗牛怪绘制约 16px；源图 32×32 单帧缩放到此。 */
export const CREEP_DRAW = 16
export const CREEP_FRAMES = 1
export const CREEP_ANIM_FPS = 8
export const CREEP_SRC = assetUrl('assets/小怪/蘑菇怪.png')
export const SNAIL_SRC = assetUrl('assets/小怪/蜗牛怪.png')
export const SCORPION_SRC = assetUrl('assets/小怪/蝎子怪.png')
export const STINGER_SRC = assetUrl('assets/小怪/毒刺怪.png')
export const SPLIT_SRC = assetUrl('assets/小怪/裂怪.png')
export const SLIME_X1_SRC = assetUrl('assets/小怪/史莱姆x-1.png')
export const SLIME_X3_SRC = assetUrl('assets/小怪/史莱姆x-3.png')
export const ICE_MAN_SRC = assetUrl('assets/小怪/冰人.png')
export const ORCHID_SRC = assetUrl('assets/小怪/兰花.png')
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
