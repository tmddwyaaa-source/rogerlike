<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { createMatchUi, getSharedBgm } from '../ui/index.js'
import { bondTiers, BOND_DESC, CHARGE_MAX_SEC } from '../ui/constants.js'
import { getSharedSfx } from '../ui/sfx.js'
import '../ui/pixel.css'
import HudOverlay from './HudOverlay.vue'
import MoreView from './MoreView.vue'
import PowerView from './PowerView.vue'
import QuickAudioControls from './QuickAudioControls.vue'
import ResultView from './ResultView.vue'
import SettingsView from './SettingsView.vue'
import StartView from './StartView.vue'
import UpgradeView from './UpgradeView.vue'

const emit = defineEmits(['start', 'again', 'home', 'frame-transition'])

const ui = createMatchUi()
const settings = reactive(ui.settings)
const bgm = getSharedBgm()
const sfx = getSharedSfx()
let lastPhaseForSfx = 'menu'
let heartbeatOn = false
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
const bgmMuted = ref(false)
const sfxMuted = ref(false)

function syncHud() {
  const wasLive = inLiveMatch(hud.phase)
  Object.assign(hud, ui.snapshot(bindCtx.player, bindCtx.combat))
  if (wasLive && !inLiveMatch(hud.phase)) emit('frame-transition', 'exit')
  syncSfx()
}

