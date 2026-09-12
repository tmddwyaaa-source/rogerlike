# 模块注册表（Module Registry）

> ⚠️ **历史，已作废（2026-09-08）**：本文件记录旧编制（M3～M11）的模块与派工表，**不再作为派工或状态依据**。
> 当前编制权威 = **`docs/编制-2026.md`**；任务状态单一来源 = **`.task/`**（`transition` 唯一收口），状态视图 = `docs/TASK-STATUS.md`（禁止手改）。
> 保留价值：各模块历史交付物清单与 `HANDOFF-P*.md` 索引仍可查阅。

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
| M10 | 升级选项生图（用户过审后入游戏） | 窗口 10 | done | M1 规格、M8 占位 |
| M11 | 跟班 | 窗口 11 | done | M1 规格、M8 文案 |

**建议开工顺序**：M3 →（M4 ∥ M7 可并行）→ M5 → M6 → M8 → M1 查收集成。

**长线规则**：每环唯一目标 + 成功标准 + 证据 + 存档点；同卡点 4 次硬停写 `docs/BLOCKERS/`。

---

## P42 修补（2026-09-12 M1 已查收 pass，同属 ROUND-014）

用户实机反馈定神完全无效 + 澄清「向上取整指的是伤害数字」。定神静止判定只认 WASD；暴击倍率改连续算式；伤害统一 `ceil`；飘字「×倍率」两位小数；精益求精 desc 文案修订。

| 窗口 | 内容 | 状态 |
|------|------|------|
| M2 | `TASK-042`：`critDamageMul` 连续算式（去 `ceil(率/3)`）+ 伤害结算前 `Math.ceil` | ✅ done |
| M3 | `TASK-043`：`stepSteady` 只认 WASD（蓄力/攻击/受击不打断）+ `formatMul` 两位小数 + 真实输入路径断言 | ✅ done |
| M6 | `TASK-044`（独立验收）+ `TASK-045`（精益求精 desc 去掉「向上取整」措辞） | ✅ done |
| M1 | 本窗复跑 7 个 selftest（1498 条 PASS）+ 47 个断言标题核对 + 文档回写 + 发布 | ✅ done |

---

## P42 批次 6（2026-09-12 M1 已查收 pass）

序列帧第二批：**冰人 6 帧**（0.6s 一轮）、**灰树 4 帧**、**普通树（浅树）4 帧**、**8 种跟班各 4 帧**；**冰锥**新贴图 + 尖头朝飞行方向。口径同批次 4，只换帧图不动判定。

| 窗口 | 内容 | 状态 |
|------|------|------|
| M4 | `TASK-038`：冰人 6 帧 + 灰树 4 帧 + 冰锥朝向 | ✅ done（enemies 283 条） |
| M7 | `TASK-039`：8 种跟班 4 帧（含蛋三阶段） | ✅ done（companions 202 条） |
| M5 | `TASK-040`：普通树（浅树）4 帧 | ✅ done（world 98 条） |
| M3 | `TASK-041`：TASK-038/039/040 的**独立验收方**（三份 verify-report + 70 条探针） | ✅ done |
| M1 | 47 张素材双拷落盘、查收、本窗全量重跑、文档回写、发布 | ✅ done |

---

## P42 批次 5（2026-09-12 M1 已查收 pass）

数值 / 文案 / 卡牌屏：荆棘范围 2 身位 +0.5/层、精益求精新暴击伤害公式、大地啊结晶上限 +2/层、连射额外发延迟 0.2s、定神 0.15s 且 +100 真实暴击率、难度二 12 分钟、生生不息文案不列计入项、卡牌屏放大/双向/加速。任务与状态以 `.task/` 为准；口径见 `游戏当前设计表.md` §1/§2.4/§2.4b/§2.4c 与 `docs/P42-内容扩充提案.md` §8。

