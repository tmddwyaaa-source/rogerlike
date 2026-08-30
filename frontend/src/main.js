import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// A1：把致命错误显示到页面（不止 console），并防止未捕获异常导致应用崩溃循环重置。
function showFatal(where, err) {
  const msg = (err && (err.stack || err.message)) || String(err) || where
  const box = document.createElement('pre')
  box.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:99999;max-width:92vw;max-height:46vh;overflow:auto;' +
    'background:#1a1a1a;color:#ff8080;font:12px/1.4 monospace;padding:10px 12px;' +
    'border:2px solid #ff5252;white-space:pre-wrap;word-break:break-word;'
  box.textContent = '[A1:error] ' + where + '\n' + msg
  ;(document.getElementById('a1-error') || document.body.appendChild(Object.assign(box, { id: 'a1-error' }))).replaceChildren(box)
  console.error('[A1:error]', where, err)
}
app.config.errorHandler = (err, _vm, info) => showFatal('app:error ' + info, err)
window.addEventListener('error', (ev) => {
  if (ev?.error) showFatal('window:error', ev.error)
})
window.addEventListener('unhandledrejection', (ev) => {
  showFatal('window:unhandledrejection', ev?.reason)
})

app.mount('#app')
