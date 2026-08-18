# 交接 — P9（跟班分散 / 粘键 / 史莱姆数值 / 自然升级停顿 / 裂怪错开 / 兔子 / 高级红点）

> **主导**：M1  
> **日期**：2026-08-17  
> **本环窗口**：M4、M6、M7、M8、M11、M10；接线 **M1**。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

素材已由 M1 拷入（public + source）：

| 源 | 用途 | 落盘 |
|----|------|------|
| `Roger-png/跟班/地精.png` | 地精立绘 | `跟班/地精.png` |
| `Roger-png/跟班/兔子.png` | 兔子立绘 | `跟班/兔子.png` |
| `Roger-png/跟班选项/地精.png` | 地精升级图标 | `upgrades/goblin.png` |
| `Roger-png/跟班选项/兔子.png` | 兔子升级图标 | `upgrades/rabbit.png` |

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M11** | 多跟班不重叠；兔子实体 | `frontend/src/game/companions/**` |
| **M4** | 松开方向键仍走路（粘键） | `frontend/src/game/player/**`、`frontend/src/game/render/**` |
| **M6** | 史莱姆数值；x-3 掉 0～1；裂怪错开生成 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` |
| **M7** | 升级停顿时结晶可飞、不拾取 | `frontend/src/game/world/**`、`frontend/src/game/pickups/**` |
| **M8** | 兔子入普通池；高级图标左上 3px 红点 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M10** | 升级 +1 素材（等用户改完采用） | `assets/icon-review/**`；采用后 `fx/levelup.png` |
| **M1** | 规格、拷素材、查收；`match.js` 自然升级停顿 + clearKeys | `docs/**`、`match.js` |

---

## 1. 多跟班不要叠在一起（M11）

现状：每次 `addGoblin` 都在角色左侧同一点，又追同一敌人，完全重叠。

新：

- 生成时按已有跟班数量绕角色均匀分布（例如距离 `FOLLOW_DIST`，角度 `2π×i/n`）。已有跟班也要重新摊开，不要只偏新生的那只。
- 追敌时每只要有独立落点（绕目标的槽位，间距约 1 绘制宽），不要都走到目标中心。
- 无敌人跟随时同样绕角色停，不要叠成一只。
- 地精攻击规则不变（碰撞、0.4s、彼此重叠才打 2）。

---

## 2. 粘键（M4）

长时间按住 WASD 再松开，角色仍朝该方向走。

- 用 `e.code`（`KeyW/A/S/D`）判定，不要只靠 `e.key`（输入法会丢 keyup）。
- `blur` / `visibilitychange`（页面隐藏）时把 WASD 全清。
- 导出 `clearMovementKeys()`（或同等）。升级/暂停时由 M1 调用。
- 更新 selftest。

---

## 3–4. 史莱姆与裂怪（M6）

`u = max(0, 秒−300)`。

史莱姆x-1：

| 项 | 新值 |
|----|------|
| 生命 | **80 + 10×floor(u/45)** |
| 移速初值 | **1.00** |
| 移速成长 | 每 45 秒 **+0.05**（无 1.4 帽） |
| 每波初值 | **5**（`5 + floor(u/45)`） |

史莱姆x-3 掉落：**0 或 1** 结晶（各 50%，用模块 `random()`）。不要固定 1。

裂怪：灰树爆出的 3 只**不要同坐标**。绕爆点隔开（建议半径 ≥ 1 绘制宽，夹角 120°）。更新 selftest。

---

## 5. 自然升级也要停顿；结晶飞但不吃经验（M7 + M1）

现状：测试「提高等级」能看到 +1 再出三选一。自然捡结晶经常像瞬间升级，因为 `levelup` 时 `updatePickups` 仍会**拾取**。

新：

- 自然升级与测试提高一样：先 `levelup` 播 +1，忙完再 `beginUpgradeOffer`。
- `levelup` / `upgrade` 期间：**结晶仍可飞向角色，但不要拾取、不要给经验、不要删掉**。水果同样不拾取。
- M7：`updatePickups(dt, player, { collect: false })`（或同等）。`collect:false` 时只飞、不 splice、不调 onCrystal/onFruit。
- M1 查收后改 `match.js`：该阶段传 `collect:false`；`addExp` 在 `levelup`/`upgrade` 时不要再涨经验。
- +1 **贴图**本环交给 **M10**，M4/M7 不要改 `fx/levelup.png`。

---

## 6. 高级选项红点（M8）

`tier === 'advanced'` 的升级图标（三选一 + 回忆）左上角加 **3×3 逻辑像素**红点（随 PixelIcon scale 放大）。普通项不要红点。兔子是普通项。

建议 `PixelIcon` 加 `advanced` prop，或按 id 查 `UPGRADES[].tier`。

---

## 7. 兔子（M8 文案 + M11 实体）

| 项 | 值 |
|----|-----|
| id | `rabbit` |
| 名称 | **兔子** |
| 池 | **普通**（无 tier advanced） |
| 效果 | 生成 1 个兔子跟班（可叠） |
| 图标 | `/assets/upgrades/rabbit.png`（已拷） |
| 立绘 | `/assets/跟班/兔子.png`（已拷） |
| 间隔 | 0.4s |
| 伤害 | **20**（固定；仍吃地精的全跟班 +10） |
| 目标 | 碰撞重叠才打；**最多 1** 个 |
| 其它 | 同跟班：无血、无击退、移速快照、追离角色最近的敌人 |

M8：`applyUpgrade('rabbit')` → `companions.addRabbit()`；没有函数留 `pendingRabbit`。不要在兔子升级里 +10。  
M11：`addRabbit`；兔子用自己的 sheet。

---

## 成功标准

### M11

- [ ] 2 只地精生成后中心距离 ≥ 约 1 绘制宽；追同一敌人也不完全重叠
- [ ] `addRabbit`；0.4s；伤 20+bonus；最多 1 目标；碰撞才打
- [ ] selftest 全绿。不改 ui / enemies / match.js

### M4

- [ ] code 键位 + blur 清键；导出 clearMovementKeys
- [ ] selftest。不改 match.js

### M6

- [ ] x-1 血 80、速 1.00、+0.05/45s、每波 5 起
- [ ] x-3 掉落 0 或 1；裂怪 3 只坐标互不相同
- [ ] selftest。不改 ui / companions

### M7

- [ ] `collect:false` 只飞不拾取；默认行为不变
- [ ] selftest。不改 match.js

### M8

- [ ] `UPGRADES` 含兔子（普通池）；地精仍高级
- [ ] 高级图标左上 3×3 红点；兔子无红点
- [ ] applyUpgrade 调 addRabbit；addExp 在 levelup/upgrade 不加经验
- [ ] selftest。不改 companions / match.js

### M10

- [ ] 等用户改 +1 图并说采用；采用后拷 `fx/levelup.png` 两边。不要擅自 GenerateImage

---

## 开工粘贴块

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

## M1 查收后接线（子窗口不要做）

1. `match.js`：`levelup`/`upgrade` 时 `updatePickups(..., { collect: false })`；调用 `player.clearMovementKeys()`。
2. `addExp` 在 levelup/upgrade 不再加经验（若 M8 没做则 M1 补 session 这一处）。
3. 跑相关 selftest + `npm run build`，绿了再开游戏。
