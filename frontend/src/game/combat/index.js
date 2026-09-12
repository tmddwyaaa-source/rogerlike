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
  FIRE_DURATION_SEC,
  FIRE_DMG_PER_PICK,
  PULSE_INTERVAL_SEC,
  PULSE_RADIUS_MUL,
  PULSE_DMG_MUL,
  PULSE_SLOW,
  PULSE_SLOW_SEC,
  waterSlowPct,
  waterSlowSec,
  knockbackBonusForPicks,
  BASE_KNOCKBACK_BODIES,
  erseChance,
  erseChancePerPick,
  RAPID_EXTRA_CD_SEC,
  RAPID_UNCHARGED_CHANCE,
  RAPID_EXTRA_DELAY_SEC,
  STEADY_CRIT_RATE_BONUS,
  PIERCE_AMP_STEP,
  fireDps,
  vajraPicks,
  GIANT_SIZE_PER_PICK,
  THORN_FX_FRAMES,
  THORN_FX_FPS,
  THORN_FX_SRC,
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
  REFINE_CRIT_STEP,
  REFINE_CRIT_RATE_PER_PICK,
  REFINE_CRIT_DMG_PER_STEP,
  RAPID_EXTRA_DELAY_SEC,
  STEADY_CRIT_RATE_BONUS,
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
  FIRE_DURATION_SEC,
  FIRE_DMG_PER_PICK,
  PULSE_INTERVAL_SEC,
  PULSE_RADIUS_MUL,
  PULSE_DMG_MUL,
  PULSE_SLOW,
  PULSE_SLOW_SEC,
  fireDpsPerPick,
  waterSlowPct,
  waterSlowSec,
  knockbackBonusForPicks,
  BASE_KNOCKBACK_BODIES,
  erseChance,
  erseChancePerPick,
  RAPID_EXTRA_CD_SEC,
  RAPID_UNCHARGED_CHANCE,
  PIERCE_AMP_STEP,
  SP_POWER_DMG,
  fireDps,
  vajraPicks,
  GIANT_SIZE_PER_PICK,
  THORN_FX_FRAMES,
  THORN_FX_FPS,
  THORN_FX_SRC,
} from '../weapons/index.js'

const STEP_PX = 4
const BLACK_KEY = 12

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * P42 批次6 修补 R2：最终伤害值向上取整成整数（飘字与扣血一致、不再出现小数伤害）。
 * - 本来就是整数的输入幂等（ceilDamage(40) === 40），不得改变既有整数伤害；
 * - 纯 Math.ceil，不做 epsilon 兜底：数学上 88 但浮点表示成 88.00000000000001 时按 89 走（口径即「向上取整」）；
 * - 只作用于伤害数值，不动血量、击退、穿透、掉落等其它数值。
 */
export function ceilDamage(damage) {
  const n = Number(damage)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.ceil(n))
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

