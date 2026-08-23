# 交接 — P20（怪物血量 / 冰人强化 / 文案修正 / 羁绊悬停 / 游戏音效）

> **主导**：M1  
> **日期**：2026-08-23  
> **本环窗口**：M5、M6、M8。素材拷贝与音效接线由 **M1** 做。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

> **接手注意**：P19 刚改过 `ui/pixel.css` / `StartView` / `SettingsView`（像素框架菜单环）。M8 开工先重读磁盘，冲突先报 M1。

已拍板（用户 2026-08-23）：

- 怪物基础血 +5、每阶成长 +5（**兰花、灰树、普通树、测试木桩不算**；冰人单独走本环强化，不叠加）。
- 冰人血 2000→**3000**，三技能 CD 各 **−3**（冲刺 12 / 弹幕 22 / 兰花 32），重生血跟新基础 `round(3000×1.4ⁿ)`。
- 文案三处：穿透去法师括注；敏捷随数值改 **+0.15**；强化射击介绍**按角色显示**。
- 羁绊 chip 悬停显示效果与全部档位，**已达档深色、未达浅色**。
- 新增 8 个音效（素材已由 M1 两边拷入 `游戏音乐/`）。

素材已拷（public + source 哈希一致，见 RECEIPT-LOG）：

| 文件 | 用途 | 接线方 |
|------|------|--------|
| `拉弓射箭声音.mp3` | 游侠开火 | M5 钩子 → M1 |
| `挥砍声音.mp3` | 战士挥砍 | M5 钩子 → M1 |
| `法师火球.mp3` | 法师法球 | M5 钩子 → M1 |
| `获取经验.mp3` | 拾取结晶 | M1（notifyExp 通路） |
| `升级音效.ogg` | 升级 +1 | M8 |
| `低血量心跳.mp3` | 剩 1 心循环 | M8 |
| `游戏失败.ogg` | 死亡结算 | M8 |
| `通关音效.ogg` | 胜利结算 | M8 |

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M5** | 开火音效钩子 `onFire`（一次性，不播音） | `frontend/src/game/combat/**`、`frontend/src/game/weapons/**` |
| **M6** | 四怪血量 +5/+5；冰人 3000 与 CD −3 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` |
| **M8** | 文案三处 + 敏捷数值；羁绊悬停；音效播放器与 UI 相位 4 音效 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M1** | 素材（已做）、`match.js` 音效接线、查收联调、回写文档 | `docs/**`、`match.js`、设计表 |

本环不开 M4 / M7 / M11 / M10。不要改 `match.js`（M1 接线）、`backend/**`、`App.vue`。不要生图。

---

## 1. 开火音效钩子（M5）

`createCombat` 已有 `hooks` 通道。在**实际发射瞬间**（间隔结算通过、真的射出/挥出）调用：

```js
hooks.onFire?.(kind)   // kind: 'shoot' | 'slash' | 'fireball'（按 player.charId：ranger/warrior/mage）
```

- **同一次开火只算一次**：散射双发、背后弹道、强化箭都不重复触发。
- 满蓄模式 / 测试模式照常触发。
- combat **不播音、不引音频文件**，只回调；播音由 M1 在 match.js 接。

自测：三角色各开火一次触发对应 kind；散射只触发一次；未到间隔不触发。`node src/game/combat/selftest.mjs` 全绿。

---

## 2. 怪物血量与冰人（M6）

### 2.1 四怪 +5 / +5

| 对象 | 基础 | 每阶成长 |
|------|------|----------|
| 蘑菇 `CREEP_HP` | 27→**32** | `MUSHROOM_HP_PER_TIER` 5→**10** |
| 蜗牛 `SNAIL_HP0` | 45→**50** | `SNAIL_HP_PER` 10→**15** |
| 史莱姆x-1 `SLIME_X1_HP0` | 115→**120** | `SLIME_X1_HP_PER` 12→**17** |
| 蝎子 `SCORPION_HP0` | 100→**105** | `SCORPION_HP_PER` 10→**15** |

- 裂怪走蘑菇公式、x-3 走母体 25%：**自动跟随，不单独改**。
- **不动**：兰花（1 血）、灰树、普通树、测试木桩。
- 难度二 `getHpGrowthAdd(+5)` 仍叠加在新每阶上（如蘑菇难度二每阶 15）。

### 2.2 冰人

| 项 | 旧 | 新 |
|----|----|-----|
| 血 `ICE_MAN_HP` | 2000 | **3000** |
| 冲刺 CD | 15 | **12** |
| 弹幕 CD | 25 | **22** |
| 兰花 CD | 35 | **32** |
| 重生血 | `round(2000×1.4ⁿ)` | `round(3000×1.4ⁿ)` |

重生 180s、逃跑 10s、预警 0.25s、移速倍率、掉 300 结晶全部不动。

自测：四怪新基础/成长值；难度二叠加；冰人 3000、CD 12/22/32、重生 n=1 血 4200。`node src/game/enemies/selftest.mjs` 全绿。

---

## 3. 文案 / 敏捷 / 羁绊悬停 / 音效（M8）

### 3.1 文案三处（`ui/constants.js` + 渲染处）

1. 穿透 desc：`穿透 +1（法师：每点穿透伤害 +20%）` → **`穿透 +1`**
2. 敏捷 desc：`移速 +0.20` → **`移速 +0.15`**；同文件 `MOVE_SPEED_BONUS` **0.20 → 0.15**（生效值与文案同环改齐）
3. 强化射击 desc **按角色显示**（三选一卡片 `UpgradeView` 与回忆 `MoreView` 的 desc 都要走这套）：
   - 游侠：**`满蓄改为激光，伤害 ceil(攻击×2.5)，穿透 +2，过量可溢出，攻击 +5`**
   - 战士 / 法师：**`+15`**
   - 实现自选（如 `descFor(id, charId)` 或 desc 支持函数），以**当前 `session.charId`** 为准。

其余 17 项 desc **一字不改**。

### 3.2 羁绊悬停（`rl-bonds` chip）

悬停 chip 显示 tooltip（绝对定位不占布局，机制参照 `rl-mem-tip`）：

- 内容：羁绊效果说明 + **全部档位**列表
- **已达到的当前档位：深色；未达到档位：浅色**（用像素 token 色板，如已达 `--rl-ink` / 未达 `--rl-sub` 或等价对比）
- 档位与效果（只读展示，不改 P18 逻辑）：
  - 天行健：档 2 移速 / 档 4 伤害 / 档 6 空心上限 / 档 8 穿透（按等级补发）
  - 万物一心：档 3 跟班伤 +5 / 档 6 每次跟班伤害 +floor(攻击×10%) / 档 9 每只目标 +1

### 3.3 音效播放器

新建 `ui/sfx.js`（或并到 `bgm.js` 旁的等价模块），暴露 `createSfx()` / `playSfx(name)`：

- 文件映射常量：`shoot=拉弓射箭声音.mp3`、`slash=挥砍声音.mp3`、`fireball=法师火球.mp3`、`pickup=获取经验.mp3`、`levelup=升级音效.ogg`、`heartbeat=低血量心跳.mp3`、`defeat=游戏失败.ogg`、`victory=通关音效.ogg`（路径 `/assets/游戏音乐/`）
- 音量跟随设置音量（与 BGM 同系数）
- **本环 M8 接 4 个 UI 相位音效**：
  - `levelup`：phase 进入 `levelup`（+1 出现）时播一次
  - `heartbeat`：`hud.hp <= 1` 循环播放；回血 >1 或死亡立即停
  - `defeat`：进入 `result` 播
  - `victory`：进入 `victory` 播
- `shoot / slash / fireball / pickup` 只提供 API，**由 M1 在 match.js 接**，M8 不要自己碰 match.js。

自测：文案三处（穿透无括注、敏捷 +0.15 且 MOVE_SPEED_BONUS===0.15、强化射击按 charId 两套文案）；羁绊 tooltip 结构存在且既有 `.rl-bonds` 断言不破；sfx 映射 8 键齐全；4 个 UI 相位接线。`node src/ui/selftest.mjs` 全绿。

---

## 4. M1 接线（子窗口完工后）

- `match.js` combat hooks 加 `onFire: (kind) => sfx.play(kind)`（映射 shoot/slash/fireball）
- 捡结晶 `notifyExp` gained>0 → `pickup`（同帧去重，只播一次）
- 查收：全模块 selftest + `npm run build` + 开游戏实机（音效听感、羁绊悬停、文案）
- 回写 `游戏当前设计表.md` / `GAME-SPEC.md` / `怪物属性表.md`

---

## 成功标准

| 窗 | 标准 |
|----|------|
| M5 | `onFire` kind 正确、单次开火只一次；combat selftest 绿 |
| M6 | 四怪 32/50/120/105 与成长 10/15/17/15；冰人 3000 / 12/22/32 / 重生 4200；enemies selftest 绿 |
| M8 | 文案三处 + 敏捷 0.15；羁绊悬停深浅档位；sfx 播放器 + 4 相位接线；ui selftest 绿 |
| M1 | 音效接线、全绿 build、开游戏实机、文档回写 |

---

## 开工粘贴块

### M5

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P20.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / enemies / match.js。不要标 Registry done。不要打开游戏。

本环：实际发射瞬间调 hooks.onFire?.(kind)，kind 按 charId：ranger='shoot'、warrior='slash'、mage='fireball'。
同一次开火（散射双发/背后弹道/强化箭）只触发一次；combat 不播音不引音频。
更新 selftest（三 kind、散射一次、间隔未到不触发）。

完成后说：M5 已完成，请主导窗口查收。
```

### M6

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P20.md 与根目录 怪物属性表.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / ui / match.js。不要标 Registry done。不要打开游戏。

本环：
1) 蘑菇 32/每阶10；蜗牛 50/15；史莱姆x-1 120/17；蝎子 105/15。裂怪/x-3 自动跟随不改。兰花/树/木桩不动。难度二 getHpGrowthAdd 仍叠加。
2) 冰人血 3000；冲刺/弹幕/兰花 CD 12/22/32；重生血 round(3000×1.4^n)。其余（180s/逃跑/预警/移速/掉300）不动。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M8

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P20.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图。P19 刚改过 pixel.css/StartView/SettingsView，先重读磁盘。

本环：
1) 文案三处：穿透 desc 改「穿透 +1」；敏捷 desc 改「移速 +0.15」且 MOVE_SPEED_BONUS 0.20→0.15；强化射击 desc 按当前 charId：游侠「满蓄改为激光，伤害 ceil(攻击×2.5)，穿透 +2，过量可溢出，攻击 +5」、战士/法师「+15」（三选一与回忆都走这套）。其余 17 项 desc 一字不改。
2) 羁绊 chip 悬停 tooltip：效果说明 + 全部档位；已达档深色、未达浅色（像素 token 配色；绝对定位不占布局）。
3) 音效播放器 ui/sfx.js：8 文件映射（shoot/slash/fireball/pickup/levelup/heartbeat/defeat/victory，路径 /assets/游戏音乐/），音量跟随设置。本环接 4 个：levelup（进 levelup 播一次）、heartbeat（hp<=1 循环，回血/死亡停）、defeat（进 result）、victory（进 victory）。其余 4 个只留 API 由 M1 接。
更新 selftest（文案、MOVE_SPEED_BONUS===0.15、tooltip 结构、sfx 8 键、4 相位）。

完成后说：M8 已完成，请主导窗口查收。
```
