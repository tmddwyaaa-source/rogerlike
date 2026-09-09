/**
 * UI 音效播放器。一次性音效每次新建 Audio 并持有引用到 ended/error 才释放
 * （无引用会被加载竞速/GC 静默掐断，曾导致「获取经验」不响）；可多实例并行。
 * 心跳独占一条循环轨，禁止叠多条。
 * shoot / slash / fireball / pickup / hurt 由 M1 在 match.js 接线，这里只提供 play API。
 */
import { assetUrl } from '../assetUrl.js'
import { clampVolume } from './settings.js'

export const SFX_FILES = {
  shoot: '射箭声音.wav',
  slash: '挥砍声音.mp3',
  fireball: '法师火球.mp3',
  pickup: '获取经验.mp3',
  levelup: '升级音效.ogg',
  heartbeat: '低血量心跳.mp3',
  defeat: '游戏失败.ogg',
  victory: '通关音效.ogg',
  hurt: '受伤音效.mp3',
  ui_click: 'ui-click.wav',
}

export const SFX_URLS = Object.fromEntries(
  Object.entries(SFX_FILES).map(([name, file]) => [
    name,
    assetUrl(name === 'ui_click' ? `assets/ui/${file}` : `assets/游戏音乐/${file}`),
  ]),
)

/** 每音效线性增益（缺省 1）：素材电平过低的补偿；最终音量钳制 ≤1。心跳不增益。 */
export const SFX_GAIN = {
  pickup: 2.5,
  levelup: 2.8,
}

let shared = null

export function createSfx(opts = {}) {
  const audioCtor = opts.audioCtor ?? (typeof Audio !== 'undefined' ? Audio : null)
  let vol = clampVolume(opts.volume ?? 1)
  let heart = null
  const playing = new Set()

  function make(name) {
    const url = SFX_URLS[name]
    if (!url || !audioCtor) return null
    const a = new audioCtor(url)
    a.preload = 'auto'
    return a
  }

  return {
    urls: SFX_URLS,
    play(name) {
      const a = make(name)
      if (!a) return false
      a.volume = Math.min(1, vol * (SFX_GAIN[name] ?? 1))
      playing.add(a)
      a.onended = () => playing.delete(a)
      a.onerror = () => playing.delete(a)
      const p = a.play?.()
      if (p && typeof p.catch === 'function') p.catch(() => playing.delete(a))
      return true
    },
    startHeartbeat() {
      if (heart) return false
      heart = make('heartbeat')
      if (!heart) return false
      heart.loop = true
      heart.volume = vol
      const p = heart.play?.()
      if (p && typeof p.catch === 'function') p.catch(() => {})
      return true
    },
    stopHeartbeat() {
      if (!heart) return false
      heart.pause?.()
      try {
        heart.currentTime = 0
      } catch {
        /* 无伤大雅 */
      }
      heart = null
      return true
    },
    isHeartbeatOn() {
      return heart != null
    },
    activeCount() {
      return playing.size
    },
    setVolume(v) {
      vol = clampVolume(v)
      if (heart) heart.volume = vol
      return vol
    },
  }
}

export function getSharedSfx() {
  if (!shared) shared = createSfx()
  return shared
}
