/**
 * M9 集成：设置（测试模式）+ 胜负 + 刷怪倍率。
 * P6：活设置倍率；黑洞飞行吸入；levelup 播完 +1 再出三选一。
 * P9：跟班 update/draw；升级停顿只飞不拾取；暂停清键。
 * P12：charId；死亡动画后再结算；伤害数字。
 * P13：结晶升级与测试强制升级同一套：先停、播 +1、再三选一。
 * P14：回血绿字、测试时间写入 elapsed。
 * P15：去掉开局目标；测试木桩 setDummyEnabled；自选升级在 GameShell。
 * P18：难度二血成长、Boss 击杀、冰人结晶爆发。
 * P20：开火/拾取音效接线（combat onFire → sfx；结晶每颗吸收即播，不节流可叠加）。
 * P21：受伤音效接线（player onHurt → sfx.play('hurt')）。
 * P24：万物一心档 8 优先目标——combat onDamage 记录玩家最近击中的活敌 → companions.getPriorityTarget。
 */
import { createCombat } from './combat/index.js'
import { createCompanions } from './companions/index.js'
import { createEnemies } from './enemies/index.js'
import {
  createPlayer,
  drawDamageNums,
  HURT_SPEED_BUFF_SEC,
  HURT_SPEED_BUFF_UNITS,
  resetDamageNums,
  spawnDamageNum,
  spawnHealNum,
  updateDamageNums,
} from './player/index.js'
import { stepLevelUpFx } from './render/levelup.js'
import { createEnvironment } from './world/index.js'
import { getSharedSfx } from '../ui/sfx.js'
import { BOND_VAJRA } from '../ui/constants.js'

const sfx = getSharedSfx()

/**
 * 开局资源按实际 await 的加载边界分组。每一格进度只在对应资源组完成后推进，
 * 因此不会为了视觉效果使用计时器伪造加载。
 */
export const LOAD_GROUPS = Object.freeze([
  '角色与开局特效',
  '场景与装饰',
  '敌人与投射物',
  '跟班',
])

/**
 * 黑洞：只标记结晶飞向角色（不当帧删、不当帧给经验）。
 * 兼容旧名；真正逻辑在 env.pullAllCrystals。
 */
export function vacuumAllCrystals(env) {
  const pull = env?.pullAllCrystals ?? env?.vacuumCrystals
  if (typeof pull === 'function') pull()
  return 0
}

/**
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   engine: object,
 *   shell: object,
 * }} opts
 */
