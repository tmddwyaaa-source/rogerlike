/**
 * M8 逻辑自测。运行：node src/ui/selftest.mjs
 */
import { createPistol, CHARGE_MAX_SEC, CHARGE_UPGRADE } from '../game/weapons/index.js'
import { PLAYER_SPEED, PLAYER_SPEED_UNITS, createPlayer } from '../game/player/index.js'
import {
  BGM_URL,
  CHARACTERS,
  CHAR_HP,
  EXP_BASE,
  formatCharStats,
  OBJECTIVE_TEXT,
  OBJECTIVE_TEXT_TWO,
  DIFFICULTY_TWO,
  BOND_QIAN,
  BOND_UNITY,
  BOND_QIAN_TITLE,
  BOND_UNITY_TITLE,
  BOND_VAJRA,
  BOND_VAJRA_TITLE,
  BOND_DESC,
  BOND_TIERS,
  bondRank,
  bondTiers,
  descFor,
  qianDesired,
  LEVEL_BOOST_MAX,
  LEVEL_EMPTY_HP_EVERY,
  LEVEL_PIERCE_EVERY,
  LEVEL_GROWTH_ATK,
  LEVEL_GROWTH_EVERY,
  LEVEL_GROWTH_SPEED,
  MAGE_IDLE_SRC,
  MOVE_SPEED_BONUS,
  RANGER_IDLE_SRC,
  SURVIVE_WIN_SEC,
  UPGRADES,
  WARRIOR_IDLE_SRC,
  expNeedForLevel,
} from './constants.js'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { paintBlankIcon, paintAdvancedDot, iconRows, ICON_SIZE, ADVANCED_DOT_SIZE, resolveUpgradeIcon, upgradeIconUrl } from './icons.js'
import {
  applyEmptyHpMax,
  applyPierceGrowth,
  applyUpgrade,
  availableUpgrades,
  createSession,
  emptyHpSteps,
  pierceGrowthSteps,
  formatTime,
  pickUpgradeChoices,
  levelGrowthSteps,
  listActiveBonds,
  uniqueBondCount,
} from './session.js'
import { createMatchUi } from './index.js'
import { MEMORY_CAP, loadMemories, saveMemory, summarizePicked } from './memories.js'
import { createBgm } from './bgm.js'
import { createSfx, SFX_FILES, SFX_GAIN, SFX_URLS } from './sfx.js'
import {
  clampLevelBoost,
  clampTestElapsedSec,
  clampVolume,
  defaultSettings,
  formatVolumePct,
  loadSettings,
  saveSettings,
  setVolume,
  TEST_ELAPSED_MAX,
} from './settings.js'
import { createEnvironment } from '../game/world/index.js'
// P42 批次2（TASK-023）新增常量走命名空间导入：未落地时取到 undefined 即断言 FAIL，
// 不会因缺少具名导出导致整个自测在链接期崩掉（自证伪需要看到 FAIL 而不是崩溃）。
import * as C42 from './constants.js'

let failed = 0
function assert(name, cond) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed += 1
    console.log(`FAIL  ${name}`)
  }
}

assert('title 类幸存者', createMatchUi().title === '类幸存者')
assert('normal pool 23', UPGRADES.filter((u) => u.tier !== 'advanced').length === 23)
assert('advanced 10', UPGRADES.filter((u) => u.tier === 'advanced').length === 10)
assert('upgrade 暴击', UPGRADES.find((u) => u.id === 'crit')?.title === '暴击')
assert('暴击文案', UPGRADES.find((u) => u.id === 'crit')?.desc === '暴击率 +10')
assert('upgrade 唯快不破', UPGRADES.find((u) => u.id === 'only_fast')?.title === '唯快不破' && UPGRADES.find((u) => u.id === 'only_fast')?.tier !== 'advanced')
assert('upgrade 精益求精', UPGRADES.find((u) => u.id === 'refine')?.title === '精益求精' && UPGRADES.find((u) => u.id === 'refine')?.tier === 'advanced')
assert('upgrade 奇怪的蛋', UPGRADES.at(-1)?.id === 'strange_egg' && UPGRADES.find((u) => u.id === 'strange_egg')?.title === '奇怪的蛋')
assert('穿透文案 无括注', UPGRADES.find((u) => u.id === 'pierce')?.desc === '穿透 +1')
assert('OBJECTIVE_TEXT', OBJECTIVE_TEXT === '目标：活够10分钟')
assert('OBJECTIVE_TEXT_TWO', OBJECTIVE_TEXT_TWO === '目标：击败Boss 2次，并活够12分钟')
assert('DIFFICULTY_TWO', DIFFICULTY_TWO.id === '2' && DIFFICULTY_TWO.name === '难度二')
assert('bondRank qian', bondRank(BOND_QIAN, 1) === 0 && bondRank(BOND_QIAN, 2) === 2 && bondRank(BOND_QIAN, 5) === 4 && bondRank(BOND_QIAN, 8) === 8)
assert('bondRank unity', bondRank(BOND_UNITY, 1) === 0 && bondRank(BOND_UNITY, 2) === 2 && bondRank(BOND_UNITY, 5) === 4 && bondRank(BOND_UNITY, 8) === 8)
assert('bondRank vajra', bondRank(BOND_VAJRA, 1) === 0 && bondRank(BOND_VAJRA, 6) === 0 && bondRank(BOND_VAJRA, 7) === 7)
assert('qianDesired lv6 r2', Math.abs(qianDesired(6, 2).speed - 0.03) < 1e-9 && qianDesired(6, 2).atk === 0)
assert('qian 敏捷 bond', UPGRADES.find((u) => u.id === 'move_speed')?.bond === BOND_QIAN)
assert(
  '羁绊档位表',
  BOND_TIERS.qian.map((t) => t.rank).join() === '2,4,6,8' &&
    BOND_TIERS.unity.map((t) => t.rank).join() === '2,4,6,8' &&
    BOND_TIERS.vajra.length === 2 &&
    BOND_TIERS.vajra.map((t) => t.rank).join() === '7,7' &&
    BOND_TIERS.qian.every((t) => t.text.includes('随等级提高')) &&
    BOND_TIERS.vajra[0].text.includes('七色脉冲') &&
    BOND_TIERS.vajra[1].text.includes('再获得一次') &&
    Boolean(BOND_DESC.qian) &&
    Boolean(BOND_DESC.unity) &&
    Boolean(BOND_DESC.vajra),
)
assert('unity 蝙蝠 bond', UPGRADES.find((u) => u.id === 'bat')?.bond === BOND_UNITY)
assert(
  '七兄弟入小金刚羁绊',
  ['giant', 'erse', 'sanwa', 'siwa', 'wuwa', 'liuwa', 'blackhole'].every(
    (id) => C42.belongsToBond(UPGRADES.find((u) => u.id === id), BOND_VAJRA),
  ),
)
assert(
  'chars 三角色',
  CHARACTERS.map((c) => c.id).join(',') === 'ranger,warrior,mage' &&
    CHARACTERS[1].name === '战士' &&
    CHARACTERS[2].name === '法师',
)
assert(
  'chars stats',
  CHARACTERS[0].hp === 3 &&
    CHARACTERS[0].attack === 20 &&
    CHARACTERS[0].pierce === 0 &&
    CHARACTERS[1].hp === 4 &&
    CHARACTERS[1].attack === 22 &&
    CHARACTERS[1].pierce === 0 &&
    CHARACTERS[2].hp === 2 &&
    CHARACTERS[2].attack === 25 &&
    CHARACTERS[2].pierce === 0 &&
    CHARACTERS[0].fullCharge === '200%' &&
    CHARACTERS[1].fullCharge === '160%' &&
    CHARACTERS[2].fullCharge === '150%' &&
    CHARACTERS.every((c) => typeof c.trait === 'string' && c.trait.length > 0),
)
const rangerTip = formatCharStats('ranger')
const warriorTip = formatCharStats(CHARACTERS[1])
const mageTip = formatCharStats('mage')
assert(
  'formatCharStats',
  rangerTip.includes('基础属性') &&
    rangerTip.includes('角色特点') &&
    rangerTip.includes('\n') &&
    rangerTip.includes('满蓄：200%') &&
    rangerTip.includes('远程射手') &&
    rangerTip.includes('蓄力释放穿透箭矢') &&
    warriorTip.includes('伤害：22') &&
    warriorTip.includes('满蓄：160%') &&
    warriorTip.includes('无限穿透') &&
    warriorTip.includes('最高1.6倍') &&
    mageTip.includes('满蓄：150%') &&
    mageTip.includes('最高3倍') &&
    mageTip.includes('每点穿透额外增加20%伤害') &&
    !rangerTip.includes('每升级15次穿透+1') &&
    !rangerTip.includes('远程弓手') &&
    !rangerTip.includes('激光') &&
    !mageTip.includes('命中后扩散'),
)
assert('exp 0→1 need 7', expNeedForLevel(0) === EXP_BASE && EXP_BASE === 7)
assert('exp 1→2 need 11', expNeedForLevel(1) === 11)
assert('upgrade 散射', UPGRADES.find((u) => u.id === 'ammo_cap')?.title === '散射')
assert('upgrade 敏捷', UPGRADES.find((u) => u.id === 'move_speed')?.title === '敏捷')
assert('upgrade 技巧', UPGRADES.find((u) => u.id === 'reload')?.title === '技巧')
assert('upgrade 力量', UPGRADES.some((u) => u.id === 'power'))
assert('力量文案 +10', UPGRADES.find((u) => u.id === 'power')?.desc === '伤害 +10')
assert('黑洞改名七娃', UPGRADES.find((u) => u.id === 'blackhole')?.title === '七娃')
assert(
  '黑洞文案',
  UPGRADES.find((u) => u.id === 'blackhole')?.desc === '吸收全地图经验结晶',
)
assert('upgrade 磁铁', UPGRADES.find((u) => u.id === 'magnet')?.title === '磁铁')
assert(
  '磁铁文案',
  UPGRADES.find((u) => u.id === 'magnet')?.desc === '结晶吸取范围 +1 身位',
)
assert('upgrade 大娃', UPGRADES.find((u) => u.id === 'giant')?.title === '大娃')
assert(
  '大娃文案',
  UPGRADES.find((u) => u.id === 'giant')?.desc === '每次弹体大小 +40%',
)
assert('upgrade 二娃', UPGRADES.find((u) => u.id === 'erse')?.title === '二娃·千里眼' && UPGRADES.find((u) => u.id === 'erse')?.tier === 'advanced')
assert('二娃文案', UPGRADES.find((u) => u.id === 'erse')?.desc === '三选一 20%/层 概率变四选一')
assert('upgrade 三娃', UPGRADES.find((u) => u.id === 'sanwa')?.title === '三娃·铜头铁臂' && UPGRADES.find((u) => u.id === 'sanwa')?.tier !== 'advanced')
assert('三娃文案', UPGRADES.find((u) => u.id === 'sanwa')?.desc === '获得 1 层护甲；之后每升 N 级再获得 1 层（N=11−已选次数，可叠）')
assert('upgrade 四娃', UPGRADES.find((u) => u.id === 'siwa')?.title === '四娃·喷火' && UPGRADES.find((u) => u.id === 'siwa')?.tier === 'advanced')
assert('四娃文案', UPGRADES.find((u) => u.id === 'siwa')?.desc === '命中点燃 3 秒，每秒 30% 攻击（+10%/层）')
assert('upgrade 五娃', UPGRADES.find((u) => u.id === 'wuwa')?.title === '五娃·吐水' && UPGRADES.find((u) => u.id === 'wuwa')?.tier === 'advanced')
assert('五娃文案', UPGRADES.find((u) => u.id === 'wuwa')?.desc === '命中减速 20%、0.3 秒（+0.2 秒/层）')
assert('upgrade 六娃', UPGRADES.find((u) => u.id === 'liuwa')?.title === '六娃·隐身' && UPGRADES.find((u) => u.id === 'liuwa')?.tier !== 'advanced')
assert('六娃文案', UPGRADES.find((u) => u.id === 'liuwa')?.desc === '每 10 秒失锁脉冲：1.5 身位内敌人 1.0 秒不锁定（+0.5 秒/层）')
assert('upgrade 击退', UPGRADES.find((u) => u.id === 'knockback')?.title === '击退' && UPGRADES.find((u) => u.id === 'knockback')?.tier === 'advanced')
assert('击退文案', UPGRADES.find((u) => u.id === 'knockback')?.desc === '命中击退 +1 身位')
assert('upgrade 驯兽师', UPGRADES.find((u) => u.id === 'tamer')?.title === '驯兽师' && UPGRADES.find((u) => u.id === 'tamer')?.tier !== 'advanced')
assert('驯兽师文案', UPGRADES.find((u) => u.id === 'tamer')?.desc === '跟班伤害 +5、跟班移速 +0.05')
assert('upgrade 恶魔', UPGRADES.find((u) => u.id === 'demon')?.title === '恶魔' && UPGRADES.find((u) => u.id === 'demon')?.tier === 'advanced')
assert('恶魔文案', UPGRADES.find((u) => u.id === 'demon')?.desc === '生成 1 个恶魔跟班（基础伤害 10+角色伤害×20%）')
assert('upgrade 史莱姆gg', UPGRADES.find((u) => u.id === 'slime_gg')?.title === '史莱姆gg')
assert('史莱姆gg文案', UPGRADES.find((u) => u.id === 'slime_gg')?.desc === '生成 2 个史莱姆跟班（g-1、g-2），基础伤害 5')
assert('upgrade 伴我同行', UPGRADES.find((u) => u.id === 'companionship')?.title === '伴我同行')
assert('伴我同行文案', UPGRADES.find((u) => u.id === 'companionship')?.desc === '角色每击杀 100 怪物，跟班伤害 +1（+0.5/层）')
assert('survive win 600', SURVIVE_WIN_SEC === 600)
assert('testElapsed default 0', defaultSettings().testElapsedSec === 0)
assert('testDummy default false', defaultSettings().testDummy === false)
assert(
  'clamp elapsed 0～720',
  clampTestElapsedSec(-9) === 0 &&
    clampTestElapsedSec(999) === TEST_ELAPSED_MAX &&
    TEST_ELAPSED_MAX === 720,
)
assert('clamp elapsed step 5', clampTestElapsedSec(7) === 5)

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

