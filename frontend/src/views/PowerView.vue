<script setup>
/**
 * P42 批次3（TASK-026 / M6）：power「激发力量」卡牌屏（像素风）。
 * 只做表现与选择：效果本体由 combat / player 侧的 `applyPower(id)` 提供（TASK-027 / TASK-028）。
 * 强制选择：没有跳过/关闭接口，ESC 与设置入口由 GameShell 在本相位屏蔽。
 */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { powerMemoryId } from '../ui/constants.js'
import PixelIcon from './PixelIcon.vue'

const props = defineProps({
  cards: { type: Array, default: () => [] },
})

const emit = defineEmits(['choose'])

/** 像素卡尺寸与漂移参数（R2①：90–140 px/s、正弦 6–10px、卡间 ≥ 一张卡宽）。 */
const CARD_W = 96
const CARD_H = 132
const GAP = CARD_W * 2
const SPEED = 115
const BOB_MIN = 6
const BOB_MAX = 10
const FLIP_SEG_MS = 120
const HOLD_MS = 600
const LEAVE_MS = 220

const stageRef = ref(null)
const cards = reactive([])
const picked = ref('')
const faceUp = ref(false)
const leaving = ref(false)
const phase = ref('drift')

let raf = 0
let lastTs = 0
let elapsed = 0
let flipStart = 0
let holdAt = 0
let leaveAt = 0
let width = 0
let height = 0
let span = 0
let done = false

const memoryId = (id) => powerMemoryId(id)

function measure() {
  const el = stageRef.value
  width = el?.clientWidth || window.innerWidth || 960
  height = el?.clientHeight || window.innerHeight || 540
  // 循环长度 ≥ 一个屏宽 + 两张卡，且不小于整池占位，保证卡序与间距恒定。
  span = Math.max(width + CARD_W * 2, cards.length * GAP, CARD_W * 4)
  for (const c of cards) c.baseY = (height - CARD_H) / 2
}

function build() {
  cards.splice(0, cards.length)
  const n = Math.max(1, props.cards.length)
  props.cards.forEach((c, i) => {
    cards.push({
      id: c.id,
      name: c.name,
      desc: c.desc,
      x: -(CARD_W * 1.5) - i * GAP, // 屏幕左缘外侧，逐张漂入
      y: 0,
      baseY: 0,
      alpha: 1,
      scaleX: 1,
      cx: 0,
      cy: 0,
      dir: i % 2 === 0 ? -1 : 1,
      flipping: false,
      atCenter: false,
      gone: false,
      bobAmp: BOB_MIN + ((BOB_MAX - BOB_MIN) * (i % 3)) / 2,
      bobFreq: 0.7 + 0.13 * i,
      bobPhase: (Math.PI * 2 * i) / n,
    })
  })
  measure()
  for (const c of cards) c.y = c.baseY
}

/** 非选中的卡：向左右边缘加速飘走并淡出，不再可选。 */
function flyAway(c, dt) {
  const dir = c.x + CARD_W / 2 < width / 2 ? -1 : 1
  c.dir = dir
  c.x += dir * 460 * dt
  c.alpha = Math.max(0, c.alpha - dt * 2.4)
  if (c.alpha <= 0) c.gone = true
}

function onCardClick(id) {
  if (done || phase.value !== 'drift') return
  const target = cards.find((c) => c.id === id)
  if (!target) return
  picked.value = id
  phase.value = 'settle'
}

function chosenCard() {
  return cards.find((c) => c.id === picked.value) ?? null
}

/** 停顿 0.6s 后：点击 / 回车 / 空格跳过，随后淡出回对局。 */
function startLeave() {
  if (done || leaving.value) return
  if (phase.value !== 'hold') return
  if (elapsed * 1000 - holdAt < HOLD_MS) return
  leaving.value = true
  leaveAt = elapsed * 1000
}

function onStageClick() {
  startLeave()
}

function onKey(e) {
  if (done) return
  if (phase.value === 'drift') {
    const n = Number(e.key)
    if (Number.isInteger(n) && n >= 1 && n <= cards.length) {
      e.preventDefault()
      onCardClick(cards[n - 1].id)
    }
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    startLeave()
  }
}