| 窗口 | P42 批次 5 内容 | 状态 |
|------|----------------|------|
| M2 | 荆棘范围 / 精益求精（+5 暴击 + 新倍率公式）/ 连射 0.2s 延迟 / 定神战斗侧 +100 暴击率 | ✅ done（combat selftest 232 条） |
| M3 | 定神静止阈值 0.3s → 0.15s | ✅ done（player 156 条） |
| M5 | 大地啊 普通树结晶掉落上限 +2/层 | ✅ done（world 88 条） |
| M6 | 难度二 12 分钟 / 生生不息文案 / 卡牌屏 / 四项升级文案 | ✅ done（ui 463 条） |
| M7 | TASK-033/034/035/036 的**独立验收方**（四份 verify-report + 18 条探针） | ✅ done |
| M1 | 本窗全量重跑 7 个 selftest（1453 条）+ 34 个新断言标题核对 + 文档回写 + 发布 | ✅ done |

---

## P42 批次 4（2026-09-12 M1 已查收 pass）

8 种小怪 + 地精跟班的 **4 帧序列动画**（时间驱动 10fps / 0.4s 一轮、相位错开、暂停停住；只换帧图不动判定）。任务与状态以 `.task/` 为准；规格见 `游戏当前设计表.md` §6 与 `docs/GAME-SPEC.md` §5；派工见 `docs/派工-批次4-小怪序列帧.md`。

| 窗口 | P42 批次 4 内容 | 状态 |
|------|----------------|------|
| M4 | `game/enemies/**` 8 怪 4 帧动画（取帧纯函数 + `CREEP_FRAMES=4`） | ✅ done（selftest 267 条 PASS） |
| M7 | `game/companions/**` 地精跟班 4 帧动画 | ✅ done（selftest 195 条 PASS） |
| M5 | TASK-030/031 的**独立验收方**（两份 verify-report + 素材/动画三个探针） | ✅ done |
| M1 | 36 张帧图双拷落盘、查收、本窗全量重跑、文档回写、发布 | ✅ done |

---

## P42 批次 3（2026-09-12 M1 已查收 pass）

`激发力量`（power）子系统：等级每 10 级一次、卡牌屏强制选 1 张（游侠 4 池，战士/法师仅 sp-power）。任务与状态以 `.task/` 为准；规格见 `游戏当前设计表.md` §2.4c 与 `docs/GAME-SPEC.md` §4.1b；派工见 `docs/派工-当前轮.md`。

| 窗口 | P42 批次 3 内容 | 状态 |
|------|----------------|------|
| M6 | `ui/constants.js` + `ui/session.js` 的 power 池/相位/回忆，`views/PowerView.vue` 卡牌屏，`views/GameShell.vue` 接线 | ✅ done |
| M2 | combat 侧 `applyPower`：连射 / 贯穿强化 / sp-power（含 weapons 侧） | ✅ done |
| M3 | player 侧 `applyPower('steady')` / `consumeSteadyCrit()` | ✅ done |
| M7 | TASK-026/027/028 的**独立验收方**（三份 verify-report + 自写探针 28/28） | ✅ done |
| M1 | 查收、本窗复跑、文档回写、commit、（仅 M1）开游戏 | ✅ done |

---

## P25 派工（2026-08-24 M1 已查收 pass）

