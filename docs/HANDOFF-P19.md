# 交接 — P19（UI 像素框架改版 · 菜单环）

> **主导**：M1  
> **日期**：2026-08-23  
> **本环窗口**：**仅 M8**。查收与联调由 M1 做。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M8 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

> **接手项目注意**：P18（蝎子 / 羁绊 / 难度二等玩法环）已于 2026-08-23 查收关闭。开工（斥候阶段）先重读磁盘上 `ui/**`、`views/**` 的最新状态（P18 给 M8 加了羁绊与难度二），若与本交接冲突，先在斥候报告里列出，等 M1 拍板。

已拍板（用户）：

- 主题：**像素框架**。菜单流用**浅色像素框**（纸面/屏面底 + 墨色双层硬边框）；零圆角、无渐变、无模糊阴影。
- 节奏：**先菜单（P19）后局内（P20）**。本环只做菜单四屏（标题 / 选角 / 难度 / 设置）。
- 只改皮不改骨：**所有文案原文、props/emit 接口、hover 属性机制一律不动**。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M8** | token 层 + 像素框架通用类 + 菜单四屏换装 + selftest 同步 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M1** | 规格、派工、查收、联调（build + 开游戏）、回写设计表 | `docs/**`、`游戏当前设计表.md` |

本环不开 M4 / M5 / M6 / M7 / M11 / M10。**不要改** `combat/**`、`player/**`、`world/**`、`companions/**`、`match.js`、`App.vue`、`backend/**`。不要生图。

---

## 1. 设计 token 层（第一件事）

`frontend/src/ui/pixel.css` 顶部抽 `:root` CSS 变量，现有散落魔法值全部收敛：

```css
:root {
  /* 色板（取自现值，不改色相） */
  --rl-ink: #2c2c28;        /* 墨色：边框/文字 */
  --rl-bg: #1a2214;         /* 深墨绿：全局底/遮罩基色 */
  --rl-screen: #c5e0a3;     /* 浅绿：全屏屏面 */
  --rl-panel: #b8d06a;      /* 面板绿 */
  --rl-paper: #f4e8c0;      /* 纸面：hover/高亮/HUD 文字 */
  --rl-btn: #cec95f;        /* 按钮黄 */
  --rl-lock: #9aaa58;       /* 标题阴影/锁定 */
  --rl-red: #c42b5a;        /* 强调红 */
  --rl-sub: #3d5a2a;        /* 副文字 */
  --rl-heart-off: #5a4030;  /* 心暗态 */
  /* 间距标尺 */
  --rl-s1: 4px; --rl-s2: 8px; --rl-s3: 12px; --rl-s4: 16px; --rl-s5: 24px;
  /* 字号标尺（等宽字体栈不变） */
  --rl-f1: 12px; --rl-f2: 14px; --rl-f3: 16px; --rl-f4: 20px; --rl-f5: 28px; --rl-f6: 42px;
}
```

- 60+ 个 `rl-` 类**全部**改用变量；字号/间距收敛进标尺（个别确需中间值的用 `calc()`）。
- 字体栈保持 `ui-monospace, "Cascadia Mono", "Sarasa Mono SC", monospace`，**不引入 web 字体**。

## 2. 像素框架通用类（新增）

- `.rl-frame`：`border: 3px solid var(--rl-ink); box-shadow: inset 0 0 0 2px var(--rl-paper)` —— 外墨内亮**双层硬边框**；零圆角。
- `.rl-frame--pop`：在 `.rl-frame` 基础上加硬投影（如 `4px 4px 0 rgba(0,0,0,.35)`），用于弹窗等浮起层。
- 按钮三态：normal 黄底墨框 → hover 纸面底 + `translate(1px,1px)` + 硬阴影收紧 → active 再下移 1px。菜单主按钮统一 `min-width: 200px`。
- 像素分隔线：`3px solid var(--rl-ink)` + `2px var(--rl-paper)` 双线，用于设置页分区。
- 动效约束：如需过渡只用 `steps()`；**禁止** ease 平滑、圆角、渐变、模糊阴影。
- 焦点可达性不得倒退：键盘 focus 仍有可见样式。

## 3. 菜单四屏换装

