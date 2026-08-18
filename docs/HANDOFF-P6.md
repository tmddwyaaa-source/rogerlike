# 交接 — P6（掉落加速 / 蘑菇怪成长 / 普通树结晶 / 刷怪倍率 / 黑洞飞行 / 升级先 +1 / 磁铁 / 蜗牛怪）

> **主导**：M1  
> **日期**：2026-08-16  
> **禁止**：非 M 编号窗口。本环窗口：**M7、M6、M8、M5、M4、M10**；接线 **M1**。  
> 子窗口禁止标 Registry `done`。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

素材已由 M1 拷入（两边都有）：

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `frontend/public/assets/小怪/蘑菇怪.png` | 32×32 单帧 | 蘑菇怪 |
| `assets/source/小怪/蘑菇怪.png` | 同上 | 备份 |
| `frontend/public/assets/小怪/蜗牛怪.png` | 32×32 单帧 | 蜗牛怪 |
| `assets/source/小怪/蜗牛怪.png` | 同上 | 备份 |

桌面源：`C:\Users\user\Desktop\Roger-png\小怪\`。用户写「蜗牛怪素材用蘑菇怪」时，该目录里 **同时有** `蘑菇怪.png` 与 `蜗牛怪.png`。本环按文件名对齐：蘑菇怪用前者，蜗牛怪用后者。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M7** | ①掉落飞行速度 +50% ②普通树结晶上限按分钟成长 ③黑洞：结晶飞向角色（速度=吸附速度） ④磁铁：吸取范围 ×1.5 的字段/接口 | `frontend/src/game/world/**`、`frontend/src/game/pickups/**`、`frontend/src/game/render/grass.*` |
| **M6** | ①小怪改名蘑菇怪 + 新成长 ②蜗牛怪（2 分钟出场） ③测试刷怪倍率改为「本波数量 × 倍率」 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` |
| **M8** | ①升级池加「磁铁」文案 ②升级先播 +1 再出三选一 ③设置刷怪倍率文案 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M5** | 击退可按实体减免，结果最低 0 | `frontend/src/game/combat/**`、`frontend/src/game/weapons/**` |
| **M4** | 导出「+1 是否还在播」给 M1 判断何时出选项 | `frontend/src/game/player/**`、`frontend/src/game/render/**` |
| **M10** | **等用户手绘**磁铁图标；未采用前不要拷进游戏 | `assets/icon-review/**` |
| **M1** | 规格、拷素材、查收；`match.js`：活设置倍率、黑洞改调用吸入飞行、`levelup` 阶段播完 +1 再出选项 | `docs/**`、`match.js`（等请查收后再接） |

M7 不改 enemies / ui。M6 不改 pickups / ui。M8 不改 match.js / player。M5 不改 enemies。M4 不改 session。M10 不改 `frontend/src`。

---

## 1. 掉落物飞行速度 +50%（M7）

当前 `PICKUP_SPEED = 90`。改为 **135**（90×1.5）。

这是结晶/水果被吸入时飞向角色的速度。黑洞飞行必须用 **同一个** 常量，不要另写一套。

---

## 2. 蘑菇怪（原「小怪」）（M6）

显示名 **蘑菇怪**。贴图：`/assets/小怪/蘑菇怪.png`（**32×32 单帧**，不要再按旧 octocat 四帧条带切）。深色底当透明，同现逻辑。

| 项 | 规格 |
|----|------|
| 生命 | 初始 **22**；每 **45** 秒 **+3**（生成时按当时阶计算：`22 + 3×floor(存活秒/45)`） |
| 接触 | −1 心 |
| 击退 | 可被击退（减免 0） |
| 刷怪间隔 | **固定每 5 秒**一波（去掉旧的 `5×0.92^t` 和 0.8 下限） |
| 每波数量 | 初始 **4**；每过 **2 分钟** +1：**4、5、6…** 无上限。`4 + floor(存活秒/120)` |
| 移速 | 维持现有：`min(1.4, 0.75+0.06t)×80`（用户本环没改口移速） |
| 掉落 | 仍 1 结晶 |

灰树裂怪仍用蘑菇怪数值/贴图即可（生命也跟蘑菇怪当时成长）。

---

## 3. 普通树结晶成长（M7）

下限不变 **3**。上限：初始 **6**；每满 **1 分钟** 上限 **+2**。

| 存活 | 结晶区间 |
|------|----------|
| 0～59s | 3～6 |
| 60～119s | 3～8 |
| 120～179s | 3～10 |
| … | 3～(6+2×floor(秒/60)) |

毁树当下按 **当时存活秒** 掷点。水果 30% 不变。「大地啊」仍是每波树 +2 / 果率 +10%，不要改结晶区间。

---

## 4. 测试模式刷怪速度（M6 公式 + M1 接线 + M8 文案）

**为什么看起来没效果**：旧实现只把倍率乘在计时器上（`acc += dt * rate`），每波仍刷 4 只，肉眼像没变。且 `match.js` 可能握着开局那份设置。

**新口径**：

- 仍仅 **测试模式打开** 时生效；关闭时倍率视为 **1**。
- `有效每波数量 = round(当前时间该种怪的应刷数量 × spawnRate)`，至少 1。
- 间隔仍用当前时间公式（蘑菇怪/蜗牛怪都是 5 秒）。
- 例：开局蘑菇怪 4/5s、倍率 2 → **8**/5s；2 分钟后基础 5、倍率 2 → **10**/5s；蜗牛怪 3、倍率 1.5 → **5**/5s。
- 灰树每波数量同样 × 倍率（保持测试项覆盖「怪物」）。
- M1：每帧从 `shell.getSettings()` 读 **活** 的 `testMode`/`spawnRate`，不要只用 `begin()` 快照。
- M8：文案改为 **刷怪速度 ×n**（不要写「概率」）。

