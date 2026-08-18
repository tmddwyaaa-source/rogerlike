/**
 * M8 逻辑自测。运行：node src/ui/selftest.mjs
 */
import { createPistol, CHARGE_MAX_SEC, CHARGE_UPGRADE } from '../game/weapons/index.js'
import { PLAYER_SPEED, PLAYER_SPEED_UNITS, createPlayer } from '../game/player/index.js'
import {
  BGM_URL,
  EXP_BASE,
  LEVEL_BOOST_MAX,
  LEVEL_GROWTH_ATK,
  LEVEL_GROWTH_EVERY,
  LEVEL_GROWTH_SPEED,
  MOVE_SPEED_BONUS,
  RANGER_IDLE_SRC,
  SURVIVE_WIN_SEC,
  UPGRADES,
  expNeedForLevel,
} from './constants.js'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { paintBlankIcon, paintAdvancedDot, iconRows, ICON_SIZE, ADVANCED_DOT_SIZE, resolveUpgradeIcon, upgradeIconUrl } from './icons.js'
import { applyUpgrade, createSession, formatTime, pickUpgradeChoices, levelGrowthSteps } from './session.js'
import { createMatchUi } from './index.js'
import { MEMORY_CAP, loadMemories, saveMemory, summarizePicked } from './memories.js'
import { createBgm } from './bgm.js'
import {
  clampLevelBoost,
  clampVolume,
  defaultSettings,
  formatVolumePct,
  setVolume,
} from './settings.js'
import { createEnvironment } from '../game/world/index.js'

let failed = 0
function assert(name, cond) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

assert('title 类幸存者', createMatchUi().title === '类幸存者')
assert('normal pool 13', UPGRADES.filter((u) => u.tier !== 'advanced').length === 13)
assert('advanced 地精', UPGRADES.filter((u) => u.tier === 'advanced').length === 1)
assert('exp 1→2 need 15', expNeedForLevel(1) === EXP_BASE && EXP_BASE === 15)
assert('exp 2→3 need 19', expNeedForLevel(2) === 19)
assert('upgrade 散射', UPGRADES.find((u) => u.id === 'ammo_cap')?.title === '散射')
assert('upgrade 敏捷', UPGRADES.find((u) => u.id === 'move_speed')?.title === '敏捷')
assert('upgrade 技巧', UPGRADES.find((u) => u.id === 'reload')?.title === '技巧')
assert('upgrade 力量', UPGRADES.some((u) => u.id === 'power'))
assert('力量文案 +10', UPGRADES.find((u) => u.id === 'power')?.desc === '伤害 +10')
assert('upgrade 黑洞', UPGRADES.find((u) => u.id === 'blackhole')?.title === '黑洞')
assert(
  '黑洞文案',
  UPGRADES.find((u) => u.id === 'blackhole')?.desc === '吸收全地图经验结晶',
)
assert('upgrade 磁铁', UPGRADES.find((u) => u.id === 'magnet')?.title === '磁铁')
assert(
  '磁铁文案',
  UPGRADES.find((u) => u.id === 'magnet')?.desc === '结晶吸取范围 +50%',
)
assert('survive win 600', SURVIVE_WIN_SEC === 600)

const s = createSession()
assert('phase menu', s.phase === 'menu')
s.start('1')
assert('phase playing', s.phase === 'playing')
s.tick(1.25)
assert('tick time', Math.abs(s.elapsedSec - 1.25) < 1e-9)
assert('format 00:01', formatTime(1.25) === '00:01')

s.pause()
assert('pause → settings', s.phase === 'settings' && s.resumePhase === 'playing')
const frozen = s.elapsedSec
s.tick(4)
assert('paused no time', s.elapsedSec === frozen)
assert('resume playing', s.resume() === 'playing' && s.phase === 'playing')

s.pause('playing', 'more')
assert('pause more', s.phase === 'more' && s.resumePhase === 'playing')
assert('resume from more', s.resume() === 'playing')

