/**
 * 单轨循环 BGM。禁止叠多个 Audio。
 */
import { BGM_URL } from './constants.js'
import { clampVolume } from './settings.js'

let shared = null

export { BGM_URL }

export function createBgm(opts = {}) {
  let audio = opts.audio ?? null

  function ensure() {
    if (audio) return audio
    if (typeof Audio === 'undefined') return null
    audio = new Audio(BGM_URL)
    audio.loop = true
    return audio
  }

  return {
    url: BGM_URL,
    ensure,
    setVolume(v) {
      const vol = clampVolume(v)
      const a = ensure()
      if (a) {
        a.volume = vol
        a.muted = vol <= 0
      }
      return vol
    },
    play() {
      const a = ensure()
      if (!a) return false
      a.loop = true
      a.muted = clampVolume(a.volume) <= 0
      const p = a.play?.()
      if (p && typeof p.catch === 'function') p.catch(() => {})
      return true
    },
  }
}

export function getSharedBgm() {
  if (!shared) shared = createBgm()
  return shared
}
