/** M8 UI / 升级 / 上报常量。 */

import { assetUrl } from '../assetUrl.js'

export const GAME_TITLE = '类幸存者'



export const CHAR_NAME = '游侠'

export const CHAR_WARRIOR_NAME = '战士'

export const CHAR_MAGE_NAME = '法师'

export const CHAR_RANGER = 'ranger'

export const CHAR_WARRIOR = 'warrior'

export const CHAR_MAGE = 'mage'

export const WEAPON_NAME = '游侠弓'



export const DIFFICULTY_ONE = {

  id: '1',

  name: '难度一',

}

export const DIFFICULTY_TWO = {

  id: '2',

  name: '难度二',

}

export const DIFFICULTIES = [DIFFICULTY_ONE, DIFFICULTY_TWO]

export const BOND_QIAN = 'qian'

export const BOND_UNITY = 'unity'

export const BOND_VAJRA = 'vajra'

/** P42 批次2：新增羁绊「生生不息」。 */
export const BOND_SHENG = 'sheng'

export const BOND_QIAN_TITLE = '天行健'

export const BOND_UNITY_TITLE = '万物一心'

export const BOND_VAJRA_TITLE = '小金刚'

export const BOND_SHENG_TITLE = '生生不息'

export const BOND_QIAN_THRESHOLDS = [2, 4, 6, 8]

export const BOND_UNITY_THRESHOLDS = [2, 4, 6, 8]

export const BOND_VAJRA_THRESHOLDS = [7]

/**
 * 生生不息：3 档 / 5 档 / 8 档（当前只计 5 种升级，全拿 = 档 5）。
 * 档 8 当前不可达（只计 5 种升级，等后续加计入项）—— 保留档位与文案，避免被当成 bug。
 */
export const BOND_SHENG_THRESHOLDS = [3, 5, 8]

/** 档 5：每 45s 回 1 心（满血不回、计时照走）。 */
export const BOND_SHENG_HEAL_SEC = 45

/** 档 3：受击后 1.5s 移速 +0.20 设计单位（效果由 M3 的 player.applyHurtSpeedBuff 提供，M1 接线）。 */
export const BOND_SHENG_HURT_SPEED_UNITS = 0.2

export const BOND_SHENG_HURT_SPEED_SEC = 1.5

export const BOND_THRESHOLDS = {
  [BOND_QIAN]: BOND_QIAN_THRESHOLDS,
  [BOND_UNITY]: BOND_UNITY_THRESHOLDS,
  [BOND_VAJRA]: BOND_VAJRA_THRESHOLDS,
  [BOND_SHENG]: BOND_SHENG_THRESHOLDS,
}



/** Lv.0→Lv.1 需 7；之后每升一级需求 +4；无等级上限 */

export const EXP_BASE = 7

export const EXP_GROWTH = 4

/** 测试模式「提高等级」可选 0～3，不是等级帽 */

export const LEVEL_BOOST_MAX = 3

/** 每升到 6/11/16…：攻击 +1、移速 +0.05 */
export const LEVEL_GROWTH_EVERY = 5

export const LEVEL_GROWTH_ATK = 1

export const LEVEL_GROWTH_SPEED = 0.05

/** 升到 11/21/31…：空血上限 +1 */
export const LEVEL_EMPTY_HP_EVERY = 10

/** 升到 16/31/46…：穿透 +1 */
export const LEVEL_PIERCE_EVERY = 15



export const CHARGE_MAX_SEC = 0.75

/** 难度一：活够 10 分钟（600s）即通关。 */
export const SURVIVE_WIN_SEC = 600

/** P42 批次5：难度二存活门槛 12 分钟（720s）；Boss 2 次条件不变。 */
export const SURVIVE_WIN_SEC_DIFF2 = 720

/** 按难度取存活门槛：难度一 600s、难度二 720s（唯一判定入口，session.meetsWin 用）。 */
export function surviveWinSecFor(difficultyId) {
  return String(difficultyId) === DIFFICULTY_TWO.id ? SURVIVE_WIN_SEC_DIFF2 : SURVIVE_WIN_SEC
}



/** 「敏捷」每次 +0.15 设计单位 */

export const MOVE_SPEED_BONUS = 0.15



export const UPGRADE_MOVE = 'move_speed'

export const UPGRADE_AMMO = 'ammo_cap'

