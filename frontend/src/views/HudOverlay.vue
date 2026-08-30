<script setup>
/** HUD 心数跟 hpMax（法师 2 / 战士 4 / 游侠 3），不要写死 3 格。 */
defineOptions({ inheritAttrs: false })
defineProps({
  hp: { type: Number, default: 0 },
  hpMax: { type: Number, default: 0 },
  charge: { type: Number, default: 0 },
  chargeMax: { type: Number, default: 0.75 },
  charging: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  expNeed: { type: Number, default: 15 },
  timeText: { type: String, default: '00:00' },
  charName: { type: String, default: '游侠' },
  armor: { type: Number, default: 0 },
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
  <header class="rl-topbar rl-frame--dark">
    <div class="rl-topbar-side">
      <span>{{ charName }}</span>
      <div class="rl-hearts">
        <span
          v-for="(on, i) in hearts(hp, hpMax)"
          :key="i"
          class="rl-heart"
          :class="{ on }"
        />
      </div>
      <span v-if="armor > 0" class="rl-armor">🛡×{{ armor }}</span>
    </div>
    <span class="rl-topbar-time">{{ timeText }}</span>
    <div class="rl-topbar-side" aria-hidden="true"></div>
  </header>
  <footer class="rl-botbar rl-frame--dark">
    <span>Lv.{{ level }}</span>
    <div class="rl-bar grow">
      <i :style="{ width: `${Math.min(100, (exp / Math.max(1, expNeed)) * 100)}%` }" />
    </div>
    <span>{{ exp }}/{{ expNeed }}</span>
    <div class="rl-bar charge">
      <i :style="{ width: `${chargePct(charge, chargeMax)}%` }" />
    </div>
    <span>{{ charging ? '蓄力中' : '就绪' }}</span>
  </footer>
</template>
