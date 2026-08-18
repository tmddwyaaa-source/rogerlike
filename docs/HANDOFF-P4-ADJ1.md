# 交接 — P4 调整 1（升级图标）

> **主导**：M1  
> **日期**：2026-08-15  
> **本环唯一目标**：独立 **M 编号窗口** 为每个升级选项出图；你检查通过后再进游戏；未过审局内用空白方块。  
> **画风**：对齐原来的 12×12 小像素剪影（`docs/ICON-STYLE.md`），禁止 AI 插画风。  
> **禁止**：再用「ICON / F / 生图窗」等非 M 编号。窗口只能是 **M1 / M8 / M10**。

协作靠本文件 + Registry，窗口之间互不可见。子窗口 **禁止** 把 Registry 标成 `done`。完工说：`M{n} 已完成，请主导窗口查收。`

---

## 窗口分工

| 编号 | 职责 | 规定路径 | 本环状态 |
|------|------|----------|----------|
| **M1** | 规格、交接、查收、过审后的配置冲突合并 | `docs/**` | 本文件已写；等 M8/M10 请查收 |
| **M8** | 局内：无过审 PNG → **空白方块**；有则显示 `upgrades/{id}.png` | `frontend/src/ui/**`、`frontend/src/views/**` | `done`（2026-08-15 查收 pass） |
| **M10** | 一次出一个升级图标；你说「采用」后才拷进游戏 | 待审 `assets/icon-review/`；过审拷 `frontend/public/assets/upgrades/` 与 `assets/source/upgrades/` | `done`（2026-08-15 用户手绘 11 张，两边 SHA 一致） |

环内一律：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

依赖：M10 **不改** UI 代码。M8 **不** GenerateImage。M1 **不**代替 M8/M10 做模块实现（查收除外）。

---

## 成功标准

1. 升级三选一卡片：没有 `frontend/public/assets/upgrades/{id}.png` 时是空白方块，不是程序字符画。
2. 过审 PNG 必须是 12×12 最近邻放大的小像素剪影（48×48），色板与 `ICON_MAPS` 一致；不是高清插画。
3. 你在 **M10** 检查并说「采用」后，该 id 的 PNG 同时出现在运行时目录和 `assets/source/upgrades/`，刷新可见。
4. M10 一轮只出一张图。已有 `ICON_MAPS` 的 id 只栅格化，不 GenerateImage。
5. M8 / M10 各自 `请查收` 后，M1 磁盘核对才可标 done。

---

## 磁盘现状（M1 查收 2026-08-15）

- `PixelIcon.vue`：加载 `/assets/upgrades/{id}.png`，失败则空白方块，不回退字符画
- 11 个 `UPGRADES` id 均有运行时 + source PNG，SHA256 两边一致
- 用户手绘过审（AI 生图已弃）；`survive` 无 `.map.txt`，不影响落盘

---

## 开窗顺序（用户执行）

```text
① M1 已写完交接，不要在 M1 生图、不要在 M1 再改 PixelIcon
② 开 M8：粘贴「M8 开工」→ 斥候→主力→搜剿 →「M8 已完成，请主导窗口查收」
③ 开 M10：粘贴「M10 开工」→ 一次一图，等你采用后再拷贝（可与 M8 并行）
④ 你回 M1 转述请查收；M1 只验收
```

M8 与 M10 可并行：M10 只碰素材目录；M8 只碰 `ui/` `views/`。若 M8 打回加载逻辑，已过审 PNG 仍保留。

---

## 路径与文件名

| 用途 | 路径 |
|------|------|
| id 清单 | `frontend/src/ui/constants.js` → `UPGRADES[].id` |
| 画风锁 | `docs/ICON-STYLE.md` |
| 待审 | `assets/icon-review/{id}.png` |
| 无 map 时手绘格子 | `assets/icon-review/{id}.map.txt` |
| 过审运行时 | `frontend/public/assets/upgrades/{id}.png` |
| 过审备份 | `assets/source/upgrades/{id}.png` |

---

## M8 开工粘贴块（整段复制到新窗口）

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

---

## M10 开工粘贴块（整段复制到新窗口）

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

---

## M10 画风改口（已开着的 M10 整段粘贴）

上一轮 GenerateImage 太细、太 AI，作废。对齐原来的 12×12 小像素画。

```text
@multi-window_M @game-upgrade-icons @game-developer
我是 M10。请重新读 docs/ICON-STYLE.md 和 docs/HANDOFF-P4-ADJ1.md。
画风改口：对齐 frontend/src/ui/icons.js 的 ICON_MAPS。
已有 map 的 id 禁止 GenerateImage，用技能脚本栅格化到 assets/icon-review/{id}.png。
不要皮面光影、翅膀、速度线、水印。
从 move_speed 重做一张（栅格化那只靴子），停下等我检查。
不要标 Registry done。
```

---

## 回 M1 查收话术（用户转述）

```text
@multi-window_M @game-developer
我是 M1。当前角色：搜剿（只验收，禁止顺手改子模块实现来修完）。
用户汇报：M{8 或 10} 已完成，请查收。
读 docs/HANDOFF-P4-ADJ1.md + 磁盘 + 验收命令；pass 则更新 MODULE-REGISTRY 与 RECEIPT-LOG。
```

---

## 本环不做（已另派，见 FIX-PLAN-P4 / WINDOW-ASSIGNMENTS）

- 测试 1 朝向 → **M4**
- 测试 1 上报 fetch → 先环境 8080/MySQL，再 **M8** api
- 调整 2 蓄力伤害 → **M5**
- 黑洞入池 → **M8** 下一环（本环只做图标占位）
