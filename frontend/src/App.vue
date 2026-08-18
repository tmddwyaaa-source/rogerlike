<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createEngine } from './game/engine.js'
import { createMatchRuntime } from './game/match.js'
import GameShell from './views/GameShell.vue'

const canvasRef = ref(null)
const shellRef = ref(null)
let engine = null
let match = null

function createShellAdapter(getShell) {
  return {
    bind(...args) {
      getShell()?.bind(...args)
    },
    tick(...args) {
      getShell()?.tick(...args)
    },
    notifyExp(...args) {
      getShell()?.notifyExp(...args)
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
})

onUnmounted(() => {
  match?.uninstall()
  engine?.stop()
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
