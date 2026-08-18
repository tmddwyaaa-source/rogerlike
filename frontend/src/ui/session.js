/**
 * 对局会话：菜单阶段 / 经验曲线 / 10 分钟胜利。
 */
import { PLAYER_SPEED_UNITS } from '../game/player/index.js'
import { SPEED_PX_PER_UNIT } from '../game/constants.js'
import {
  CHARGE_MAX_SEC,
  CHAR_NAME,
  DIFFICULTY_ONE,
  ADVANCED_OFFER_CHANCE,
  ADVANCED_OFFER_EVERY,
  LEVEL_BOOST_MAX,
  LEVEL_GROWTH_ATK,
  LEVEL_GROWTH_EVERY,
  LEVEL_GROWTH_SPEED,
  MOVE_SPEED_BONUS,
  SURVIVE_WIN_SEC,
  UPGRADE_AMMO,
  UPGRADE_BLACKHOLE,
  UPGRADE_CHOICE_COUNT,
  UPGRADE_EARTH,
  UPGRADE_EYES,
  UPGRADE_GIANT,
  UPGRADE_GOBLIN,
  UPGRADE_RABBIT,
  COMPANION_DAMAGE_BONUS,
  UPGRADE_MAGNET,
  UPGRADE_MOVE,
  UPGRADE_PIERCE,
  UPGRADE_POWER,
  UPGRADE_RECOVER,
  UPGRADE_RELOAD,
  UPGRADE_SURVIVE,
  UPGRADES,
  expNeedForLevel,
  upgradeById,
} from './constants.js'
import { saveMemory } from './memories.js'

const WEAPON_IDS = new Set([
  UPGRADE_AMMO,
  UPGRADE_RELOAD,
  UPGRADE_POWER,
  UPGRADE_PIERCE,
  UPGRADE_EYES,
  UPGRADE_GIANT,
])

export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function levelGrowthSteps(fromLevel, toLevel) {
  const from = Math.max(1, fromLevel | 0)
  const to = Math.max(from, toLevel | 0)
  return (
    Math.floor((to - 1) / LEVEL_GROWTH_EVERY) -
    Math.floor((from - 1) / LEVEL_GROWTH_EVERY)
  )
}

export function applyLevelGrowth(ctx, fromLevel, toLevel) {
  const steps = levelGrowthSteps(fromLevel, toLevel)
  if (steps <= 0) return 0
  const player = ctx?.player
  const combat = ctx?.combat
  const pistol = ctx?.pistol ?? combat?.pistol ?? combat?.weapon
  const atk = LEVEL_GROWTH_ATK * steps
  const spd = LEVEL_GROWTH_SPEED * steps
  if (player) {
    player.speedUnits = (player.speedUnits ?? PLAYER_SPEED_UNITS) + spd
    player.speed =
      (player.speed ?? PLAYER_SPEED_UNITS * SPEED_PX_PER_UNIT) + spd * SPEED_PX_PER_UNIT
    if (typeof player.attack === 'number') player.attack += atk
    else if (typeof pistol?.attack === 'number') player.attack = pistol.attack + atk
  }
  if (pistol && typeof pistol.attack === 'number') {
    pistol.attack += atk
    if (typeof pistol.dmgBonus === 'number') pistol.dmgBonus += atk
    pistol.damage = pistol.attack
  }
  return steps
}

export function isAdvancedOffer(n) {
  const i = n | 0
  return i > 0 && i % ADVANCED_OFFER_EVERY === 0
}

export function availableUpgrades(combat, opts = {}) {
  const pistol = combat?.pistol
  const chargeMax = combat?.chargeMax ?? pistol?.chargeMax ?? CHARGE_MAX_SEC
  const wantAdvanced = opts.tier === 'advanced'
  return UPGRADES.filter((u) => {
    const isAdv = u.tier === 'advanced'
    if (wantAdvanced) return isAdv
    if (isAdv) return false
    if (u.id !== UPGRADE_RELOAD) return true
    return chargeMax > 0
  })
}

