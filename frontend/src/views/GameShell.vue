<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { createMatchUi, getSharedBgm } from '../ui/index.js'
import '../ui/pixel.css'
import HudOverlay from './HudOverlay.vue'
import MoreView from './MoreView.vue'
import ResultView from './ResultView.vue'
import SettingsView from './SettingsView.vue'
import StartView from './StartView.vue'
import UpgradeView from './UpgradeView.vue'

const emit = defineEmits(['start', 'again', 'home'])

const ui = createMatchUi()
const settings = reactive(ui.settings)
const bgm = getSharedBgm()
const hud = reactive(ui.snapshot())
const menuStep = ref('menu')
const bindCtx = { player: null, combat: null, env: null, companions: null }
const posting = ref(false)
const postStatus = ref('')
const postError = ref('')
const exited = ref(false)
const settingsDraftBoost = ref(0)
const settingsRef = ref(null)
const moreRef = ref(null)

function syncHud() {
  Object.assign(hud, ui.snapshot(bindCtx.player, bindCtx.combat))
}

function bind(ctx = {}) {
  bindCtx.player = ctx.player ?? null
  bindCtx.combat = ctx.combat ?? null
  bindCtx.env = ctx.env ?? null
  bindCtx.companions = ctx.companions ?? null
  syncHud()
}

function tick(dt) {
  const won = ui.tick(dt)
  syncHud()
  if (won) void submitNow()
}

function notifyKill() {
  ui.addKill()
  syncHud()
}

function notifyExp(n = 1) {
  const gained = ui.addExp(n, bindCtx)
  syncHud()
  return gained
}

function onPlay() {
  menuStep.value = 'char'
  ui.session.setPhase('char')
  syncHud()
}

function onPickChar() {
  menuStep.value = 'difficulty'
  ui.session.setPhase('difficulty')
  syncHud()
}

async function onPickDiff(difficulty) {
  ui.start(difficulty)
  menuStep.value = 'menu'
  postStatus.value = ''
  postError.value = ''
  syncHud()
  emit('start', { difficulty, ui, settings })
  try {
    await ui.beginRemote()
  } catch {
    ui.session.matchId = null
  }
}

function onBack(step) {
  menuStep.value = step
  ui.session.setPhase(step === 'menu' ? 'menu' : step)
  syncHud()
}

function openSettingsFromMenu() {
  settingsDraftBoost.value = 0
  ui.session.pause('menu')
  syncHud()
}

function openMore() {
  const from = ui.session.phase
  if (from === 'more' || from === 'settings') return
  ui.session.pause(from, 'more')
  syncHud()
}

function closeMore() {
  const next = ui.session.resume()
  if (next === 'menu' || next === 'char' || next === 'difficulty') {
    menuStep.value = next === 'menu' ? 'menu' : next
  }
  syncHud()
}

function inLiveMatch(p) {
  return p === 'playing' || p === 'upgrade' || p === 'levelup'
}

function openPauseSettings() {
  const from = ui.session.phase
  if (!inLiveMatch(from)) return
  settingsDraftBoost.value = 0
  ui.session.pause(from)
  syncHud()
}

function onSettingsUpdate(next) {
  Object.assign(settings, next)
  ui.persistSettings()
  bgm.setVolume(settings.volume)
}

function onSettingsBoost(n) {
  settingsDraftBoost.value = n
}

function closeSettings() {
  const inMatch = inLiveMatch(ui.session.resumePhase)
  const n = settingsDraftBoost.value
  const next = ui.session.resume()
  if (next === 'menu' || next === 'char' || next === 'difficulty') {
    menuStep.value = next === 'menu' ? 'menu' : next
  }
  if (inMatch && n > 0) {
    const k = ui.session.boostLevels(n, bindCtx)
    if (k > 0) bindCtx.player?.queueLevelUpFx?.(k)
  }
  settingsDraftBoost.value = 0
  syncHud()
}

function onSettingsHome() {
  const from = ui.session.resumePhase
  if (from === 'playing' || from === 'upgrade' || from === 'levelup') {
    ui.session.recordMemory(bindCtx)
  }
  ui.session.reset()
  menuStep.value = 'menu'
  postStatus.value = ''
  postError.value = ''
  syncHud()
  emit('home')
}

function onExit() {
  exited.value = true
  ui.session.setPhase('menu')
}

function onChoose(id) {
  ui.applyChoice(id, bindCtx)
  syncHud()
}