export const UPGRADE_RELOAD = 'reload'

export const UPGRADE_POWER = 'power'

export const UPGRADE_SURVIVE = 'survive'

export const UPGRADE_RECOVER = 'recover'

export const UPGRADE_EARTH = 'earth'

export const UPGRADE_PIERCE = 'pierce'

export const UPGRADE_EYES = 'eyes'

export const UPGRADE_GIANT = 'giant'

export const UPGRADE_BLACKHOLE = 'blackhole'

export const UPGRADE_ERSE = 'erse'

export const UPGRADE_SANWA = 'sanwa'

export const UPGRADE_SIWA = 'siwa'

export const UPGRADE_WUWA = 'wuwa'

export const UPGRADE_LIUWA = 'liuwa'

export const UPGRADE_KNOCKBACK = 'knockback'

export const UPGRADE_MAGNET = 'magnet'

export const UPGRADE_GOBLIN = 'goblin'

export const UPGRADE_RABBIT = 'rabbit'

export const UPGRADE_BAT = 'bat'

export const UPGRADE_EMPOWER = 'empower_shot'

export const UPGRADE_CRIT = 'crit'

export const UPGRADE_ONLY_FAST = 'only_fast'

export const UPGRADE_REFINE = 'refine'

export const UPGRADE_EGG = 'strange_egg'

export const UPGRADE_TAMER = 'tamer'

export const UPGRADE_DEMON = 'demon'

export const UPGRADE_SLIME_GG = 'slime_gg'

export const UPGRADE_COMPANIONSHIP = 'companionship'

/** P42 批次2：荆棘 / 滋补（均为普通项，图标未过审 → 局内空白方块）。 */
export const UPGRADE_THORN = 'thorn'

export const UPGRADE_NOURISH = 'nourish'

/** P42 批次7：贪婪（高级项；**不计入任何羁绊**，图标未过审 → 局内空白方块）。 */
export const UPGRADE_GREED = 'greed'

/** 贪婪：获取经验时 50% 概率再获得一次经验；每层 +10%、上限 100%；触发后 0.1s 冷却。 */
export const GREED_CHANCE_BASE = 50

export const GREED_CHANCE_STEP = 10

export const GREED_CHANCE_MAX = 100

export const GREED_COOLDOWN_SEC = 0.1

/**
 * 贪婪层数为 picks 时的触发概率（%）。
 * 0 层未持有 → 0；≥1 层 = min(100, 50 + 10 × (picks − 1))。
 */
export function greedChance(picks) {
  const n = Math.max(0, picks | 0)
  if (n <= 0) return 0
  return Math.min(GREED_CHANCE_MAX, GREED_CHANCE_BASE + GREED_CHANCE_STEP * (n - 1))
}

/** 滋补：每击杀 1000 个敌人回 1 心；每层 −100，下限 100。 */
export const NOURISH_KILL_BASE = 1000

export const NOURISH_KILL_STEP = 100

export const NOURISH_KILL_MIN = 100

/**
 * 滋补层数为 picks 时的回血阈值（击杀数）。
 * 0 层未持有 → 0（不挂回血）；≥1 层 = max(100, 1000 − 100×(picks − 1))。
 */
export function nourishKillThreshold(picks) {
  const n = Math.max(0, picks | 0)
  if (n <= 0) return 0
  return Math.max(NOURISH_KILL_MIN, NOURISH_KILL_BASE - NOURISH_KILL_STEP * (n - 1))
}

/**
 * 升级归属羁绊判定：主 `bond`，外加 `bonds` 里声明的附加羁绊。
 * P42 批次2 双属项：三娃（生生不息 + 小金刚）、生存（生生不息 + 天行健，避免削弱天行健计入项）。
 */
export function belongsToBond(def, bondId) {
  if (!def || !bondId) return false
  if (def.bond === bondId) return true
  return Array.isArray(def.bonds) && def.bonds.includes(bondId)
}

/** 每次选择地精：所有跟班伤害 +10 */
export const COMPANION_DAMAGE_BONUS = 10

export const UPGRADE_TIER_ADVANCED = 'advanced'

/** 本局第 5/10/15… 次三选一才可能出高级项 */
export const ADVANCED_OFFER_EVERY = 5

export const ADVANCED_OFFER_CHANCE = 0.3



