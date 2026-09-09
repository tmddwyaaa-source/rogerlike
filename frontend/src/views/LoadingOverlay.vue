<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 0 },
  stage: { type: String, default: '准备资源' },
  error: { type: String, default: '' },
  mode: { type: String, default: 'loading' },
})

defineEmits(['retry'])

const safeProgress = computed(() => Math.max(0, Math.min(100, Math.round(props.progress))))
const blocksInput = computed(() => props.mode === 'loading')

/**
 * 0% 时绿色区域铺满全窗口；每次真实资源进度上升，四边同步向既有 stage 收缩。
 * 100% 时 inset 恰好是 stage 周围的黑框，故绿色区域精确落在游戏画面内。
 */
const inset = computed(() => {
  const ratio = safeProgress.value / 100
  return {
    '--load-top': `calc(var(--rl-stage-top, 0px) * ${ratio})`,
    '--load-right': `calc((100% - var(--rl-stage-left, 0px) - var(--rl-stage-width, 100%)) * ${ratio})`,
    '--load-bottom': `calc((100% - var(--rl-stage-top, 0px) - var(--rl-stage-height, 100%)) * ${ratio})`,
    '--load-left': `calc(var(--rl-stage-left, 0px) * ${ratio})`,
  }
})
</script>

<template>
  <section
    class="loading-overlay"
    :class="{ 'loading-overlay--blocking': blocksInput, 'loading-overlay--frame': !blocksInput }"
    aria-live="polite"
    :aria-busy="blocksInput"
    @pointerdown="blocksInput && $event.stopPropagation()"
  >
    <div class="loading-stage" :style="inset">
      <div v-if="blocksInput || error" class="loading-panel">
        <p class="loading-title">正在加载</p>
        <p class="loading-name">{{ stage }}</p>
        <div class="loading-track" aria-label="加载进度">
          <span class="loading-bar" :style="{ width: `${safeProgress}%` }" />
        </div>
        <p class="loading-count">{{ safeProgress }}%</p>
        <p v-if="error" class="loading-error">{{ error }}</p>
        <button v-if="error" class="loading-retry" type="button" @click="$emit('retry')">重新加载</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.loading-overlay--blocking {
  z-index: 100;
  background: #10140d;
  pointer-events: auto;
}

.loading-overlay--frame {
  background: transparent;
  pointer-events: none;
}

.loading-stage {
  position: absolute;
  inset: var(--load-top) var(--load-right) var(--load-bottom) var(--load-left);
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #5d7f52;
  image-rendering: pixelated;
  transition: inset 160ms steps(4, end);
}

.loading-panel {
  width: min(280px, 78vw);
  padding: 16px;
  color: #ded8c4;
  border: 3px solid #12161f;
  background: #1b202b;
  box-shadow: 5px 5px 0 #12161f;
  font-family: ui-monospace, "Cascadia Mono", monospace;
  text-align: center;
}

.loading-title,
.loading-name,
.loading-count,
.loading-error {
  margin: 0;
}

.loading-title { font-size: 20px; font-weight: 700; }
.loading-name { min-height: 1.5em; margin-top: 8px; color: #a9a390; }
.loading-count { margin-top: 6px; font-variant-numeric: tabular-nums; }
.loading-error { margin-top: 8px; color: #ff9a8f; }

.loading-track {
  height: 14px;
  margin-top: 12px;
  border: 2px solid #12161f;
  background: #ded8c4;
}

.loading-bar {
  display: block;
  height: 100%;
  background: #86a86f;
  transition: width 120ms steps(4, end);
}

.loading-retry {
  margin-top: 12px;
  padding: 7px 12px;
  color: #ded8c4;
  border: 2px solid #ded8c4;
  background: #3b5236;
  cursor: pointer;
}
</style>
