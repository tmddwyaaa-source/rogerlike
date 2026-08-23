# 交接 — P21（音效修复与新增 / 怪物成长 / 冰人回血 / 设置排版 / 音效音量）

> **主导**：M1  
> **日期**：2026-08-23  
> **本环窗口**：M4、M6、M8。素材拷贝与受伤音效接线由 **M1** 做。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

> P22（局内 UI：顶部通栏 / 齿轮下移 / 画布钳制 / 升级卡结算换装）在本环查收后立刻派，同样归 M8——本环 M8 不要提前做。

已拍板（用户 2026-08-23）：

- 修复「获取经验」拾取音效完全不响；换新射箭音效；新增受伤音效。
- 蜗牛怪、史莱姆x-1 的**每阶血量成长再 +5**（蜗牛 15→20、x-1 17→22；基础值不动）。
- 冰人血 3000→**3300**（重生跟新基础）；新设定：**长时间（默认 3 秒）周围 2 身位没有角色时，每秒回复 20 血量**，回血弹绿边数字（现有绿 `#3dbf5a`，已与草地绿 `#c5e0a3` 不一致，直接复用）。
- 设置页测试模式排版：点按式按钮**一行两个**；滑条类独占行；「提高等级」按钮与文字同行。
- 新增**音效音量**滑条（与音乐音量同款交互，分开控制）。

素材已由 M1 拷入（public + source 哈希一致）：