export const UPGRADE_CHOICE_COUNT = 3



export const UPGRADES = [

  { id: UPGRADE_MOVE, title: '敏捷', desc: '移速 +0.15', bond: BOND_QIAN },

  { id: UPGRADE_AMMO, title: '散射', desc: '弹道 +1，伤害 −3', bond: BOND_QIAN },

  { id: UPGRADE_RELOAD, title: '技巧', desc: '蓄力时间 −0.15', bond: BOND_QIAN },

  { id: UPGRADE_POWER, title: '力量', desc: '伤害 +10', bond: BOND_QIAN },

  { id: UPGRADE_SURVIVE, title: '生存', desc: '血上限 +1，回 1 滴血', bond: BOND_SHENG, bonds: [BOND_QIAN] },

  { id: UPGRADE_RECOVER, title: '恢复', desc: '回复 2 滴血', bond: BOND_SHENG },

  { id: UPGRADE_EARTH, title: '大地啊', desc: '普通树每波 +2、果实概率 +10%；结晶掉落上限 +2（可叠）' },

  { id: UPGRADE_PIERCE, title: '穿透', desc: '穿透 +1', bond: BOND_QIAN },

  { id: UPGRADE_EYES, title: '开眼了', desc: '背后弹道 +1，伤害 −3', bond: BOND_QIAN },

  { id: UPGRADE_GIANT, title: '大娃', desc: '每次弹体大小 +40%', bond: BOND_VAJRA },

  { id: UPGRADE_ERSE, title: '二娃·千里眼', desc: '三选一 20%/层 概率变四选一', tier: 'advanced', bond: BOND_VAJRA },

  { id: UPGRADE_SANWA, title: '三娃·铜头铁臂', desc: '获得 1 层护甲；之后每升 N 级再获得 1 层（N=11−已选次数，可叠）', bond: BOND_SHENG, bonds: [BOND_VAJRA] },

  { id: UPGRADE_SIWA, title: '四娃·喷火', desc: '命中点燃 3 秒，每秒 30% 攻击（+10%/层）', tier: 'advanced', bond: BOND_VAJRA },

  { id: UPGRADE_WUWA, title: '五娃·吐水', desc: '命中减速 20%、0.3 秒（+0.2 秒/层）', tier: 'advanced', bond: BOND_VAJRA },

  { id: UPGRADE_LIUWA, title: '六娃·隐身', desc: '每 10 秒失锁脉冲：1.5 身位内敌人 1.0 秒不锁定（+0.5 秒/层）', bond: BOND_VAJRA },

  { id: UPGRADE_BLACKHOLE, title: '七娃', desc: '吸收全地图经验结晶', bond: BOND_VAJRA },

  { id: UPGRADE_MAGNET, title: '磁铁', desc: '结晶吸取范围 +1 身位' },

  { id: UPGRADE_GOBLIN, title: '地精', desc: '生成 1 个地精跟班，所有跟班伤害 +10', tier: 'advanced', bond: BOND_UNITY },

  { id: UPGRADE_EMPOWER, title: '强化射击', tier: 'advanced', bond: BOND_QIAN, desc: '满蓄改为激光，伤害 ceil(攻击×2.5)，穿透 +2，过量可溢出，攻击 +5' },

  { id: UPGRADE_RABBIT, title: '兔子', desc: '生成 1 个兔子跟班', bond: BOND_UNITY },

  { id: UPGRADE_BAT, title: '蝙蝠', desc: '生成 1 个蝙蝠跟班；该蝙蝠每击杀 200 敌人，角色回复 1 滴血', bond: BOND_UNITY },

  { id: UPGRADE_CRIT, title: '暴击', desc: '暴击率 +10', bond: BOND_QIAN },

  { id: UPGRADE_ONLY_FAST, title: '唯快不破', desc: '攻击速度 +20%（不改变蓄力时间）；可叠', bond: BOND_QIAN },

  { id: UPGRADE_REFINE, title: '精益求精', desc: '暴击率 +5（可叠）；每 3 点暴击使暴击伤害 +0.02 倍率', tier: 'advanced', bond: BOND_QIAN },

  { id: UPGRADE_KNOCKBACK, title: '击退', desc: '命中击退 +1 身位', tier: 'advanced' },

  { id: UPGRADE_TAMER, title: '驯兽师', desc: '跟班伤害 +5、跟班移速 +0.05', bond: BOND_UNITY },

  { id: UPGRADE_DEMON, title: '恶魔', desc: '生成 1 个恶魔跟班（基础伤害 10+角色伤害×20%）', tier: 'advanced', bond: BOND_UNITY },

  { id: UPGRADE_SLIME_GG, title: '史莱姆gg', desc: '生成 2 个史莱姆跟班（g-1、g-2），基础伤害 5', bond: BOND_UNITY },

  { id: UPGRADE_COMPANIONSHIP, title: '伴我同行', desc: '角色每击杀 100 怪物，跟班伤害 +1（+0.5/层）', bond: BOND_UNITY },

  { id: UPGRADE_THORN, title: '荆棘', desc: '受击时对 2 身位内敌人造成 攻击×150%（每层 +50%，范围 +0.5 身位）', bond: BOND_SHENG },

  { id: UPGRADE_NOURISH, title: '滋补', desc: '每击杀 1000 个敌人回复 1 滴血（每层 −100）', bond: BOND_SHENG },

  { id: UPGRADE_GREED, title: '贪婪', desc: '获取经验时 50% 概率再获得一次经验（每层 +10% 概率，最高 100%）', tier: 'advanced' },

  { id: UPGRADE_EGG, title: '奇怪的蛋', desc: '生成 1 个可成长的蛋跟班；可叠', tier: 'advanced', bond: BOND_UNITY },

]



