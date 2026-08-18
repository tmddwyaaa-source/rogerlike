# 查收记录（RECEIPT-LOG）

> M1 查收专用。禁止仅凭口头「完成了」标 done。

## 2026-08-12 — M1 开工准备（规格与素材）

| 检查项 | 结果 |
|--------|------|
| `docs/GAME-SPEC.md` | ✅ |
| `docs/ASSETS.md` | ✅ |
| `docs/MODULE-REGISTRY.md` | ✅ |
| `docs/FIX-PLAN.md` | ✅ |
| 素材识别 `Roger-png` | ✅ 小怪 ×1、浅树、灰树 |
| 素材拷贝 `assets/source/` | ✅ |

**结论**：准备阶段完成；玩法模块均为 `pending`，待开 M3。  
**阻塞项**：无（「撞灰树是否一撞即毁」「移速基数 1 量纲」已在 SPEC 写默认，可后续改口）。

---

## 2026-08-13 查收 — M3

| 检查项 | 结果 |
|--------|------|
| 产出路径 `frontend/`、`src/game/` | ✅ `engine.js`、`constants.js`、`App.vue` |
| 编译/构建 `npm run build` | ✅ Vite 8.1.0 成功 |
| BODY=14 / 世界 7000² / 整数缩放 | ✅ `constants.js` + `integerScale` |
| 相机跟随占位 | ✅ `createEngine` + 红块占位 |
| `public/assets` 同步 | ⚠️ 未做（非阻断，挂图时由 M6/M7 补） |
| Registry 交付物 | ✅ 核心项齐 |

**结论**：`done`  
**阻塞项**：无  
**证据**：`WORLD_WIDTH/HEIGHT = BODY*500`；`setFollowTarget` 已导出；build 286ms 通过。

---

## 2026-08-13 查收 — M7

| 检查项 | 结果 |
|--------|------|
| 产出路径 world/pickups/grass | ✅ |
| `public/assets` 浅树/灰树/小怪 | ✅ 已同步 |
| API 冒烟：毁树 → 3 结晶 | ✅ `crystals:3`（random 可控时水果可出） |
| 吸附距离 `BODY*2=28` | ✅ |
| 仅子弹毁 / 碰撞不毁 | ✅ `hitAt` vs `collideSolid` 分离 |
| 未改 `engine.js`（边界正确） | ✅ 接线注释留给 M9 |
| `npm run build` | ✅（入口未引用 M7，属模块化交付） |

**结论**：`done`  
**阻塞项**：无（可见性依赖 M9 把 `createEnvironment` 挂进主循环）

---

## 2026-08-13 查收 — M4（fail）

| 检查项 | 结果 |
|--------|------|
| `frontend/src/game/player/**` | ❌ 目录不存在 |
| `stickman.*` | ❌ 不存在（render 仅有 grass.js） |
| WASD / 3 心 / 无敌飞散 | ❌ 无代码 |
| 受击 API | ❌ 无 |
| 自测证据 | ❌ 无 |

**结论**：`in_progress`（打回主力，循环计为查收失败，勿开 M5）  
**打回项**：见 MODULE-REGISTRY M4 节「M1 打回项」共 5 条。

---

## 2026-08-13 查收 — M4（复验）

| 检查项 | 结果 |
|--------|------|
| `player/index.js` + `render/stickman.js` | ✅ |
| `node src/game/player/selftest.mjs` | ✅ RESULT PASS（20 项） |
| 7×14 / WASD / 3 心 / 无敌飞散 / takeDamage | ✅ |
| `attachPlayer` → `setFollowTarget` | ✅ |
| 未大改 `engine.js` | ✅ |
| `npm run build` | ✅ |

**结论**：`done`  
**阻塞项**：无（与 M7 相同：App 未挂 `update`/`draw`，可见性待 M9）  
**备注**：上一轮 fail 打回项已全部消除。

---

## 2026-08-13 查收 — M5

| 检查项 | 结果 |
|--------|------|
| 路径 `combat/` + `weapons/` | ✅ |
| `node src/game/combat/selftest.mjs` | ✅ RESULT PASS（23 项） |
| 弹匣 7 / 伤 15 / 换弹 3s / 甩枪 | ✅ |
| 小怪击退 1 BODY；树不击退 | ✅ |
| `ammo_cap` / `reload` 升级 | ✅ |
| 边界未改 engine/player/world | ✅ |
| `npm run build` | ✅ |

