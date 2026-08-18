<script setup>
/**
 * 选角立绘：S_Idle 第 0 帧，水平翻转朝右。黑底当透明。
 */
import { onMounted, ref } from 'vue'
import { RANGER_FRAME, RANGER_IDLE_SRC } from '../ui/constants.js'

const SCALE = 2
const BLACK_KEY = 12
const canvasRef = ref(null)

onMounted(async () => {
  const el = canvasRef.value
  if (!el) return
  const w = RANGER_FRAME * SCALE
  el.width = w
  el.height = w
  const ctx = el.getContext('2d')
  ctx.imageSmoothingEnabled = false
  const img = new Image()
  img.src = RANGER_IDLE_SRC
  try {
    await img.decode()
  } catch {
    return
  }
  const src = document.createElement('canvas')
  src.width = RANGER_FRAME
  src.height = RANGER_FRAME
  const g = src.getContext('2d')
  g.drawImage(img, 0, 0, RANGER_FRAME, RANGER_FRAME, 0, 0, RANGER_FRAME, RANGER_FRAME)
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
})
</script>

<template>
  <canvas ref="canvasRef" class="rl-ranger-idle" width="64" height="64" />
</template>