---

## 5. 黑洞展示：结晶飞向角色（M7 + M1）

选「黑洞」后 **不要**再 `splice` 立刻删光结晶并瞬间给经验。

- 场上所有 **经验结晶**（水果不吸）进入「强制吸入」：无视 2 身位吸附圈，以 **PICKUP_SPEED** 飞向角色。
- 碰到收集半径（现 `PICKUP_COLLECT_RANGE`）再入账，与靠近自动吸收相同。
- 选完后若游戏仍暂停（三选一/升级 +1），**结晶仍要飞**（M1 在非 `playing` 时也要步进 pickups，或提供 `env.updatePickups(dt, player)`）。
- 经验入账时机 = 飞到身上，不是点选项的那一帧。

M1 查收后删掉/改掉 `match.js` 里瞬间清空的 `vacuumAllCrystals`，改为调用 M7 的 `pullAllCrystals`（或同等）。

---

## 6. 升级：先 +1，再出选项（M8 + M4 + M1）

现状：`addExp` 立刻 `phase='upgrade'`，三选一和 +1 同时出现。

新流程：

1. 升级发生 → `pending` 增加；播 n 个 +1（已有 `queueLevelUpFx(n)`）。
2. 此时 **不要**显示 `UpgradeView`。建议新阶段 `levelup`（或等价：`phase` 仍 playing 但冻结且 `pending>0` 且无 offer）。局内敌人/玩家停（与现在升级暂停相同），只播 +1、可让结晶继续飞。
3. **全部 +1 播完**（`player.levelUpFx` 空，或 M4 导出的 busy=false）→ 再 `phase='upgrade'`、抽 3 选项。
4. 测试「提高等级」同样：关设置后先 +1，再出最多 3 次三选一。
5. 连升 n 级：n 个 +1 都结束再出 **第一** 张三选一；选完若还有 pending，直接出下一张（不必再等 +1，那些 +1 已经播过）。

M4 导出例如 `hasLevelUpFx(player)` / `levelUpFxBusy(player)`。不要改 session。  
M8：`addExp`/`boostLevels` 不要立刻 `rollOffer`；提供 `beginUpgradeOffer(ctx)` 给 M1。`UpgradeView` 只在 `phase==='upgrade'`。  
M1：`phase==='levelup'` 时冻结世界、步进 +1；fx 空且 pending>0 则 `beginUpgradeOffer`。

---

## 7. 新升级「磁铁」（M8 文案 + M7 效果；M10 等手绘）

| 项 | 值 |
|----|-----|
| id | `magnet` |
| 名称 | **磁铁** |
| 效果 | 结晶吸取范围 **+50%**（相对 **当前** 范围，每次 ×1.5，可叠） |
| 初始范围 | 仍 2 身位 |
| 第一次 | 3 身位；第二次 4.5 身位… |
| 图标 | **空白方块** 直到用户在 M10 手绘并说采用 |

