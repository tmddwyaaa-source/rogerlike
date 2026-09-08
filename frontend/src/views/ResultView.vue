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
        <button class="rl-btn rl-glyph-btn" type="button" @click="emit('again')">再玩一把</button>
        <button class="rl-btn rl-glyph-btn ghost" type="button" @click="emit('home')">退出到主页</button>
        <button
          v-if="error"
          class="rl-btn rl-glyph-btn ghost"
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

<style scoped>
/* M3 / TASK-009：P35 草地上的紧凑结果区（只改视觉）。
   保留 .rl-result / .rl-frame / .rl-frame--pop 与 dl 三项、.rl-msg、三按钮行为不变；
   胜负只用现有文本与克制色差，不引入新概念。 */

.rl-screen {
  background: var(--rl-screen);
  color: var(--rl-ink);
}

.rl-screen .rl-result {
  border: 1px solid var(--rl-ink);
  background: var(--rl-panel);
  box-shadow: none;
  color: var(--rl-ink);
}

.rl-screen .rl-result h2 {
  color: var(--rl-ink);
}

.rl-screen .rl-result dt {
  color: var(--rl-sub);
}

.rl-screen .rl-result dd {
  color: var(--rl-ink);
  font-weight: bold;
}

/* 上报状态：成功=副文字绿，失败=既有红（克制色差） */
.rl-screen .rl-msg {
  color: var(--rl-sub);
}

.rl-screen .rl-msg.ok {
  color: var(--rl-sub);
}

.rl-screen .rl-msg.err {
  color: var(--rl-red);
}

/* 按钮：边、硬阴影、hover 位移交回全局控件语言；
   主按钮（非 ghost）保留 hover 左侧像素箭头提示。 */
.rl-screen .rl-actions .rl-btn:not(.ghost) {
  position: relative;
  padding-left: var(--rl-s5);
}

.rl-screen .rl-actions .rl-btn:not(.ghost):hover::before,
.rl-screen .rl-actions .rl-btn:not(.ghost):focus-visible::before {
  content: "";
  position: absolute;
  left: var(--rl-s2);
  top: 50%;
  width: 4px;
  height: 4px;
  margin-top: -2px;
  background: var(--rl-ink);
}
</style>
