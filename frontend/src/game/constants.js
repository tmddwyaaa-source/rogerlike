/** 身位（逻辑像素）= 主角高度上限。击退/吸附等按此计。 */
export const BODY = 22
export const BODY_W = 11

/** 固定逻辑世界：主角高 × 500 */
export const WORLD_WIDTH = BODY * 500
export const WORLD_HEIGHT = BODY * 500

/** 未缩放逻辑视野（16:9）。整数倍像素缩放作用在此之上。 */
export const VIEW_WIDTH = 400
export const VIEW_HEIGHT = 225

/** 「靠近且视野外」刷怪环外半径，供 M6/M7 */
export const SPAWN_R_NEAR = 1000

export const CLEAR_COLOR = '#c5e0a3'

/** 设计移速单位 → 像素/秒 */
export const SPEED_PX_PER_UNIT = 80

export function getViewRect(camera) {
  return {
    x: camera.x,
    y: camera.y,
    w: VIEW_WIDTH,
    h: VIEW_HEIGHT,
  }
}

export function isInView(wx, wy, camera, padding = 0) {
  const { x, y, w, h } = getViewRect(camera)
  return (
    wx >= x - padding &&
    wx < x + w + padding &&
    wy >= y - padding &&
    wy < y + h + padding
  )
}

/** 距焦点 ≤ rNear 且不在视野矩形内（环形带）。 */
export function isNearAndOutOfView(
  wx,
  wy,
  focusX,
  focusY,
  camera,
  rNear = SPAWN_R_NEAR,
) {
  const dist = Math.hypot(wx - focusX, wy - focusY)
  return dist <= rNear && !isInView(wx, wy, camera)
}

export function worldToScreen(wx, wy, camera, scale) {
  return {
    x: (wx - camera.x) * scale,
    y: (wy - camera.y) * scale,
  }
}

export function screenToWorld(sx, sy, camera, scale) {
  return {
    x: sx / scale + camera.x,
    y: sy / scale + camera.y,
  }
}

export function integerScale(cssW, cssH) {
  return Math.max(1, Math.floor(Math.min(cssW / VIEW_WIDTH, cssH / VIEW_HEIGHT)))
}
