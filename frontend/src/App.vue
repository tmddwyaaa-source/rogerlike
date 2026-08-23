<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createEngine } from './game/engine.js'
import { createMatchRuntime } from './game/match.js'
import GameShell from './views/GameShell.vue'

const canvasRef = ref(null)
const shellRef = ref(null)
let engine = null
let match = null
let stageObserver = null

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
})

onUnmounted(() => {
  match?.uninstall()
  engine?.stop()
  window.removeEventListener('resize', syncStageRect)
  stageObserver?.disconnect()
  stageObserver = null
  match = null
  engine = null
})

async function onStart(payload) {
  await match?.begin(payload || {})
}

function onAgain() {
  match?.teardown()
}

function onHome() {
  match?.teardown()
}
</script>

<template>
  <GameShell ref="shellRef" @start="onStart" @again="onAgain" @home="onHome">
    <div class="stage">
      <canvas ref="canvasRef" />
    </div>
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