export function pickUpgradeChoices(combat, count = UPGRADE_CHOICE_COUNT, random = Math.random, opts = {}) {
  const rng = typeof random === 'function' ? random : Math.random
  const normal = availableUpgrades(combat, { tier: 'normal' }).slice()
  const advanced = availableUpgrades(combat, { tier: 'advanced' }).slice()
  const out = []
  while (out.length < count && normal.length) {
    const i = Math.floor(rng() * normal.length)
    out.push(normal.splice(i, 1)[0])
  }
  const offerIndex = opts.offerIndex | 0
  if (isAdvancedOffer(offerIndex) && advanced.length && out.length && rng() < ADVANCED_OFFER_CHANCE) {
    const slot = Math.floor(rng() * out.length)
    const ai = Math.floor(rng() * advanced.length)
    out[slot] = advanced[ai]
  }
  return out
}

export function applyUpgrade(id, ctx = {}) {
  const player = ctx.player
  const combat = ctx.combat
  const env = ctx.env
  const pistol = ctx.pistol ?? combat?.pistol
  if (id === UPGRADE_MOVE) {
    if (!player) return false
    player.speedUnits = (player.speedUnits ?? PLAYER_SPEED_UNITS) + MOVE_SPEED_BONUS
    player.speed = (player.speed ?? PLAYER_SPEED_UNITS * SPEED_PX_PER_UNIT) + MOVE_SPEED_BONUS * SPEED_PX_PER_UNIT
    return true
  }
  if (id === UPGRADE_SURVIVE) {
    if (!player) return false
    if (typeof player.addVitality === 'function') return player.addVitality()
    player.hpMax = (player.hpMax ?? 3) + 1
    player.hp = Math.min(player.hpMax, (player.hp ?? 0) + 1)
    return true
  }
  if (id === UPGRADE_RECOVER) {
    if (!player) return false
    player.heal?.(2)
    return true
  }
  if (id === UPGRADE_EARTH) {
    if (typeof env?.addEarth !== 'function') return false
    env.addEarth()
    return true
  }
  if (id === UPGRADE_BLACKHOLE) {
    const vac =
      env?.vacuumCrystals ??
      ctx.pickups?.vacuumCrystals ??
      ctx.hooks?.onBlackhole
    if (typeof vac === 'function') {
      vac(player)
    } else if (env && typeof env === 'object') {
      env.mods = env.mods ?? {}
      env.mods.blackhole = (env.mods.blackhole ?? 0) + 1
      env.pendingBlackhole = true
    }
    return true
  }
  if (id === UPGRADE_MAGNET) {
    if (typeof env?.addMagnet === 'function') {
      env.addMagnet()
      return true
    }
    const hook = ctx.hooks?.onMagnet
    if (typeof hook === 'function') {
      hook(player)
      return true
    }
    if (env && typeof env === 'object') {
      env.mods = env.mods ?? {}
      env.mods.magnetMul = (env.mods.magnetMul ?? 1) * 1.5
      env.pendingMagnet = true
    }
    return true
  }
  if (id === UPGRADE_GOBLIN) {
    const add =
      ctx.companions?.addGoblin ??
      player?.addGoblin ??
      env?.addGoblin ??
      ctx.hooks?.onGoblin
    const host = ctx.companions || player || env
    if (typeof add === 'function') {
      add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    } else if (host && typeof host === 'object') {
      host.pendingGoblin = (host.pendingGoblin ?? 0) + 1
    }
    const addDmg =
      ctx.companions?.addDamageBonus ??
      ctx.companions?.addCompanionDamage ??
      player?.addDamageBonus ??
      env?.addDamageBonus ??
      ctx.hooks?.onCompanionDamage
    if (typeof addDmg === 'function') {
      addDmg.call(ctx.companions ?? player ?? env ?? ctx.hooks, COMPANION_DAMAGE_BONUS)
    } else if (host && typeof host === 'object') {
      host.pendingCompanionDamage = (host.pendingCompanionDamage ?? 0) + COMPANION_DAMAGE_BONUS
    }
    return true
  }
  if (id === UPGRADE_RABBIT) {
    const add =
      ctx.companions?.addRabbit ??
      player?.addRabbit ??
      env?.addRabbit ??
      ctx.hooks?.onRabbit
    const host = ctx.companions || player || env
    if (typeof add === 'function') {
      add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    } else if (host && typeof host === 'object') {
      host.pendingRabbit = (host.pendingRabbit ?? 0) + 1
    }
    return true
  }
  if (WEAPON_IDS.has(id)) {
    if (typeof combat?.applyUpgrade === 'function') return combat.applyUpgrade(id)
    if (typeof pistol?.applyUpgrade === 'function') return pistol.applyUpgrade(id)
    return false
  }
  return false
}