| 文件 | 用途 |
|------|------|
| `射箭声音.wav` | **替换**游侠开火音效（旧的 `拉弓射箭声音.mp3` 保留在目录里但不再引用） |
| `受伤音效.mp3` | 角色受伤（M4 出钩子，M1 接线播放） |

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M4** | 受伤钩子 `onHurt`（一次性，不播音） | `frontend/src/game/player/**`、`frontend/src/game/render/**` |
| **M6** | 蜗牛/x-1 成长 +5；冰人 3300 与脱战回血 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` |
| **M8** | sfx 修复加固与映射更新；测试模式排版；音效音量 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M1** | 素材（已做）、`match.js` 受伤接线、查收联调、回写文档 | `docs/**`、`match.js`、设计表 |

本环不开 M5 / M7 / M11 / M10。不要改 `combat/**`、`world/**`、`companions/**`、`match.js`、`App.vue`、`backend/**`。不要生图。

---

## 1. 受伤钩子（M4）

`createPlayer` 支持 `opts.onHurt`（或等价 hooks）。**实际扣血时**调用一次（无敌帧挡掉的不要调）；死亡那一下也调。不播音、不引音频。

自测：受伤触发一次；无敌期内不触发；导出不变项不破坏。`node src/game/player/selftest.mjs` 全绿。

## 2. 怪物成长与冰人（M6）

| 项 | 旧 | 新 |
|----|----|-----|
| 蜗牛 `SNAIL_HP_PER` | 15 | **20** |
| 史莱姆x-1 `SLIME_X1_HP_PER` | 17 | **22** |
| 冰人 `ICE_MAN_HP` | 3000 | **3300**（重生 `round(3300×1.4ⁿ)`） |

冰人脱战回血：

- 条件：**周围 2 身位（44px）内无角色持续 3 秒**（常量导出，如 `ICE_REGEN_DELAY_SEC=3`、`ICE_REGEN_RANGE=BODY*2`、`ICE_REGEN_PER_SEC=20`）。
- 触发后：**每 1 秒回 20**，直到角色进入范围（进入立即停并重置计时）。
- 回血走既有 `hooks.onHeal`（绿边数字 `#3dbf5a` 已与草地绿不一致，直接复用，不要新调色）。
- 不超过自身最大血；重生等待期不回血。

自测：蜗牛/x-1 新成长；冰人 3300 / 重生 4620；3 秒无角色开始每秒 +20 且弹绿字；进范围停。`node src/game/enemies/selftest.mjs` 全绿。

## 3. sfx 修复 / 新映射 / 排版 / 音效音量（M8）

### 3.1 sfx.js 加固（本环重点 bug 修复）

「获取经验」完全不响的根因方向：一次性 `Audio` 播完即弃、无引用，加载竞速/GC 会静默掐断。修复：

- `play(name)` 把每个 Audio **持有在集合里，直到 `ended` / `error` 才移除**（禁止叠心跳轨；一次性音效可多实例并行）。
- 创建时 `preload = 'auto'`。
- `safePlay` 失败仍静默，但从集合移除。
- **映射更新**：`shoot: '射箭声音.wav'`（替换）；新增 `hurt: '受伤音效.mp3'`（M1 接线播放，M8 只进映射表）。其余 6 键不动。

### 3.2 测试模式排版（SettingsView + pixel.css）

- 点按式按钮（无敌 / 满蓄模式 / 火柴人 / 升级选项自选）**一行两个**（grid 2 列或 flex wrap，间距走 token）。
- 「测试时间」「刷怪速度」滑条**独占整行**，不与按钮并排。
- 「提高等级」：按钮与 `提高等级 +N` 文字**同行**（横排，现竖排改掉）。
- 保持 P19 像素框架风格与既有类名断言（`rl-picker-x`、`testElapsedSec` 等文案红线不动）。

### 3.3 音效音量

- `settings.js`：新增 `sfxVolume`（默认 **0.7**，clamp 0～1，持久化进现有 localStorage）。
- `SettingsView`：新增「音效音量」滑条，交互与音乐音量一致（实时数字百分比）。
- `GameShell`：watch 后调 `sfx.setVolume(settings.sfxVolume)`；**音乐音量继续只控 BGM**；心跳与全部一次性音效走 `sfxVolume`。
- selftest：sfxVolume 默认/钳制/持久化；滑条文案；`shoot` 新映射为 `射箭声音.wav`；`hurt` 键存在。

`node src/ui/selftest.mjs` 全绿。

---

## 4. M1 接线（子窗口完工后）

- `match.js`：`createPlayer({ ..., onHurt: () => sfx.play('hurt') })`（接口名以 M4 实现为准）。
- 查收：全模块 selftest + `npm run build` + **开游戏实机听音**（拾取结晶必响、新射箭、受伤、心跳、音效音量滑条即时生效）。
- 回写设计表 / GAME-SPEC / 怪物属性表 / ASSETS。

---

## 成功标准

| 窗 | 标准 |
|----|------|
| M4 | 实扣血触发 `onHurt` 一次；无敌不触发；player selftest 绿 |
| M6 | 蜗牛 20 / x-1 22 成长；冰人 3300、3 秒脱战每秒回 20 绿字；enemies selftest 绿 |
| M8 | sfx 引用持有到 ended；`shoot=射箭声音.wav`、`hurt` 入表；测试模式两列排版；音效音量滑条；ui selftest 绿 |
| M1 | hurt 接线、全绿 build、实机音效逐项验证、文档回写 |

---

## 开工粘贴块

### M4

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P21.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 match.js / ui / combat。不要标 Registry done。不要打开游戏。

本环：createPlayer 支持 opts.onHurt——实际扣血时调一次（无敌帧挡掉的不调；死亡那下也调）。不播音不引音频。
更新 selftest（触发一次、无敌不触发）。

完成后说：M4 已完成，请主导窗口查收。
```

### M6

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P21.md 与根目录 怪物属性表.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / ui / match.js / player。不要标 Registry done。不要打开游戏。

本环：
1) 蜗牛每阶成长 15→20；史莱姆x-1 每阶成长 17→22（基础值不动）。
2) 冰人血 3000→3300（重生 round(3300×1.4^n)）。
3) 冰人脱战回血：周围 2 身位无角色持续 3 秒 → 每 1 秒回 20，走 hooks.onHeal 绿字（复用现有绿色，不调色）；角色进范围立即停并重置；不超最大血；重生等待期不回。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M8

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P21.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图。P22 局内 UI 本环不做。

本环：
1) sfx.js 加固：play() 持有 Audio 引用到 ended/error 才释放；preload='auto'；修「获取经验」不响。
   映射更新：shoot='射箭声音.wav'（替换）；新增 hurt='受伤音效.mp3'（M1 接线，只入表）。
2) 测试模式排版：点按式按钮一行两个；测试时间/刷怪速度滑条独占行；「提高等级」按钮与文字同行。
3) 音效音量：settings 新增 sfxVolume（默认 0.7，clamp，持久化）；设置页加同款滑条（实时百分比）；GameShell 接 sfx.setVolume；音乐音量仍只控 BGM。
更新 selftest（sfxVolume、新映射、hurt 键、排版结构）。

完成后说：M8 已完成，请主导窗口查收。
```