M8：写入 `UPGRADES` + `applyUpgrade` 调 `env.addMagnet()`（或同等）。  
M7：`mods.magnetMul` 初值 1；`addMagnet()` 令其 `*= 1.5`；吸附圈用 `MAGNET_RANGE * magnetMul`。  
M10：**等待**。禁止 GenerateImage，禁止擅自拷 PNG。

---

## 8. 蜗牛怪（M6 + M5 击退）

**2 分钟（120s）** 才开始刷。**成长从 120s 起算**（不要用开局以来的 t）。

| 项 | 规格 |
|----|------|
| 贴图 | `/assets/小怪/蜗牛怪.png`（32×32 单帧，深色底透明） |
| 出场 | `elapsed >= 120`；解锁瞬间先刷 1 波 |
| 间隔 | 每 **5 秒** 一波 |
| 每波 | 初始 **3**；之后每 **45** 秒 +1。`3 + floor((elapsed-120)/45)` |
| 生命 | 初始 **40**；每 **40** 秒 +8。`40 + 8×floor((elapsed-120)/40)` |
| 移速 | 初始 **0.75** 设计单位。每 45 秒 **+0.05** 设计单位（用户写「+5」：与 0.75 同一量纲的百分位，**禁止**一次 +5.0）。`0.75 + 0.05×floor((elapsed-120)/45)`。不套蘑菇怪 1.4 帽 |
| 击退 | 可被击退；受到的击退 **−1 身位**，结果 **最低 0**（满蓄 2 身位 → 蜗牛走 1；未蓄 1 → 0） |
| 接触 | −1 心 |
| 掉落 | 1 结晶 |
| 刷怪环 | 与蘑菇怪相同（视野外近距） |

M6 给实体设 `knockbackResist = BODY`（1 身位）。  
M5：`applyKnockback` 用 `max(0, dist - (target.knockbackResist \|\| 0))`；`knockbackable===false` 仍完全不位移。

测试倍率对蜗牛怪每波数量同样相乘。

---

## 成功标准

### M7

- [ ] `PICKUP_SPEED === 135`
- [ ] 59s 毁树结晶 max=6；60s max=8
- [ ] `pullAllCrystals`（名可不同）只标记结晶飞行，不当帧删光、不当帧给经验
- [ ] `addMagnet()` 后吸附半径 ×1.5
- [ ] 更新/补 selftest；不要改 enemies / ui / match.js

### M6

- [ ] 蘑菇怪贴图单帧 蘑菇怪.png；公式：血 `22+3t`，波数 `4+floor(sec/120)`，间隔恒 5
- [ ] 蜗牛怪 120s 出场；血/波/移速从 120s 起算；`knockbackResist=BODY`
- [ ] `tickSpawns`：**数量 × spawnRate**（round，≥1），不要只加速计时器
- [ ] selftest 覆盖上述公式 + 倍率乘数量；不要改 pickups / ui

### M8

- [ ] `UPGRADES` 含磁铁；无过审图走空白方块
- [ ] `addExp` 升 1 级后 phase 不是立刻 `upgrade`（应 `levelup` 或等价）；`beginUpgradeOffer` 才会出 3 选项
- [ ] 设置文案「刷怪速度」
- [ ] selftest：磁铁入池；升级先不 rollOffer。不要改 match.js / player

### M5

- [ ] 击退距离 `max(0, raw - resist)`；resist 缺省 0
- [ ] selftest：resist=BODY 时未蓄击退为 0
- [ ] 不要改 enemies

### M4

- [ ] 导出 busy/剩余接口；selftest 有断言
- [ ] 不要改 session / views

### M10

- [ ] 本环不生图、不拷贝，直到用户交出磁铁图并说采用

---

## 开工粘贴块

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

## M1 查收后接线（子窗口不要做）

1. `match.js` 每帧 `shell.getSettings()`，把活的 spawnRate 传给 `foes.update`。
2. `env.vacuumCrystals` → M7 的飞行吸入，不要瞬间 splice。
3. `phase==='levelup'`（或 M8 等价）时冻结战斗，仍步进 +1 与 pickups；fx 结束调用 `beginUpgradeOffer`。
4. 跑 selftest + `npm run build`，绿了再开游戏。