const gained1 = s.addExp(14)
assert('14 exp no level', gained1 === 0 && s.level === 1 && s.exp === 14)
const gained2 = s.addExp(1)
assert('15 exp → lv2 levelup', gained2 === 1 && s.level === 2 && s.exp === 0 && s.phase === 'levelup')
assert('levelup 先不 rollOffer', s.offer.length === 0)
const tLevelup = s.elapsedSec
s.tick(4)
assert('levelup 冻结时间', s.elapsedSec === tLevelup)
const lockLv = s.level
const lockExp = s.exp
const lockPending = s.pending
assert(
  'levelup 不加经验',
  s.addExp(40) === 0 && s.level === lockLv && s.exp === lockExp && s.pending === lockPending && s.phase === 'levelup',
)
assert(
  'beginUpgradeOffer',
  s.beginUpgradeOffer({ pistol: createPistol() }) === true &&
    s.phase === 'upgrade' &&
    s.offer.length === 3,
)
assert('upgrade 不加经验', s.addExp(40) === 0 && s.level === lockLv && s.exp === lockExp && s.phase === 'upgrade')
s.pause()
assert('pause from upgrade', s.phase === 'settings' && s.resumePhase === 'upgrade')
assert('resume upgrade', s.resume() === 'upgrade')

const player = createPlayer()
const pistol = createPistol()
assert('charge max 0.75', CHARGE_MAX_SEC === 0.75 && pistol.chargeMax === 0.75)
assert(
  '敏捷 +0.20',
  applyUpgrade('move_speed', { player }) === true &&
    Math.abs(player.speedUnits - (PLAYER_SPEED_UNITS + MOVE_SPEED_BONUS)) < 1e-9,
)
assert(
  '散射 +1 弹道',
  applyUpgrade('ammo_cap', { pistol }) === true && pistol.extraShots === 1 && pistol.dmgBonus === -3,
)
assert(
  '技巧 −0.20',
  applyUpgrade('reload', { pistol }) === true &&
    Math.abs(pistol.chargeMax - (CHARGE_MAX_SEC - CHARGE_UPGRADE)) < 1e-9,
)

const vit = createPlayer()
vit.hp = 2
assert('生存 2→3/4', applyUpgrade('survive', { player: vit }) && vit.hpMax === 4 && vit.hp === 3)
assert('恢复 +2 cap', applyUpgrade('recover', { player: vit }) && vit.hp === 4)

const env = createEnvironment({ random: () => 0.5 })
assert('大地啊', applyUpgrade('earth', { env }) && env.mods.extraTrees === 2 && Math.abs(env.mods.fruitBonus - 0.1) < 1e-9)

let vacuumed = 0
assert(
  '黑洞 hook',
  applyUpgrade('blackhole', { hooks: { onBlackhole: () => { vacuumed += 1 } } }) === true && vacuumed === 1,
)
const holeEnv = { mods: { extraTrees: 0, fruitBonus: 0 } }
assert(
  '黑洞 pending 留给 M7',
  applyUpgrade('blackhole', { env: holeEnv }) === true &&
    holeEnv.pendingBlackhole === true &&
    holeEnv.mods.blackhole === 1,
)
assert('黑洞无程序图标', iconRows('blackhole') == null)

let magCalls = 0
assert(
  '磁铁 addMagnet',
  applyUpgrade('magnet', { env: { addMagnet() { magCalls += 1 } } }) === true && magCalls === 1,
)
const magEnv = { mods: {} }
assert(
  '磁铁 hook 留给 M7',
  applyUpgrade('magnet', { env: magEnv }) === true &&
    magEnv.pendingMagnet === true &&
    magEnv.mods.magnetMul === 1.5,
)
assert('磁铁无程序图标', iconRows('magnet') == null)
assert('磁铁无过审图 → blank', resolveUpgradeIcon('magnet', false).kind === 'blank')

