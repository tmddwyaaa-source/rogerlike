# 窗口身份安排（开窗用）

> 项目路径：`D:\Cursor_projectt\rogerlike`  
> 规格：`docs/GAME-SPEC.md` · 注册表：`docs/MODULE-REGISTRY.md` · 素材：`docs/ASSETS.md`  
> **本文件 = 开窗花名册**。每个新窗口只贴对应「开工粘贴块」。  
> **打开游戏仅 M1**：子窗口禁止执行 open-game、禁止另开浏览器。完工只说请查收。

## 总览

| 窗口 | 身份 | 阶段起点 | 规定路径（只改这些） | 依赖 | 建议开窗时机 |
|------|------|----------|----------------------|------|----------------|
| **M1**（当前） | 主导 / 查收 / 集成 | — | `docs/**`；集成冲突合并 | — | 已开着 |
| **M3** | 工程骨架与主循环 | — | `frontend/`、`frontend/src/game/`、`frontend/public/assets/` | M1 规格 | ✅ **已 done** |
| **M4** | 玩家 / 生命 / 无敌 | P21 受伤钩子 | `frontend/src/game/player/**`、`frontend/src/game/render/**` | — | ✅ **P21 done** |
| **M5** | 战斗 / 蓄力箭 | P20 开火音效钩子 | `frontend/src/game/combat/**`、`frontend/src/game/weapons/**` | M4 | ✅ **P20 done** |
| **M6** | 蘑菇怪 / 蜗牛怪 / 刷怪 | P21 成长+5、冰人3300与回血 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` | — | ✅ **P21 done** |
| **M7** | 普通树 / 掉落 / 草地 | P18 树血成长/结晶爆发 | `frontend/src/game/world/**`、`frontend/src/game/pickups/**`、`frontend/src/game/render/grass.*` | M3 | ✅ **P18 done** |
| **M8** | UI / 升级 / Spring Boot | P33 选角阴影/回忆布局重排 | `frontend/src/ui/**`、`frontend/src/views/**` | — | ✅ **P33 done** |
| **M9** | 集成磨合 | P18 难度/Boss击杀/羁绊接线 | `App.vue` / `engine.js` / `match.js` | 各模块 review | ✅ **P18 done** |
| **M10** | 升级选项出图 | — | 待审 `assets/icon-review/**` | M1 规格 | ✅ **done**（20 图标全采用；+1 永久程序绘制） |
| **M11** | 跟班 | P24 万物一心新档位 | `frontend/src/game/companions/**` | M8 文案 | ✅ **P24 done** |

### 推荐开窗顺序

```text
① 只开 M3
② M3 完成并经 M1 查收 → 开 M4 + M7（可并行）
③ M4 完成后开 M5
④ M5 有子弹后开 M6（可与未完的 M7 并行）
⑤ 核心可玩后开 M8
⑥ 全部「请查收」→ 回 M1 做 M9 集成
```

环内一律：**斥候 → 主力 → 搜剿**；同卡点最多 4 次。  
子窗口 **禁止** 把 Registry 标成 `done`；**禁止打开游戏**。完工说：`M{n} 已完成，请主导窗口查收。`

**P20 开窗顺序**：并行 **M5 + M6 + M8** → 全部请查收 → 回 M1 接线（combat `onFire` → 音效、`notifyExp` → 拾取音效）+ 联调开游戏。本环不开 M4 / M7 / M11；**M10 已关闭**（图标全采用，+1 永久程序绘制）。  
**P21 开窗顺序**：并行 **M4 + M6 + M8** → 全部请查收 → 回 M1 接线（`onHurt` → sfx）+ 联调开游戏听音。**P22（局内 UI：顶部通栏 / 齿轮下移 / 画布钳制 / 升级卡结算换装）在 P21 查收后立刻派 M8**。  
**P22 开窗顺序**：**只开 M8**（局内 UI：顶部/底部通栏钳制画布黑边、齿轮下移、升级卡结算回忆换装）。M1 已完成 `App.vue` 的 `--rl-stage-*` 变量接线。→ 请查收 → M1 联调开游戏（重点：缩放窗口通栏仍贴画布）。  
**P23 开窗顺序**：**只开 M8**（拾取增益 / 菜单钳制 / 齿轮复位 / 羁绊悬停修复+单列 / 回忆排版 / 测试右面板 / 总音量·背景音乐·音效音量三滑条）→ 请查收 → M1 联调开游戏实测并删临时测试页。  
**P24 开窗顺序**：并行 **M8 + M11** → 全部请查收 → 回 M1 接线（`getPriorityTarget`：onDamage 记录玩家最近击中的活敌 → companions）+ 联调开游戏。  
**P24 状态**：2026-08-24 M1 查收 **pass**（M8 / M11）。接线已进 `match.js`（`onPlayerDamage` → `getPriorityTarget`）。三羁绊 chip 与悬停文案已实机验证；档 8 优先目标待未来第 5+ 种跟班出现后实机可验（逻辑已自测）。

**P25 开窗顺序**（七兄弟 / 小金刚 / 毒刺怪 / 高级结晶 / 怪物体验）：并行 **M7 + M4** → **M6**（依赖 M7 高级结晶接口 + 毒刺怪素材）→ **M5** → **M8**（依赖 M4 护甲/失锁、M5 七兄弟效果、§5 待定已定案）→ 全部请查收 → 回 M1 接线（合体触发、七色脉冲、失锁/护甲钩子）+ 联调开游戏。本环不开 M10 / M11；M10 仍等七兄弟/击退/红圈图标手绘（未到先空白方块）。
**P25 状态**：2026-08-24 M1 查收 **pass**（M4 / M5 / M6 / M7 / M8）。M1 接线已进 `match.js`（`syncVajra` 合体触发）。全量 selftest PASS + build 522ms；实机已开 `http://localhost:5173/`。M10 仍等七兄弟/击退/红圈图标（未到先空白方块）。

**P23 状态**：2026-08-23 M1 查收 **pass**（M8）。悬停 tooltip / 三滑条 / 右侧测试面板已 M1 实机验证；临时测试页已删。

**P22 状态**：2026-08-23 M1 查收 **pass**（M8）。UI 改版 **P19（菜单环）+ P22（局内环）全部落地**。

**P21 状态**：2026-08-23 M1 查收 **pass**（M4 / M6 / M8）。接线已进 `match.js`（`onHurt` → sfx）。音效加固/新射箭/受伤/音效音量待用户实机复听。

**P20 状态**：2026-08-23 M1 查收 **pass**（M5 / M6 / M8）。接线已进 `match.js`（`onFire` → sfx、结晶 pickup 节流）。M10 已关闭（图标全采用）。

**P19 开窗顺序**：**只开 M8**（UI 像素框架 · 菜单环：token 层 + `.rl-frame` + 标题/选角/难度/设置换装）→ 请查收 → M1 联调（selftest + build + 开游戏过菜单流）。P20（局内环：顶部通栏 / 齿轮下移 / 画布钳制 / 升级卡结算换装）待 P19 查收后再派。  
**P19 状态**：2026-08-23 M1 查收 **pass**（M8）。token 层全量替换、四屏换装、死样式清理；selftest + build 全绿。

**P18 开窗顺序**：并行 **M5 + M6 + M7 + M8 + M11** → 全部请查收 → 回 M1 接线（难度血、Boss 击杀、羁绊 HUD）。本环不开 M4。M10 仍等唯快不破 / 精益求精。  
**P18 状态**：2026-08-23 M1 查收 **pass**（M5 / M6 / M7 / M8 / M11）。接线已进 `match.js`（难度血、`spawnCrystalBurst`、冰人 `addBossKill`）。

**P17 开窗顺序**：并行 **M5 + M6 + M7 + M8 + M11** → 全部请查收 → 回 M1 接线。本环不开 M4。M10 仍等唯快不破 / 精益求精。  
**P17 状态**：2026-08-22 M1 查收 **pass**（M5 / M6 / M7 / M8 / M11）。接线已进 `match.js`（`hitSlashAt`、跟班 `onHeal`）。

**P16 开窗顺序**：并行 **M5 + M6 + M8 + M11** → 全部请查收 → 回 M1 接线（蛋的角色击杀数）。本环不开 M4 / M7。M10 等唯快不破 / 精益求精手绘。  
**P16 状态**：2026-08-21 M1 查收 **pass**（M5 / M6 / M8 / M11）。接线已进 `match.js`（`getKills`）。M10 图标待定。

**P15 开窗顺序**：并行 **M4 + M5 + M6 + M8** → 全部请查收 → 回 M1 接线（去掉开局目标、测试木桩、自选升级）。本环不开 M7 / M11。M10 暴击图标等用户手绘。  
**P15 状态**：2026-08-21 M1 查收 **pass**（M4 / M5 / M6 / M8 / M10 暴击图）。接线已进 `match.js` / `GameShell.vue`。

**P14 开窗顺序**：并行 **M4 + M5 + M6 + M8** → 全部请查收 → 回 M1 接线（测试时间、开局目标、回血绿字）。本环不开 M7 / M10 / M11。  
**P14 状态**：2026-08-20 M1 查收 **pass**（M4 / M5 / M6 / M8）。接线已进 `match.js` / `GameShell.vue`。

**P13 开窗顺序**：并行 **M4 + M5 + M6 + M7 + M8** → 全部请查收 → 回 M1 接线（结晶升级 +1 与测试强制升级对齐）。  
**P13 状态**：2026-08-20 M1 查收 **pass**（M4 / M5 / M6 / M7 / M8）。接线已进 `match.js` / `App.vue`。本环不开 M10 / M11。

**P12 开窗顺序**：并行 **M4 + M5 + M8 + M11** → 全部请查收 → 回 M1 接线（死亡弹窗 / charId / 伤害数字绘制）。  
**P12 状态**：2026-08-20 M1 查收 **pass**（M4 / M5 / M8 / M11）。接线已进 `match.js`。本环不开 M10。

**P3 开窗顺序**：先并行 **M8 + M6 + M4** → M4 查收后开 **M5** → 全部请查收 → 回 M1。  
**P3 状态**：2026-08-14 M1 查收 **pass**。粘贴块仅供打回重修。

---

---

## Phase 33 开工粘贴块

以 `docs/HANDOFF-P33.md` 为交接正文。

### M8 — 选角阴影 / 回忆布局重排

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P33.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 game/** / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图（阴影用现有 Other/Shadow.png）。零玩法逻辑改动。

本环（P33）：
1) 选角屏：立绘卡内下移 + 脚下加 Shadow.png 阴影（缩放对齐立绘，三卡一致；悬停动画时阴影不跟跳）。
2) 回忆详情：升级选项面板保留、宽度 ≥60%；羁绊删除独立大框，改为局内 rl-bonds 同款裸 chip 竖排放右侧；两栏合计宽 = 等级黑框宽。
3) 回忆详情黑框内立绘阴影贴身：脚下间距 = 对局角色阴影间距。
4) 羁绊 chip 悬停提示完整保留（说明+全部档位+深浅色）。
5) 同步 ui/selftest.mjs，交付说明列出断言变更。

完成后说：M8 已完成，请主导窗口查收。
```

---

## Phase 32 开工粘贴块

以 `docs/HANDOFF-P32.md` 为交接正文。

### M8 — UI + 升级机制

```text
@multi-window_M @springboot-vue
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P32.md（P32 需求）。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**（其余目录禁止动）
交付（P32）：
1. 回忆界面角色立绘下移 + 底部阴影 + 悬停（角色信息 + 待机动画，与选角一致）
2. 回忆界面新增羁绊显示模块 + 属性条宽度对齐两栏 + 羁绊悬停效果提示
3. 高级升级机制：该次等级 %5 必出高级，其余槽位独立 30% 概率
4. 击退文案 +0.5 → +1
跑 node src/ui/selftest.mjs。不要标 Registry done；完成后说：M8 已完成，请主导窗口查收。
```

### M5 — 武器 / 击退

```text
@multi-window_M @springboot-vue
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P32.md（P32 需求）。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**（其余目录禁止动）
交付（P32）：
1. 所有角色基础击退 0.5 身位（BASE_KNOCKBACK_BODIES）
2. 高级「击退」效果 0.5 → 1 身位（KNOCKBACK_BONUS_BODIES）
3. 同步 combat 自测（受影响断言按新值重算）
跑 node src/game/combat/selftest.mjs。不要标 Registry done；完成后说：M5 已完成，请主导窗口查收。
```

---

## Phase 30 开工粘贴块

以 `docs/HANDOFF-P30.md` 为交接正文。

### M11 — 恶魔软性跟随

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P30.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player / combat。不要标 Registry done。
不要打开游戏。

本环（P30）：
恶魔改为独立 AI 单元：在角色 3 身位内**软性自然跟随**（朝角色移动、靠近舒适距离即减速停下/自然环绕），去掉“贴边界反复扑腾的空气墙抽搐”。仍攻击离角色最近的怪、常驻角色附近、基础伤 10+角色伤×20%。
更新 companions/selftest.mjs。

完成后说：M11 已完成，请主导窗口查收。
```

### M4 — 六娃范围 3 身位

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P30.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 combat / enemies / match.js / ui。不要标 Registry done。
不要打开游戏。

本环（P30）：
`player/index.js` `UNLOCK_RADIUS_UNITS = 3`（`UNLOCK_RADIUS=3*BODY`）；六娃失锁扩散圈视作范围同步。
更新 player selftest。

完成后说：M4 已完成，请主导窗口查收。
```

### M7 — 地图背景装饰物

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P30.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/render/**（背景）
不要改 combat / enemies / match.js / ui / 刷怪。不要标 Registry done。
不要打开游戏。

本环（P30）：
新增背景装饰物：火柴堆（素材 `装饰物/火柴堆-1..4.png`）25 个、石头（`装饰物/石头-5..8.png`）75 个（=×3）；`ensureSeed` 随机播种，位置不与其他树/装饰物重叠（多次采样空位）。
`loadAssets` 载入它们，`env.draw` 在草地之后、实体之前绘制；**静态、不碰撞、不可交互**。
更新 world selftest（数量、不重叠、静态）。

完成后说：M7 已完成，请主导窗口查收。
```

---

## Phase 29 开工粘贴块

以 `docs/HANDOFF-P29.md` 为交接正文。

### M7 — 强化结晶显著紫外覆层

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P29.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/**
不要改 combat / enemies / match.js / ui。不要标 Registry done。
不要打开游戏。

本环（P29）：
`drawCrystal` 高级结晶外观：把“加大紫十字垫底（只剩 2px 小尖）”改为**明显紫色外覆层**——建议给结晶外轮廓描一圈紫，或紫十字加宽包住蓝十字成清晰紫边；普通结晶无紫。
更新 world/pickups selftest（紫边像素断言，确保不是只剩小尖）。

完成后说：M7 已完成，请主导窗口查收。
```

### M8 — 回忆角色立绘 / 选角 hover 待机动画 / 万物一心复核

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P29.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / enemies / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。

本环（P29）：
1) 回忆（MoreView）血条左侧加 `RangerPortrait`（尺寸同选角）；单局记录 `charId`，回忆读取显示，无则兜底游侠。
2) 选角（StartView）hover 时在角色位置播放 `S_Idle` 待机多帧动画，与文本提示同显。
3) 复核万物一心：`uniqueBondCount` 仅按“不同跟班升级种类”，`uniqueBondCount < 2` 时不显示 chip、不产生 tier>0 效果；异常则修。
更新 ui/selftest.mjs。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 万物一心 tier 消费复核

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P29.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player / combat。不要标 Registry done。
不要打开游戏。

本环（P29）：
确认 `setUnityTier`/`unityAdd`/`getCompanionBonus`：`unityTier` 初值正确、只在达到阈值（≥2）才给增益、`unityTier=0` 不给任何跟班增益；`unityTier` 每次选择后正确同步。异常则修。
更新 companions/selftest.mjs。

完成后说：M11 已完成，请主导窗口查收。
```

---

## Phase 28 开工粘贴块

以 `docs/HANDOFF-P28.md` 为交接正文。

### M7 — 高级结晶紫边（A2）

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P28.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/**
不要改 combat / enemies / match.js / ui / 刷树环境。不要标 Registry done。
不要打开游戏。

本环（P28）：
给高级结晶素材程序绘制**紫色外覆层**，普通/高级视觉明显不同（advanced 标记已存在，本次只补渲染层）。
更新 world/pickups selftest。

完成后说：M7 已完成，请主导窗口查收。
```

### M5 — 七色脉冲动画 / 伤害数字&暴击数据

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P28.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / enemies / match.js。不要标 Registry done。
不要打开游戏。

本环（P28）：
1) 七色脉冲加**七彩动画**（7 色相、向外扩散至 1.5 身位并循环，沿用脉冲伤害/减速逻辑，只改视觉）。
2) 伤害数字传**实际伤害值**（不按怪物剩余血量截断）；暴击时输出“非暴击伤害+暴击倍率”供 M4 渲染。
同步 combat selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M4 — 伤害数字动画 / 三娃护盾配合

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P28.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 combat / enemies / match.js / ui。不要标 Registry done。
不要打开游戏。

本环（P28）：
1) dmgnum：普通伤害显示**实际伤害值**（不截断）；暴击时“先显示非暴击伤害 → 旁边红色「×暴击倍率」→ 短暂后快速滚动成实际暴击伤害”。
2) 三娃护盾视觉保持（阴影外圈描黄），层数与 A3 新机制一致。
更新 player/dmgnum selftest。

完成后说：M4 已完成，请主导窗口查收。
```

### M8 — 三娃新机制 / 跟班升级文案与入池

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P28.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / enemies / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。

本环（P28）：
1) 三娃：记录已选次数，每次选 `player.addArmor(1)`；每达 `N=max(1,11−次数)` 级再发 1 甲并重置计数；仍计入七兄弟。
2) 新增跟班升级入池/文案/图标：`tamer`（普通）「驯兽师：跟班伤害+5、跟班移速+0.05」（图标空白）、`demon`（高级）「恶魔」（`upgrades/demon.png`）、`slime_gg`「史莱姆gg」（`upgrades/slime_gg.png`）、`companionship`「伴我同行」（图标空白）。
3) 伤害数字显示规则按 B2/B3 口径同步到文案/结构。
更新 ui/selftest.mjs。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 跟班新效果

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P28.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player / combat。不要标 Registry done。
不要打开游戏。

本环（P28）：
1) 驯兽师：所有跟班伤害+5、移速+0.05（可叠）。
2) 恶魔：`addDemon()`——常驻角色 3 身位内、打1单位、优先离角色最近、基础伤 `10+角色伤害×20%`；角色伤害联动：额外跟班伤害（仅升级/羁绊额外加的）每 5 点 →+3 角色伤害（首次），多选恶魔跟班+1 且每5点加成+1/层。
3) 史莱姆gg：`addSlimeGG()`——生成 g-1/g-2 两跟班，基础伤 5。
4) 伴我同行：仅角色击杀；`rate=1+0.5×(已选−1)`，每跨 100 杀按当时 rate 给跟班伤害加成（新选倍率只影响之后）。
更新 companions/selftest.mjs。

完成后说：M11 已完成，请主导窗口查收。
```

---

## Phase 27 开工粘贴块

以 `docs/HANDOFF-P27.md` 为交接正文。

### M4 — 六娃扩散圈 / 三娃护盾视觉描黄

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P27.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 combat / enemies / match.js / ui。不要标 Registry done。
不要打开游戏。

本环（P27）：
1) 六娃#3F48CC 扩散圈：每次失锁脉冲触发时，以角色为中心画 `#3F48CC` 圈，半径用 `UNLOCK_RADIUS`（1.5 身位），越接近边缘颜色越淡，不超过范围。
2) 三娃护盾视觉：**去掉 `drawArmorOutline` 用 `fillRect` 画的边框矩形**（player/index.js 191-194），改为**沿角色脚下阴影素材最外圈不透明像素描 1px 黄**（同敌人 `outlineSheet` 思路）。层数仍由 `player.armor` 驱动。
更新 player selftest（扩散圈、护盾描黄）。

完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 四娃燃烧 30%/s

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P27.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / enemies / match.js。不要标 Registry done。
不要打开游戏。

本环（P27）：
四娃基础每秒燃烧伤害 = **30% 攻击**（+10%/层不变）；同步 `fireDpsPerPick` 与 combat selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 红圈全怪 / 怪物成长 / 冰人 / 强化怪

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P27.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**（怪物渲染）
不要改 combat / ui / match.js / player / world。不要标 Registry done。
不要打开游戏。

本环（P27）：
1) 红圈全怪：保留程序红色空心圈，`spawnWave`/`trySpawn` 对所有可生成敌人（蘑菇/蜗牛/史莱姆x-1/蝎子/毒刺怪/**灰树爆出的裂怪**）出生前 0.8s 显示红圈。boss/兰花/树/木桩不加。
2) 怪物成长：生命/阶 +5（蘑菇15、蜗牛25、史莱姆27、蝎子20、毒刺怪25）；移速/阶 −0.01（蘑菇/裂怪0.03、蜗牛0.02、史莱姆0.02、蝎子0.04），**毒刺怪移速成长=0.04**。难度二额外血由 `getHpGrowthAdd`（match.js，M1 已改 10）叠加。
3) 冰人：血 `ICE_MAN_HP=4000`（重生 `round(4000×1.4^n)`）；可离开视野，仅当完全离开视野且未逃跑才回视图（越出视野矩形一定 margin，如 1 身位）；Boss 所有伤害（接触/冲刺/弹幕）→ −2 血；子弹素材最外圈覆盖**蓝色**。
4) 强化怪（难度二）：生成普通怪（蘑菇/蜗牛/史莱姆x-1/蝎子/毒刺怪/裂怪）时掷 `min(1, 0.02+0.02×floor(分钟))`；血量×2、击退抗性+1 身位；掉结晶数量同普通，每颗**高级结晶 50%**（走 M7 `spawnCrystalAt`）；素材最外围**紫色**（有甲则紫色包最外）。
更新 enemies/spawner selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M8 — 小金刚文本 / 三娃唯一效果 / 四娃文案

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P27.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / enemies / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。

本环（P27）：
1) 小金刚悬停文本精简：`BOND_DESC[BOND_VAJRA]`=「集齐七兄弟解锁」；tier 两条：“档 7 · 每 3.0s 释放七色脉冲（范围 1.5 身位，伤害攻击×1.3，独立暴击；减速 30% 持续 0.4s）”“档 7 · 所有葫芦娃效果值 +10%（加法）”。chip 仍「小金刚 7」。
2) 三娃：改为唯一效果；选三娃置 `sanwaActive`；`recordPicked` 中若 `sanwaActive` 且**不同七兄弟计数**为 3 的倍数（3、6）且该里程碑未发过 → `player.addArmor(1)`。含第一次拿三娃。
3) 四娃文案：命中点燃 3 秒，每秒 **30%** 攻击（+10%/层）。
更新 ui/selftest.mjs。

完成后说：M8 已完成，请主导窗口查收。
```

---

## Phase 26 开工粘贴块

以 `docs/HANDOFF-P26.md` 为交接正文。

### M4 — 三娃护盾视觉

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P26.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 combat / enemies / match.js / ui。不要标 Registry done。
不要打开游戏。

本环（P26）：
1) 去掉在角色碰撞体积处画的竖长方形护盾。
2) 改为角色脚下阴影素材（或最外圈不透明像素）外围描一层黄，同怪物甲的素材描边。
3) 护盾层数仍由 player.armor 驱动；HUD 层数显示不动。
更新 player selftest（护盾视觉相关断言同步）。

完成后说：M4 已完成，请主导窗口查收。
```

### M6 — 毒刺怪数量 / 五娃减速 / 四娃五娃粒子 / 红圈占位

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P26.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**（怪物渲染）
不要改 combat / ui / match.js / player / world。不要标 Registry done。
不要打开游戏。

本环（P26）：
1) 毒刺怪每波数量 1+floor(秒/180) → 6+floor(秒/180)（每 5 秒一波，成长保留）。
2) 五娃减速：敌人移动乘 ent.slowFactor ?? 1（slowLeft>0 才生效）。不要改 combat 写入逻辑。
3) 四娃燃烧（burnLeft>0）：怪物身上持续飘红色上升粒子；五娃减速（slowLeft>0）：飘蓝色上升粒子；越升颜色越浅；效果结束或怪物死亡粒子消失。属怪物侧渲染。
4) 红圈预警：保留程序红色空心圈占位，不要删，等 M10 图标替换。
更新 enemies/selftest（毒刺怪 6、减速消费、粒子生灭）。

完成后说：M6 已完成，请主导窗口查收。
```

### M8 — 拾取音效 −50% + 小金刚羁绊展示对齐

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P26.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / enemies / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。

本环（P26）：
1) 拾取音效（pickup）音量减半：ui/sfx.js 增益 ×5 → ×2.5（或对 pickup 单独乘 0.5）。其他音效不动。
2) 小金刚羁绊：ui/session.js listActiveBonds 只在 count≥7（bondRank 非 0）才 push；GameShell 去掉小金刚专用分支（n/7、·变身），走通用 标题+档位（「小金刚 7」）；pixel.css 删除 .rl-bond--vajra 的 --rl-btn 配色覆盖，用默认纸/墨配色。悬停沿用 BOND_DESC / bondTiers。
更新 ui/selftest.mjs（pickup 增益、小金刚显示时机与配色、chip 文本）。

完成后说：M8 已完成，请主导窗口查收。
```

---

## Phase 25 开工粘贴块

以 `docs/HANDOFF-P25.md` 为交接正文。

### M7 — 高级结晶

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P25.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/**
不要改 combat / enemies / match.js / ui / 刷树环境。不要标 Registry done。
不要打开游戏。不要生图。

本环（P25 高级结晶）：
1) spawnCrystal 支持 advanced 标记；默认普通（1 经验）。
2) 高级结晶：现有结晶贴图程序绘制紫色外覆层（零素材成本）；价值 +5 经验（普通 1 → 高级 6）。
3) 概率逐个独立掷；提供接口供 M6 掷高级：spawnCrystalAt(x,y,{advanced?:boolean})；磁铁/黑洞照常吸取高级结晶。
4) 掉落来源（由 M6 调你的接口）：毒刺怪 4 结晶每个 20% 高级；冰人 150 结晶每个 10% 高级。本环只做接口与紫边表现。
更新 pickups selftest（高级结晶紫边/经验 5/吸附）。

完成后说：M7 已完成，请主导窗口查收。
```

### M6 — 毒刺怪 / 冰人 / 怪物体验

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P25.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / ui / match.js / player / world。不要标 Registry done。
不要打开游戏。不要生图。

本环（P25）：
1) 毒刺怪 stinger：≥300s 起接管蘑菇怪刷怪位（蘑菇怪停刷，场上存量保留至死亡）。每 5 秒一波 1+floor(秒/180)。
   血 260+20*floor((秒-300)/45)，难度二 getHpGrowthAdd 每阶再 +5；移速 0.70+0.02*floor((秒-300)/45)，无 1.4 帽；击退抗性 1 身位（knockbackResist=BODY）；接触 -1 心；掉 4 结晶、每个 20% 独立概率高级（走 M7 spawnCrystalAt）。贴图 小怪/毒刺怪.png（已两边拷贝）。
2) 冰人：击退抗性 50%→70%（knockbackScale 0.5→0.3）；血 3300→3800（重生 round(3800*1.4^n)）；掉 300→150 结晶、每个 10% 独立概率高级；弹幕 CD 22→17s。
3) 生成预警：怪物出生前落点显示红圈约 0.8 秒再出现；红圈素材未到位先用程序绘制红色空心圈占位。
4) 环绕生成：刷怪位置尽量环绕角色（视野边缘外 1～3 身位环带，可调）。
5) 蝎子独立 CD：每只蝎子首次开火随机 0～5 秒错峰，之后各自 5 秒节奏（射击间隔 10s→5s），消灭齐射。
6) 六娃失锁的敌人侧消费：只读 M4 导出的失锁状态（本环不代改 player），近战不靠近、远程不开火（含蝎子/冰人）。
更新 enemies/spawner selftest（毒刺怪数值、冰人 3800/0.3/150/17s、预警、环绕、蝎子 5s、失锁消费）。

完成后说：M6 已完成，请主导窗口查收。
```

### M4 — 三娃护甲 / 六娃失锁（角色侧）

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P25.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 combat / enemies / match.js / ui。不要标 Registry done。
不要打开游戏。不要生图。

本环（P25）：
1) 三娃护甲：player 提供 armor（整数层，可无限叠）。takeDamage 时先扣 1 层甲并抵挡该次完整伤害（该次不掉血）；导出 getArmor() 与 armor 字段，供 M8 HUD 显示与 M1 接线。
2) 六娃失锁脉冲（角色侧）：player 提供失锁状态（例如 setUnlockPulse / 记录在失锁窗口内的目标），每 10 秒对 1.5 身位内敌人施加 N 秒不锁定；基础 1.0s，每层 +0.5s；导出失锁时长计算。敌人侧消费由 M6/enemies 读状态，本环只做角色侧状态与导出，可留钩子由 M1 接线。
更新 player selftest（护甲扣层/抵挡/无限叠；失锁时长 1.0s 起、每层 +0.5）。

完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 四娃 / 五娃 / 七色脉冲 / 击退 / 小金刚效果值 +10%

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P25.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / enemies / match.js。不要标 Registry done。
不要打开游戏。不要生图。

本环（P25）：
1) 四娃点燃：命中目标点燃 3 秒，每秒 10% 攻击，每层 +10%/s。
2) 五娃减速：命中减速 20%、0.3 秒，每层 +0.2 秒（时长）。
3) 高级「击退」：每层 +0.5 身位击退，可叠。
4) 小金刚集齐七兄弟→七色脉冲：每 3.0s 自动以角色为中心 1.5 身位圈；伤害 攻击×1.3（每次单独掷暴击）；减速 30%、0.4s；不施加击退、不触发点燃、不打破六娃失锁。
5) 小金刚集齐时一次性给大娃/二娃/四娃/五娃效果值 +10%（加法）：大娃 40→50%/层、二娃 20→30%、四娃每秒 10→20%、五娃 20→30%。
导出/实现本环 upgrade 效果，供 M8 文案与 M1 接线。
更新 combat/weapons selftest（点燃/减速/击退/七色脉冲/集齐 +10%）。

完成后说：M5 已完成，请主导窗口查收。
```

### M8 — 七兄弟文案 / 四选一 / 小金刚 chip / 护甲 HUD / 击退入池

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P25.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / enemies / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图。

本环（P25）：
1) 七兄弟入池文案：新增二娃（高级「三选一 20%/层 概率变四选一」）、三娃（普通「获得 1 层护甲，抵挡一次完整伤害；无限叠；HUD 显示层数」）、四娃（高级「命中点燃 3s，每秒 10% 攻击（+10%/层）」）、五娃（高级「命中减速 20%、0.3s（+0.2s/层）」）、六娃（普通「每 10s 失锁脉冲：1.5 身位内敌人 1.0s 不锁定（+0.5s/层）」）；大娃保留；黑洞改名「七娃」（id blackhole 与效果不动）。另新增高级「击退」：每层 +0.5 身位。
2) 四选一：读二娃层数，每次三选一有 20%/层 概率变四选一（4 格）。
3) 小金刚 chip：计入七兄弟全部；档位只有 7；平时显示「小金刚 n/7」，集齐后变身形态。悬停文案：七色脉冲 + 各兄弟效果 +10%。
4) HUD 护甲显示：显示三娃护甲层数。
更新 ui/selftest.mjs（文案、四选一、chip n/7、护甲 HUD）。「敬请期待」禁串只限 StartView；本环小金刚不再是占位。

完成后说：M8 已完成，请主导窗口查收。
```
---

## Phase 24 开工粘贴块

以 `docs/HANDOFF-P24.md` 为交接正文。

### M8 — 羁绊文案 / 阈值 / 小金刚

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P24.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / companions / match.js / App.vue / backend。不要标 Registry done。
不要打开游戏。不要生图。

本环（P24 羁绊）：
1) 天行健悬停档位文案细化：档2 随等级提高移速（每 2 级 +0.01）；档4 随等级提高伤害（每 2 级 +1）；档6 随等级提高空血上限（每 10 级 +1）；档8 随等级提高穿透（每 15 级 +1）。
2) 万物一心阈值 3/6/9 → 2/4/6/8（判定与 setUnityTier 传值同步）；档位说明精简：跟班伤害+5 / 跟班获得角色伤害20% / 攻击单位+1 / 移速+0.2、伤害+10、优先攻击角色的目标。
3) 新增小金刚羁绊：大娃、黑洞补 bond 字段；只有档 2（两种都选过）；chip「小金刚」，悬停效果文本「敬请期待」；无数值效果。注意「敬请期待」禁串只限 StartView。
更新 ui/selftest.mjs。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 万物一心新档位

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P24.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player / combat。不要标 Registry done。不要打开游戏。

本环：setUnityTier 档位改 2/4/6/8：2=跟班伤+5；4=再+floor(攻击×0.2)；6=可打目标+1；8=移速+0.2 设计单位、伤害再+10、索敌优先 opts.getPriorityTarget?.() 的活目标（失效回退常规，含兔子）。可重复调用按档覆盖。
更新 companions/selftest.mjs（数值、优先命中与回退）。

完成后说：M11 已完成，请主导窗口查收。
```

---

## Phase 23 开工粘贴块

以 `docs/HANDOFF-P23.md` 为交接正文。

### M8 — 拾取增益 / 菜单钳制 / 羁绊 / 回忆 / 测试面板 / 三滑条

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

---

## Phase 22 开工粘贴块

以 `docs/HANDOFF-P22.md` 为交接正文。

### M8 — 局内 UI

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

---

## Phase 21 开工粘贴块

以 `docs/HANDOFF-P21.md` 为交接正文。

### M4 — 受伤钩子

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

### M6 — 成长 +5 / 冰人 3300 与脱战回血

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

### M8 — sfx 修复 / 测试排版 / 音效音量

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

---

## Phase 20 开工粘贴块

以 `docs/HANDOFF-P20.md` 为交接正文。

### M5 — 开火音效钩子

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

### M6 — 四怪血 +5/+5；冰人强化

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

### M8 — 文案 / 羁绊悬停 / 音效播放器

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

---

## Phase 19 开工粘贴块

以 `docs/HANDOFF-P19.md` 为交接正文。

### M8 — UI 像素框架 · 菜单环

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

---

## Phase 18 开工粘贴块

以 `docs/HANDOFF-P18.md` 为交接正文。

### M5 — 攻击间隔 +50%

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P18.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / match.js / enemies。不要标 Registry done。
不要打开游戏。

本环：FIRE_INTERVAL 0.21 → 0.315（+50%）。蓄力上限仍 0.75。唯快不破仍 ÷1.2。不要改战士长条、暴击、强化射击。
更新 selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 蝎子 / 冰人 / 史莱姆 / 灰树 / 难度血

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P18.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / player / match.js。不要标 Registry done。
不要打开游戏。不要改冰人移速倍率。

本环：
1) 蝎子怪 scorpion：≥300s；血 100+10/45s；每 20s 一波，每波 2+1/30s；移速 0.8+0.05/45s；掉 2 结晶；>8 身位靠近，3～8 身位每 10s 射一发（怪物子弹.png 速度 180），<3 身位跑到 7 身位。贴图 小怪/蝎子怪.png。
2) 史莱姆 x-1：HP0 115；解锁与成长 180s。
3) 冰人：冲刺/弹幕/兰花 CD 15/25/35；死亡掉 300 结晶（抖动，走 spawnCrystalBurst 若 M7 已有，否则循环 spawnCrystal）；死后 180s 重生，血 round(2000×1.4^n)。第一只仍 420s/2000。
4) 灰树：HP0 80；自损上限 8+floor(秒/60)，下限 1，仍 3s 一次。
5) opts.getHpGrowthAdd?.() ?? 0 加在蘑菇/裂怪/蜗牛/史莱姆x-1 的每阶血上。灰树/冰人/兰花不加。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M7 — 树血成长 / 结晶爆发

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P18.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/**
不要改 combat / enemies / match.js。不要标 Registry done。
不要打开游戏。不要改刷树间隔。

本环：treeHp 每阶 = 5 + (opts.getHpGrowthAdd?.() ?? 0)。增加 spawnCrystalBurst(x,y,n) 在 BODY 内抖动，供冰人 300 结晶。不要改果实/磁铁。
更新 selftest。

完成后说：M7 已完成，请主导窗口查收。
```

### M8 — 羁绊 / 难度二 / 通关 / 右侧 HUD

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P18.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / match.js。不要标 Registry done。
不要打开游戏。不要改 backend。不要生图。

本环：
1) 升级不要再 applyLevelGrowth / applyEmptyHpMax / applyPierceGrowth。
2) 升级加 bond 字段。天行健 qian：敏捷力量生存穿透技巧唯快不破暴击精益求精散射开眼了强化射击，档 2/4/6/8。万物一心 unity：地精兔子蝙蝠蛋，档 3/6/9。档位=不重复 id。按角色等级补发天行健。达标调 companions.setUnityTier。
3) 已有档的羁绊画在画布右侧（齿轮下方），没档不画，一行最多 3，如「天行健 4」。
4) DIFFICULTY_TWO。难度一目标仍活够10分钟；难度二「目标：击败Boss 2次，并活够10分钟」。难度二要 bossKills>=2 且 600s 才胜；不够杀继续。addBossKill 给 M1。
更新 selftest。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 万物一心

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P18.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js。不要标 Registry done。
不要打开游戏。

本环：setUnityTier(0|3|6|9) 可重复调用按当前档覆盖。档3 跟班伤+5（与地精+10分开）。档6 再加 floor(角色攻击×0.1)。档9 所有跟班可打目标+1。没档全 0。
更新 selftest。

完成后说：M11 已完成，请主导窗口查收。
```

---

## Phase 17 开工粘贴块

以 `docs/HANDOFF-P17.md` 为交接正文。

### M5 — 战士长条 / 实伤数字

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P17.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / match.js / enemies。不要标 Registry done。
不要打开游戏。

本环：
1) SLASH_RANGE=BODY（未蓄 1 身位）。SLASH_THICK=BODY*0.5。长度=BODY*(1+0.6*r)*大娃。厚度=SLASH_THICK*大娃，不要再乘蓄力长度。
2) 判定必须是沿鼠标的旋转矩形，禁止 drawW=drawH 的轴对齐正方形。3 大娃满蓄长度约 77px，不得盖半屏。
3) 伤害保持 攻击*(1+0.6*r)。chargeSizeMul 战士随 r 线性。
4) 弹出 takeHit 返回的实伤。notifyDamage 不要因 knockbackable===false 丢掉。挥砍打树用 OBB 调 hitSlashAt/hitAt，不要巨大 radius。
更新 selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 移速 / 甲像素描边 / takeHit 实伤

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P17.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / player / match.js。不要标 Registry done。
不要打开游戏。不要改冰人移速倍率。

本环：
1) 蘑菇 0.62/0.04；裂怪 0.77/0.04；蜗牛 0.62/0.03；史莱姆x-1 0.87/0.03；兰花 1.17。帽 1.4 仍在。
2) 删掉 strokeRect 甲框。像伤害数字那样给不透明像素描 1px 黄边。
3) takeHit 返回本次实际扣血（有甲 ×0.7）。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M7 — 树伤害数字 / 挥砍 OBB

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P17.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/**
不要改 combat / enemies / match.js。不要标 Registry done。
不要打开游戏。不要改刷树公式。

本环：hitAt 返回 dealt。增加 hitSlashAt（旋转矩形打树 AABB）供 M5。灰树浅树都要能被打出伤害数字（数字由 M5 onDamage 弹）。
更新 selftest。

完成后说：M7 已完成，请主导窗口查收。
```

### M8 — 选角原文 / 蝙蝠入池

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P17.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / match.js。不要标 Registry done。
不要打开游戏。不要改 backend。不要生图。

本环：
1) formatCharStats 两行：基础属性（血量|伤害|穿透|满蓄）+ 角色特点。原文见 HANDOFF。不要拼「每升级15次穿透+1」。tip 用 pre-line。
2) 普通池追加 bat「蝙蝠」，放兔子后面。图标 upgrades/bat.png。applyUpgrade → addBat / pendingBat。普通池 15。
更新 selftest。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 蝙蝠跟班

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P17.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js。不要标 Registry done。
不要打开游戏。

本环：addBat()。贴图 跟班/蝙蝠.png。伤 7+跟班加成。0.4s。最多 1 目标（同兔子）。该蝙蝠自己每杀 200 敌人 player.heal(1)（或 hooks.onHeal）。可叠。不要用角色击杀数。
更新 selftest。

完成后说：M11 已完成，请主导窗口查收。
```

---

## Phase 16 开工粘贴块

以 `docs/HANDOFF-P16.md` 为交接正文。

### M5 — 法师淡出 / 暴击帽 / 攻速 / 精益求精 / 强化射击

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P16.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / match.js / enemies。不要标 Registry done。
不要打开游戏。

本环：
1) 法师蓄力弹扩散 0.3s 不变、开始时结算；绘制边长仍放大，同时 alpha 1→0，结束时透明并删弹。点射不扩散。
2) 暴击触发按 min(critRate,100)。critDamageMul = 1.5 + 0.2*floor(critRate/30)*refinePicks。applyUpgrade('refine') 可叠。applyUpgrade('only_fast') 把攻击间隔 FIRE_INTERVAL/1.2^n（不改蓄力）。
3) 强化射击对所有角色：游侠第 1 次激光且攻击 +5，之后 +15；战士/法师每次 +15。
4) 敌人减伤走 takeHit，不要绕过直接改 hp。
更新 selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 移速 / 甲 / 冰人体型与兰花

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P16.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / player / match.js。不要标 Registry done。
不要打开游戏。不要改冰人移速倍率。

本环：
1) 蘑菇 0.65/0.06；裂怪 0.8/0.06；蜗牛 0.65/0.05；史莱姆x-1 0.90/0.05；兰花 1.2。帽 1.4 仍在。冰人移速不改。
2) armor 整数可叠。蜗牛出生 1。takeHit：有甲则 -1 层且该次伤害 ×0.7。有甲暗黄边。ARMOR_DMG_MUL=0.7。
3) ICE_MAN_DRAW=48（hurtbox 跟着放大）；子弹 200；每 40s 刷 3 兰花；兰花回血 10。该只兰花每成功回血 2 次：3 身位内其他活怪 armor+1（不含自己）。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M8 — 选角文案 / 15 级穿透 / 高级池

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P16.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / match.js。不要标 Registry done。
不要打开游戏。不要改 backend。不要生图。

本环：
1) 选角悬停特点写清楚：游侠远程弓/满蓄穿透/强化改激光；战士无限穿透/每点穿透+0.5身位击退/满蓄×1.6；法师碰到即停/每点穿透+20%/满蓄+50%/命中扩散。可补「每升级15次穿透+1」。
2) LEVEL_PIERCE_EVERY=15，算法同空血（升到 16/31/46…）pierceBonus+1。
3) crit 文案必须是「暴击率 +10」。empower_shot 全角色可进高级池。UPGRADES 末尾追加 only_fast「唯快不破」、refine「精益求精」、strange_egg「奇怪的蛋」。only_fast 仅 chargeMax<=0 才进高级池。WEAPON_IDS 含 only_fast/refine/empower_shot。strange_egg → companions.addEgg（没有就 pendingEgg）。唯快不破/精益求精图标空白；蛋用 upgrades/strange_egg.png。
更新 selftest。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 奇怪的蛋

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P16.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js。不要标 Registry done。
不要打开游戏。

本环：addEgg()。贴图 跟班/奇怪的蛋-x.png / -y.png / -z.png。0.4s；无血无击退；碰撞才打；吃跟班+10。阶段看 opts.getKills()（没有则 0）：<100 一阶段 攻击×0.20 打 1；>=100 二阶段 ×0.50 最多 2（地精重叠规则）；>=300 三阶段 ×0.80 最多 3（与第一目标重叠）。该蛋自己每杀 100 +1 固定伤害。可叠多只。不要自己读 session。
更新 selftest。

完成后说：M11 已完成，请主导窗口查收。
```

---

## Phase 15 开工粘贴块

以 `docs/HANDOFF-P15.md` 为交接正文。

### M4 — 去掉局内目标字

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P15.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 match.js / ui / combat。不要标 Registry done。
不要打开游戏。不要改 stickman 像素帧。

本环：局内不再绘制「目标：活够10分钟」。drawObjectiveFx 空实现；queueObjectiveFx 可留着以免 match 未拆线报错，但不要产生可见字。更新 selftest（入队后文本不含该句）。

完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 法师扩散 / 战士身前 / 暴击

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P15.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / match.js。不要标 Registry done。
不要打开游戏。

本环：
1) 暴击：默认率 0，伤害 ×1.5；applyUpgrade('crit') 暴击率 +10。每发掷一次，同一发扩散共享。
2) 法师 MAGE_FULL_SIZE=3.0。伤害=攻击×(1+穿透×0.20+0.50×蓄力)。弹体穿透 0。蓄力弹(ratio>0)命中第一个敌人后以该点为圆心 0.3s 扩散变大；开始扩散时按最大半径打范围内全体并跳数字；扩到最大素材消失。点射不扩散。
3) 战士：判定从身体前（半宽 5.5）沿鼠标 1.5 身位；满蓄范围/贴图/伤害 ×1.6；贴图可略大但不超过远端；贴脸能打到。无限穿透与击退不变。
更新 selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 冰人冲刺距离 / 测试木桩

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P15.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / player / match.js。不要标 Registry done。
不要打开游戏。不要改 stickman.js（只读 import drawStickman）。

本环：
1) 冰人 HP 2000；子弹速度 224；冲刺 1～6 次；每下走满 8 身位才结束，再开始下一次预警。不要用 0.4s 时长结束冲刺。
2) 测试木桩 dummy：999 血、每秒回 500、生成在 player.x+3*BODY；不动、不击退、接触 0 伤、被打才闪一下。导出 setDummyEnabled / spawnDummyAt。场上最多 1 个。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M8 — 难度悬停 / 暴击文案 / 自选升级 / 火柴人开关

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P15.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / match.js。不要标 Registry done。
不要打开游戏。不要改 backend。不要生图。

本环：
1) 选难度鼠标指向「难度一」显示「目标：活够10分钟」。
2) 普通池追加 crit「暴击」：暴击率 +10。UPGRADES 末尾。WEAPON_IDS 含 crit。普通池 14。穿透文案带上法师每点 +20%。法师选角特点改成穿透转伤害/满蓄+50%/命中扩散。图标空白。
3) 测试模式「升级选项自选」：弹出按 UPGRADES 顺序的全部图标，悬停 desc，点击 emit('grant-upgrade', id)。ESC 与右上红 X 只关这一层。导出 isUpgradePickerOpen。
4) 测试模式开关「火柴人」，字段 testDummy 默认 false。
更新 selftest。

完成后说：M8 已完成，请主导窗口查收。
```

---

## Phase 14 开工粘贴块

以 `docs/HANDOFF-P14.md` 为交接正文。

### M4 — 绿边回血数字 / 开局目标 5 秒

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P14.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 match.js / ui / combat。不要标 Registry done。
不要打开游戏。

本环：
1) dmgnum 增加绿边调色板；导出 spawnHealNum（回血强制绿边，不走 ≥100 黄/≥200 红）。player 再导出。
2) 开局目标「目标：活够10分钟」画在角色上方，OBJECTIVE_LIFE=5 秒后消失。导出 queueObjectiveFx，不要在 createPlayer 里自动开始。
更新 selftest。

完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 激光 / 法师×2.6 / 战士无限穿透与满蓄×1.6

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P14.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / match.js。不要标 Registry done。
不要打开游戏。

本环：
1) 强化射击改用 子弹/强化箭矢x.png（576×96 切 6 帧）。表现为沿弹道的激光，速度 680。不要再用 强化箭矢-1/2/3。数值仍 ceil×2.5 / +2 / 溢出 / 第二次+15。
2) 法师 MAGE_FULL_SIZE=2.6；未蓄边长 7～8，满蓄要能看出变大。
3) 战士攻击仍 22。无限穿透。基础击退 0；每 1 穿透 +0.5 身位击退。未蓄范围/贴图=1.5 身位且绘制=碰撞；满蓄范围和贴图 ×1.6（倍率）。只打一次。
4) applyKnockback 乘 target.knockbackScale??1。
更新 selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 冰人 Boss / 兰花

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P14.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / player / match.js。不要标 Registry done。
不要打开游戏。

本环：冰人 ≥420s 刷 1 只、1000 血、无成长、击退×0.5、生成时移速=角色 speedUnits×0.7。平时乱晃并尽量留在视野；出视野则靠近。碰到 −1 心。累计 400 伤逃跑 10s（移速=角色当前 speedUnits+0.2），不跑出视野。每 30s 一套四角/十字弹幕（怪物子弹.png，每发 −1 心）。每 20s 冲刺 1～3 次（0.25s 预警，×3.2 直线不跟踪）。每 40s 刷兰花：1 血、无伤害、移速 1.3、追血少的怪、每 15s 3 身位回 20，hooks.onHeal。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M8 — 满蓄模式 / 时间滑条 / 选角悬停

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P14.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / match.js。不要标 Registry done。
不要打开游戏。不要改 backend。

本环：
1) 测试项文案「无限弹药」改为「满蓄模式」（字段仍可 infiniteAmmo）。
2) 测试模式增加 0～10 分钟时间滑条（testElapsedSec 0～600）；导出 session.setElapsedSec。
3) 选角鼠标指向角色时显示：血量/伤害/穿透/特点。战士：4血、22伤、穿透0、近战无限穿透且每点穿透+0.5击退。游侠 3/20/0 远程；法师 2/25/0 法球消散满蓄范围。
更新 selftest。

完成后说：M8 已完成，请主导窗口查收。
```

---

## Phase 13 开工粘贴块

以 `docs/HANDOFF-P13.md` 为交接正文。

### M4 — 分血 / 伤害数字间距与黄红边

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P13.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 match.js / ui / combat。不要标 Registry done。
不要打开游戏。

本环：
1) createPlayer({ charId })：ranger 3 心、warrior 4 心、mage 2 心。
2) dmgnum：同一串数字间距从 16 收到 12～13。
3) 伤害 ≥100 用程序生成的黄外边数字；≥200 用红外边。对现有 tile_0-9 描 1px 边，不要另找图。
更新 selftest。

完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 强化箭图集 / 法师大小与范围 / 战士挥砍 / 数值

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P13.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / match.js。不要标 Registry done。
不要打开游戏。

本环：
1) 强化箭矢-1/2/3 按角色立绘切帧播放（6×96），不要把整张图当弹体射出去。满蓄伤害 ceil(攻击×2.5)，穿透+2；穿透用尽且过量则溢出打下一位。第二次仍 +15。
2) 法师：攻击 25；未蓄穿透 0、满蓄 4；未蓄大小接近箭矢再小 1～2px；随蓄力到 ×2.3；碰到消散；满蓄按穿透打范围内额外敌人。
3) 战士：攻击 22；未蓄穿透 1、满蓄 2；身前 1.5 身位；绘制=碰撞且刚盖过立绘+阴影；只结算一次伤害。
4) 大娃：giantSizeMul(n)=1+0.4*n。不要 chromaBlack 挥砍/强化箭。
更新 selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 史莱姆 x-1 改为 4 分钟

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P13.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 combat / player / match.js。不要标 Registry done。
不要打开游戏。

本环：SLIME_X1_UNLOCK_SEC 300→240。成长 u=max(0,秒−240)。血/波数/移速公式不变。
自测：239s 不刷；240s 第一波；hp(240)=85，hp(285)=97。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M7 — 磁铁每次 +1 身位

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P13.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/**
不要改 ui / combat / match.js。不要标 Registry done。
不要打开游戏。

本环：磁铁每次吸取范围 +1 身位（加，不乘 1.5）。基础仍 2 身位 → 3 → 4。
更新 addMagnet 与 selftest。

完成后说：M7 已完成，请主导窗口查收。
```

### M8 — 升级文案

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P13.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / world / match.js。不要标 Registry done。
不要打开游戏。不要改 backend。

本环：
1) magnet 文案：结晶吸取范围 +1 身位。session 磁铁兜底不要再 ×1.5。
2) giant 文案：每次弹体大小 +40%。
3) empower_shot 文案：满蓄 ceil(攻击×2.5)、穿透+2、过量溢出；再次 +15。
4) HUD 心数跟 player.hpMax（法师 2 / 战士 4），不要写死 3。
更新 selftest。

完成后说：M8 已完成，请主导窗口查收。
```

---

## Phase 12 开工粘贴块

以 `docs/HANDOFF-P12.md` 为交接正文。

### M4 — 三角色 / 死亡播完 / 空血上限 / 伤害数字

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P12.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 match.js / ui / combat。不要标 Registry done。
不要打开游戏。

本环：
1) createPlayer({ charId })：ranger/warrior/mage 读 characters/1/2/3，名字游侠/战士/法师。Death 均为 8 帧。
2) hp=0 播死亡；导出 deathAnimDone（deathT>=1.0s）。不要自己弹结算。
3) addEmptyHpMax：只加 hpMax，不加当前血。
4) render/dmgnum.js：游戏数字/tile_0-9.png；spawnDamageNum 按单位分开显示。
更新 selftest。

完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 法球 / 近战挥砍 / 满蓄变大 / 强化射击

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P12.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / player / match.js。不要标 Registry done。
不要打开游戏。

本环：
1) 按 player.charId：游侠箭、法师法球（子弹/法球.png，远程）、战士挥砍（子弹/挥砍-1/2/3.png，角色附近，不飞）。
2) 满蓄弹体与碰撞默认 ×1.25，再叠大娃。
3) empower_shot：第1次满蓄改强化箭矢（强化箭矢-1/2/3.png）速度780、伤害×3、穿透+4；第2次及以后攻击+15。
4) 挥砍/强化箭矢已有黑描边，禁止 chromaBlack。
5) 命中怪调用 spawnDamageNum 或 hooks.onDamage。
更新 selftest。

完成后说：M5 已完成，请主导窗口查收。
```

### M8 — 选角解锁 / 每10次空血 / 强化射击文案

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P12.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 combat / player / match.js。不要标 Registry done。
不要打开游戏。不要生图。

本环：
1) 选角解锁战士、法师；立绘用各自 S_Idle 第0帧朝右；session.charId 要留下。
2) 每升到 11/21/31… 空血上限 +1（addEmptyHpMax，不回血）。自然升级与测试提高都算。
3) 高级池新增 empower_shot「强化射击」，仅游侠。文案：满蓄改为强化箭矢，伤害×3，穿透+4；再次选择伤害+15。图标已有 upgrades/empower_shot.png。
更新 selftest（含改掉「高级只有地精1个」的旧断言）。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 跟班伤害数字

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P12.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player。不要标 Registry done。
不要打开游戏。

本环：跟班对怪造成伤害后，对该目标 spawnDamageNum（或 hooks.onDamage）。每个单位单独显示。没有该函数就跳过。
更新 selftest。

完成后说：M11 已完成，请主导窗口查收。
```

---

**P12**：2026-08-20 M1 查收 **pass**（M4 / M5 / M8 / M11）。`match.js` 已接 charId / 死亡动画 / 伤害数字。

**P11**：2026-08-18 M1 查收 **pass**（M11 / M6 / M8 / M5）。成长走 `addExp` 已有 ctx，未改 `match.js`。

**P10**：2026-08-17 M1 查收 **pass**（M11 兔子自索敌）。本环不改 `match.js`。

**P9**：2026-08-17 M1 查收 **pass**（M4 / M6 / M7 / M8 / M11）。M10 +1 图仍等采用。

**P8**：2026-08-17 M1 查收 **pass**（M6 / M8 / M11）。`match.js` 跟班钩子已够用。

**P7**：2026-08-16 M1 查收 **pass**（M6 / M8 / M11；M10 未开，地精升级图标空白）。接线已进 `match.js`。

**P6**：2026-08-16 M1 查收 **pass**（M4–M8；M10 等手绘未入图）。接线已进 `match.js`。

**P5**：2026-08-15 M1 查收 **pass**（M8 / M4）。M10 +1 贴图用户放弃，局内用程序「+1」。

---

## Phase 11 开工粘贴块

以 `docs/HANDOFF-P11.md` 为交接正文。

### M11 — 独立索敌

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P11.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player。不要标 Registry done。
不要打开游戏。

本环：每只跟班独立锁不同敌人；走进重叠再打，禁止大圆环空转。
兔子从怪朝角色的一侧切入，不要贴着怪一起追玩家。
改/补 selftest。

完成后说：M11 已完成，请主导窗口查收。
```

### M6 — 怪物数值

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P11.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 ui / companions / match.js / world。不要标 Registry done。
不要打开游戏。不要改灰树/普通树生命。

本环：蘑菇5、蜗牛4、x-1每波6、裂怪爆4、x-3死出3。
血初值+5；血成长+2；移速成长+0.02。x-3 出生 0.3s 无敌（子弹也打不中）。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M8 — 回忆悬停 / 力量文案 / 每5级成长

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P11.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 companions / enemies / weapons。不要标 Registry done。
不要打开游戏。

本环：1) 回忆图标悬停显示 UPGRADES.desc（不要常驻标题）。
2) 力量文案改为伤害 +10（数值由 M5 改 POWER_DMG）。
3) 每升到 6/11/16… 攻击+1、移速+0.05；addExp 与 boostLevels 都算。
更新 selftest（含改掉禁止 u.desc 的旧断言）。

完成后说：M8 已完成，请主导窗口查收。
```

### M5 — 力量 +10

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P11.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 ui / enemies / companions。不要标 Registry done。
不要打开游戏。

本环：POWER_DMG 8→10。更新 combat selftest（power +10）。
不要改散射/开眼了的 -3。

完成后说：M5 已完成，请主导窗口查收。
```

---

## Phase 10 开工粘贴块

以 `docs/HANDOFF-P10.md` 为交接正文。

### M11 — 兔子自索敌

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P10.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player。不要标 Registry done。
不要打开游戏。

本环：兔子追击改为离自己最近的活敌人（getTargets 同一池）。
地精仍追离角色最近的。碰撞伤害规则不要改。
保留地精 nearest-to-player 自测；补兔子 nearest-to-self 自测。

完成后说：M11 已完成，请主导窗口查收。
```

---

## Phase 9 开工粘贴块

以 `docs/HANDOFF-P9.md` 为交接正文。下面是同步副本。

### M11 — 跟班分散 + 兔子

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P9.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player。不要标 Registry done。

本环：
1) 多只跟班不要完全重叠：生成/跟随/追敌都要有独立槽位（绕角色或绕目标摊开）。
2) 新增兔子 addRabbit。贴图 /assets/跟班/兔子.png。0.4s；伤害 20+companionBonus；碰撞才打；最多 1 目标。无血无击退。addRabbit 不要自己 +10。
更新 selftest。

完成后说：M11 已完成，请主导窗口查收。
```

### M4 — 粘键

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P9.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 match.js / ui。不要标 Registry done。

本环：松开 WASD 后不应继续走。用 e.code（KeyW/A/S/D）。blur 与页面隐藏时清键。导出 clearMovementKeys 给 M1。更新 selftest。

完成后说：M4 已完成，请主导窗口查收。
```

### M6 — 史莱姆数值 / 裂怪错开

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P9.md 与根目录 怪物属性表.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 ui / companions / match.js。不要标 Registry done。

本环：
1) 史莱姆x-1：血 80+10×floor((秒-300)/45)；移速 1.00 每 45s +0.05；每波 5+floor((秒-300)/45)；仍 15 秒一波。
2) 史莱姆x-3 掉落 0 或 1 结晶（各 50%）。
3) 灰树爆出的 3 只裂怪绕爆点隔开，禁止同坐标。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M7 — 升级时结晶只飞不吃

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P9.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/** 、frontend/src/game/render/grass.*
不要改 match.js / ui。不要标 Registry done。

本环：updatePickups 增加 collect 开关（默认 true）。collect:false 时结晶/水果仍可飞向角色，但不要拾取、不要给经验、不要从数组删掉。黑洞飞行仍可。更新 selftest。

完成后说：M7 已完成，请主导窗口查收。
```

### M8 — 兔子 + 高级红点

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P9.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 match.js / companions / enemies。不要标 Registry done。不要生图。

本环：
1) 普通池新增 rabbit「兔子」：生成 1 个兔子跟班。applyUpgrade 调 companions.addRabbit（没有就 pendingRabbit）。图标已有 upgrades/rabbit.png。
2) tier=advanced 的选项图标（三选一和回忆）左上角 3×3 逻辑像素红点。兔子不要红点。
3) addExp 在 phase 为 levelup 或 upgrade 时不要再加经验（返回 0）。
更新 selftest。

完成后说：M8 已完成，请主导窗口查收。
```

### M10 — 升级 +1 图

```text
@multi-window_M @game-upgrade-icons @game-developer
我是 M10 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P9.md 与 docs/ICON-STYLE.md。当前角色：先斥候。
规定路径：assets/icon-review/**
禁止改 frontend/src。不要标 Registry done。不要擅自 GenerateImage。

本环：升级「+1」贴图。用户要自己改。等用户交出图或 map 并说「采用」后，再拷到：
frontend/public/assets/fx/levelup.png
assets/source/fx/levelup.png
跟班图标（地精/兔子）已由 M1 从桌面拷入，不要重做。

完成后（用户宣布采用拷贝完毕）说：M10 已完成，请主导窗口查收。
```

---

## Phase 8 开工粘贴块

以 `docs/HANDOFF-P8.md` 为交接正文。下面是同步副本。

### M8 — 地精文案 +10 / 回忆排版

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P8.md。当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 match.js / companions / enemies。不要标 Registry done。不要生图。

本环：
1) 地精文案加上「所有跟班伤害 +10」。applyUpgrade('goblin') 在 addGoblin 之外再调 companions.addDamageBonus(10)（或同等；没有函数就留 pendingCompanionDamage）。图标仍空白。
2) 回忆：每个升级图标隔开约 4 个字符宽，能写下 ×000。次数为 1 也显示 ×1。不要序号和效果文案。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 地精碰撞 / 跟班加伤

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P8.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/**
不要改 ui / enemies / match.js / player / combat。不要标 Registry done。

本环：
1) 地精改为碰撞伤害：绘制矩形 AABB 重叠才打。仍 0.4s 结算，不要每帧打。最多 2 目标，且那 2 个敌人必须彼此重叠；否则只打重叠中离地精最近的 1 个。
2) 伤害 = ceil(15+0.6×getAttack()) + companionBonus。导出 addDamageBonus(n)（或同等）。addGoblin 不要自己 +10。
3) 更新 selftest：不重叠 0 伤；重叠打 1；两敌彼此重叠才 2；bonus 10 后攻击 20 为 37。

完成后说：M11 已完成，请主导窗口查收。
```

### M6 — 史莱姆x-1 / x-3

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P8.md 与根目录 怪物属性表.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 ui / companions / match.js。不要标 Registry done。

本环：新增 slime_x1 / slime_x3。贴图 /assets/小怪/史莱姆x-1.png 与 史莱姆x-3.png（已由 M1 拷入）。
x-1：≥300s 出场，成长从 300s 起。每 15 秒一波，每波 1+floor((秒-300)/45)。血 40+10×同阶。移速 0.8+0.03×同阶（无 1.4 帽）。掉 2 结晶。死亡原地立刻 2 只 x-3。
x-3：不独立刷。血 ceil(该 x-1 生成时血量×0.25)。移速= x-1 死亡当时移速 +0.10（快照）。掉 1 结晶。
更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

---

## Phase 7 开工粘贴块

以 `docs/HANDOFF-P7.md` 为交接正文。下面是同步副本。

### M8 — 回忆图标 / 高级池 / 地精文案

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P7.md。当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 match.js / companions / enemies。不要标 Registry done。不要生图。

本环：
1) 回忆里查看对局：升级用 PixelIcon 从左到右。同一选项选 n 次在图标旁 ×n（n=1 不写 ×1）。不要数字序号和效果文案。
2) 高级升级：UPGRADES 加 tier:'advanced'。本局第 5/10/15… 次三选一才有 30% 把其中 1 格换成高级项。
3) 新增 goblin「地精」：高级、跟班。applyUpgrade 调 ctx.companions.addGoblin（没有就留钩子）。图标空白方块。

完成后说：M8 已完成，请主导窗口查收。
```

### M11 — 跟班 / 地精

```text
@multi-window_M @game-developer
我是 M11 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P7.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/companions/** （本环新建此目录）
不要改 ui / enemies / match.js / player / combat。不要标 Registry done。

本环：跟班系统 + 地精。贴图 /assets/跟班/地精.png（32×32 单帧）。
无血、无击退、不进 combat targets。移速=add 当时 player.speed。走向离角色最近的敌人；没敌人则跟角色。
攻击间隔 0.4s；伤害 ceil(15+0.6×getAttack())；同时打跟班最近的最多 2 个活敌人。
导出 createCompanions，含 addGoblin / update / draw。写 selftest.mjs。

完成后说：M11 已完成，请主导窗口查收。
```

### M6 — 怪物贴图匹配

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P7.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 ui / companions / match.js。不要标 Registry done。

本环：按中文名匹配贴图。蘑菇怪→蘑菇怪.png，蜗牛怪→蜗牛怪.png，裂怪（灰树爆出 split）→裂怪.png，禁止裂怪再用蘑菇怪图。单帧 32×32。更新 selftest。

完成后说：M6 已完成，请主导窗口查收。
```

### M10 — 地精图标（等待）

```text
@multi-window_M @game-upgrade-icons @game-developer
我是 M10 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P7.md 与 docs/ICON-STYLE.md。当前角色：先斥候。
规定路径：assets/icon-review/**
禁止改 frontend/src。不要标 Registry done。不要 GenerateImage。不要栅格化占位图。

本环：升级「地精」（id=goblin）。用户未说生图或手绘完成前请等待。
采用后再拷：frontend/public/assets/upgrades/goblin.png 与 assets/source/upgrades/goblin.png
磁铁 magnet 若仍未采用，继续等，不要擅自出图。

完成后（用户宣布本环结束或采用拷贝完毕）说：M10 已完成，请主导窗口查收。
```

---

## Phase 6 开工粘贴块

以 `docs/HANDOFF-P6.md` 为交接正文。下面是同步副本。

### M7 — 掉落速度 / 树结晶 / 黑洞飞 / 磁铁范围

```text
@multi-window_M @game-developer
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P6.md 与 docs/MODULE-REGISTRY.md 中 M7。
当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/** 、frontend/src/game/render/grass.*
不要改 enemies / ui / match.js。不要标 Registry done。

本环：
1) PICKUP_SPEED 改为 90×1.5=135。
2) 普通树结晶下限 3；上限每满 1 分钟 +2（60s 起 3～8）。
3) 黑洞：提供 pullAllCrystals（或同等）。结晶飞向角色，速度用 PICKUP_SPEED，进收集圈才给经验。水果不吸。不要当帧删光。
4) addMagnet()：吸取范围每次 ×1.5。图标不归你。

完成后说：M7 已完成，请主导窗口查收。
```

### M6 — 蘑菇怪成长 / 蜗牛怪 / 刷怪倍率

```text
@multi-window_M @game-developer
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P6.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
不要改 pickups / ui / match.js。不要标 Registry done。

本环：
1) 原小怪改名蘑菇怪。贴图 /assets/小怪/蘑菇怪.png（32×32 单帧，禁止按 4 帧条带切）。血 22+3×floor(秒/45)。每 5 秒一波，每波 4+floor(秒/120)，无上限。
2) 新增蜗牛怪。贴图 /assets/小怪/蜗牛怪.png（同样单帧）。120s 出场，成长从 120s 起算。每 5 秒×3，之后每 45s 每波 +1。血 40，每 40s +8。移速 0.75，每 45s +0.05 设计单位（禁止 +5.0）。knockbackResist=BODY。接触 −1 心，掉 1 结晶。
3) 测试 spawnRate：有效每波数量 = round(基础数量×倍率) 且 ≥1。不要只把倍率乘在 dt 计时器上。

完成后说：M6 已完成，请主导窗口查收。
```

### M8 — 磁铁文案 / 先 +1 再选项 / 刷怪速度文案

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P6.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 match.js / player / pickups。不要标 Registry done。不要生图。

本环：
1) 升级池新增 magnet「磁铁」：结晶吸取范围 +50%。applyUpgrade 调 env.addMagnet（没有函数就留钩子）。图标未过审，局内空白方块。
2) 升级不要立刻出三选一。addExp/boostLevels 先进入 levelup（或等价），提供 beginUpgradeOffer(ctx) 给 M1。UpgradeView 只在 phase==='upgrade'。
3) 设置测试项文案改为「刷怪速度」。

完成后说：M8 已完成，请主导窗口查收。
```

### M5 — 击退最低 0 / 减免

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P6.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
不要改 enemies。不要标 Registry done。

本环：applyKnockback 改为 max(0, dist - (target.knockbackResist||0))。knockbackable===false 仍不位移。游戏击退最低为 0。更新 selftest（resist=BODY 时未蓄击退为 0）。

完成后说：M5 已完成，请主导窗口查收。
```

### M4 — +1 是否播完

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P6.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 ui / views / match.js。不要标 Registry done。

本环：导出 hasLevelUpFx(player) 或 levelUpFxBusy(player)（fx 队列空则为 false）。升级流程由 M8/M1 等这个信号再出三选一。更新 selftest。

完成后说：M4 已完成，请主导窗口查收。
```

### M10 — 磁铁图标（等待手绘）

```text
@multi-window_M @game-upgrade-icons @game-developer
我是 M10 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P6.md 与 docs/ICON-STYLE.md。当前角色：先斥候。
规定路径：assets/icon-review/**
禁止改 frontend/src。不要标 Registry done。不要 GenerateImage。不要栅格化占位图。

本环：升级「磁铁」（id=magnet），U 形磁铁，12×12 小像素。用户说会独自绘画，请等待。
用户把图画好或写出 map 并说「采用」后，再拷到：
frontend/public/assets/upgrades/magnet.png
assets/source/upgrades/magnet.png
未采用前局内空白方块（M8 已有）。

完成后（用户宣布本环结束或采用拷贝完毕）说：M10 已完成，请主导窗口查收。
```

---

## Phase 5 开工粘贴块

以 `docs/HANDOFF-P5.md` 为交接正文。下面是同步副本。

### M8 — 无上限 / 测试提高 / BGM / 选角立绘

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P5.md 与 docs/MODULE-REGISTRY.md 中 M8。
当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 match.js / player / combat。不要标 Registry done。

本环四件事：
1. 去掉等级上限 30；expNeed 不要再夹到 30。
2. 测试模式「提高等级」0～3；只在局内关掉设置后生效，pending 最多 3 次三选一。主页设置改这个数不要改等级。
3. 循环播放 /assets/游戏音乐/music.ogg，音量滑条即时生效。
4. 选角页游侠用 S_Idle 第 0 帧并水平翻转朝右。

完成后说：M8 已完成，请主导窗口查收。
```

### M4 — 升级 +1

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P5.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 ui / views / match.js。不要标 Registry done。

本环：角色升级时周围出现「+1」上浮消失。一次升 n 级出 n 个 +1。
无 fx/levelup.png 时程序绘制；有则用该 PNG。
导出 queueLevelUpFx(n)（或同等接口）给 M1 接线。更新 selftest。
完成后说：M4 已完成，请主导窗口查收。
```

### M10 — 升级 +1 图（先讨论）

```text
@multi-window_M @game-upgrade-icons @game-developer
我是 M10 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P5.md。当前角色：先斥候。
规定路径：assets/icon-review/** ；用户说「采用」后才写入 frontend/public/assets/fx/levelup.png 与 assets/source/fx/levelup.png
禁止改 frontend/src。不要标 Registry done。不要擅自 GenerateImage。

本环：升级「+1」贴图。先用文字描述构图（小像素「+1」、奶油底或透明、对齐现有图标画风），等用户说生图 / 自己画 / 不需要图（用 M4 程序字）。
一次最多一张。采用后再拷贝。
完成后说：M10 已完成，请主导窗口查收。
```

---

**P4 调整 1**：2026-08-15 M1 查收 **pass**（M8 空白占位、M10 用户手绘 11 张、M4 朝向、M5 攻击属性）。黑洞吸结晶接线仍待 M7 / M1。

---

## Phase 4 开工粘贴块

以 `docs/HANDOFF-P4-ADJ1.md` 为交接正文。下面是同步副本。

### M8 — 升级图标空白占位（调整 1）

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/MODULE-REGISTRY.md 中 M8，以及 docs/HANDOFF-P4-ADJ1.md。
当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 match.js / combat / 不要 GenerateImage。不要标 Registry done。

本环唯一目标：升级选项图标未过审时显示空白方块；存在 frontend/public/assets/upgrades/{id}.png 时显示该图。

交接：HANDOFF 里写了 M1 越界已改 PixelIcon。斥候先对照磁盘与成功标准；主力只补缺口；搜剿对照成功标准。
完成后说：M8 已完成，请主导窗口查收。
```

### M10 — 升级选项生图（调整 1）

```text
@multi-window_M @game-upgrade-icons @game-developer
我是 M10 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/MODULE-REGISTRY.md 中 M10，以及 docs/HANDOFF-P4-ADJ1.md。
当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿；同一卡点最多 4 次。
规定路径：assets/icon-review/** ；用户说「采用」后才写入 frontend/public/assets/upgrades/ 与 assets/source/upgrades/
禁止改 frontend/src、backend、docs/MODULE-REGISTRY.md。不要标 Registry done。

本环唯一目标：为每个升级选项单独出图；一次一张；等用户检查。
画风锁：先读 docs/ICON-STYLE.md。已有 ICON_MAPS 的 id 只栅格化，禁止 GenerateImage 出插画。
用户说采用后再拷进游戏。未采用的只留在 icon-review。

先列出 UPGRADES 里还没有过审 PNG 的 id，从第一个缺的开始。
每张出完必须停下等用户：采用 / 重做 / 下一个。
完成后（本批你交代的 id 都过审或用户宣布本环结束）说：M10 已完成，请主导窗口查收。
```

### M4 — 游侠左右朝向（测试 1）

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P4.md。当前角色：主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**

问题：鼠标指向左或右时，游侠侧向朝向与鼠标相反。
检查 facingFromAngle 的 flipX（S 向）。改完更新 selftest。
不要标 Registry done。完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 蓄力伤害改为攻击属性（调整 2）

```text
@multi-window_M @game-developer
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P4.md。当前角色：主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**

必须：攻击伤害是独立属性（不要写死 20～40 当唯一伤害）。
未蓄 = attack；满蓄 = attack × 2；中间线性。
力量 +8、散射/开眼了 −3 改 attack。更新 selftest。
不要标 Registry done。完成后说：M5 已完成，请主导窗口查收。
```

### M8 — 黑洞入升级池（图标先空白）

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P4.md。当前角色：主力。
只改：frontend/src/ui/** 、frontend/src/views/**

新增升级：黑洞。选择后吸收全地图经验结晶（效果可先留字段/钩子，接线若越界写清留给 M1/M7）。
文案入 UPGRADES；图标未过审，局内已是空白方块，不要画程序图标。
更新 selftest。不要标 Registry done。完成后说：M8 已完成，请主导窗口查收。
```

---

## Phase 3 开工粘贴块（复用旧窗）

### M8 — 局内设置 / 经验 / 去选武器

```text
@multi-window_M @springboot-vue
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P3.md 与 MODULE-REGISTRY 中 M8。
当前角色：主力。只改：frontend/src/ui/** 、frontend/src/views/**
（不要改 match.js / combat / enemies，接线留 M1）

必须：
1) 游戏场景外右上角黑色区域放齿轮；点击或 ESC → 暂停并打开现有设置页；再 ESC 关闭并恢复
2) 设置页增加「返回主页」；确认弹窗「返回后本局无法保持，是否退出？」
3) 去掉开始流程的选武器页：主页→选角→难度
4) 经验：首级 15，每级需求 +4
5) 升级文案：换弹改为「蓄力时间 −0.20」；弹容改为「双发 ±15°」
HUD 可先去掉弹药、预留蓄力显示字段。不要标 Registry done。
完成后说：M8 已完成，请主导窗口查收。
```

### M6 — 固定移速

```text
@multi-window_M @springboot-vue
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P3.md。当前角色：主力。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**

移速改为设计单位固定值，禁止再乘 player.speed：
- 普通小怪初始 0.75
- 灰树裂怪初始 0.9
- 成长：min(1.4, base + 0.06t) × SPEED_PX_PER_UNIT
更新 selftest。不要标 Registry done。
完成后说：M6 已完成，请主导窗口查收。
```

### M4 — 游侠外观

```text
@multi-window_M @springboot-vue
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P3.md 与 docs/ASSETS.md。当前角色：主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
素材：frontend/public/assets/characters/1/ 与 Other/Shadow.png
把「这个人」换成游侠贴图（D/S/U Idle Walk Attack Hurt）；脚下画 Shadow.png；CHAR_NAME=游侠。
可暴露 facingDir / charging 给 M5。不要改 combat。不要标 Registry done。
完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 蓄力箭（等 M4 查收后再开）

```text
@multi-window_M @springboot-vue
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P3.md。当前角色：主力。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
依据 M4 已完成的游侠。

必须：去掉弹匣/换弹；换弹条改为蓄力条上限 0.75s；按住蓄力松开发射；间隔 0.21s
伤害 20→40 线性；击退 1→2 身位（满蓄）；仅满蓄穿透 1 只（最多 2 目标）
箭矢 Arrow.png；击中 Other/*_Blood.png
升级：charge −0.20（≤0 无需蓄力）；dual_shot 两箭 ±15°
不要标 Registry done。完成后说：M5 已完成，请主导窗口查收。
```

---

## Phase 2.1 开工粘贴块（复用旧窗）

### M8 — 音量滑条修复

```text
@multi-window_M @springboot-vue
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P2.1.md 与 docs/MODULE-REGISTRY.md 中 M8。
当前角色：主力（最小改动）。只改：frontend/src/ui/** 、frontend/src/views/**
（必要时 SettingsView / settings.js / pixel.css）

问题：设置里音量像固定数，滑动无反馈。
目标：拖动滑条时 settings.volume 实时更新，并显示同步变化的音量数字（百分比）。
交付：关键 diff + 自测说明（如何拖、数字如何变）。
不要标 Registry done。完成后说：M8 已完成，请主导窗口查收。
```

### M6 — 刷怪与灰树自损

```text
@multi-window_M @springboot-vue
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/FIX-PLAN-P2.1.md 与 MODULE-REGISTRY M6、GAME-SPEC。
当前角色：主力。只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**

必须实现：
1) 小怪：初始每 5 秒生成 4 只（成长公式以该基数为准）
2) 灰树：存活满 30 秒后才开始刷；每波 2 棵
3) 灰树自损：每 3 秒扣 1～5 点血（随机），每棵树独立计时/掷点（禁止全局统一扣）
更新 selftest 证据。不要标 Registry done。
完成后说：M6 已完成，请主导窗口查收。
```

---

## 开工粘贴块（整段复制到新窗口）

### M3 — 骨架

```text
@multi-window_M @springboot-vue
我是 M3 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/MODULE-REGISTRY.md 中 M3 章节，以及 docs/GAME-SPEC.md、docs/ASSETS.md。
当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿执行；同一卡点最多 4 次。
只改规定路径：frontend/ 、frontend/src/game/ 、frontend/public/assets/
勿覆盖其他模块。不要把 Registry 标成 done。
交付目标：Vue+Vite 可跑、Canvas/Pixi 主循环、约 7000² 世界、相机跟随占位、BODY 等常量。
```

### M4 — 玩家（打回重修用）

```text
@multi-window_M @springboot-vue
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
当前角色：主力（M1 查收 fail 打回，请按打回项最小实现）。
请读 docs/MODULE-REGISTRY.md 中 M4「M1 打回项」与 docs/GAME-SPEC.md §2、docs/RECEIPT-LOG.md 最新 M4 条。

卡点签名：M4 规定路径无产出 / 缺玩家与 stickman
本轮循环计数：1/4

硬性打回项：
1) 必须创建 frontend/src/game/player/**
2) 必须创建 frontend/src/game/render/stickman.*
3) 导出 createPlayer()（或等价）：含 x/y、hp≤3、WASD 移动、面向鼠标
4) takeDamage(n) → 扣心 + 无敌帧 + 像素飞散表现
5) 可 setFollowTarget(player) 做最小接线证明；勿重构 M3 engine
6) 结束交：关键文件清单 + 自测命令/真实输出
只改 M4 路径。不要标 Registry done。
完成后说：M4 已完成，请主导窗口查收。
```

### M5 — 武器

```text
@multi-window_M @springboot-vue
我是 M5 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/MODULE-REGISTRY.md 中 M5 与 docs/GAME-SPEC.md §2/§4。
当前角色：先斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/game/combat/** 、frontend/src/game/weapons/**
交付：鼠标瞄准开火、伤害15、弹匣7、后坐力、换弹3秒甩枪、命中小怪击退1身位；预留弹容+2与换弹-25%。
不要标 Registry done；完成后说：M5 已完成，请主导窗口查收。
```

### M6 — 敌人与刷怪

```text
@multi-window_M @springboot-vue
我是 M6 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/MODULE-REGISTRY.md 中 M6、docs/GAME-SPEC.md §5–§6、docs/ASSETS.md。
当前角色：先斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/game/enemies/** 、frontend/src/game/spawner/**
交付：小怪22血接触伤可击退；灰树自损/不可击退/毁后1秒刷3怪(移速基数1)；常规与灰树刷怪+难度一成长。
素材用 assets/source/。不要标 Registry done；完成后说：M6 已完成，请主导窗口查收。
```

### M7 — 环境与掉落

```text
@multi-window_M @springboot-vue
我是 M7 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/MODULE-REGISTRY.md 中 M7、docs/GAME-SPEC.md、docs/ASSETS.md。
当前角色：先斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/game/world/** 、frontend/src/game/pickups/** 、frontend/src/game/render/grass.*
交付：浅绿草地(对齐浅树)、普通树仅子弹可毁、3结晶+50%水果、2身位吸附、普通树10s刷1。
不要标 Registry done；完成后说：M7 已完成，请主导窗口查收。
```

### M8 — UI 与后端

```text
@multi-window_M @springboot-vue
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/MODULE-REGISTRY.md 中 M8 与 docs/GAME-SPEC.md §4/§7/§8。
当前角色：先斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/ui/** 、frontend/src/views/** 、backend/
交付：开始屏「类幸存者」+难度一、HUD、升级三选一(移速+0.10/弹容+2/换弹-25%)像素图标、结算+Spring Boot存活统计API。
不要标 Registry done；完成后说：M8 已完成，请主导窗口查收。
```

---

## 你（用户）传话清单

1. 新窗口打开同一文件夹：`D:\Cursor_projectt\rogerlike`  
2. 粘贴上面对应块，等它交斥候报告后再让它转主力（或它按块内顺序自己走）  
3. 子窗口说「已完成，请查收」→ 回到 **M1** 贴：

```text
@multi-window_M
我是 M1。当前角色：搜剿（只验收，禁止顺手改子模块实现来修完）。
用户汇报：M{n} 已完成，请查收。
读磁盘 + 跑验收 + 对照 Registry；pass 则更新 MODULE-REGISTRY 与 RECEIPT-LOG。
```
