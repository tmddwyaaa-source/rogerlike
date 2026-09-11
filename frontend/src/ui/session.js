/**
 * 对局会话：菜单阶段 / 经验曲线 / 10 分钟胜利。
 */
import { PLAYER_SPEED_UNITS } from '../game/player/index.js'
import { SPEED_PX_PER_UNIT } from '../game/constants.js'
import {
  CHARGE_MAX_SEC,
  CHAR_HP,
  CHAR_NAME,
  CHAR_RANGER,
  charById,
  BOND_QIAN,
  BOND_QIAN_TITLE,
  BOND_UNITY,
  BOND_UNITY_TITLE,
  BOND_VAJRA,
  BOND_VAJRA_TITLE,
  DIFFICULTY_ONE,
  DIFFICULTY_TWO,
  bondRank,
  qianDesired,
  ADVANCED_OFFER_CHANCE,
  ADVANCED_OFFER_EVERY,
  LEVEL_BOOST_MAX,
  LEVEL_EMPTY_HP_EVERY,
  LEVEL_PIERCE_EVERY,
  LEVEL_GROWTH_ATK,
  LEVEL_GROWTH_EVERY,
  LEVEL_GROWTH_SPEED,
  MOVE_SPEED_BONUS,
  SURVIVE_WIN_SEC,
  UPGRADE_AMMO,
  UPGRADE_BLACKHOLE,
  UPGRADE_CHOICE_COUNT,
  UPGRADE_EARTH,
  UPGRADE_EMPOWER,
  UPGRADE_CRIT,
  UPGRADE_ONLY_FAST,
  UPGRADE_REFINE,
  UPGRADE_EGG,
  UPGRADE_EYES,
  UPGRADE_GIANT,
  UPGRADE_ERSE,
  UPGRADE_SANWA,
  UPGRADE_SIWA,
  UPGRADE_WUWA,
  UPGRADE_LIUWA,
  UPGRADE_KNOCKBACK,
  UPGRADE_GOBLIN,
  UPGRADE_RABBIT,
  UPGRADE_BAT,
  UPGRADE_TAMER,
  UPGRADE_DEMON,
  UPGRADE_SLIME_GG,
  UPGRADE_COMPANIONSHIP,
  COMPANION_DAMAGE_BONUS,
  UPGRADE_MAGNET,
  UPGRADE_MOVE,
  UPGRADE_PIERCE,
  UPGRADE_POWER,
  UPGRADE_RECOVER,
  UPGRADE_RELOAD,
  UPGRADE_SURVIVE,
  UPGRADES,
  descFor,
  expNeedForLevel,
  upgradeById,
} from './constants.js'
import { erseChance } from '../game/weapons/index.js'
import { saveMemory } from './memories.js'
import { clampTestElapsedSec } from './settings.js'

const WEAPON_IDS = new Set([
  UPGRADE_AMMO,
  UPGRADE_RELOAD,
  UPGRADE_POWER,
  UPGRADE_PIERCE,
  UPGRADE_EYES,
  UPGRADE_GIANT,
  UPGRADE_ERSE,
  UPGRADE_SIWA,
  UPGRADE_WUWA,
  UPGRADE_KNOCKBACK,
  UPGRADE_EMPOWER,
  UPGRADE_CRIT,
  UPGRADE_ONLY_FAST,
  UPGRADE_REFINE,
])

export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function thresholdSteps(fromLevel, toLevel, every) {
  const from = Math.max(1, fromLevel | 0)
  const to = Math.max(from, toLevel | 0)
  const n = Math.max(1, every | 0)
  return Math.floor((to - 1) / n) - Math.floor((from - 1) / n)
}

export function levelGrowthSteps(fromLevel, toLevel) {
  return thresholdSteps(fromLevel, toLevel, LEVEL_GROWTH_EVERY)
}

export function emptyHpSteps(fromLevel, toLevel) {
  return thresholdSteps(fromLevel, toLevel, LEVEL_EMPTY_HP_EVERY)
}