assert('upgrade 地精', UPGRADES.find((u) => u.id === 'goblin')?.title === '地精')
assert(
  '地精文案',
  UPGRADES.find((u) => u.id === 'goblin')?.desc === '生成 1 个地精跟班，所有跟班伤害 +10' &&
    UPGRADES.find((u) => u.id === 'goblin')?.tier === 'advanced',
)
let gobCalls = 0
let dmgBonus = 0
assert(
  '地精 addGoblin+加伤',
  applyUpgrade('goblin', {
    companions: {
      addGoblin() { gobCalls += 1 },
      addDamageBonus(n) { dmgBonus += n },
    },
  }) === true && gobCalls === 1 && dmgBonus === 10,
)
const gobHost = {}
assert(
  '地精 hook 留给 M11',
  applyUpgrade('goblin', { env: gobHost }) === true &&
    gobHost.pendingGoblin === 1 &&
    gobHost.pendingCompanionDamage === 10,
)
assert('地精无程序图标', iconRows('goblin') == null)
assert('地精无过审图 → blank', resolveUpgradeIcon('goblin', false).kind === 'blank')

assert('upgrade 兔子', UPGRADES.find((u) => u.id === 'rabbit')?.title === '兔子')
assert(
  '兔子文案',
  UPGRADES.find((u) => u.id === 'rabbit')?.desc === '生成 1 个兔子跟班' &&
    UPGRADES.find((u) => u.id === 'rabbit')?.tier !== 'advanced',
)
let rabbitCalls = 0
let rabbitDmg = 0
assert(
  '兔子 addRabbit 不加伤',
  applyUpgrade('rabbit', {
    companions: {
      addRabbit() { rabbitCalls += 1 },
      addDamageBonus(n) { rabbitDmg += n },
    },
  }) === true && rabbitCalls === 1 && rabbitDmg === 0,
)
const rabbitHost = {}
assert(
  '兔子 hook 留给 M11',
  applyUpgrade('rabbit', { env: rabbitHost }) === true && rabbitHost.pendingRabbit === 1,
)
assert('兔子无程序图标', iconRows('rabbit') == null)

const fifth = pickUpgradeChoices(null, 3, () => 0, { offerIndex: 5 })
assert(
  '第5次 rng<0.3 含地精',
  fifth.length === 3 && fifth.filter((c) => c.id === 'goblin').length === 1,
)
const fourth = pickUpgradeChoices(null, 3, () => 0, { offerIndex: 4 })
assert('第4次不含高级', fourth.length === 3 && !fourth.some((c) => c.tier === 'advanced' || c.id === 'goblin'))
const fifthMiss = pickUpgradeChoices(null, 3, () => 0.5, { offerIndex: 5 })
assert('第5次 30% 未中', !fifthMiss.some((c) => c.id === 'goblin'))
const tenth = pickUpgradeChoices(null, 3, () => 0, { offerIndex: 10 })
assert('第10次可出地精', tenth.some((c) => c.id === 'goblin'))

const sum2 = summarizePicked([
  { id: 'move_speed' },
  { id: 'move_speed' },
])
assert('回忆汇总 ×2', sum2.length === 1 && sum2[0].id === 'move_speed' && sum2[0].count === 2)
const sum1 = summarizePicked([{ id: 'power' }])
assert('回忆汇总 ×1', sum1.length === 1 && sum1[0].id === 'power' && sum1[0].count === 1)
const sumOrder = summarizePicked([
  { id: 'move_speed' },
  { id: 'power' },
  { id: 'move_speed' },
])
assert(
  '回忆先出现序',
  sumOrder.length === 2 &&
    sumOrder[0].id === 'move_speed' &&
    sumOrder[0].count === 2 &&
    sumOrder[1].id === 'power' &&
    sumOrder[1].count === 1,
)

const s2 = createSession()
s2.start('1')
s2.addExp(15)
assert('applyChoice 需先 beginUpgradeOffer', s2.applyChoice('move_speed', { player: createPlayer(), pistol: createPistol() }) === false)
assert('beginUpgradeOffer s2', s2.beginUpgradeOffer({ pistol: createPistol() }))
assert('applyChoice', s2.applyChoice('move_speed', { player: createPlayer(), pistol: createPistol() }))
assert('picked recorded', s2.picked[0]?.title === '敏捷')
s2.addKill()
s2.tick(12)
const result = s2.finish()
assert('finish', result.kills === 1 && !result.win)
const snap = s2.snapshot()
assert('charge field reserved', snap.charge === 0 && snap.chargeMax === 0.75 && 'charging' in snap)
assert('no ammo in snapshot', snap.mag === undefined)
const mems = loadMemories()
assert('memory saved', mems.length >= 1 && mems[0].upgrades[0]?.title === '敏捷')
assert('memory cap', MEMORY_CAP === 10)

