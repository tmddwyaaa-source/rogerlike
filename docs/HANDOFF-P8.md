# 交接 — P8（地精碰撞 / 跟班+10 / 回忆×1排版 / 史莱姆）

> **主导**：M1  
> **日期**：2026-08-17  
> **禁止**：非 M 编号窗口。本环窗口：**M8、M11、M6**；接线 **M1**。  
> 子窗口禁止标 Registry `done`。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

素材已由 M1 拷入（public + source 两边都有）：

| 文件 | 桌面源 | 用途 |
|------|--------|------|
| `小怪/史莱姆x-1.png` | `Roger-png/小怪/史莱姆x-1.png`（32×32，2694） | 史莱姆x-1 |
| `小怪/史莱姆x-3.png` | `Roger-png/小怪/史莱姆x-3.png`（32×32，827） | 史莱姆x-3 |

**本环不开 M10**（地精升级图标继续空白方块）。

怪物目录：根目录 `怪物属性表.md`。新增稿 `新增怪物属性——更新.md` 已合并进属性表。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M8** | ①地精文案 +10 ②applyUpgrade 调跟班加伤 ③回忆图标间距 + 一律 ×n | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M11** | 地精改为碰撞伤害；跟班伤害加成 +10/次 | **只改** `frontend/src/game/companions/**` |
| **M6** | 史莱姆x-1 / 史莱姆x-3 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` |
| **M1** | 规格、拷素材、属性表、查收 | `docs/**`、根目录表；`match.js` 仅当钩子对不上时补 |

M8 不改 match.js / companions / enemies。M11 不改 ui / enemies / match.js。M6 不改 ui / companions。

---

## 1. 地精：碰撞伤害 + 全跟班 +10（M11 实体，M8 文案）

现状：每 0.4s 打跟班最近最多 2 个，不看重叠。

新：

| 项 | 规格 |
|----|------|
| 伤害公式 | `ceil(15 + 角色攻击 × 0.6) + companionBonus`。攻击 20、加成 0 → **27**；加成 10 → **37** |
| 结算间隔 | 仍 **0.4s**（重叠期间按间隔打，不要每帧持续打） |
| 命中条件 | 地精**绘制矩形**与敌人**绘制矩形** AABB 重叠才造成伤害（中心 `x,y`，宽高 `w,h`） |
| 1 个目标 | 只与地精重叠、且不与其他重叠敌人成对 → 只打这 1 个 |
| 2 个目标 | 地精同时重叠 ≥2 个敌人，**且这 2 个敌人彼此也重叠**，才打这 2 个。最多 2 |
| 两个都重叠地精但不彼此重叠 | 只打离地精更近的那 1 个 |
| 击退 | 仍无 |
| 索敌移动 | 不变：走向离**角色**最近的活敌人；没敌人则跟角色 |

`companionBonus`：每次选择地精升级 **+10**，作用于**所有**已有和新生跟班。可叠（选 2 次 = 两只地精 + 加成 20）。

M11 导出例如 `addDamageBonus(n)` 或 `addCompanionDamage(n)`；`addGoblin` 不要自己 +10（加伤由升级调用，避免双算）。

M8：

- 文案改为含「所有跟班伤害 +10」（建议：`生成 1 个地精跟班，所有跟班伤害 +10`）
- `applyUpgrade('goblin')`：先 `addGoblin()`，再 `addDamageBonus(10)`（或同等）。缺函数时分别留 `pendingGoblin` / `pendingCompanionDamage`
- 图标仍空白方块

---

## 2. 回忆图标排版（M8）

- 每个升级图标**右侧固定留出能写下 `×000` 的槽**（约 4 个等宽字符），图标与下一图标用这个槽隔开。
- 选择次数为 **1 也显示 `×1`**。`MoreView` 不要再 `v-if="u.count > 1"`。
- 仍不要序号、中文名、效果文案。

---

## 3. 史莱姆（M6）

id：**`slime_x1`** / **`slime_x3`**。中文名 = 文件名。成长从出场秒起算。移速不套 1.4 帽。刷怪环同现有（视野外、距主角 ≤1000）。测试 `spawnRate` 仍只乘每波数量。

`u = max(0, 秒 − 300)`。

### 史莱姆x-1（`slime_x1`）

| 项 | 值 |
|----|-----|
| 贴图 | `/assets/小怪/史莱姆x-1.png`（32×32 单帧） |
| 出场 | 存活 **≥300 秒**；解锁瞬间先刷 1 波（同蜗牛怪） |
| 成长起点 | 出场后 |
| 生命 | **40 + 10×floor(u/45)**（生成时结算，记到实体上作 `spawnHp`/`maxHp`） |
| 接触 | −1 心；可击退；减免 0 |
| 刷怪 | 每 **15 秒** 一波；每波 **1 + floor(u/45)** |
| 移速 | **0.8 + 0.03×floor(u/45)** 设计单位（无 1.4 帽） |
| 掉落 | **2** 结晶 |
| 死亡 | 原地立刻生成 **2** 只史莱姆x-3 |

### 史莱姆x-3（`slime_x3`）

| 项 | 值 |
|----|-----|
| 贴图 | `/assets/小怪/史莱姆x-3.png`（32×32 单帧） |
| 出场 | 不独立刷；仅 x-1 死亡时原地 ×2 |
| 生命 | `ceil(该 x-1 生成时血量 × 0.25)`（用 spawnHp，**不是**死时剩余血） |
| 移速 | 该 x-1 **死亡当时**移速（设计单位）**+ 0.10**，快照，不再随时间长 |
| 接触 / 击退 | 同 x-1 |
| 掉落 | **1** 结晶 |

要追玩家、进 `targets`。`killCreep` 现在一律 1 结晶，按 kind 分支。死亡分裂不要误伤同一帧刚刷出的 x-3。

---

## 成功标准

### M8

- [ ] 地精 desc 含跟班伤害 +10；`applyUpgrade` 调 addGoblin **和** 加伤
- [ ] 回忆：`×1` 也显示；图标间距能放下 `×000`
- [ ] selftest 覆盖文案、加伤钩子、回忆 ×1。不要改 match.js / companions / enemies

### M11

- [ ] 不重叠不打；重叠才打；彼此重叠才 2 目标；否则最多 1
- [ ] 仍 0.4s；伤害 = ceil(15+0.6×atk)+bonus；`addDamageBonus(10)` 后全跟班变
- [ ] `node src/game/companions/selftest.mjs` 全绿。不要改 ui / enemies / match.js

### M6

- [ ] ≥300s 才出 x-1；15s 波；血/速/波数公式如上
- [ ] x-1 死 → 2 只 x-3 + 2 结晶；x-3 血/速/1 结晶如上
- [ ] selftest 覆盖公式与分裂。不要改 ui / companions / match.js

---

## 开工粘贴块

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

## M1 查收后接线（子窗口不要做）

1. 跟班已在 `match.js`；本环多半不用改。若 M8 新钩子要 bind，再补。
2. 跑 ui / companions / enemies / match selftest + `npm run build`，绿了再开游戏。