const gained1 = s.addExp(6)
assert('6 exp no level', gained1 === 0 && s.level === 0 && s.exp === 6)
const gained2 = s.addExp(1)
assert('7 exp → lv1 levelup', gained2 === 1 && s.level === 1 && s.exp === 0 && s.phase === 'levelup')
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
  '敏捷 +0.15',
  MOVE_SPEED_BONUS === 0.15 &&
    UPGRADES.find((u) => u.id === 'move_speed')?.desc === '移速 +0.15' &&
    applyUpgrade('move_speed', { player }) === true &&
    Math.abs(player.speedUnits - (PLAYER_SPEED_UNITS + MOVE_SPEED_BONUS)) < 1e-9,
)
assert(
  '散射 +1 弹道',
  applyUpgrade('ammo_cap', { pistol }) === true && pistol.extraShots === 1 && pistol.dmgBonus === -3,
)
assert(
  '技巧 applyUpgrade 扣 CHARGE_UPGRADE',
  applyUpgrade('reload', { pistol }) === true &&
    Math.abs(pistol.chargeMax - (CHARGE_MAX_SEC - CHARGE_UPGRADE)) < 1e-9,
)
assert('技巧文案 蓄力−0.15', UPGRADES.find((u) => u.id === 'reload')?.desc === '蓄力时间 −0.15')

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
    magEnv.mods.magnetBonus === 1 &&
    magEnv.mods.magnetMul === undefined,
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

assert('upgrade 蝙蝠', UPGRADES.find((u) => u.id === 'bat')?.title === '蝙蝠')
assert(
  '蝙蝠文案',
  UPGRADES.find((u) => u.id === 'bat')?.desc ===
    '生成 1 个蝙蝠跟班；该蝙蝠每击杀 200 敌人，角色回复 1 滴血' &&
    UPGRADES.find((u) => u.id === 'bat')?.tier !== 'advanced',
)
assert('bat 在普通池', availableUpgrades(null, { tier: 'normal' }).some((u) => u.id === 'bat'))
let batCalls = 0
let batDmg = 0
assert(
  '蝙蝠 addBat 不加伤',
  applyUpgrade('bat', {
    companions: {
      addBat() { batCalls += 1 },
      addDamageBonus(n) { batDmg += n },
    },
  }) === true && batCalls === 1 && batDmg === 0,
)
const batHost = {}
assert(
  '蝙蝠 hook 留给 M11',
  applyUpgrade('bat', { env: batHost }) === true && batHost.pendingBat === 1,
)
assert('蝙蝠无程序图标', iconRows('bat') == null)

assert('upgrade 强化射击', UPGRADES.find((u) => u.id === 'empower_shot')?.title === '强化射击')
const empowerDesc = '满蓄改为激光，伤害 ceil(攻击×2.5)，穿透 +2，过量可溢出，攻击 +5'
assert(
  '强化射击文案统一游侠版',
  typeof UPGRADES.find((u) => u.id === 'empower_shot')?.desc === 'string' &&
    UPGRADES.find((u) => u.id === 'empower_shot')?.tier === 'advanced' &&
    descFor('empower_shot', 'ranger') === empowerDesc &&
    descFor('empower_shot', 'warrior') === empowerDesc &&
    descFor('empower_shot', 'mage') === empowerDesc,
)
assert('descFor 普通项原样', descFor('power') === '伤害 +10' && descFor('nope') === '')
const sEmp = createSession()
sEmp.start('1')
sEmp.charId = 'warrior'
sEmp.grantUpgrade('empower_shot', {})
assert('回忆存强化射击文案 战士', sEmp.picked[0]?.desc === empowerDesc)
const sEmpR = createSession()
sEmpR.start('1')
sEmpR.grantUpgrade('empower_shot', {})
assert('回忆存强化射击文案 游侠', sEmpR.picked[0]?.desc === empowerDesc)
const bowEmp = createPistol()
assert(
  '强化射击 applyUpgrade',
  applyUpgrade('empower_shot', { pistol: bowEmp }) === true && bowEmp.empowerPicks === 1,
)
const empHost = {}
assert(
  '强化射击 hook 留给武器',
  applyUpgrade('empower_shot', empHost) === true && empHost.pendingEmpowerShot === 1,
)
const bowCrit = createPistol()
assert(
  '暴击 applyUpgrade',
  applyUpgrade('crit', { pistol: bowCrit }) === true &&
    (bowCrit.critRate === 10 || bowCrit.pendingCrit === 10),
)
const critHost = {}
assert(
  '暴击 hook 留给武器',
  applyUpgrade('crit', critHost) === true && critHost.pendingCrit === 10,
)
assert('crit 在普通池', availableUpgrades(null, { tier: 'normal' }).some((u) => u.id === 'crit'))
assert(
  '强化射击仅游侠',
  availableUpgrades(null, { tier: 'advanced', charId: 'ranger' }).some((u) => u.id === 'empower_shot') &&
    !availableUpgrades(null, { tier: 'advanced', charId: 'warrior' }).some((u) => u.id === 'empower_shot') &&
    !availableUpgrades(null, { tier: 'advanced', charId: 'mage' }).some((u) => u.id === 'empower_shot') &&
    !availableUpgrades(null, { tier: 'normal', charId: 'warrior' }).some((u) => u.id === 'empower_shot') &&
    !availableUpgrades(null, { tier: 'normal', charId: 'mage' }).some((u) => u.id === 'empower_shot'),
)
assert(
  'chargeMax>0 无 only_fast',
  !availableUpgrades(null, { tier: 'normal' }).some((u) => u.id === 'only_fast'),
)
assert(
  'chargeMax=0 有 only_fast',
  availableUpgrades({ chargeMax: 0 }, { tier: 'normal' }).some((u) => u.id === 'only_fast'),
)
assert(
  '唯快不破降为普通',
  UPGRADES.find((u) => u.id === 'only_fast')?.tier !== 'advanced' &&
    !availableUpgrades(null, { tier: 'normal', charId: 'ranger' }).some((u) => u.id === 'only_fast') &&
    availableUpgrades({ chargeMax: 0 }, { tier: 'normal', charId: 'ranger' }).some((u) => u.id === 'only_fast'),
)
assert(
  'strange_egg 在高级池',
  availableUpgrades(null, { tier: 'advanced' }).some((u) => u.id === 'strange_egg') &&
    availableUpgrades(null, { tier: 'advanced' }).some((u) => u.id === 'refine'),
)
let eggCalls = 0
assert(
  '蛋 addEgg',
  applyUpgrade('strange_egg', { companions: { addEgg() { eggCalls += 1 } } }) === true && eggCalls === 1,
)
const eggHost = {}
assert('蛋 hook 留给 M11', applyUpgrade('strange_egg', { env: eggHost }) === true && eggHost.pendingEgg === 1)
const tamerHost = {}
assert('驯兽师 hook 留给 M11', applyUpgrade('tamer', { env: tamerHost }) === true && tamerHost.pendingTamer === 1)
const demonHost = {}
assert('恶魔 hook 留给 M11', applyUpgrade('demon', { env: demonHost }) === true && demonHost.pendingDemon === 1)
const slimeHost = {}
assert('史莱姆gg hook 留给 M11', applyUpgrade('slime_gg', { env: slimeHost }) === true && slimeHost.pendingSlimeGG === 1)
const compHost = {}
assert('伴我同行 hook 留给 M11', applyUpgrade('companionship', { env: compHost }) === true && compHost.pendingCompanionship === 1)
const fastHost = {}
assert('唯快不破 hook', applyUpgrade('only_fast', fastHost) === true && fastHost.pendingOnlyFast === 1)
const refineHost = {}
assert('精益求精 hook', applyUpgrade('refine', refineHost) === true && refineHost.pendingRefine === 1)
assert(
  '非游侠高级仍有地精',
  availableUpgrades(null, { tier: 'advanced', charId: 'warrior' }).some((u) => u.id === 'goblin'),
)

/* ---- P42 批次2（TASK-023 / M6）：荆棘 R1 / 滋补 R2 / 生生不息 R3 ---- */

/* R1 荆棘：普通项；id/title/desc/bond/tier；applyUpgrade 累计层数并同步 combat.setThornPicks。 */
const thornHost = { calls: [], setThornPicks(n) { this.calls.push(n) } }
const thornNoCombat = {}
const thornDef = UPGRADES.find((u) => u.id === 'thorn')
assert(
  '荆棘条目',
  C42.UPGRADE_THORN === 'thorn' &&
    thornDef?.id === C42.UPGRADE_THORN &&
    thornDef?.title === '荆棘' &&
    thornDef?.desc === '受击时对 2 身位内敌人造成 攻击×150%（每层 +50%，范围 +0.5 身位）' &&
    thornDef?.bond === C42.BOND_SHENG &&
    thornDef?.tier !== 'advanced' &&
    applyUpgrade('thorn', { combat: thornHost }) === true &&
    thornHost.calls.join() === '1' &&
    applyUpgrade('thorn', { combat: thornHost }) === true &&
    thornHost.calls.join() === '1,2' &&
    thornHost.thornPicks === 2 &&
    applyUpgrade('thorn', thornNoCombat) === true &&
    applyUpgrade('thorn', thornNoCombat) === true &&
    thornNoCombat.thornPicks === 2,
)

/* R2 滋补：普通项；阈值 max(100, 1000 − 100×(层数−1))，下限 100。 */
const nourishDef = UPGRADES.find((u) => u.id === 'nourish')
assert(
  '滋补条目',
  C42.UPGRADE_NOURISH === 'nourish' &&
    nourishDef?.id === 'nourish' &&
    nourishDef?.title === '滋补' &&
    nourishDef?.desc === '每击杀 1000 个敌人回复 1 滴血（每层 −100）' &&
    nourishDef?.bond === C42.BOND_SHENG &&
    nourishDef?.tier !== 'advanced',
)
const nourishThr = C42.nourishKillThreshold
assert(
  '滋补阈值 1000/900/下限100',
  typeof nourishThr === 'function' &&
    nourishThr(1) === 1000 &&
    nourishThr(2) === 900 &&
    nourishThr(10) === 100 &&
    nourishThr(11) === 100 &&
    nourishThr(12) === 100 &&
    nourishThr(0) === 0 &&
    C42.NOURISH_KILL_MIN === 100,
)
const nourishS = createSession()
nourishS.start('1')
const nourishPl = createPlayer()
nourishS.grantUpgrade('nourish', { player: nourishPl })
nourishPl.hp = nourishPl.hpMax - 1
const nourishHp0 = nourishPl.hp
nourishS.addKill(999, { player: nourishPl })
const nourishUnder = nourishPl.hp === nourishHp0
nourishS.addKill(1, { player: nourishPl })
const nourishCross = nourishPl.hp === nourishHp0 + 1
nourishS.addKill(1000, { player: nourishPl })
const nourishFullHold = nourishPl.hp === nourishPl.hpMax
nourishS.addKill(999, { player: nourishPl })
const nourishNoBank = nourishPl.hp === nourishPl.hpMax
const nourishS2 = createSession()
nourishS2.start('1')
const nourishPl2 = createPlayer()
nourishS2.grantUpgrade('nourish', { player: nourishPl2 })
nourishS2.grantUpgrade('nourish', { player: nourishPl2 })
nourishPl2.hp = nourishPl2.hpMax - 1
const nourishHp2 = nourishPl2.hp
nourishS2.addKill(899, { player: nourishPl2 })
const nourishHold2 = nourishPl2.hp === nourishHp2
nourishS2.addKill(1, { player: nourishPl2 })
const nourishCross2 = nourishPl2.hp === nourishHp2 + 1
assert(
  '滋补跨阈值回心且满血不囤积',
  nourishUnder && nourishCross && nourishFullHold && nourishNoBank && nourishHold2 && nourishCross2,
)