七兄弟 / 小金刚羁绊 / 毒刺怪 / 高级结晶 / 怪物体验。任务书：`docs/HANDOFF-P25.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 25。

| 窗口 | P25 内容 | 状态 |
|------|----------|------|
| M7 | 高级结晶（紫边、+5 经验、独立概率接口） | ✅ done |
| M4 | 三娃护甲状态、六娃失锁脉冲角色侧状态 | ✅ done |
| M6 | 毒刺怪、红圈预警、环绕生成、蝎子错峰 CD、冰人调整 | ✅ done |
| M5 | 四娃点燃、五娃减速、七色脉冲、高级「击退」、集齐后大娃/二娃/四娃/五娃效果 +10% | ✅ done |
| M8 | 七兄弟入池文案、四选一、黑洞改名七娃、小金刚进度 chip、HUD 护甲显示、高级「击退」入池 | ✅ done |
| M1 | `match.js` 接线（合体触发 `syncVajra`、脉冲、失锁/护甲钩子）、查收、发布 | ✅ done |

**开窗顺序**：并行 M7 + M4 → M6 → M5 → M8 → 全部请查收 → M1 接线联调（已执行：合体触发 `syncVajra` 入 `match.js`）。
**自测/build**：7 模块 selftest 全 RESULT PASS；`npm run build` 522ms；M1 已打开实机 http://localhost:5173/。
**素材**：毒刺怪已由 M1 拷贝到 `assets/source/小怪/毒刺怪.png` 与 `frontend/public/assets/小怪/毒刺怪.png`。

---

## P26 派工（进行中，P25 回修）

音效 −50% / 小金刚羁绊展示对齐 / 三娃护盾视觉 / 毒刺怪 6 / 五娃减速 / 四娃五娃粒子 / 六娃失锁。任务书：`docs/HANDOFF-P26.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 26。

| 窗口 | P26 内容 | 状态 |
|------|----------|------|
| M4 | 三娃护盾：素材轮廓黄边（去竖长方形） | ✅ done |
| M6 | 毒刺怪 6、五娃减速消费、四娃/五娃粒子、红圈占位保留 | ✅ done |
| M8 | 拾取音效 −50%、小金刚展示/配色对齐前两羁绊 | ✅ done |
| M1 | 六娃失锁 `match.js` 接线（getTargets + isTargetBlind 桥接） | ✅ 已做（match selftest/build 绿） |

**开窗顺序**：并行 M4 + M6 + M8 → 全部请查收 → M1 联调开游戏。红圈预警保留程序占位，等 M10 图标。

---

## P27 派工（进行中，测试调整）

小金刚文本 / 全怪红圈 / 六娃特效 / 怪物成长 / 冰人 / 强化怪 / 四娃 30% / 三娃唯一效果+每3个1甲。任务书：`docs/HANDOFF-P27.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 27。

| 窗口 | P27 内容 | 状态 |
|------|----------|------|
| M4 | 六娃 #3F48CC 扩散圈；三娃护盾视觉描黄（去矩形） | ✅ done |
| M5 | 四娃燃烧 30%/s | ✅ done |
| M6 | 红圈全怪（含裂怪）、怪物成长、冰人 4000/可离开/伤害2/子弹蓝、强化怪 | ✅ done |
| M8 | 小金刚文本、三娃唯一效果+每3个1甲、四娃文案 | ✅ done |
| M1 | `match.js` `hpGrowthAdd=10`（已做）、查收、联调 | ✅ 已做 |

**开窗顺序**：并行 M4 + M5 + M6 + M8 → 全部请查收 → M1 联调开游戏。

---

## P28 派工（进行中，测试调整+崩溃排查）

崩溃排查（A1）/ 高级结晶紫边（A2）/ 三娃新机制（A3）/ 七色脉冲动画（A4）/ 伤害数字&暴击特效（B2/B3）/ 新增跟班升级（驯兽师/恶魔/史莱姆gg/伴我同行）。任务书：`docs/HANDOFF-P28.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 28。

| 窗口 | P28 内容 | 状态 |
|------|----------|------|
| M7 | 高级结晶紫边 | ✅ done |
| M5 | 七色脉冲七彩动画；伤害数字/暴击数据（不截断、带倍率） | ✅ done（伤害数字部分 M5 三连未落地，M1 硬停接管修复） |
| M4 | 伤害数字动画（先非暴击→×倍率→滚动到实际）；三娃护盾配合 | ✅ done |
| M8 | 三娃新机制；跟班新升级文案/入池（tamer/demon/slime_gg/companionship）；伤害数字规则 | ✅ done |
| M11 | 驯兽师/恶魔/史莱姆gg/伴我同行 跟班效果 | ✅ done |
| M1 | A1 崩溃排查修复、暴击抖动/伤害跳数字接线、素材落盘（恶魔/史莱姆已拷）、全局错误外显 | ✅ done（onDemonLink 接线含；A1 凭下次 console 栈定位） |

