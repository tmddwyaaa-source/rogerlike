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
  // 三层实心像素块：墨边 → 苔绿内线 → 按键黄，避免普通表单的细描边感。
  ctx.fillStyle = '#2c2c28'
  ctx.fillRect(1, 1, w - 2, h - 2)
  ctx.fillStyle = '#9aaa58'
  ctx.fillRect(4, 4, w - 8, h - 8)
  ctx.fillStyle = '#cec95f'
  ctx.fillRect(6, 6, w - 12, h - 12)
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
