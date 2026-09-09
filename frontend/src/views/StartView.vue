<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { CHARACTERS, DIFFICULTY_ONE, DIFFICULTY_TWO, GAME_TITLE, OBJECTIVE_TEXT, OBJECTIVE_TEXT_TWO, formatCharStats } from '../ui/constants.js'
import { assetUrl } from '../assetUrl.js'
import RangerPortrait from './RangerPortrait.vue'

const hoverId = ref('')

const props = defineProps({
  step: { type: String, default: 'menu' },
})

const emit = defineEmits([
  'play',
  'settings',
  'exit',
  'pick-char',
  'pick-diff',
  'back',
])

const titleChars = [...GAME_TITLE]
const runners = [
  { id: 'ranger', name: '游侠', src: assetUrl('assets/characters/1/S_Walk.png') },
  { id: 'warrior', name: '战士', src: assetUrl('assets/characters/2/S_Walk.png') },
  { id: 'mage', name: '法师', src: assetUrl('assets/characters/3/S_Walk.png') },
]
const runnerIndex = ref(0)
const runnerVisible = ref(false)
const activeRunner = computed(() => runners[runnerIndex.value])

const RUN_DURATION = 5200
const RUNNER_GAP = 3000
let runnerTimer = null

function clearRunnerTimer() {
  if (runnerTimer !== null) {
    clearTimeout(runnerTimer)
    runnerTimer = null
  }
}

function runNextCharacter() {
  runnerVisible.value = true
  runnerTimer = setTimeout(() => {
    runnerVisible.value = false
    runnerTimer = setTimeout(() => {
      runnerIndex.value = (runnerIndex.value + 1) % runners.length
      runNextCharacter()
    }, RUNNER_GAP)
  }, RUN_DURATION)
}

function resetRunner() {
  clearRunnerTimer()
  runnerIndex.value = 0
  if (props.step === 'menu') runNextCharacter()
  else runnerVisible.value = false
}

watch(() => props.step, resetRunner, { immediate: true })
onUnmounted(clearRunnerTimer)
</script>

<template>
  <section class="rl-screen">
    <template v-if="step === 'menu'">
      <h1 class="rl-title" :aria-label="GAME_TITLE">
        <span
          v-for="(glyph, index) in titleChars"
          :key="`${glyph}-${index}`"
          class="rl-title-char"
          :style="{ animationDelay: `${index * -90}ms` }"
        >{{ glyph }}</span>
      </h1>
      <p class="rl-sub">像素幸存者</p>
      <div class="rl-menu-actions">
        <button class="rl-btn rl-glyph-btn" type="button" @click="emit('play')">开始游戏</button>
        <button class="rl-btn rl-glyph-btn" type="button" @click="emit('settings')">设置</button>
        <button class="rl-btn rl-glyph-btn" type="button" @click="emit('exit')">退出游戏</button>
        <div class="rl-runway" aria-label="角色跑道">
          <div
            v-if="runnerVisible"
            :key="activeRunner.id"
            class="rl-runner"
            role="img"
            :aria-label="`${activeRunner.name}跑过跑道`"
            :style="{ backgroundImage: `url(${activeRunner.src})` }"
          ></div>
        </div>
      </div>
    </template>

    <template v-else-if="step === 'char'">
      <h2 class="rl-h2">选择角色</h2>
      <div class="rl-pick-row">
        <button
          v-for="ch in CHARACTERS"
          :key="ch.id"
          class="rl-pick on rl-frame rl-opt"
          type="button"
          @mouseenter="hoverId = ch.id"
          @mouseleave="hoverId = ''"
          @click="emit('pick-char', ch.id)"
        >
          <div class="rl-avatar ranger">
            <RangerPortrait :src="ch.idleSrc" :animate="hoverId === ch.id" />
            <img class="rl-avatar-shadow" src="/assets/characters/Other/Shadow.png" alt="" />
          </div>
          <span class="rl-pick-name">{{ ch.name }}</span>
          <span class="rl-char-tip">{{ formatCharStats(ch) }}</span>
        </button>
      </div>
      <button class="rl-btn ghost" type="button" @click="emit('back', 'menu')">返回</button>
    </template>

    <template v-else-if="step === 'difficulty'">
      <h2 class="rl-h2">选择难度</h2>
      <div class="rl-pick-row">
        <button class="rl-btn rl-frame rl-diff-pick rl-opt" type="button" @click="emit('pick-diff', DIFFICULTY_ONE.id)">
          {{ DIFFICULTY_ONE.name }}
          <span class="rl-char-tip">{{ OBJECTIVE_TEXT }}</span>
        </button>
        <button class="rl-btn rl-frame rl-diff-pick rl-opt" type="button" @click="emit('pick-diff', DIFFICULTY_TWO.id)">
          {{ DIFFICULTY_TWO.name }}
          <span class="rl-char-tip">{{ OBJECTIVE_TEXT_TWO }}</span>
        </button>
      </div>
      <button class="rl-btn ghost" type="button" @click="emit('back', 'char')">返回</button>
    </template>
  </section>
</template>

<style scoped>
.rl-title-char {
  display: inline-block;
  animation: rl-title-jitter 720ms steps(2, end) infinite alternate;
}

.rl-runway {
  position: relative;
  width: min(360px, 82vw);
  height: 72px;
  overflow: hidden;
  background: var(--rl-screen);
}

.rl-runner {
  position: absolute;
  top: 0;
  left: -64px;
  width: 64px;
  height: 64px;
  background-repeat: no-repeat;
  background-size: 384px 64px;
  image-rendering: pixelated;
  transform: scaleX(-1);
  animation:
    rl-runner-cross 5200ms linear forwards,
    rl-runner-frames 500ms steps(6, end) infinite;
}

@keyframes rl-title-jitter {
  0% { transform: translate(0, 0); }
  50% { transform: translate(1px, -1px); }
  100% { transform: translate(-1px, 1px); }
}

@keyframes rl-runner-cross {
  from { left: -64px; }
  to { left: calc(100% + 4px); }
}

@keyframes rl-runner-frames {
  from { background-position: 0 0; }
  to { background-position: -384px 0; }
}
</style>
