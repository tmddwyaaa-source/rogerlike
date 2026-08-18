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
| **M4** | 玩家 / 生命 / 无敌 | P9 粘键 | `frontend/src/game/player/**`、`frontend/src/game/render/**` | — | ✅ **P9 done** |
| **M5** | 战斗 / 蓄力箭 | P11 力量+10 | `frontend/src/game/combat/**`、`frontend/src/game/weapons/**` | M4 | ✅ **P11 done** |
| **M6** | 蘑菇怪 / 蜗牛怪 / 刷怪 | P11 怪物数值 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` | — | ✅ **P11 done** |
| **M7** | 普通树 / 掉落 / 草地 | P9 结晶不拾取 | `frontend/src/game/world/**`、`frontend/src/game/pickups/**`、`frontend/src/game/render/grass.*` | M3 | ✅ **P9 done** |
| **M8** | UI / 升级 / Spring Boot | P11 回忆/成长 | `frontend/src/ui/**`、`frontend/src/views/**` | — | ✅ **P11 done** |
| **M9** | 集成磨合 | P9 接线 | `App.vue` / `engine.js` / `match.js` | 各模块 review | ✅ **P9 done** |
| **M10** | 升级选项出图 | P9 +1 图 | 待审 `assets/icon-review/**` | M1 规格 | ⏳ **等用户采用 +1** |
| **M11** | 跟班 | P11 独立索敌 | `frontend/src/game/companions/**` | M8 文案 | ✅ **P11 done** |

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

**P3 开窗顺序**：先并行 **M8 + M6 + M4** → M4 查收后开 **M5** → 全部请查收 → 回 M1。  
**P3 状态**：2026-08-14 M1 查收 **pass**。粘贴块仅供打回重修。

---

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
