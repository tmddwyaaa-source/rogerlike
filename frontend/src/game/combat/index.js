/**
 * M5 战斗：蓄力箭、穿透、双发、Blood 击中。无弹匣/换弹。
 *
 * M9 接线（本模块不改 match.js）：
 *   createCombat({ player, targets: enemies, hooks: { hitWorld: env.hitAt } })
 *   按住蓄力、松开发射；HUD 读 getCharge / chargeMax / charging
 */
import {
  BODY,
  BODY_W,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  screenToWorld,
} from '../constants.js'
import {
  ARROW_H,
  ARROW_SPEED,
  ARROW_SRC,
  ARROW_W,
  ATTACK_ANIM_SEC,
  ATTACK_BASE,
  BLOOD_FPS,
  BLOOD_FRAME,
  BLOOD_FRAMES,
  BLOOD_SRC,
  CHARGE_MAX_SEC,
  FIRE_INTERVAL,
  HIT_RADIUS,
  chargeRatio,
  createBow,
  fireAngles,
  knockbackForCharge,
  pierceForCharge,
  shotDamage,
} from '../weapons/index.js'

export {
  AMMO_CAP_BONUS,
  ARROW_SPEED,
  ATTACK_ANIM_SEC,
  ATTACK_BASE,
  BULLET_DAMAGE,
  BULLET_SPEED,
  CHARGE_MAX_SEC,
  CHARGE_UPGRADE,
  DMG_MAX,
  DMG_MIN,
  DUAL_SPREAD_DEG,
  FIRE_COOLDOWN,
  FIRE_INTERVAL,
  HIT_RADIUS,
  KNOCKBACK_DIST,
  MAG_SIZE,
  POWER_DMG,
  RELOAD_FACTOR,
  RELOAD_SEC,
  SCATTER_DMG_PENALTY,
  SPREAD_DEG,
  WEAPON_NAME,
  chargeRatio,
  createBow,
  createPistol,
  damageForCharge,
  fireAngles,
  giantSizeMul,
  knockbackForCharge,
  pierceForCharge,
  shotDamage,
} from '../weapons/index.js'

const STEP_PX = 4
const BLACK_KEY = 12

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function aabbOf(ent) {
  const w = ent.w ?? BODY_W
  const h = ent.h ?? BODY
  return {
    x: ent.x - w / 2,
    y: ent.y - h / 2,
    w,
    h,
  }
}

function circleHitsAabb(x, y, r, box) {
  const cx = clamp(x, box.x, box.x + box.w)
  const cy = clamp(y, box.y, box.y + box.h)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

export function facingDirFromAngle(facing = 0) {
  const c = Math.cos(facing)
  const s = Math.sin(facing)
  if (Math.abs(s) >= Math.abs(c)) return s >= 0 ? 'D' : 'U'
  return 'S'
}

/**
 * 击退距离 max(0, dist − knockbackResist)。
 * knockbackable === false（树）完全不位移。
 * @returns {boolean} 是否发生位移
 */
export function applyKnockback(target, nx, ny, dist = BODY) {
  if (!target || target.knockbackable === false) return false
  const resist = target.knockbackResist || 0
  const travel = Math.max(0, dist - resist)
  if (travel <= 0) return false
  const len = Math.hypot(nx, ny) || 1
  target.x += (nx / len) * travel
  target.y += (ny / len) * travel
  return true
}

function hurt(target, damage) {
  if (typeof target.takeHit === 'function') {
    target.takeHit(damage)
    return
  }
  target.hp = (target.hp ?? 0) - damage
}

function chromaBlack(img) {
  if (typeof document === 'undefined') return img
  const c = document.createElement('canvas')
  c.width = img.naturalWidth || img.width
  c.height = img.naturalHeight || img.height
  if (!c.width || !c.height) return img
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const data = g.getImageData(0, 0, c.width, c.height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] < BLACK_KEY && px[i + 1] < BLACK_KEY && px[i + 2] < BLACK_KEY) {
      px[i + 3] = 0
    }
  }
  g.putImageData(data, 0, 0)
  return c
}

function loadImg(src, keyed) {
  if (typeof Image === 'undefined') return null
  const img = new Image()
  img.src = src
  if (keyed && typeof document !== 'undefined') {
    img.decode?.().then(() => {
      img._sheet = chromaBlack(img)
    }).catch(() => {})
  }
  return img
}

function sheetOf(img) {
  return img?._sheet || img
}

/**
 * @param {{
 *   player?: object,
 *   targets?: object[],
 *   hooks?: { hitWorld?: Function },
 *   pistol?: object,
 *   weapon?: object,
 * }} [opts]
 */