/* R3 生生不息：阈值 [3,5,8]（档 8 当前不可达）；计入项恰好 5 个；档 5 每 45s 回 1 心。 */
const shengS = createSession()
shengS.start('1')
const shengPl = createPlayer()
const shengCtx = { player: shengPl }
const shengRank = () => shengS.bonds.find((b) => b.id === 'sheng')?.rank ?? 0
shengS.grantUpgrade('survive', shengCtx)
shengS.grantUpgrade('recover', shengCtx)
const shengRank2 = shengRank()
shengS.grantUpgrade('sanwa', shengCtx)
const shengRank3 = shengRank()
shengS.grantUpgrade('nourish', shengCtx)
const shengRank4 = shengRank()
shengS.grantUpgrade('thorn', shengCtx)
const shengRank5 = shengRank()
const shengIds = UPGRADES.filter((u) => u.bond === C42.BOND_SHENG).map((u) => u.id)
assert(
  '羁绊 生生不息 档位',
  C42.BOND_SHENG === 'sheng' &&
    C42.BOND_SHENG_TITLE === '生生不息' &&
    C42.BOND_SHENG_THRESHOLDS?.join?.() === '3,5,8' &&
    C42.BOND_THRESHOLDS?.['sheng']?.join?.() === '3,5,8' &&
    bondRank('sheng', 2) === 0 &&
    bondRank('sheng', 3) === 3 &&
    bondRank('sheng', 5) === 5 &&
    shengIds.length === 5 &&
    [...shengIds].sort().join() === ['nourish', 'recover', 'sanwa', 'survive', 'thorn'].join() &&
    shengRank2 === 0 &&
    shengRank3 === 3 &&
    shengRank4 === 3 &&
    shengRank5 === 5 &&
    shengS.bonds.some((b) => b.id === 'sheng' && b.rank === 5 && b.title === C42.BOND_SHENG_TITLE),
)
const shengHealS = createSession()
shengHealS.start('1')
const shengHealPl = createPlayer()
const shengHealCtx = { player: shengHealPl }
for (const id of ['survive', 'recover', 'sanwa', 'nourish', 'thorn']) shengHealS.grantUpgrade(id, shengHealCtx)
shengHealPl.hp = shengHealPl.hpMax - 1
const shengHealHp0 = shengHealPl.hp
shengHealS.tick(44)
const shengHealHold = shengHealPl.hp === shengHealHp0
shengHealS.tick(1.5)
const shengHealOnce = shengHealPl.hp === shengHealHp0 + 1
shengHealS.tick(45)
const shengHealFullCap = shengHealPl.hp === shengHealPl.hpMax
assert(
  '生生不息 45s 回心',
  shengHealHold && shengHealOnce && shengHealFullCap && C42.BOND_SHENG_HEAL_SEC === 45,
)
assert(
  '生生不息 档3 数值待接线',
  C42.BOND_SHENG_HURT_SPEED_UNITS === 0.2 && C42.BOND_SHENG_HURT_SPEED_SEC === 1.5,
)
/* R5 生存双属：天行健 11 / 生生不息 5 / 小金刚 7，survive 同时计入天行健与生生不息。 */
const bondPick = (ids) => ids.map((id) => ({ id }))
const qianPickedIds = UPGRADES.filter((u) => C42.belongsToBond(u, BOND_QIAN)).map((u) => u.id)
const vajraPickedIds = UPGRADES.filter((u) => C42.belongsToBond(u, BOND_VAJRA)).map((u) => u.id)
const surviveDef = UPGRADES.find((u) => u.id === 'survive')
const qianCount11 = uniqueBondCount(bondPick(qianPickedIds), BOND_QIAN)
const shengCount5 = uniqueBondCount(bondPick(UPGRADES.filter((u) => C42.belongsToBond(u, 'sheng')).map((u) => u.id)), 'sheng')
const vajraCount7 = uniqueBondCount(bondPick(vajraPickedIds), BOND_VAJRA)
assert(
  '生存双属 天行健11',
  qianPickedIds.length === 11 &&
    qianCount11 === 11 &&
    shengCount5 === 5 &&
    vajraPickedIds.length === 7 &&
    vajraCount7 === 7 &&
    surviveDef?.bond === C42.BOND_SHENG &&
    C42.belongsToBond(surviveDef, BOND_QIAN) &&
    C42.belongsToBond(surviveDef, 'sheng') &&
    shengS.bonds.find((b) => b.id === 'sheng')?.rank === 5,
)
/* 三娃同时计入生生不息（主 bond）与小金刚（bonds 附加）——七兄弟档 7 保持可达。 */
assert(
  '三娃双羁绊（生生不息 + 小金刚）',
  UPGRADES.find((u) => u.id === 'sanwa')?.bond === C42.BOND_SHENG &&
    C42.belongsToBond(UPGRADES.find((u) => u.id === 'sanwa'), BOND_VAJRA),
)

const advAt5 = pickUpgradeChoices(null, 3, () => 0.9, { level: 5 })
assert('第5级必出高级', advAt5.length === 3 && advAt5.some((c) => c.tier === 'advanced'))
const advAll4 = pickUpgradeChoices(null, 3, () => 0, { level: 4 })
assert('level4 rng0 非必出不出高级', advAll4.length === 3 && !advAll4.some((c) => c.tier === 'advanced'))
const advNone4 = pickUpgradeChoices(null, 3, () => 0.9, { level: 4 })
assert('level4 rng0.9 全普通', advNone4.length === 3 && !advNone4.some((c) => c.tier === 'advanced'))
const advAll5 = pickUpgradeChoices(null, 3, () => 0, { level: 5 })
assert('level5 rng0 全高级', advAll5.length === 3 && advAll5.every((c) => c.tier === 'advanced'))

const erseTwo = createPistol()
erseTwo.applyUpgrade('erse')
erseTwo.applyUpgrade('erse')
const fourChoices = pickUpgradeChoices({ pistol: erseTwo, chargeMax: CHARGE_MAX_SEC }, 3, () => 0, {})
assert('二娃 2 层 rng0 变四选一', fourChoices.length === 4)
const threeChoices = pickUpgradeChoices({ pistol: erseTwo, chargeMax: CHARGE_MAX_SEC }, 3, () => 0.9, {})
assert('二娃 rng 高仍三选一', threeChoices.length === 3)
const zeroErse = pickUpgradeChoices({ pistol: createPistol(), chargeMax: CHARGE_MAX_SEC }, 3, () => 0, {})
assert('无二娃仍三选一', zeroErse.length === 3)

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
const hudMage = createSession().snapshot({ hp: 2, hpMax: 2 })
assert('HUD 跟 hpMax 法师', hudMage.hpMax === 2 && hudMage.hp === 2)
const hudWar = createSession().snapshot({ hp: 4, hpMax: 4 })
assert('HUD 跟 hpMax 战士', hudWar.hpMax === 4 && hudWar.hp === 4)
const hudRanger = createSession().snapshot({ hp: 3, hpMax: 3 })
assert('HUD 跟 hpMax 游侠', hudRanger.hpMax === 3)
const armorPl = createPlayer()
armorPl.addArmor(3)
assert('HUD armor 层数', createSession().snapshot(armorPl).armor === 3)
const mems = loadMemories()
assert('memory saved', mems.length >= 1 && mems[0].upgrades[0]?.title === '敏捷')
assert('memory 存 charId', typeof mems[0]?.charId === 'string')
assert('memory cap', MEMORY_CAP === 10)

/* ---- P42 批次3（TASK-026 / M6）：power「激发力量」 R1 主体 / R2 卡牌屏 / R3 边界 ---- */

const powerViewUrl = new URL('../views/PowerView.vue', import.meta.url)
const powerViewSrc = existsSync(powerViewUrl) ? readFileSync(powerViewUrl, 'utf8') : ''
const powerShellSrc = readFileSync(new URL('../views/GameShell.vue', import.meta.url), 'utf8')

/* R1① 池按角色：显示名「激发力量」、四个效果名、游侠 4 个 / 战士与法师只有 sp-power。 */
assert(
  'power 池按角色',
  C42.POWER_TITLE === '激发力量' &&
    C42.POWER_EVERY === 10 &&
    C42.POWER_EFFECTS?.map((e) => e.id).join() === 'rapid,pierce_amp,steady,sp' &&
    C42.POWER_EFFECTS?.map((e) => e.name).join() === '连射,贯穿强化,定神,sp-power' &&
    C42.POWER_UNIQUE_IDS?.join() === 'rapid,pierce_amp,steady' &&
    C42.powerPoolFor?.('ranger')?.join() === 'rapid,pierce_amp,steady,sp' &&
    C42.powerPoolFor?.('warrior')?.join() === 'sp' &&
    C42.powerPoolFor?.('mage')?.join() === 'sp' &&
    C42.powerCandidatesFor?.('ranger')?.length === 4 &&
    C42.powerCandidatesFor?.('warrior')?.map?.((e) => e.id).join() === 'sp' &&
    C42.powerCandidatesFor?.('mage')?.map?.((e) => e.id).join() === 'sp' &&
    C42.powerCandidatesFor?.('ranger', ['rapid', 'pierce_amp', 'steady'])?.map?.((e) => e.id).join() === 'sp' &&
    C42.powerEffectById?.('steady')?.name === '定神' &&
    C42.powerEffectById?.('nope') === null,
)

/* R1② 触发：每 10 级欠一次；先走完当次常规三选一，再单独进 power 屏（power 不占常规槽位）。 */
const pwCalls = []
const pwCtx = {
  player: { applyPower: (id) => { pwCalls.push(`player:${id}`); return true } },
  combat: { applyPower: (id) => { pwCalls.push(`combat:${id}`); return true } },
}
const pwS = createSession()
pwS.start('1')
pwS.setLevel(9)
const pwGained = pwS.addExp(expNeedForLevel(9), pwCtx)
const pwAt10 = pwS.level === 10 && pwGained === 1 && pwS.phase === 'levelup'
pwS.beginUpgradeOffer(pwCtx)
const pwUpgradeFirst = pwS.phase === 'upgrade' && pwS.pending === 1
const pwChoicesBefore = pwS.choices?.length ?? pwS.offer.length
const pwNormal = pwS.applyChoice('move_speed', pwCtx)
const pwEntered = pwS.phase === 'power'
const pwPool = (pwS.powerChoices ?? []).map((e) => e.id).join()
const pwTaken = pwS.applyPowerChoice?.('rapid', pwCtx)
const pwBack = pwS.phase === 'playing' && (pwS.powerChoices ?? []).length === 0
assert(
  'power 每10级触发',
  pwAt10 &&
    pwUpgradeFirst &&
    pwChoicesBefore === 3 &&
    pwNormal === true &&
    pwEntered &&
    pwPool === 'rapid,pierce_amp,steady,sp' &&
    pwTaken === true &&
    pwBack &&
    pwCalls.join() === 'combat:rapid,player:rapid' &&
    C42.powerDueAt?.(10) === true &&
    C42.powerDueAt?.(20) === true &&
    C42.powerDueAt?.(9) === false &&
    C42.powerDueAt?.(0) === false &&
    C42.powerDueCount?.(9, 10) === 1 &&
    C42.powerDueCount?.(9, 21) === 2 &&
    C42.powerDueCount?.(10, 19) === 0 &&
    C42.powerDueCount?.(10, 20) === 1,
)

/* R1③ 唯一性与可叠：三个唯一项各只一次，sp-power 可重复；拿满唯一项后池里只剩 sp。 */
const pwCalls3 = []
const pwCtx3 = {
  player: { applyPower: (id) => { pwCalls3.push(`player:${id}`); return true } },
  combat: { applyPower: (id) => { pwCalls3.push(`combat:${id}`); return true } },
}
const pwS3 = createSession()
pwS3.start('1')
const pwPools = []
/** 推进到下一个 power 屏（补经验 → 走完常规三选一），返回选卡结果。 */
function pwNext(id) {
  const target = (Math.floor(pwS3.level / 10) + 1) * 10
  pwS3.setLevel(target - 1)
  pwS3.addExp(expNeedForLevel(target - 1), pwCtx3)
  pwS3.beginUpgradeOffer(pwCtx3)
  pwS3.applyChoice('move_speed', pwCtx3)
  pwPools.push((pwS3.powerChoices ?? []).map((e) => e.id).join())
  return pwS3.applyPowerChoice?.(id, pwCtx3)
}
const pwR1 = pwNext('rapid')
const pwR2 = pwNext('pierce_amp')
const pwR3 = pwNext('steady')
const pwR4 = pwNext('sp')
const pwR5 = pwNext('sp')
assert(
  'power 唯一性与可叠',
  pwR1 === true &&
    pwR2 === true &&
    pwR3 === true &&
    pwR4 === true &&
    pwR5 === true &&
    pwPools.join(' | ') === 'rapid,pierce_amp,steady,sp | pierce_amp,steady,sp | steady,sp | sp | sp' &&
    pwS3.picked.filter((p) => p.id === 'power_rapid').length === 1 &&
    pwS3.picked.filter((p) => p.id === 'power_pierce_amp').length === 1 &&
    pwS3.picked.filter((p) => p.id === 'power_steady').length === 1 &&
    pwS3.picked.filter((p) => p.id === 'power_sp').length === 2 &&
    pwCalls3.join() ===
      'combat:rapid,player:rapid,combat:pierce_amp,player:pierce_amp,combat:steady,player:steady,combat:sp,player:sp,combat:sp,player:sp',
)

/* R1④ 强制选择：power 相位只能选池内卡；没有跳过/关闭接口；ESC / 设置 / 更多被屏蔽。 */
const pwForce = createSession()
pwForce.start('1')
pwForce.setLevel(9)
pwForce.addExp(expNeedForLevel(9), pwCtx3)
pwForce.beginUpgradeOffer(pwCtx3)
pwForce.applyChoice('move_speed', pwCtx3)
const pwForceHeld =
  pwForce.phase === 'power' &&
  (pwForce.powerChoices ?? []).length === 4 &&
  pwForce.applyChoice('move_speed', pwCtx3) === false &&
  pwForce.tick(5) === false &&
  pwForce.beginUpgradeOffer(pwCtx3) === true &&
  pwForce.applyPowerChoice?.('nope', pwCtx3) === false &&
  pwForce.phase === 'power' &&
  (pwForce.powerChoices ?? []).length === 4
assert(
  'power 强制选择',
  pwForceHeld &&
    pwS3.applyPowerChoice?.('sp', pwCtx3) === false &&
    pwS3.phase === 'playing' &&
    typeof pwS3.skipPower === 'undefined' &&
    typeof pwS3.closePower === 'undefined' &&
    typeof pwS3.dismissPower === 'undefined' &&
    powerShellSrc.includes('function powerChoosing') &&
    /if \(powerChoosing\(\)\) return/.test(powerShellSrc) &&
    powerShellSrc.includes('v-if="!powerChoosing()"') &&
    /!powerChoosing\(\) &&/.test(powerShellSrc) &&
    /hud\.phase === 'power'/.test(powerShellSrc),
)

