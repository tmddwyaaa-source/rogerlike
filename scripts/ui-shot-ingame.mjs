#!/usr/bin/env node
/**
 * 局内 HUD 截图 + 字体继承核查（headless Edge + CDP）。
 *
 * 用法（项目根目录）：
 *   node scripts/ui-shot-ingame.mjs [--out docs/screenshots/ui-redesign] [--tag p35] [--port 4190]
 *
 * 用途：证明 P35 局外改版未影响局内 HUD（截图 + computed font-family 不含 Zpix）。
 * 前置：frontend/dist 已构建。
 */
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : d
}
const OUT = resolve(arg('out', 'docs/screenshots/ui-redesign'))
const PORT = Number(arg('port', '4190'))
const TAG = arg('tag', 'p35')
const DIST = resolve('frontend/dist')
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const DEBUG_PORT = PORT + 1
const W = 1280
const H = 720

if (!existsSync(DIST)) {
  console.error(`dist not found: ${DIST} — run: cd frontend && npm run build`)
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
}
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  let file = join(DIST, url === '/' ? 'index.html' : url)
  if (!existsSync(file) || !extname(file)) file = join(DIST, 'index.html')
  try {
    const body = readFileSync(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const httpJson = async (p) => (await fetch(`http://127.0.0.1:${DEBUG_PORT}${p}`)).json()

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
      }
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  static async connect(url) {
    const ws = new WebSocket(url)
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true })
      ws.addEventListener('error', rej, { once: true })
    })
    return new Cdp(ws)
  }
}

async function evalJs(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result?.value
}

async function main() {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
  const edge = spawn(
    EDGE,
    [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--mute-audio',
      '--force-device-scale-factor=1', `--window-size=${W},${H}`,
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${join(process.env.TEMP || '/tmp', `rl-ingame-${DEBUG_PORT}`)}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let version = null
  for (let i = 0; i < 40; i++) {
    try { version = await httpJson('/json/version'); break } catch { await sleep(250) }
  }
  if (!version) throw new Error('edge devtools not reachable')
  const page = (await httpJson('/json/list')).find((t) => t.type === 'page')
  const cdp = await Cdp.connect(page.webSocketDebuggerUrl)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })

  const home = `http://127.0.0.1:${PORT}/`
  await cdp.send('Page.navigate', { url: home })
  await sleep(1100)
  await evalJs(cdp, `(() => { localStorage.clear(); return true })()`)
  await cdp.send('Page.navigate', { url: home })
  await sleep(1100)

  const clickText = async (t) => {
    await evalJs(cdp, `(() => { const el=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().includes(${JSON.stringify(t)})); if(!el) return false; el.click(); return true })()`)
    await sleep(450)
  }

  // 局外（首页）字体探针：确认 Zpix 已加载且作用在 .rl-screen
  const menuProbe = await evalJs(
    cdp,
    `(() => {
      const s = document.querySelector('.rl-screen')
      const cs = s ? getComputedStyle(s) : null
      return {
        screenFont: cs ? cs.fontFamily : null,
        zpixLoaded: document.fonts ? document.fonts.check('12px Zpix') : null,
        fontFaces: document.fonts ? [...document.fonts].map((f) => f.family + ':' + f.status) : [],
      }
    })()`,
  )
  console.log('MENU_PROBE ' + JSON.stringify(menuProbe))

  await clickText('开始游戏')
  await evalJs(cdp, `(() => { const el=[...document.querySelectorAll('.rl-pick')].find(b=>b.textContent.includes('游侠')); if(!el) return false; el.click(); return true })()`)
  await sleep(500)
  await evalJs(cdp, `(() => { const el=document.querySelector('.rl-diff-pick'); if(!el) return false; el.click(); return true })()`)
  await sleep(2500)

  const probe = await evalJs(
    cdp,
    `(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const cs = getComputedStyle(el)
        return { sel, fontFamily: cs.fontFamily, background: cs.backgroundColor, color: cs.color }
      }
      return {
        phase: (() => {
          const s = document.querySelector('.rl-screen')
          return s ? (s.className || 'screen') : 'no-screen'
        })(),
        topbar: pick('.rl-topbar'),
        botbar: pick('.rl-botbar'),
        hearts: pick('.rl-hearts'),
        gear: pick('.rl-gear'),
        upgrade: pick('.rl-upgrade'),
        bodyFont: getComputedStyle(document.body).fontFamily,
      }
    })()`,
  )
  console.log('PROBE ' + JSON.stringify(probe, null, 1))

  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const file = join(OUT, `${TAG}-09-ingame-hud.png`)
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(`SHOT ${file}`)

  const zpixInHud = [probe?.topbar, probe?.botbar, probe?.hearts, probe?.gear]
    .filter(Boolean)
    .some((x) => /zpix/i.test(x.fontFamily || ''))
  // 原始 HUD 文本字体栈（v0.10 .rl-root）：ui-monospace, "Cascadia Mono", "Sarasa Mono SC", monospace
  // 注：.rl-gear 是 <button>，UA 样式给 Arial（v0.10 亦然），不参与本断言。
  const textFonts = [probe?.topbar, probe?.botbar, probe?.hearts].filter(Boolean).map((x) => x.fontFamily || '')
  const hudKeepsOriginal = textFonts.length > 0 && textFonts.every((f) => /ui-monospace|Cascadia|Sarasa|monospace/i.test(f))
  if (zpixInHud) console.log('RESULT FAIL hud-inherits-zpix')
  else if (!hudKeepsOriginal) console.log(`RESULT FAIL hud-font-changed (got ${JSON.stringify(textFonts)})`)
  else console.log('RESULT PASS hud-font-original')

  edge.kill()
  server.close()
}

main().catch((e) => {
  console.error('INGAME_FAIL', e)
  process.exit(1)
})
