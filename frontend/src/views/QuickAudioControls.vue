<script setup>
defineProps({
  bgmMuted: Boolean,
  sfxMuted: Boolean,
})

const emit = defineEmits(['toggle-bgm', 'toggle-sfx'])
</script>

<template>
  <div class="rl-quick-audio" aria-label="音频快捷控制">
    <button
      class="rl-quick-audio-btn"
      :class="{ muted: bgmMuted }"
      type="button"
      data-audio-toggle="bgm"
      :aria-pressed="bgmMuted"
      :title="bgmMuted ? '恢复背景音乐' : '静音背景音乐'"
      @click="emit('toggle-bgm')"
    >
      <img src="/assets/ui/bgm-toggle.png" alt="" aria-hidden="true" />
      <span v-if="bgmMuted" class="slash" aria-hidden="true"></span>
      <span class="sr-only">{{ bgmMuted ? '背景音乐已静音' : '背景音乐已开启' }}</span>
    </button>
    <button
      class="rl-quick-audio-btn"
      :class="{ muted: sfxMuted }"
      type="button"
      data-audio-toggle="sfx"
      :aria-pressed="sfxMuted"
      :title="sfxMuted ? '恢复音效' : '静音音效'"
      @click="emit('toggle-sfx')"
    >
      <img src="/assets/ui/sfx-toggle.png" alt="" aria-hidden="true" />
      <span v-if="sfxMuted" class="slash" aria-hidden="true"></span>
      <span class="sr-only">{{ sfxMuted ? '音效已静音' : '音效已开启' }}</span>
    </button>
  </div>
</template>

<style scoped>
.rl-quick-audio {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rl-quick-audio-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 3px solid var(--rl-ink);
  background: var(--rl-bg);
  box-shadow: 2px 2px 0 var(--rl-shadow);
  cursor: pointer;
}

.rl-quick-audio-btn:hover,
.rl-quick-audio-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--rl-shadow);
}

.rl-quick-audio-btn:focus-visible {
  outline: 3px solid var(--rl-paper);
  outline-offset: 2px;
}

.rl-quick-audio-btn img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  image-rendering: pixelated;
}

.rl-quick-audio-btn.muted img {
  filter: brightness(0.48) saturate(0.35);
}

.slash {
  position: absolute;
  width: 34px;
  height: 4px;
  background: var(--rl-danger);
  border: 1px solid var(--rl-ink);
  transform: rotate(-45deg);
  box-shadow: 0 0 0 1px var(--rl-bg);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