**结论**：`done`  
**阻塞项**：无（挂主循环 / 接 M6 targets + M7 hitWorld 留 M9）

---

## 2026-08-13 查收 — M6

| 检查项 | 结果 |
|--------|------|
| 路径 `enemies/` + `spawner/` | ✅ |
| `node src/game/enemies/selftest.mjs` | ✅ RESULT PASS（41 项） |
| 小怪 22 / 接触伤 / 可击退 / 掉结晶 | ✅ |
| 灰树自损 4、撞毁 −1、+1s 刷 3 裂怪(基数1) | ✅ |
| 常规 3s/6、灰树 5s/2、难度公式 | ✅ |
| `targets` 兼容 M5 | ✅ |
| 边界未改 engine/combat/player/world | ✅ |
| `npm run build` | ✅ |

**结论**：`done`  
**阻塞项**：无  
**备注**：「移速基数 1」已定为 `1.0 × player.speed`（见 spawner 注释）。

---

## 2026-08-13 查收 — M8

| 检查项 | 结果 |
|--------|------|
| `ui/` + `views/` | ✅ 开始屏/HUD/升级/结算 |
| 标题「类幸存者」+ 三升级 | ✅ selftest |
| `node src/ui/selftest.mjs` | ✅ RESULT PASS |
| `backend/` `mvn -DskipTests compile` | ✅ |
| API `/api/matches/*` + schema | ✅ |
| 未改 M3–M7 玩法核 | ✅（查收时） |

**结论**：`done`  
**阻塞项**：无（实际上报需本机 MySQL `rogerlike` + 后端 8080）

---

## 2026-08-13 查收 — M9 集成

| 检查项 | 结果 |
|--------|------|
| `game/match.js` 装配 M4–M8 | ✅ |
| `engine.setHooks` 主循环 | ✅ |
| `App.vue` + `GameShell` 始终挂画布 | ✅ |
| `node src/game/match.selftest.mjs` | ✅ |
| `npm run build`（38 modules） | ✅ |
| 经验：结晶拾取计 EXP；击杀只计 kills | ✅ 防双计 |

**结论**：`done`  
**阻塞项**：浏览器实机手感 / MySQL 入库需本机起服务验证

---

## 2026-08-14 查收 — M6（P2.1）

| 检查项 | 结果 |
|--------|------|
| 小怪 5s×4 | ✅ `CREEP_INTERVAL0=5` `COUNT0=4`；selftest |
| 灰树 ≥30s 才刷 / 每波 2 | ✅ `GRAY_UNLOCK_SEC=30` |
| 自损每 3s 掷 1～5、每树独立 | ✅ `selfAcc` + `rollGraySelfDamage`；独立计时测过 |
| `enemies/selftest.mjs` | ✅ RESULT PASS |

**结论**：`done`

---

## 2026-08-14 查收 — M8（P2.1）

| 检查项 | 结果 |
|--------|------|
| 音量滑条实时 + 百分比数字 | ✅ `SettingsView` local `volume` + `formatVolumePct` |
| `clampVolume` / `setVolume` | ✅ `settings.js`；`ui/selftest` 含音量项 |
| `npm run build` | ✅ |

**结论**：`done`  
**备注**：尚无真实音频总线（设计表已记限制）。

---

## 2026-08-14 — 设计表

已写根目录：`D:\Cursor_projectt\rogerlike\游戏当前设计表.md`

---

## 2026-08-14 — P3 开工（M1 仅规格+素材，未改玩法）

| 检查项 | 结果 |
|--------|------|
| `docs/FIX-PLAN-P3.md` | ✅ |
| 游侠素材拷入 `public/assets/characters/` | ✅ `1/` + `Other/` |
| 玩法代码 | ⏸ 交给 M8/M6/M4，然后 M5 |

**结论**：准备完成，待子窗口交付  
**阻塞项**：无

---

## 2026-08-14 查收 — P3（M4 / M5 / M6 / M8）

对照 `docs/FIX-PLAN-P3.md`。磁盘核对 + 自测；M1 仅合并配置冲突与过期断言，未重写子模块玩法。

### M4 游侠外观

