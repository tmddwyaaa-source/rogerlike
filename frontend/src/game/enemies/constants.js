import { BODY } from '../constants.js'

/** 蘑菇怪 / 蜗牛怪绘制约 16px；源图 32×32 单帧缩放到此。 */
export const CREEP_DRAW = 16
export const CREEP_FRAMES = 1
export const CREEP_ANIM_FPS = 8
export const CREEP_SRC = '/assets/小怪/蘑菇怪.png'
export const SNAIL_SRC = '/assets/小怪/蜗牛怪.png'
export const SPLIT_SRC = '/assets/小怪/裂怪.png'
export const SLIME_X1_SRC = '/assets/小怪/史莱姆x-1.png'
export const SLIME_X3_SRC = '/assets/小怪/史莱姆x-3.png'

/** 与 M7 普通树同量级：约 3 身位高。 */
export const GRAY_DRAW = Math.round(BODY * 2.5)
export const GRAY_SRC = '/assets/树木/灰树.png'

export const BLACK_KEY = 12
