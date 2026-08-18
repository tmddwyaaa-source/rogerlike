# 模块注册表（Module Registry）

> **主导窗口（M1）**维护。状态：`pending` | `in_progress` | `review` | `done` | `blocked`  
> 规格真相源：`docs/GAME-SPEC.md` · 素材：`docs/ASSETS.md`  
> 环内：斥候 → 主力 → 搜剿；同一卡点最多 4 次；**仅 M1 可标 done**

## 总览

| 编号 | 模块名 | 负责窗口 | 状态 | 依赖 |
|------|--------|----------|------|------|
| M1 | 主导 / 规格 / 查收 / 集成协调 | **本窗口** | in_progress | — |
| M3 | 工程骨架与主循环 | 窗口 3 | done | M1 |
| M4 | 玩家与生命/无敌 | 窗口 4 | done | M3 |
| M5 | 武器 / 蓄力箭 / 击退施加 | 窗口 5 | done | M3, M4 |
| M6 | 蘑菇怪 / 蜗牛怪 / 灰树 / 刷怪 | 窗口 6 | done | M3, M5 |
| M7 | 普通树 / 掉落 / 草地环境 | 窗口 7 | done | M3, ASSETS |
| M8 | UI / 升级 / 结算 + Spring Boot 统计 | 窗口 8 | done | M3–M7 |
| M9 | 集成磨合（M1 执行） | **本窗口** | done | M3–M8 review |
| M10 | 升级选项生图（用户过审后入游戏） | 窗口 10 | in_progress | M1 规格、M8 占位 |
| M11 | 跟班 | 窗口 11 | done | M1 规格、M8 文案 |

**建议开工顺序**：M3 →（M4 ∥ M7 可并行）→ M5 → M6 → M8 → M1 查收集成。

**长线规则**：每环唯一目标 + 成功标准 + 证据 + 存档点；同卡点 4 次硬停写 `docs/BLOCKERS/`。

---

## M1 — 主导 / 架构协调

**路径**：`docs/**`；集成期可改配置与冲突合并（见多窗口条令）

**交付物**：
- [x] `docs/GAME-SPEC.md`
- [x] `docs/ASSETS.md`
- [x] `docs/MODULE-REGISTRY.md`
- [x] `docs/RECEIPT-LOG.md`
- [x] `docs/FIX-PLAN.md`
- [x] 素材拷贝至 `assets/source/`
- [x] 各 Mn 查收与状态更新
- [x] 最终集成 M9

**验收**：子窗口汇报后磁盘核对 + 命令证据，禁止口头 done。

**状态**：`in_progress`

---

## M3 — 工程骨架与主循环

**路径**：
- `frontend/`（Vue 3 + Vite 脚手架）
- `frontend/src/game/`（引擎入口、主循环、相机、世界常量）
- `frontend/public/assets/`（运行时素材，从 `assets/source` 同步）

**交付物**：
- [x] Vue + Vite 可 `npm run dev` / `npm run build`
- [x] Canvas 挂载；逻辑世界 7000×7000；整数倍像素缩放
- [x] 相机跟随占位实体（`setFollowTarget` 供 M4）
- [x] 导出共享常量：`BODY=14`、地图尺寸、视野辅助
- [ ] `frontend/public/assets/` 素材同步（非阻断；由 M6/M7 挂图时补齐）

**验收**：浏览器可见清屏+相机跟随占位；无玩法也可。

**环内角色**：斥候 → 主力 → 搜剿；同一卡点最多 4 次

**开工话术**：`我是 M3 窗口，请读 D:\Cursor_projectt\rogerlike\docs\MODULE-REGISTRY.md 中 M3 章节与 GAME-SPEC。按斥候→主力→搜剿执行；同一卡点最多 4 次。只改规定路径。`

**状态**：`done`（2026-08-13 M1 查收 pass）

---

## M4 — 玩家

**路径**：
- `frontend/src/game/player/**`
- `frontend/src/game/render/stickman.*`（无贴图兜底）
- `frontend/src/game/render/ranger.js`（P3 游侠）

**交付物**：
- [x] 火柴人 ≤14×7（`stickman.js` 7×14）；WASD + 对角归一
- [x] P3：游侠贴图 D/S/U + 脚下 Shadow；`CHAR_NAME=游侠`
- [x] 3 心；`takeDamage` −1；无敌 + 像素飞散
- [x] `lookAt` / 鼠标面向（开火归 M5）
- [x] `createPlayer` / `attachPlayer`；`selftest.mjs` 全绿
- [x] 未改 `engine.js`（tick/draw 挂接留 M9）
- [x] P5：升级时角色周围「+1」（`docs/HANDOFF-P5.md`）
- [x] P6：导出 `hasLevelUpFx` / busy，供先 +1 再出选项（`docs/HANDOFF-P6.md`）
- [x] P9：粘键；`clearMovementKeys`（`docs/HANDOFF-P9.md`）

**验收**：可移动；受击接口可被调用并触发无敌。