| 检查项 | 结果 |
|--------|------|
| `CHAR_NAME='游侠'`；`render/ranger.js` + Shadow | ✅ |
| 素材 `public/assets/characters/1/` + `Other/Shadow.png` | ✅ D/S/U Idle/Walk/Attack/Hurt/Death |
| `facingDir` / `charging` 给 M5 | ✅ |
| `node src/game/player/selftest.mjs` | ✅ RESULT PASS |

**结论**：`done`

### M5 蓄力箭

| 检查项 | 结果 |
|--------|------|
| 无弹匣/换弹；蓄力 0.75s；间隔 0.21s | ✅ |
| 伤害 20→40；击退 1→2 BODY；仅满蓄穿透（最多 2 目标） | ✅ |
| 双发 ±15°（不叠成 4）；蓄力 −0.20，≤0 无需蓄力 | ✅ |
| Arrow.png + Blood 击中 | ✅ |
| `node src/game/combat/selftest.mjs` | ✅ RESULT PASS |

**结论**：`done`

### M6 固定移速

| 检查项 | 结果 |
|--------|------|
| 普通 0.75 / 裂怪 0.9 设计单位；`× SPEED_PX_PER_UNIT` | ✅ |
| **不**乘 `player.speed`；成长 `min(1.4, base+0.06t)` | ✅ |
| `node src/game/enemies/selftest.mjs` | ✅ RESULT PASS |

**结论**：`done`

### M8 局内设置 / 经验 / 去选武器

| 检查项 | 结果 |
|--------|------|
| 齿轮右上 + ESC 暂停/恢复；回主页确认文案 | ✅ |
| 流程主页→选角→难度（无选武器） | ✅ |
| 经验 15 / +4；升级文案 双发 / 蓄力 −0.20 | ✅ |
| `chargeMax≤0` 从升级池去掉蓄力 | ✅ snapshot filter |
| `node src/ui/selftest.mjs` | ✅ RESULT PASS |

**结论**：`done`

### M1 接线与过期测试

| 检查项 | 结果 |
|--------|------|
| `match.js`：`phase !== 'playing'` 不 update（暂停冻结） | ✅ 已有 |
| HUD 蓄力字段 + `hud.choices` | ✅ |
| `CHAR_NAME` UI/玩家对齐为游侠 | ✅ |
| 开局 `await player.loadAssets()` | ✅ |
| `node src/game/match.selftest.mjs` | ✅ RESULT PASS（修正满蓄秒杀导致的残留计数） |
| `npm run build` | ✅ Vite 8.1.0 |

**结论**：P3 查收 **pass**；`游戏当前设计表.md` 已按代码回写。  
**阻塞项**：浏览器手感 / 本机 MySQL 入库仍需实机；音量仍无真实播音总线。

---

## 2026-08-15 — M1 规格（P4 调整 1 交接，非模块查收）

上一版曾用非 M 编号「ICON」当窗口名，已作废。调整 1 只认 **M8**（空白占位）与 **M10**（生图）。

| 检查项 | 结果 |
|--------|------|
| 交接全文 `docs/HANDOFF-P4-ADJ1.md` | ✅ 含 M8/M10 开工粘贴块 |
| Registry M8 `in_progress`、M10 `pending` | ✅ 未标 done |
| `WINDOW-ASSIGNMENTS.md` 去掉 ICON 行 | ✅ |
| 技能 `game-upgrade-icons` 身份改为 M10 | ✅ |

**结论**：规格/交接已重写。等用户开 M8、M10 并回报「请查收」后再验收实现。  
**阻塞项**：M8/M10 尚未请查收；局内尚无过审 PNG。

---

## 2026-08-15 — M1 规格（P4 调整 1 画风锁）

用户反馈 M10 GenerateImage 过细、过 AI，不如局内原 12×12 `ICON_MAPS`。

| 检查项 | 结果 |
|--------|------|
| `docs/ICON-STYLE.md` | ✅ 硬规格 + 禁止项 |
| M10 默认改为栅格化 `ICON_MAPS` | ✅ skill + HANDOFF 改口块 |
| 栅格化脚本 | ✅ `game-upgrade-icons/scripts/rasterize-icon.mjs` |

**结论**：画风已改口。已开的 M10 须粘贴 HANDOFF 里「画风改口」块，从 `move_speed` 重做（栅格化靴子）。  
**阻塞项**：仍等 M10 按新规格出待审图。

---

