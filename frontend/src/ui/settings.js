/**
 * 全局设置 + 测试模式（localStorage 持久化音量/开关）。
 */
import { LEVEL_BOOST_MAX, SURVIVE_WIN_SEC, SURVIVE_WIN_SEC_DIFF2 } from './constants.js'

const KEY = 'rogerlike.settings.v1'

/** P42 批次5（R1③）：测试时间滑条上限跟最长的通关门槛走（难度二 720s），否则拖不到通关时刻。 */
export const TEST_ELAPSED_MAX = Math.max(SURVIVE_WIN_SEC, SURVIVE_WIN_SEC_DIFF2)
export const TEST_ELAPSED_STEP = 5

export function defaultSettings() {
  return {
    volume: 0.7,
    /** 背景音乐分项音量（独立控制；实际 BGM = 总音量 × 本值） */
    bgmVolume: 0.7,
    /** 音效音量（独立于音乐；实际音效 = 总音量 × 本值） */
    sfxVolume: 0.7,
    testMode: false,
    godMode: false,
    infiniteAmmo: false,
    /** 刷怪速度倍率：0.25 … 2，步进 0.25，默认 1 */
    spawnRate: 1,
    /** 测试时间 0～12 分钟（秒；上限 = 最长通关门槛） */
    testElapsedSec: 0,
    /** 测试火柴人木桩 */
    testDummy: false,
  }
}

export function loadSettings() {
  const base = defaultSettings()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const merged = { ...base, ...JSON.parse(raw) }
    merged.testElapsedSec = clampTestElapsedSec(merged.testElapsedSec)
    return merged
  } catch {
    return base
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function clampSpawnRate(v) {
  const n = Math.round(Number(v) / 0.25) * 0.25
  return Math.min(2, Math.max(0.25, n))
}

export function clampVolume(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export function clampLevelBoost(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.min(LEVEL_BOOST_MAX, Math.max(0, Math.round(v)))
}

export function clampTestElapsedSec(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  const stepped = Math.round(n / TEST_ELAPSED_STEP) * TEST_ELAPSED_STEP
  return Math.min(TEST_ELAPSED_MAX, Math.max(0, stepped))
}

export function formatVolumePct(v) {
  return `${Math.round(clampVolume(v) * 100)}%`
}

/** 写入 settings.volume，返回 0–100 的显示整数。 */
export function setVolume(settings, raw) {
  settings.volume = clampVolume(raw)
  return Math.round(settings.volume * 100)
}