/* ---- P42 批次3（TASK-026）：power「激发力量」子系统（UI / 会话侧） ---- */

/** 统一显示名：卡牌屏与回忆条目都用它；素材未过审 → 局内空白方块。 */
export const POWER_TITLE = '激发力量'

/** 触发节奏：每 10 级（Lv.10/20/30…）一次；走完当次常规升级后才单独进 power 屏。 */
export const POWER_EVERY = 10

export const POWER_RAPID = 'rapid'

export const POWER_PIERCE_AMP = 'pierce_amp'

export const POWER_STEADY = 'steady'

export const POWER_SP = 'sp'

/** 只能获得一次的效果 id；`sp`（sp-power）不在其中 → 可无限叠。 */
export const POWER_UNIQUE_IDS = [POWER_RAPID, POWER_PIERCE_AMP, POWER_STEADY]

/** P42 批次5（R4④）：卡面文案精简成一句关键能力，保证落在卡内不溢出。 */
export const POWER_EFFECTS = [
  { id: POWER_RAPID, name: '连射', desc: '额外射出一发' },
  { id: POWER_PIERCE_AMP, name: '贯穿强化', desc: '穿透 +1，每穿 1 敌伤害 +50%' },
  { id: POWER_STEADY, name: '定神', desc: '静止 0.15s → 下次攻击必暴' },
  { id: POWER_SP, name: 'sp-power', desc: '伤害 +20，可叠加' },
]

export function powerEffectById(id) {
  return POWER_EFFECTS.find((e) => e.id === id) ?? null
}

/** 候选池按角色：游侠 4 个；战士 / 法师只有 sp-power。 */
export function powerPoolFor(charId) {
  if (charId === CHAR_WARRIOR || charId === CHAR_MAGE) return [POWER_SP]
  return POWER_EFFECTS.map((e) => e.id)
}

/** 唯一性过滤：已拿过的唯一项移出候选池；sp 永远保留。 */
export function powerCandidatesFor(charId, taken = []) {
  const got = new Set(Array.isArray(taken) ? taken : [])
  return powerPoolFor(charId)
    .filter((id) => !POWER_UNIQUE_IDS.includes(id) || !got.has(id))
    .map((id) => powerEffectById(id))
    .filter(Boolean)
}

/**
 * 回忆条目 id 前缀。不能直接复用 `'power'`：那是常规升级「力量」的 id，
 * 会被 uniqueBondCount 计进天行健（R3① 禁止把 power 算进羁绊）。
 */
export const POWER_MEMORY_PREFIX = 'power_'

export function powerMemoryId(effectId) {
  return `${POWER_MEMORY_PREFIX}${effectId}`
}

export function powerEffectFromMemoryId(id) {
  const s = String(id ?? '')
  if (!s.startsWith(POWER_MEMORY_PREFIX)) return null
  return powerEffectById(s.slice(POWER_MEMORY_PREFIX.length))
}

