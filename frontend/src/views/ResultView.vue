<script setup>
defineProps({
  result: { type: Object, default: null },
  status: { type: String, default: '' },
  error: { type: String, default: '' },
  posting: { type: Boolean, default: false },
})
const emit = defineEmits(['again', 'retry', 'home'])
</script>

<template>
  <section class="rl-screen">
    <div class="rl-result rl-frame rl-frame--pop">
      <h2>{{ result?.title || (result?.win ? '恭喜你幸存下来了' : '本局结束') }}</h2>
      <dl>
        <dt>存活</dt>
        <dd>{{ Math.floor(result?.survivedSec || 0) }} 秒</dd>
        <dt>击杀</dt>
        <dd>{{ result?.kills ?? 0 }}</dd>
        <dt>等级</dt>
        <dd>{{ result?.level ?? 1 }}</dd>
      </dl>
      <p class="rl-msg" :class="{ ok: status, err: error }">
        {{ error || status }}
      </p>
      <div class="rl-actions">
        <button class="rl-btn" type="button" @click="emit('again')">再玩一把</button>
        <button class="rl-btn ghost" type="button" @click="emit('home')">退出到主页</button>
        <button
          v-if="error"
          class="rl-btn ghost"
          type="button"
          :disabled="posting"
          @click="emit('retry')"
        >
          重试上报
        </button>
      </div>
    </div>
  </section>
</template>
