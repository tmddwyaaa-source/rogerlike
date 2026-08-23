/**
 * P15：局内不再画「目标：活够10分钟」（改到选难度悬停，M8）。
 * queueObjectiveFx 仍导出，避免 match 未拆线时报错；绘制/忙碌恒空。
 */
export const OBJECTIVE_LIFE = 5
export const OBJECTIVE_TEXT = '目标：活够10分钟'
export const OBJECTIVE_INK = '#2c2c28'
export const OBJECTIVE_CREAM = '#f4e8c0'
export const OBJECTIVE_FADE = 0.45

export function queueObjectiveFx(player) {
  if (!player) return 0
  player.objectiveT = 0
  return 0
}

export function resetObjectiveFx(player) {
  if (!player) return
  player.objectiveT = 0
}

export function hasObjectiveFx() {
  return false
}

export function stepObjectiveFx(player) {
  if (!player) return
  if ((player.objectiveT ?? 0) !== 0) player.objectiveT = 0
}

/** 空实现：不画字。 */
export function drawObjectiveFx() {
  return 0
}
