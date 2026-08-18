<script setup>
import PixelIcon from './PixelIcon.vue'

defineProps({
  choices: { type: Array, default: () => [] },
})

const emit = defineEmits(['choose'])
</script>

<template>
  <section class="rl-upgrade">
    <h2>升级</h2>
    <div class="rl-cards">
      <button
        v-for="item in choices"
        :key="item.id"
        class="rl-card"
        type="button"
        @click="emit('choose', item.id)"
      >
        <PixelIcon :id="item.id" :scale="4" :advanced="item.tier === 'advanced'" />
        <strong>{{ item.title }}</strong>
        <p>{{ item.desc }}</p>
      </button>
    </div>
  </section>
</template>
