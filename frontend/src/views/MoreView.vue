<script setup>
import { computed, ref } from 'vue'
import { upgradeById } from '../ui/constants.js'
import { loadMemories, summarizePicked } from '../ui/memories.js'
import HudOverlay from './HudOverlay.vue'
import PixelIcon from './PixelIcon.vue'

const emit = defineEmits(['back'])

const step = ref('more')
const memories = ref(loadMemories())
const current = ref(null)

const list = computed(() => memories.value)
const pickedIcons = computed(() => summarizePicked(current.value?.upgrades))

function descFor(id) {
  return upgradeById(id)?.desc || ''
}

function openMemories() {
  memories.value = loadMemories()
  step.value = 'list'
}

function openDetail(item) {
  current.value = item
  step.value = 'detail'
}

function onBack() {
  if (step.value === 'detail') {
    current.value = null
    step.value = 'list'
    return
  }
  if (step.value === 'list') {
    step.value = 'more'
    return
  }
  emit('back')
}

defineExpose({
  isRoot: () => step.value === 'more',
  goRoot() {
    step.value = 'more'
    current.value = null
  },
})
</script>

<template>
  <section class="rl-screen rl-more">
    <template v-if="step === 'more'">
      <h2 class="rl-h2">……</h2>
      <button class="rl-btn" type="button" @click="openMemories">回忆</button>
      <button class="rl-btn ghost" type="button" @click="emit('back')">返回</button>
    </template>

    <template v-else-if="step === 'list'">
      <h2 class="rl-h2">回忆</h2>
      <p v-if="!list.length" class="rl-sub">还没有对局记录</p>
      <div v-else class="rl-mem-list">
        <button
          v-for="item in list"
          :key="item.id"
          class="rl-mem-item"
          type="button"
          @click="openDetail(item)"
        >
          <strong>{{ item.win ? '幸存' : '结束' }} · {{ item.timeText }}</strong>
          <span>Lv.{{ item.level }}　{{ item.exp }}/{{ item.expNeed }}</span>
        </button>
      </div>
      <button class="rl-btn ghost" type="button" @click="onBack">返回</button>
    </template>

    <template v-else-if="step === 'detail' && current">
      <h2 class="rl-h2">对局</h2>
      <div class="rl-mem-detail">
        <HudOverlay v-bind="current" />
        <div class="rl-panel">
          <h3>升级选项</h3>
          <p v-if="!pickedIcons.length" class="rl-sub">本局未选择升级</p>
          <div v-else class="rl-mem-icons">
            <div
              v-for="u in pickedIcons"
              :key="u.id"
              class="rl-mem-icon"
              :title="descFor(u.id)"
            >
              <PixelIcon :id="u.id" :scale="3" />
              <span class="rl-mem-mult">×{{ u.count }}</span>
              <span class="rl-mem-tip">{{ descFor(u.id) }}</span>
            </div>
          </div>
        </div>
      </div>
      <button class="rl-btn ghost" type="button" @click="onBack">返回</button>
    </template>
  </section>
</template>