const zeroBow = createPistol()
zeroBow.chargeMax = 0
const snapZero = createSession()
snapZero.start('1')
assert(
  'chargeMax 0 drops 技巧 from pool',
  !snapZero.snapshot(null, { pistol: zeroBow }).choices.some((c) => c.id === 'reload'),
)

const s3 = createSession()
s3.start('1')
s3.tick(SURVIVE_WIN_SEC)
assert('auto win', s3.phase === 'victory' && s3.win === true)
assert('exp 31 uncapped', expNeedForLevel(31) === EXP_BASE + 4 * 30)
assert('boost max 0–3', LEVEL_BOOST_MAX === 3 && clampLevelBoost(9) === 3 && clampLevelBoost(-2) === 0)

const sLevels = createSession()
sLevels.start('1')
const two = sLevels.addExp(expNeedForLevel(1) + expNeedForLevel(2))
assert(
  '连升两级不封顶',
  two === 2 && sLevels.level === 3 && sLevels.pending === 2 && sLevels.phase === 'levelup' && sLevels.offer.length === 0,
)

assert('growth every 5', LEVEL_GROWTH_EVERY === 5 && LEVEL_GROWTH_ATK === 1 && LEVEL_GROWTH_SPEED === 0.05)
assert('steps 1→6', levelGrowthSteps(1, 6) === 1)
assert('steps 6→11', levelGrowthSteps(6, 11) === 1)
assert('steps 4→7', levelGrowthSteps(4, 7) === 1)
assert('steps 1→4', levelGrowthSteps(1, 4) === 0)

function expSum(from, to) {
  let n = 0
  for (let lv = from; lv < to; lv++) n += expNeedForLevel(lv)
  return n
}

const grow1 = createPlayer()
grow1.attack = 20
const sGrow1 = createSession()
sGrow1.start('1')
sGrow1.addExp(expSum(1, 6), { player: grow1 })
assert(
  '1→6 攻+1 速+0.05',
  sGrow1.level === 6 &&
    grow1.attack === 21 &&
    Math.abs(grow1.speedUnits - (PLAYER_SPEED_UNITS + LEVEL_GROWTH_SPEED)) < 1e-9,
)

const grow2 = createPlayer()
grow2.attack = 21
grow2.speedUnits = PLAYER_SPEED_UNITS + LEVEL_GROWTH_SPEED
const sGrow2 = createSession()
sGrow2.start('1')
sGrow2.setLevel(6)
sGrow2.addExp(expSum(6, 11), { player: grow2 })
assert(
  '6→11 再各一次',
  sGrow2.level === 11 &&
    grow2.attack === 22 &&
    Math.abs(grow2.speedUnits - (PLAYER_SPEED_UNITS + LEVEL_GROWTH_SPEED * 2)) < 1e-9,
)

const grow3 = createPlayer()
grow3.attack = 20
const sGrow3 = createSession()
sGrow3.start('1')
sGrow3.setLevel(4)
assert(
  'boost 4→7 只加一次',
  sGrow3.boostLevels(3, { player: grow3 }) === 3 &&
    sGrow3.level === 7 &&
    grow3.attack === 21 &&
    Math.abs(grow3.speedUnits - (PLAYER_SPEED_UNITS + LEVEL_GROWTH_SPEED)) < 1e-9,
)
assert('growth 无 player 不崩', createSession().start('1') && createSession().boostLevels(3) === 3)

const sPast = createSession()
sPast.start('1')
sPast.setLevel(30)
const past = sPast.addExp(expNeedForLevel(30) + expNeedForLevel(31))
assert(
  'past 30 two levels',
  past === 2 && sPast.level === 32 && sPast.pending === 2 && sPast.phase === 'levelup',
)

