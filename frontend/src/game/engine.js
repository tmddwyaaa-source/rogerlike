import {
  BODY,
  BODY_W,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  VIEW_WIDTH,
  VIEW_HEIGHT,
  CLEAR_COLOR,
  integerScale,
} from './constants.js'

/**
 * Canvas 主循环 + 整数倍缩放 + 相机跟随。
 * M9：setHooks({ update, drawWorld }) 接管占位逻辑；setFollowTarget 接玩家。
 */
export function createEngine(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false })
  const camera = { x: 0, y: 0 }
  const placeholder = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    vx: 48,
    vy: 32,
  }
  let followTarget = placeholder
  let scale = 1
  let raf = 0
  let last = 0
  let running = false
  let hooks = { update: null, drawWorld: null }

  function resize() {
    const parent = canvas.parentElement || document.body
    const cssW = parent.clientWidth || window.innerWidth
    const cssH = parent.clientHeight || window.innerHeight
    scale = integerScale(cssW, cssH)
    canvas.width = VIEW_WIDTH * scale
    canvas.height = VIEW_HEIGHT * scale
    canvas.style.width = `${canvas.width}px`
    canvas.style.height = `${canvas.height}px`
    ctx.imageSmoothingEnabled = false
  }

  function follow() {
    camera.x = followTarget.x - VIEW_WIDTH / 2
    camera.y = followTarget.y - VIEW_HEIGHT / 2
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, camera.x))
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, camera.y))
  }

  function tickPlaceholder(dt) {
    placeholder.x += placeholder.vx * dt
    placeholder.y += placeholder.vy * dt
    if (placeholder.x < BODY || placeholder.x > WORLD_WIDTH - BODY) {
      placeholder.vx *= -1
    }
    if (placeholder.y < BODY || placeholder.y > WORLD_HEIGHT - BODY) {
      placeholder.vy *= -1
    }
    placeholder.x = Math.max(BODY, Math.min(WORLD_WIDTH - BODY, placeholder.x))
    placeholder.y = Math.max(BODY, Math.min(WORLD_HEIGHT - BODY, placeholder.y))
  }

  function tick(dt) {
    if (typeof hooks.update === 'function') {
      hooks.update(dt, { camera, followTarget, scale })
    } else if (followTarget === placeholder) {
      tickPlaceholder(dt)
    }
    follow()
  }

  function drawDefaultWorld() {
    ctx.strokeStyle = 'rgba(80, 120, 50, 0.35)'
    ctx.lineWidth = 1
    for (let x = 0; x <= WORLD_WIDTH; x += 500) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, WORLD_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 500) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(WORLD_WIDTH, y)
      ctx.stroke()
    }
    ctx.strokeStyle = '#3d5a2a'
    ctx.strokeRect(0.5, 0.5, WORLD_WIDTH - 1, WORLD_HEIGHT - 1)

    ctx.fillStyle = '#c42b5a'
    ctx.fillRect(
      Math.round(followTarget.x - BODY_W / 2),
      Math.round(followTarget.y - BODY / 2),
      BODY_W,
      BODY,
    )
  }

  function draw() {
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = CLEAR_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.scale(scale, scale)
    ctx.translate(-camera.x, -camera.y)

    if (typeof hooks.drawWorld === 'function') {
      hooks.drawWorld(ctx, { camera, followTarget, scale })
    } else {
      drawDefaultWorld()
    }

    ctx.restore()
  }

  function frame(t) {
    if (!running) return
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0
    last = t
    tick(dt)
    draw()
    raf = requestAnimationFrame(frame)
  }

  function start() {
    if (running) return
    running = true
    resize()
    window.addEventListener('resize', resize)
    last = 0
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }

  function setFollowTarget(entity) {
    followTarget = entity ?? placeholder
  }

  function setHooks(next = {}) {
    hooks = {
      update: next.update ?? null,
      drawWorld: next.drawWorld ?? null,
    }
  }

  return {
    start,
    stop,
    camera,
    placeholder,
    setFollowTarget,
    setHooks,
    getScale: () => scale,
    getContext: () => ctx,
  }
}
