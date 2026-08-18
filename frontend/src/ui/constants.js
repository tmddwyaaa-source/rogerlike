/** M8 UI / 升级 / 上报常量。 */



export const GAME_TITLE = '类幸存者'



export const CHAR_NAME = '游侠'

export const WEAPON_NAME = '游侠弓'



export const DIFFICULTY_ONE = {

  id: '1',

  name: '难度一',

}



/** 首级 15；每升一级需求 +4；无等级上限 */

export const EXP_BASE = 15

export const EXP_GROWTH = 4

/** 测试模式「提高等级」可选 0～3，不是等级帽 */

export const LEVEL_BOOST_MAX = 3

/** 每升到 6/11/16…：攻击 +1、移速 +0.05 */
export const LEVEL_GROWTH_EVERY = 5

export const LEVEL_GROWTH_ATK = 1

export const LEVEL_GROWTH_SPEED = 0.05



export const CHARGE_MAX_SEC = 0.75

export const SURVIVE_WIN_SEC = 600



/** 「敏捷」每次 +0.20 设计单位 */

export const MOVE_SPEED_BONUS = 0.2



export const UPGRADE_MOVE = 'move_speed'

export const UPGRADE_AMMO = 'ammo_cap'

export const UPGRADE_RELOAD = 'reload'

export const UPGRADE_POWER = 'power'

export const UPGRADE_SURVIVE = 'survive'

export const UPGRADE_RECOVER = 'recover'

export const UPGRADE_EARTH = 'earth'

export const UPGRADE_PIERCE = 'pierce'

export const UPGRADE_EYES = 'eyes'

export const UPGRADE_GIANT = 'giant'

export const UPGRADE_BLACKHOLE = 'blackhole'

export const UPGRADE_MAGNET = 'magnet'

export const UPGRADE_GOBLIN = 'goblin'

export const UPGRADE_RABBIT = 'rabbit'

/** 每次选择地精：所有跟班伤害 +10 */
export const COMPANION_DAMAGE_BONUS = 10

export const UPGRADE_TIER_ADVANCED = 'advanced'

/** 本局第 5/10/15… 次三选一才可能出高级项 */
export const ADVANCED_OFFER_EVERY = 5

export const ADVANCED_OFFER_CHANCE = 0.3



export const UPGRADE_CHOICE_COUNT = 3



export const UPGRADES = [

  { id: UPGRADE_MOVE, title: '敏捷', desc: '移速 +0.20' },

  { id: UPGRADE_AMMO, title: '散射', desc: '弹道 +1，伤害 −3' },

  { id: UPGRADE_RELOAD, title: '技巧', desc: '蓄力时间 −0.20' },

  { id: UPGRADE_POWER, title: '力量', desc: '伤害 +10' },

  { id: UPGRADE_SURVIVE, title: '生存', desc: '血上限 +1，回 1 滴血' },

  { id: UPGRADE_RECOVER, title: '恢复', desc: '回复 2 滴血' },

  { id: UPGRADE_EARTH, title: '大地啊', desc: '普通树 +2，果实概率 +10%' },

  { id: UPGRADE_PIERCE, title: '穿透', desc: '箭矢穿透 +1' },

  { id: UPGRADE_EYES, title: '开眼了', desc: '背后弹道 +1，伤害 −3' },

  { id: UPGRADE_GIANT, title: '大娃', desc: '首次弹体 ×2，之后每次 +50%' },

  { id: UPGRADE_BLACKHOLE, title: '黑洞', desc: '吸收全地图经验结晶' },

  { id: UPGRADE_MAGNET, title: '磁铁', desc: '结晶吸取范围 +50%' },

  { id: UPGRADE_GOBLIN, title: '地精', desc: '生成 1 个地精跟班，所有跟班伤害 +10', tier: 'advanced' },

  { id: UPGRADE_RABBIT, title: '兔子', desc: '生成 1 个兔子跟班' },

]



export const API_BASE = 'http://localhost:8080/api'

export const BGM_URL = '/assets/游戏音乐/music.ogg'

export const RANGER_IDLE_SRC = '/assets/characters/1/S_Idle.png'

export const RANGER_FRAME = 32

export function expNeedForLevel(level) {

  const lv = Math.max(1, level | 0)

  return EXP_BASE + EXP_GROWTH * (lv - 1)

}



export function upgradeById(id) {

  return UPGRADES.find((u) => u.id === id) ?? null

}