/* R2 卡牌屏：PowerView.vue 存在、卡牌循环漂移 + scaleX 两段 steps() 翻转、底部「选一张」、无 png。 */
assert(
  'power 卡牌界面结构',
  existsSync(powerViewUrl) &&
    powerShellSrc.includes('PowerView') &&
    powerShellSrc.includes("hud.phase === 'power'") &&
    powerShellSrc.includes('applyPowerChoice') &&
    powerViewSrc.includes("import PixelIcon from './PixelIcon.vue'") &&
    powerViewSrc.includes('powerMemoryId') &&
    powerViewSrc.includes('rl-frame') &&
    powerViewSrc.includes('requestAnimationFrame') &&
    powerViewSrc.includes('scaleX') &&
    powerViewSrc.includes('steps(') &&
    /@keyframes rl-power-flip/.test(powerViewSrc) &&
    /c\.x -= span/.test(powerViewSrc) &&
    /c\.x \+= span/.test(powerViewSrc) &&
    /SPEED = POWER_CARD_SPEED/.test(powerViewSrc) &&
    /BOB_MIN = POWER_CARD_BOB_MIN/.test(powerViewSrc) &&
    /BOB_MAX = POWER_CARD_BOB_MAX/.test(powerViewSrc) &&
    /GAP = POWER_CARD_GAP/.test(powerViewSrc) &&
    /width: var\(--rl-power-card-w\)/.test(powerViewSrc) &&
    powerViewSrc.includes('选一张') &&
    /\.rl-power-hint\s*\{[^}]*text-shadow/.test(powerViewSrc) &&
    !/\.rl-power-hint\s*\{[^}]*background/.test(powerViewSrc) &&
    !/\.rl-power-hint\s*\{[^}]*border/.test(powerViewSrc) &&
    !/\.png/.test(powerViewSrc) &&
    !powerViewSrc.includes('skipPower'),
)

/* R3① 不计入羁绊：power 回忆 id 不进 UPGRADES，任何羁绊计数都是 0。 */
const pwMemIds = ['power_rapid', 'power_pierce_amp', 'power_steady', 'power_sp']
assert(
  'power 不计入羁绊',
  pwMemIds.every((id) => C42.upgradeById?.(id) === null) &&
    pwMemIds.every((id) => C42.belongsToBond?.(C42.upgradeById(id), BOND_QIAN) === false) &&
    [BOND_QIAN, BOND_UNITY, BOND_VAJRA, 'sheng'].every(
      (bond) => uniqueBondCount(pwMemIds.map((id) => ({ id })), bond) === 0,
    ) &&
    listActiveBonds(pwMemIds.map((id) => ({ id }))).length === 0 &&
    listActiveBonds(pwS3.picked).length === 0 &&
    pwS3.bonds.length === 0,
)

/* R3② 回忆记录：每次 power 一条（空白图标 +「激发力量」，悬停看本次效果名）。 */
const pwMemRec = pwS3.recordMemory(pwCtx3)
const pwMemUps = pwMemRec.upgrades.filter((u) => String(u.id).startsWith('power_'))
assert(
  'power 回忆记录',
  pwMemUps.length === 5 &&
    pwMemUps.every((u) => u.title === '激发力量') &&
    pwMemUps.map((u) => u.id).join() ===
      'power_rapid,power_pierce_amp,power_steady,power_sp,power_sp' &&
    pwMemUps.map((u) => u.desc).join() === '连射,贯穿强化,定神,sp-power,sp-power' &&
    C42.powerMemoryId?.('rapid') === 'power_rapid' &&
    C42.powerEffectFromMemoryId?.('power_rapid')?.name === '连射' &&
    C42.powerEffectFromMemoryId?.('power') === null &&
    resolveUpgradeIcon('power_rapid', false).kind === 'blank' &&
    !existsSync(new URL('../../public/assets/upgrades/power_rapid.png', import.meta.url)) &&
    descFor('power_rapid').includes('激发力量') &&
    descFor('power_rapid').includes('连射') &&
    descFor('power') === '伤害 +10' &&
    summarizePicked(pwMemRec.upgrades).find((u) => u.id === 'power_sp')?.count === 2,
)

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
/* P42 批次5：难度二门槛 720s（用命名空间取，缺实现时断言 FAIL 而不是链接期崩）。 */
const diff2Sec = C42.SURVIVE_WIN_SEC_DIFF2 ?? 999
const sDiff2 = createSession()
sDiff2.start('2')
sDiff2.tick(SURVIVE_WIN_SEC)
assert(
  '难度二 600s 不胜（门槛 720s）',
  sDiff2.phase === 'playing' && sDiff2.win === false && sDiff2.bossKills === 0 && sDiff2.elapsedSec >= SURVIVE_WIN_SEC,
)
assert('addBossKill 1 仍继续', sDiff2.addBossKill() === 1 && sDiff2.phase === 'playing' && sDiff2.win === false)
assert(
  '难度二 2 杀但不满 720s 仍不胜',
  sDiff2.addBossKill() === 2 && sDiff2.phase === 'playing' && sDiff2.win === false,
)
sDiff2.tick(diff2Sec - SURVIVE_WIN_SEC)
assert('难度二补满 720s 才通关', sDiff2.phase === 'victory' && sDiff2.win === true)
const sDiff2t = createSession()
sDiff2t.start('2')
assert(
  '难度二拨满时间不胜',
  sDiff2t.setElapsedSec(600) === 600 && sDiff2t.phase === 'playing',
)
assert(
  '难度二拨到 720 仍缺 Boss 不胜',
  sDiff2t.setElapsedSec(diff2Sec) === diff2Sec && sDiff2t.phase === 'playing',
)
sDiff2t.addBossKill()
sDiff2t.addBossKill()
assert('难度二补杀通关', sDiff2t.phase === 'victory' && sDiff2t.bossKills === 2)
assert('exp 31 uncapped', expNeedForLevel(31) === EXP_BASE + 4 * 31)
assert('boost max 0–3', LEVEL_BOOST_MAX === 3 && clampLevelBoost(9) === 3 && clampLevelBoost(-2) === 0)

const sLevels = createSession()
sLevels.start('1')
const two = sLevels.addExp(expNeedForLevel(0) + expNeedForLevel(1))
assert(
  '连升两级不封顶',
  two === 2 && sLevels.level === 2 && sLevels.pending === 2 && sLevels.phase === 'levelup' && sLevels.offer.length === 0,
)

assert('growth every 5', LEVEL_GROWTH_EVERY === 5 && LEVEL_GROWTH_ATK === 1 && LEVEL_GROWTH_SPEED === 0.05)
assert('steps 1→6', levelGrowthSteps(1, 6) === 1)
assert('steps 6→11', levelGrowthSteps(6, 11) === 1)
assert('steps 4→7', levelGrowthSteps(4, 7) === 1)
assert('steps 1→4', levelGrowthSteps(1, 4) === 0)
assert('empty hp every 10', LEVEL_EMPTY_HP_EVERY === 10)
assert('empty steps 1→11', emptyHpSteps(1, 11) === 1)
assert('empty steps 11→21', emptyHpSteps(11, 21) === 1)
assert('empty steps 1→10', emptyHpSteps(1, 10) === 0)
assert('empty steps 10→11', emptyHpSteps(10, 11) === 1)
assert('pierce every 15', LEVEL_PIERCE_EVERY === 15)
assert('pierce steps 1→16', pierceGrowthSteps(1, 16) === 1)
assert('pierce steps 16→31', pierceGrowthSteps(16, 31) === 1)
assert('pierce steps 1→15', pierceGrowthSteps(1, 15) === 0)
assert('pierce steps 15→16', pierceGrowthSteps(15, 16) === 1)
assert('applyPierceGrowth 无武器 不崩', applyPierceGrowth({}, 1, 16) === 0)

function expSum(from, to) {
  let n = 0
  for (let lv = from; lv < to; lv++) n += expNeedForLevel(lv)
  return n
}

const grow1 = createPlayer()
grow1.attack = 20
const grow1Spd = grow1.speedUnits
const sGrow1 = createSession()
sGrow1.start('1')
sGrow1.setLevel(1)
sGrow1.addExp(expSum(1, 6), { player: grow1 })
assert(
  '升级不白送成长',
  sGrow1.level === 6 &&
    grow1.attack === 20 &&
    Math.abs(grow1.speedUnits - grow1Spd) < 1e-9,
)

const grow2 = createPlayer()
grow2.attack = 20
const grow2Spd = grow2.speedUnits
const sGrow2 = createSession()
sGrow2.start('1')
sGrow2.setLevel(6)
sGrow2.addExp(expSum(6, 11), { player: grow2 })
assert(
  '6→11 仍不白送',
  sGrow2.level === 11 &&
    grow2.attack === 20 &&
    Math.abs(grow2.speedUnits - grow2Spd) < 1e-9,
)

const grow3 = createPlayer()
grow3.attack = 20
const grow3Spd = grow3.speedUnits
const sGrow3 = createSession()
sGrow3.start('1')
sGrow3.setLevel(4)
assert(
  'boost 不白送成长',
  sGrow3.boostLevels(3, { player: grow3 }) === 3 &&
    sGrow3.level === 7 &&
    grow3.attack === 20 &&
    Math.abs(grow3.speedUnits - grow3Spd) < 1e-9,
)
assert('growth 无 player 不崩', createSession().start('1') && createSession().boostLevels(3) === 3)

const hpEmpty = createPlayer()
const hpWas = hpEmpty.hp
const maxWas = hpEmpty.hpMax
let emptyCalls = 0
const origEmpty = hpEmpty.addEmptyHpMax.bind(hpEmpty)
hpEmpty.addEmptyHpMax = () => {
  emptyCalls += 1
  return origEmpty()
}
const sHp = createSession()
sHp.start('1')
sHp.setLevel(1)
sHp.addExp(expSum(1, 11), { player: hpEmpty })
assert(
  '升级不白送空血',
  sHp.level === 11 &&
    emptyCalls === 0 &&
    hpEmpty.hpMax === maxWas &&
    hpEmpty.hp === hpWas,
)
assert('applyEmptyHpMax 无 player 不崩', applyEmptyHpMax({}, 1, 11) === 0)

const pierceBow = createPistol()
const sPierce = createSession()
sPierce.start('1')
sPierce.setLevel(1)
sPierce.addExp(expSum(1, 16), { pistol: pierceBow })
assert('升级不白送穿透', sPierce.level === 16 && !pierceBow.pierceBonus)
const pierceBoost = createPistol()
const sPierceB = createSession()
sPierceB.start('1')
sPierceB.setLevel(14)
assert(
  'boost 不白送穿透',
  sPierceB.boostLevels(3, { pistol: pierceBoost }) === 3 &&
    sPierceB.level === 17 &&
    !pierceBoost.pierceBonus,
)

const hpBoost = createPlayer()
const hpBoostWas = hpBoost.hp
const sHpB = createSession()
sHpB.start('1')
sHpB.setLevel(9)
assert('setLevel 不加空血', hpBoost.hpMax === 3 && hpBoost.hp === hpBoostWas)
assert(
  'boost 不白送空血',
  sHpB.boostLevels(3, { player: hpBoost }) === 3 &&
    sHpB.level === 12 &&
    hpBoost.hpMax === 3 &&
    hpBoost.hp === hpBoostWas,
)

const sQian = createSession()
sQian.start('1')
sQian.setLevel(1)
const qianPl = createPlayer()
const qianBow = createPistol()
qianPl.attack = 20
const qianSpd = qianPl.speedUnits
assert(
  '1种 qian 无档',
  sQian.grantUpgrade('move_speed', { player: qianPl, pistol: qianBow }) === true &&
    sQian.bonds.length === 0 &&
    Math.abs(qianPl.speedUnits - (qianSpd + MOVE_SPEED_BONUS)) < 1e-9,
)
assert(
  '选 2 种 qian 才有速',
  sQian.grantUpgrade('power', { player: qianPl, pistol: qianBow }) === true &&
    sQian.bonds.length === 1 &&
    sQian.bonds[0].id === BOND_QIAN &&
    sQian.bonds[0].title === BOND_QIAN_TITLE &&
    sQian.bonds[0].rank === 2,
)
sQian.addExp(expSum(1, 6), { player: qianPl, pistol: qianBow })
assert(
  '天行健 2 按等级加移速',
  sQian.level === 6 &&
    Math.abs(qianPl.speedUnits - (qianSpd + MOVE_SPEED_BONUS + 0.03)) < 1e-9 &&
    qianPl.attack === 20 &&
    qianBow.attack === 30,
)
const snapBond = sQian.snapshot(qianPl, { pistol: qianBow })
assert('bonds 快照', snapBond.bonds?.[0]?.rank === 2 && snapBond.bonds[0].title === BOND_QIAN_TITLE)

const sDup = createSession()
sDup.start('1')
const dupPl = createPlayer()
const dupBow = createPistol()
sDup.grantUpgrade('power', { player: dupPl, pistol: dupBow })
sDup.grantUpgrade('power', { player: dupPl, pistol: dupBow })
assert('叠力量两次仍 1 种', sDup.bonds.length === 0 && sDup.picked.length === 2)

const sUnity = createSession()
sUnity.start('1')
let unityTier = -1
const unityComps = {
  setUnityTier(t) { unityTier = t },
  addGoblin() {},
  addRabbit() {},
  addBat() {},
  addEgg() {},
}
assert('跟班新升级入万物一心', ['tamer', 'demon', 'slime_gg', 'companionship'].every((id) => UPGRADES.find((u) => u.id === id)?.bond === BOND_UNITY))
sUnity.grantUpgrade('goblin', { companions: unityComps })
assert('unity 1 种无档', unityTier === 0 && sUnity.bonds.length === 0)
sUnity.grantUpgrade('rabbit', { companions: unityComps })
assert(
  'unity 2 种档 2',
  unityTier === 2 &&
    sUnity.bonds.some((b) => b.id === BOND_UNITY && b.title === BOND_UNITY_TITLE && b.rank === 2),
)
sUnity.grantUpgrade('bat', { companions: unityComps })
assert('unity 3 种仍档 2', unityTier === 2)
sUnity.grantUpgrade('strange_egg', { companions: unityComps })
assert(
  'unity 4 种档 4',
  unityTier === 4 &&
    sUnity.bonds.some((b) => b.id === BOND_UNITY && b.title === BOND_UNITY_TITLE && b.rank === 4),
)
const unityHost = { addGoblin() {}, addRabbit() {}, addBat() {}, addEgg() {} }
const sUnityP = createSession()
sUnityP.start('1')
sUnityP.grantUpgrade('goblin', { companions: unityHost })
sUnityP.grantUpgrade('rabbit', { companions: unityHost })
sUnityP.grantUpgrade('bat', { companions: unityHost })
assert('unity pending 3 种档 2', unityHost.pendingUnityTier === 2)
sUnityP.grantUpgrade('strange_egg', { companions: unityHost })
assert('unity pending 4 种档 4', unityHost.pendingUnityTier === 4)

