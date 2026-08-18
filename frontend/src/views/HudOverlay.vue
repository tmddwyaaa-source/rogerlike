<script setup>
defineOptions({ inheritAttrs: false })
defineProps({
  hp: { type: Number, default: 3 },
  hpMax: { type: Number, default: 3 },
  charge: { type: Number, default: 0 },
  chargeMax: { type: Number, default: 0.75 },
  charging: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  expNeed: { type: Number, default: 15 },
  timeText: { type: String, default: '00:00' },
  charName: { type: String, default: '游侠' },
})

function hearts(hp, hpMax) {
  const n = Math.max(0, hpMax | 0)
  return Array.from({ length: n }, (_, i) => i < hp)
}

function chargePct(charge, chargeMax) {
  const max = Math.max(0.0001, Number(chargeMax) || 0.75)
  return Math.min(100, Math.max(0, (Number(charge) / max) * 100))
}
</script>

<template>
  <aside class="rl-hud">
    <div class="rl-row names">
      <span>{{ charName }}</span>
    </div>
    <div class="rl-hearts">
      <span
        v-for="(on, i) in hearts(hp, hpMax)"
        :key="i"
        class="rl-heart"
        :class="{ on }"
      />
    </div>
    <div class="rl-row">
      <span>蓄力</span>
      <span>{{ charging ? '蓄力中' : '就绪' }}</span>
    </div>
    <div class="rl-bar charge">
      <i :style="{ width: `${chargePct(charge, chargeMax)}%` }" />
    </div>
    <div class="rl-row">
      <span>Lv.{{ level }}</span>
      <span>{{ exp }}/{{ expNeed }}</span>
    </div>
    <div class="rl-bar">
      <i :style="{ width: `${Math.min(100, (exp / Math.max(1, expNeed)) * 100)}%` }" />
    </div>
    <div class="rl-row">
      <span>存活</span>
      <span>{{ timeText }}</span>
    </div>
  </aside>
</template>
