<script setup>
import { ref } from 'vue'
import { CHARACTERS, DIFFICULTY_ONE, DIFFICULTY_TWO, GAME_TITLE, OBJECTIVE_TEXT, OBJECTIVE_TEXT_TWO, formatCharStats } from '../ui/constants.js'
import RangerPortrait from './RangerPortrait.vue'

const hoverId = ref('')

defineProps({
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
</script>

<template>
  <section class="rl-screen">
    <template v-if="step === 'menu'">
      <h1 class="rl-title">{{ GAME_TITLE }}</h1>
      <p class="rl-sub">像素幸存者</p>
      <div class="rl-menu-actions">
        <button class="rl-btn rl-glyph-btn" type="button" @click="emit('play')">开始游戏</button>
        <button class="rl-btn rl-glyph-btn" type="button" @click="emit('settings')">设置</button>
        <button class="rl-btn rl-glyph-btn" type="button" @click="emit('exit')">退出游戏</button>
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
