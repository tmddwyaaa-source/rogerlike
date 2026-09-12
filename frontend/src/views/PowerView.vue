<script setup>
/**
 * P42 批次3（TASK-026 / M6）：power「激发力量」卡牌屏（像素风）。
 * P42 批次5（TASK-036 / M6）：卡牌放大到 120×160、左右两侧同时漂入、出牌提速到 180 px/s。
 * 只做表现与选择：效果本体由 combat / player 侧的 `applyPower(id)` 提供（TASK-027 / TASK-028）。
 * 强制选择：没有跳过/关闭接口，ESC 与设置入口由 GameShell 在本相位屏蔽。
 */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  POWER_CARD_BOB_MAX,
  POWER_CARD_BOB_MIN,
  POWER_CARD_GAP,
  POWER_CARD_H,
  POWER_CARD_SPEED,
  POWER_CARD_W,
  powerCardSide,
  powerCardStartX,
  powerMemoryId,
} from '../ui/constants.js'
import PixelIcon from './PixelIcon.vue'

const props = defineProps({
  cards: { type: Array, default: () => [] },
})

const emit = defineEmits(['choose'])

/** 尺寸 / 漂速 / 卡距都取 ui/constants.js（R3：放大、提速、卡间 ≥ 一张卡宽、正弦 6–10px）。 */
const CARD_W = POWER_CARD_W
const CARD_H = POWER_CARD_H
const GAP = POWER_CARD_GAP
const SPEED = POWER_CARD_SPEED
const BOB_MIN = POWER_CARD_BOB_MIN
const BOB_MAX = POWER_CARD_BOB_MAX
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
  // 先量屏幕（入场 x 依赖 width），再铺牌，最后算 span / baseY。
  const el = stageRef.value
  width = el?.clientWidth || window.innerWidth || 960
  height = el?.clientHeight || window.innerHeight || 540
  cards.splice(0, cards.length)
  const n = Math.max(1, props.cards.length)
  props.cards.forEach((c, i) => {
    // R3②：偶数张左右各一半、奇数张左侧多一张；两侧各自按名次错开一个卡距。
    const fromLeft = powerCardSide(i, n) === 'left'
    cards.push({
      id: c.id,
      name: c.name,
      desc: c.desc,
      x: powerCardStartX(i, n, width),
      y: 0,
      baseY: 0,
      alpha: 1,
      scaleX: 1,
      cx: 0,
      cy: 0,
      dir: fromLeft ? 1 : -1,
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

/** 非选中的卡：沿各自方向加速飘向最近一侧边缘并淡出，不再可选。 */
function flyAway(c, dt) {
  c.x += c.dir * 460 * dt
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
      // 左右两侧各按自身方向漂移，出屏后从另一侧回来继续，无限循环。
      c.x += c.dir * SPEED * dt
      if (c.dir > 0 && c.x > width + CARD_W / 2) c.x -= span
      else if (c.dir < 0 && c.x < -(CARD_W * 1.5)) c.x += span
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

/** 卡尺寸从常量下发到 scoped CSS（单一来源）。 */
const stageStyle = {
  '--rl-power-card-w': `${CARD_W}px`,
  '--rl-power-card-h': `${CARD_H}px`,
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
    :style="stageStyle"
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
  /* R3①：尺寸唯一来源是 ui/constants.js 的 POWER_CARD_W/H（不在这里写死第二份数字）。 */
  width: var(--rl-power-card-w);
  height: var(--rl-power-card-h);
  margin: 0;
  padding: var(--rl-s2);
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

/* R3④：靠缩短文案让文字完整落在卡内，不缩字号硬塞。 */
.rl-power-desc {
  margin: 0;
  color: var(--rl-paper);
  font-size: var(--rl-f1);
  line-height: 1.4;
  text-align: center;
  word-break: break-word;
  overflow-wrap: anywhere;
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
