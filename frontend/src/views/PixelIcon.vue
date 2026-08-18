<script setup>
/**
 * M8 升级图标：有 /assets/upgrades/{id}.png 则显示；否则空白方块。
 * 不使用程序字符画。高级项左上角 3×3 逻辑像素红点。
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { upgradeById } from '../ui/constants.js'
import { ICON_SIZE, paintAdvancedDot, paintBlankIcon, upgradeIconUrl } from '../ui/icons.js'

const props = defineProps({
  id: { type: String, required: true },
  scale: { type: Number, default: 4 },
  advanced: { type: Boolean, default: null },
})

const canvasRef = ref(null)
let img = null

function isAdvanced() {
  if (props.advanced === true) return true
  if (props.advanced === false) return false
  return upgradeById(props.id)?.tier === 'advanced'
}

function drawBlank(ctx, s) {
  paintBlankIcon(ctx, 0, 0, s)
}

function drawLoaded(ctx, sheet, s) {
  const w = ICON_SIZE * s
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, w, w)
  ctx.drawImage(sheet, 0, 0, w, w)
}

function redraw() {
  const el = canvasRef.value
  if (!el) return
  const s = Math.max(1, props.scale | 0)
  el.width = ICON_SIZE * s
  el.height = ICON_SIZE * s
  const ctx = el.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, el.width, el.height)
  if (img && img.complete && img.naturalWidth > 0) {
    drawLoaded(ctx, img, s)
  } else {
    drawBlank(ctx, s)
  }
  if (isAdvanced()) paintAdvancedDot(ctx, 0, 0, s)
}

function load() {
  img = new Image()
  img.onload = () => redraw()
  img.onerror = () => {
    img = null
    redraw()
  }
  img.src = upgradeIconUrl(props.id)
  redraw()
}

onMounted(() => load())
watch(
  () => [props.id, props.scale, props.advanced],
  () => load(),
)
onUnmounted(() => {
  img = null
})
</script>

<template>
  <canvas ref="canvasRef" class="rl-icon" />
</template>
