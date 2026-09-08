<script setup>
import { computed, ref, watch } from 'vue'
import { UPGRADES, descFor } from '../ui/constants.js'
import { clampLevelBoost, clampSpawnRate, clampTestElapsedSec, clampVolume, formatVolumePct, TEST_ELAPSED_MAX, TEST_ELAPSED_STEP } from '../ui/settings.js'
import { formatTime } from '../ui/session.js'
import KeyIcon from './KeyIcon.vue'
import PixelIcon from './PixelIcon.vue'

const props = defineProps({
  settings: { type: Object, required: true },
  boost: { type: Number, default: 0 },
  inMatch: { type: Boolean, default: false },
  charId: { type: String, default: 'ranger' },
})

const emit = defineEmits([
  'update:settings',
  'back',
  'boost',
  'home',
  'grant-upgrade',
])

const s = computed(() => props.settings)
const volume = ref(clampVolume(props.settings.volume))
const pickerOpen = ref(false)

watch(
  () => props.settings.volume,
  (v) => {
    const n = clampVolume(v)
    if (n !== volume.value) volume.value = n
  },
)

const sfxVolume = ref(clampVolume(props.settings.sfxVolume ?? 0.7))

watch(
  () => props.settings.sfxVolume,
  (v) => {
    const n = clampVolume(v ?? 0.7)
    if (n !== sfxVolume.value) sfxVolume.value = n
  },
)

const bgmVolume = ref(clampVolume(props.settings.bgmVolume ?? 0.7))

watch(
  () => props.settings.bgmVolume,
  (v) => {
    const n = clampVolume(v ?? 0.7)
    if (n !== bgmVolume.value) bgmVolume.value = n
  },
)

const volumePctText = computed(() => formatVolumePct(volume.value))
const sfxVolumePctText = computed(() => formatVolumePct(sfxVolume.value))
const bgmVolumePctText = computed(() => formatVolumePct(bgmVolume.value))
const confirmingHome = ref(false)

function patch(partial) {
  emit('update:settings', { ...s.value, ...partial })
}

function onVolumeInput(e) {
  const v = clampVolume(e.target.value)
  volume.value = v
  patch({ volume: v })
}

function onSfxVolumeInput(e) {
  const v = clampVolume(e.target.value)
  sfxVolume.value = v
  patch({ sfxVolume: v })
}

function onBgmVolumeInput(e) {
  const v = clampVolume(e.target.value)
  bgmVolume.value = v
  patch({ bgmVolume: v })
}

function nudgeSpawn(dir) {
  patch({ spawnRate: clampSpawnRate(s.value.spawnRate + dir * 0.25) })
}

function nudgeBoost(dir) {
  emit('boost', clampLevelBoost(props.boost + dir))
}

function onElapsedInput(e) {
  patch({ testElapsedSec: clampTestElapsedSec(e.target.value) })
}

function openUpgradePicker() {
  pickerOpen.value = true
}

function closeUpgradePicker() {
  pickerOpen.value = false
}

function isUpgradePickerOpen() {
  return pickerOpen.value
}

function grantUpgrade(id) {
  emit('grant-upgrade', id)
}

function requestHome() {
  if (props.inMatch) {
    confirmingHome.value = true
    return
  }
  emit('home')
}

function cancelHome() {
  confirmingHome.value = false
}

defineExpose({
  cancelHome,
  isConfirmingHome: () => confirmingHome.value,
  closeUpgradePicker,
  isUpgradePickerOpen,
})
</script>

