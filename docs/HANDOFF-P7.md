# 交接 — P7（回忆图标 / 跟班 / 高级升级 / 地精 / 怪物贴图）

> **主导**：M1  
> **日期**：2026-08-16  
> **禁止**：非 M 编号窗口。本环窗口：**M8、M11、M6、M10**；接线 **M1**。  
> 子窗口禁止标 Registry `done`。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

素材已由 M1 拷入（两边都有）。**2026-08-16 晚改口**：桌面重出图后已再覆盖一次。

| 文件 | 桌面源 | 用途 |
|------|--------|------|
| `小怪/蘑菇怪.png` | `Roger-png/小怪/蘑菇怪.png` | 蘑菇怪 |
| `小怪/蜗牛怪.png` | `Roger-png/小怪/蜗牛怪.png` | 蜗牛怪 |
| `小怪/裂怪.png` | `Roger-png/小怪/裂怪.png` | 裂怪 |
| `跟班/地精.png` | `Roger-png/小怪/地精.png`（新图；`跟班/` 里是旧图，不用） | 地精跟班 |

**忽略**：`史莱姆x-1.png`、`史莱姆x-3.png`（未添加）。旧 octocat、桌面 `跟班/地精.png` 旧版不用。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M8** | ①回忆对局用图标+×n ②高级升级池：每第 5/10/15… 次三选一有 30% 出 1 个高级项 ③地精入升级池（文案/钩子） | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M11** | 跟班系统 + 地精实体（移动、攻击、无血、无击退） | **只改** `frontend/src/game/companions/**`（本环新建此目录） |
| **M6** | 怪物贴图按中文名匹配；裂怪用 `裂怪.png`，不要再画成蘑菇怪 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` |
| **M10** | 地精图标；**等用户**，不要 GenerateImage | `assets/icon-review/**` |
| **M1** | 规格、拷素材、怪物属性表、查收；`match.js` 挂跟班 update/draw | `docs/**`、根目录表、`match.js`（等请查收后再接） |

M8 不改 match.js / companions。M11 不改 ui / enemies / match.js。M6 不改 ui / companions。M10 不改 `frontend/src`。

---

## 1. 回忆：用图标，不要数字+文案（M8）

现状：对局详情 `1. 敏捷　移速 +0.20` 这种列表。

新：

- 按**本局第一次选到的顺序**从左到右排图标（`PixelIcon`，缺图空白方块）。
- 同一 id 选了 n 次：图标旁写 **×n**。n=1 只显示图标，不要 ×1。
- **不要**显示序号、中文名、效果描述。
- 建议从 `picked` 数组汇总，不要改历史记录结构（旧回忆仍有 `id` 就能画）。
- 自测：连选两次敏捷 → 从左到右一枚敏捷图标 + `×2`。

---

## 2. 跟班系统（M11）+ 独立属性

游戏新增独立体系 **跟班**（不是武器、不是玩家生命）。

| 项 | 规格 |
|----|------|
| 血量 | **无**。不能受伤、不能死、不要进 `combat.targets` |
| 索敌移动 | 走向 **离角色最近** 的活着的敌人（蘑菇怪/蜗牛怪/裂怪/灰树都算）。没有敌人则跟在角色附近 |
| 移速 | **选该跟班升级当下** 角色的 `player.speed`（px/s）快照。以后角色再加速，**已有**跟班不变 |
| 击退 | **无**。跟班打中敌人不要调用击退 |
| 碰撞 | 不挡玩家、不挡敌人；不要当墙 |
| 暂停 | `playing` 以外跟敌人一样停 |

导出例如 `createCompanions({ player, getTargets, getAttack })`：

- `addGoblin()`（或 `spawn('goblin')`）
- `update(dt)` / `draw(ctx)`
- 列表给 M1 挂到 match

伤害读取 `getAttack()` = 角色当前攻击属性（`player.attack` 或武器 `attack`，**不是**蓄力满伤）。

---

## 3. 高级升级出现规则（M8）

普通池 = 现在的 12 项（含磁铁）。  
高级池 = 带 `tier: 'advanced'` 的项（本环只有地精）。

| 项 | 规格 |
|----|------|
| 何时可能出 | 本局第 **5、10、15…** 次打开三选一（`picked.length + 1` 能被 5 整除） |
| 概率 | **30%** 把 **1** 个格子换成随机高级项；另外 2 个仍从普通池抽 |
| 其他次数 | 高级项 **绝不**出现 |
| 30% 没中 | 3 个都普通 |
| 高级池空 | 当普通处理 |
| 测试提高 3 级 | 按三次三选一分别判定（第 5 次那一张才掷 30%） |

`UPGRADES` 里高级项加 `tier: 'advanced'`。`availableUpgrades` / `pickUpgradeChoices` 要分开两池。自测用固定 rng 覆盖：第 5 次 + rng<0.3 → 含地精；第 4 次不含。

---

## 4. 高级升级「地精」（M8 文案 + M11 实体）

| 项 | 值 |
|----|-----|
| id | `goblin` |
| 名称 | **地精** |
| tier | `advanced` |
| 类型 | 跟班 |
| 效果 | 生成 **1** 个地精跟班（可叠，每选一次再出一个） |
| 贴图 | `/assets/跟班/地精.png`（32×32 单帧，深色底透明，同小怪） |
| 攻击间隔 | **0.4** 秒 |
| 伤害 | `ceil(15 + 角色攻击 × 0.6)`。攻击 20 时 = ceil(15+12)=**27** |
| 攻击目标 | **跟班自己**附近最近的 **最多 2** 个活着敌人（同时结算，不是射程半径） |
| 图标 | 未过审 → 空白方块 |

M8：`applyUpgrade('goblin')` 调 `ctx.companions.addGoblin()`（或 `player`/`env` 上同等钩子）。没有函数时留 `pendingGoblin` 字段，不要改 match.js。  
M11：实现实体与 `addGoblin`；移速快照 `player.speed`。

---

## 5. 怪物立绘按文件名匹配（M6）

桌面 `Roger-png/小怪` 已更新。**中文名 = 文件名**：

| 怪物 | 贴图 |
|------|------|
| 蘑菇怪 | `/assets/小怪/蘑菇怪.png` |
| 蜗牛怪 | `/assets/小怪/蜗牛怪.png` |
| 裂怪 | `/assets/小怪/裂怪.png`（灰树爆出的 `speedKind==='split'`，禁止再用蘑菇怪图） |

单帧 32×32，深色底透明。裂怪 `name` 用「裂怪」。更新 selftest：裂怪 src 含 `裂怪.png`。

---

## 成功标准

### M8

- [ ] 回忆详情：图标左到右；同 id ×n（n≥2）；无「1. 名称 效果」
- [ ] 第 5 次三选一才可能出现 `tier:'advanced'`；30% 最多 1 个高级
- [ ] `UPGRADES` 含地精；无过审图走空白；`applyUpgrade` 调跟班钩子
- [ ] selftest 覆盖回忆汇总、第 4/5 次抽卡。不要改 match.js / companions / enemies

### M11

- [ ] 新建 `frontend/src/game/companions/`（index + constants + selftest）
- [ ] 地精：无血、无击退、移速=添加时 player.speed、间隔 0.4s、伤害 ceil(15+0.6×attack)、打最近 2 个
- [ ] 无敌人时跟角色；有敌人走向离**角色**最近的那个
- [ ] `node src/game/companions/selftest.mjs` 全绿。不要改 ui / enemies / match.js

### M6

- [ ] 裂怪贴图 `裂怪.png`；蘑菇/蜗牛仍用各自文件（已由 M1 覆盖新图）
- [ ] selftest 断言裂怪 src。不要改 ui / companions

### M10

- [ ] 不生图、不拷贝，直到用户交出 `goblin` 图并说采用（磁铁若仍未画也继续等）

---

## 开工粘贴块

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

## M1 查收后接线（子窗口不要做）

1. `match.js`：`createCompanions`，`playing` 时 update；draw 在敌人与玩家之间或玩家之下（跟班不要挡住角色太多即可）。
2. `shell.bind` / `applyUpgrade` 能拿到 `companions`。
3. 跑 selftest + `npm run build`，绿了再开游戏。
