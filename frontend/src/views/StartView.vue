<script setup>
import { CHAR_NAME, DIFFICULTY_ONE, GAME_TITLE } from '../ui/constants.js'
import RangerPortrait from './RangerPortrait.vue'

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
      <button class="rl-btn" type="button" @click="emit('play')">开始游戏</button>
      <button class="rl-btn" type="button" @click="emit('settings')">设置</button>
      <button class="rl-btn" type="button" @click="emit('exit')">退出游戏</button>
    </template>

    <template v-else-if="step === 'char'">
      <h2 class="rl-h2">选择角色</h2>
      <div class="rl-pick-row">
        <button class="rl-pick on" type="button" @click="emit('pick-char', 'ranger')">
          <div class="rl-avatar ranger">
            <RangerPortrait />
          </div>
          <span>{{ CHAR_NAME }}</span>
        </button>
        <button class="rl-pick locked" type="button" disabled>
          <div class="rl-avatar q">?</div>
          <span>敬请期待</span>
        </button>
        <button class="rl-pick locked" type="button" disabled>
          <div class="rl-avatar q">?</div>
          <span>敬请期待</span>
        </button>
      </div>
      <button class="rl-btn ghost" type="button" @click="emit('back', 'menu')">返回</button>
    </template>

    <template v-else-if="step === 'difficulty'">
      <h2 class="rl-h2">选择难度</h2>
      <button class="rl-btn" type="button" @click="emit('pick-diff', DIFFICULTY_ONE.id)">
        {{ DIFFICULTY_ONE.name }}
      </button>
      <button class="rl-btn ghost" type="button" @click="emit('back', 'char')">返回</button>
    </template>
  </section>
</template>