## 2026-08-15 查收 — P4（M4 / M5 / M8 / M10）

用户：图片已手绘完成；所有窗口已完成，请查实。

### M10 升级图标

| 检查项 | 结果 |
|--------|------|
| 11 个 `UPGRADES` id 运行时 PNG | ✅ `frontend/public/assets/upgrades/` |
| 同 11 张 `assets/source/upgrades/` | ✅ SHA256 与运行时一致 |
| 用户手绘过审（弃 AI 插画） | ✅ 含 `move_speed` / `reload` / `giant` / `eyes` |
| `ui/selftest.mjs` 11 项 display png | ✅ |

### M8 空白占位 + 黑洞入池

| 检查项 | 结果 |
|--------|------|
| `PixelIcon` 有 PNG 显示、失败空白、不 `paintIcon` | ✅ |
| `resolveUpgradeIcon` + selftest | ✅ RESULT PASS |
| 黑洞入池文案 | ✅ |
| 全图吸结晶 | ❌ 仅 `pendingBlackhole` 标记，`pickups` 无 `vacuumCrystals` |

### M4 朝向

| 检查项 | 结果 |
|--------|------|
| `facingFromAngle` S 向 `flipX: c > 0` | ✅ |
| `player/selftest.mjs` 右翻左不翻 | ✅ RESULT PASS |

### M5 攻击属性

| 检查项 | 结果 |
|--------|------|
| 未蓄 = attack；满蓄 = attack×2 | ✅ |
| 力量 +8、散射/开眼了 −3 改 attack | ✅ |
| `combat/selftest.mjs` | ✅ RESULT PASS |

### 集成自测

| 检查项 | 结果 |
|--------|------|
| `match.selftest.mjs` | ✅ RESULT PASS |
| `npm run build` | ✅ Vite 8.1.0 |

**结论**：指派窗口 **pass**。M8/M10/M4/M5 标 `done`。黑洞全图吸入未接线，不打回 M8（交接允许先留钩子）。  
**阻塞项**：选「黑洞」目前不会吸结晶，需 M7 实现 `vacuumCrystals` 后由 M1 接线。

---

## 2026-08-15 — M1 规格（P5，非模块查收）

用户改口 5 条。音乐已从桌面拷入运行时与 source（`游戏音乐/music.ogg`，2 903 446 字节）。

| 窗口 | 任务 |
|------|------|
| M8 | 无上限；测试提高 0～3；BGM；选角朝右立绘 |
| M4 | 角色旁 +1 |
| M10 | +1 图先讨论，可手绘 |
| M1 | 等请查收后再改 `match.js` |

交接：`docs/HANDOFF-P5.md`。未标实现 done。

---

## 2026-08-15 查收 — P5（M8 / M4；M10 放弃贴图）

用户：M8、M4 已完成；M10 图不满意先放弃；打开游戏看效果。

### M8

| 检查项 | 结果 |
|--------|------|
| 无 `LEVEL_MAX`；`expNeed` 不夹 30 | ✅ |
| 测试「提高等级」0～3，关设置后 `boostLevels` | ✅ |
| 主页设置不改等级 | ✅ selftest |
| BGM `/assets/游戏音乐/music.ogg` 循环 + 音量 | ✅ |
| 选角 `RangerPortrait` 朝右 | ✅ |

### M4

| 检查项 | 结果 |
|--------|------|
| `queueLevelUpFx(n)` → n 个 +1 | ✅ |
| 无 `fx/levelup.png`，程序像素字 | ✅ |

### M1 接线

| 检查项 | 结果 |
|--------|------|
| `match.js` 去掉开局 `setLevel` | ✅ |
| 结晶升级调用 `queueLevelUpFx` | ✅ |
| 暂停/三选一时仍步进 +1 | ✅ |
| 测试提高后 `queueLevelUpFx` | ✅ GameShell |

### 自测

| 检查项 | 结果 |
|--------|------|
| `ui` / `player` / `match` / `combat` selftest | ✅ RESULT PASS |
| `npm run build` | ✅ Vite 8.1.0 |

**结论**：M8/M4 **pass**。M10 P5 贴图 **放弃**。  
**阻塞项**：浏览器需一次点击才会开始播 BGM（自动播放策略）。黑洞仍未吸结晶。

---

## 2026-08-16 — P6 M1 规格（未实现查收）