const boostCtx = {
  player: createPlayer(),
  pistol: createPistol(),
  env: createEnvironment({ random: () => 0.5 }),
}
const sBoost = createSession()
sBoost.start('1')
assert(
  'boostLevels 3',
  sBoost.boostLevels(3, boostCtx) === 3 &&
    sBoost.level === 4 &&
    sBoost.pending === 3 &&
    sBoost.phase === 'levelup' &&
    sBoost.offer.length === 0,
)
assert('boost 先不 rollOffer', sBoost.beginUpgradeOffer(boostCtx) === true && sBoost.phase === 'upgrade' && sBoost.offer.length === 3)
let boostPicks = 0
while (sBoost.pending > 0 && sBoost.offer[0]) {
  if (!sBoost.applyChoice(sBoost.offer[0].id, boostCtx)) break
  boostPicks += 1
}
assert(
  'boost 3 → 三次三选一',
  boostPicks === 3 && sBoost.pending === 0 && sBoost.phase === 'playing' && sBoost.level === 4,
)

const sHome = createSession()
sHome.pause('menu')
sHome.resume()
assert('home settings 不改等级', sHome.level === 1 && sHome.pending === 0 && sHome.phase === 'menu')

assert('bgm url', BGM_URL === '/assets/游戏音乐/music.ogg')
assert('ranger idle url', RANGER_IDLE_SRC === '/assets/characters/1/S_Idle.png')
const mockAudio = {
  volume: 1,
  loop: false,
  play() {
    this.played = true
    return Promise.resolve()
  },
}
const bgm = createBgm({ audio: mockAudio })
assert('bgm volume write', bgm.setVolume(0.42) === 0.42 && mockAudio.volume === 0.42 && mockAudio.muted !== true)
assert('bgm volume 0 mutes', bgm.setVolume(0) === 0 && mockAudio.volume === 0 && mockAudio.muted === true)
assert('bgm volume restore unmutes', bgm.setVolume(0.3) === 0.3 && mockAudio.muted === false)
assert('bgm loop play', bgm.play() === true && mockAudio.loop === true && mockAudio.played === true)

assert('speed units 1.2', PLAYER_SPEED_UNITS === 1.2 && PLAYER_SPEED === 96)

const blank = { fillRect() { this.n = (this.n || 0) + 1 }, strokeRect() { this.s = (this.s || 0) + 1 }, fillStyle: '', strokeStyle: '', lineWidth: 0 }
assert('blank icon paints', paintBlankIcon(blank, 0, 0, 4) === true && blank.n >= 1 && blank.s >= 1)
assert('icon cell 12', ICON_SIZE === 12)
assert('advanced dot 3', ADVANCED_DOT_SIZE === 3)
const advDot = { fillRect(x, y, w, h) { this.w = w; this.h = h; this.x = x; this.y = y }, fillStyle: '' }
assert('advanced dot paints 3×scale', paintAdvancedDot(advDot, 0, 0, 4) === true && advDot.w === 12 && advDot.h === 12 && advDot.x === 0 && advDot.y === 0)
assert(
  'url convention',
  upgradeIconUrl('move_speed') === '/assets/upgrades/move_speed.png',
)
assert('no png → blank', resolveUpgradeIcon('power', false).kind === 'blank')
assert(
  'has png → png url',
  resolveUpgradeIcon('power', true).kind === 'png' &&
    resolveUpgradeIcon('power', true).url === '/assets/upgrades/power.png',
)

const here = dirname(fileURLToPath(import.meta.url))
const runtimeDir = join(here, '../../public/assets/upgrades')
for (const u of UPGRADES) {
  const onDisk = existsSync(join(runtimeDir, `${u.id}.png`))
  const resolved = resolveUpgradeIcon(u.id, onDisk)
  assert(
    `${u.id} display ${onDisk ? 'png' : 'blank'}`,
    resolved.kind === (onDisk ? 'png' : 'blank'),
  )
}

assert('bgm file', existsSync(join(here, '../../public/assets/游戏音乐/music.ogg')))
assert('ranger idle file', existsSync(join(here, '../../public/assets/characters/1/S_Idle.png')))