const sVajra = createSession()
sVajra.start('1')
const vajraPl = createPlayer()
const vajraBow = createPistol()
const vajraEnv = createEnvironment({ random: () => 0.5 })
const vajraCtx = { player: vajraPl, pistol: vajraBow, env: vajraEnv }
const vajraChip = () => sVajra.bonds.find((b) => b.id === BOND_VAJRA)
sVajra.grantUpgrade('giant', vajraCtx)
assert('vajra 1 种无档', vajraChip() === undefined)
sVajra.grantUpgrade('blackhole', vajraCtx)
assert('vajra 2 种仍无档', vajraChip() === undefined)
sVajra.grantUpgrade('erse', vajraCtx)
sVajra.grantUpgrade('sanwa', vajraCtx)
sVajra.grantUpgrade('siwa', vajraCtx)
sVajra.grantUpgrade('wuwa', vajraCtx)
sVajra.grantUpgrade('liuwa', vajraCtx)
assert(
  'vajra 集齐 7 才显示 档 7',
  vajraChip()?.rank === 7 && vajraChip()?.title === BOND_VAJRA_TITLE,
)
assert(
  'vajra 档位文案',
  bondTiers(BOND_VAJRA).length === 2 &&
    bondTiers(BOND_VAJRA).every((t) => t.rank === 7) &&
    bondTiers(BOND_VAJRA)[0].text.includes('七色脉冲') &&
    bondTiers(BOND_VAJRA)[1].text.includes('再获得一次'),
)

const sSanwa = createSession()
sSanwa.start('1')
sSanwa.setLevel(1)
const sanwaPl = createPlayer()
const sanwaBow = createPistol()
const sanwaEnv = createEnvironment({ random: () => 0.5 })
const sanwaCtx = { player: sanwaPl, pistol: sanwaBow, env: sanwaEnv }
assert('三娃立即 +1 甲', sSanwa.grantUpgrade('sanwa', sanwaCtx) === true && sanwaPl.armor === 1)
sSanwa.grantUpgrade('sanwa', sanwaCtx)
assert('三娃可叠两次 +2 甲', sanwaPl.armor === 2)
// 第 2 次已选 → N = max(1, 11-2) = 9；升 9 级再给 1 甲。
sSanwa.addExp(expSum(1, 10), sanwaCtx)
assert('三娃每9级再1甲', sanwaPl.armor === 3)

const uiBoss = createMatchUi()
uiBoss.start('2')
assert('matchUi addBossKill', typeof uiBoss.addBossKill === 'function' && uiBoss.addBossKill() === 1)

const sKeep = createSession()
sKeep.charId = 'mage'
sKeep.start('1')
assert('开局保留 charId', sKeep.charId === 'mage' && sKeep.phase === 'playing')
assert('CHAR_HP 三角色', CHAR_HP.ranger === 3 && CHAR_HP.warrior === 4 && CHAR_HP.mage === 2)
const sHearts = createSession()
sHearts.charId = 'mage'
assert('HUD 法师 2 心', sHearts.snapshot().hpMax === 2 && sHearts.snapshot().hp === 2)
sHearts.charId = 'warrior'
assert('HUD 战士 4 心', sHearts.snapshot().hpMax === 4)
sHearts.charId = 'ranger'
assert('HUD 游侠 3 心', sHearts.snapshot().hpMax === 3)
const mageHud = createPlayer({ charId: 'mage' })
assert('HUD 跟 player 法师', sHearts.snapshot(mageHud).hpMax === mageHud.hpMax && mageHud.hpMax === 2)
const warHud = createPlayer({ charId: 'warrior' })
assert('HUD 跟 player 战士', sHearts.snapshot(warHud).hpMax === warHud.hpMax && warHud.hpMax === 4)

const sTime = createSession()
sTime.start('1')
assert('setElapsedSec', typeof sTime.setElapsedSec === 'function' && sTime.setElapsedSec(125) === 125 && formatTime(125) === '02:05')
assert('setElapsedSec 通关', sTime.setElapsedSec(600) === 600 && sTime.phase === 'victory')
const sMenuT = createSession()
assert('菜单拨时间不通关', sMenuT.setElapsedSec(600) === 600 && sMenuT.phase === 'menu')
const sDone = createSession()
sDone.start('1')
sDone.tick(12)
sDone.finish()
const doneT = sDone.elapsedSec
assert(
  '结算不改时间',
  sDone.setElapsedSec(90) === doneT && sDone.elapsedSec === doneT && sDone.phase === 'result',
)

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
    sBoost.level === 3 &&
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
  boostPicks === 3 && sBoost.pending === 0 && sBoost.phase === 'playing' && sBoost.level === 3,
)

const sHome = createSession()
sHome.pause('menu')
sHome.resume()
assert('home settings 不改等级', sHome.level === 0 && sHome.pending === 0 && sHome.phase === 'menu')

assert('bgm url', BGM_URL === '/assets/游戏音乐/music.ogg')
assert('ranger idle url', RANGER_IDLE_SRC === '/assets/characters/1/S_Idle.png')
assert('warrior idle url', WARRIOR_IDLE_SRC === '/assets/characters/2/S_Idle.png')
assert('mage idle url', MAGE_IDLE_SRC === '/assets/characters/3/S_Idle.png')
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
assert('warrior idle file', existsSync(join(here, '../../public/assets/characters/2/S_Idle.png')))
assert('mage idle file', existsSync(join(here, '../../public/assets/characters/3/S_Idle.png')))
assert('empower_shot png', existsSync(join(here, '../../public/assets/upgrades/empower_shot.png')))
assert('strange_egg png', existsSync(join(here, '../../public/assets/upgrades/strange_egg.png')))
assert('bat png', existsSync(join(here, '../../public/assets/upgrades/bat.png')))