用户 8 项改口。交接：`docs/HANDOFF-P6.md`。素材已拷：`小怪/蘑菇怪.png`、`小怪/蜗牛怪.png`（public + source）。

| 窗口 | 本环 |
|------|------|
| M7 | 掉落速度 135；树结晶上限每分钟 +2；黑洞改为飞行吸入；磁铁范围 ×1.5 |
| M6 | 蘑菇怪成长；蜗牛怪 120s；刷怪倍率乘每波数量 |
| M8 | 磁铁文案；先 +1 再三选一；刷怪速度文案 |
| M5 | 击退减免，最低 0 |
| M4 | 导出 +1 是否播完 |
| M10 | **等用户手绘**磁铁，不要生图 |
| M1 | 等请查收后再改 `match.js` |

未标实现 done。子窗口说请查收后再磁盘核对。

---

## 2026-08-16 查收 — P6（M4–M8；M10 等待未入图；M1 接线）

用户：所有窗口已完成，请接收。

### 子窗口磁盘

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M7 | `PICKUP_SPEED=135`；60s 结晶 max=8；`pullAllCrystals` 不当帧删；`addMagnet` ×1.5 | ✅ `world/selftest.mjs` |
| M6 | 蘑菇怪单帧图、血 22+3t、波 4+floor(s/120)、间隔 5；蜗牛 120s；数量×spawnRate | ✅ `enemies/selftest.mjs` |
| M8 | 磁铁入池；`addExp`→`levelup`；`beginUpgradeOffer`；刷怪速度文案；空白图标 | ✅ `ui/selftest.mjs` |
| M5 | `max(0, dist−resist)`；未蓄+resist=BODY → 0 | ✅ `combat/selftest.mjs` |
| M4 | `hasLevelUpFx` / `levelUpFxBusy` | ✅ `player/selftest.mjs` |
| M10 | 无 `upgrades/magnet.png`（按规格等待手绘） | ✅ 未擅自生图 |

### M1 接线

| 检查项 | 结果 |
|--------|------|
| 每帧 `shell.getSettings()` 活倍率 | ✅ `match.js` |
| 不覆盖 `pullAllCrystals`；不当帧 splice | ✅ |
| `levelup` 冻结战斗、步进 +1 与 pickups；fx 空则 `beginUpgradeOffer` | ✅ |
| `App.vue` 转发 `syncHud` | ✅ |

### 自测

| 检查项 | 结果 |
|--------|------|
| ui / player / combat / enemies / world / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ Vite 8.1.0 |

**结论**：M4–M9 **pass**。M10 本环 **pass（等待，磁铁仍空白方块）**。  
**阻塞项**：磁铁图标待用户手绘采用。

---

## 2026-08-16 — P7 M1 规格（未实现查收）

用户改口（无第 2 项）。交接：`docs/HANDOFF-P7.md`。根目录新增 `怪物属性表.md`。素材已拷：更新蘑菇怪/蜗牛怪、新增裂怪、地精（public + source）。

| 窗口 | 本环 |
|------|------|
| M8 | 回忆用图标+×n；高级池每 5 次 30%；地精文案 |
| M11 | **新窗口** 跟班 + 地精实体 |
| M6 | 贴图按中文名；裂怪独立图 |
| M10 | 等地精（及磁铁）手绘 |
| M1 | 等请查收后再改 `match.js` |

未标实现 done。

**素材改口（同日稍后）**：桌面重出图。已再覆盖蘑菇怪/蜗牛怪/裂怪；地精以 `小怪/地精.png` 写入 `跟班/地精.png`。忽略史莱姆x。

---

## 2026-08-16 查收 — P7（M6 / M8 / M11 + M1 接线）

用户：其他窗口已完工；**未开 M10**（跟班贴图已有，升级选项仍空白方块）。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M8 | `UPGRADES.goblin` / `tier:'advanced'`；第 5/10/15… 次 30% 换 1 格；`summarizePicked` 图标+×n；`applyUpgrade('goblin')` → `addGoblin` | ✅ `ui/selftest.mjs` |
| M11 | `createCompanions`；无血无击退；0.4s；`ceil(15+0.6×攻击)`；最多 2 目标；贴图 `跟班/地精.png` | ✅ `companions/selftest.mjs` |
| M6 | `SPLIT_SRC`=`裂怪.png`；裂怪 `name:'裂怪'`；蘑菇怪/蜗牛怪中文名贴图 | ✅ `enemies/selftest.mjs` |
| M10 | 无 `upgrades/goblin.png`（本环未开窗） | ✅ 局内空白方块 |
| 素材 | public+source：蘑菇怪 3004、蜗牛怪 2772、裂怪 2715、地精 2838 | ✅ |