/* P42 批次5（R3）：卡牌屏尺寸 / 速度 / 入场侧（views/PowerView.vue 消费，数值可被自测直接断言）。 */

/** 卡牌放大：96×132 → 120×160（卡面文案要完整落在卡内）。 */
export const POWER_CARD_W = 120
export const POWER_CARD_H = 160

/** 卡间至少留一张卡宽。 */
export const POWER_CARD_GAP = POWER_CARD_W * 2

/** 漂速 115 → 180 px/s（出牌更快）。 */
export const POWER_CARD_SPEED = 180

export const POWER_CARD_BOB_MIN = 6
export const POWER_CARD_BOB_MAX = 10

/** R3② 入场侧：偶数张左右各一半，奇数张左侧多一张。 */
export function powerCardSide(index, count) {
  const n = Math.max(1, count | 0)
  const leftCount = Math.ceil(n / 2)
  return (index | 0) < leftCount ? 'left' : 'right'
}

/** R3② 入场初始 x：左侧从屏幕左缘外侧、右侧从右缘外侧，各自按名次错开一个 GAP。 */
export function powerCardStartX(index, count, width) {
  const n = Math.max(1, count | 0)
  const side = powerCardSide(index, n)
  const leftCount = Math.ceil(n / 2)
  const rank = side === 'left' ? (index | 0) : (index | 0) - leftCount
  const w = Number(width) || 0
  return side === 'left'
    ? -(POWER_CARD_W * 1.5) - rank * POWER_CARD_GAP
    : w + POWER_CARD_W * 1.5 + rank * POWER_CARD_GAP
}

/** 从 fromLevel 升到 toLevel 跨过几个 10 级倍数 = 欠几次 power。 */
export function powerDueCount(fromLevel, toLevel) {
  const a = Math.max(0, fromLevel | 0)
  const b = Math.max(a, toLevel | 0)
  return Math.floor(b / POWER_EVERY) - Math.floor(a / POWER_EVERY)
}

export function powerDueAt(level) {
  const lv = level | 0
  return lv > 0 && lv % POWER_EVERY === 0
}

export const API_BASE = 'http://localhost:8080/api'

export const BGM_URL = assetUrl('assets/游戏音乐/music.ogg')

export const RANGER_IDLE_SRC = assetUrl('assets/characters/1/S_Idle.png')

export const WARRIOR_IDLE_SRC = assetUrl('assets/characters/2/S_Idle.png')

export const MAGE_IDLE_SRC = assetUrl('assets/characters/3/S_Idle.png')

export const CHARACTERS = [
  {
    id: CHAR_RANGER,
    name: CHAR_NAME,
    idleSrc: RANGER_IDLE_SRC,
    hp: 3,
    attack: 20,
    pierce: 0,
    fullCharge: '200%',
    trait: '远程射手，蓄力释放穿透箭矢',
  },
  {
    id: CHAR_WARRIOR,
    name: CHAR_WARRIOR_NAME,
    idleSrc: WARRIOR_IDLE_SRC,
    hp: 4,
    attack: 22,
    pierce: 0,
    fullCharge: '160%',
    trait: '近战攻击拥有无限穿透效果；蓄力越久攻击范围越大（最高1.6倍）；每拥有1点穿透，额外增加0.5身位击退效果',
  },
  {
    id: CHAR_MAGE,
    name: CHAR_MAGE_NAME,
    idleSrc: MAGE_IDLE_SRC,
    hp: 2,
    attack: 25,
    pierce: 0,
    fullCharge: '150%',
    trait: '蓄力释放范围伤害，蓄力越久范围越大（最高3倍）；每点穿透额外增加20%伤害。',
  },
]

/** 选角后、尚未绑 player 时 HUD 用心数；有 player 则跟 hpMax。 */
export const CHAR_HP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c.hp]))

export function charById(id) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]
}

export function formatCharStats(ch) {
  const c = typeof ch === 'string' ? charById(ch) : ch
  return `基础属性：血量：${c.hp} | 伤害：${c.attack} | 穿透：${c.pierce} | 满蓄：${c.fullCharge}\n角色特点：${c.trait}`
}

export const RANGER_FRAME = 32

