<script setup>
import { computed, ref } from 'vue'
import { descFor, charById, BOND_DESC, bondTiers, formatCharStats } from '../ui/constants.js'
import { listActiveBonds } from '../ui/session.js'
import { loadMemories, summarizePicked } from '../ui/memories.js'
import PixelIcon from './PixelIcon.vue'
import RangerPortrait from './RangerPortrait.vue'

defineProps({
  charId: { type: String, default: 'ranger' },
})

const emit = defineEmits(['back'])

const step = ref('more')
const memories = ref(loadMemories())
const current = ref(null)

const list = computed(() => memories.value)
const pickedIcons = computed(() => summarizePicked(current.value?.upgrades))
/** 回忆对局角色：优先本局记录 charId，缺失兜底默认游侠。 */
const memCharId = computed(() => current.value?.charId || 'ranger')
const memIdleSrc = computed(() => charById(memCharId.value)?.idleSrc || '')
const hoverPortrait = ref(false)
const bondsListen = computed(() => listActiveBonds(current.value?.upgrades || []))

function hearts(hp, hpMax) {
  const n = Math.max(0, hpMax | 0)
  return Array.from({ length: n }, (_, i) => i < hp)
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
      <button class="rl-btn rl-glyph-btn" type="button" @click="openMemories">回忆</button>
      <button class="rl-btn rl-glyph-btn ghost" type="button" @click="emit('back')">返回</button>
    </template>

    <template v-else-if="step === 'list'">
      <h2 class="rl-h2">回忆</h2>
      <p v-if="!list.length" class="rl-sub">还没有对局记录</p>
      <div v-else class="rl-mem-list">
        <button
          v-for="item in list"
          :key="item.id"
          class="rl-mem-item rl-action-row"
          type="button"
          @click="openDetail(item)"
        >
          <strong>{{ item.win ? '幸存' : '结束' }} · {{ item.timeText }}</strong>
          <span>Lv.{{ item.level }}　{{ item.exp }}/{{ item.expNeed }}</span>
        </button>
      </div>
      <button class="rl-btn rl-glyph-btn ghost" type="button" @click="onBack">返回</button>
    </template>

    <template v-else-if="step === 'detail' && current">
      <h2 class="rl-h2">对局</h2>
      <div class="rl-mem-detail">
        <div class="rl-mem-hero">
          <div
            class="rl-mem-portrait"
            @mouseenter="hoverPortrait = true"
            @mouseleave="hoverPortrait = false"
          >
            <RangerPortrait v-if="memIdleSrc" :src="memIdleSrc" :animate="hoverPortrait" />
            <img v-if="memIdleSrc" class="rl-mem-shadow" src="/assets/characters/Other/Shadow.png" alt="" />
            <span class="rl-mem-char-tip">{{ formatCharStats(charById(memCharId)) }}</span>
          </div>
          <div class="rl-mem-hero-body">
            <div class="rl-mem-hero-top">
              <strong>{{ current.win ? '幸存' : '结束' }}</strong>
              <span class="rl-mem-lv">Lv.{{ current.level ?? 1 }}</span>
            </div>
          </div>
        </div>
        <div class="rl-mem-attrs">
          <span class="rl-hearts">
            <span
              v-for="(on, i) in hearts(current.hp, current.hpMax)"
              :key="i"
              class="rl-heart"
              :class="{ on }"
            />
          </span>
          <span>经验 {{ current.exp ?? 0 }}/{{ current.expNeed ?? 0 }}</span>
          <span>存活 {{ current.timeText }}</span>
          <span>击杀 {{ current.kills ?? 0 }}</span>
        </div>
        <div class="rl-mem-cols">
          <div class="rl-panel rl-frame">
            <h3>升级选项</h3>
            <p v-if="!pickedIcons.length" class="rl-sub">本局未选择升级</p>
            <div v-else class="rl-mem-icons">
              <div
                v-for="u in pickedIcons"
                :key="u.id"
                class="rl-mem-icon"
                :title="descFor(u.id, memCharId)"
              >
                <PixelIcon :id="u.id" :scale="3" />
                <span class="rl-mem-mult">×{{ u.count }}</span>
                <span class="rl-mem-tip">{{ descFor(u.id, memCharId) }}</span>
              </div>
            </div>
          </div>
          <div class="rl-mem-bond-rail">
            <p v-if="!bondsListen.length" class="rl-sub">暂未激活羁绊</p>
            <span v-for="b in bondsListen" :key="b.id" class="rl-bond">
              {{ b.title }} {{ b.rank }}
              <span class="rl-bond-tip">
                <strong>{{ BOND_DESC[b.id] }}</strong>
                <span
                  v-for="t in bondTiers(b.id)"
                  :key="t.rank"
                  class="rl-bond-tier"
                  :class="{ reached: t.rank <= b.rank }"
                >档 {{ t.rank }} · {{ t.text }}</span>
              </span>
            </span>
          </div>
        </div>
      </div>
      <button class="rl-btn rl-glyph-btn ghost" type="button" @click="onBack">返回</button>
    </template>
  </section>
</template>

<style scoped>
/* M3 / TASK-009：P35 轻量浅色容器（只改视觉）。
   布局关系不变：升级选项 ≥60% 与羁绊裸 chip 竖排仍由 pixel.css 的 .rl-mem-cols 负责，
   此处不声明 flex / width，也不新增独立大框。 */

.rl-screen.rl-more {
  background: var(--rl-screen);
  color: var(--rl-ink);
}

.rl-more .rl-h2 {
  color: var(--rl-ink);
}

.rl-more .rl-sub {
  color: var(--rl-sub);
}

/* 对局列表：可点击行语言交回全局 .rl-action-row（3px 墨边 + 硬阴影 +
   hover 左侧像素箭头 + 下压 1px，填充不变）；这里只留次要文字的色阶。 */
.rl-more .rl-mem-item span {
  color: var(--rl-sub);
}

/* 升级选项面板：黄绿战利品框（不声明 flex / width，保留 62% 布局关系） */
.rl-more .rl-panel {
  border: 3px solid var(--rl-ink);
  background: var(--rl-panel);
  box-shadow: inset 0 0 0 2px var(--rl-lock);
  color: var(--rl-ink);
}

.rl-more .rl-panel h3 {
  color: var(--rl-sub);
  letter-spacing: 1px;
}

/* 方案 1：角色结算是唯一的深苔绿主框，双层像素边明确主次。 */
.rl-more .rl-mem-hero {
  background: var(--rl-panel-deep);
  border: 3px solid var(--rl-ink);
  box-shadow: inset 0 0 0 2px var(--rl-lock);
  color: var(--rl-paper);
}

.rl-more .rl-mem-lv {
  color: var(--rl-btn);
}

.rl-more .rl-mem-attrs {
  color: var(--rl-paper);
}

.rl-more .rl-mem-mult {
  color: var(--rl-ink);
}

/* 羁绊 chip：更深苔绿底，和升级图区区分但不新增独立大框。 */
.rl-more .rl-bond {
  border: 2px solid var(--rl-ink);
  background: var(--rl-panel-deep);
  box-shadow: inset 0 0 0 1px var(--rl-lock);
  color: var(--rl-paper);
}
</style>