export function createSession() {
  const session = {
    difficulty: DIFFICULTY_ONE.id,
    phase: 'menu',
    charId: 'ranger',
    weaponId: 'bow',
    elapsedSec: 0,
    exp: 0,
    level: 1,
    kills: 0,
    pending: 0,
    matchId: null,
    result: null,
    win: false,
    resumePhase: null,
    picked: [],
    offer: [],
    start,
    tick,
    addExp,
    addKill,
    applyChoice,
    finish,
    finishWin,
    snapshot,
    reset,
    setPhase,
    setLevel,
    boostLevels,
    beginUpgradeOffer,
    pause,
    resume,
    recordMemory,
    expNeed: () => expNeedForLevel(session.level),
  }

  function resetPicked() {
    session.picked = []
    session.offer = []
  }

  function reset() {
    session.difficulty = DIFFICULTY_ONE.id
    session.phase = 'menu'
    session.charId = 'ranger'
    session.weaponId = 'bow'
    session.elapsedSec = 0
    session.exp = 0
    session.level = 1
    session.kills = 0
    session.pending = 0
    session.matchId = null
    session.result = null
    session.win = false
    session.resumePhase = null
    resetPicked()
  }

  function setPhase(p) {
    session.phase = p
  }

  function pause(from, panel = 'settings') {
    if (session.phase !== 'settings' && session.phase !== 'more' && session.phase !== 'memories') {
      session.resumePhase = from ?? session.phase
    }
    session.phase = panel
    return session.resumePhase
  }

  function resume() {
    const next = session.resumePhase || 'menu'
    session.resumePhase = null
    session.phase = next
    return next
  }

  function start(difficulty = DIFFICULTY_ONE.id) {
    session.difficulty = difficulty
    session.elapsedSec = 0
    session.exp = 0
    session.level = 1
    session.kills = 0
    session.pending = 0
    session.matchId = null
    session.result = null
    session.win = false
    session.resumePhase = null
    resetPicked()
    session.phase = 'playing'
    return session
  }

  function tick(dt) {
    if (session.phase !== 'playing' || dt <= 0) return false
    session.elapsedSec += dt
    if (session.elapsedSec >= SURVIVE_WIN_SEC) {
      finishWin()
      return true
    }
    return false
  }

  function rollOffer(ctx) {
    const random = typeof ctx?.random === 'function' ? ctx.random : Math.random
    session.offer = pickUpgradeChoices(ctx?.combat ?? ctx, UPGRADE_CHOICE_COUNT, random, {
      offerIndex: session.picked.length + 1,
    })
  }

  function addExp(n = 1, ctx = {}) {
    if (n <= 0 || session.phase === 'result' || session.phase === 'victory') return 0
    if (
      session.phase === 'menu' ||
      session.phase === 'settings' ||
      session.phase === 'more' ||
      session.phase === 'memories' ||
      session.phase === 'char' ||
      session.phase === 'difficulty' ||
      session.phase === 'levelup' ||
      session.phase === 'upgrade'
    ) {
      return 0
    }
    session.exp += n
    let gained = 0
    const fromLevel = session.level
    while (true) {
      const need = expNeedForLevel(session.level)
      if (session.exp < need) break
      session.exp -= need
      session.level += 1
      session.pending += 1
      gained += 1
    }
    if (gained > 0) applyLevelGrowth(ctx, fromLevel, session.level)
    if (gained > 0 && session.phase === 'playing') {
      session.phase = 'levelup'
      session.offer = []
    }
    return gained
  }

  function setLevel(lv) {
    const next = Math.max(1, lv | 0)
    session.level = next
    session.exp = 0
    session.pending = 0
    return session.level
  }

  /** 测试「提高等级」：局内关设置后调用。n 为 0～3。先 +1（levelup），再由 beginUpgradeOffer 出三选一。 */
  function boostLevels(n, ctx = {}) {
    const k = Math.max(0, Math.min(LEVEL_BOOST_MAX, n | 0))
    if (k <= 0) return 0
    const fromLevel = session.level
    session.level += k
    session.pending += k
    session.offer = []
    session.phase = 'levelup'
    applyLevelGrowth(ctx, fromLevel, session.level)
    return k
  }

  /** M1 在 +1 播完后调用：进入 upgrade 并抽出 3 选项。 */
  function beginUpgradeOffer(ctx = {}) {
    if (session.pending <= 0) return false
    if (session.phase === 'upgrade' && session.offer.length) return true
    session.phase = 'upgrade'
    rollOffer(ctx)
    return true
  }

  function addKill(n = 1) {
    if (n <= 0) return
    if (
      session.phase === 'menu' ||
      session.phase === 'settings' ||
      session.phase === 'more' ||
      session.phase === 'memories' ||
      session.phase === 'char' ||
      session.phase === 'difficulty'
    ) {
      return
    }
    session.kills += n
  }

  function applyChoice(id, ctx = {}) {
    if (session.phase !== 'upgrade' || session.pending <= 0) return false
    const ok = applyUpgrade(id, ctx)
    if (!ok) return false
    const def = upgradeById(id)
    if (def) session.picked.push({ id: def.id, title: def.title, desc: def.desc })
    session.pending -= 1
    if (session.pending > 0) {
      session.phase = 'upgrade'
      rollOffer(ctx)
    } else {
      session.phase = 'playing'
      session.offer = []
    }
    return true
  }

  function hudFields(player, combat) {
    const pistol = combat?.pistol
    const need = expNeedForLevel(session.level)
    const chargeMax = combat?.chargeMax ?? pistol?.chargeMax ?? CHARGE_MAX_SEC
    const charge = combat?.getCharge?.() ?? combat?.charge ?? pistol?.charge ?? 0
    return {
      hp: player?.hp ?? 0,
      hpMax: player?.hpMax ?? 3,
      charge,
      chargeMax,
      charging: Boolean(combat?.charging ?? pistol?.charging),
      level: session.level,
      exp: session.exp,
      expNeed: need,
      elapsedSec: session.elapsedSec,
      timeText: formatTime(session.elapsedSec),
      kills: session.kills,
      charName: player?.name ?? CHAR_NAME,
    }
  }

  function packResult(win, ctx = {}) {
    session.win = win
    session.phase = win ? 'victory' : 'result'
    const hud = ctx.player ? hudFields(ctx.player, ctx.combat) : session._lastHud || hudFields()
    session.result = {
      ...hud,
      survivedSec: session.elapsedSec,
      difficulty: session.difficulty,
      matchId: session.matchId,
      win,
      title: win ? '恭喜你幸存下来了' : '本局结束',
      upgrades: session.picked.slice(),
    }
    saveMemory(session.result)
    return session.result
  }

  function finish(ctx = {}) {
    return packResult(false, ctx)
  }

  function finishWin(ctx = {}) {
    return packResult(true, ctx)
  }

  function recordMemory(ctx = {}) {
    const hud = hudFields(ctx.player, ctx.combat)
    return saveMemory({
      ...hud,
      survivedSec: session.elapsedSec,
      difficulty: session.difficulty,
      matchId: session.matchId,
      win: session.win,
      upgrades: session.picked.slice(),
    })
  }

  function snapshot(player, combat) {
    const hud = hudFields(player, combat)
    session._lastHud = hud
    return {
      phase: session.phase,
      ...hud,
      pending: session.pending,
      difficulty: session.difficulty,
      choices:
        session.phase === 'levelup'
          ? []
          : session.offer.length
            ? session.offer
            : pickUpgradeChoices(combat),
      picked: session.picked.slice(),
      result: session.result,
      win: session.win,
      paused:
        session.phase === 'settings' ||
        session.phase === 'more' ||
        session.phase === 'memories',
      resumePhase: session.resumePhase,
    }
  }

  return session
}