/** 选难度悬停；局内不再绘制。 */
export const OBJECTIVE_TEXT = '目标：活够10分钟'

export const OBJECTIVE_TEXT_TWO = '目标：击败Boss 2次，并活够12分钟'

export function objectiveForDifficulty(id) {
  return String(id) === DIFFICULTY_TWO.id ? OBJECTIVE_TEXT_TWO : OBJECTIVE_TEXT
}

export function bondRank(bondId, uniqueCount) {
  const n = uniqueCount | 0
  const ts = BOND_THRESHOLDS[bondId] ?? BOND_QIAN_THRESHOLDS
  let rank = 0
  for (const t of ts) {
    if (n >= t) rank = t
  }
  return rank
}

export function qianDesired(level, rank) {
  const lv = Math.max(1, level | 0)
  const r = rank | 0
  return {
    speed: r >= 2 ? Math.floor(lv / 2) * 0.01 : 0,
    atk: r >= 4 ? Math.floor(lv / 2) * 1 : 0,
    emptyHp: r >= 6 ? Math.floor(lv / 10) * 1 : 0,
    pierce: r >= 8 ? Math.floor(lv / 15) * 1 : 0,
  }
}

export function expNeedForLevel(level) {
  const lv = Math.max(0, level | 0)
  return EXP_BASE + EXP_GROWTH * lv

}



export function upgradeById(id) {

  return UPGRADES.find((u) => u.id === id) ?? null

}

/** 升级介绍：desc 为字符串（descFor 仍兼容按角色函数写法）；charId 以当前 session 为准。 */
export function descFor(idOrUpgrade, charId) {
  const u = typeof idOrUpgrade === 'string' ? upgradeById(idOrUpgrade) : idOrUpgrade
  if (!u) {
    // P42 批次3：power 回忆条目（power_rapid…）——悬停显示「激发力量 · 本次效果名」。
    const pe = typeof idOrUpgrade === 'string' ? powerEffectFromMemoryId(idOrUpgrade) : null
    return pe ? `${POWER_TITLE} · ${pe.name}` : ''
  }
  return typeof u.desc === 'function' ? u.desc(charId) : u.desc
}

/** 羁绊档位展示（只读，不改档位判定逻辑）。
 *  P42 批次5（R2）：羁绊说明一律只讲抽象条件，不列出计入的升级选项（生生不息与天行健同款说法）。 */
export const BOND_DESC = {
  [BOND_QIAN]: '不同种类升级集齐解锁档位，按角色等级补发',
  [BOND_UNITY]: '不同跟班集齐解锁档位',
  [BOND_VAJRA]: '集齐七兄弟解锁',
  [BOND_SHENG]: '不同种类升级集齐解锁档位',
}

export const BOND_TIERS = {
  [BOND_QIAN]: [
    { rank: 2, text: '随等级提高移速（每 2 级 +0.01）' },
    { rank: 4, text: '随等级提高伤害（每 2 级 +1）' },
    { rank: 6, text: '随等级提高空血上限（每 10 级 +1）' },
    { rank: 8, text: '随等级提高穿透（每 15 级 +1）' },
  ],
  [BOND_UNITY]: [
    { rank: 2, text: '跟班伤害 +5' },
    { rank: 4, text: '跟班获得角色伤害 20%' },
    { rank: 6, text: '跟班攻击单位 +1' },
    { rank: 8, text: '跟班移速 +0.2；伤害 +10；优先攻击角色的目标' },
  ],
  [BOND_VAJRA]: [
    { rank: 7, text: '每 3.0s 释放七色脉冲（3 身位，伤害 攻击×2，每次单独掷暴击；减速 30% 持续 0.4s；不击退、不点燃、不破六娃失锁）' },
    { rank: 7, text: '每个兄弟的效果按「再获得一次」生效（大娃 / 二娃 / 三娃 / 四娃 / 五娃 / 六娃 / 七娃 各按层数 +1 计算）' },
  ],
  [BOND_SHENG]: [
    { rank: 3, text: '受击后 1.5s 移速 +0.20' },
    { rank: 5, text: '每 45s 回 1 心（满血不回）' },
    { rank: 8, text: '受致命伤时以 1 血复活；复活后需再回血 5 次才能再次触发' },
  ],
}

export function bondTiers(bondId) {
  return BOND_TIERS[bondId] ?? []
}
