/**
 * M8 门面。
 */
import { submitResult, startMatch } from './api.js'
import {
  DIFFICULTY_ONE,
  GAME_TITLE,
  UPGRADES,
} from './constants.js'
import { createSession } from './session.js'
import { loadSettings, saveSettings } from './settings.js'

export {
  API_BASE,
  CHAR_NAME,
  CHARGE_MAX_SEC,
  DIFFICULTY_ONE,
  EXP_BASE,
  EXP_GROWTH,
  GAME_TITLE,
  LEVEL_BOOST_MAX,
  LEVEL_GROWTH_ATK,
  LEVEL_GROWTH_EVERY,
  LEVEL_GROWTH_SPEED,
  MOVE_SPEED_BONUS,
  SURVIVE_WIN_SEC,
  UPGRADE_AMMO,
  UPGRADE_BLACKHOLE,
  UPGRADE_MAGNET,
  UPGRADE_GOBLIN,
  UPGRADE_RABBIT,
  UPGRADE_MOVE,
  UPGRADE_RELOAD,
  UPGRADES,
  WEAPON_NAME,
  BGM_URL,
  RANGER_IDLE_SRC,
  expNeedForLevel,
} from './constants.js'
export { countInk, iconRows, paintBlankIcon, paintAdvancedDot, paintIcon, ICON_SIZE, ADVANCED_DOT_SIZE, resolveUpgradeIcon, upgradeIconUrl } from './icons.js'
export { applyUpgrade, applyLevelGrowth, createSession, formatTime, pickUpgradeChoices, availableUpgrades, isAdvancedOffer, levelGrowthSteps } from './session.js'
export { loadMemories, saveMemory, summarizePicked, MEMORY_CAP } from './memories.js'
export { endMatch, fetchTop, reportMatch, startMatch, submitResult } from './api.js'
export {
  clampSpawnRate,
  clampLevelBoost,
  clampVolume,
  defaultSettings,
  formatVolumePct,
  loadSettings,
  saveSettings,
  setVolume,
} from './settings.js'
export { createBgm, getSharedBgm } from './bgm.js'

export function createMatchUi() {
  const session = createSession()
  const settings = loadSettings()

  return {
    session,
    settings,
    title: GAME_TITLE,
    upgrades: UPGRADES,
    persistSettings() {
      saveSettings(settings)
    },
    start(difficulty = DIFFICULTY_ONE.id) {
      return session.start(difficulty)
    },
    tick(dt) {
      return session.tick(dt)
    },
    addExp(n, ctx) {
      return session.addExp(n, ctx)
    },
    addKill(n) {
      session.addKill(n)
    },
    applyChoice(id, ctx) {
      return session.applyChoice(id, ctx)
    },
    beginUpgradeOffer(ctx) {
      return session.beginUpgradeOffer(ctx)
    },
    finish(ctx) {
      return session.finish(ctx)
    },
    finishWin(ctx) {
      return session.finishWin(ctx)
    },
    snapshot(player, combat) {
      return session.snapshot(player, combat)
    },
    async beginRemote() {
      const rec = await startMatch(session.difficulty)
      session.matchId = rec?.id ?? rec?.data?.id ?? null
      return rec
    },
    async submit() {
      return submitResult(session)
    },
  }
}
