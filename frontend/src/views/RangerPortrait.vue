<script setup>
/**
 * 选角/回忆立绘：S_Idle 帧序列，水平翻转朝右。黑底当透明。
 * animate 为 true 时按 6fps 播放 Idle 帧动画（悬停展示）。
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RANGER_FRAME, RANGER_IDLE_SRC } from '../ui/constants.js'

const SCALE = 2
const BLACK_KEY = 12
const FPS = 6
const canvasRef = ref(null)
const props = defineProps({
  src: { type: String, default: RANGER_IDLE_SRC },
  animate: { type: Boolean, default: false },
})

let imgEl = null
let timer = null
let frame = 0

async function load() {
  const il = new Image()
  il.src = props.src
  try {
    await il.decode()
  } catch {
    return
  }
  imgEl = il
  draw()
}

function draw() {
  const el = canvasRef.value
  if (!el || !imgEl) return
  const w = RANGER_FRAME * SCALE
  el.width = w
  el.height = w
  const ctx = el.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, w, w)
  const src = document.createElement('canvas')
  src.width = RANGER_FRAME
  src.height = RANGER_FRAME
  const g = src.getContext('2d')
  const frames = Math.max(1, Math.floor((imgEl.naturalWidth || RANGER_FRAME) / RANGER_FRAME) || 1)
  const fi = frame % frames
  g.drawImage(imgEl, fi * RANGER_FRAME, 0, RANGER_FRAME, RANGER_FRAME, 0, 0, RANGER_FRAME, RANGER_FRAME)
  const data = g.getImageData(0, 0, RANGER_FRAME, RANGER_FRAME)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < BLACK_KEY && d[i + 1] < BLACK_KEY && d[i + 2] < BLACK_KEY) d[i + 3] = 0
  }
  g.putImageData(data, 0, 0)
  ctx.save()
  ctx.translate(w, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(src, 0, 0, RANGER_FRAME, RANGER_FRAME, 0, 0, w, w)
  ctx.restore()
}

function start() {
  stop()
  frame = 0
  draw()
  timer = setInterval(() => {
    frame = (frame + 1) % 4
    draw()
  }, 1000 / FPS)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  frame = 0
}

onMounted(() => {
  void load()
  if (props.animate) start()
})
onUnmounted(stop)
watch(() => props.src, () => {
  void load()
})
watch(() => props.animate, (on) => {
  if (on) start()
  else {
    stop()
    void load()
  }
})
</script>

<template>
  <canvas ref="canvasRef" class="rl-ranger-idle" width="64" height="64" />
</template>