### M1 接线

| 检查项 | 结果 |
|--------|------|
| `createCompanions` 挂 `match.js`；`loadAssets`；`bind` 含 companions | ✅ |
| `playing` 时 `companions.update`；画在敌人后、玩家前 | ✅ |
| 暂停/升级不更新跟班 | ✅ |

### 自测

| 检查项 | 结果 |
|--------|------|
| ui / player / combat / enemies / world / companions / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |

**结论**：M6 / M8 / M11 / M9 **pass**。M10 本环 **skip**（地精升级图标空白）。  
**阻塞项**：地精三选一图标待手绘采用。

---

## 2026-08-17 — P8 M1 规格（未实现查收）

用户确认：x-1 生命初值 40；出场 ≥300s；成长从出场起；每波每 45s +1；id=`slime_x1`/`slime_x3`；多选地精 = 每只跟班再出一个且全跟班伤害再 +10。碰撞仍 0.4s 结算。

交接：`docs/HANDOFF-P8.md`。新增稿已合并进 `怪物属性表.md`。素材已拷：`小怪/史莱姆x-1.png`、`史莱姆x-3.png`（public + source）。

| 窗口 | 本环 |
|------|------|
| M8 | 地精文案 +10；回忆 ×1 与 ×000 间距 |
| M11 | 地精碰撞伤害；`addDamageBonus` |
| M6 | 史莱姆x-1 / x-3 |
| M10 | 不开 |
| M1 | 等请查收 |

未标实现 done。

---

## 2026-08-17 查收 — P8（M6 / M8 / M11 + M1 接线）

用户：所有窗口已完成，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M8 | 地精文案含 +10；`applyUpgrade` 调 `addGoblin` + `addDamageBonus(10)`；回忆始终 `×n`；`.rl-mem-mult` 宽 `4ch` | ✅ `ui/selftest.mjs` |
| M11 | 绘制矩形重叠才打；0.4s；彼此重叠才 2 目标；`addDamageBonus`；攻击 20+10=37；`addGoblin` 不加伤 | ✅ `companions/selftest.mjs` |
| M6 | ≥300s；15s 波；血/速/波数公式；x-1 死 → 2×x-3 + 2 结晶；x-3 血/速/1 结晶 | ✅ `enemies/selftest.mjs` |
| 素材 | public+source：史莱姆x-1 2694、史莱姆x-3 827 | ✅ |

### M1 接线

| 检查项 | 结果 |
|--------|------|
| `match.js` 已 bind companions；无需新挂载 | ✅ |
| `applyUpgrade` 能打到 `addDamageBonus` | ✅ `match.selftest.mjs` |

### 自测

| 检查项 | 结果 |
|--------|------|
| ui / player / combat / enemies / world / companions / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |

**结论**：M6 / M8 / M11 / M9 **pass**。  
**备注**：磁盘上已有 `upgrades/goblin.png`（与跟班图同大小 2838），三选一会显示该图，不是空白方块。

---

## 2026-08-17 — P9 M1 规格（未实现查收）

交接：`docs/HANDOFF-P9.md`。素材已拷：跟班立绘（地精/兔子）、升级图标（`跟班选项` → `upgrades/goblin.png`、`rabbit.png`）。`怪物属性表.md` 已改史莱姆数值与 x-3 掉落。

| 窗口 | 本环 |
|------|------|
| M11 | 多跟班槽位；兔子实体 |
| M4 | 粘键；clearMovementKeys |
| M6 | 史莱姆 80/1.00/+0.05/每波 5；x-3 掉 0～1；裂怪错开 |
| M7 | 升级时结晶只飞不拾取 |
| M8 | 兔子入普通池；高级红点；levelup 不加经验 |
| M10 | 等用户改 +1 图 |
| M1 | 等请查收后改 match.js |

未标实现 done。

---

## 2026-08-17 — P10 M1 规格（未实现查收）

交接：`docs/HANDOFF-P10.md`。