async function submitNow() {
  posting.value = true
  postError.value = ''
  postStatus.value = ''
  try {
    const rec = await ui.submit()
    const id = rec?.id ?? rec?.data?.id
    postStatus.value = id != null ? `已入库 #${id}` : '上报成功'
  } catch (e) {
    postError.value = e?.message ? `上报失败：${e.message}` : '上报失败'
  } finally {
    posting.value = false
  }
}

async function notifyDead() {
  ui.finish(bindCtx)
  syncHud()
  await submitNow()
}

function onAgain() {
  ui.session.reset()
  menuStep.value = 'char'
  ui.session.setPhase('char')
  postStatus.value = ''
  postError.value = ''
  syncHud()
  emit('again')
}

function onHome() {
  ui.session.reset()
  menuStep.value = 'menu'
  postStatus.value = ''
  postError.value = ''
  syncHud()
  emit('home')
}

function onEsc(e) {
  if (e.key !== 'Escape') return
  e.preventDefault()
  if (settingsRef.value?.isConfirmingHome?.()) {
    settingsRef.value.cancelHome()
    return
  }
  const phase = ui.session.phase
  if (phase === 'more') {
    if (moreRef.value && !moreRef.value.isRoot?.()) {
      moreRef.value.goRoot()
      return
    }
    closeMore()
    return
  }
  if (phase === 'settings') {
    closeSettings()
    return
  }
  if (inLiveMatch(phase)) {
    openPauseSettings()
  }
}

watch(settings, () => ui.persistSettings(), { deep: true })
watch(
  () => settings.volume,
  (v) => bgm.setVolume(v),
)

function tryPlayBgm() {
  bgm.setVolume(settings.volume)
  bgm.play()
}

onMounted(() => {
  window.addEventListener('keydown', onEsc)
  tryPlayBgm()
  window.addEventListener('pointerdown', tryPlayBgm, { once: true })
})
onUnmounted(() => {
  window.removeEventListener('keydown', onEsc)
})

defineExpose({
  ui,
  bind,
  tick,
  syncHud,
  notifyKill,
  notifyExp,
  notifyDead,
  getSettings: () => settings,
})
</script>

<template>
  <div class="rl-root">
    <slot />

    <button
      v-if="inLiveMatch(hud.phase)"
      class="rl-gear"
      type="button"
      aria-label="设置"
      title="设置（Esc）"
      @click="openPauseSettings"
    >
      ⚙
    </button>

    <button
      v-if="
        inLiveMatch(hud.phase) ||
        hud.phase === 'menu' ||
        hud.phase === 'char' ||
        hud.phase === 'difficulty' ||
        hud.phase === 'result' ||
        hud.phase === 'victory'
      "
      class="rl-ellipsis"
      type="button"
      aria-label="更多"
      title="……"
      @click="openMore"
    >
      ……
    </button>

    <div v-if="exited" class="rl-screen">
      <h2 class="rl-h2">已退出</h2>
      <p class="rl-sub">关闭标签页即可离开，或重新开始</p>
      <button class="rl-btn" type="button" @click="exited = false">返回主页</button>
    </div>

    <StartView
      v-else-if="hud.phase === 'menu' || hud.phase === 'char' || hud.phase === 'difficulty'"
      :step="hud.phase === 'menu' ? menuStep : hud.phase"
      @play="onPlay"
      @settings="openSettingsFromMenu"
      @exit="onExit"
      @pick-char="onPickChar"
      @pick-diff="onPickDiff"
      @back="onBack"
    />

    <MoreView
      v-else-if="hud.phase === 'more'"
      ref="moreRef"
      @back="closeMore"
    />

    <SettingsView
      v-else-if="hud.phase === 'settings'"
      ref="settingsRef"
      :settings="settings"
      :boost="settingsDraftBoost"
      :in-match="inLiveMatch(hud.resumePhase)"
      @update:settings="onSettingsUpdate"
      @boost="onSettingsBoost"
      @back="closeSettings"
      @home="onSettingsHome"
    />

    <template v-else>
      <HudOverlay v-if="inLiveMatch(hud.phase)" v-bind="hud" />
      <UpgradeView
        v-if="hud.phase === 'upgrade'"
        :choices="hud.choices"
        @choose="onChoose"
      />
      <ResultView
        v-if="hud.phase === 'result' || hud.phase === 'victory'"
        :result="hud.result"
        :status="postStatus"
        :error="postError"
        :posting="posting"
        @again="onAgain"
        @home="onHome"
        @retry="submitNow"
      />
    </template>
  </div>
</template>
