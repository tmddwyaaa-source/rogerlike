/**
 * M9 集成：设置（测试模式）+ 胜负 + 刷怪倍率。
 * P6：活设置倍率；黑洞飞行吸入；levelup 播完 +1 再出三选一。
 * P9：跟班 update/draw；升级停顿只飞不拾取；暂停清键。
 */
import { createCombat } from './combat/index.js'
import { createCompanions } from './companions/index.js'
import { createEnemies } from './enemies/index.js'
import { createPlayer } from './player/index.js'
import { stepLevelUpFx } from './render/levelup.js'
import { createEnvironment } from './world/index.js'

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
  let starting = false

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
      }
    )
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
    deadNotified = false
    engine.setFollowTarget(null)
    shell.bind({ player: null, combat: null, env: null, companions: null })
  }

  function bindCtx() {
    return { player, combat, env, companions }
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
      const settings = payload.settings || readSettings()

      player = createPlayer({
        godMode: settings.testMode && settings.godMode,
      })
      engine.setFollowTarget(player)
      player.bindInput(io())
      await player.loadAssets()

      env = createEnvironment({
        hooks: {
          onCrystal: () => {
            const gained = shell.notifyExp(1)
            if (gained > 0) player?.queueLevelUpFx?.(gained)
          },
          onFruit: (heal) => player?.heal?.(heal),
        },
      })
      await env.loadAssets()
      // 不要覆盖 M7 的 pullAllCrystals；vacuumCrystals 已是飞行吸入。

      foes = createEnemies({
        player,
        hooks: {
          spawnCrystal: (x, y) => env.spawnCrystal(x, y),
          onKill: () => shell.ui.addKill(),
        },
      })
      await foes.loadAssets()

      combat = createCombat({
        player,
        targets: foes.targets,
        hooks: {
          hitWorld: (x, y, dmg, r) => env.hitAt(x, y, dmg, r),
        },
      })
      if (settings.testMode && settings.infiniteAmmo) {
        combat.pistol.setInfiniteAmmo(true)
      }
      combat.bindInput(io())

      companions = createCompanions({
        player,
        getTargets: () => foes.targets,
        getAttack: () => combat?.pistol?.attack ?? player?.attack ?? 20,
      })
      await companions.loadAssets()

      shell.bind({ player, combat, env, companions })
      active = true
    } finally {
      starting = false
    }
  }

  function phase() {
    return shell.ui?.session?.phase ?? 'menu'
  }

  function update(dt) {
    if (!active || !player || !env || !foes || !combat || !companions) return
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

    player.update(dt)
    env.collideSolid(player)
    combat.update(dt)
    const elapsed = shell.ui.session.elapsedSec
    const rate = s.testMode ? s.spawnRate : 1
    foes.update(dt, player, engine.camera, elapsed, rate)
    companions.update(dt)
    env.update(dt, player, engine.camera, elapsed)
    shell.tick(dt)

    if (phase() === 'victory' && !deadNotified) {
      deadNotified = true
      combat.unbindInput()
      player.unbindInput()
      return
    }

    if (player.hp <= 0 && !deadNotified) {
      deadNotified = true
      combat.unbindInput()
      player.unbindInput()
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
  }
}