**开窗顺序**：并行 M7 + M5 + M4 + M8 + M11 → 全部请查收 → M1 联调开游戏（含 A1 根因定位）。

---

## P29 派工（进行中）

强化结晶紫边 / 万物一心 tier 复核 / 回忆角色立绘 / 选角 hover 待机动画。任务书：`docs/HANDOFF-P29.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 29。

| 窗口 | P29 内容 | 状态 |
|------|----------|------|
| M7 | 强化结晶显著紫外覆层 | ✅ done |
| M8 | 回忆角色立绘；选角 hover 待机动画；万物一心计数/显示复核 | ✅ done |
| M11 | 万物一心 `setUnityTier`/`unityAdd` 消费复核 | ✅ done |
| M1 | `syncUnity` 运行时探针、跨模块核对、联调 | pending（待探针） |

**注**：万物一心“1种就2档”按当前代码不应发生（`bondRank(count=1)=0`、阈值[2,4,6,8]、`setUnityTier` 仅 syncUnity 调用）。M1 加运行时探针确认；也请用户**硬刷新（Ctrl+Shift+R）**排除旧构建缓存。

---

## P30 派工（进行中）

恶魔软性跟随 / 六娃范围 3 身位 / 地图背景装饰物（火柴堆·石头）。任务书：`docs/HANDOFF-P30.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 30。

| 窗口 | P30 内容 | 状态 |
|------|----------|------|
| M11 | 恶魔软性跟随 AI（去空气墙抽搐） | ✅ done |
| M4 | 六娃 `UNLOCK_RADIUS_UNITS` 1.5→3 | ✅ done |
| M7 | 地图背景装饰物（火柴堆 25 / 石头 75、随机播种、不重叠、静态不碰撞、背景层绘制） | ✅ done |
| M1 | 素材落盘（8 张已拷）、联调、查收 | ✅ 素材已拷 |

**开窗顺序**：并行 M11 + M4 + M7 → 全部请查收 → M1 联调开游戏。

---

## P33 派工（2026-08-29 M1 已查收 pass）