const pixelSrc = readFileSync(join(here, '../views/PixelIcon.vue'), 'utf8')
assert('PixelIcon loads png url', pixelSrc.includes('upgradeIconUrl'))
assert('PixelIcon paints blank', pixelSrc.includes('paintBlankIcon'))
assert('PixelIcon never paintIcon', !pixelSrc.includes('paintIcon'))
assert('PixelIcon advanced dot', pixelSrc.includes('paintAdvancedDot') && pixelSrc.includes('isAdvanced'))

const upgradeSrc = readFileSync(join(here, '../views/UpgradeView.vue'), 'utf8')
assert('三选一传 advanced', upgradeSrc.includes(':advanced'))

const shellSrc = readFileSync(join(here, '../views/GameShell.vue'), 'utf8')
assert('shell boostLevels on close', shellSrc.includes('boostLevels'))
assert('shell +/- 不 setLevel', !shellSrc.includes('setLevel'))
assert('shell BGM shared', shellSrc.includes('getSharedBgm'))

const startSrc = readFileSync(join(here, '../views/StartView.vue'), 'utf8')
assert('char RangerPortrait', startSrc.includes('RangerPortrait') && startSrc.includes('CHAR_NAME'))
assert('char 不用人', !startSrc.includes('人'))

const portraitSrc = readFileSync(join(here, '../views/RangerPortrait.vue'), 'utf8')
assert('idle frame0 flip', portraitSrc.includes('RANGER_IDLE_SRC') && portraitSrc.includes('scale(-1, 1)'))

const settingsSrc = readFileSync(join(here, '../views/SettingsView.vue'), 'utf8')
assert('提高等级文案', settingsSrc.includes('提高等级') && settingsSrc.includes('clampLevelBoost'))
assert('刷怪速度文案', settingsSrc.includes('刷怪速度') && !settingsSrc.includes('刷怪概率'))
assert('UpgradeView 仅 upgrade', shellSrc.includes("hud.phase === 'upgrade'") && shellSrc.includes('beginUpgradeOffer') === false)
assert('matchUi beginUpgradeOffer', typeof createMatchUi().beginUpgradeOffer === 'function')

const moreSrc = readFileSync(join(here, '../views/MoreView.vue'), 'utf8')
assert('回忆用 PixelIcon', moreSrc.includes('PixelIcon') && moreSrc.includes('summarizePicked'))
assert('回忆 ×n 无序号文案', moreSrc.includes('×{{ u.count }}') && !moreSrc.includes('i + 1') && !moreSrc.includes('u.title'))
assert('回忆悬停效果', moreSrc.includes('descFor') && moreSrc.includes('rl-mem-tip') && moreSrc.includes(':title'))
assert('回忆也显示 ×1', moreSrc.includes('×{{ u.count }}') && !moreSrc.includes('u.count > 1'))
const pixelCss = readFileSync(join(here, 'pixel.css'), 'utf8')
assert('回忆 ×000 槽', pixelCss.includes('4ch') && pixelCss.includes('rl-mem-mult'))
assert('回忆 tip 不占布局', pixelCss.includes('.rl-mem-tip') && pixelCss.includes('position: absolute'))

const vol = defaultSettings()
assert('volume default 70%', formatVolumePct(vol.volume) === '70%')
assert('clamp high', clampVolume(2) === 1)
assert('clamp low', clampVolume(-0.3) === 0)
assert('setVolume 42%', setVolume(vol, 0.42) === 42 && vol.volume === 0.42)
assert('label tracks settings', formatVolumePct(vol.volume) === '42%')
setVolume(vol, 0.01)
assert('setVolume 1%', formatVolumePct(vol.volume) === '1%')
setVolume(vol, 1)
assert('setVolume 100%', formatVolumePct(vol.volume) === '100%')
const uiVol = createMatchUi()
setVolume(uiVol.settings, 0.55)
assert('matchUi.settings.volume live', formatVolumePct(uiVol.settings.volume) === '55%')

saveMemory({ timeText: '00:01', level: 1, exp: 0, upgrades: [] })
assert('memory append', loadMemories().length >= 2)

console.log(failed === 0 ? '\nRESULT PASS' : `\nRESULT FAIL (${failed})`)
process.exit(failed === 0 ? 0 : 1)