**开工话术**：粘贴 `docs/HANDOFF-P9.md` 中 M4 块。

**状态**：`done`（2026-08-17 P9 粘键查收 pass）

---

## M5 — 武器与击退（P3：蓄力箭）

**路径**：
- `frontend/src/game/combat/**`
- `frontend/src/game/weapons/**`

**交付物**：
- [x] 鼠标瞄准开火；伤害 15；弹匣 7；后坐力（`createCombat`）
- [x] 换弹 **3 秒** + 甩枪角（`getSwing`）
- [x] 命中可击退实体 1 身位；`knockbackable===false` 不位移；`hitWorld` 接树
- [x] 升级预留：`ammo_cap` +2、`reload` ×0.75（P2）
- [x] P3：无弹匣；蓄力 0.75s 松开射击；伤 20→40；击退 1→2 BODY；满蓄穿透；双发 ±15°；蓄力 −0.20
- [x] `combat/selftest.mjs` 全绿；未改 engine/player/world

**验收**：可射击、换弹计时正确；对假目标造成伤害与击退。

- [x] P6：击退 `max(0, dist − knockbackResist)`（`docs/HANDOFF-P6.md`）
- [x] P11：力量 +8 → +10（`docs/HANDOFF-P11.md`）

**开工话术**：粘贴 `docs/HANDOFF-P11.md` 中 M5 块。

**状态**：`done`（2026-08-18 P11 力量 +10 查收 pass）

---

## M6 — 蘑菇怪 / 蜗牛怪 / 灰树

**路径**：
- `frontend/src/game/enemies/**`
- `frontend/src/game/spawner/**`

**交付物**：
- [x] 小怪：22 血；接触伤；`knockbackable`；4 帧切帧素材
- [x] 常规刷怪：P2.1 起 5s/4；视野外近距环
- [x] P3 移速：普通 0.75 / 裂怪 0.9 **设计单位**（不乘玩家移速）；成长 `min(1.4, base+0.06t)×80`
- [x] 灰树：25 血；P2.1 自损每 3s 掷 1～5；不可击退；可 `takeHit`；撞玩家 −1 并毁
- [x] 毁后 **1s** 原位刷 3 裂怪
- [x] 灰树 5s/2；难度一公式在 `spawner/`；`targets` 供 M5
- [x] `enemies/selftest.mjs` 全绿；未改 engine/combat/player/world

**验收**：对照 GAME-SPEC §5–§6 自测日志（刷怪间隔、自损、延迟刷怪）。

- [x] P6：蘑菇怪改名/成长；蜗牛怪 120s；刷怪倍率乘每波数量（`docs/HANDOFF-P6.md`）
- [x] P7：贴图按中文名匹配；裂怪用 `裂怪.png`（`docs/HANDOFF-P7.md`）
- [x] P8：史莱姆x-1 / x-3（`docs/HANDOFF-P8.md`）
- [x] P9：史莱姆数值；x-3 掉 0～1；裂怪错开（`docs/HANDOFF-P9.md`）
- [x] P11：刷怪+1；血+5；血成长+2；移速成长+0.02；x-3 无敌 0.3s（`docs/HANDOFF-P11.md`）

**开工话术**：粘贴 `docs/HANDOFF-P11.md` 中 M6 块。

**状态**：`done`（2026-08-18 P11 怪物数值查收 pass）

---

## M7 — 普通树 / 掉落 / 草地

**路径**：
- `frontend/src/game/world/**`
- `frontend/src/game/pickups/**`
- `frontend/src/game/render/grass.*`

**交付物**：
- [x] 浅绿草地（色板对齐浅树）`render/grass.js`
- [x] 普通树；`hitAt` 仅子弹可毁；`collideSolid` 只阻挡
- [x] 毁：固定 3 结晶 + 50% 红水果；`hooks.onFruit`
- [x] 结晶 2 身位吸附；`spawnCrystal` 供 M6
- [x] 普通树刷取：10s/1 + 难度衰减；`public/assets` 已同步
- [x] 门面 `createEnvironment()`（未改 engine；待 M9 接线）

**验收**：打树掉落与吸附正确；撞树不毁。

- [x] P6：掉落速度 135；树结晶上限按分钟 +2；黑洞飞行吸入；磁铁范围 ×1.5（`docs/HANDOFF-P6.md`）
- [x] P9：升级停顿时结晶只飞不拾取（`docs/HANDOFF-P9.md`）

**开工话术**：粘贴 `docs/HANDOFF-P9.md` 中 M7 块。

**状态**：`done`（2026-08-17 P9 结晶 collect 开关查收 pass）

---

## M8 — UI / 升级 / Spring Boot 统计

**路径**：
- `frontend/src/ui/**`
- `frontend/src/views/**`
- `backend/`（Spring Boot 3.0.4 / Java 17）