assert(
  'sfx 10 键（含 UI 按压声）',
  Object.keys(SFX_URLS).length === 10 &&
    ['shoot', 'slash', 'fireball', 'pickup', 'levelup', 'heartbeat', 'defeat', 'victory', 'hurt', 'ui_click'].every(
      (k) => typeof SFX_URLS[k] === 'string',
    ),
)
assert(
  'sfx 路径',
  SFX_URLS.shoot === '/assets/游戏音乐/射箭声音.wav' &&
    SFX_URLS.hurt === '/assets/游戏音乐/受伤音效.mp3' &&
    SFX_URLS.heartbeat === '/assets/游戏音乐/低血量心跳.mp3' &&
    SFX_URLS.victory === '/assets/游戏音乐/通关音效.ogg' &&
    SFX_URLS.ui_click === '/assets/ui/ui-click.wav' &&
    Object.entries(SFX_URLS)
      .filter(([name]) => name !== 'ui_click')
      .every(([, url]) => url.startsWith('/assets/游戏音乐/')),
)
assert(
  'sfx 文件在',
  Object.entries(SFX_FILES)
    .filter(([name]) => name !== 'ui_click')
    .every(([, file]) => existsSync(join(here, '../../public/assets/游戏音乐/', file))) &&
    existsSync(join(here, '../../public/assets/ui/', SFX_FILES.ui_click)),
)
class FakeAudio {
  constructor(url) {
    this.url = url
    this.volume = 1
    FakeAudio.instances.push(this)
    FakeAudio.last = this
  }
  play() {
    this.played = true
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
}
FakeAudio.instances = []
const sfxA = createSfx({ audioCtor: FakeAudio })
assert(
  'sfx play 一次',
  sfxA.play('levelup') === true && FakeAudio.last.played === true && FakeAudio.last.url === SFX_URLS.levelup,
)
assert('sfx 未知不播', sfxA.play('nope') === false)
assert('sfx UI 按压声', sfxA.play('ui_click') === true && FakeAudio.last.url === SFX_URLS.ui_click)
assert('SFX_GAIN 表', SFX_GAIN.pickup > 1 && SFX_GAIN.levelup > 1 && (SFX_GAIN.slash ?? 1) === 1)
const sfxGain = createSfx({ audioCtor: FakeAudio, volume: 0.1 })
sfxGain.play('pickup')
assert('sfx pickup 增益×2.5', Math.abs(FakeAudio.last.volume - 0.25) < 1e-9)
sfxGain.play('levelup')
assert('sfx levelup 增益×2.8', Math.abs(FakeAudio.last.volume - 0.28) < 1e-9)
sfxGain.play('slash')
assert('sfx 缺省无增益', FakeAudio.last.volume === 0.1)
const sfxCap = createSfx({ audioCtor: FakeAudio })
sfxCap.play('pickup')
assert('sfx 增益钳制 ≤1', FakeAudio.last.volume === 1)
const sfxHold = createSfx({ audioCtor: FakeAudio })
assert(
  'sfx 持有引用 preload',
  sfxHold.play('pickup') === true &&
    sfxHold.play('pickup') === true &&
    sfxHold.activeCount() === 2 &&
    FakeAudio.instances.at(-1).preload === 'auto',
)
FakeAudio.instances.at(-1).onended()
assert('sfx ended 释放', sfxHold.activeCount() === 1)
FakeAudio.instances.at(-2).onerror()
assert('sfx error 释放', sfxHold.activeCount() === 0)
const sfxB = createSfx({ audioCtor: FakeAudio, volume: 0.4 })
assert(
  '心跳循环独占',
  sfxB.startHeartbeat() === true && sfxB.isHeartbeatOn() === true && FakeAudio.last.loop === true && sfxB.startHeartbeat() === false,
)
assert('心跳音量跟随', sfxB.setVolume(0.42) === 0.42 && FakeAudio.last.volume === 0.42)
assert(
  '心跳停即停',
  sfxB.stopHeartbeat() === true && sfxB.isHeartbeatOn() === false && FakeAudio.last.paused === true && sfxB.stopHeartbeat() === false,
)

const pixelSrc = readFileSync(join(here, '../views/PixelIcon.vue'), 'utf8')
assert('PixelIcon loads png url', pixelSrc.includes('upgradeIconUrl'))
assert('PixelIcon paints blank', pixelSrc.includes('paintBlankIcon'))
assert('PixelIcon never paintIcon', !pixelSrc.includes('paintIcon'))
assert('PixelIcon advanced dot', pixelSrc.includes('paintAdvancedDot') && pixelSrc.includes('isAdvanced'))

const upgradeSrc = readFileSync(join(here, '../views/UpgradeView.vue'), 'utf8')
assert('三选一传 advanced', upgradeSrc.includes(':advanced'))
assert('三选一 descFor', upgradeSrc.includes('descFor') && upgradeSrc.includes('charId'))
assert('升级卡浮起框', upgradeSrc.includes('rl-frame--pop'))

const shellSrc = readFileSync(join(here, '../views/GameShell.vue'), 'utf8')
assert('shell boostLevels on close', shellSrc.includes('boostLevels'))
assert('shell +/- 不 setLevel', !shellSrc.includes('setLevel'))
assert('shell BGM shared', shellSrc.includes('getSharedBgm'))
assert('shell 写入 charId', shellSrc.includes('session.charId') && shellSrc.includes('onPickChar'))
assert('shell setElapsedSec', shellSrc.includes('setElapsedSec'))
assert('shell picker ESC', shellSrc.includes('isUpgradePickerOpen') && shellSrc.includes('grant-upgrade'))
assert('shell bonds', shellSrc.includes('rl-bonds') && shellSrc.includes('hud.bonds') && shellSrc.includes('grantUpgrade'))
assert('shell 小金刚通用chip', shellSrc.includes('{{ b.title }} {{ b.rank }}') && !shellSrc.includes('b.count') && !shellSrc.includes('变身'))
assert(
  'shell sfx 4 相位',
  shellSrc.includes('getSharedSfx') &&
    shellSrc.includes("play('levelup')") &&
    shellSrc.includes("play('defeat')") &&
    shellSrc.includes("play('victory')") &&
    shellSrc.includes('startHeartbeat') &&
    shellSrc.includes('stopHeartbeat'),
)
assert(
  'shell 羁绊悬停',
  shellSrc.includes('rl-bond-tip') && shellSrc.includes('bondTiers') && shellSrc.includes('BOND_DESC'),
)
assert('shell 传 charId', shellSrc.includes('hud.charId'))
assert('shell sfxVolume 分控', shellSrc.includes('settings.sfxVolume'))
assert('shell 音量乘积', shellSrc.includes('applyVolumes') && shellSrc.includes('bgmVolume'))
assert(
  'P39 全局设置与音频快捷控制',
  shellSrc.includes('QuickAudioControls') &&
    shellSrc.includes('rl-global-controls') &&
    shellSrc.includes('toggleBgm') &&
    shellSrc.includes('toggleSfx') &&
    shellSrc.includes("sfx.play('ui_click')") &&
    shellSrc.includes("window.addEventListener('click', onButtonClick)"),
)
assert(
  'P40 边缘控件高于转场',
  shellSrc.includes("'frame-transition'") && shellSrc.includes('rl-global-controls') && shellSrc.includes('z-index: 120'),
)
const quickAudioSrc = readFileSync(join(here, '../views/QuickAudioControls.vue'), 'utf8')
assert(
  'P39 静音图标状态可辨识',
  quickAudioSrc.includes('aria-pressed') &&
    quickAudioSrc.includes('muted') &&
    quickAudioSrc.includes('slash') &&
    quickAudioSrc.includes('bgm-toggle.png') &&
    quickAudioSrc.includes('sfx-toggle.png'),
)
assert(
  'P39 图标素材在运行时目录',
  ['bgm-toggle.png', 'sfx-toggle.png'].every((file) => {
    const path = join(here, '../../public/assets/ui/', file)
    return existsSync(path) && readFileSync(path).length >= 80
  }),
)

const hudSrc = readFileSync(join(here, '../views/HudOverlay.vue'), 'utf8')
assert(
  'HUD 心跟 hpMax',
  hudSrc.includes('hearts(hp, hpMax)') && hudSrc.includes('hpMax') && !hudSrc.includes('default: 3'),
)
assert(
  'HUD 双通栏',
  hudSrc.includes('rl-topbar') && hudSrc.includes('rl-botbar') && hudSrc.includes('rl-frame--dark'),
)
assert('HUD 护甲显示', hudSrc.includes('armor') && hudSrc.includes('rl-armor'))

const startSrc = readFileSync(join(here, '../views/StartView.vue'), 'utf8')
assert('char RangerPortrait', startSrc.includes('RangerPortrait') && startSrc.includes('CHARACTERS'))
assert('char 解锁三角色', startSrc.includes('ch.id') && startSrc.includes('pick-char') && !startSrc.includes('敬请期待'))
assert('char hover stats', startSrc.includes('formatCharStats') && startSrc.includes('rl-char-tip'))
assert('选角 hover 待机动画', startSrc.includes('animate') && startSrc.includes('hoverId'))
assert('选角脚下阴影', startSrc.includes('Shadow.png') && startSrc.includes('rl-avatar-shadow'))
assert('难度悬停目标', startSrc.includes('OBJECTIVE_TEXT') && startSrc.includes('OBJECTIVE_TEXT_TWO') && startSrc.includes('DIFFICULTY_TWO') && startSrc.includes('rl-diff-pick'))
assert('char 不用人', !startSrc.includes('人'))

const portraitSrc = readFileSync(join(here, '../views/RangerPortrait.vue'), 'utf8')
assert('idle frame0 flip', portraitSrc.includes('RANGER_IDLE_SRC') && portraitSrc.includes('scale(-1, 1)') && portraitSrc.includes('props.src'))

const settingsSrc = readFileSync(join(here, '../views/SettingsView.vue'), 'utf8')
assert('提高等级文案', settingsSrc.includes('提高等级') && settingsSrc.includes('clampLevelBoost'))
assert('刷怪速度文案', settingsSrc.includes('刷怪速度') && !settingsSrc.includes('刷怪概率'))
assert('满蓄模式文案', settingsSrc.includes('满蓄模式') && !settingsSrc.includes('无限弹药'))
assert('测试时间滑条', settingsSrc.includes('testElapsedSec') && settingsSrc.includes('TEST_ELAPSED_MAX'))
assert('升级选项自选', settingsSrc.includes('升级选项自选') && settingsSrc.includes('grant-upgrade') && settingsSrc.includes('UPGRADES'))
assert('自选红 X', settingsSrc.includes('rl-picker-x') && settingsSrc.includes('isUpgradePickerOpen'))
assert(
  '自选面板按角色过滤',
  settingsSrc.includes('availableUpgrades') &&
    !settingsSrc.includes('v-for="u in UPGRADES"') &&
    !availableUpgrades(null, { tier: 'normal', charId: 'warrior' }).some((u) => u.id === 'empower_shot') &&
    !availableUpgrades(null, { tier: 'advanced', charId: 'warrior' }).some((u) => u.id === 'empower_shot') &&
    !availableUpgrades(null, { tier: 'normal', charId: 'mage' }).some((u) => u.id === 'empower_shot') &&
    !availableUpgrades(null, { tier: 'advanced', charId: 'mage' }).some((u) => u.id === 'empower_shot') &&
    availableUpgrades(null, { tier: 'normal', charId: 'ranger' }).length > 0 &&
    availableUpgrades(null, { tier: 'advanced', charId: 'ranger' }).some((u) => u.id === 'empower_shot'),
)
assert(
  '自选面板传真实chargeMax',
  /* 源码断言：SettingsView 有 chargeMax prop 且不再以 null 调 availableUpgrades；GameShell 有 charge-max 传参。 */
  /chargeMax:\s*\{\s*type:\s*Number/.test(settingsSrc) &&
    settingsSrc.includes('props.chargeMax') &&
    !/availableUpgrades\(\s*null/.test(settingsSrc) &&
    /(?:^|[\s"'])(?::)?charge-max\s*=/.test(shellSrc) &&
    shellSrc.includes('CHARGE_MAX_SEC') &&
    /* 行为断言：真实 chargeMax 决定 only_fast 是否进池。 */
    availableUpgrades({ chargeMax: 0 }, { tier: 'normal' }).some((u) => u.id === 'only_fast') &&
    !availableUpgrades({ chargeMax: 0.75 }, { tier: 'normal' }).some((u) => u.id === 'only_fast'),
)
assert('火柴人开关', settingsSrc.includes('火柴人') && settingsSrc.includes('testDummy'))
assert('音效音量滑条', settingsSrc.includes('音效音量') && settingsSrc.includes('onSfxVolumeInput'))
assert('测试排版两列', settingsSrc.includes('rl-test-toggles') && settingsSrc.includes('rl-nudge--inline'))
assert(
  '三滑条文案',
  settingsSrc.includes('总音量') && settingsSrc.includes('背景音乐') && settingsSrc.includes('onBgmVolumeInput'),
)
assert(
  '测试右侧面板',
  settingsSrc.includes('rl-settings-cols') && settingsSrc.includes('rl-settings-test'),
)
assert('UpgradeView 仅 upgrade', shellSrc.includes("hud.phase === 'upgrade'") && shellSrc.includes('beginUpgradeOffer') === false)
assert('matchUi beginUpgradeOffer', typeof createMatchUi().beginUpgradeOffer === 'function')

const moreSrc = readFileSync(join(here, '../views/MoreView.vue'), 'utf8')
assert('回忆用 PixelIcon', moreSrc.includes('PixelIcon') && moreSrc.includes('summarizePicked'))
assert('回忆角色立绘', moreSrc.includes('RangerPortrait') && moreSrc.includes('memCharId') && moreSrc.includes('memIdleSrc'))
assert(
  '回忆羁绊模块',
  moreSrc.includes('rl-mem-bond-rail') && moreSrc.includes('listActiveBonds') && moreSrc.includes('BOND_DESC') && moreSrc.includes('bondTiers'),
)
assert(
  '回忆羁绊裸 chip',
  moreSrc.includes('rl-bond-tip') && moreSrc.includes('reached') && !moreSrc.includes('rl-mem-bonds'),
)
assert('回忆立绘悬停/阴影', moreSrc.includes('rl-mem-char-tip') && moreSrc.includes('rl-mem-shadow') && moreSrc.includes('Shadow.png') && moreSrc.includes(':animate'))
assert('回忆 ×n 无序号文案', moreSrc.includes('×{{ u.count }}') && !moreSrc.includes('i + 1') && !moreSrc.includes('u.title'))
assert('回忆悬停效果', moreSrc.includes('descFor') && moreSrc.includes('rl-mem-tip') && moreSrc.includes(':title'))
assert('回忆也显示 ×1', moreSrc.includes('×{{ u.count }}') && !moreSrc.includes('u.count > 1'))
assert('回忆等级醒目', moreSrc.includes('rl-mem-lv'))
const pixelCss = readFileSync(join(here, 'pixel.css'), 'utf8')
assert('回忆 ×000 槽', pixelCss.includes('4ch') && pixelCss.includes('rl-mem-mult'))
assert('回忆 tip 不占布局', pixelCss.includes('.rl-mem-tip') && pixelCss.includes('position: absolute'))
assert('char tip', pixelCss.includes('.rl-char-tip') && pixelCss.includes('.rl-pick:hover .rl-char-tip'))
assert('char tip pre-line', pixelCss.includes('white-space: pre-line'))
assert('bonds 右侧', pixelCss.includes('.rl-bonds') && pixelCss.includes('flex-wrap') && pixelCss.includes('282px'))
assert(
  '羁绊 tip 不占布局',
  pixelCss.includes('.rl-bond-tip') && pixelCss.includes('position: absolute') && pixelCss.includes('.rl-bond-tier'),
)
assert(
  '测试排版 grid 两列',
  pixelCss.includes('.rl-test-toggles') && pixelCss.includes('grid-template-columns'),
)
assert('深色框变体', pixelCss.includes('.rl-frame--dark'))
assert(
  '通栏钳制画布',
  pixelCss.includes('.rl-topbar') &&
    pixelCss.includes('.rl-botbar') &&
    pixelCss.includes('var(--rl-stage-left') &&
    pixelCss.includes('var(--rl-stage-width') &&
    pixelCss.includes('var(--rl-stage-height'),
)
assert('升级卡 160px', pixelCss.includes('160px'))
assert('左上面板已撤', !pixelCss.includes('.rl-hud'))
assert('菜单钳制画布', /\.rl-screen\s*\{[^}]*var\(--rl-stage-left/.test(pixelCss))
assert('齿轮回窗口角', /\.rl-gear\s*\{[^}]*top:\s*10px[^}]*right:\s*10px/.test(pixelCss))
assert('省略号回窗口角', /\.rl-ellipsis\s*\{[^}]*left:\s*10px[^}]*bottom:\s*10px/.test(pixelCss))
assert('羁绊可悬停', /\.rl-bond\s*\{[^}]*pointer-events:\s*auto/.test(pixelCss))
assert('羁绊单列', /\.rl-bonds\s*\{[^}]*flex-direction:\s*column/.test(pixelCss))
assert('小金刚用默认配色', !pixelCss.includes('.rl-bond--vajra'))
assert('死样式 rl-divider 已删', !pixelCss.includes('.rl-divider'))
assert('选角阴影贴脚', /\.rl-avatar-shadow\s*\{[^}]*width:\s*26px[^}]*height:\s*12px/.test(pixelCss))
assert('回忆阴影贴身', /\.rl-mem-shadow\s*\{[^}]*margin-top:\s*-26px/.test(pixelCss))
assert('升级选项占 62%', /\.rl-mem-cols\s*>\s*\.rl-panel\s*\{[^}]*62%/.test(pixelCss))
assert('羁绊独立大框已删', !pixelCss.includes('.rl-mem-bonds') && !pixelCss.includes('.rl-mem-bond-tip'))
assert('token 层 :root', pixelCss.includes(':root') && pixelCss.includes('--rl-ink') && pixelCss.includes('--rl-paper'))
assert('rl-frame 通用类', pixelCss.includes('.rl-frame') && pixelCss.includes('.rl-frame--pop'))
assert('死样式已删', !pixelCss.includes('.rl-pick.locked') && !pixelCss.includes('.rl-avatar.q'))

/* ---- 局外 UI 设计系统（P35 / TASK-007 M6：断言同步为 P35 真实规则）---- */
const cssRuleBody = (selector) => {
  const hit = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(pixelCss)
  return hit ? hit[1] : ''
}
const fontWoff = readFileSync(join(here, '../../public/assets/fonts/zpix.woff2'))
assert(
  '像素字体 @font-face 本地化',
  pixelCss.includes('@font-face') &&
    /font-family:\s*"Zpix"/.test(pixelCss) &&
    pixelCss.includes('url("/assets/fonts/zpix.woff2")') &&
    /format\("woff2"\)/.test(pixelCss) &&
    /font-display:\s*swap/.test(pixelCss),
)
assert('像素字体文件 wOF2', fontWoff.length > 100000 && fontWoff.slice(0, 4).toString() === 'wOF2')
assert('像素字体不引在线服务', !/fonts\.googleapis|fonts\.gstatic|use\.typekit/.test(pixelCss))
const rootBody = cssRuleBody('\\.rl-root')
assert(
  '字体作用域：.rl-root 保留 HUD 等宽栈且不含 Zpix',
  /font-family:\s*ui-monospace/.test(rootBody) && !/Zpix/.test(rootBody),
)
assert(
  '字体作用域：Zpix 只挂局外（.rl-screen）',
  /--rl-font:\s*"Zpix"/.test(pixelCss) &&
    /\.rl-screen\s*\{[^}]*font-family:\s*var\(--rl-font\)/.test(pixelCss),
)
assert(
  'P34 夜蓝 token 已清（--rl-night*）',
  !/--rl-night(-deep|-lift)?/.test(pixelCss) && !/#1b202b|#12161f|#232a38/i.test(pixelCss),
)
assert('P34 石碑类已清（.rl-slab/.rl-plaque）', !pixelCss.includes('.rl-slab') && !pixelCss.includes('.rl-plaque'))
assert('P34 横条样式已清（.rl-ribbon）', !pixelCss.includes('.rl-ribbon'))
assert(
  '局外背景=浅草地 --rl-screen',
  (() => {
    const cssLines = pixelCss.split(/\r?\n/)
    const rules = []
    for (let i = 0; i < cssLines.length; i += 1) {
      if (!/^\.rl-screen\s*\{/.test(cssLines[i])) continue
      let body = ''
      for (let j = i + 1; j < cssLines.length && !cssLines[j].includes('}'); j += 1) body += cssLines[j]
      rules.push({ line: i + 1, body })
    }
    if (!rules.length) return false
    const last = rules[rules.length - 1]
    return /background:\s*var\(--rl-screen\)/.test(last.body)
  })(),
)
const panelBody = cssRuleBody('\\.rl-panel')
assert(
  '轻量浅色框 .rl-panel（1px 墨边、无双层深色内亮线）',
  /border:\s*1px solid var\(--rl-ink\)/.test(panelBody) &&
    !/inset 0 0 0 2px/.test(panelBody) &&
    !/border-radius:\s*[1-9]/.test(panelBody),
)
const optBody = cssRuleBody('\\.rl-opt')
const optHoverBody = (pixelCss.match(/\.rl-opt:hover[^{]*\{([^}]*)\}/) || [])[1] || ''
assert(
  '可选行 .rl-opt（1px 墨边 + 下压 1px + 左侧像素箭头）',
  /border:\s*1px solid var\(--rl-ink\)/.test(optBody) &&
    /translateY\(1px\)/.test(optHoverBody) &&
    /\.rl-opt:hover::before[^{]*\{[^}]*background:\s*var\(--rl-ink\)/.test(pixelCss) &&
    !/background:\s*(var\(--rl-moss|#)/.test(optHoverBody),
)
const glyphBody = cssRuleBody('\\.rl-glyph-btn')
const glyphHoverBody = (pixelCss.match(/\.rl-glyph-btn:hover[^{]*\{([^}]*)\}/) || [])[1] || ''
assert(
  '局外按钮 hover 不变亮填充/不反色',
  /border:\s*1px solid var\(--rl-ink\)/.test(glyphBody) &&
    /translateY\(1px\)/.test(glyphHoverBody) &&
    !/background/.test(glyphHoverBody) &&
    !/color/.test(glyphHoverBody),
)
/* R6：悬停不得改填充（只允许箭头/描边/下压；局内 .rl-card:hover 不受约束） */
const hoverBodyOf = (sel) => {
  const i = pixelCss.indexOf(sel)
  if (i < 0) return null
  const open = pixelCss.indexOf('{', i)
  const close = pixelCss.indexOf('}', open)
  return pixelCss.slice(open + 1, close)
}
const hoverNoFill = ['.rl-btn:hover', '.rl-pick.on:hover', '.rl-mem-item:hover'].every((sel) => {
  const body = hoverBodyOf(sel)
  return body !== null && !/background/.test(body)
})
assert('悬停不变填充：.rl-btn/.rl-pick.on/.rl-mem-item', hoverNoFill)
assert(
  '悬停反馈=像素箭头/描边/下压',
  /\.rl-pick\.on:hover::before[^{]*\{[^}]*background:\s*var\(--rl-ink\)/.test(pixelCss) &&
    /translate\(1px,\s*1px\)|translateY\(1px\)/.test(hoverBodyOf('.rl-btn:hover') || '') &&
    /inset 0 0 0 1px var\(--rl-ink\)/.test(hoverBodyOf('.rl-mem-item:hover') || ''),
)
assert('局内 .rl-card:hover 未被约束', /\.rl-card:hover\s*\{[^}]*background:\s*var\(--rl-mask-hover\)/.test(pixelCss))

/* ---- P36 / TASK-011（M6）：局外交互控件统一断言 ---- */
const resultSrc = readFileSync(join(here, '../views/ResultView.vue'), 'utf8')
const actionBtnBody = cssRuleBody('\\.rl-action-btn')
const actionBtnHover = (pixelCss.match(/\.rl-action-btn:hover[^{]*\{([^}]*)\}/) || [])[1] || ''
const actionBtnActive = (pixelCss.match(/\.rl-action-btn:active[^{]*\{([^}]*)\}/) || [])[1] || ''
assert(
  'P36 动作按钮 .rl-action-btn（3px 边 + 3px 硬阴影）',
  /border:\s*3px solid var\(--rl-ink\)/.test(actionBtnBody) &&
    /box-shadow:\s*3px 3px 0 var\(--rl-shadow\)/.test(actionBtnBody),
)
assert(
  'P36 动作按钮 hover/active 只下压收影、不变填充',
  /translate\(1px,\s*1px\)/.test(actionBtnHover) &&
    /box-shadow:\s*2px 2px 0/.test(actionBtnHover) &&
    !/background/.test(actionBtnHover) &&
    /translate\(2px,\s*2px\)/.test(actionBtnActive) &&
    /box-shadow:\s*1px 1px 0/.test(actionBtnActive) &&
    !/background/.test(actionBtnActive),
)
assert('P36 动作按钮 focus-visible 3px outline', /\.rl-action-btn:focus-visible[^{]*\{[^}]*outline:\s*3px solid/.test(pixelCss))
const actionRowBody = cssRuleBody('\\.rl-action-row')
const actionRowHover = (pixelCss.match(/\.rl-action-row:hover[^{]*\{([^}]*)\}/) || [])[1] || ''
assert(
  'P36 可点击行 .rl-action-row（3px 边 + 硬阴影 + 浅底）',
  /border:\s*3px solid var\(--rl-ink\)/.test(actionRowBody) &&
    /box-shadow:\s*3px 3px 0 var\(--rl-shadow\)/.test(actionRowBody) &&
    /background:\s*var\(--rl-paper\)/.test(actionRowBody),
)
assert(
  'P36 可点击行 hover 只箭头+收影+下压、不变填充',
  !/background/.test(actionRowHover) &&
    /translate\(1px,\s*1px\)/.test(actionRowHover) &&
    /box-shadow:\s*2px 2px 0/.test(actionRowHover) &&
    /\.rl-action-row:hover::before[^{]*\{[^}]*background:\s*var\(--rl-ink\)/.test(pixelCss),
)
assert(
  'P36 小按钮边框仍 3px、硬阴影成比例 2px',
  /\.rl-btn\.tiny,\s*\.rl-action-btn\.tiny\s*\{[^}]*box-shadow:\s*2px 2px 0/.test(pixelCss) &&
    /\.rl-action-btn\.tiny:hover:not\(:disabled\)\s*\{[^}]*box-shadow:\s*1px 1px 0/.test(pixelCss),
)
const toggleBody = cssRuleBody('\\.rl-toggle')
const pickerXBody = cssRuleBody('\\.rl-picker-x')
assert(
  'P36 开关/红 X 同语言（3px 边 + 硬阴影）',
  /border:\s*3px solid var\(--rl-ink\)/.test(toggleBody) &&
    /box-shadow:\s*3px 3px 0 var\(--rl-shadow\)/.test(toggleBody) &&
    /border:\s*3px solid var\(--rl-ink\)/.test(pickerXBody) &&
    /box-shadow:\s*3px 3px 0 var\(--rl-shadow\)/.test(pickerXBody),
)
assert(
  'P36 无 !important 堆叠',
  !/!important/.test(pixelCss.replace(/\/\*[\s\S]*?\*\//g, '')),
)
assert(
  'P36 信息容器仍轻量（1px）',
  /border:\s*1px solid var\(--rl-ink\)/.test(cssRuleBody('\\.rl-panel')) &&
    /border:\s*1px solid var\(--rl-ink\)/.test(resultSrc),
)

const viewRuleBody = (source, selector) => {
  const selectorIndex = source.indexOf(selector)
  const openBrace = source.indexOf('{', selectorIndex)
  const closeBrace = source.indexOf('}', openBrace)
  if (selectorIndex < 0 || openBrace < 0 || closeBrace < 0) return ''
  return source.slice(openBrace + 1, closeBrace)
}

const standardInfoPanels = [
  viewRuleBody(settingsSrc, '.rl-settings .rl-panel'),
  viewRuleBody(moreSrc, '.rl-more .rl-panel'),
  viewRuleBody(resultSrc, '.rl-screen .rl-result'),
]

assert(
  'P37 普通信息容器用草地面板色，不铺浅黄色',
  standardInfoPanels.every(
    (body) =>
      /background:\s*var\(--rl-panel\)/.test(body) &&
      !/background:\s*var\(--rl-paper\)/.test(body),
  ),
)
assert(
  'P38 角色结算为深苔绿双层像素主框',
  /background:\s*var\(--rl-panel-deep\)/.test(viewRuleBody(moreSrc, '.rl-more .rl-mem-hero')) &&
    /border:\s*3px\s+solid\s+var\(--rl-ink\)/.test(viewRuleBody(moreSrc, '.rl-more .rl-mem-hero')) &&
    /inset\s+0\s+0\s+0\s+2px\s+var\(--rl-lock\)/.test(viewRuleBody(moreSrc, '.rl-more .rl-mem-hero')),
)
assert(
  'P38 回忆羁绊 chip 使用更深苔绿底',
  /background:\s*var\(--rl-panel-deep\)/.test(viewRuleBody(moreSrc, '.rl-more .rl-bond')) &&
    /color:\s*var\(--rl-paper\)/.test(viewRuleBody(moreSrc, '.rl-more .rl-bond')),
)
assert(
  'P38 设置容器与测试区使用双层像素框',
  [
    viewRuleBody(settingsSrc, '.rl-settings .rl-panel'),
    viewRuleBody(settingsSrc, '.rl-settings .rl-settings-test'),
  ].every(
    (body) =>
      /border:\s*3px\s+solid\s+var\(--rl-ink\)/.test(body) &&
      /inset\s+0\s+0\s+0\s+2px\s+var\(--rl-lock\)/.test(body),
  ),
)
assert(
  'P37 确认弹窗保留纸面高对比',
  /background:\s*var\(--rl-paper\)/.test(
    viewRuleBody(settingsSrc, '.rl-settings .rl-modal-box'),
  ),
)
assert(
  'P36 视图 scoped 覆盖需改类名（当前仍在 .rl-btn 上）',
  [settingsSrc, moreSrc, resultSrc].every((src) => !/\.rl-action-btn/.test(src)),
)
assert(
  '局外无渐变/圆角/模糊',
  !/gradient/.test(pixelCss) && !/border-radius:\s*[1-9]/.test(pixelCss) && !/filter:\s*blur/.test(pixelCss),
)
assert('首页横条装饰已删（模板+样式）', !/rl-ribbon/.test(startSrc) && !/rl-ribbon/.test(pixelCss))
assert(
  '结算三按钮文案',
  resultSrc.includes('再玩一把') && resultSrc.includes('退出到主页') && resultSrc.includes('重试上报'),
)

/* ---- P42 批次5（TASK-036 / M6）：难度二 12 分钟 / 生生不息文案 / 卡牌屏放大·双向·加速 / 升级文案 ---- */

/* R1① 难度门槛：难度一 600s；难度二 720s 且 Boss ≥ 2（Boss 条件不变）。 */
const winSec2 = C42.SURVIVE_WIN_SEC_DIFF2 ?? 999
const sWin1 = createSession()
sWin1.start('1')
sWin1.tick(SURVIVE_WIN_SEC - 1)
const win1Hold = sWin1.phase === 'playing'
sWin1.tick(1)
const win1Win = sWin1.phase === 'victory' && sWin1.win === true
const sWin2 = createSession()
sWin2.start('2')
sWin2.addBossKill()
sWin2.addBossKill()
sWin2.tick(SURVIVE_WIN_SEC)
const win2Hold = sWin2.phase === 'playing' && sWin2.win === false
sWin2.tick(winSec2 - SURVIVE_WIN_SEC)
const win2Win = sWin2.phase === 'victory' && sWin2.win === true
assert(
  'diff1 win sec 600',
  SURVIVE_WIN_SEC === 600 &&
    C42.surviveWinSecFor?.('1') === 600 &&
    C42.surviveWinSecFor?.(DIFFICULTY_TWO.id) === 720 &&
    win1Hold &&
    win1Win,
)
assert(
  'diff2 win sec 720',
  C42.SURVIVE_WIN_SEC_DIFF2 === 720 &&
    C42.surviveWinSecFor?.('2') === 720 &&
    C42.surviveWinSecFor?.('2') > C42.surviveWinSecFor?.('1') &&
    win2Hold &&
    win2Win &&
    Math.abs(sWin2.elapsedSec - C42.SURVIVE_WIN_SEC_DIFF2) < 1e-9,
)

/* R1② 选难度文案：难度二写 12 分钟，难度一不动。 */
assert(
  'objective two 12 min',
  OBJECTIVE_TEXT_TWO === '目标：击败Boss 2次，并活够12分钟' &&
    OBJECTIVE_TEXT_TWO.includes('12分钟') &&
    OBJECTIVE_TEXT === '目标：活够10分钟' &&
    C42.objectiveForDifficulty?.(DIFFICULTY_TWO.id) === OBJECTIVE_TEXT_TWO &&
    C42.objectiveForDifficulty?.('1') === OBJECTIVE_TEXT &&
    startSrc.includes('OBJECTIVE_TEXT_TWO') &&
    !startSrc.includes('并活够10分钟'),
)

/* R1③ 测试模式时间滑条上限跟最长的通关门槛（720s）走。 */
assert(
  'test elapsed max 12 min',
  TEST_ELAPSED_MAX === 720 &&
    TEST_ELAPSED_MAX === C42.SURVIVE_WIN_SEC_DIFF2 &&
    TEST_ELAPSED_MAX > SURVIVE_WIN_SEC &&
    clampTestElapsedSec(720) === 720 &&
    clampTestElapsedSec(721) === 720 &&
    formatTime(TEST_ELAPSED_MAX) === '12:00' &&
    settingsSrc.includes('TEST_ELAPSED_MAX') &&
    settingsSrc.includes(':max="TEST_ELAPSED_MAX"') &&
    !settingsSrc.includes('10 分钟'),
)

/* R2 生生不息文案与天行健同款抽象说法，且任何位置都不列计入项。 */
const shengOptionWords = ['生存', '恢复', '三娃', '滋补', '荆棘']
assert(
  'sheng desc aligns qian',
  BOND_DESC.sheng === '不同种类升级集齐解锁档位' &&
    BOND_DESC[BOND_QIAN].startsWith('不同种类升级集齐解锁档位') &&
    !shengOptionWords.some((w) => BOND_DESC.sheng.includes(w)) &&
    BOND_TIERS.sheng.map((t) => t.rank).join() === '3,5,8',
)
assert(
  'sheng desc hides options',
  !shengOptionWords.some((w) => BOND_DESC.sheng.includes(w)) &&
    bondTiers('sheng').every((t) => !shengOptionWords.some((w) => t.text.includes(w))) &&
    /* 渲染羁绊的视图：连单个计入项名字都不许出现 */
    [moreSrc, shellSrc].every((src) => !shengOptionWords.some((w) => src.includes(w))) &&
    /* 其余视图 / 样式：不许出现「列清单」式连写（≥2 个计入项同屏） */
    [startSrc, settingsSrc, pixelCss].every(
      (src) => shengOptionWords.filter((w) => src.includes(w)).length < 2,
    ) &&
    /BOND_DESC\[b\.id\]/.test(shellSrc) &&
    /BOND_DESC\[b\.id\]/.test(moreSrc),
)

/* R3 卡牌屏：放大 120×160、左右两侧同时漂入、提速 180 px/s、文案不靠缩字号硬塞。 */
assert(
  'power card size bigger',
  C42.POWER_CARD_W === 120 &&
    C42.POWER_CARD_H === 160 &&
    C42.POWER_CARD_W > 96 &&
    C42.POWER_CARD_H > 132 &&
    C42.POWER_CARD_GAP === C42.POWER_CARD_W * 2 &&
    C42.POWER_CARD_GAP === 240 &&
    powerViewSrc.includes('POWER_CARD_W') &&
    /width:\s*var\(--rl-power-card-w\)/.test(powerViewSrc),
)
assert(
  'power cards enter both sides',
  C42.powerCardSide?.(0, 4) === 'left' &&
    C42.powerCardSide?.(1, 4) === 'left' &&
    C42.powerCardSide?.(2, 4) === 'right' &&
    C42.powerCardSide?.(3, 4) === 'right' &&
    C42.powerCardSide?.(0, 2) === 'left' &&
    C42.powerCardSide?.(1, 2) === 'right' &&
    C42.powerCardSide?.(0, 3) === 'left' &&
    C42.powerCardSide?.(1, 3) === 'left' &&
    C42.powerCardSide?.(2, 3) === 'right' &&
    C42.powerCardSide?.(0, 1) === 'left' &&
    [0, 1].every((i) => C42.powerCardStartX?.(i, 4, 1280) < 0) &&
    [2, 3].every((i) => C42.powerCardStartX?.(i, 4, 1280) > 1280) &&
    (C42.powerCardStartX?.(1, 4, 1280) ?? 0) - (C42.powerCardStartX?.(0, 4, 1280) ?? 0) === -240 &&
    (C42.powerCardStartX?.(3, 4, 1280) ?? 0) - (C42.powerCardStartX?.(2, 4, 1280) ?? 0) === 240 &&
    powerViewSrc.includes('powerCardStartX') &&
    /c\.x -= span/.test(powerViewSrc) &&
    /c\.x \+= span/.test(powerViewSrc),
)
assert(
  'power card speed faster',
  C42.POWER_CARD_SPEED === 180 &&
    C42.POWER_CARD_SPEED > 115 &&
    C42.POWER_CARD_BOB_MIN === 6 &&
    C42.POWER_CARD_BOB_MAX === 10 &&
    powerViewSrc.includes('SPEED = POWER_CARD_SPEED') &&
    /c\.x \+= c\.dir \* SPEED \* dt/.test(powerViewSrc),
)

/* R4 升级 / 激发力量文案同步（只改文案，不改判定）。 */
assert(
  'thorn desc 2 body 0.5 step',
  UPGRADES.find((u) => u.id === 'thorn')?.desc ===
    '受击时对 2 身位内敌人造成 攻击×150%（每层 +50%，范围 +0.5 身位）' &&
    UPGRADES.find((u) => u.id === 'thorn')?.desc.includes('2 身位') &&
    UPGRADES.find((u) => u.id === 'thorn')?.desc.includes('+0.5 身位') &&
    descFor('thorn') === UPGRADES.find((u) => u.id === 'thorn')?.desc,
)
assert(
  'refine desc 5 crit 3 rate',
  UPGRADES.find((u) => u.id === 'refine')?.desc ===
    '暴击率 +5（可叠）；每 3 点暴击使暴击伤害 +0.02 倍率' &&
    descFor('refine').includes('暴击率 +5') &&
    descFor('refine').includes('每 3 点') &&
    descFor('refine').includes('+0.02'),
)
/* TASK-045 R1：精益求精 desc 去掉「（向上取整）」——倍率是连续算式（不对 rate/3 取档），
   取整只针对伤害数字，不属于倍率描述（口径见 combat 的 critDamageMul 与 ceilDamage）。 */
assert(
  'refine desc no ceil wording',
  descFor('refine') === '暴击率 +5（可叠）；每 3 点暴击使暴击伤害 +0.02 倍率' &&
    !/取整|ceil/i.test(descFor('refine')) &&
    !/倍率（/.test(descFor('refine')) &&
    descFor('refine') === UPGRADES.find((u) => u.id === 'refine')?.desc,
)
assert(
  'earth desc crystal max 2',
  UPGRADES.find((u) => u.id === 'earth')?.desc ===
    '普通树每波 +2、果实概率 +10%；结晶掉落上限 +2（可叠）' &&
    descFor('earth').includes('结晶掉落上限 +2') &&
    descFor('earth').includes('果实概率 +10%'),
)
assert(
  'power desc concise',
  C42.POWER_EFFECTS.map((e) => e.desc).join(' | ') ===
    '额外射出一发 | 穿透 +1，每穿 1 敌伤害 +50% | 静止 0.15s → 下次攻击必暴 | 伤害 +20，可叠加' &&
    C42.POWER_EFFECTS.every((e) => e.desc.length <= 20) &&
    powerViewSrc.includes('{{ c.desc }}') &&
    /\.rl-power-desc\s*\{[^}]*font-size:\s*var\(--rl-f1\)/.test(powerViewSrc) &&
    /font-size:\s*var\(--rl-f1\)/.test(powerViewSrc),
)

/* ---- P42 批次7（TASK-050 / M6）：新高级「贪婪」+ 小金刚/生生不息羁绊文本 ---- */

/* R1① 贪婪入高级池：id / title / desc / tier / 无过审图 → 空白方块（不画程序图标）。 */
const greedDef = UPGRADES.find((u) => u.id === 'greed')
assert(
  'greed in advanced pool',
  C42.UPGRADE_GREED === 'greed' &&
    greedDef?.id === 'greed' &&
    greedDef?.title === '贪婪' &&
    greedDef?.desc === '获取经验时 50% 概率再获得一次经验（每层 +10% 概率，最高 100%）' &&
    greedDef?.tier === 'advanced' &&
    descFor('greed') === greedDef?.desc &&
    availableUpgrades(null, { tier: 'advanced', charId: 'ranger' }).some((u) => u.id === 'greed') &&
    !availableUpgrades(null, { tier: 'normal', charId: 'ranger' }).some((u) => u.id === 'greed') &&
    UPGRADES.filter((u) => u.tier === 'advanced').length === 10 &&
    resolveUpgradeIcon('greed', false).kind === 'blank' &&
    !existsSync(new URL('../../public/assets/upgrades/greed.png', import.meta.url)),
)

/* R1② 概率：1 层 50% 起、每层 +10、上限 100、0 层 0。 */
assert(
  'greed chance 50 base',
  C42.GREED_CHANCE_BASE === 50 && C42.greedChance?.(0) === 0 && C42.greedChance?.(1) === 50,
)
assert(
  'greed chance step 10 cap 100',
  C42.GREED_CHANCE_STEP === 10 &&
    C42.GREED_CHANCE_MAX === 100 &&
    C42.greedChance?.(2) === 60 &&
    C42.greedChance?.(6) === 100 &&
    C42.greedChance?.(7) === 100 &&
    C42.greedChance?.(99) === 100 &&
    [1, 2, 3, 4, 5, 6, 7, 9, 20].every((p) => C42.greedChance?.(p) === Math.min(100, 50 + 10 * (p - 1))),
)

/* R1③ 会话侧 rollGreedBonus：按层数掷概率、命中 +1 并起 0.1s 冷却、冷中/未命中 0；冷却由 tick 真实时间递减；叠层不加冷却。 */
const greedS = createSession()
greedS.start('1')
const greedCtx = { player: createPlayer() }
const greedHitRng = () => 0
const greedMissRng = () => 0.999
const greedBeforePick = greedS.rollGreedBonus?.(greedHitRng) ?? null
greedS.grantUpgrade('greed', greedCtx)
const greedHit = greedS.rollGreedBonus?.(greedHitRng) ?? null
const greedDuringCd = greedS.rollGreedBonus?.(greedHitRng) ?? null
greedS.tick(C42.GREED_COOLDOWN_SEC ?? 0.1)
const greedAfterCd = greedS.rollGreedBonus?.(greedHitRng) ?? null
const greedS2 = createSession()
greedS2.start('1')
greedS2.grantUpgrade('greed', greedCtx)
const greedMiss = greedS2.rollGreedBonus?.(greedMissRng) ?? null
const greedMissThenHit = greedS2.rollGreedBonus?.(greedHitRng) ?? null
const greedS3 = createSession()
greedS3.start('1')
greedS3.grantUpgrade('greed', greedCtx)
greedS3.grantUpgrade('greed', greedCtx)
const greed2Hit = greedS3.rollGreedBonus?.(greedHitRng) ?? null
greedS3.tick(0.05)
const greed2CdHalf = greedS3.rollGreedBonus?.(greedHitRng) ?? null
greedS3.tick(0.05 + 1e-9)
const greed2CdDone = greedS3.rollGreedBonus?.(greedHitRng) ?? null
assert(
  'greed cooldown 0.1',
  C42.GREED_COOLDOWN_SEC === 0.1 &&
    greedBeforePick === 0 &&
    greedHit === 1 &&
    greedDuringCd === 0 &&
    greedAfterCd === 1 &&
    greedMiss === 0 &&
    greedMissThenHit === 1 &&
    greed2Hit === 1 &&
    greed2CdHalf === 0 &&
    greed2CdDone === 1,
)

/* R1④ 不计入任何羁绊：无 bond 字段、四种羁绊都不计它。 */
assert(
  'greed not in any bond',
  greedDef?.id === 'greed' &&
    !('bond' in greedDef) &&
    !('bonds' in greedDef) &&
    [BOND_QIAN, BOND_UNITY, BOND_VAJRA, C42.BOND_SHENG].every((b) => C42.belongsToBond?.(greedDef, b) === false) &&
    [BOND_QIAN, BOND_UNITY, BOND_VAJRA, C42.BOND_SHENG].every(
      (b) => uniqueBondCount([{ id: 'greed' }], b) === 0,
    ) &&
    listActiveBonds([{ id: 'greed' }]).length === 0,
)

/* R2① 小金刚文本：脉冲 3 身位 / 攻击×2 + 兄弟效果「再获得一次」。 */
assert(
  'vajra tier text pulse 3 body 2x',
  bondTiers(BOND_VAJRA).length === 2 &&
    bondTiers(BOND_VAJRA).every((t) => t.rank === 7) &&
    bondTiers(BOND_VAJRA)[0].text.includes('七色脉冲') &&
    bondTiers(BOND_VAJRA)[0].text.includes('3 身位') &&
    bondTiers(BOND_VAJRA)[0].text.includes('攻击×2') &&
    bondTiers(BOND_VAJRA)[0].text.includes('减速 30%') &&
    bondTiers(BOND_VAJRA)[0].text.includes('不击退') &&
    bondTiers(BOND_VAJRA)[0].text.includes('不点燃') &&
    bondTiers(BOND_VAJRA)[0].text.includes('六娃'),
)
assert(
  'vajra tier text reobtain',
  bondTiers(BOND_VAJRA)[1].text.includes('再获得一次') &&
    ['大娃', '二娃', '三娃', '四娃', '五娃', '六娃', '七娃'].every((n) =>
      bondTiers(BOND_VAJRA)[1].text.includes(n),
    ) &&
    !bondTiers(BOND_VAJRA)[1].text.includes('+10%'),
)

/* R2②③ 生生不息档位 3/5/8 + 档 8 复活文本 + 注明档 8 当前不可达。 */
const constantsSrc = readFileSync(new URL('../ui/constants.js', import.meta.url), 'utf8')
assert(
  'sheng threshold 3 5 8',
  C42.BOND_SHENG_THRESHOLDS?.join?.() === '3,5,8' &&
    C42.BOND_THRESHOLDS?.['sheng']?.join?.() === '3,5,8' &&
    BOND_TIERS.sheng.map((t) => t.rank).join() === '3,5,8' &&
    bondRank('sheng', 5) === 5 &&
    bondRank('sheng', 8) === 8 &&
    /* 只计 5 种 → 档 8 当前不可达（等后续加计入项），源码里必须写明 */
    UPGRADES.filter((u) => C42.belongsToBond?.(u, C42.BOND_SHENG)).length === 5 &&
    /档 8 当前不可达/.test(constantsSrc),
)
assert(
  'sheng tier8 revive text',
  BOND_TIERS.sheng.find((t) => t.rank === 8)?.text ===
    '受致命伤时以 1 血复活；复活后需再回血 5 次才能再次触发' &&
    bondTiers('sheng').length === 3 &&
    !/致命伤/.test(BOND_DESC.sheng),
)

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

assert('sfxVolume 默认 0.7', defaultSettings().sfxVolume === 0.7)
assert('bgmVolume 默认 0.7', defaultSettings().bgmVolume === 0.7)
const lsStore = new Map()
globalThis.localStorage = {
  getItem: (k) => (lsStore.has(k) ? lsStore.get(k) : null),
  setItem: (k, v) => lsStore.set(k, String(v)),
  removeItem: (k) => lsStore.delete(k),
}
const sfxVolPersist = defaultSettings()
sfxVolPersist.sfxVolume = 0.3
sfxVolPersist.bgmVolume = 0.4
saveSettings(sfxVolPersist)
assert(
  '音量持久化',
  loadSettings().sfxVolume === 0.3 && loadSettings().bgmVolume === 0.4,
)
delete globalThis.localStorage

saveMemory({ timeText: '00:01', level: 1, exp: 0, upgrades: [] })
assert('memory append', loadMemories().length >= 2)

console.log(failed === 0 ? '\nRESULT PASS' : `\nRESULT FAIL (${failed})`)
process.exit(failed === 0 ? 0 : 1)
