# 交接 — P22（局内 UI：HUD 顶部通栏 / 齿轮下移 / 画布钳制 / 升级卡结算换装）

> **主导**：M1  
> **日期**：2026-08-23  
> **本环窗口**：**仅 M8**。画布矩形 CSS 变量接线已由 **M1** 做完（`App.vue`）。查收联调由 M1 做。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M8 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

已拍板（用户，P19 时定方向、本环落地）：

- 局内 UI 用**黑色像素框**（深色半透底 + 硬边框），与菜单的浅色像素框区分。
- HUD 改**顶部通栏式**：**通栏与齿轮必须钳制在画布黑色留边内侧**，不得压到画布外的深色留边。
- 齿轮从右上角**下移**避开通栏。

M1 已完成的接线（M8 直接消费，不要改 `App.vue`）：

- `App.vue` 在挂载/resize/画布尺寸变化时，把画布矩形写到 `.rl-root` 上：
  `--rl-stage-left` / `--rl-stage-top` / `--rl-stage-width` / `--rl-stage-height`（均为 px）。
- 自测环境（Node）没有这些变量——**所有消费处必须带 fallback**（如 `var(--rl-stage-left, 0)`、`var(--rl-stage-width, 100%)`），保证无变量时退回全窗布局、selftest 不炸。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M8** | HUD 通栏重构、齿轮下移、升级卡/结算/回忆换装、selftest 同步 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M1** | `App.vue` 变量接线（已做）、查收联调开游戏、回写文档 | `docs/**`、`App.vue`、设计表 |

本环不开 M4 / M5 / M6 / M7 / M11 / M10。不要改 `combat/**`、`player/**`、`world/**`、`companions/**`、`match.js`、`App.vue`、`backend/**`。不要生图。

---

## 1. 深色像素框变体

新增 `.rl-frame--dark`：底 `var(--rl-bg)` 半透（如 `rgba(26,34,20,.78)`）、外框 3px `var(--rl-ink)`、内亮线用 `--rl-paper` 或米黄低透明；零圆角、无渐变、过渡仅 `steps()`。局内 HUD/通栏/升级卡用深色变体，菜单弹窗维持浅色不变。

## 2. HUD 顶部通栏 + 底部经验通栏（HudOverlay 重构）

**顶部通栏**（高约 28px，`.rl-frame--dark`）：

- 左：角色名 + 心（`hearts(hp, hpMax)` 逻辑与断言不动）
- 中：存活时间
- 右：羁绊 chips（`rl-bonds` 类名、`flex-wrap`、悬停档位 tooltip 全部保留；宽度可调，**若 `282px` 变更须同步 selftest 断言**）
- 定位：`left: var(--rl-stage-left, 0)`；`width: var(--rl-stage-width, 100%)`；`top: var(--rl-stage-top, 0)` —— **左右上下都不得超出画布黑边**。

**底部经验通栏**（高约 24px，同风格）：

- 左：`Lv.x`；中：经验条（`rl-bar` 机制保留）；右：`exp/need`；蓄力条并入此条（居中或右侧，样式不变红 `--rl-red`），「蓄力中/就绪」文字态保留。
- 定位：与画布底边对齐（如 `top: calc(var(--rl-stage-top, 0px) + var(--rl-stage-height, 100vh) - 24px)`，实现自选，验收=不越黑边）。

原 `rl-hud` 左上角面板取消；`pointer-events: none` 保持（不挡画布输入）。暂停/升级/回忆复用 HUD 的地方（`MoreView` 详情）改为复用通栏数据或独立小面板，**不破坏其现有断言**。

## 3. 齿轮下移

齿轮 `rl-gear`：右缘对齐画布右内侧、位于顶部通栏**下方**（如 `top: calc(var(--rl-stage-top, 0px) + 40px)`；`left: calc(var(--rl-stage-left, 0px) + var(--rl-stage-width, 100%) - 46px)`，实现自选）。ESC 行为、z-index 不变。「……」按钮同理钳制画布左下内侧。

## 4. 升级卡 / 结算 / 回忆换装

- 升级三选一卡：宽 132→约 **160px**，`.rl-frame--pop` + 深色卡面；图标/标题/描述结构与 `:advanced` 断言不动。
- 结算卡 `rl-result`：`.rl-frame--pop` 纸面（浅色）不变内容。
- 回忆详情：同套框；`rl-mem-tip`、`4ch`、`×{{ u.count }}` 断言不动。
- 心形 `clip-path` 换程序像素心（**可选**，不阻塞验收）。

## 5. selftest 同步

- **全部既有断言保留**（`hearts`/`hpMax`、`.rl-bonds`+`flex-wrap`、`rl-mem-mult`+`4ch`、`.rl-mem-tip`、`pre-line`、`.rl-char-tip`、设置页文案、PixelIcon 四键、GameShell 关键串）。
- `282px` 若数值变化 → 同步改。
- 新增：`.rl-frame--dark` 存在；通栏类存在；`--rl-stage-left` fallback 写法存在（`var(--rl-stage-left` 字样）。

`node src/ui/selftest.mjs` 全绿。

---

## 成功标准

| 窗 | 标准 |
|----|------|
| M8 | 顶/底通栏与齿轮在画布黑边内（变量 + fallback）；深色框变体；升级卡 160px；全部断言绿 |
| M1 | 查收：selftest + build + 开游戏实机（窗口缩放时通栏仍贴画布不越黑边）；回写设计表 |

---

## M8 开工粘贴块

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P22.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图。App.vue 已由 M1 写好 --rl-stage-left/top/width/height 变量，只消费不修改。

本环（P22 局内 UI）：
1) .rl-frame--dark 深色像素框变体（半透深底 + 硬框，零圆角，过渡仅 steps()）。
2) HUD 重构：顶部通栏（左角色名+心 / 中计时 / 右羁绊 chips）+ 底部经验通栏（Lv / 经验条 / 蓄力条）；定位用 var(--rl-stage-*, fallback)，绝不越画布黑边；rl-hud 左上面板取消；pointer-events:none 保持。
3) 齿轮下移到通栏下方、右缘对齐画布内侧；「……」同理钳制左下。
4) 升级卡 132→约160px .rl-frame--pop 深色卡；结算/回忆换装；心形像素化可选。
5) 同步 ui/selftest.mjs：既有断言全保留；282px 若变同步改；新增 --dark 与通栏与 --rl-stage fallback 断言。

完成后说：M8 已完成，请主导窗口查收。
```
