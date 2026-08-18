/**
 * 静态资源 URL。本地为 `/assets/...`；GitHub Pages 为 `/rogerlike/assets/...`。
 * Node 自测没有 Vite 注入时退回 `/`。
 */
export function assetUrl(path) {
  const rel = String(path || '').replace(/^\//, '')
  const raw =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
  const base = raw.endsWith('/') ? raw : `${raw}/`
  return `${base}${rel}`
}
