/**
 * 全局设置 + 测试模式（localStorage 持久化音量/开关）。
 */
import { LEVEL_BOOST_MAX } from './constants.js'

const KEY = 'rogerlike.settings.v1'

export function defaultSettings() {
  return {
    volume: 0.7,
    testMode: false,
    godMode: false,
    infiniteAmmo: false,
    /** 刷怪速度倍率：0.25 … 2，步进 0.25，默认 1 */
    spawnRate: 1,
  }
}

export function loadSettings() {
  const base = defaultSettings()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    return { ...base, ...JSON.parse(raw) }
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

export function formatVolumePct(v) {
  return `${Math.round(clampVolume(v) * 100)}%`
}

/** 写入 settings.volume，返回 0–100 的显示整数。 */
export function setVolume(settings, raw) {
  settings.volume = clampVolume(raw)
  return Math.round(settings.volume * 100)
}
