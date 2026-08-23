# 交接 — P23（拾取音效增益 / 菜单钳制 / 羁绊悬停修复 / 回忆排版 / 测试面板 / 三滑条音量）

> **主导**：M1  
> **日期**：2026-08-23  
> **本环窗口**：**仅 M8**。查收联调由 M1 做。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M8 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

> 已定案（用户 2026-08-23，实测后确认）：拾取音不响根因是**素材电平过低**（RMS −28 dB vs 其他 −14~−19），代码链路经 M1 实测全部正常。用**代码增益**修复，不等新素材。

已拍板：

1. **sfx 每音效增益表**：pickup **+14dB**（≈×5 线性）、levelup **+9dB**（≈×2.8）；最终音量钳制 ≤1。
2. **菜单流钳制画布黑边**：开始屏/选角/难度/菜单进的设置页全部钳在 `--rl-stage-*` 矩形内（回退值兜底），四周露出深色留边，与局内一体化。
3. **齿轮、「……」回窗口角落原位**（P22 前）：齿轮 `top:10px right:10px`、「……」`left:10px bottom:10px`，以**窗口**为参照，不再钳画布。
4. **羁绊悬停修复**：`.rl-bond` 恢复 `pointer-events: auto`（容器 `.rl-bonds` 保持 none 不挡画布）；悬停显示效果说明 + 全部档位，已达深色、未达浅色（P20 结构已在）。
5. **羁绊单排一列**：`.rl-bonds` 改纵向单列（一行一个 chip）；`282px` 等相关断言同步。
6. **回忆详情排版重做**：放大面板、分区透气、终局属性完整显示——**等级**必须完整醒目，不再挤成一团。
7. **测试模式右侧展开面板**：设置页左列常规项；点亮「测试模式」后**右侧新面板**承载全部测试选项（无敌/满蓄/火柴人/升级自选/测试时间/刷怪速度/提高等级），关闭即收起。
8. **三滑条音量**：`音量` 改名**总音量**；新增**背景音乐**滑条（默认 0.7，只管 BGM）；音效音量不变。**实际 BGM = 总音量 × 背景音乐；实际音效 = 总音量 × 音效音量**。

局内 HUD 顶/底通栏**保持 P22 现状不动**。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M8** | 上述 1–8 全部实现 + selftest 同步 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M1** | 查收联调（selftest/build/开游戏实测悬停与拾取音量）、删临时测试页、回写文档 | `docs/**`、设计表 |

不要改 `combat/**`、`player/**`、`world/**`、`companions/**`、`match.js`、`App.vue`、`backend/**`。不要生图。

---

## 实现要点

### 1. 增益表（ui/sfx.js）

```js
export const SFX_GAIN = { pickup: 5.0, levelup: 2.8 }  // 缺省 1
// play(): a.volume = Math.min(1, vol * (SFX_GAIN[name] ?? 1))
// 心跳不增益
```

### 2. 菜单钳制（pixel.css）

`.rl-screen` 改为：`left/top/width/height` 全走 `var(--rl-stage-*, 回退)`（回退 = 现全窗布局，保证 Node selftest 不炸）。浅绿屏面只出现在画布矩形内；四周露出 `--rl-bg` 深色底（窗口背景已是 #1a2214）。

### 3. 齿轮 / 「……」复位（pixel.css）

- `.rl-gear`：`position:absolute; top:10px; right:10px;`（窗口右上）
- `.rl-ellipsis`（「……」）：`position:absolute; left:10px; bottom:10px;`（窗口左下）
- 删除 P22 的 `--rl-stage-*` 偏移写法。

### 4–5. 羁绊（pixel.css / GameShell.vue）

- `.rl-bond { pointer-events: auto; }`（容器 `.rl-bonds` 保持 `pointer-events:none`）
- `.rl-bonds` 改单列：`flex-direction: column; align-items: flex-end;`（或等价）；宽度/`282px`/`flex-wrap` 断言按实际同步
- 悬停 tooltip（效果 + 档位 + 深浅）结构沿用 P20，确保真的能 hover 出来