选角立绘阴影 / 回忆页布局重排（升级选项 ≥60% + 羁绊裸 chip 右置）/ 阴影贴身。任务书：`docs/HANDOFF-P33.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 33。

| 窗口 | P33 内容 | 状态 |
|------|----------|------|
| M8 | 选角立绘下移+脚下阴影；回忆页羁绊改局内同款裸 chip 右置、升级选项 ≥60%、两栏总宽=黑框宽、悬停提示保留；黑框内立绘阴影贴身 | ✅ done |

**开窗顺序**：只开 **M8** → 请查收 → M1 联调开游戏。

---

## P32 派工（2026-08-28）

回忆界面立绘/羁绊模块 / 基础击退 0.5 / 高级击退 +1 / 高级出现机制改版。任务书：`docs/HANDOFF-P32.md`；开窗粘贴块：`docs/WINDOW-ASSIGNMENTS.md` Phase 32。

| 窗口 | P32 内容 | 状态 |
|------|----------|------|
| M8 | 回忆界面（立绘下移+阴影+悬停信息/待机动画）、羁绊显示模块+属性条两栏布局+羁绊悬停提示、高级升级出现机制（等级%5必出 + 必出当次其余槽独立30%，非必出等级不出高级）、击退文案+1 | ✅ done |
| M5 | 所有角色基础击退 0.5 身位、高级「击退」0.5→1、combat 自测同步 | ✅ done |

**开窗顺序**：并行 **M8 + M5** → 全部请查收 → M1 联调开游戏。

---

## P31 直调（M1 执行，2026-08-28）

用户测试反馈：地图装饰物太少 / 素材太大。M1 直改（非子窗口派工）。

| 项 | 内容 | 状态 |
|------|----------|------|
| M7-装饰物数量 | 火柴堆 **800** / 石头 **2400**（每屏平均≈2.4 个），`decorations.js` 改**抖动网格**播种：全图均匀、数量精确可达、与树/装饰物不重叠、静态 | ✅ done |
| M7-装饰物尺寸 | `DECOR_DRAW_SCALE=1/3` + 保底 `火柴堆 7px / 石头 6px`，碰撞盒对齐绘制尺寸 | ✅ done |

**自测/build**：7 模块 selftest 全 RESULT PASS；`npm run build` 2.02s；M1 已打开实机 http://localhost:5173/。

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
- [x] P12：三角色 `charId`；死亡 8 帧播完信号；`addEmptyHpMax`；伤害数字（`docs/HANDOFF-P12.md`）
- [x] P13：法师 2 心 / 战士 4 心；伤害数字间距；≥100 黄边 ≥200 红边（`docs/HANDOFF-P13.md`）
- [x] P14：绿边回血数字；开局目标 5 秒（`docs/HANDOFF-P14.md`）
- [x] P15：局内不再画开局目标（`docs/HANDOFF-P15.md`）
- [x] P21：受伤钩子 `opts.onHurt`（实扣血一次；无敌不调；不播音）（`docs/HANDOFF-P21.md`）

**验收**：可移动；受击接口可被调用并触发无敌。

**开工话术**：粘贴 `docs/HANDOFF-P22.md` 中 M4 块（如后续环涉及）。

**状态**：`done`（2026-08-23 P21 onHurt 查收 pass）

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
- [x] P12：法球 / 近战挥砍 / 满蓄 ×1.25 / 强化射击 / 命中数字（`docs/HANDOFF-P12.md`）
- [x] P13：强化箭图集；法师大小/范围/消散；战士挥砍位置与单次伤害；三角色攻击穿透；大娃 +40%；强化射击 ×2.5/+2/溢出（`docs/HANDOFF-P13.md`）
- [x] P14：激光强化箭；法师 ×2.6；战士无限穿透与满蓄 ×1.6；knockbackScale（`docs/HANDOFF-P14.md`）
- [x] P15：法师 ×3.0 命中扩散；战士身前判定与满蓄伤 ×1.6；暴击（`docs/HANDOFF-P15.md`）
- [x] P16：扩散淡出；暴击帽；唯快不破；精益求精；强化射击全角色（`docs/HANDOFF-P16.md`）
- [x] P17：战士 1 身位长条；蓄力线性；大娃不盖半屏；实伤数字（`docs/HANDOFF-P17.md`）
- [x] P18：攻击间隔 0.315（`docs/HANDOFF-P18.md`）
- [x] P20：开火音效钩子 `hooks.onFire?.(kind)`（shoot/slash/fireball，单次开火一次；不播音）（`docs/HANDOFF-P20.md`）

**开工话术**：粘贴 `docs/HANDOFF-P20.md` 中 M5 块。

**状态**：`done`（2026-08-23 P20 onFire 查收 pass）

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
- [x] P13：史莱姆 x-1 出场与成长 240s（`docs/HANDOFF-P13.md`）
- [x] P14：冰人 Boss + 兰花（`docs/HANDOFF-P14.md`）
- [x] P15：冰人 2000 / 冲刺 8 身位 1～6 / 子弹 224；测试木桩（`docs/HANDOFF-P15.md`）
- [x] P16：移速下调；蜗牛甲；冰人 48 / 子弹 200 / 3 兰花；回血 10 与叠甲（`docs/HANDOFF-P16.md`）
- [x] P17：移速再减；甲像素描边；takeHit 返回实伤（`docs/HANDOFF-P17.md`）
- [x] P18：蝎子怪；冰人重生/掉落/CD；史莱姆 180s；灰树 80；难度血（`docs/HANDOFF-P18.md`）
- [x] P20：四怪血 +5/+5（蘑菇 32/10、蜗牛 50/15、x-1 120/17、蝎子 105/15；兰花/树不动）；冰人 3000、CD 12/22/32、重生 round(3000×1.4ⁿ)（`docs/HANDOFF-P20.md`）
- [x] P21：蜗牛/x-1 成长 +5（20/22）；冰人 3300 与 3 秒脱战每秒回 20 绿字（`docs/HANDOFF-P21.md`）

**开工话术**：粘贴 `docs/HANDOFF-P22.md` 中 M6 块（如后续环涉及）。

**状态**：`done`（2026-08-23 P21 成长 / 冰人回血查收 pass）

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
- [x] P13：磁铁每次 +1 身位（`docs/HANDOFF-P13.md`）
- [x] P17：树 hitAt 返回 dealt；挥砍 OBB 打树（`docs/HANDOFF-P17.md`）
- [x] P18：树血成长 extra；spawnCrystalBurst（`docs/HANDOFF-P18.md`）

**开工话术**：粘贴 `docs/HANDOFF-P18.md` 中 M7 块。

**状态**：`done`（2026-08-23 P18 树血 / 结晶爆发查收 pass）

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
- [x] P12：选角战士/法师；每 10 次空血上限；强化射击文案（`docs/HANDOFF-P12.md`）
- [x] P13：磁铁/大娃/强化射击文案；HUD 心数跟 hpMax（`docs/HANDOFF-P13.md`）
- [x] P14：满蓄模式；测试时间滑条；选角悬停属性（`docs/HANDOFF-P14.md`）
- [x] P15：难度悬停目标；暴击文案；自选升级面板；火柴人开关（`docs/HANDOFF-P15.md`）
- [x] P16：选角文案；每 15 次穿透；强化射击全角色；唯快不破/精益求精/蛋入池（`docs/HANDOFF-P16.md`）
- [x] P17：选角原文；蝙蝠入普通池（`docs/HANDOFF-P17.md`）
- [x] P18：羁绊；去掉升级白送；难度二；右侧 HUD（`docs/HANDOFF-P18.md`）
- [x] P19：UI 像素框架 · 菜单环——token 层 + `.rl-frame` + 标题/选角/难度/设置换装；只改皮不改骨（`docs/HANDOFF-P19.md`）
- [x] P20：文案三处（穿透/敏捷 +0.15/强化射击按角色）；羁绊悬停档位深浅；音效播放器 + UI 相位 4 音效（`docs/HANDOFF-P20.md`）
- [x] P21：sfx 加固（引用持有到 ended）修拾取不响；shoot 换 `射箭声音.wav`、新增 hurt；测试模式两列排版；音效音量滑条（`docs/HANDOFF-P21.md`）
- [x] P22：局内 UI——HUD 顶部通栏（钳制画布黑边内侧）、齿轮下移、升级卡/结算/回忆换装（`docs/HANDOFF-P22.md`）
- [x] P23：拾取增益（素材电平低）；菜单钳制黑边；齿轮/「……」回窗口角；羁绊悬停修复+单列；回忆详情重排；测试右面板；总音量/背景音乐/音效音量三滑条（`docs/HANDOFF-P23.md`）
- [x] P24：天行健文案细化；万物一心 2/4/6/8 新效果；新增小金刚羁绊（敬请期待）（`docs/HANDOFF-P24.md`）

**开工话术**：粘贴 `docs/HANDOFF-P24.md` 中 M8 块（后续环更新）。

**状态**：`done`（2026-08-24 P24 查收 pass；三羁绊 chip 与文案已实机验证）

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
- [x] P12：charId；死亡动画后再 `notifyDead`；`onDamage` + 伤害数字绘制
- [x] P13：结晶升级与测试强制升级同一套 +1 停顿；`notifyExp` 回传 gained
- [x] P14：测试时间写入 elapsed；开局 queueObjective；onHeal 绿字
- [x] P15：拆开局目标；测试木桩；自选升级 apply
- [x] P16：`createCompanions({ getKills })`
- [x] P17：`hitSlashAt`；蝙蝠 `onHeal`
- [x] P18：难度血、Boss 击杀、羁绊接线（`docs/HANDOFF-P18.md`）
- [x] P20：combat `onFire` → sfx；结晶拾取 pickup 节流 100ms（`docs/HANDOFF-P20.md`）
- [x] P21：player `onHurt` → sfx.play('hurt')（`docs/HANDOFF-P21.md`）
- [x] P22：App.vue 画布矩形 → `--rl-stage-*` CSS 变量（resize + ResizeObserver）（`docs/HANDOFF-P22.md`）
- [x] P24：万物一心档 8 优先目标——combat `onPlayerDamage` 记录玩家击中活敌 → `companions.getPriorityTarget`（`docs/HANDOFF-P24.md`）

**状态**：`done`（2026-08-24 P24 接线 pass）

---

## M10 — 升级选项生图

**路径**：
- `assets/icon-review/**`（待审）
- 用户采用后：`frontend/public/assets/upgrades/{id}.png` 或 `frontend/public/assets/fx/levelup.png`
- 用户采用后：`assets/source/upgrades/` 或 `assets/source/fx/`

**禁止路径**：`frontend/src/**`、`backend/**`、擅自改 Registry 为 done

**交付物**：
- [x] P4：11 个升级 id 用户手绘过审
- [x] P5：升级「+1」图 — **定案：永久程序绘制**（用户 2026-08-23 确认，不再等图）
- [x] P6：磁铁 `magnet` — 已过审拷入（后补确认）
- [x] P7：地精 `goblin` — 桌面 `跟班选项/地精.png` 已由 M1 拷入
- [x] P9：升级「+1」图 — **定案：永久程序绘制**（同 P5，2026-08-23 关闭）
- [x] P15：升级「暴击」`crit` — 已过审拷入 `upgrades/crit.png`
- [x] P16：奇怪的蛋 `strange_egg` — M1 已拷入 `upgrades/strange_egg.png`
- [x] P16：唯快不破 `only_fast`、精益求精 `refine` — 用户确认采用，三处 SHA256 一致（2026-08-23）

**验收**：✅ 升级池 20 个 id 的 PNG 在 `frontend/public/assets/upgrades/` 与 `assets/source/upgrades/` 两边齐全，运行时无空白方块。

**开工话术**：无待办；后续新升级 id 出图时再开 M10。

**状态**：`done`（2026-08-23 用户确认全部图标已采用；+1 特效永久程序绘制）

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
- [x] P12：跟班命中弹出伤害数字（`docs/HANDOFF-P12.md`）
- [x] P16：奇怪的蛋三阶段（`docs/HANDOFF-P16.md`）
- [x] P17：蝙蝠跟班（`docs/HANDOFF-P17.md`）
- [x] P18：万物一心 setUnityTier（`docs/HANDOFF-P18.md`）
- [x] P24：setUnityTier 改 2/4/6/8——+5 / floor(攻击×20%) / 目标+1 / 移速+0.2+伤+10+优先攻击角色目标（`docs/HANDOFF-P24.md`）

**验收**：`node src/game/companions/selftest.mjs` 全绿。

**开工话术**：粘贴 `docs/HANDOFF-P24.md` 中 M11 块（后续环更新）。

**状态**：`done`（2026-08-24 P24 新档位查收 pass）