export function pierceGrowthSteps(fromLevel, toLevel) {
  return thresholdSteps(fromLevel, toLevel, LEVEL_PIERCE_EVERY)
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

export function applyEmptyHpMax(ctx, fromLevel, toLevel) {
  const steps = emptyHpSteps(fromLevel, toLevel)
  if (steps <= 0) return 0
  const player = ctx?.player
  if (!player) return 0
  for (let i = 0; i < steps; i++) {
    if (typeof player.addEmptyHpMax === 'function') player.addEmptyHpMax()
    else player.hpMax = (player.hpMax ?? 3) + 1
  }
  return steps
}

export function applyPierceGrowth(ctx, fromLevel, toLevel) {
  const steps = pierceGrowthSteps(fromLevel, toLevel)
  if (steps <= 0) return 0
  const combat = ctx?.combat
  const pistol = ctx?.pistol ?? combat?.pistol ?? combat?.weapon
  if (!pistol) return 0
  pistol.pierceBonus = (pistol.pierceBonus ?? 0) + steps
  return steps
}

function resolveCharId(combat, opts = {}) {
  return opts.charId || combat?.charId || combat?.player?.charId || CHAR_RANGER
}

function emptyQianApplied() {
  return { speed: 0, atk: 0, emptyHp: 0, pierce: 0 }
}

function applySpeedDelta(player, delta) {
  if (!player || !delta) return
  player.speedUnits = (player.speedUnits ?? PLAYER_SPEED_UNITS) + delta
  player.speed =
    (player.speed ?? PLAYER_SPEED_UNITS * SPEED_PX_PER_UNIT) + delta * SPEED_PX_PER_UNIT
}

function applyAtkDelta(ctx, delta) {
  if (!delta) return
  const player = ctx?.player
  const combat = ctx?.combat
  const pistol = ctx?.pistol ?? combat?.pistol ?? combat?.weapon
  if (player) {
    if (typeof player.attack === 'number') player.attack += delta
    else if (typeof pistol?.attack === 'number') player.attack = pistol.attack + delta
  }
  if (pistol && typeof pistol.attack === 'number') {
    pistol.attack += delta
    if (typeof pistol.dmgBonus === 'number') pistol.dmgBonus += delta
    pistol.damage = pistol.attack
  }
}

function applyEmptyHpDelta(player, delta) {
  if (!player || delta <= 0) return
  for (let i = 0; i < delta; i++) {
    if (typeof player.addEmptyHpMax === 'function') player.addEmptyHpMax()
    else player.hpMax = (player.hpMax ?? 3) + 1
  }
}

function applyPierceDelta(ctx, delta) {
  if (!delta) return
  const combat = ctx?.combat
  const pistol = ctx?.pistol ?? combat?.pistol ?? combat?.weapon
  if (!pistol) return
  pistol.pierceBonus = (pistol.pierceBonus ?? 0) + delta
}

export function uniqueBondCount(picked, bondId) {
  const ids = new Set()
  for (const p of picked || []) {
    const def = upgradeById(p.id)
    if (def?.bond === bondId) ids.add(def.id)
  }
  return ids.size
}

export function listActiveBonds(picked) {
  const out = []
  const qian = bondRank(BOND_QIAN, uniqueBondCount(picked, BOND_QIAN))
  if (qian) out.push({ id: BOND_QIAN, title: BOND_QIAN_TITLE, rank: qian })
  const unity = bondRank(BOND_UNITY, uniqueBondCount(picked, BOND_UNITY))
  if (unity) out.push({ id: BOND_UNITY, title: BOND_UNITY_TITLE, rank: unity })
  const vajra = bondRank(BOND_VAJRA, uniqueBondCount(picked, BOND_VAJRA))
  if (vajra) out.push({ id: BOND_VAJRA, title: BOND_VAJRA_TITLE, rank: vajra })
  return out
}

/** P32：判定的依据从 offerIndex 改为“升级到达等级 %ADVANCED_OFFER_EVERY==0 必出高级”。 */
export function isAdvancedOffer(level) {
  const lv = level | 0
  return lv > 0 && lv % ADVANCED_OFFER_EVERY === 0
}

export function availableUpgrades(combat, opts = {}) {
  const pistol = combat?.pistol
  const chargeMax = combat?.chargeMax ?? pistol?.chargeMax ?? CHARGE_MAX_SEC
  const wantAdvanced = opts.tier === 'advanced'
  const charId = resolveCharId(combat, opts)
  return UPGRADES.filter((u) => {
    // 强化射击：游侠专属；战士 / 法师的池子里一律不出现。
    if (u.id === UPGRADE_EMPOWER && charId !== CHAR_RANGER) return false
    // 唯快不破：降为普通项后仍只在本局蓄力上限已到 0 时进池（与 tier 无关，不得放开）。
    if (u.id === UPGRADE_ONLY_FAST) return chargeMax <= 0
    const isAdv = u.tier === 'advanced'
    if (wantAdvanced) return isAdv
    if (isAdv) return false
    if (u.id !== UPGRADE_RELOAD) return true
    return chargeMax > 0
  })
}

/** 二娃·千里眼：从 combat/pistol 读已选层数。 */
export function ersePicksFrom(combat) {
  const p = combat?.pistol ?? combat?.weapon
  const picks = p?.ersePicks ?? combat?.ersePicks ?? 0
  return Math.max(0, picks | 0)
}

/** 小金刚集齐时 combat 上的 vajraComplete 标记。 */
export function vajraCompleteFrom(combat) {
  return Boolean(
    combat?.getVajraComplete?.() ??
    combat?.vajraComplete ??
    combat?.weapon?.vajraComplete ??
    combat?.pistol?.vajraComplete ??
    false,
  )
}

/** 二娃四选一概率（0～1）：每次三选一有 20%/层（集齐后 30%/层）变四选一。 */
export function erseChanceFor(combat) {
  const picks = ersePicksFrom(combat)
  if (picks <= 0) return 0
  const vc = vajraCompleteFrom(combat)
  if (typeof erseChance === 'function') {
    return Math.min(1, erseChance(picks, vc) / 100)
  }
  return Math.min(1, picks * (vc ? 0.3 : 0.2))
}

export function pickUpgradeChoices(combat, count = UPGRADE_CHOICE_COUNT, random = Math.random, opts = {}) {
  const rng = typeof random === 'function' ? random : Math.random
  const charId = resolveCharId(combat, opts)
  const normal = availableUpgrades(combat, { tier: 'normal', charId }).slice()
  const advanced = availableUpgrades(combat, { tier: 'advanced', charId }).slice()
  let slots = Math.max(0, count | 0)
  const chance = erseChanceFor(combat)
  if (chance > 0 && rng() < chance) slots += 1
  // P32：该次升级到达等级 %5==0 时第 0 槽必出高级；其余每槽独立 30% 概率出高级。
  const lvl = opts.level | 0
  const mandatory = isAdvancedOffer(lvl)
  const out = []
  for (let i = 0; i < slots; i++) {
    // P32 修正：高级只在「必出当次」（level%5==0）出现；其非必出槽位各自独立 30%。非必出等级不出高级。
    const wantAdvanced = mandatory && (i === 0 || rng() < ADVANCED_OFFER_CHANCE)
    if (wantAdvanced && advanced.length) {
      const ai = Math.floor(rng() * advanced.length)
      out.push(advanced.splice(ai, 1)[0])
    } else if (normal.length) {
      const ni = Math.floor(rng() * normal.length)
      out.push(normal.splice(ni, 1)[0])
    } else if (advanced.length) {
      const ai = Math.floor(rng() * advanced.length)
      out.push(advanced.splice(ai, 1)[0])
    }
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
  if (id === UPGRADE_SANWA) {
    // P27：三娃为唯一效果；护甲在 recordPicked 里按“每集满 3 个不同葫芦娃”发放，这里不再立即加甲。
    return true
  }
  if (id === UPGRADE_LIUWA) {
    if (player) {
      if (typeof player.addUnlockLevel === 'function') { player.addUnlockLevel(1); return true }
      player.unlockLevel = (player.unlockLevel ?? 0) + 1
      return true
    }
    const add = ctx.hooks?.onUnlock
    if (typeof add === 'function') { add(player, 1); return true }
    const host = env || ctx
    if (host && typeof host === 'object') host.pendingUnlockLevel = (host.pendingUnlockLevel ?? 0) + 1
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
      env.mods.magnetBonus = (env.mods.magnetBonus ?? 0) + 1
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
  if (id === UPGRADE_BAT) {
    const add =
      ctx.companions?.addBat ??
      player?.addBat ??
      env?.addBat ??
      ctx.hooks?.onBat
    const host = ctx.companions || player || env
    if (typeof add === 'function') {
      add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    } else if (host && typeof host === 'object') {
      host.pendingBat = (host.pendingBat ?? 0) + 1
    }
    return true
  }
  if (id === UPGRADE_EGG) {
    const add =
      ctx.companions?.addEgg ??
      player?.addEgg ??
      env?.addEgg ??
      ctx.hooks?.onEgg
    const host = ctx.companions || player || env
    if (typeof add === 'function') {
      add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    } else if (host && typeof host === 'object') {
      host.pendingEgg = (host.pendingEgg ?? 0) + 1
    }
    return true
  }
  if (id === UPGRADE_TAMER) {
    const add = ctx.companions?.addTamer ?? player?.addTamer ?? env?.addTamer ?? ctx.hooks?.onTamer
    const host = ctx.companions || player || env || ctx
    if (typeof add === 'function') add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    else if (host && typeof host === 'object') host.pendingTamer = (host.pendingTamer ?? 0) + 1
    return true
  }
  if (id === UPGRADE_DEMON) {
    const add = ctx.companions?.addDemon ?? player?.addDemon ?? env?.addDemon ?? ctx.hooks?.onDemon
    const host = ctx.companions || player || env || ctx
    if (typeof add === 'function') add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    else if (host && typeof host === 'object') host.pendingDemon = (host.pendingDemon ?? 0) + 1
    return true
  }
  if (id === UPGRADE_SLIME_GG) {
    const add = ctx.companions?.addSlimeGG ?? player?.addSlimeGG ?? env?.addSlimeGG ?? ctx.hooks?.onSlimeGG
    const host = ctx.companions || player || env || ctx
    if (typeof add === 'function') add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    else if (host && typeof host === 'object') host.pendingSlimeGG = (host.pendingSlimeGG ?? 0) + 1
    return true
  }
  if (id === UPGRADE_COMPANIONSHIP) {
    const add = ctx.companions?.addCompanionship ?? player?.addCompanionship ?? env?.addCompanionship ?? ctx.hooks?.onCompanionship
    const host = ctx.companions || player || env || ctx
    if (typeof add === 'function') add.call(ctx.companions ?? player ?? env ?? ctx.hooks)
    else if (host && typeof host === 'object') host.pendingCompanionship = (host.pendingCompanionship ?? 0) + 1
    return true
  }
  if (WEAPON_IDS.has(id)) {
    if (typeof combat?.applyUpgrade === 'function') {
      const ok = combat.applyUpgrade(id)
      if (ok) return true
    }
    if (typeof pistol?.applyUpgrade === 'function') {
      const ok = pistol.applyUpgrade(id)
      if (ok) return true
    }
    if (id === UPGRADE_EMPOWER) {
      const host = combat || pistol || ctx
      if (host && typeof host === 'object') host.pendingEmpowerShot = (host.pendingEmpowerShot ?? 0) + 1
      return true
    }
    if (id === UPGRADE_CRIT) {
      const host = combat || pistol || ctx
      if (host && typeof host === 'object') host.pendingCrit = (host.pendingCrit ?? 0) + 10
      return true
    }
    if (id === UPGRADE_ONLY_FAST || id === UPGRADE_REFINE) {
      const host = combat || pistol || ctx
      if (host && typeof host === 'object') {
        if (id === UPGRADE_ONLY_FAST) host.pendingOnlyFast = (host.pendingOnlyFast ?? 0) + 1
        else host.pendingRefine = (host.pendingRefine ?? 0) + 1
      }
      return true
    }
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
    level: 0,
    kills: 0,
    bossKills: 0,
    pending: 0,
    matchId: null,
    result: null,
    win: false,
    resumePhase: null,
    picked: [],
    offer: [],
    bonds: [],
    start,
    tick,
    addExp,
    addKill,
    addBossKill,
    applyChoice,
    grantUpgrade,
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
    setElapsedSec,
    expNeed: () => expNeedForLevel(session.level),
  }
  let qianApplied = emptyQianApplied()
  // P28 三娃（A3）：可叠。每次选立即 +1 甲；并开启“每升 N 级再 +1 甲”，N = max(1, 11 − 已选次数)。
  let sanwaPicks = 0
  let sanwaLevelAcc = 0
  let sanwaN = 0

  function bumpSanwaLevel(ctx, n = 1) {
    if (sanwaN <= 0 || n <= 0) return
    sanwaLevelAcc += n
    while (sanwaN > 0 && sanwaLevelAcc >= sanwaN) {
      if (typeof ctx?.player?.addArmor === 'function') ctx.player.addArmor(1)
      sanwaLevelAcc -= sanwaN
    }
  }

  function resetPicked() {
    session.picked = []
    session.offer = []
    session.bonds = []
    qianApplied = emptyQianApplied()
    sanwaPicks = 0
    sanwaLevelAcc = 0
    sanwaN = 0
  }

  function reset() {
    session.difficulty = DIFFICULTY_ONE.id
    session.phase = 'menu'
    session.charId = 'ranger'
    session.weaponId = 'bow'
    session.elapsedSec = 0
    session.exp = 0
    session.level = 0
    session.kills = 0
    session.bossKills = 0
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
    session.level = 0
    session.kills = 0
    session.bossKills = 0
    session.pending = 0
    session.matchId = null
    session.result = null
    session.win = false
    session.resumePhase = null
    resetPicked()
    session.phase = 'playing'
    return session
  }

  function isDiffTwo() {
    return String(session.difficulty) === DIFFICULTY_TWO.id
  }

  function meetsWin() {
    if (session.elapsedSec < SURVIVE_WIN_SEC) return false
    if (isDiffTwo()) return session.bossKills >= 2
    return true
  }

  function tryFinishWin() {
    if (!meetsWin()) return false
    if (session.phase === 'result' || session.phase === 'victory') return false
    finishWin()
    return true
  }

  function tick(dt) {
    if (session.phase !== 'playing' || dt <= 0) return false
    session.elapsedSec += dt
    return tryFinishWin()
  }

  function setElapsedSec(sec) {
    const n = clampTestElapsedSec(sec)
    if (session.phase === 'result' || session.phase === 'victory') return session.elapsedSec
    session.elapsedSec = n
    const from = session.phase === 'settings' || session.phase === 'more' || session.phase === 'memories'
      ? session.resumePhase
      : session.phase
    const inMenu = from === 'menu' || from === 'char' || from === 'difficulty' || !from
    if (!inMenu) tryFinishWin()
    return session.elapsedSec
  }

  function rollOffer(ctx) {
    const random = typeof ctx?.random === 'function' ? ctx.random : Math.random
    const src = ctx?.combat ?? ctx
    const charId = ctx?.player?.charId ?? ctx?.charId ?? src?.player?.charId ?? session.charId
    session.offer = pickUpgradeChoices(src, UPGRADE_CHOICE_COUNT, random, {
      offerIndex: session.picked.length + 1,
      level: session.level - session.pending + 1,
      charId,
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
    while (true) {
      const need = expNeedForLevel(session.level)
      if (session.exp < need) break
      session.exp -= need
      session.level += 1
      session.pending += 1
      gained += 1
    }
    if (gained > 0) {
      syncBonds(ctx)
      bumpSanwaLevel(ctx, gained)
    }
    if (gained > 0 && session.phase === 'playing') {
      session.phase = 'levelup'
      session.offer = []
    }
    return gained
  }

  function setLevel(lv) {
    const next = Math.max(0, lv | 0)
    session.level = next
    session.exp = 0
    session.pending = 0
    return session.level
  }

  /** 测试「提高等级」：局内关设置后调用。n 为 0～3。先 +1（levelup），再由 beginUpgradeOffer 出三选一。 */
  function boostLevels(n, ctx = {}) {
    const k = Math.max(0, Math.min(LEVEL_BOOST_MAX, n | 0))
    if (k <= 0) return 0
    session.level += k
    session.pending += k
    session.offer = []
    session.phase = 'levelup'
    syncBonds(ctx)
    bumpSanwaLevel(ctx, k)
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

  function inMenuLikePhase() {
    return (
      session.phase === 'menu' ||
      session.phase === 'settings' ||
      session.phase === 'more' ||
      session.phase === 'memories' ||
      session.phase === 'char' ||
      session.phase === 'difficulty'
    )
  }

  function addBossKill(n = 1) {
    if (n <= 0) return session.bossKills
    if (session.phase === 'result' || session.phase === 'victory' || inMenuLikePhase()) {
      return session.bossKills
    }
    session.bossKills += n
    tryFinishWin()
    return session.bossKills
  }

  function recordPicked(id, ctx = {}) {
    const def = upgradeById(id)
    if (def) session.picked.push({ id: def.id, title: def.title, desc: descFor(def, session.charId) })
    session.bonds = listActiveBonds(session.picked)
    // P28 三娃（A3）：每次选立即 +1 甲；并开启每 N 级再 +1 甲（N = max(1, 11 − 已选次数)）。
    if (id === UPGRADE_SANWA) {
      if (typeof ctx.player?.addArmor === 'function') ctx.player.addArmor(1)
      sanwaPicks += 1
      sanwaN = Math.max(1, 11 - sanwaPicks)
    }
    if (sanwaN > 0 && sanwaLevelAcc >= sanwaN) {
      if (typeof ctx.player?.addArmor === 'function') ctx.player.addArmor(1)
      sanwaLevelAcc -= sanwaN
    }
  }

  function syncQian(ctx = {}) {
    const rank = bondRank(BOND_QIAN, uniqueBondCount(session.picked, BOND_QIAN))
    const want = qianDesired(session.level, rank)
    applySpeedDelta(ctx.player, want.speed - qianApplied.speed)
    applyAtkDelta(ctx, want.atk - qianApplied.atk)
    applyEmptyHpDelta(ctx.player, want.emptyHp - qianApplied.emptyHp)
    applyPierceDelta(ctx, want.pierce - qianApplied.pierce)
    qianApplied = want
  }

  function syncUnity(ctx = {}) {
    const rank = bondRank(BOND_UNITY, uniqueBondCount(session.picked, BOND_UNITY))
    const kinds = uniqueBondCount(session.picked, BOND_UNITY)
    const companions = ctx.companions
    if (typeof companions?.setUnityTier === 'function') {
      companions.setUnityTier(rank)
      return
    }
    if (typeof companions?.syncUnityBond === 'function') {
      companions.syncUnityBond({ kinds, tier: rank })
      return
    }
    const hook = ctx.hooks?.onUnity ?? ctx.player?.setUnityTier ?? ctx.env?.setUnityTier
    if (typeof hook === 'function') {
      hook.call(ctx.hooks ?? ctx.player ?? ctx.env, rank)
      return
    }
    const host = companions || ctx.env
    if (host && typeof host === 'object') host.pendingUnityTier = rank
  }

  function syncBonds(ctx = {}) {
    session.bonds = listActiveBonds(session.picked)
    syncQian(ctx)
    syncUnity(ctx)
  }

  function applyChoice(id, ctx = {}) {
    if (session.phase !== 'upgrade' || session.pending <= 0) return false
    const ok = applyUpgrade(id, ctx)
    if (!ok) return false
    recordPicked(id, ctx)
    syncBonds(ctx)
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

  function grantUpgrade(id, ctx = {}) {
    const ok = applyUpgrade(id, ctx)
    if (!ok) return false
    recordPicked(id, ctx)
    syncBonds(ctx)
    return true
  }

  function hudFields(player, combat) {
    const pistol = combat?.pistol
    const need = expNeedForLevel(session.level)
    const chargeMax = combat?.chargeMax ?? pistol?.chargeMax ?? CHARGE_MAX_SEC
    const charge = combat?.getCharge?.() ?? combat?.charge ?? pistol?.charge ?? 0
    const heartsMax = CHAR_HP[session.charId] ?? CHAR_HP[CHAR_RANGER]
    return {
      hp: player?.hp ?? heartsMax,
      hpMax: player?.hpMax ?? heartsMax,
      charge,
      chargeMax,
      charging: Boolean(combat?.charging ?? pistol?.charging),
      level: session.level,
      exp: session.exp,
      expNeed: need,
      elapsedSec: session.elapsedSec,
      timeText: formatTime(session.elapsedSec),
      kills: session.kills,
      bossKills: session.bossKills,
      armor: typeof player?.getArmor === 'function' ? player.getArmor() : (player?.armor ?? 0),
      bonds: session.bonds,
      charName: player?.name ?? charById(session.charId).name ?? CHAR_NAME,
      charId: session.charId,
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
      bossKills: session.bossKills,
      choices:
        session.phase === 'levelup'
          ? []
          : session.offer.length
            ? session.offer
            : pickUpgradeChoices(combat, UPGRADE_CHOICE_COUNT, Math.random, { charId: session.charId, level: session.level }),
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