<template>
  <section class="rl-screen rl-settings">
    <h2 class="rl-h2">设置</h2>

    <div class="rl-settings-cols">
      <div class="rl-settings-main">
        <div class="rl-panel rl-frame">
          <h3>操作教程</h3>
          <div class="rl-keys">
            <KeyIcon label="W" caption="上" />
            <KeyIcon label="A" caption="左" />
            <KeyIcon label="S" caption="下" />
            <KeyIcon label="D" caption="右" />
            <KeyIcon label="鼠" caption="瞄准开火" />
          </div>
        </div>

        <div class="rl-panel rl-frame">
          <label class="rl-slide">
            <span>总音量 <strong class="rl-vol-num">{{ volumePctText }}</strong></span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="volume"
              @input="onVolumeInput"
            />
          </label>
          <label class="rl-slide">
            <span>背景音乐 <strong class="rl-vol-num">{{ bgmVolumePctText }}</strong></span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="bgmVolume"
              @input="onBgmVolumeInput"
            />
          </label>
          <label class="rl-slide">
            <span>音效音量 <strong class="rl-vol-num">{{ sfxVolumePctText }}</strong></span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="sfxVolume"
              @input="onSfxVolumeInput"
            />
          </label>
        </div>

        <div class="rl-panel rl-frame">
          <button
            class="rl-toggle"
            :class="s.testMode ? 'on' : 'off'"
            type="button"
            @click="patch({ testMode: !s.testMode })"
          >
            测试模式：{{ s.testMode ? '打开' : '关闭' }}
          </button>
        </div>

        <div class="rl-menu-actions">
          <button class="rl-btn rl-glyph-btn" type="button" @click="emit('back')">返回</button>
          <button class="rl-btn rl-glyph-btn ghost" type="button" @click="requestHome">返回主页</button>
        </div>
      </div>

      <div v-if="s.testMode" class="rl-settings-test rl-frame">
        <h3>测试选项</h3>
        <div class="rl-test-toggles">
          <button
            class="rl-toggle"
            :class="s.godMode ? 'on' : 'off'"
            type="button"
            @click="patch({ godMode: !s.godMode })"
          >
            无敌模式：{{ s.godMode ? '打开' : '关闭' }}
          </button>
          <button
            class="rl-toggle"
            :class="s.infiniteAmmo ? 'on' : 'off'"
            type="button"
            @click="patch({ infiniteAmmo: !s.infiniteAmmo })"
          >
            满蓄模式：{{ s.infiniteAmmo ? '打开' : '关闭' }}
          </button>
          <button
            class="rl-toggle"
            :class="s.testDummy ? 'on' : 'off'"
            type="button"
            @click="patch({ testDummy: !s.testDummy })"
          >
            火柴人：{{ s.testDummy ? '打开' : '关闭' }}
          </button>
          <button class="rl-btn rl-glyph-btn" type="button" @click="openUpgradePicker">升级选项自选</button>
        </div>

        <div class="rl-nudge">
          <span>测试时间 {{ formatTime(s.testElapsedSec ?? 0) }}</span>
          <div>
            <input
              type="range"
              min="0"
              :max="TEST_ELAPSED_MAX"
              :step="TEST_ELAPSED_STEP"
              :value="s.testElapsedSec"
              @input="onElapsedInput"
            />
          </div>
        </div>

        <div class="rl-nudge">
          <span>刷怪速度 ×{{ s.spawnRate.toFixed(2) }}</span>
          <div>
            <button type="button" class="rl-btn rl-glyph-btn tiny" @click="nudgeSpawn(-1)">◀</button>
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              :value="s.spawnRate"
              @input="patch({ spawnRate: clampSpawnRate($event.target.value) })"
            />
            <button type="button" class="rl-btn rl-glyph-btn tiny" @click="nudgeSpawn(1)">▶</button>
          </div>
        </div>

        <div class="rl-nudge rl-nudge--inline">
          <span>提高等级 +{{ boost }}</span>
          <div class="rl-level-btns">
            <button type="button" class="rl-btn rl-glyph-btn tiny" @click="nudgeBoost(-1)">−</button>
            <button type="button" class="rl-btn rl-glyph-btn tiny" @click="nudgeBoost(1)">+</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="confirmingHome" class="rl-modal">
      <div class="rl-modal-box rl-frame rl-frame--pop">
        <p>返回后本局无法保持，是否退出？</p>
        <div class="rl-actions">
          <button class="rl-btn rl-glyph-btn" type="button" @click="emit('home')">确认</button>
          <button class="rl-btn rl-glyph-btn ghost" type="button" @click="cancelHome">取消</button>
        </div>
      </div>
    </div>

    <div v-if="pickerOpen" class="rl-picker">
      <button class="rl-picker-x" type="button" @click="closeUpgradePicker">X</button>
      <div class="rl-picker-grid">
        <button
          v-for="u in UPGRADES"
          :key="u.id"
          class="rl-picker-item"
          type="button"
          @click="grantUpgrade(u.id)"
        >
          <PixelIcon :id="u.id" :scale="4" :advanced="u.tier === 'advanced'" />
          <span class="rl-mem-tip">{{ descFor(u.id, charId) }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* M3 / TASK-009：P35 轻量浅色容器（只改视觉；文案、事件与暴露方法零改动）。
   浅草地底 + 纸面浅底容器 + 1px 墨色描边；交互只用「描边加强 + 下压 1px」，
   不变亮填充、不反色文字；开关开启态用柔和面板绿，不荧光。 */

.rl-screen.rl-settings {
  background: var(--rl-screen);
  color: var(--rl-ink);
}

/* 普通设置容器：3px 墨边 + 苔绿内线的双层像素框 */
.rl-settings .rl-panel {
  border: 3px solid var(--rl-ink);
  background: var(--rl-panel);
  box-shadow: inset 0 0 0 2px var(--rl-lock);
  color: var(--rl-ink);
}

/* 确认弹窗是短时聚焦内容，保留纸面色以提高层级 */
.rl-settings .rl-modal-box {
  border: 3px solid var(--rl-ink);
  background: var(--rl-paper);
  box-shadow: inset 0 0 0 2px var(--rl-lock);
  color: var(--rl-ink);
}

/* 测试设置：独立的暗黄绿像素框，不能再是透明的普通表单区 */
.rl-settings .rl-settings-test {
  border: 3px solid var(--rl-ink);
  background: var(--rl-panel-test);
  box-shadow: inset 0 0 0 2px var(--rl-lock);
  color: var(--rl-ink);
}

.rl-settings .rl-panel h3,
.rl-settings .rl-settings-test h3 {
  color: var(--rl-sub);
  letter-spacing: 1px;
}

/* 滑条：纸面轨道 + 苔绿内线 + 块状滑块，和面板共用像素框语法 */
.rl-settings .rl-slide input[type='range'],
.rl-settings .rl-nudge input[type='range'] {
  background: var(--rl-paper);
  border: 3px solid var(--rl-ink);
  box-shadow: inset 0 0 0 2px var(--rl-lock);
  border-radius: 0;
  accent-color: var(--rl-panel);
}

.rl-settings .rl-slide input[type='range']::-webkit-slider-thumb,
.rl-settings .rl-nudge input[type='range']::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  background: var(--rl-panel);
  border: 3px solid var(--rl-ink);
  box-shadow: inset 0 0 0 1px var(--rl-lock);
  border-radius: 0;
}

.rl-settings .rl-slide input[type='range']::-moz-range-thumb,
.rl-settings .rl-nudge input[type='range']::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--rl-panel);
  border: 3px solid var(--rl-ink);
  box-shadow: inset 0 0 0 1px var(--rl-lock);
  border-radius: 0;
}

.rl-settings .rl-nudge {
  color: var(--rl-sub);
}

.rl-settings .rl-vol-num {
  color: var(--rl-ink);
}

/* 开关：开启=黄绿，关闭=深苔绿；状态不再依赖透明底。 */
.rl-settings .rl-toggle.on {
  background: var(--rl-panel-test);
  color: var(--rl-ink);
}

.rl-settings .rl-toggle.off {
  background: var(--rl-bg);
  color: var(--rl-paper);
}

/* 返回主页确认框：草地色薄纱遮罩，不用黑色遮罩加深色弹窗 */
.rl-settings .rl-modal {
  background: rgba(197, 224, 163, 0.78);
}

/* 自选面板：同浅色体系；红 X 用全局控件语言的 3px 边 + 硬阴影 */
.rl-settings .rl-picker {
  background: rgba(197, 224, 163, 0.86);
}
</style>
