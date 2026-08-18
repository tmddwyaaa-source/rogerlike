<script setup>
import { computed, ref, watch } from 'vue'
import { clampLevelBoost, clampSpawnRate, clampVolume, formatVolumePct } from '../ui/settings.js'
import KeyIcon from './KeyIcon.vue'

const props = defineProps({
  settings: { type: Object, required: true },
  boost: { type: Number, default: 0 },
  inMatch: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:settings',
  'back',
  'boost',
  'home',
])

const s = computed(() => props.settings)
const volume = ref(clampVolume(props.settings.volume))

watch(
  () => props.settings.volume,
  (v) => {
    const n = clampVolume(v)
    if (n !== volume.value) volume.value = n
  },
)

const volumePctText = computed(() => formatVolumePct(volume.value))
const confirmingHome = ref(false)

function patch(partial) {
  emit('update:settings', { ...s.value, ...partial })
}

function onVolumeInput(e) {
  const v = clampVolume(e.target.value)
  volume.value = v
  patch({ volume: v })
}

function nudgeSpawn(dir) {
  patch({ spawnRate: clampSpawnRate(s.value.spawnRate + dir * 0.25) })
}

function nudgeBoost(dir) {
  emit('boost', clampLevelBoost(props.boost + dir))
}

function requestHome() {
  if (props.inMatch) {
    confirmingHome.value = true
    return
  }
  emit('home')
}

function cancelHome() {
  confirmingHome.value = false
}

defineExpose({
  cancelHome,
  isConfirmingHome: () => confirmingHome.value,
})
</script>

<template>
  <section class="rl-screen rl-settings">
    <h2 class="rl-h2">设置</h2>

    <div class="rl-panel">
      <h3>操作教程</h3>
      <div class="rl-keys">
        <KeyIcon label="W" caption="上" />
        <KeyIcon label="A" caption="左" />
        <KeyIcon label="S" caption="下" />
        <KeyIcon label="D" caption="右" />
        <KeyIcon label="鼠" caption="瞄准开火" />
      </div>
    </div>

    <div class="rl-panel">
      <label class="rl-slide">
        <span>音量 <strong class="rl-vol-num">{{ volumePctText }}</strong></span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          @input="onVolumeInput"
        />
      </label>
    </div>

    <div class="rl-panel">
      <button
        class="rl-toggle"
        :class="s.testMode ? 'on' : 'off'"
        type="button"
        @click="patch({ testMode: !s.testMode })"
      >
        测试模式：{{ s.testMode ? '打开' : '关闭' }}
      </button>
    </div>

    <div v-if="s.testMode" class="rl-panel test">
      <button
        class="rl-toggle"
        :class="s.godMode ? 'on' : 'off'"
        type="button"
        @click="patch({ godMode: !s.godMode })"
      >
        无敌模式：{{ s.godMode ? '打开' : '关闭' }}
      </button>
      <button
        class="rl-toggle"
        :class="s.infiniteAmmo ? 'on' : 'off'"
        type="button"
        @click="patch({ infiniteAmmo: !s.infiniteAmmo })"
      >
        无限弹药：{{ s.infiniteAmmo ? '打开' : '关闭' }}
      </button>

      <div class="rl-nudge">
        <span>刷怪速度 ×{{ s.spawnRate.toFixed(2) }}</span>
        <div>
          <button type="button" class="rl-btn tiny" @click="nudgeSpawn(-1)">◀</button>
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.25"
            :value="s.spawnRate"
            @input="patch({ spawnRate: clampSpawnRate($event.target.value) })"
          />
          <button type="button" class="rl-btn tiny" @click="nudgeSpawn(1)">▶</button>
        </div>
      </div>

      <div class="rl-nudge">
        <span>提高等级 +{{ boost }}</span>
        <div class="rl-level-btns">
          <button type="button" class="rl-btn tiny" @click="nudgeBoost(-1)">−</button>
          <strong>{{ boost }}</strong>
          <button type="button" class="rl-btn tiny" @click="nudgeBoost(1)">+</button>
        </div>
      </div>
    </div>

    <button class="rl-btn" type="button" @click="emit('back')">返回</button>
    <button class="rl-btn ghost" type="button" @click="requestHome">返回主页</button>

    <div v-if="confirmingHome" class="rl-modal">
      <div class="rl-modal-box">
        <p>返回后本局无法保持，是否退出？</p>
        <div class="rl-actions">
          <button class="rl-btn" type="button" @click="emit('home')">确认</button>
          <button class="rl-btn ghost" type="button" @click="cancelHome">取消</button>
        </div>
      </div>
    </div>
  </section>
</template>