export function createCombat(opts = {}) {
  const player = opts.player
  const targets = opts.targets ?? []
  const hooks = opts.hooks ?? {}
  const passedWeapon = opts.weapon ?? opts.pistol
  const weapon = passedWeapon ?? createBow()
  if (!passedWeapon && typeof player?.attack === 'number') {
    weapon.attack = player.attack
    weapon.dmgBonus = weapon.attack - ATTACK_BASE
    weapon.damage = weapon.attack
  } else if (player && typeof player.attack !== 'number') {
    player.attack = weapon.attack
  }
  const bullets = []
  const hitFx = []
  let unbind = () => {}
  let holding = false
  let pendingHold = false
  const imgs = {
    arrow: loadImg(ARROW_SRC, true),
    D: loadImg(BLOOD_SRC.D, true),
    S: loadImg(BLOOD_SRC.S, true),
    U: loadImg(BLOOD_SRC.U, true),
  }

  function syncPlayerCharge(on) {
    if (!player) return
    if (typeof player.setCharging === 'function') player.setCharging(on)
    else player.charging = on
  }

  function spawnArrow(ang, damage, knockback, pierceLeft, sizeMul) {
    const ox = Math.cos(ang) * 10
    const oy = Math.sin(ang) * 10
    const mul = sizeMul > 0 ? sizeMul : 1
    bullets.push({
      x: (player?.x ?? 0) + ox,
      y: (player?.y ?? 0) + oy,
      vx: Math.cos(ang) * ARROW_SPEED,
      vy: Math.sin(ang) * ARROW_SPEED,
      ang,
      damage,
      knockback,
      pierceLeft,
      hitSet: new Set(),
      alive: true,
      sizeMul: mul,
      radius: HIT_RADIUS * mul,
      drawW: ARROW_W * mul,
      drawH: ARROW_H * mul,
    })
  }

  function spawnHitFx(x, y, ang) {
    hitFx.push({
      x,
      y,
      t: 0,
      dir: facingDirFromAngle(ang),
    })
  }

  /** 程序/自测开火。默认满蓄。 */
  function tryFire(ratio = 1) {
    if (weapon.fireCd > 0) return false
    const r = clamp(ratio, 0, 1)
    const attack = weapon.attack ?? player?.attack ?? ATTACK_BASE
    const damage = shotDamage(r, attack)
    const knockback = knockbackForCharge(r)
    const pierceLeft = pierceForCharge(r, weapon.pierceBonus ?? 0)
    const base = player?.facing ?? 0
    const angles = fireAngles(base, weapon.extraShots ?? 0, weapon.backShots ?? 0)
    const sizeMul = weapon.sizeMul ?? 1
    for (const ang of angles) spawnArrow(ang, damage, knockback, pierceLeft, sizeMul)
    weapon.fireCd = FIRE_INTERVAL
    weapon.charge = 0
    weapon.charging = false
    syncPlayerCharge(false)
    if (player) player.attackT = ATTACK_ANIM_SEC
    return true
  }

  function beginCharge() {
    if (weapon.fireCd > 0) {
      pendingHold = true
      return false
    }
    const max = weapon.effectiveChargeMax()
    if (max <= 0) return tryFire(1)
    weapon.charging = true
    weapon.charge = 0
    syncPlayerCharge(true)
    return true
  }

  function releaseCharge() {
    pendingHold = false
    if (!weapon.charging && weapon.charge <= 0) {
      syncPlayerCharge(false)
      return false
    }
    const max = weapon.effectiveChargeMax()
    const ratio = chargeRatio(weapon.charge, max)
    return tryFire(ratio)
  }

  function hitActors(b) {
    for (const ent of targets) {
      if (!ent || ent.hp <= 0) continue
      if (b.hitSet.has(ent)) continue
      if (!circleHitsAabb(b.x, b.y, b.radius ?? HIT_RADIUS, aabbOf(ent))) continue
      hurt(ent, b.damage)
      applyKnockback(ent, b.vx, b.vy, b.knockback)
      spawnHitFx(b.x, b.y, b.ang)
      b.hitSet.add(ent)
      const isCreep = ent.knockbackable !== false
      if (isCreep && b.pierceLeft > 0) {
        b.pierceLeft -= 1
        continue
      }
      b.alive = false
      return true
    }
    return false
  }

  function hitWorld(b) {
    const fn = hooks.hitWorld
    if (typeof fn !== 'function') return false
    const res = fn(b.x, b.y, b.damage, b.radius ?? HIT_RADIUS)
    if (res && res.hit) {
      spawnHitFx(b.x, b.y, b.ang)
      b.alive = false
      return true
    }
    return false
  }

  function stepBullet(b, dt) {
    const dist = Math.hypot(b.vx, b.vy) * dt
    const steps = Math.max(1, Math.ceil(dist / STEP_PX))
    const sdt = dt / steps
    for (let i = 0; i < steps && b.alive; i++) {
      b.x += b.vx * sdt
      b.y += b.vy * sdt
      if (b.x < 0 || b.y < 0 || b.x > WORLD_WIDTH || b.y > WORLD_HEIGHT) {
        b.alive = false
        return
      }
      if (hitActors(b) || hitWorld(b)) return
    }
  }

  function update(dt) {
    if (dt <= 0) return
    if (weapon.fireCd > 0) weapon.fireCd = Math.max(0, weapon.fireCd - dt)
    if (pendingHold && holding && weapon.fireCd <= 0) beginCharge()
    if (weapon.charging) {
      const max = weapon.effectiveChargeMax()
      if (max <= 0) tryFire(1)
      else weapon.charge = Math.min(max, weapon.charge + dt)
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
      stepBullet(bullets[i], dt)
      if (!bullets[i].alive) bullets.splice(i, 1)
    }
    const bloodLife = BLOOD_FRAMES / BLOOD_FPS
    for (let i = hitFx.length - 1; i >= 0; i--) {
      hitFx[i].t += dt
      if (hitFx[i].t >= bloodLife) hitFx.splice(i, 1)
    }
  }

  function drawImg(ctx, img, x, y, ang, w, h) {
    const sheet = sheetOf(img)
    if (!sheet || !(sheet.complete || sheet.width) || !(sheet.naturalWidth || sheet.width)) {
      return false
    }
    ctx.save()
    ctx.translate(Math.round(x), Math.round(y))
    if (ang != null) ctx.rotate(ang)
    ctx.drawImage(sheet, -w / 2, -h / 2, w, h)
    ctx.restore()
    return true
  }

  function drawChargeBar(ctx) {
    const max = weapon.effectiveChargeMax()
    if (!player || max <= 0) return
    if (!weapon.charging && weapon.charge <= 0) return
    const progress = chargeRatio(weapon.charge, max)
    const bw = 22
    const bh = 4
    const x = Math.round(player.x - bw / 2)
    const y = Math.round(player.y - (player.h ?? BODY) / 2 - 10)
    ctx.fillStyle = '#e0b84a'
    ctx.fillRect(x, y + 1, bw, bh - 2)
    ctx.fillRect(x - 1, y, 3, bh)
    ctx.fillRect(x + bw - 2, y, 3, bh)
    const nx = x + Math.round(progress * (bw - 2))
    ctx.fillStyle = '#6a6a62'
    ctx.fillRect(nx, y - 1, 2, bh + 2)
  }

  function drawBlood(ctx, fx) {
    const img = imgs[fx.dir] || imgs.D
    const sheet = sheetOf(img)
    const frame = Math.min(
      BLOOD_FRAMES - 1,
      Math.floor(fx.t * BLOOD_FPS),
    )
    if (sheet && (sheet.naturalWidth || sheet.width)) {
      ctx.drawImage(
        sheet,
        frame * BLOOD_FRAME,
        0,
        BLOOD_FRAME,
        BLOOD_FRAME,
        Math.round(fx.x - BLOOD_FRAME / 2),
        Math.round(fx.y - BLOOD_FRAME / 2),
        BLOOD_FRAME,
        BLOOD_FRAME,
      )
      return
    }
    ctx.fillStyle = '#c42b2b'
    ctx.fillRect(Math.round(fx.x - 3), Math.round(fx.y - 3), 6, 6)
  }

  function draw(ctx) {
    if (!ctx) return
    drawChargeBar(ctx)
    for (const b of bullets) {
      if (!drawImg(ctx, imgs.arrow, b.x, b.y, b.ang, b.drawW ?? ARROW_W, b.drawH ?? ARROW_H)) {
        const w = Math.max(2, Math.round(b.drawW ?? 4))
        const h = Math.max(1, Math.round(b.drawH ?? 2))
        ctx.fillStyle = '#f4e8c0'
        ctx.fillRect(Math.round(b.x - w / 2), Math.round(b.y - h / 2), w, h)
      }
    }
    for (const fx of hitFx) drawBlood(ctx, fx)
  }

  function bindInput(io = {}) {
    unbind()
    if (typeof window === 'undefined') return

    const aim = (e) => {
      if (!player?.lookAt || !io.canvas || !io.camera || !io.getScale) return
      const rect = io.canvas.getBoundingClientRect()
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        io.camera,
        io.getScale(),
      )
      player.lookAt(world.x, world.y)
    }
    const onDown = (e) => {
      if (e.button !== 0) return
      holding = true
      aim(e)
      beginCharge()
    }
    const onUp = (e) => {
      if (e.button !== 0) return
      holding = false
      aim(e)
      releaseCharge()
    }
    const onMove = (e) => {
      if (holding) aim(e)
    }
    const onLeave = () => {
      if (!holding) return
      holding = false
      releaseCharge()
    }

    const el = io.canvas || window
    el.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    unbind = () => {
      el.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      holding = false
      pendingHold = false
      unbind = () => {}
    }
  }

  return {
    pistol: weapon,
    weapon,
    bullets,
    targets,
    tryFire,
    beginCharge,
    releaseCharge,
    update,
    draw,
    bindInput,
    unbindInput: () => unbind(),
    applyUpgrade: (id) => {
      const ok = weapon.applyUpgrade(id)
      if (ok && player) player.attack = weapon.attack
      return ok
    },
    applyKnockback,
    getRecoil: () => 0,
    getSwing: () => 0,
    isReloading: () => false,
    getCharge: () => weapon.charge,
    get chargeMax() {
      return weapon.chargeMax
    },
    get charging() {
      return weapon.charging
    },
  }
}
