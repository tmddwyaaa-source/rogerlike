<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createEngine } from './game/engine.js'
import { createMatchRuntime } from './game/match.js'
import GameShell from './views/GameShell.vue'
import LoadingOverlay from './views/LoadingOverlay.vue'

const canvasRef = ref(null)
const shellRef = ref(null)
const loading = ref(false)
const loadingProgress = ref(0)
const loadingStage = ref('准备资源')
const loadingError = ref('')
const frameTransition = ref(false)
const frameProgress = ref(100)
let engine = null
let match = null
let stageObserver = null
let lastStartPayload = null
let frameTimer = null

/** P22：把画布实际矩形（整数缩放居中后的黑边内区域）暴露为 CSS 变量，供 HUD 通栏钳制。 */
function syncStageRect() {
  const shellEl = shellRef.value?.$el
  const canvas = canvasRef.value
  if (!shellEl || !canvas) return
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const style = shellEl.style
  style.setProperty('--rl-stage-left', `${rect.left}px`)
  style.setProperty('--rl-stage-top', `${rect.top}px`)
  style.setProperty('--rl-stage-width', `${rect.width}px`)
  style.setProperty('--rl-stage-height', `${rect.height}px`)
}

function createShellAdapter(getShell) {
  return {
    bind(...args) {
      getShell()?.bind(...args)
    },
    tick(...args) {
      getShell()?.tick(...args)
    },
    notifyExp(...args) {
      return getShell()?.notifyExp(...args)
    },
    notifyDead(...args) {
      return getShell()?.notifyDead(...args)
    },
    getSettings() {
      return getShell()?.getSettings?.()
    },
    syncHud() {
      getShell()?.syncHud?.()
    },
    get ui() {
      return getShell()?.ui
    },
  }
}

onMounted(() => {
  engine = createEngine(canvasRef.value)
  match = createMatchRuntime({
    canvas: canvasRef.value,
    engine,
    shell: createShellAdapter(() => shellRef.value),
  })
  match.install()
  engine.start()
  syncStageRect()
  window.addEventListener('resize', syncStageRect)
  if (typeof ResizeObserver !== 'undefined') {
    stageObserver = new ResizeObserver(syncStageRect)
    stageObserver.observe(canvasRef.value)
  }
  window.addEventListener('keydown', blockLoadingKeys, true)
})

onUnmounted(() => {
  match?.uninstall()
  engine?.stop()
  window.removeEventListener('resize', syncStageRect)
  stageObserver?.disconnect()
  stageObserver = null
  window.removeEventListener('keydown', blockLoadingKeys, true)
  if (frameTimer) window.clearTimeout(frameTimer)
  match = null
  engine = null
})

function blockLoadingKeys(event) {
  if (!loading.value) return
  event.preventDefault()
  event.stopImmediatePropagation()
}

function onLoadProgress(status) {
  loadingProgress.value = status.progress
  loadingStage.value = status.stage
}

async function onStart(payload) {
  lastStartPayload = payload || {}
  loading.value = true
  loadingProgress.value = 0
  loadingStage.value = '准备资源'
  loadingError.value = ''
  try {
    await match?.begin({ ...lastStartPayload, onLoadProgress })
    loading.value = false
  } catch (error) {
    console.error('资源加载失败', error)
    loadingError.value = '资源加载失败，请重试。'
    loadingStage.value = '加载失败'
  }
}

/** 暂停/结算向外展开；恢复向内收回。只冻结既有对局，绝不重新加载资源。 */
function onFrameTransition(direction) {
  if (!match || loading.value) return
  if (frameTimer) window.clearTimeout(frameTimer)
  const entering = direction === 'enter'
  frameTransition.value = true
  frameProgress.value = entering ? 0 : 100
  if (entering) match.setInputEnabled(false)
  window.requestAnimationFrame(() => {
    frameProgress.value = entering ? 100 : 0
  })
  frameTimer = window.setTimeout(() => {
    frameTransition.value = false
    if (entering) match.setInputEnabled(true)
    frameTimer = null
  }, 180)
}

function retryLoad() {
  void onStart(lastStartPayload || {})
}

function onAgain() {
  match?.teardown()
}

function onHome() {
  match?.teardown()
}
</script>

<template>
  <GameShell ref="shellRef" @start="onStart" @again="onAgain" @home="onHome" @frame-transition="onFrameTransition">
    <div class="stage">
      <canvas ref="canvasRef" />
    </div>
    <LoadingOverlay
      v-if="loading"
      :progress="loadingProgress"
      :stage="loadingStage"
      :error="loadingError"
      @retry="retryLoad"
    />
    <LoadingOverlay v-else-if="frameTransition" mode="frame" :progress="frameProgress" />
  </GameShell>
</template>

<style>
html,
body,
#app {
  margin: 0;
  height: 100%;
  background: #1a2214;
  overflow: hidden;
}
.stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: auto;
}
canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