### 6. 回忆详情（MoreView.vue + pixel.css）

终局面板放大（建议 `min(520px, 94vw)` 起）；属性分行分区（等级 / 心 / 经验 / 存活时间 / 击杀 / 升级图标），等级字号提高；不再与 HUD 复用同一个小面板布局。`rl-mem-tip`、`4ch`、`×{{ u.count }}` 断言保留。

### 7. 测试面板（SettingsView.vue + pixel.css）

- 测试模式关闭：右侧无面板。
- 打开：右侧出现 `.rl-frame` 面板承载全部测试项；左列只剩 音量三滑条 / 操作教程 / 返回。
- 布局自选（grid 双列 / flex），窗口窄时允许上下堆叠；文案红线全部不变。

### 8. 三滑条（settings.js / SettingsView.vue / GameShell.vue）

- `settings.js`：新增 `bgmVolume`（默认 0.7，clamp，持久化合并进现有 localStorage）。
- `SettingsView`：三滑条——**总音量**（原 `volume` 字段与持久化值不变，仅改名）、**背景音乐**、**音效音量**，交互同款实时百分比。
- `GameShell`：`bgm.setVolume(volume × bgmVolume)`、`sfx.setVolume(volume × sfxVolume)`（含 watch 与初始）。

### selftest 同步

- 保留清单同 P19/P22（设置文案红线、PixelIcon、rl-char-tip、pre-line、4ch、rl-mem-tip 等）。
- `282px`/`flex-wrap` 若因单列调整 → 同步改断言。
- 新增：`SFX_GAIN` 存在且 pickup>1；`.rl-bond` 含 `pointer-events: auto`；`.rl-screen` 含 `--rl-stage-left` 消费；`.rl-gear` 回 `top:10px`/`right:10px`；`bgmVolume` 默认 0.7 与钳制；设置页含「总音量」「背景音乐」文案。

`node src/ui/selftest.mjs` 全绿。

---

## 成功标准

| 窗 | 标准 |
|----|------|
| M8 | 1–8 全实现；ui selftest 绿 |
| M1 | build + 开游戏实测：拾取音清晰可闻、菜单四屏在黑边内、缩放窗口仍贴合、齿轮/「……」在窗口角、羁绊悬停出档位、回忆详情大而全、测试面板右开、三滑条联动正确；删除 `__soundtest.html`；回写文档 |

---

## M8 开工粘贴块

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P23.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图。局内 HUD 顶/底通栏保持现状。

本环（P23）：
1) sfx.js 增益表：pickup +14dB(×5)、levelup +9dB(×2.8)，音量 min(1, vol×gain)；心跳不增益。
2) 菜单流（标题/选角/难度/菜单设置页）钳制在 var(--rl-stage-*, 回退) 矩形内，四周露深色留边。
3) 齿轮回窗口右上 top:10px right:10px；「……」回窗口左下 left:10px bottom:10px；删 P22 的画布偏移。
4) 羁绊：.rl-bond 恢复 pointer-events:auto（容器仍 none）让悬停真的触发；.rl-bonds 改单排一列；相关断言同步。
5) 回忆详情面板放大重排：属性分区完整显示，等级醒目；rl-mem-tip/4ch/×n 断言保留。
6) 测试模式改右侧展开面板：开→右侧新 .rl-frame 面板装全部测试项；关→收起。文案红线不变。
7) 三滑条：音量改名「总音量」（字段不变）；新增「背景音乐」bgmVolume 默认 0.7；BGM=总×背景、音效=总×音效音量（watch+初始）。
更新 ui/selftest.mjs（保留清单见 HANDOFF；282px/flex-wrap 若变同步改；新增增益/pointer-events/钳制/三滑条断言）。

完成后说：M8 已完成，请主导窗口查收。
```