export function createMatchRuntime(opts) {
  const { canvas, engine, shell } = opts
  let player = null
  let env = null
  let foes = null
  let combat = null
  let companions = null
  let active = false
  let deadNotified = false
  let deathArmed = false
  let starting = false
  let inputEnabled = false

  function onDamage(ent, dmg, meta) {
    if (!ent || !(dmg > 0)) return
    spawnDamageNum(ent.x, ent.y, dmg, ent, meta)
  }

  // 万物一心档 8「优先攻击角色正在攻击的目标」：只记玩家（combat）打中的活敌；
  // 跟班的 onDamage 不经过这里，避免跟班追自己打过的目标。
  let lastPlayerTarget = null
  let demonAtkBonus = 0
  let demonAtkApplied = 0

  function onPlayerDamage(ent, dmg, meta) {
    onDamage(ent, dmg, meta)
    if (ent && dmg > 0 && ent.hp > 0) lastPlayerTarget = ent
  }

  function onHeal(ent, n) {
    if (!ent || !(n > 0)) return
    spawnHealNum(ent.x, ent.y, n, ent)
  }

  // P28 恶魔：角色伤害联动——把跟班联动加成加到角色攻击（combat.pistol.attack）。
  function applyDemonLink(bonus) {
    demonAtkBonus = Number(bonus) || 0
    const delta = demonAtkBonus - demonAtkApplied
    if (!delta) return
    demonAtkApplied = demonAtkBonus
    const pist = combat?.pistol
    if (pist) pist.attack = (pist.attack ?? player?.attack ?? 20) + delta
    else if (player) player.attack = (player.attack ?? 20) + delta
  }

  function io() {
    return {
      canvas,
      camera: engine.camera,
      getScale: engine.getScale,
    }
  }

  /** 每帧读活设置，不要握开局快照。 */
  function readSettings() {
    return (
      shell.getSettings?.() ||
      shell.ui?.settings || {
        testMode: false,
        godMode: false,
        infiniteAmmo: false,
        spawnRate: 1,
        testDummy: false,
      }
    )
  }

  function syncDummy(settings) {
    if (!foes?.setDummyEnabled) return
    const on = Boolean(settings?.testMode && settings?.testDummy)
    const dummy = foes.setDummyEnabled(on, player)
    if (dummy) {
      dummy.knockbackable = true
      dummy.knockbackScale = 0
    }
  }

  // M1 临时探针（P29 万物一心 tier）：记录羁绊 rank，便于定位“1 种就 2 档”。
  let lastUnityRank = null
  function probeUnity() {
    const bonds = shell.ui?.session?.bonds
    const u = Array.isArray(bonds) ? bonds.find((b) => b.id === 'unity') : null
    const rank = u ? (u.rank ?? 0) : 0
    if (rank !== lastUnityRank) {
      lastUnityRank = rank
      console.log('[A1:unity] rank=', rank, 'picked=', (shell.ui?.session?.picked ?? []).map((p) => p.id).join(','))
    }
  }

  // 小金刚集齐 → combat.setVajraComplete（合体触发七色脉冲）。M1 接线：读 session.bonds，完整时置位。
  function syncVajra() {
    if (!combat?.setVajraComplete) return
    const bonds = shell.ui?.session?.bonds
    const v = Array.isArray(bonds) ? bonds.find((b) => b.id === BOND_VAJRA) : null
    // P26 起小金刚条目不再带 complete，只有 rank（集齐=7）。
    combat.setVajraComplete(Boolean(v && (v.rank ?? 0) >= 7))
  }

  // P42 批次2：生生不息（羁绊 id 恒为 'sheng'）。档 3 = 受击后 1.5s 移速 +0.20，接线见 onHurt。
  const BOND_SHENG_ID = 'sheng'
  function shengRank() {
    const bonds = shell.ui?.session?.bonds
    const b = Array.isArray(bonds) ? bonds.find((x) => x.id === BOND_SHENG_ID) : null
    return b ? (b.rank ?? 0) : 0
  }

  function teardown() {
    player?.unbindInput?.()
    combat?.unbindInput?.()
    player = null
    env = null
    foes = null
    combat = null
    companions = null
    active = false
    inputEnabled = false
    deadNotified = false
    deathArmed = false
    resetDamageNums()
    engine.setFollowTarget(null)
    shell.bind({ player: null, combat: null, env: null, companions: null })
  }

  function bindCtx() {
    return { player, combat, env, companions }
  }

  /** 转场期间冻结世界并解除输入；恢复时不重新加载任何资源。 */
  function setInputEnabled(enabled) {
    const next = Boolean(enabled && active && player && combat)
    if (next === inputEnabled) return inputEnabled
    inputEnabled = next
    player?.clearMovementKeys?.()
    if (inputEnabled) {
      player?.bindInput?.(io())
      combat?.bindInput?.(io())
    } else {
      player?.unbindInput?.()
      combat?.unbindInput?.()
    }
    return inputEnabled
  }

  function hpGrowthAdd() {
    return String(shell.ui?.session?.difficulty) === '2' ? 10 : 0
  }

  function tryBeginUpgradeOffer() {
    if (phase() !== 'levelup') return
    if (player?.levelUpFxBusy?.()) return
    shell.ui?.beginUpgradeOffer?.(bindCtx())
    shell.syncHud?.()
  }

  async function begin(payload = {}) {
    if (starting) return
    starting = true
    try {
      teardown()
      deadNotified = false
      deathArmed = false
      lastPlayerTarget = null
      const settings = payload.settings || readSettings()
      const onLoadProgress = typeof payload.onLoadProgress === 'function' ? payload.onLoadProgress : null
      const reportLoad = (completed, stage) => {
        onLoadProgress?.({
          completed,
          total: LOAD_GROUPS.length,
          progress: Math.round((completed / LOAD_GROUPS.length) * 100),
          stage,
        })
      }
      const charId =
        payload.charId ||
        payload.ui?.session?.charId ||
        shell.ui?.session?.charId ||
        'ranger'

      reportLoad(0, LOAD_GROUPS[0])
      player = createPlayer({
        godMode: settings.testMode && settings.godMode,
        charId,
        onHurt: () => {
          sfx.play('hurt')
          // P42 批次7 · 生生不息档 8：致命伤时「以 1 血复活」（档位判定在 M1，复活/冷却逻辑在 player）。
          // 必须在死亡流程（update 里的 hp<=0 → 死亡动画 → 结算）之前把 hp 拉回 1。
          if (shengRank() >= 8 && (player?.hp ?? 1) <= 0) {
            player?.tryRevive?.()
          }
          // P42 批次2：荆棘 —— 受击时对 4 身位内活敌结算（层数由 ui 侧 applyUpgrade → combat.setThornPicks 同步）。
          combat?.thornBurst?.(player)
          // P42 批次2：生生不息档 3 —— 受击后 1.5s 移速 +0.20 设计单位。
          if (shengRank() >= 3) {
            player?.applyHurtSpeedBuff?.(HURT_SPEED_BUFF_UNITS, HURT_SPEED_BUFF_SEC)
          }
        },
        getTargets: () => foes?.targets ?? [],
      })
      engine.setFollowTarget(player)
      await player.loadAssets()
      reportLoad(1, LOAD_GROUPS[1])
      if (settings.testMode) {
        shell.ui?.session?.setElapsedSec?.(settings.testElapsedSec ?? 0)
      }

      env = createEnvironment({
        getHpGrowthAdd: hpGrowthAdd,
        hooks: {
          onCrystal: () => {
            // P42 批次7 · 贪婪：命中时「再获得一次经验」＝这一颗结晶按 2 点经验结算
            //（概率 50%+10%/层、上限 100%、0.1s 冷却、不入羁绊，全部由 ui/session 决定；M1 只接线）。
            const extra = shell.ui?.session?.rollGreedBonus?.() ?? 0
            // notifyExp 回传的是「本次升了几级」（普通结晶为 0），不是「获得了经验」。
            const gained = shell.notifyExp(1 + extra)
            if (gained > 0) player?.queueLevelUpFx?.(gained)
            sfx.play('pickup')
          },
          onFruit: (heal) => player?.heal?.(heal),
        },
      })
      await env.loadAssets()
      reportLoad(2, LOAD_GROUPS[2])
      // 不要覆盖 M7 的 pullAllCrystals；vacuumCrystals 已是飞行吸入。

      foes = createEnemies({
        player,
        getHpGrowthAdd: hpGrowthAdd,
        hooks: {
          spawnCrystal: (x, y) => env.spawnCrystal(x, y),
          spawnCrystalBurst: (x, y, n) => env.spawnCrystalBurst(x, y, n),
          isTargetBlind: (ent) => Boolean(player?.isEnemyUnlocked?.(ent)),
          onKill: (ent) => {
            shell.ui.addKill()
            if (ent?.kind === 'ice_man') shell.ui.addBossKill?.()
          },
          onHeal,
        },
      })
      await foes.loadAssets()
      reportLoad(3, LOAD_GROUPS[3])
      syncDummy(settings)

      combat = createCombat({
        player,
        targets: foes.targets,
        hooks: {
          hitWorld: (x, y, dmg, r) => env.hitAt(x, y, dmg, r),
          hitSlashAt: (opts) => env.hitSlashAt(opts),
          onFire: (kind) => sfx.play(kind),
          onDamage: onPlayerDamage,
        },
      })
      if (settings.testMode && settings.infiniteAmmo) {
        combat.pistol.setInfiniteAmmo(true)
      }

      companions = createCompanions({
        player,
        getTargets: () => foes.targets,
        getAttack: () => combat?.pistol?.attack ?? player?.attack ?? 20,
        getKills: () => shell.ui?.session?.kills ?? 0,
        getPriorityTarget: () => {
          const t = lastPlayerTarget
          return t && t.hp > 0 ? t : null
        },
        hooks: {
          onDamage,
          onHeal: (n) => onHeal(player, n),
          onDemonLink: applyDemonLink,
        },
      })
      await companions.loadAssets()

      shell.bind({ player, combat, env, companions })
      active = true
      setInputEnabled(true)
      reportLoad(4, '资源已就绪')
    } finally {
      starting = false
    }
  }

  function phase() {
    return shell.ui?.session?.phase ?? 'menu'
  }

  function update(dt) {
    syncVajra()
    probeUnity()
    if (!active || !player || !env || !foes || !combat || !companions) return
    if (!inputEnabled) return
    const p = phase()
    if (p !== 'playing') {
      player.clearMovementKeys?.()
      stepLevelUpFx(player, dt)
      if (p === 'levelup' || p === 'upgrade') {
        env.updatePickups?.(dt, player, { collect: false })
      }
      tryBeginUpgradeOffer()
      return
    }

    const s = readSettings()
    if (s.testMode) {
      player.setGodMode?.(s.godMode)
      combat.pistol.setInfiniteAmmo?.(s.infiniteAmmo)
    } else {
      player.setGodMode?.(false)
      combat.pistol.setInfiniteAmmo?.(false)
    }
    syncDummy(s)

    player.update(dt)
    env.collideSolid(player)

    if (player.hp > 0) {
      combat.update(dt)
      const elapsed = shell.ui.session.elapsedSec
      const rate = s.testMode ? s.spawnRate : 1
      foes.update(dt, player, engine.camera, elapsed, rate)
      companions.update(dt)
      env.update(dt, player, engine.camera, elapsed)
      if (phase() === 'levelup') {
        player.clearMovementKeys?.()
        stepLevelUpFx(player, dt)
        env.updatePickups?.(dt, player, { collect: false })
        tryBeginUpgradeOffer()
        return
      }
      shell.tick(dt)
    } else {
      if (!deathArmed) {
        deathArmed = true
        combat.unbindInput()
        player.unbindInput()
      }
      combat.update(dt)
    }
    updateDamageNums(dt)

    if (phase() === 'victory' && !deadNotified) {
      deadNotified = true
      combat.unbindInput()
      player.unbindInput()
      return
    }

    if (player.hp <= 0 && !deadNotified && player.deathAnimDone()) {
      deadNotified = true
      void shell.notifyDead()
    }
  }

  function drawWorld(ctx) {
    if (!active || !env || !foes || !player || !combat || !companions) return
    env.draw(ctx, engine.camera)
    foes.draw(ctx)
    companions.draw(ctx)
    player.draw(ctx)
    combat.draw(ctx)
    drawDamageNums(ctx)
  }

  function install() {
    engine.setHooks({ update, drawWorld })
  }

  function uninstall() {
    teardown()
    engine.setHooks({})
  }

  return {
    begin,
    teardown,
    install,
    uninstall,
    getPlayer: () => player,
    getCombat: () => combat,
    setInputEnabled,
  }
}
