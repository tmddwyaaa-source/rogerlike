#!/usr/bin/env node
/**
 * 局外 UI 六屏截图（headless Edge + CDP）。
 *
 * 用法（项目根目录）：
 *   node scripts/ui-shots.mjs [--out docs/screenshots/ui-redesign] [--port 4178] [--tag before|after]
 *
 * 前置：frontend/dist 已构建（cd frontend && npm run build）。
 * 说明：只用于本地视觉复核；不改任何业务文件。
 */
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const OUT = resolve(arg('out', 'docs/screenshots/ui-redesign'))
const PORT = Number(arg('port', '4178'))
const TAG = arg('tag', 'shot')
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
  '.svg': 'image/svg+xml',
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function httpJson(path) {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}${path}`)
  return res.json()
}

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
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true })
      ws.addEventListener('error', rej, { once: true })
    })
    return new Cdp(ws)
  }
}

async function evalJs(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.result?.value ?? ''))
  return r.result?.value
}

async function shot(cdp, name, note = '') {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const file = join(OUT, `${TAG}-${name}.png`)
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(`SHOT ${file}${note ? '  (' + note + ')' : ''}`)
}

async function settle(cdp, ms = 350) {
  await evalJs(cdp, 'document.fonts ? document.fonts.ready.then(() => true) : true')
  await sleep(ms)
}

/** 读当前 UI 相位（用于断言导航真的走到了目标屏）。 */
async function phase(cdp) {
  return evalJs(
    cdp,
    `(() => {
      const s = document.querySelector('.rl-screen')
      if (!s) return 'none'
      if (s.classList.contains('rl-settings')) return s.querySelector('.rl-settings-test') ? 'settings-test' : 'settings'
      if (s.classList.contains('rl-more')) {
        if (s.querySelector('.rl-mem-detail')) return 'memories-detail'
        if (s.querySelector('.rl-mem-list')) return 'memories-list'
        return 'more'
      }
      if (s.querySelector('.rl-result')) return 'result'
      if (s.querySelector('.rl-pick-row') && s.textContent.includes('选择难度')) return 'difficulty'
      if (s.querySelector('.rl-pick-row')) return 'char'
      return 'menu'
    })()`,
  )
}

/** 找到 GameShell 组件实例（Vue 内部树）。 */
async function findShell(cdp) {
  return evalJs(
    cdp,
    `(() => {
      const root = document.querySelector('.rl-root')
      if (!root) return 'no-root'
      let c = root.__vueParentComponent || (root.__vue_app__ && root.__vue_app__._instance) || null
      let guard = 0
      while (c && guard++ < 30) {
        const ctx = c.ctx || c.proxy || {}
        if (ctx && (ctx.ui || (c.exposed && c.exposed.ui))) return 'ok'
        c = c.parent
      }
      return 'no-shell'
    })()`,
  )
}

async function clickText(cdp, text) {
  const ok = await evalJs(
    cdp,
    `(() => {
      const els = [...document.querySelectorAll('button')]
      const el = els.find((b) => b.textContent.trim().includes(${JSON.stringify(text)}))
      if (!el) return false
      el.click()
      return true
    })()`,
  )
  await settle(cdp, 400)
  return ok
}

async function hover(cdp, selector) {
  await evalJs(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) return false
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      return true
    })()`,
  )
  await settle(cdp, 350)
}

