<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  caption: { type: String, default: '' },
})

const canvasRef = ref(null)

function paint() {
  const c = canvasRef.value
  if (!c) return
  const ctx = c.getContext('2d')
  const w = 36
  const h = 28
  c.width = w
  c.height = h
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#cec95f'
  ctx.fillRect(2, 2, w - 4, h - 4)
  ctx.strokeStyle = '#2c2c28'
  ctx.lineWidth = 2
  ctx.strokeRect(2, 2, w - 4, h - 4)
  ctx.fillStyle = '#2c2c28'
  ctx.font = 'bold 12px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(props.label, w / 2, h / 2 + 1)
}

onMounted(paint)
watch(() => props.label, paint)
</script>

<template>
  <div class="rl-key">
    <canvas ref="canvasRef" />
    <span v-if="caption">{{ caption }}</span>
  </div>
</template>