| 屏 | 要求 |
|----|------|
| 标题屏 | 保留硬阴影大标题与副标题；三按钮竖排统一宽度、间距 `--rl-s3`；底部加一条双行像素装饰色带（屏面绿 + 墨色） |
| 选角屏 | 3 张角色卡改 `.rl-frame` 卡（约 128px 宽）：上部立绘框（内嵌 2px 墨框）、名字条；悬停属性**仍走 `rl-char-tip`**（类名与 `.rl-pick:hover .rl-char-tip` 机制不动，`pre-line` 两行原文不动，只改样式） |
| 难度屏 | 两个 `.rl-frame` 横排按钮；悬停目标文案沿用现有 `rl-char-tip` 结构，原文不动（P18 已有难度二） |
| 设置页 | 每个 panel 套 `.rl-frame`，面板间距 `--rl-s3`，分区用像素双线；滑条视觉改块状像素条（实现自选，`accent-color` 兜底可留）；操作教程 KeyIcon 排一行；「返回主页」确认弹窗改 `.rl-frame--pop` 纸面卡 |

## 4. 只改皮不改骨（红线）

- `StartView` / `SettingsView` 的 **props/emit 全部不动**；`GameShell` 相位逻辑不动。
- 文案原文（`formatCharStats` 两行、难度目标、设置项名称）**一字不改**。
- P18 新加的羁绊计数、难度二逻辑、`rl-bonds` 右侧 HUD **只许改样式，不许改行为**。
- `RangerPortrait`、`PixelIcon`、`KeyIcon` 的 canvas 逻辑不动（最多加包裹样式）。
- `icons.js` 遗留导出（`ICON_MAPS` / `paintIcon` 等）**不删不改**。

## 5. 顺手清理

- 删除死样式：`.rl-pick.locked`、`.rl-avatar.q`（无 DOM 引用；若 P18 后已删则跳过）。
- `.rl-toggle` 色义对调：on 用绿（`--rl-sub` 或面板绿）、off 用暗，消除「红=开」反直觉；若 selftest 有色值断言同步改。

## 6. selftest 同步清单（`frontend/src/ui/selftest.mjs`）

**必须保留**（现断言原文）：

- `rl-char-tip` + `.rl-pick:hover .rl-char-tip` 选择器、`white-space: pre-line`
- `formatCharStats`、`OBJECTIVE_TEXT` / `OBJECTIVE_TEXT_TWO`、`rl-diff-pick`、禁「敬请期待」/「人」
- 设置页文案：`提高等级`、`刷怪速度`、`满蓄模式`、`testElapsedSec`、`升级选项自选`、`rl-picker-x`、`火柴人` + `testDummy`
- `rl-mem-mult` + `4ch`、`.rl-mem-tip` + `position: absolute`、`.rl-bonds` + `flex-wrap` + `282px`（本环不动羁绊/回忆，断言原样）
- PixelIcon：`upgradeIconUrl` / `paintBlankIcon` / `paintAdvancedDot` / `isAdvanced`，禁 `paintIcon`

**新增**：

- `pixel.css` 含 `:root` 与至少 `--rl-ink`、`--rl-paper` 变量
- `pixel.css` 含 `.rl-frame` 类
- 死样式已删（断言不再含 `.rl-pick.locked`、`.rl-avatar.q`）

## 7. P20 预告（本环不做，仅备忘）

局内环：HUD 顶部通栏（深色半透 + 硬框）、通栏与齿轮**钳制在画布黑色留边内侧**、齿轮从右上角下移避开通栏、升级卡/结算/回忆换装。画布矩形 → CSS 变量的 `App.vue` 接线由 M1 在 P20 联调时做。

---

## 成功标准

| 窗 | 标准 |
|----|------|
| M8 | token 层全量替换；`.rl-frame` 通用类；四屏换装无文案/接口/行为变化；死样式清理；`node src/ui/selftest.mjs` 全绿 |
| M1 | 查收：磁盘核对 + selftest + `npm run build` + 开游戏实机过菜单流；pass 后回写设计表与 Registry |

---

## M8 开工粘贴块

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P19.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图。不要改任何文案原文。
P18 刚改过 ui/**（羁绊/难度二）：先重读磁盘最新状态，冲突先报 M1。

本环（P19 UI 像素框架 · 菜单环）：
1) pixel.css 抽 :root CSS 变量（色板/间距/字号），全部 rl- 类改用变量。
2) 新增 .rl-frame 双层硬边框通用类 + 弹窗浮起变体；按钮三态硬阴影/位移；过渡只用 steps()。
3) 标题/选角/难度/设置四屏换装像素框架；滑条视觉块状像素化。
4) 只改皮：文案、props/emit、rl-char-tip hover 机制、pre-line、RangerPortrait/PixelIcon/KeyIcon 逻辑、P18 羁绊与难度二行为全部不动。
5) 清理死样式 .rl-pick.locked、.rl-avatar.q；rl-toggle 色义对调（on=绿）。
6) 同步 ui/selftest.mjs：保留清单见 HANDOFF §6，新增 :root 变量与 .rl-frame 断言。

完成后说：M8 已完成，请主导窗口查收。
```