async function main() {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
  console.log(`static server http://127.0.0.1:${PORT}/ -> ${DIST}`)

  const edge = spawn(
    EDGE,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--mute-audio',
      '--force-device-scale-factor=1',
      `--window-size=${W},${H}`,
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${join(process.env.TEMP || '/tmp', `rl-shot-${DEBUG_PORT}`)}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let version = null
  for (let i = 0; i < 40; i++) {
    try {
      version = await httpJson('/json/version')
      break
    } catch {
      await sleep(250)
    }
  }
  if (!version) throw new Error('edge devtools not reachable')

  const targets = await httpJson('/json/list')
  const page = targets.find((t) => t.type === 'page')
  const cdp = await Cdp.connect(page.webSocketDebuggerUrl)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: W,
    height: H,
    deviceScaleFactor: 1,
    mobile: false,
  })

  const goto = async (url) => {
    await cdp.send('Page.navigate', { url })
    await sleep(1100)
    await settle(cdp)
  }
  const home = `http://127.0.0.1:${PORT}/`
  const resetStore = async () => {
    await evalJs(cdp, `(() => { localStorage.clear(); return true })()`)
  }

  // 1) 首页
  await goto(home)
  await resetStore()
  await goto(home)
  await shot(cdp, '01-menu', await phase(cdp))

  // 2) 选角（悬停第一张卡，保留 tooltip）
  await clickText(cdp, '开始游戏')
  await hover(cdp, '.rl-pick')
  await shot(cdp, '02-char', await phase(cdp))

  // 3) 难度（悬停难度一，保留 tooltip）
  await evalJs(cdp, `(() => { const c=document.querySelector('.rl-pick'); if(c) c.dispatchEvent(new MouseEvent('mouseleave',{bubbles:true})); return true })()`)
  await evalJs(
    cdp,
    `(() => {
      const el = [...document.querySelectorAll('.rl-pick')].find((b) => b.textContent.includes('游侠'))
      if (!el) return false
      el.click()
      return true
    })()`,
  )
  await settle(cdp, 500)
  await hover(cdp, '.rl-diff-pick')
  await shot(cdp, '03-difficulty', await phase(cdp))

  // 4) 设置（从难度返回 → 主页 → 设置），并展开测试面板
  await clickText(cdp, '返回')
  const backPhase = await phase(cdp)
  await clickText(cdp, '返回')
  await clickText(cdp, '设置')
  const setPhase = await phase(cdp)
  if (setPhase !== 'settings') console.warn(`WARN settings not reached: phase=${setPhase} (after back: ${backPhase})`)
  await shot(cdp, '04-settings', setPhase)
  await clickText(cdp, '测试模式')
  await shot(cdp, '05-settings-test', await phase(cdp))

  // 5) 回忆（注入一条对局记录 → …… → 回忆 → 详情）
  await evalJs(
    cdp,
    `(() => {
      const rec = {
        id: Date.now(), at: Date.now(), win: true, timeText: '10:00', survivedSec: 600,
        level: 12, exp: 7, expNeed: 59, hp: 2, hpMax: 3, charge: 0.5, chargeMax: 0.75, charging: false,
        charName: '游侠', charId: 'ranger', kills: 128, difficulty: '1',
        upgrades: [{ id: 'power', at: 1 }, { id: 'power', at: 2 }, { id: 'giant', at: 3 },
                   { id: 'magnet', at: 4 }, { id: 'crit', at: 5 }, { id: 'goblin', at: 6 },
                   { id: 'rabbit', at: 7 }, { id: 'sanwa', at: 8 }, { id: 'siwa', at: 9 },
                   { id: 'wuwa', at: 10 }, { id: 'liuwa', at: 11 }, { id: 'knockback', at: 12 }]
      }
      localStorage.setItem('rogerlike.memories', JSON.stringify([rec]))
      return true
    })()`,
  )
  await clickText(cdp, '返回')
  await clickText(cdp, '……')
  await clickText(cdp, '回忆')
  await shot(cdp, '06-memories-list', await phase(cdp))
  await evalJs(cdp, `(() => { const el=document.querySelector('.rl-mem-item'); if(!el) return false; el.click(); return true })()`)
  await settle(cdp, 450)
  await shot(cdp, '07-memories-detail', await phase(cdp))

  // 6) 结算：走真实流程——测试模式 + 时间拉满触发通关结算
  await goto(home)
  await evalJs(
    cdp,
    `(() => {
      const KEY = 'rogerlike.settings.v1'
      let s = {}
      try { s = JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { s = {} }
      s.testMode = true
      s.godMode = false
      s.testElapsedSec = 600
      localStorage.setItem(KEY, JSON.stringify(s))
      return true
    })()`,
  )
  await goto(home)
  await clickText(cdp, '开始游戏')
  await evalJs(
    cdp,
    `(() => { const el=[...document.querySelectorAll('.rl-pick')].find(b=>b.textContent.includes('游侠')); if(!el) return false; el.click(); return true })()`,
  )
  await settle(cdp, 450)
  await evalJs(
    cdp,
    `(() => { const el=document.querySelector('.rl-diff-pick'); if(!el) return false; el.click(); return true })()`,
  )
  await settle(cdp, 600)
  let resultPhase = 'none'
  for (let i = 0; i < 30; i++) {
    resultPhase = await phase(cdp)
    if (resultPhase === 'result') break
    await sleep(700)
  }
  if (resultPhase === 'result') {
    await settle(cdp, 600)
    await shot(cdp, '08-result', resultPhase)
  } else {
    console.warn(`result screen skipped: phase=${resultPhase}`)
  }

  edge.kill()
  server.close()
  console.log(`DONE -> ${OUT}`)
}

main().catch((err) => {
  console.error('SHOTS_FAIL', err)
  process.exit(1)
})