/** UI 相位音效：levelup/defeat/victory 进入时各播一次；心跳 hp<=1 循环、回血或死亡即停。 */
function syncSfx() {
  const p = hud.phase
  if (p !== lastPhaseForSfx) {
    if (p === 'levelup') sfx.play('levelup')
    else if (p === 'result') sfx.play('defeat')
    else if (p === 'victory') sfx.play('victory')
    lastPhaseForSfx = p
  }
  const paused = p === 'settings' || p === 'more' || p === 'memories'
  const lowHp = hud.hp <= 1 && (inLiveMatch(p) || (paused && inLiveMatch(hud.resumePhase)))
  if (lowHp && !heartbeatOn) heartbeatOn = sfx.startHeartbeat()
  else if (!lowHp && heartbeatOn) {
    sfx.stopHeartbeat()
    heartbeatOn = false
  }
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

function onPickChar(id) {
  ui.session.charId = id || 'ranger'
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

function openSettings() {
  if (powerChoosing()) return
  if (ui.session.phase === 'settings') return
  settingsDraftBoost.value = 0
  ui.session.pause(ui.session.phase)
  syncHud()
}

function openMore() {
  const from = ui.session.phase
  if (powerChoosing()) return
  if (from === 'more' || from === 'settings') return
  ui.session.pause(from, 'more')
  syncHud()
}

function closeMore() {
  const next = ui.session.resume()
  if (inLiveMatch(next)) emit('frame-transition', 'enter')
  if (next === 'menu' || next === 'char' || next === 'difficulty') {
    menuStep.value = next === 'menu' ? 'menu' : next
  }
  syncHud()
}

function inLiveMatch(p) {
  return p === 'playing' || p === 'upgrade' || p === 'levelup' || p === 'power'
}

/** P42 批次3：power 屏强制选择——ESC / 设置 / 更多入口一律屏蔽，只能选卡。 */
function powerChoosing() {
  return ui.session.phase === 'power' || hud.phase === 'power'
}

function onPowerChoose(id) {
  ui.session.applyPowerChoice(id, bindCtx)
  syncHud()
}

function openPauseSettings() {
  openSettings()
}

function onSettingsUpdate(next) {
  const prevElapsed = settings.testElapsedSec
  Object.assign(settings, next)
  ui.persistSettings()
  applyVolumes()
  const live = inLiveMatch(ui.session.phase) || inLiveMatch(ui.session.resumePhase)
  const elapsedChanged = settings.testElapsedSec !== prevElapsed
  if (
    settings.testMode &&
    elapsedChanged &&
    live &&
    typeof ui.session.setElapsedSec === 'function'
  ) {
    ui.session.setElapsedSec(settings.testElapsedSec)
  }
  syncHud()
}

function onSettingsBoost(n) {
  settingsDraftBoost.value = n
}

function closeSettings() {
  const inMatch = inLiveMatch(ui.session.resumePhase)
  const n = settingsDraftBoost.value
  const next = ui.session.resume()
  if (inMatch && inLiveMatch(next)) emit('frame-transition', 'enter')
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

function onGrantUpgrade(id) {
  ui.grantUpgrade(id, bindCtx)
  syncHud()
}

function showingBonds() {
  const p = hud.phase
  if (inLiveMatch(p)) return true
  if ((p === 'settings' || p === 'more' || p === 'memories') && inLiveMatch(hud.resumePhase)) return true
  return false
}

function onEsc(e) {
  if (e.key !== 'Escape') return
  e.preventDefault()
  if (powerChoosing()) return
  if (settingsRef.value?.isUpgradePickerOpen?.()) {
    settingsRef.value.closeUpgradePicker()
    return
  }
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
/** 实际 BGM = 总音量 × 背景音乐；实际音效 = 总音量 × 音效音量。 */
function applyVolumes() {
  const master = settings.volume
  bgm.setVolume(bgmMuted.value ? 0 : master * (settings.bgmVolume ?? 0.7))
  sfx.setVolume(sfxMuted.value ? 0 : master * (settings.sfxVolume ?? 0.7))
}

function toggleBgm() {
  bgmMuted.value = !bgmMuted.value
  applyVolumes()
}

function toggleSfx() {
  if (sfxMuted.value) {
    sfxMuted.value = false
    applyVolumes()
    sfx.play('ui_click')
    return
  }
  sfx.play('ui_click')
  sfxMuted.value = true
  applyVolumes()
}

function onButtonClick(event) {
  const button = event.target?.closest?.('button:not(:disabled)')
  if (!button || button.dataset.audioToggle) return
  sfx.play('ui_click')
}

watch(
  () => [settings.volume, settings.bgmVolume, settings.sfxVolume],
  applyVolumes,
)

function tryPlayBgm() {
  applyVolumes()
  bgm.play()
}

onMounted(() => {
  window.addEventListener('keydown', onEsc)
  window.addEventListener('click', onButtonClick)
  tryPlayBgm()
  window.addEventListener('pointerdown', tryPlayBgm, { once: true })
})
onUnmounted(() => {
  window.removeEventListener('keydown', onEsc)
  window.removeEventListener('click', onButtonClick)
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

    <div
      class="rl-global-controls"
      style="position: absolute; top: 10px; right: 10px; z-index: 120; display: flex; align-items: center; gap: 4px"
    >
      <QuickAudioControls
        :bgm-muted="bgmMuted"
        :sfx-muted="sfxMuted"
        @toggle-bgm="toggleBgm"
        @toggle-sfx="toggleSfx"
      />
      <button
        v-if="!powerChoosing()"
        class="rl-gear"
        style="position: relative; top: auto; right: auto"
        type="button"
        aria-label="设置"
        title="设置（Esc）"
        @click="openSettings"
      >
        ⚙
      </button>
    </div>

    <button
      v-if="
        !powerChoosing() &&
        (inLiveMatch(hud.phase) ||
          hud.phase === 'menu' ||
          hud.phase === 'char' ||
          hud.phase === 'difficulty' ||
          hud.phase === 'result' ||
          hud.phase === 'victory')
      "
      class="rl-ellipsis"
      style="z-index: 120"
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
      @settings="openSettings"
      @exit="onExit"
      @pick-char="onPickChar"
      @pick-diff="onPickDiff"
      @back="onBack"
    />

    <MoreView
      v-else-if="hud.phase === 'more'"
      ref="moreRef"
      :char-id="hud.charId"
      @back="closeMore"
    />

    <SettingsView
      v-else-if="hud.phase === 'settings'"
      ref="settingsRef"
      :settings="settings"
      :boost="settingsDraftBoost"
      :in-match="inLiveMatch(hud.resumePhase)"
      :char-id="hud.charId"
      :charge-max="bindCtx.combat?.chargeMax ?? CHARGE_MAX_SEC"
      @update:settings="onSettingsUpdate"
      @boost="onSettingsBoost"
      @back="closeSettings"
      @home="onSettingsHome"
      @grant-upgrade="onGrantUpgrade"
    />

    <template v-else>
      <HudOverlay v-if="inLiveMatch(hud.phase)" v-bind="hud" />
      <UpgradeView
        v-if="hud.phase === 'upgrade'"
        :choices="hud.choices"
        :char-id="hud.charId"
        @choose="onChoose"
      />
      <PowerView
        v-if="hud.phase === 'power'"
        :key="hud.powerOfferSeq"
        :cards="hud.powerChoices"
        @choose="onPowerChoose"
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

    <aside
      v-if="showingBonds() && hud.bonds && hud.bonds.length"
      class="rl-bonds"
    >
      <span v-for="b in hud.bonds" :key="b.id" class="rl-bond">
        {{ b.title }} {{ b.rank }}
        <span class="rl-bond-tip">
          <strong>{{ b.title }}：{{ BOND_DESC[b.id] }}</strong>
          <span
            v-for="t in bondTiers(b.id)"
            :key="t.rank"
            class="rl-bond-tier"
            :class="{ reached: t.rank <= b.rank }"
          >档 {{ t.rank }} · {{ t.text }}</span>
        </span>
      </span>
    </aside>
  </div>
</template>
