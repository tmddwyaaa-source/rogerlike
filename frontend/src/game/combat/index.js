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
  CHARGE_SIZE_BONUS,
  EMPOWER_ATK,
  EMPOWER_DRAW_H,
  EMPOWER_DRAW_W,
  EMPOWER_PIERCE,
  EMPOWER_SPEED,
  EMPOWER_SRC,
  FIRE_INTERVAL,
  HIT_RADIUS,
  MAGE_EXPAND_SEC,
  ORB_DRAW,
  ORB_SRC,
  SLASH_BODY_FRONT,
  SLASH_DRAW,
  SLASH_FPS,
  SLASH_FRAME,
  SLASH_FRAMES,
  SLASH_RANGE,
  SLASH_SRC,
  SLASH_THICK,
  chargeRatio,
  chargeSizeMul,
  createBow,
  fireAngles,
  fireKindForChar,
  knockbackForCharge,
  leftoverDamage,
  pierceForChar,
  resolveCharId,
  rollCrit,
  critDamageMul,
  sheetFrameIndex,
  shotDamage,
  slashLength,
  slashThick,
  warriorKnockback,
} from '../weapons/index.js'

export {
  AMMO_CAP_BONUS,
  ARROW_SPEED,
  ATTACK_ANIM_SEC,
  ATTACK_BASE,
  BULLET_DAMAGE,
  BULLET_SPEED,
  CHARGE_MAX_SEC,
  CHARGE_SIZE_BONUS,
  CHARGE_UPGRADE,
  CRIT_CHANCE_PER_PICK,
  CRIT_DAMAGE_MUL,
  critChanceForRoll,
  critDamageMul,
  DMG_MAX,
  DMG_MIN,
  DUAL_SPREAD_DEG,
  EMPOWER_ATK,
  EMPOWER_FULL_MUL,
  EMPOWER_PIERCE,
  EMPOWER_RANGER_FIRST,
  EMPOWER_SPEED,
  EMPOWER_SRC,
  FIRE_COOLDOWN,
  FIRE_INTERVAL,
  fireIntervalForPicks,
  fireKindForChar,
  HIT_RADIUS,
  KNOCKBACK_DIST,
  MAGE_ATTACK,
  MAGE_EXPAND_SEC,
  MAGE_FULL_SIZE,
  MAG_SIZE,
  ONLY_FAST_MUL,
  ORB_DRAW,
  POWER_DMG,
  REFINE_CRIT_DMG,
  REFINE_CRIT_STEP,
  RELOAD_FACTOR,
  RELOAD_SEC,
  rollCrit,
  SCATTER_DMG_PENALTY,
  SLASH_BODY_FRONT,
  SLASH_DRAW,
  SLASH_RANGE,
  SLASH_THICK,
  SPREAD_DEG,
  WARRIOR_ATTACK,
  WARRIOR_FULL_SIZE,
  WEAPON_NAME,
  attackForChar,
  chargeRatio,
  chargeSizeMul,
  createBow,
  createPistol,
  damageForCharge,
  fireAngles,
  giantSizeMul,
  knockbackForCharge,
  leftoverDamage,
  pierceForChar,
  pierceForCharge,
  resolveCharId,
  sheetFrameIndex,
  shotDamage,
  slashLength,
  slashThick,
  warriorKnockback,
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

function aabbHits(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/** 沿 ang 的旋转矩形（长×厚）对轴对齐盒。 */
export function obbHitsAabb(cx, cy, ang, length, thick, box) {
  const hw = (length > 0 ? length : 0) / 2
  const hh = (thick > 0 ? thick : 0) / 2
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  const acx = box.x + box.w / 2
  const acy = box.y + box.h / 2
  const dx = acx - cx
  const dy = acy - cy
  const lx = dx * c + dy * s
  const ly = -dx * s + dy * c
  const aw = box.w / 2
  const ah = box.h / 2
  const projX = aw * Math.abs(c) + ah * Math.abs(s)
  const projY = aw * Math.abs(s) + ah * Math.abs(c)
  return Math.abs(lx) <= hw + projX && Math.abs(ly) <= hh + projY
}

function projectileHits(b, ent) {
  const box = aabbOf(ent)
  if (b.kind === 'slash') {
    return obbHitsAabb(
      b.x,
      b.y,
      b.ang ?? 0,
      b.slashLen ?? b.drawW,
      b.slashThick ?? b.drawH,
      box,
    )
  }
  return circleHitsAabb(b.x, b.y, b.radius ?? HIT_RADIUS, box)
}

export function facingDirFromAngle(facing = 0) {
  const c = Math.cos(facing)
  const s = Math.sin(facing)
  if (Math.abs(s) >= Math.abs(c)) return s >= 0 ? 'D' : 'U'
  return 'S'
}

/**
 * 击退距离 max(0, dist − knockbackResist) × (knockbackScale ?? 1)。
 * knockbackable === false（树）完全不位移。
 * @returns {boolean} 是否发生位移
 */
export function applyKnockback(target, nx, ny, dist = BODY) {
  if (!target || target.knockbackable === false) return false
  const resist = target.knockbackResist || 0
  const scale = target.knockbackScale ?? 1
  const travel = Math.max(0, dist - resist) * scale
  if (travel <= 0) return false
  const len = Math.hypot(nx, ny) || 1
  target.x += (nx / len) * travel
  target.y += (ny / len) * travel
  return true
}

function hurt(target, damage) {
  if (typeof target.takeHit === 'function') {
    const dealt = target.takeHit(damage)
    return typeof dealt === 'number' ? dealt : damage
  }
  target.hp = (target.hp ?? 0) - damage
  return damage
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
 *   hooks?: { hitWorld?: Function, onFire?: Function },
 *   pistol?: object,
 *   weapon?: object,
 * }} [opts]
 */
export function createCombat(opts = {}) {
  const player = opts.player
  const targets = opts.targets ?? []
  const hooks = opts.hooks ?? {}
  const passedWeapon = opts.weapon ?? opts.pistol
  const charId0 = resolveCharId(player)
  const weapon = passedWeapon ?? createBow({
    charId: charId0,
    attack: typeof player?.attack === 'number' ? player.attack : undefined,
  })
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
  let slashSeq = 0
  const imgs = {
    arrow: loadImg(ARROW_SRC, true),
    orb: loadImg(ORB_SRC, true),
    D: loadImg(BLOOD_SRC.D, true),
    S: loadImg(BLOOD_SRC.S, true),
    U: loadImg(BLOOD_SRC.U, true),
    slash: SLASH_SRC.map((src) => loadImg(src, false)),
    empower: loadImg(EMPOWER_SRC, false),
  }

  function syncPlayerCharge(on) {
    if (!player) return
    if (typeof player.setCharging === 'function') player.setCharging(on)
    else player.charging = on
  }

  function notifyDamage(ent, dmg) {
    if (!ent || !(dmg > 0)) return
    if (typeof hooks.onDamage === 'function') hooks.onDamage(ent, dmg)
  }

  function spawnShot(ang, damage, knockback, pierceLeft, sizeMul, spec) {
    const mul = sizeMul > 0 ? sizeMul : 1
    const kind = spec.kind
    const slashLen = spec.slashLen > 0 ? spec.slashLen : slashLength(0, 1)
    const slashTh = spec.slashThick > 0 ? spec.slashThick : SLASH_THICK
    const dist = kind === 'slash' ? SLASH_BODY_FRONT + slashLen / 2 : 10
    const ox = Math.cos(ang) * dist
    const oy = Math.sin(ang) * dist
    const speed = spec.speed ?? ARROW_SPEED
    let drawW = ARROW_W * mul
    let drawH = ARROW_H * mul
    let radius = HIT_RADIUS * mul
    if (kind === 'orb') {
      drawW = ORB_DRAW * mul
      drawH = ORB_DRAW * mul
      radius = Math.max(HIT_RADIUS, ORB_DRAW / 2) * mul
    } else if (kind === 'slash') {
      drawW = slashLen
      drawH = slashTh
      radius = slashTh / 2
    } else if (kind === 'empower') {
      drawW = EMPOWER_DRAW_W * mul
      drawH = EMPOWER_DRAW_H * mul
      radius = HIT_RADIUS * 1.5 * mul
    }
    const b = {
      x: (player?.x ?? 0) + ox,
      y: (player?.y ?? 0) + oy,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      ang,
      damage,
      payload: null,
      knockback,
      pierceLeft,
      hitSet: new Set(),
      alive: true,
      sizeMul: mul,
      radius,
      drawW,
      drawH,
      slashLen,
      slashThick: slashTh,
      kind,
      variant: spec.variant ?? 0,
      t: 0,
      life: kind === 'slash' ? SLASH_FRAMES / SLASH_FPS : 0,
      overflowOn: Boolean(spec.overflowOn),
      expandOn: Boolean(spec.expandOn),
      expanding: false,
      expandT: 0,
      infinitePierce: Boolean(spec.infinitePierce),
      struck: false,
    }
    bullets.push(b)
    if (kind === 'slash') {
      hitActors(b)
      hitWorld(b)
      b.struck = true
    }
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
    const id = resolveCharId(player)
    const empower = id === 'ranger' && (weapon.empowerPicks | 0) >= 1 && r >= 1
    const attack = weapon.attack ?? player?.attack ?? ATTACK_BASE
    let damage = shotDamage(r, attack, {
      empowerFull: empower,
      charId: id,
      pierceBonus: weapon.pierceBonus ?? 0,
    })
    if (rollCrit(weapon.critRate ?? 0)) {
      damage *= critDamageMul(weapon.critRate ?? 0, weapon.refinePicks ?? 0)
    }
    const knockback = id === 'warrior'
      ? warriorKnockback(weapon.pierceBonus ?? 0)
      : knockbackForCharge(r)
    const pierceLeft = pierceForChar(
      id,
      r,
      weapon.pierceBonus ?? 0,
      empower ? EMPOWER_PIERCE : 0,
    )
    const base = player?.facing ?? 0
    const angles = fireAngles(base, weapon.extraShots ?? 0, weapon.backShots ?? 0)
    const sizeMul = chargeSizeMul(r, weapon.sizeMul ?? 1, id)
    let kind = 'arrow'
    let speed = ARROW_SPEED
    let variant = 0
    if (id === 'warrior') {
      kind = 'slash'
      speed = 0
      variant = slashSeq++ % 3
    } else if (id === 'mage') {
      kind = 'orb'
    } else if (empower) {
      kind = 'empower'
      speed = EMPOWER_SPEED
    }
    for (const ang of angles) {
      spawnShot(ang, damage, knockback, pierceLeft, sizeMul, {
        kind,
        speed,
        variant,
        overflowOn: empower,
        expandOn: id === 'mage' && r > 0,
        infinitePierce: id === 'warrior',
        slashLen: id === 'warrior' ? slashLength(r, weapon.sizeMul ?? 1) : 0,
        slashThick: id === 'warrior' ? slashThick(weapon.sizeMul ?? 1) : 0,
      })
    }
    hooks.onFire?.(fireKindForChar(id))
    weapon.fireCd = weapon.fireInterval ?? FIRE_INTERVAL
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

  function strike(ent, b, deal) {
    const hpBefore = ent.hp ?? 0
    const dealt = hurt(ent, deal)
    notifyDamage(ent, dealt)
    applyKnockback(ent, b.vx || Math.cos(b.ang), b.vy || Math.sin(b.ang), b.knockback)
    spawnHitFx(b.x, b.y, b.ang)
    b.hitSet.add(ent)
    return leftoverDamage(dealt, hpBefore)
  }

  function beginExpand(b, ent) {
    b.x = ent.x
    b.y = ent.y
    b.vx = 0
    b.vy = 0
    b.expanding = true
    b.expandT = 0
    b.alpha = 1
    const hitDraw = b.drawW || ORB_DRAW
    b.expandStartDraw = Math.max(hitDraw * 0.45, ORB_DRAW)
    b.expandMaxDraw = ORB_DRAW * (b.sizeMul > 0 ? b.sizeMul : 1)
    b.drawW = b.expandStartDraw
    b.drawH = b.expandStartDraw
    const maxR = Math.max(HIT_RADIUS, b.expandMaxDraw / 2)
    for (const t of targets) {
      if (!t || t.hp <= 0) continue
      if (t.knockbackable === false) continue
      if (!circleHitsAabb(b.x, b.y, maxR, aabbOf(t))) continue
      strike(t, b, b.damage)
    }
  }

  function hitActors(b) {
    if (b.expanding) return false
    const deal0 = b.payload ?? b.damage
    for (const ent of targets) {
      if (!ent || ent.hp <= 0) continue
      if (b.hitSet.has(ent)) continue
      if (!projectileHits(b, ent)) continue
      const isCreep = ent.knockbackable !== false
      if (b.kind === 'orb') {
        if (isCreep && b.expandOn) {
          beginExpand(b, ent)
          return true
        }
        strike(ent, b, deal0)
        b.alive = false
        return true
      }
      const deal = b.payload ?? deal0
      const left = strike(ent, b, deal)
      if (b.infinitePierce) continue
      if (isCreep && b.pierceLeft > 0) {
        b.pierceLeft -= 1
        continue
      }
      if (b.overflowOn && isCreep && left > 0) {
        b.payload = left
        continue
      }
      if (b.kind === 'slash') return true
      b.alive = false
      return true
    }
    return false
  }

  function applyWorldHit(b, res) {
    if (!res || !res.hit) return false
    spawnHitFx(b.x, b.y, b.ang)
    const dealt = res.dealt ?? b.damage
    if (dealt > 0) {
      if (res.tree) notifyDamage(res.tree, dealt)
      else notifyDamage({ x: b.x, y: b.y, knockbackable: false }, dealt)
    }
    if (b.kind !== 'slash') b.alive = false
    return b.kind !== 'slash'
  }

  function hitWorld(b) {
    if (b.kind === 'slash' && typeof hooks.hitSlashAt === 'function') {
      return applyWorldHit(
        b,
        hooks.hitSlashAt({
          x: b.x,
          y: b.y,
          ang: b.ang,
          length: b.slashLen ?? b.drawW,
          thick: b.slashThick ?? b.drawH,
          damage: b.payload ?? b.damage,
        }),
      )
    }
    const fn = hooks.hitWorld
    if (typeof fn !== 'function') return false
    const rad = b.kind === 'slash'
      ? (b.slashThick ?? SLASH_THICK) / 2
      : (b.radius ?? HIT_RADIUS)
    return applyWorldHit(b, fn(b.x, b.y, b.damage, rad))
  }

  function stepBullet(b, dt) {
    if (b.expanding) {
      b.expandT += dt
      const dur = MAGE_EXPAND_SEC
      const u = dur > 0 ? Math.min(1, b.expandT / dur) : 1
      const a = b.expandStartDraw ?? ORB_DRAW
      const z = b.expandMaxDraw ?? a
      b.drawW = a + (z - a) * u
      b.drawH = b.drawW
      b.alpha = 1 - u
      if (b.expandT >= dur) {
        b.alpha = 0
        b.alive = false
      }
      return
    }
    if (b.kind === 'slash') {
      b.t += dt
      if (!b.struck) {
        b.struck = true
        hitActors(b)
        hitWorld(b)
      }
      if (b.t >= b.life) b.alive = false
      return
    }
    if (b.kind === 'empower') b.t += dt
    const dist = Math.hypot(b.vx, b.vy) * dt
    const steps = Math.max(1, Math.ceil(dist / STEP_PX) || 1)
    const sdt = dt / steps
    for (let i = 0; i < steps && b.alive; i++) {
      b.x += b.vx * sdt
      b.y += b.vy * sdt
      if (b.x < 0 || b.y < 0 || b.x > WORLD_WIDTH || b.y > WORLD_HEIGHT) {
        b.alive = false
        return
      }
      if (hitActors(b)) return
      if (!b.expanding && hitWorld(b)) return
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

  function drawSheet(ctx, img, frame, fw, fh, x, y, dw, dh, ang) {
    if (!img || !(img.complete || img.width) || !(img.naturalWidth || img.width)) {
      return false
    }
    const nw = img.naturalWidth || img.width || fw
    const cols = Math.max(1, Math.floor(nw / fw) || 1)
    const fr = ((frame % cols) + cols) % cols
    ctx.save()
    ctx.translate(Math.round(x), Math.round(y))
    if (ang != null) ctx.rotate(ang)
    ctx.drawImage(img, fr * fw, 0, fw, fh, -dw / 2, -dh / 2, dw, dh)
    ctx.restore()
    return true
  }

  function drawProjectile(ctx, b) {
    ctx.save()
    if (b.alpha != null) ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha))
    if (b.kind === 'slash') {
      const img = imgs.slash[b.variant % 3]
      const frame = Math.min(SLASH_FRAMES - 1, Math.floor(b.t * SLASH_FPS))
      if (drawSheet(ctx, img, frame, SLASH_FRAME, SLASH_FRAME, b.x, b.y, b.drawW, b.drawH, b.ang)) {
        ctx.restore()
        return
      }
    } else if (b.kind === 'empower') {
      const frame = sheetFrameIndex(b.t, SLASH_FPS, SLASH_FRAMES)
      if (drawSheet(ctx, imgs.empower, frame, SLASH_FRAME, SLASH_FRAME, b.x, b.y, b.drawW, b.drawH, b.ang)) {
        ctx.restore()
        return
      }
    } else if (b.kind === 'orb') {
      if (drawImg(ctx, imgs.orb, b.x, b.y, b.ang, b.drawW, b.drawH)) {
        ctx.restore()
        return
      }
    } else if (drawImg(ctx, imgs.arrow, b.x, b.y, b.ang, b.drawW ?? ARROW_W, b.drawH ?? ARROW_H)) {
      ctx.restore()
      return
    }
    const w = Math.max(2, Math.round(b.drawW ?? 4))
    const h = Math.max(1, Math.round(b.drawH ?? 2))
    ctx.fillStyle = b.kind === 'orb' ? '#7ec8ff' : '#f4e8c0'
    ctx.fillRect(Math.round(b.x - w / 2), Math.round(b.y - h / 2), w, h)
    ctx.restore()
  }

  function draw(ctx) {
    if (!ctx) return
    drawChargeBar(ctx)
    for (const b of bullets) drawProjectile(ctx, b)
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
      if (player) weapon.charId = resolveCharId(player)
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