**交付物**：
- [x] 开始屏：标题「类幸存者」+ 难度一（`StartView`）
- [x] HUD / 升级三选一 + 像素图标（P3：移速 / 双发 / 蓄力）
- [x] P3：齿轮+ESC 暂停设置；回主页确认；无选武器；经验 15/+4
- [x] 结算 + `api.js` 上报；`GameShell` 门面
- [x] 后端 Spring Boot：`/api/matches/*` + `schema.sql`
- [x] `ui/selftest.mjs` 全绿；`mvn -DskipTests compile` 通过
- [x] P4 调整 1：无过审 PNG 时空白方块；有 `upgrades/{id}.png` 则显示
- [x] P4 黑洞入池（吸结晶接线仍留给 M7 / M1）
- [x] P5：无等级上限；测试提高 0～3；BGM；选角朝右立绘（`docs/HANDOFF-P5.md`）

**验收**：`mvn compile`；前端可开局选难度；结束有入库/接口成功证据。

- [x] P6：磁铁入池；先 +1 再三选一；刷怪速度文案（`docs/HANDOFF-P6.md`）
- [x] P7：回忆图标；高级池 30%；地精文案（`docs/HANDOFF-P7.md`）
- [x] P8：地精文案 +10；回忆 ×1 与 ×000 间距（`docs/HANDOFF-P8.md`）
- [x] P9：兔子入池；高级红点；levelup 不加经验（`docs/HANDOFF-P9.md`）
- [x] P11：回忆悬停；力量文案 +10；每 5 级成长（`docs/HANDOFF-P11.md`）

**开工话术**：粘贴 `docs/HANDOFF-P11.md` 中 M8 块。

**状态**：`done`（2026-08-18 P11 回忆悬停 / 等级成长查收 pass）

---

## M9 — 集成（M1）

**路径**：`frontend/src/App.vue`、`frontend/src/game/engine.js`、`frontend/src/game/match.js`；`GameShell.vue` 画布常挂（集成合并）

**交付物**：
- [x] `createMatchRuntime` 串联 player/env/enemies/combat/ui
- [x] `engine.setHooks({ update, drawWorld })`
- [x] 开始→游玩→升级暂停→死亡结算上报链路
- [x] `match.selftest.mjs` + 全量模块自测 + `npm run build`
- [x] P3：暂停冻结 `update`；开局 `await player.loadAssets()`；HUD 蓄力
- [x] P5：`match.js` 去掉开局 setLevel；结晶升级与暂停时步进 `queueLevelUpFx`

- [x] P6：活设置倍率；黑洞改飞行吸入；`levelup` 播完再出选项
- [x] P7：`match.js` 挂跟班（createCompanions / update / draw / bind）
- [x] P8：查收确认钩子（companions 已 bind，`addDamageBonus` 经 applyUpgrade）
- [x] P9：自然升级 collect:false + clearKeys

**状态**：`done`（2026-08-17 P9 接线 pass）

---

## M10 — 升级选项生图

**路径**：
- `assets/icon-review/**`（待审）
- 用户采用后：`frontend/public/assets/upgrades/{id}.png` 或 `frontend/public/assets/fx/levelup.png`
- 用户采用后：`assets/source/upgrades/` 或 `assets/source/fx/`

**禁止路径**：`frontend/src/**`、`backend/**`、擅自改 Registry 为 done

**交付物**：
- [x] P4：11 个升级 id 用户手绘过审
- [ ] P5：升级「+1」图 — **用户放弃**，局内用程序「+1」
- [x] P6：磁铁 `magnet` — **等用户手绘**，本环未拷 PNG，局内空白方块
- [x] P7：地精 `goblin` — 桌面 `跟班选项/地精.png` 已由 M1 拷入
- [ ] P9：升级「+1」图 — **等用户改完采用**（`docs/HANDOFF-P9.md`）

**验收**：过审文件两边都有。

**开工话术**：粘贴 `docs/HANDOFF-P9.md` 中 M10 块。

**状态**：`in_progress`（P9 等用户改 +1 图）

---

## M11 — 跟班

**路径**：
- `frontend/src/game/companions/**`

**禁止路径**：`ui/**`、`enemies/**`、`match.js`、擅自改 Registry 为 done

**交付物**：
- [x] P7：跟班门面 + 地精（无血、无击退、0.4s、ceil(15+0.6×攻击)、最近 2 目标）（`docs/HANDOFF-P7.md`）
- [x] P8：碰撞伤害 + companionBonus（`docs/HANDOFF-P8.md`）
- [x] P9：多跟班槽位 + 兔子（`docs/HANDOFF-P9.md`）
- [x] P10：兔子追离自己最近的敌人（`docs/HANDOFF-P10.md`）
- [x] P11：独立索敌 + 兔子切入重叠（`docs/HANDOFF-P11.md`）

**验收**：`node src/game/companions/selftest.mjs` 全绿。

**开工话术**：粘贴 `docs/HANDOFF-P11.md` 中 M11 块。

**状态**：`done`（2026-08-18 P11 独立索敌查收 pass）