/** 返回 { dealt(血量封顶), applied(实际造成、不按余血截断) }，供伤害数字显示。 */
function dealDamage(target, damage) {
  // P42 批次6 R2：统一结算通道先把最终伤害向上取整成整数（飘字与扣血一致），
  // 覆盖武器命中 / 荆棘 / 七色脉冲 / 点燃跳伤；整数输入幂等。
  const dmg = ceilDamage(damage)
  const beforeHp = target.hp ?? 0
  const dealt = hurt(target, dmg)
  const afterHp = target.hp ?? beforeHp
  const applied = Math.max(0, dmg)
  return { dealt, applied }
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
  const pulses = []
  let pulseTimer = 0
  let unbind = () => {}
  let holding = false
  let pendingHold = false
  let slashSeq = 0
  // P42 批次3 power「激发力量」（战斗侧）：rapid / pierce_amp / sp 三态 + 连射额外发的独立冷却。
  // rng 可注入（opts.rng），便于用固定随机数断言连射的 50% 概率。
  const rng = typeof opts.rng === 'function' ? opts.rng : Math.random
  const powers = new Set()
  let rapidCd = 0
  // P42 批次5 R3：连射「额外那一发」的延迟队列——主发当帧只排定，0.2s 后由 update(dt) 真正生成。
  const pendingRapidExtras = []
  // P42 批次7 R1：荆棘爆发特效（纯表现）——以角色为中心播一次 4 帧 @10fps、播完即消失。
  const thornFxList = []
  const THORN_FX_MAX = 8
  const THORN_FX_LIFE = THORN_FX_FRAMES / THORN_FX_FPS
  const imgs = {
    arrow: loadImg(ARROW_SRC, true),
    orb: loadImg(ORB_SRC, true),
    D: loadImg(BLOOD_SRC.D, true),
    S: loadImg(BLOOD_SRC.S, true),
    U: loadImg(BLOOD_SRC.U, true),
    slash: SLASH_SRC.map((src) => loadImg(src, false)),
    empower: loadImg(EMPOWER_SRC, false),
    thornFx: THORN_FX_SRC.map((src) => loadImg(src, false)),
  }

  function syncPlayerCharge(on) {
    if (!player) return
    if (typeof player.setCharging === 'function') player.setCharging(on)
    else player.charging = on
  }

  function notifyDamage(ent, dmg, meta) {
    if (!ent || !(dmg > 0)) return
    if (typeof hooks.onDamage === 'function') hooks.onDamage(ent, dmg, meta)
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
      baseDamage: spec.baseDamage ?? damage,
      crit: Boolean(spec.crit),
      critMul: spec.critMul ?? 1,
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
      // P42 批次3 R2：贯穿强化标记 / 已穿敌数；P42 批次3 R1：本发是否「连射额外发」。
      pierceAmp: Boolean(spec.pierceAmp),
      pierceHits: 0,
      extra: Boolean(spec.extra),
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
    const baseDamage = shotDamage(r, attack, {
      empowerFull: empower,
      charId: id,
      pierceBonus: weapon.pierceBonus ?? 0,
    })
    let damage = baseDamage
    let hitCrit = false
    let hitCritMul = 1
    // P42 批次3（TASK-028 定神契约）：定神就绪时在暴击判定「之前」消费一次（只作用于本次攻击）；
    // 玩家侧未启用/未实现该接口时返回 falsy，既有暴击逻辑完全不变。
    const steadyCrit =
      typeof player?.consumeSteadyCrit === 'function'
        ? player.consumeSteadyCrit() === true
        : false
    // P42 批次5 R4：定神由「强制暴击」改为「本发暴击率临时 +100」——
    // 这 100 点同时参与暴击判定（≥100 必暴）与 critDamageMul 的档位计算（所以能吃精益求精）；
    // 它只存在于本发局部的 critRate 里，不回写 weapon.critRate，下一发立即回到原暴击率。
    const critRate = Math.max(0, Number(weapon.critRate) || 0) + (steadyCrit ? STEADY_CRIT_RATE_BONUS : 0)
    if (rollCrit(critRate)) {
      hitCrit = true
      hitCritMul = critDamageMul(critRate, weapon.refinePicks ?? 0)
      damage *= hitCritMul
    }
    // P42 批次6 R2：打出去之前把最终伤害向上取整（暴击 ×1.5667 这类也变整数；整数幂等）。
    damage = ceilDamage(damage)
    const knockback = (id === 'warrior'
      ? warriorKnockback(weapon.pierceBonus ?? 0)
      : knockbackForCharge(r)) + BASE_KNOCKBACK_BODIES * BODY + knockbackBonusForPicks(weapon.knockbackPicks ?? 0)
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
    const spec = {
      kind,
      speed,
      variant,
      baseDamage,
      crit: hitCrit,
      critMul: hitCritMul,
      overflowOn: empower,
      expandOn: id === 'mage' && r > 0,
      infinitePierce: id === 'warrior',
      slashLen: id === 'warrior' ? slashLength(r, weapon.sizeMul ?? 1) : 0,
      slashThick: id === 'warrior' ? slashThick(weapon.sizeMul ?? 1) : 0,
      // P42 批次3 R2：贯穿强化只改「命中伤害」，不动既有穿透判定本身。
      pierceAmp: powers.has('pierce_amp'),
    }
    // 主发：既有行为，一字不改。
    for (const ang of angles) spawnShot(ang, damage, knockback, pierceLeft, sizeMul, spec)
    // P42 批次3 R1②③④ + 批次5 R3：连射 —— 额外发射一次与主发「同参数」的弹幕，但**晚 0.2s**。
    //   ② 蓄力（ratio >= 1）必然触发；未蓄力按 RAPID_UNCHARGED_CHANCE（50%）掷可注入 rng。
    //   ③ 额外发自带 RAPID_EXTRA_CD_SEC（0.75s）冷却，与武器 fireInterval（0.48s）各算各的计时；
    //      冷却未到时连「排定」都不做（主发照常）。
    //   ④ 因为复用同一份 damage / angles / sizeMul / spec（散射、开眼了、大娃、攻击加成都在其中），
    //      额外发天然吃既有加成，且不回写 weapon.fireCd / charge / onFire，主发行为不变。
    //   批次5 R3：这里只把这一发**排进延迟队列**，0.2s 后由 update(dt) 补发（不用 setTimeout；
    //   非 playing 时游戏循环不调 update，队列自然一并冻结）。
    if (powers.has('rapid') && rapidCd <= 0 && (r >= 1 || rng() < RAPID_UNCHARGED_CHANCE)) {
      rapidCd = RAPID_EXTRA_CD_SEC
      pendingRapidExtras.push({
        t: RAPID_EXTRA_DELAY_SEC,
        angles,
        damage,
        knockback,
        pierceLeft,
        sizeMul,
        spec: { ...spec, extra: true },
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

  function burnDpsFor(ent) {
    // P42 批次7 R3：集齐七兄弟后四娃按「层数 +1」生效（不再有 +10% boost）。
    const picks = vajraPicks(weapon.siwaPicks || 0, weapon.vajraComplete)
    if (!picks) return 0
    const atk = weapon.attack ?? player?.attack ?? ATTACK_BASE
    return fireDps(weapon.siwaPicks || 0, weapon.vajraComplete) * atk
  }

  function applyIgnite(ent) {
    if (!ent || ent.hp <= 0) return
    const picks = vajraPicks(weapon.siwaPicks || 0, weapon.vajraComplete)
    if (picks <= 0) return
    const dps = burnDpsFor(ent)
    if (dps <= 0) return
    ent.burnLeft = FIRE_DURATION_SEC
    ent.burnDps = dps
    ent.burnAccum = 0
  }

  function applySlow(
    ent,
    pct = waterSlowPct(),
    sec = waterSlowSec(weapon.wuwaPicks || 0, weapon.vajraComplete),
  ) {
    if (!ent || ent.hp <= 0) return
    if (!(pct > 0) || !(sec > 0)) return
    // M6 移动消费：ent.slowFactor = 速度乘子（0.8=减速20%），ent.slowLeft = 剩余秒（combat 每帧扣减）。
    ent.slowFactor = 1 - pct
    ent.slowLeft = Math.max(ent.slowLeft ?? 0, sec)
  }

  function applyHitStatus(ent) {
    if (!ent || ent.hp <= 0) return
    applyIgnite(ent)
    // P42 批次7 R3：五娃同样按「有效层数」判定（集齐 → +1 层）。
    if (vajraPicks(weapon.wuwaPicks || 0, weapon.vajraComplete) > 0) applySlow(ent)
  }

  function triggerPulse() {
    if (!weapon.vajraComplete || !player) return
    const atk = weapon.attack ?? player?.attack ?? ATTACK_BASE
    const base = atk * PULSE_DMG_MUL
    let dmg = base
    let hitCrit = false
    let critMul = 1
    if (rollCrit(weapon.critRate ?? 0)) {
      hitCrit = true
      critMul = critDamageMul(weapon.critRate ?? 0, weapon.refinePicks ?? 0)
      dmg *= critMul
    }
    // P42 批次6 R2：七色脉冲与其它伤害共用「打出去前向上取整」口径。
    dmg = ceilDamage(dmg)
    const R = BODY * PULSE_RADIUS_MUL
    for (const ent of targets) {
      if (!ent || ent.hp <= 0) continue
      const dx = ent.x - player.x
      const dy = ent.y - player.y
      if (dx * dx + dy * dy > R * R) continue
      const { applied } = dealDamage(ent, dmg)
      const disp = applied
      const baseA = hitCrit ? (disp / critMul) : disp
      notifyDamage(ent, disp, { base: baseA, crit: hitCrit, critMul, damage: disp })
      // 七色脉冲：减速 30%/0.4s；不击退、不点燃、不破六娃失锁。
      applySlow(ent, PULSE_SLOW, PULSE_SLOW_SEC)
    }
    pulses.push({ x: player.x, y: player.y, r: R, t: 0, life: 0.9 })
  }

  // P42 批次2 R1 + 批次5 R1：荆棘（受击时对半径内活敌结算一次伤害）。
  // 口径：半径 = BODY × (2 + 0.5 × (层数 − 1))（批次5 由固定 4 身位改成 2 身位起、每层 +0.5 身位）；
  // 伤害 = 攻击 × (1.5 + 0.5 × (层数 − 1))（**倍率不变**）；掷暴击复用武器同一套 rollCrit；
  // 走 dealDamage + notifyDamage 统一通道；不触发点燃/减速/击退/穿透衰减。
  const THORN_RANGE_BASE_BODIES = 2
  const THORN_RANGE_STEP_BODIES = 0.5
  const THORN_DMG_BASE_MUL = 1.5
  const THORN_DMG_STEP_MUL = 0.5
  let thornPicks = 0

  function setThornPicks(n) {
    thornPicks = Math.max(0, Math.floor(Number(n) || 0))
    return thornPicks
  }

  /** P42 批次7 R1：当前荆棘半径（世界像素）。 */
  function thornRadius() {
    return BODY * (THORN_RANGE_BASE_BODIES + THORN_RANGE_STEP_BODIES * (thornPicks - 1))
  }

  /**
   * P42 批次7 R1：荆棘爆发特效入队（纯表现，与伤害同帧触发）。
   * 以**角色**为中心；显示直径 = 2 × 当前荆棘半径（不写死 96px）；
   * 同屏上限 THORN_FX_MAX，超出丢最旧的（帧率保护）。
   */
  function spawnThornFx() {
    const x = player?.x ?? 0
    const y = player?.y ?? 0
    const r = thornRadius()
    thornFxList.push({ x, y, t: 0, frame: 0, r, draw: r * 2 })
    while (thornFxList.length > THORN_FX_MAX) thornFxList.shift()
  }

  /**
   * 荆棘爆刺：以 origin（默认玩家）为中心，对 `thornRadius()` 内（按敌人中心距）
   * 所有活敌结算一次伤害。层数 0 直接返回、不产生任何伤害。
   * @returns {number} 命中敌数
   */
  function thornBurst(origin = player) {
    const picks = thornPicks
    if (picks <= 0 || !origin) return 0
    // P42 批次7 R1：特效与伤害同帧入队（纯表现，不影响下面的判定/数值）。
    spawnThornFx()
    const atk = weapon.attack ?? player?.attack ?? ATTACK_BASE
    const mul = THORN_DMG_BASE_MUL + THORN_DMG_STEP_MUL * (picks - 1)
    const crit = rollCrit(weapon.critRate ?? 0)
    const critMul = crit ? critDamageMul(weapon.critRate ?? 0, weapon.refinePicks ?? 0) : 1
    // P42 批次6 R2：荆棘反弹与其它伤害共用「打出去前向上取整」口径（倍率 1.5+0.5×层数 不变）。
    const dmg = ceilDamage(atk * mul * critMul)
    const R = thornRadius()
    const R2 = R * R
    let hits = 0
    for (const ent of targets) {
      if (!ent || ent.hp <= 0) continue
      const dx = ent.x - origin.x
      const dy = ent.y - origin.y
      if (dx * dx + dy * dy > R2) continue
      const { applied } = dealDamage(ent, dmg)
      const disp = applied
      const base = crit ? disp / critMul : disp
      notifyDamage(ent, disp, { base, crit, critMul, damage: disp })
      hits += 1
    }
    return hits
  }

  function strike(ent, b, deal) {
    const hpBefore = ent.hp ?? 0
    const { dealt, applied } = dealDamage(ent, deal)
    const disp = applied
    const crit = Boolean(b.crit)
    const critMul = b.critMul ?? 1
    const base = crit ? (disp / critMul) : disp
    notifyDamage(ent, disp, { base, crit, critMul, damage: disp })
    applyKnockback(ent, b.vx || Math.cos(b.ang), b.vy || Math.sin(b.ang), b.knockback)
    spawnHitFx(b.x, b.y, b.ang)
    applyHitStatus(ent)
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

  /**
   * P42 批次3 R2②：贯穿强化弹体的「本次命中伤害」= 基础 × (1 + PIERCE_AMP_STEP × 已穿敌数)。
   * 已穿敌数 = 本弹体在此之前已经命中并穿过的敌人数量，所以 0 穿 ×1、1 穿 ×1.5、2 穿 ×2.0。
   * 未启用贯穿强化时原样返回（不改既有穿透行为）。
   */
  function pierceAmpDamage(b) {
    const base = b.payload ?? b.damage
    if (!b.pierceAmp) return base
    return base * (1 + PIERCE_AMP_STEP * (b.pierceHits ?? 0))
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
      const deal = pierceAmpDamage(b)
      const left = strike(ent, b, deal)
      // 结算顺序：先按「已穿敌数」算本次伤害 → 本发确实命中后已穿数 +1 → 再走既有穿透判定
      // （infinitePierce / pierceLeft 递减 / empower overflow）。两条通道互不覆盖。
      if (b.pierceAmp) b.pierceHits = (b.pierceHits ?? 0) + 1
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
    // P42 批次6 R2：世界/树木命中的飘字同样用取整后的伤害值。
    const display = ceilDamage(b.damage)
    if (display > 0) {
      const crit = Boolean(b.crit)
      const critMul = b.critMul ?? 1
      const base = crit ? (display / critMul) : display
      const meta = { base, crit, critMul, damage: display }
      if (res.tree) notifyDamage(res.tree, display, meta)
      else notifyDamage({ x: b.x, y: b.y, knockbackable: false }, display, meta)
    }
    if (b.kind !== 'slash') b.alive = false
    return b.kind !== 'slash'
  }

  function hitWorld(b) {
    // P42 批次6 R2：交给 env 结算的伤害（树/世界）也用取整后的值，保证树掉的也是整数伤害。
    if (b.kind === 'slash' && typeof hooks.hitSlashAt === 'function') {
      return applyWorldHit(
        b,
        hooks.hitSlashAt({
          x: b.x,
          y: b.y,
          ang: b.ang,
          length: b.slashLen ?? b.drawW,
          thick: b.slashThick ?? b.drawH,
          damage: ceilDamage(b.payload ?? b.damage),
        }),
      )
    }
    const fn = hooks.hitWorld
    if (typeof fn !== 'function') return false
    const rad = b.kind === 'slash'
      ? (b.slashThick ?? SLASH_THICK) / 2
      : (b.radius ?? HIT_RADIUS)
    return applyWorldHit(b, fn(b.x, b.y, ceilDamage(b.damage), rad))
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
    // P42 批次3 R1③：连射额外发的自带冷却（独立计时，不受 fireInterval / 唯快不破影响）。
    if (rapidCd > 0) rapidCd = Math.max(0, rapidCd - dt)
    // P42 批次5 R3：连射延迟队列 —— 用 update 的真实 dt 计时（不用 setTimeout），到点补发那一次弹幕。
    for (let i = pendingRapidExtras.length - 1; i >= 0; i--) {
      const job = pendingRapidExtras[i]
      job.t -= dt
      if (job.t > 0) continue
      pendingRapidExtras.splice(i, 1)
      for (const ang of job.angles) {
        spawnShot(ang, job.damage, job.knockback, job.pierceLeft, job.sizeMul, job.spec)
      }
    }
    if (pendingHold && holding && weapon.fireCd <= 0) beginCharge()
    if (weapon.charging) {
      const max = weapon.effectiveChargeMax()
      if (max <= 0) tryFire(1)
      else weapon.charge = Math.min(max, weapon.charge + dt)
    }
    // P42 批次7 R1：荆棘特效计时（4 帧 @10fps；播完即消失、不循环）。
    for (let i = thornFxList.length - 1; i >= 0; i--) {
      const fx = thornFxList[i]
      fx.t += dt
      if (fx.t >= THORN_FX_LIFE) {
        thornFxList.splice(i, 1)
        continue
      }
      fx.frame = Math.min(THORN_FX_FRAMES - 1, Math.floor(fx.t * THORN_FX_FPS))
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
      stepBullet(bullets[i], dt)
      if (!bullets[i].alive) bullets.splice(i, 1)
    }
    for (const ent of targets) {
      if (!ent || ent.hp <= 0) {
        if (ent) {
          ent.burnLeft = 0
          ent.burnDps = 0
          ent.burnAccum = 0
          ent.slowLeft = 0
          ent.slowFactor = null
        }
        continue
      }
      if ((ent.burnLeft ?? 0) > 0) {
        ent.burnAccum = (ent.burnAccum ?? 0) + dt
        while (ent.burnLeft > 0 && ent.burnAccum >= 1) {
          ent.burnAccum -= 1
          const dps = ent.burnDps || 0
          if (dps > 0) {
            const { applied } = dealDamage(ent, dps)
            notifyDamage(ent, applied, { base: applied, crit: false, critMul: 1, damage: applied })
          }
          if (ent.hp <= 0) break
        }
        ent.burnLeft = Math.max(0, ent.burnLeft - dt)
        if (ent.burnLeft <= 0) {
          ent.burnLeft = 0
          ent.burnDps = 0
          ent.burnAccum = 0
        }
      } else if (ent.burnDps) {
        ent.burnDps = 0
        ent.burnAccum = 0
      }
      if ((ent.slowLeft ?? 0) > 0) {
        ent.slowLeft = Math.max(0, ent.slowLeft - dt)
        if (ent.slowLeft <= 0) {
          ent.slowLeft = 0
          ent.slowFactor = null
        }
      }
    }
    if (weapon.vajraComplete) {
      pulseTimer += dt
      while (pulseTimer >= PULSE_INTERVAL_SEC) {
        pulseTimer -= PULSE_INTERVAL_SEC
        triggerPulse()
      }
    } else {
      pulseTimer = 0
    }
    const bloodLife = BLOOD_FRAMES / BLOOD_FPS
    for (let i = hitFx.length - 1; i >= 0; i--) {
      hitFx[i].t += dt
      if (hitFx[i].t >= bloodLife) hitFx.splice(i, 1)
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].t += dt
      if (pulses[i].t >= (pulses[i].life ?? 0.4)) pulses.splice(i, 1)
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

  const PULSE_HUES = [0, 51.4, 102.9, 154.3, 205.7, 257.1, 308.6]
  function drawPulse(ctx, p) {
    // 七色光环：按角度分布 7 个色相，快速向外扩散并循环/呼吸。
    const period = 0.45
    const phase = ((p.t / period) % 1)
    const rr = p.r * (0.25 + 0.75 * phase)
    const alpha = (1 - phase) * 0.85
    const seg = (Math.PI * 2) / PULSE_HUES.length
    ctx.save()
    ctx.lineWidth = 2.5
    for (let i = 0; i < PULSE_HUES.length; i++) {
      ctx.globalAlpha = alpha
      ctx.strokeStyle = `hsl(${PULSE_HUES[i]}, 95%, 60%)`
      ctx.beginPath()
      ctx.arc(p.x, p.y, rr, i * seg, (i + 1) * seg)
      ctx.stroke()
    }
    ctx.restore()
  }

  /**
   * P42 批次7 R1：画一帧荆棘爆发特效。素材缺失/未加载完时 drawImg 返回 false，直接跳过（不崩、不画占位）。
   */
  function drawThornFx(ctx, fx) {
    const frame = fx.frame ?? Math.min(THORN_FX_FRAMES - 1, Math.floor(fx.t * THORN_FX_FPS))
    const img = imgs.thornFx?.[frame]
    if (!img) return
    drawImg(ctx, img, fx.x, fx.y, null, fx.draw, fx.draw)
  }

  function draw(ctx) {
    if (!ctx) return
    drawChargeBar(ctx)
    for (const b of bullets) drawProjectile(ctx, b)
    for (const fx of hitFx) drawBlood(ctx, fx)
    for (const p of pulses) drawPulse(ctx, p)
    for (const fx of thornFxList) drawThornFx(ctx, fx)
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
    setVajraComplete: (on) => {
      weapon.setVajraComplete?.(on)
      weapon.vajraComplete = Boolean(on)
      if (!on) pulseTimer = 0
    },
    getVajraComplete: () => Boolean(weapon.vajraComplete),
    getPulseTimer: () => pulseTimer,
    setThornPicks,
    getThornPicks: () => thornPicks,
    thornBurst,
    /**
     * P42 批次3 power 战斗侧入口（对外契约，M6/M1 授予效果时调用）。
     *   'rapid'      连射：额外一发（50% / 蓄力 100%）+ 0.75s 自带冷却 → true
     *   'pierce_amp' 贯穿强化：穿透 +1（唯一，幂等） + 每穿 1 敌本次伤害 +50% → true
     *   'sp'         sp-power：攻击 +20，可叠 → true
     * 其它 id（'steady' 属玩家侧 M3、未知 id）一律返回 false，表示不由本模块处理。
     */
    applyPower: (id) => {
      if (id === 'rapid') {
        powers.add('rapid')
        return true
      }
      if (id === 'pierce_amp') {
        // 唯一项：重复授予不再 +1（与 M6 侧唯一性口径一致，这里做幂等兜底）。
        if (!powers.has('pierce_amp')) {
          powers.add('pierce_amp')
          // 与既有「穿透」升级同一条通道：同一个 weapon.pierceBonus 字段，天然可叠加。
          weapon.pierceBonus = Math.max(0, (weapon.pierceBonus | 0) + 1)
        }
        return true
      }
      if (id === 'sp') {
        // 与既有「力量 +10」同一条攻击加成通道（weapon.applyUpgrade → bumpAttack），不另造一套；可叠。
        const ok =
          typeof weapon.applyUpgrade === 'function' ? weapon.applyUpgrade('sp') === true : false
        if (ok) {
          powers.add('sp')
          if (player) player.attack = weapon.attack
        }
        return ok
      }
      return false
    },
    hasPower: (id) => powers.has(id),
    getPowers: () => Array.from(powers),
    getRapidCooldown: () => rapidCd,
    /** P42 批次5 R3：还在 0.2s 延迟队列里、尚未生成的连射额外发数量。 */
    getPendingRapidExtras: () => pendingRapidExtras.length,
    /** P42 批次5 R1：当前荆棘半径（世界像素，随层数增长）。 */
    getThornRadius: () => (thornPicks > 0 ? thornRadius() : 0),
    /** P42 批次7 R1：当前在播的荆棘爆发特效（只读，供自测/调试）。 */
    getThornFx: () => thornFxList,
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