| 窗口 | 本环 |
|------|------|
| M11 | 兔子追离自己最近的活敌人；地精仍追离角色最近 |
| M1 | 等请查收（本环不改 match.js） |

未标实现 done。

---

## 2026-08-18 — P11 M1 规格（未实现查收）

交接：`docs/HANDOFF-P11.md`。

| 窗口 | 本环 |
|------|------|
| M11 | 跟班独立锁不同敌人；走进重叠；兔子切入不空追 |
| M6 | 每波+1；血+5；血成长+2；移速成长+0.02；x-3×3 且 0.3s 无敌 |
| M8 | 回忆悬停效果；力量文案 +10；每 5 级攻+1 速+0.05 |
| M5 | POWER_DMG 8→10 |
| M1 | 等请查收（成长走 session.addExp 已有 ctx） |

未标实现 done。

---

## 2026-08-18 查收 — P11（M11 / M6 / M8 / M5）

用户：所有窗口已完工，请接收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M11 | 独立领怪、锁目标、走进重叠；兔子朝角色一侧切入 | ✅ `companions/index.js` |
| M6 | 蘑菇 5/27+5t；蜗牛 4/45+10；x-1 6/85+12；裂怪爆 4；x-3×3 且 0.3s 无敌 | ✅ `spawner/` `enemies/` |
| M6 | 灰树血 25、普通树 50 未改 | ✅ |
| M8 | 回忆悬停 `desc`；力量文案 +10；`applyLevelGrowth` 进 addExp/boostLevels | ✅ |
| M5 | `POWER_DMG === 10` | ✅ `weapons/index.js` |

### 自测

| 检查项 | 结果 |
|--------|------|
| companions / enemies / combat / ui / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |

**结论**：M11 / M6 / M8 / M5 **pass**。本环无 `match.js` 接线。

---

## 2026-08-17 查收 — P10（M11 兔子自索敌）

用户：M11已完成，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M11 | `pickChase`：兔子 `nearestTo(自己)`，地精 `nearestTo(角色)` | ✅ `companions/index.js` |
| M11 | 同目标仍槽位摊开；碰撞规则未改 | ✅ |
| M11 | 地精 nearest-to-player 自测保留；兔子 nearest-to-self 自测新增 | ✅ `selftest.mjs` |

### 自测

| 检查项 | 结果 |
|--------|------|
| `companions/selftest.mjs` | ✅ RESULT PASS |
| `match.selftest.mjs` | ✅ RESULT PASS |
| `npm run build` | ✅ |

**结论**：M11 **pass**。本环无 `match.js` 接线。

---

## 2026-08-17 查收 — P9（M4 / M6 / M7 / M8 / M11 + M1 接线）

用户：所有窗口已完工，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M11 | 跟班槽位不重叠；`addRabbit`；伤 20+bonus；最多 1 目标 | ✅ `companions/selftest.mjs` |
| M4 | `e.code` WASD；`clearMovementKeys`；blur 清键 | ✅ `player/selftest.mjs` |
| M6 | x-1 血 80 / 速 1.00 / 每波 5；x-3 掉 0～1；裂怪错开 | ✅ `enemies/selftest.mjs` |
| M7 | `collect:false` 只飞不拾取 | ✅ `world/selftest.mjs` |
| M8 | 兔子入普通池；高级 3×3 红点；levelup/upgrade 不加经验 | ✅ `ui/selftest.mjs` |
| M10 | `icon-review/levelup.map.txt` 有待审；未采用拷贝 `fx/levelup.png` | ⏳ 仍等采用 |

### M1 接线

| 检查项 | 结果 |
|--------|------|
| `levelup`/`upgrade` 时 `updatePickups(..., { collect: false })` | ✅ `match.js` |
| 非 playing 时 `clearMovementKeys` | ✅ |

### 自测

| 检查项 | 结果 |
|--------|------|
| ui / player / combat / enemies / world / companions / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |

**结论**：M4 / M6 / M7 / M8 / M11 / M9 **pass**。M10 **未采用**（+1 图仍等你说采用）。

---

## （模板）查收 — M?

| 检查项 | 结果 |
|--------|------|
| 产出路径 | ✅ / ❌ |
| 编译/构建 | ✅ / ❌ |
| Registry 交付物 | ✅ / ❌ |

**结论**：`done` / `review` / `blocked`  
**阻塞项**：…