function step(ts) {
  raf = requestAnimationFrame(step)
  if (!lastTs) lastTs = ts
  const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000))
  lastTs = ts
  elapsed += dt
  const nowMs = elapsed * 1000

  for (const c of cards) {
    if (c.gone) continue
    if (phase.value === 'drift') {
      c.x += SPEED * dt
      if (c.x > width + CARD_W / 2) c.x -= span // 右缘外侧回到左侧继续，无限循环
    } else if (c.id !== picked.value) {
      flyAway(c, dt)
      continue
    } else if (!c.atCenter) {
      // 被点中的卡：减速移动到屏幕中央。
      const tx = (width - CARD_W) / 2
      const ty = (height - CARD_H) / 2
      const k = Math.min(1, dt * 3.2)
      c.x += (tx - c.x) * k
      c.y += (ty - c.y) * k
      if (Math.abs(tx - c.x) < 0.8 && Math.abs(ty - c.y) < 0.8) {
        c.x = tx
        c.y = ty
        c.cx = tx
        c.cy = ty
        c.atCenter = true
        c.flipping = true
        flipStart = nowMs
        phase.value = 'flip'
      }
      continue
    } else {
      continue
    }
    c.y = c.baseY + Math.sin(elapsed * c.bobFreq * Math.PI * 2 + c.bobPhase) * c.bobAmp
  }

  if (phase.value === 'flip' && nowMs - flipStart >= FLIP_SEG_MS) {
    faceUp.value = true
    if (nowMs - flipStart >= FLIP_SEG_MS * 2) {
      const c = chosenCard()
      if (c) c.flipping = false
      holdAt = nowMs
      phase.value = 'hold'
    }
  }
  if (leaving.value && nowMs - leaveAt >= LEAVE_MS) {
    done = true
    cancelAnimationFrame(raf)
    raf = 0
    emit('choose', picked.value)
  }
}

function cardStyle(c) {
  const style = {
    transform: `translate3d(${c.x}px, ${c.y}px, 0) scaleX(${c.scaleX})`,
    opacity: String(c.alpha),
  }
  if (c.flipping) {
    style['--cx'] = `${c.cx}px`
    style['--cy'] = `${c.cy}px`
  }
  return style
}

onMounted(() => {
  build()
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', measure)
  raf = requestAnimationFrame(step)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <section
    ref="stageRef"
    class="rl-power"
    :class="{ 'is-leaving': leaving }"
    @click="onStageClick"
  >
    <button
      v-for="c in cards"
      :key="c.id"
      class="rl-power-card rl-card rl-frame rl-frame--pop"
      :class="{
        'is-picked': picked === c.id,
        'is-flip': c.flipping,
        'is-locked': phase !== 'drift',
        'is-gone': c.gone,
      }"
      type="button"
      :style="cardStyle(c)"
      @click.stop="onCardClick(c.id)"
    >
      <template v-if="picked === c.id && faceUp">
        <PixelIcon :id="memoryId(c.id)" :scale="3" />
        <strong class="rl-power-name">{{ c.name }}</strong>
        <p class="rl-power-desc">{{ c.desc }}</p>
      </template>
    </button>

    <p class="rl-power-hint">{{ picked ? '点击继续' : '选一张' }}</p>
  </section>
</template>

<style scoped>
/* 全屏像素卡牌屏：复用 .rl-frame / .rl-frame--pop / .rl-card 语言，不新增图片素材。 */
.rl-power {
  pointer-events: auto;
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--rl-mask);
  transition: opacity 220ms steps(2, end);
}

.rl-power.is-leaving {
  opacity: 0;
  pointer-events: none;
}

.rl-power-card {
  pointer-events: auto;
  position: absolute;
  left: 0;
  top: 0;
  width: 96px;
  height: 132px;
  margin: 0;
  padding: var(--rl-s3) var(--rl-s2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--rl-s2);
  will-change: transform;
}

.rl-power-card.is-locked {
  pointer-events: none;
}

.rl-power-card.is-gone {
  display: none;
}

/* 翻转：scaleX 1 → 0 → 1，两段各自跳变（steps(1, end)），不做平滑渐变。 */
.rl-power-card.is-flip {
  animation: rl-power-flip 240ms steps(1, end) both;
}

@keyframes rl-power-flip {
  0% {
    transform: translate3d(var(--cx), var(--cy), 0) scaleX(1);
  }
  50% {
    transform: translate3d(var(--cx), var(--cy), 0) scaleX(0);
  }
  100% {
    transform: translate3d(var(--cx), var(--cy), 0) scaleX(1);
  }
}

.rl-power-name {
  font-size: var(--rl-f2);
  letter-spacing: 2px;
}

.rl-power-desc {
  margin: 0;
  color: var(--rl-paper);
  font-size: var(--rl-f1);
  line-height: 1.4;
}

/* 底部纯像素文字、无文字框：像素字体 + 1px 深色描边。 */
.rl-power-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12%;
  margin: 0;
  text-align: center;
  color: var(--rl-paper);
  font-family: var(--rl-font);
  font-size: var(--rl-f4);
  letter-spacing: 6px;
  text-shadow:
    1px 0 var(--rl-ink),
    -1px 0 var(--rl-ink),
    0 1px var(--rl-ink),
    0 -1px var(--rl-ink);
}
</style>
