# 查收记录（RECEIPT-LOG）

> M1 查收专用。禁止仅凭口头「完成了」标 done。

> ⚠️ **遗忘更新（2026-09-10 补标）**：**P39 四任务——TASK-014 数值曲线与开局等级、TASK-015 真实加载进度、TASK-016 主菜单像素标题与跑动、TASK-017 全局设置与音频快捷控制——当时已完成并 `done`，但查收叙事漏写进本文件**；P40（TASK-018 / TASK-019）见下方 2026-09-10 条。本条只作「遗忘」标注，状态以 `.task/` 与 `docs/TASK-STATUS.md` 为准，不虚构当时未跑的复跑证据。

## 2026-09-12 查收 — ROUND-013 · P42 批次 5（M2 / TASK-033 + M3 / TASK-034 + M5 / TASK-035 + M6 / TASK-036 + M7 独立验收 / TASK-037）

用户需求（9 条口径，见 `docs/P42-内容扩充提案.md` §8）：荆棘范围改 2 身位 +0.5/层、精益求精改「+5 暴击 + 每 3 点暴击 +0.02 倍率（向上取整、按层相乘、暴击率无上限）」、大地啊加结晶上限 +2/层、生生不息文案不列计入项、连射额外发延迟 0.2s、定神 0.15s 且 +100 真实暴击率、卡牌屏放大/双向/加速/文案精简、难度二改 12 分钟。
用户信号：用户报「批次 5 的 5 个窗口已完成，请查收」。

### 磁盘核对 + 本窗重跑（M1）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M2 / TASK-033 · R1~R4 | 荆棘半径 `BODY×(2+0.5×(层−1))`（伤害不变）、精益求精 `1.5+0.02×ceil(率/3)×层数`（概率侧仍封顶 100）、连射额外发 0.2s 延迟（真实计时）、定神 +100 暴击率 | ✅ 四条验收 exit 0；**combat 232 条 PASS**；34 个新断言标题逐字核对全在 |
| M3 / TASK-034 · R1 | `STEADY_STILL_SEC` 0.3 → 0.15，接口不变 | ✅ exit 0；**player 156 条 PASS** |
| M5 / TASK-035 · R1 | 大地啊 掉落上限 `+2×earthPicks`（下限 3 与每分钟 +2 不变） | ✅ exit 0；**world 88 条 PASS** |
| M6 / TASK-036 · R1~R4 | 难度二 720s（难度一 600s）+ 测试滑条上限 720s、生生不息文案、卡牌屏 120×160/双向/加速、四项文案 | ✅ 四条验收 exit 0；**ui 463 条 PASS** |
| M7 / TASK-037 · R1~R3 | 独立验收方（reviewer=M7 ≠ 施工窗）：四份 verify-report + 自写探针 18/18 | ✅ 13/13 条命令本窗复跑 exit 0 |
| M1 集成 | 7 个 selftest 全量 + `npm run build` | ✅ enemies 267 / companions 195 / match 52 / world 88 / player 156 / combat 232 / ui 463 = **1453 条 PASS，0 FAIL**；build ✓ 502ms |
| 收口 | `transition` ×10 + `audit-round` | ✅ **BASIC + FULL PASS + ROUND_READY_TO_CLOSE** |

### 独立验收发现（M7）

- **F1（low，TASK-033）**：连射 0.75s 冷却的**起算点是「主发触发」**而不是「额外发射出」——实测主发每 0.48s 一枪时两次额外发间隔 ≈0.96s。不变量（0.75s 内不会有两发额外）成立，故不 fail；**已把起算点写进设计表 §2.4c / SPEC §4.1b**。
- **F2（medium，TASK-035，已实测排除风险）**：结晶掷点模块在 `pickups/pickups.js`，**不在 TASK-035 的 allowed_paths 内**；M5 用「层数折算成等价时间（+60s/层）」绕开（数学恒等）。M7 特意走**真实 gameplay 路径（打掉一棵树）**验证，两个调用点都吃到 +2/层 → 无假绿。
- **F3（low，TASK-035，遗留耦合）**：上述等价折算与 `TREE_CRYSTAL_MAX_PERIOD=60 / STEP=2` **成对耦合**——日后若把周期改成 45s 或每层改成 +3，折算会**静默失配**（掉落不会报错，只会掉错数量）。**本轮不回工**；批次 6 之后若要动这两个常量，必须先改 M5 的折算方式。
- **F4（info，TASK-034）**：0.15s 阈值 + 消费即清零 ⇒ 站桩时每次攻击必暴——这正是本轮口径（不是缺陷），但**强度提升明显**，已在设计表写明。
- **F5（low，TASK-036）**：生生不息文案与天行健**不逐字相同**（天行健多「按角色等级补发」半句）——这是对的，不要为求「完全同款」改错。
- **F6（info，TASK-036）**：测试滑条上限 720 = max(600, 720)，拖到顶即可触发难度二通关（仍需 Boss ≥ 2）；实测 719s 不通、720s 且 Boss=1 不通、Boss=2 通关。
- **流程经验**：施工窗的 `worker-report.tests[]` 里有 2 条命令**尾部带 `#` 注释**（TASK-034 / TASK-037），门禁用 `cmd.exe` 重跑必失败。M1 收口时**仅删除注释、命令本体逐字未改**，并在报告的 `runner` 字段留了说明（这是本轮唯一对 worker-report 的改动）。**后续简报要加一句：`tests[]` 里不要写 `#` 注释、bash 花括号或裸 `%`。**

### 文档回写（M1）

`游戏当前设计表.md`（文首摘要、§1 通关 720s、§2.3 时间滑条 0～12 分钟、§2.4 大地啊/精益求精/荆棘三行、§2.4b 生生不息文案口径、§2.4c 连射/定神/卡牌屏、§3 与 §4 的暴击伤害公式）、`docs/GAME-SPEC.md`（头标、§1 通关、§2 暴击公式、§4.1 三行、§4.1b 三行）、`更新日志.md`（新增 **v0.12 → v0.13**）、`docs/MODULE-REGISTRY.md`、`docs/派工-总览.md`。

**结论**：ROUND-013 **pass**，五任务 `done`，本轮闭环。

### 发布（M1，同日）与一次「差点打死线上」的教训

- `main` = **6615197**；`gh-pages` = **832d6f2**；热更新实测：线上 `index.html` 指向 **`/rogerlike/assets/index-DvolVoi5.js`**（200），上一版 JS **404**。
- ⚠️ **事故（约 1 分钟，已修复）**：第一次部署推上去的是 **base=`/`** 的构建（`src="/assets/index-Da4lAf_z.js"`），GitHub Pages 上该路径 **404**，线上会白屏。
  **根因**：M1 先用 `GITHUB_PAGES=true` 构建 → 之后 `transition` 触发门禁**重跑了 TASK-034 `worker-report.tests[]` 里的 `npm run build`**（不带环境变量）→ `dist/` 被覆盖成 base=`/` 的版本 → M1 直接把这个 dist 部署了。
  **教训（已写进纪律）**：① `worker-report.tests[]` **不要写 `npm run build`**（它不是 manifest 的验收命令）；② M1 **部署前必须紧挨着重新跑一次 `GITHUB_PAGES=true npm run build`**，中间不要夹任何门禁/其它构建。

---

## 2026-09-12 用户拍板（两条遗留问题结案）

1. **连射「额外一发」口径 → 保持原状**：额外那一发＝**整组弹幕的副本**，照吃散射 / 开眼了等既有加成（散射满配时单次开火 = 主发 2 支 + 额外 2 支）。已把口径写进 `游戏当前设计表.md` §2.4c 与 `docs/GAME-SPEC.md` §4.1b 的 `rapid` 行，**后续窗口不要再按「恰好多 1 支」去改**。
2. **`upgrades/knockback.png` / `upgrades/companionship.png` → 用户确认就是过审版**：此前它们只存在于运行时目录（未入 git）却已随部署上线；现按素材双拷规则补入 git（运行时 + `assets/source/`），并补上 `assets/icon-review/` 的评审副本。`游戏当前设计表.md` §10 与 §2.4 图标口径同步改为「只剩 荆棘 / 滋补 待出图」。**注**：`knockback.png` 图上自带左上红方块，会与程序绘制的「高级 3×3 红点」并存——用户已看过并接受。

---

## 2026-09-12 查收 — ROUND-012 · P42 批次 4（M4 / TASK-030 + M7 / TASK-031 + M5 独立验收 / TASK-032）

用户需求（`docs/P42-内容扩充提案.md` 第 1 节）：给 8 种小怪与地精跟班加**序列帧动画**（用户提供 4 帧素材，要求「像角色那样丝滑」）。
用户信号：用户报「批次 4 的 M5、M4、M7 已完成，请查收」，同时报了一个**严重问题**（见下方专节）。

### 磁盘核对 + 本窗重跑（M1）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M4 / TASK-030 · R1~R2 | 8 种小怪 4 帧时间驱动动画：纯函数取帧、`CREEP_FRAMES=4`、相位错开、暂停停住、缺帧兜底 | ✅ 两条验收 exit 0；**enemies selftest 267 条 PASS / 0 FAIL** |
| M7 / TASK-031 · R1 | 地精跟班 4 帧同口径；不影响索敌 / 软拉绳 / 碰撞伤害 / 加伤移速 | ✅ 一条验收 exit 0；**companions selftest 195 条 PASS / 0 FAIL** |
| M5 / TASK-032 · R1~R3 | 独立验收方（reviewer=M5 ≠ 施工窗 M4/M7）：两份 verify-report + 三个自写探针 | ✅ R1~R3 exit 0；探针 A 素材 77 项、B 小怪动画 30 项、C 地精动画 27 项**全 PASS** |
| M1 本窗全量重跑 | enemies 267 / companions 195 / match 52 / world 82 / player 155 / combat 217 / ui 448 | ✅ **7/7 exit 0，共 1416 条 PASS / 0 FAIL**（与 M5 自测扫描数字完全一致） |
| M1 素材核对 | `小怪/` 8 怪 ×4 帧 + `跟班/地精-2/-3/-4.png`，运行时与 `assets/source/` **逐字节一致**（SHA-256 全等）；小怪目录不含地精 | ✅ |
| 收口 | `transition` ×6 + `audit-round` | ✅ **BASIC + FULL PASS + ROUND_READY_TO_CLOSE** |

被验收版本的 SHA-256 由 M5 钉住（enemies×3 / companions×3），M1 收口期间未再改动业务代码。

### 独立验收发现（M5）

- **F1（low，验收期间已修正并复核）**：M7 的 `worker-report.tests[]` 里有一条 bash 花括号展开写法（`src/game/{world,player,combat}/selftest.mjs`），门禁会用 `cmd.exe` 重跑 → 必然 exit 1，**曾拦死 TASK-031 的 Full Gate**；M7 改成逐条显式路径后通过。**教训：report 的 `tests[]` 会被门禁重跑，只写 cmd.exe 能跑的命令**（与 ROUND-010 的「`tests` 只放验收命令」同源）。
- **F2（low）**：M4 报告写「265 条断言」，实测 **267**（其自留日志也是 267）——纯笔误，本条按 267 记。
- **F3（low）**：负时间兜底两窗不一致——`creepFrameAt` 对 `t<=0` clamp 到帧 0，`goblinFrameAt` 是真取模回绕（-0.1 → 3）。正常游戏 `animT` 只增、不可达，表现层无差别，本轮不回工（文档只写「均不越界」）。
- **F4（low）**：M4 的「4 帧素材存在」断言只查存在性，盖不住「尺寸错 / 备份不一致 / 四帧相同」——M5 探针补齐（解 PNG IHDR 32×32、两处 SHA-256、四帧互不相同）；建议后续把尺寸/哈希断言固化进 selftest。
- **F5（low）**：`goblinFrameAt` 注释与行为不符（注释说 frames 非法时退化「永远 0 帧」，实测回落 `GOBLIN_FRAMES`；真正的单帧退化在 `goblinFrameSheet`）——已记，本轮不回工。
- **F6（low，设计取舍）**：地精相位按 `length % 4` 归桶 → **≥5 只时必然有同帧**（桶内随机抖动仍保证不完全同步）。若将来要任意只数都不同帧，需把相位与实例序号解耦；本轮按设计保留。

### 严重问题专节：游戏页「随机时间自动回到主菜单」

- **用户描述**：测试中页面会随机回到主菜单，无法正常测试；批次 4 做完后「不知为何已解决」。
- **M1 排查**：
  1. **代码里没有任何自我重置路径**：`session.phase = 'menu'` 只在 `session.reset()` 里出现（应用初始化 / 重开）；引擎 `frame()` 只有 `dt` 上限 0.05s 与「单帧异常 → 停帧 + 页面 `[A1:error]` 浮层」，**不会自己回菜单**。
  2. 「回到主菜单」＝ 应用重新初始化 ＝ **整页刷新**。
  3. 时间线完全吻合：那段时间三个窗口正持续保存 `frontend/src/game/enemies/**`、`frontend/src/game/companions/**`；`vite.config.js` 开着 `server.watch`，这些模块没有 HMR 接收点 → Vite 默认**整页 reload**；M1 探针（连 Vite HMR WebSocket 改一次 `enemies/index.js` 再逐字节还原）确证源码改动会即时推送到页面。**窗口一停，现象消失**，与用户观察一致。
  4. **结论：这是「边改源码边在 5173 上玩」的测试通道问题，不是游戏 bug。**
- **给用户的稳定测试通道**：① 玩线上部署站；② 玩本地**构建产物**（`npm run build` + `vite preview`，它不 watch 源码，窗口改文件不会刷新页面）；③ 若要用 5173，请**不要在窗口施工期间**玩。

### 文档回写（M1）

`游戏当前设计表.md`（文首摘要、§6 新增「小怪动画」口径 + 4 处「单帧」改「4 帧循环」、§2.5 地精 4 帧）、`docs/GAME-SPEC.md`（头标、§5 小怪动画、§4.2 地精）、`更新日志.md`（v0.12 补「小怪与跟班动画」段）、`docs/MODULE-REGISTRY.md`、`docs/派工-总览.md`。

**结论**：ROUND-012 **pass**，三任务 `done`，本轮闭环。
**仍待用户拍板（上一轮遗留）**：① 连射「额外一发」口径（当前＝整组弹幕副本）；② `upgrades/knockback.png`、`companionship.png` 两张未过审生成图是否算过审（它们未入 git，但已随部署上线）。

---

## 2026-09-12 查收 — ROUND-011 · P42 批次 3「激发力量」（M6 / TASK-026 + M2 / TASK-027 + M3 / TASK-028 + M7 独立验收 / TASK-029）

用户需求（`docs/P42-内容扩充提案.md` 第 5 节）：新增 `power`「激发力量」——等级每 10 级一次、卡牌屏强制选 1 张；游侠专属池（连射 / 贯穿强化 / 定神）＋ `sp-power` 可叠；不计入羁绊、回忆留痕。
用户信号：用户报「批次 3 的 M6、M2、M3、M7 已完成，请查收」→ M1 磁盘核对 + 本窗逐字复跑 + 收口。

### 磁盘核对 + 本窗重跑（M1）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M6 / TASK-026 · R1~R3 | ui 侧 power 池按角色 / 每 10 级触发 / 唯一性与可叠 / 强制选择 / 卡牌屏结构 / 不计羁绊 / 回忆记录 | ✅ 三条验收 exit 0；`PowerView.vue` 实测含 `选一张` + `scaleX` + `steps(` 且不引 png；`GameShell.vue` 在 `hud.phase === 'power'` 渲染 PowerView 并屏蔽 ESC / 设置入口 |
| M2 / TASK-027 · R1~R3 | combat 侧 `applyPower`：连射 50%/100% 与 0.75s 额外冷却、贯穿强化 +1 穿透且每穿 ×1.5、sp +20 可叠 | ✅ 三条验收 exit 0；M1 复核「额外发也吃既有加成」为**既定口径**（见 F1） |
| M3 / TASK-028 · R1 | player 侧 `applyPower('steady')` / `consumeSteadyCrit()`：静止 0.3s 就绪、只吃一次、移动/受击/死亡重置、与既有计时器共存 | ✅ 一条验收 exit 0 |
| M7 / TASK-029 · R1~R3 | 独立验收方（reviewer=M7 ≠ 施工窗 M6/M2/M3）：三份 verify-report + 自写探针 28/28 | ✅ 10 条命令本窗逐字复跑全 exit 0（含 TASK-029 自身三条） |
| M1 集成 | 三条 selftest + `npm run build` | ✅ ui / combat / player 全 `RESULT PASS` + `✓ built in 485ms`（`index-Ccns_6nk.js`） |
| 收口 | `transition` ×8（026/027/028 `verified→integrated→done`；029 `worker_done→integrated→done`）+ `audit-round` | ✅ **BASIC_GATE_PASS + FULL_GATE_PASS + ROUND_READY_TO_CLOSE** |

M1 独立复核的接线：`match.js` 在 `phase() !== 'playing'` 时冻结对局（power 屏同样冻结），`tryBeginUpgradeOffer()` 只在 `levelup` 相位动作 → `levelup → upgrade → power → playing` 不互相抢相位；`session.applyPowerChoice` 把同一 id 同时交给 `ctx.combat.applyPower` 与 `ctx.player.applyPower`（本模块只调用、不实现）。

### 独立验收发现

- **F1（medium，口径待用户裁决，未回工）**：`rapid` 的「额外一发」实现是**整组弹幕的副本**（复用主发同一份 angles / damage / sizeMul / spec），拿到散射后单次开火 = 主发 2 支 + 额外 2 支 = **4 支**；与用户原话「额外发射一发箭矢」的字面口径有出入。M7 判不 fail、不回工，请 M1 带话请用户拍板：① 保持现状（额外那组照吃既有加成）；② 改成严格「恰好多 1 支箭矢」。
- **F2（low，流程）**：把含 `%` 的 `verify_cmd` 逐字写进 `.cmd` 再用 `cmd /c` 跑，`%` 会被批处理当变量吃掉、**静默削弱断言**（TASK-027 的 R2 因此首跑 exit=1，R1 侥幸仍 PASS）。后续改用**不经过 shell 的字节精确驱动器**（`.task/TASK-029/evidence/_rerun.mjs`）复跑；M2 亦独立踩到同一坑并用 `%%` 转义。
- **F3（low，非缺陷）**：M6 的「power 不计入羁绊」断言在删掉 power 实现后仍 PASS——该断言查的 id 不存在时结论恒为 0，属**回归护栏**而非新功能证据，保留即可，收口时不拿它当功能通过依据。
- **F4（info，实测正确）**：定神最易出错的边界（`fireCd > 0` 被挡下那一帧）**不会白吃**：M7 实测 `tryFire` 返回 false 时 `isSteadyArmed()` 仍为 true，冷却归零后那一枪仍是暴击。
- **F5（流程，M1 已修）**：TASK-029 manifest 的 `allowed_paths` 只列三份 verify-report，漏了 R1/R3 明确要求的 `.task/TASK-029/evidence/` → gate 报越界 32 文件并 POLICY_CONFLICT 停下。M1 补 `.task/TASK-029/evidence/` 后通过。与 ROUND-010 的「manifest 漏 `verify` 字段」同类——**任务书要求与 allowed_paths 必须自洽**，brief 生成后 M1 要自查一遍。

### 文档回写（M1）

`游戏当前设计表.md`（新增 **§2.4c 激发力量**、文首摘要与对齐日期）、`docs/GAME-SPEC.md`（新增 **§4.1b**、头标）。

### 发布（M1，同日）

- `main`：`84c8656` 已推送（含批次 1 / 2 / 3 与派工文档、`更新日志.md` v0.11 → **v0.12**）。
- `gh-pages`：`a66e4c8` 已部署；**热更新实测**：`index.html` 从 `index-Cf9GJ4Ew.js` 切到 `index-Dsq4MMGH.js`（约 20 秒生效），新 JS/CSS **200**、旧 JS **404**，新帧图 `assets/小怪/蘑菇怪-2.png`、`assets/跟班/地精-3.png` 均 **200**。
- ⚠️ 顺带发现（**待用户拍板**）：`frontend/public/assets/upgrades/knockback.png`、`companionship.png` 是**未过审生成图**（86×86 / 276×276，非 12×12 栅格化口径；knockback 图上还自带一个左上红方块，会与程序绘制的「高级 3×3 红点」重叠）。它们**未入 git**，但 Vite 会整份拷贝 `public/`，因此**已随本次部署上线**。要么用户确认这就是过审版（M1 补进 git 并保留），要么 M1 撤回并让 M10 按口径重出。

**结论**：ROUND-011 **pass**，四任务 `done`，本轮闭环。**待用户拍板**：F1 的连射口径（当前实现＝整组副本）。

---

## 2026-09-11 查收 — ROUND-010 · P42 批次 2（M6 / TASK-023 + M2 / TASK-024 + M3 / TASK-025）

用户需求（`docs/P42-内容扩充提案.md` 第 2、3 节）：新增 `荆棘`、`滋补`，新增羁绊 `生生不息`（3/5），测试自选面板按角色过滤。
用户信号：三窗子代理（A 挡，绑定见 `.task/round.json` 的 `subagents`）报完工 → M1 本窗逐个复跑 + 独立验收。

### 磁盘核对 + 本窗重跑（M1）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M2 / TASK-024 · R1 | combat `setThornPicks` / `thornBurst`：4 身位内全体、150%/+50%/层、掷暴击、飘数字、不附带点燃/减速/击退 | ✅ 六条验收 exit 0；M1 独立探针：1/2/3 层 = **30/40/50**、88px 命中 / 88px+1 不命中、critRate=100 时 **45** 且 `meta.crit=true`、0 层零伤害、死目标跳过 |
| M3 / TASK-025 · R1 | player `applyHurtSpeedBuff`：增量式、不叠、到期原样减回、不动 `speedUnits` | ✅ 验收 exit 0；M1 独立探针：96 → **112**（+16 = 0.2×80）→ 刷新不叠 → 1.6s 后**精确回 96**；**与敏捷叠加**（108 → 124 → 108）不互相抹除 |
| M6 / TASK-023 · R1~R4 | 荆棘/滋补条目、生生不息（3/5）、自选面板按角色过滤 | ✅ 四条验收 exit 0 |
| M6 / TASK-023 · R5~R6（attempt=1） | 生存改双属、面板传真实 chargeMax | ✅ 六条验收 exit 0；M1 独立复核 三系计入项 **11 / 5 / 7**、`survive` 双属（qian+sheng）、面板门控与正式池一致 |
| M1 集成 | 7 个 selftest + `npm run build` | ✅ 全 PASS + `✓ built in 445ms` |
| 收口 | `transition` ×3 + `audit-round` | ✅ **BASIC + FULL PASS + ROUND_READY_TO_CLOSE** |

### 独立验收发现

- **F1（P3，M1 规格错误，不打回 worker）**：M1 在 R3 与提案里写「生生不息 5 项与现有三条羁绊**零重叠**」——**表述错误**（三娃本就是小金刚七兄弟之一）。worker 未按错误文本硬搬，改用**双属羁绊**并回报；M1 采纳，文档措辞已更正。
- **F2（P2，打回后修复）**：worker 把 `生存` 从天行健**搬**去生生不息（而非像三娃那样双属）→ 天行健计入项被削 **11 → 10**，用户未要求。M1 要求返工，现已恢复 **11**。
- **F3（P3）**：worker 顺手把测试自选面板改成走 `availableUpgrades`（正确），但视图无 combat 上下文 → `chargeMax` 取默认值，`唯快不破` 因门控在面板中不可选。已要求把真实 `chargeMax` 经 `GameShell → SettingsView` 传入，现与正式池一致。
- **F4（P4，误判已撤回）**：worker 担心「树也吃荆棘伤害」；M1 核实真实普通树在 `world`（只走 `hitWorld` 子弹通道、不在 `combat.targets`）→ **吃不到荆棘**，与「普通树仅子弹销毁」不冲突。
- **F5（P4，流程）**：worker 把交叉核对命令写进 `worker-report.tests`，而门禁会重跑 `tests` → 被另一并行窗口正在改的 `ui/selftest` 连累，导致 TASK-024 首轮收口误卡。已在新 brief 明确：`tests` 只放 manifest 验收命令。

### 文档回写（M1）

`游戏当前设计表.md`（荆棘/滋补新行、生生不息羁绊行含双属说明、图标空白项补 2 项、文首摘要）、`docs/GAME-SPEC.md`（§4.1 两行 + §4.3 羁绊行 + 头标）、`docs/P42-内容扩充提案.md`（把「零重叠」更正为双属口径）。

**结论**：ROUND-010 **pass**，三任务 `done`，本轮闭环。

**流程变更（用户指示）**：本批之后**不再用子代理充当 Mn 窗口**——A 挡下没有第二个窗口做独立验收（脚本禁止同窗既工人又验收、路径重叠又禁并行验收窗），缺了 skill 的「搜剿」隔离效果。下一轮起 `gears.collaboration` 回 **P**，由用户开真实窗口、M1 出 brief 并本窗重跑收口。

---

## 2026-09-11 查收 — ROUND-009 · P42 批次 1（M6 / TASK-021 + M2 / TASK-022）

用户需求（P42 提案 `docs/P42-内容扩充提案.md` 第 1 节）：技巧 −0.15、唯快不破降普通、强化射击限游侠。
用户信号：M2（run_id `d867e841-…`）与 M6（run_id `edcc7e18-…`）先后报「完工，`transition worker_done`」；两窗并行（文件不重叠）。

### 磁盘核对 + 本窗重跑（M1）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M2 / TASK-022 · R1 | `CHARGE_UPGRADE` 0.2 → 0.15（`CHARGE_MAX_SEC` 0.75 不动）；断言改成「5 次到 0」 | ✅ 本窗复跑 exit 0；独立探针序列 `0.75 → 0.60 → 0.45 → 0.30 → 0.15 → 0.00 → 0.00`，第 4 次仍 >0、第 5 次归 0、第 6 次钳 0，`reloadSec` 同步 |
| M6 / TASK-021 · R1 | 技巧文案 → `蓄力时间 −0.15`（U+2212） | ✅ 本窗复跑 exit 0 |
| M6 / TASK-021 · R2 | 唯快不破去掉 `tier: advanced`，**门控迁移**后仍只在 `chargeMax <= 0` 时进池 | ✅ 本窗复跑 exit 0；独立探针：`chargeMax=0.75` 时 normal/advanced **都不含** only_fast，`=0` 时 normal **含** |
| M6 / TASK-021 · R3 | 强化射击按 `charId` 过滤（仅游侠）；desc 去函数分支 | ✅ 本窗复跑 exit 0；独立探针：ranger advanced=9 含、warrior/mage advanced=8 **不含**，两桶都不含 |
| M1 独立验收 | 分桶纯净性（普通桶不得混入高级项、反之亦然） | ✅ 三角色 6 个桶全部干净（确认 worker 简化 `wantAdvanced` 分支时没有删掉 `if (isAdv) return false`） |
| M1 集成 | `match.selftest.mjs` + `npm run build` | ✅ RESULT PASS + `✓ built in 467ms`（新包 `index-B_W_vAhi.js`） |
| 收口 | `transition` ×2（每步本窗 Full Gate 通过） | ✅ `audit-round` = **BASIC_GATE_PASS + FULL_GATE_PASS + ROUND_READY_TO_CLOSE** |

### 独立验收发现

- **F1（P3，不打回）**：测试模式「升级选项自选」面板直接列 `UPGRADES` + `grantUpgrade`，不经 `availableUpgrades` 过滤 → 战士/法师仍能在**测试面板**自选到强化射击（M6 主动披露、未擅自扩大范围；R3 只要求池子过滤，已满足）。→ 已登记为批次 2 的 M6 追加项。
- **F2（P4，接受）**：强化射击限游侠后，战士/法师的天行健可计入种类 11 → 10，档 8 仍可达，阈值不动。

### 文档回写（M1）

- `游戏当前设计表.md`：§2.4 技巧 → −0.15（5 个到 0）；强化射击 → **高级 / 游侠专属**（去「其他角色 +15」）；唯快不破 → **普通**（保留门控说明）；高级项 **10 → 9**；高级出现机制 → 代码口径（等级 5 的倍数第 1 格必出 + 其余 30%，非 5 倍数不出）；文首对齐摘要更新。
- `docs/GAME-SPEC.md`：技巧 −0.15、强化射击游侠专属、唯快不破普通、高级出现机制（§4.1 表格 + §9 清单两处）、头标「最后对齐」更新。

**结论**：ROUND-009 **pass**，两任务 `done`，本轮闭环。

---

## 2026-09-11 查收 — ROUND-008 · P41（M7 / TASK-020 恶魔跟班口径 + 兔子基础伤 10；attempt=2 定稿）

用户信号：M7（协作挡 **A**，子代理以 M7 窗身份执行，绑定见 `.task/round.json` 的 `subagents`）先后三次报「TASK-020 完工，`transition worker_done`」。

### 三轮经过

| attempt | 交付 | M1 独立验收结论 |
|---------|------|------------------|
| 0 | R1 兔子 20→10；R2 恶魔索敌忽略占用、可共享目标；R3 软拉绳（去 3 身位硬墙） | R1/R3 过；**F1（P2）**：万物一心档 8 会把恶魔改派到玩家目标 → 未收口；用户实机又报「追着 Boss 远离角色」 |
| 1 | R4 恶魔豁免档 8；R5 索敌半径＝离角色 3 身位（3.5 身位释放）；R3 旧断言按新语义替换 | R4/R5 过（探针：Boss 5 身位外 400 帧零锁定、零掉血）；**探针 5 抓到回归**：`claimed` 预登记被并入分配循环，靠前跟班会抢走靠后跟班已锁定的目标 |
| 2 | R6 恢复 `claimed` 预登记 + 新断言 `goblin earlier in list does not steal target held by later goblin` | ✅ 六条验收本窗全绿，五节探针全合格 → **收口** |

### 磁盘核对 + 本窗重跑（M1）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M7 / TASK-020 · R1 | 兔子 `RABBIT_DMG` 20→10，`rabbitDamage()` 逻辑不动，selftest 六处期望值下调 | ✅ `RESULT PASS rabbit base 10` + companions selftest 188 PASS |
| M7 / TASK-020 · R2 | 恶魔索敌忽略「已被占用」，可取与兔子/地精同一目标 | ✅ `demon shares nearest target with other companion` |
| M7 / TASK-020 · R3 | 软拉绳保持 6 身位、无硬墙；旧断言 `demon soft leash can leave keep radius` 按新语义删除 | ✅ `demon leash assertions updated` + match/ui selftest + `vite build ✓ 435ms` |
| M7 / TASK-020 · R4 | 恶魔豁免万物一心档 8 的优先目标 | ✅ `demon exempt from tier 8 priority target` |
| M7 / TASK-020 · R5 | 索敌半径＝离角色 3 身位内（3.5 身位释放，带滞回） | ✅ `demon ignores target beyond 3 body of player`、`demon hits target inside 3 body of player` |
| M7 / TASK-020 · R6 | 恢复「不抢已被占用目标」预登记 | ✅ `claimed pre-registration assertion` |
| M1 独立验收 | 对抗探针五节（追 Boss / 档 8 / 共享目标 / 滞回 / claimed） | ✅ 证据 `.task/TASK-020/evidence/m1-verifier-probe.mjs`、`m1-verifier-probe5.mjs`、`m1-verifier-probe-r2.mjs` |
| M1 独立验收 | 断言非平凡性（worker 先不加修复跑新断言 → 唯一 FAIL）＋ 磁盘边界（只改 3 个 allowed_paths 文件） | ✅ 独立复现同一结论；`git status` 无越界业务改动 |

### 关键实测数字（M1 探针，用户实机问题的验收证据）

- **追 Boss**：Boss 在 5 身位外、2 身位处有普通怪，跑 400 帧 → 恶魔**从未锁定 Boss**、Boss **掉血 0**、恶魔离角色最大 **2.2 身位**，近怪掉血 **686**（不是靠不打架换来的）。
- **档 8**：优先目标为 8 身位外远怪 → 地精被改派去打远怪（档 8 对其他跟班仍生效），恶魔仍锁半径内最近的。
- **滞回**：目标 2.5 身位锁定 → 3.2 身位保持 → 4.0 身位放弃。
- **claimed**：attempt=1 时靠前地精会抢走靠后地精已持有的目标；attempt=2 后改选另一只，回归消除。

### 收口

`worker_done → verifying → verified → integrated → done`（每步本窗 Full Gate 通过）；`audit-round` = `BASIC_GATE_PASS + FULL_GATE_PASS + ROUND_READY_TO_CLOSE`；验收报告 `.task/TASK-020/verify-report.json`（reviewer=M1 ≠ 实施窗口 M7）。设计表与 `docs/GAME-SPEC.md` 已按定稿口径回写（恶魔：3 身位索敌 / 3.5 身位释放 / 6 身位绳长 / 档 8 豁免）。

**遗留（P4，接受不返工）**：R6 的预登记遍历整份 list，恶魔上一帧的目标也会占住 claimed，靠前的非恶魔跟班会避开它一帧——与 §2.5 口径一致、不影响 R2 与档 8，无玩家可感影响。

---

## 2026-09-10 查收 — ROUND-008 · P41（M7 / TASK-020 首轮，已被上方 attempt=2 定稿取代）

> 存档：attempt=0 的本窗重跑记录（当时因 F1 未收口）。

| 项 | 结果 |
|----|------|
| R1 / R2 / R3 本窗复跑 | ✅ 三条 exit 0（companions selftest 194 条） |
| F1（P2，待裁决） | 万物一心档 8 提前返回，把玩家目标派给所有跟班（含恶魔）→ R2 的「始终」在该路径不成立 |
| F2（P3，待确认手感） | 软拉绳平衡点 = 6 身位：1~6 身位目标可命中，8/10 身位够不到；目标消失 8 秒后回到 2.0 身位舒适环 |
| F3（P4，已自纠） | M1 首版探针把玩家放在世界原点，被 `clampWorld()` 钳到 `≥BODY`，造成「恶魔一次都没打到」的假象；改到世界中心后推翻，缺陷探针已删除 |

---

## 2026-09-10 收尾 — ROUND-007（M3 / TASK-018、M4 / TASK-019）

> 接班 M1 本窗复跑收口。两个任务由上一任 M1 于 2026-09-09 走完 `transition`；本条只补「本轮复跑证据」，不改状态。

### 本窗重跑证据（M1，2026-09-10）

| 检查项 | 结果 |
|--------|------|
| `node src/game/match.selftest.mjs` | ✅ RESULT PASS |
| `node src/ui/selftest.mjs` | ✅ RESULT PASS |
| `npm run build` | ✅ ✓ built in 1.81s |
| `taskctl.py audit-round` | ✅ **BASIC_GATE_PASS + FULL_GATE_PASS + ROUND_READY_TO_CLOSE** |
| `.task/TASK-018`（M3）可逆黑框转场与边缘控件层级 | ✅ done；四条 verify 全过；元素隔离契约 PASS |
| `.task/TASK-019`（M4）主菜单无路径线跑动与朝向修正 | ✅ R1 PASS clean runner lane；R2 PASS runner facing |

**结论**：ROUND-007 **pass**，本轮闭环、无未交窗口、无 `POLICY_CONFLICT`。

**环境说明**：本轮首次 `audit-round` 在受限文件沙箱下报 `FULL_GATE_FAIL`，根因是 `npm run build` 中 vite 探测路径触发 `spawn EPERM`（沙箱管道限制，非代码缺陷）；放开权限后复跑全绿，`rerun.json` 已被真实结果覆盖。

**仍欠的账（用户指示暂不动）**：P39 四任务（TASK-014~017）的查收叙事未写入本文件；`docs/编制-2026.md` §4b「当前派工」仍停在 ROUND-001/002。

---

## 2026-09-08 查收 — P36 局外按钮边框一致性修复（M6 / M3 + M7 验收）

用户信号：两窗报「已完成，请查收」→ M7 独立验收。

### 磁盘核对（M1 本窗重跑）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M6 / TASK-011 | .rl-action-btn / .rl-action-row 新增；toggle/tiny/picker-x 恢复 3px+硬阴影；selftest P36 断言 | ✅ R1~R4 全 PASS |
| M3 / TASK-012 | 三视图 scoped 1px/box-shadow:none 覆盖清理；回忆列表项改 rl-action-row；信息容器仍 1px | ✅ R1~R4 全 PASS |
| M7 / TASK-013 | 独立复跑 + 构建产物级联模拟 + 边界 + 两份 verify-report | ✅ pass；findings 均 P3/P4 |

### 客观审计（M1）

| 检查项 | 结果 |
|--------|------|
| 浏览器计算样式（`scripts/ui-button-audit.mjs`） | ✅ **14/14 OK**：交互控件 border=3px + 非空硬阴影（tiny=2px）；信息容器 1px |
| hover 填充 | ✅ 交互控件 hover 无 background（仅 .rl-action-row::before 箭头） |
| 六屏色板审计 | ✅ 8/8 PASS（草地背景未变） |
| 局内 HUD | ✅ 探针 RESULT PASS hud-font-original |
| selftest / build | ✅ RESULT PASS / ✓ 469ms |
| 截图 | ✅ p36-01…08.png + ingame-09-ingame-hud.png |

**结论**：P36 **pass**。按钮统一为 3px 像素边 + 硬阴影语言，信息容器保持 1px；首页基准未变；局内 HUD 零影响。

---

## 2026-09-08 查收 — P35 局外 UI 重构为阳光草地同世界观（M6 / M2 / M3 + M7 验收）

用户信号：三窗报「已完成，请查收」→ M6 返工 → M7 独立验收。

### 磁盘核对（M1 本窗重跑）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M6 / TASK-007 | 字体作用域（Zpix 只局外、HUD 恢复原等宽栈）、局外背景=浅草地、轻量 1px 框、P34 清理、hover 不变填充、selftest 断言改 P35 | ✅ 本窗复跑 R1~R6 全 PASS |
| M2 / TASK-008 | 首页/选角/难度：草地直载、删横条、悬停箭头/描边/下压 | ✅ R1~R4 全 PASS |
| M3 / TASK-009 | 设置/回忆/结算：轻量浅色容器、开关不用荧光绿 | ✅ R1~R4 全 PASS |
| M7 / TASK-010 | 独立验收：13 条 verify 复跑 + 边界 + P34 清理 7 条 | ✅ 全部 pass，清理清单 7/7 有证据 |

### 视觉复核（M1 集成）

| 检查项 | 结果 |
|--------|------|
| 六屏截图 | ✅ `docs/screenshots/ui-redesign/p35-01…08.png` |
| 色板审计（`scripts/ui-audit.py --expect grass`） | ✅ 8/8 PASS：背景 #c5e0a3 草地 0.69~0.87，夜蓝/苔藓绿 ≈0.0000 |
| 局内 HUD 截图 + 字体探针 | ✅ `ingame-09-ingame-hud.png`；探针 **RESULT PASS hud-font-original**（topbar/botbar/hearts = 原等宽栈，无 Zpix） |
| hover 填充 | ✅ `.rl-btn:hover`/`.rl-pick.on:hover`/`.rl-mem-item:hover` 均无 background，仅位移/描边/箭头 |
| 边界 | ✅ HudOverlay.vue / UpgradeView.vue / game/** / match.js / backend 零改动 |
| 禁物/素材 | ✅ 无城堡/天空/山/鸟/帐篷/篝火/卷轴/羊皮纸/告示板；无新增图片；无在线字体/图片 |

### 收口

TASK-007/008/009/010 全部 `done`（`transition` 收口，每步 Full Gate 通过）。

**结论**：P35 **pass**。P34 的夜蓝/墨绿石碑方向已废弃；局外与局内同属阳光草地世界，局内 HUD 零影响。待用户实机最终拍板。

---

## 2026-09-08 查收 — P34 局外 UI 像素化重设计（M6 / M2 / M3 + M7 验收）

用户信号：M3、M6、M2、M7 分别报「已完成，请查收」。

### 磁盘核对（M1 本窗重跑）

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M6 / TASK-002 | 本地 Zpix 字体 @font-face、9 个色板 token、.rl-slab/.rl-plaque/.rl-glyph-btn/.rl-hairline、HUD 未回归、级联修复 | ✅ 本窗复跑 `PASS font / tokens / slab / hud-intact / cascade night=139 legacy=110` |
| M2 / TASK-003 | 首页/选角/难度 三屏模板类名、文案、事件、悬停提示 | ✅ `PASS menu / char / difficulty / behavior` |
| M3 / TASK-004 | 设置/回忆/结算 三屏、滑条/开关/自选面板、悬停、事件 | ✅ `PASS settings / memories / result / behavior` |
| M7 / TASK-005 | selftest 断言同步 + 构建 + 15 条 verify_cmd 复跑 + 边界核查 | ✅ selftest `RESULT PASS`（401 PASS / 0 FAIL）、build ✓ 485ms |
| M2 / TASK-006 | 第三方复核 M7 的断言与构建 | ✅ 发现 `.rl-hairline` 断言缺失 → M7 补齐（selftest.mjs:1229-1231）→ M1 复核闭环 |

### 视觉复核（M1 集成）

| 检查项 | 结果 |
|--------|------|
| 六屏+结算截图（`scripts/ui-shots.mjs`） | ✅ 8 张，`docs/screenshots/ui-redesign/final-*.png` |
| 色板审计（`scripts/ui-audit.py`） | ✅ 8/8 PASS：背景 #1b202b、旧绿残留 0（选角卡从 26113px → 0） |
| 局内 HUD 零改动 | ✅ HudOverlay.vue 未改；pixel.css HUD 规则字符串全在 |
| 字体随包 | ✅ `frontend/dist/assets/fonts/zpix.woff2`（966156 字节） |

### 收口

TASK-002/003/004/005/006 全部 `done`（`transition` 收口，Full Gate 每步通过）；TASK-001 环境自检已 done。

**结论**：P34 **pass**。纯视觉改动，玩法/文案/事件/ESC 全未变；局内 HUD 未触碰。待用户实机最终拍板。

---

## 2026-08-29 查收 — P33（M8）

| 检查项 | 结果 |
|--------|------|
| 路径边界（mtime 核对） | ✅ 只动 `ui/pixel.css`、`ui/selftest.mjs`、`views/StartView.vue`、`views/MoreView.vue` |
| 选角阴影 | ✅ 实机验证：3 张角色卡各含 `img.rl-avatar-shadow`，src=`Other/Shadow.png`；CSS 26×12（对局 2× 换算）、上缘贴脚线 |
| 回忆布局 | ✅ `rl-mem-cols`：升级面板 `flex: 0 0 62%`、`rl-mem-bond-rail` 竖排裸 chip；实机详情页渲染正常（无羁绊记录显示占位文案） |
| 悬停保留 | ✅ `rl-bond-tip` + `rl-bond-tier` 机制在 |
| selftest / build | ✅ RESULT PASS；430ms |

**结论**：M8 **pass**。P33 关环。立绘下移量与阴影观感待用户实机最终拍板。  
**阻塞项**：无。

---

## 2026-08-29 派工 — P33（选角阴影 / 回忆布局重排 / 阴影贴身）

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P33 | ✅ 已写（M8 单窗：选角立绘下移+Shadow 阴影；回忆页升级选项 ≥60%、羁绊改局内同款裸 chip 右置、两栏总宽=黑框宽、悬停提示保留；黑框内立绘阴影贴身） |
| 窗口 | M8 **in_progress** |

**结论**：等待 M8「请查收」。  
**阻塞项**：无。

---

## 2026-08-24 — 项目交接

| 检查项 | 结果 |
|--------|------|
| 交接文档 | ✅ `docs/交接计划.md`（与 FIX-PLAN/HANDOFF 系列同处）：现状 / 文档地图 / 协作协议 / P25 全部设计定稿（含两处待定项与推荐默认）/ 工程拆分 / 发布流程 / 踩坑实录 |
| P25 设计定稿 | ✅ 与负责人逐项确认：毒刺怪（260/20/45s 阶、0.70+0.02 无帽、抗 1 身位、4 结晶 20% 高级）、高级结晶（紫边 +5 经验逐个掷）、冰人（抗 70%、3800、150 结晶 10%）、七兄弟（千里眼高级 20%/层、三娃护甲层、四娃 10%攻/s、五娃 20%/0.3s 高级、六娃失锁脉冲、七娃改名）、羁绊小金刚（仅档 7，七色脉冲 1.5 身位 ×1.3 / 30%/0.4s）、击退高级项、蝎子 5s 错峰、弹幕 17s、红圈预警、环绕生成、移速纯时间制 |
| 进行中移交 | M10 图标（负责人手绘中）；毒刺怪贴图待核实落盘；待定项 2 条（五娃 +0.2/层 单位、四娃五娃高级池范围） |
| 后续 | 项目移交第三方小组，按 `交接计划.md` §六 拆分实施 P25 |

**结论**：交接完成。  
**阻塞项**：无。

---

## 2026-08-28 查收 — P32（M8 ✅ / M5 ✅）

用户：窗口已完成，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M8 | 回忆界面立绘下移 + 底部阴影 + 悬停（信息+待机动画，与选角一致）；羁绊显示模块 + 属性条两栏布局 + 羁绊悬停提示；高级升级机制（等级 %5 必出高级 + 其余槽独立 30%）；击退文案 +1 | ✅ MoreView.vue/pixel.css/session.js/constants.js、ui/selftest.mjs 全 PASS |
| M5 | 所有角色基础击退 0.5 身位；高级「击退」0.5→1；combat 自测同步 | ✅ weapons/index.js（BASE_KNOCKBACK_BODIES=0.5、KNOCKBACK_BONUS_BODIES=1）、combat/index.js spawnShot 加基础击退、combat selftest 全 PASS |

### 自测

| 检查项 | 结果 |
|--------|------|
| 7 模块 selftest | ✅ 全 RESULT PASS |
| npm run build | ✅ 467ms |

**结论**：M8 / M5 **pass**。P32 关环（回忆界面立绘/阴影/悬停 + 羁绊模块两栏布局 + 高级升级：等级%5必出、必出当次其余槽独立30%（**非必出等级不出高级**，打回修复后确认） + 所有角色基础击退0.5 + 高级击退+1）。

---

## 2026-08-24 查收 — P30（M11 ✅ / M4 ✅ / M7 ✅ / M1 ✅）
## 2026-08-24 查收 — P30（M11 ✅ / M4 ✅ / M7 ✅ / M1 ✅）

用户：所有窗口已完成，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M11 | 恶魔软性跟随 | ✅ `companions` 恶魔改为软跟随（不空气墙抽搐；仍优先离角色最近的怪；selftest 通过） |
| M4 | 六娃范围 3 身位 | ✅ `UNLOCK_RADIUS_UNITS=3`、`UNLOCK_RADIUS=3*BODY` |
| M7 | 地图背景装饰物 | ✅ `DECOR_STICK_COUNT=25`/`STONE=75`、`createDecorationField`（不重叠、静态、`env.draw` 背景层；world selftest 通过） |
| M1 | 素材落盘（8 张装饰物） | ✅ 已拷两边 |

### 自测

| 检查项 | 结果 |
|--------|------|
| 7 模块 selftest | ✅ 全 RESULT PASS |
| `npm run build` | ✅ 439ms |

**结论**：M11 / M4 / M7 / M1 **pass**。P30 关环（恶魔软跟随、六娃 3 身位、地图火柴堆/石头背景装饰已落地）。

---

## 2026-08-28 查收 — P31（M1 直调：装饰物密度/大小）

用户：火柴堆/石头太少、素材太大 → 数量再翻几倍、大小改 1/3（用保底下限）。方案 A 已拍板：石头 2400 / 火柴堆 800，绘制缩放 1/3 但最长边不低于 6/7px。

### 磁盘核对

| 检查项 | 结果 |
|--------|------|
| 常量 | ✅ `DECOR_STICK_COUNT=800`、`DECOR_STONE_COUNT=2400`、`DECOR_DRAW_SCALE=1/3`、`DECOR_STICK_MIN_SIZE=7`、`DECOR_STONE_MIN_SIZE=6` |
| 播种 | ✅ `decorations.js` 改**抖动网格**：全图均匀、数量 3200 精确可达、与树/装饰物不重叠、静态 |
| 绘制 | ✅ 源图 ×1/3 缩放（保底 6/7px），碰撞盒对齐绘制尺寸 |
| world selftest | ✅ `deco total 3200 / sticks 800 / stones 2400 / 不重叠 / 避开树 / env 集成` |

### 自测

| 检查项 | 结果 |
|--------|------|
| 7 模块 selftest | ✅ 全 RESULT PASS |
| `npm run build` | ✅ 2.02s |

**结论**：M1 直调 **pass**。地图装饰物：火柴堆 800 / 石头 2400（每屏平均≈2.4 个），绘制 1/3 且保底 6/7px，"随处可见"已落地。

---

## 2026-08-24 查收 — P29（M7 ✅ / M8 ✅ / M11 ✅ / M1 ✅）

用户：所有窗口已完成，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M7 | 强化结晶紫边 | ✅ `pickups.js` 紫十字加宽包住蓝十字（world selftest：紫边厚臂、非小尖） |
| M8 | 回忆角色立绘 | ✅ `MoreView` 血条左侧 `RangerPortrait`（`memories.js` 记录 charId/charName） |
| M8 | 选角 hover 待机动画 | ✅ `StartView` hover 时 `RangerPortrait :animate="hoverId===id"` |
| M8 | 万物一心计数/显示复核 | ✅ `listActiveBonds` 仅 `bondRank` 非 0 才 push；`syncUnity` 按 `uniqueBondCount` |
| M11 | 万物一心消费复核 | ✅ `setUnityTier` tier0 清增益（companions selftest：tier 0 clears unity gain） |
| M1 | `syncUnity` 运行时探针（`[A1:unity]` 日志） | ✅ 已加 |

### 自测

| 检查项 | 结果 |
|--------|------|
| 7 模块 selftest | ✅ 全 RESULT PASS |
| `npm run build` | ✅ 449ms |

**结论**：M7 / M8 / M11 / M1 **pass**，P29 关环。**万物一心“1种就2档”**：按代码 `bondRank(count=1)=0`、`tier0` 无增益，M8/M11 复核无误——**疑似旧构建缓存**，请在实机**硬刷新（Ctrl+Shift+R）**；若仍复现，控制台 `[A1:unity] rank=…` 发我。

---

0
## 2026-08-24 查收 — P28（M4 ✅ / M5 ✅ / M7 ✅ / M8 ✅ / M11 ✅ / M1 ✅）

用户：所有窗口已完成，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M7 | 高级结晶紫边 | ✅ pickups.js 垫紫色外覆层（world selftest：advanced 紫边/普通无紫） |
| M5 | 七色脉冲七彩动画 | ✅ combat drawPulse 用 hsl(PULSE_HUES[i]) 七彩 |
| M5 | 伤害数字不截断+暴击数据 | ✅ notifyDamage(ent,disp,{base,crit,critMul,damage}) |
| M4 | 伤害数字动画 | ✅ dmgnum.js：先非暴击→红色×倍率→滚动到实际 |
| M8 | 三娃新机制 | ✅ session：sanwaN=max(1,11−次数)，每次选 +1 甲、每 N 级再发并重置 |
| M8 | 跟班升级文案/入池 | ✅ tamer/demon/slime_gg/companionship 入池+文案 |
| M11 | 驯兽师/恶魔/史莱姆gg/伴我同行 | ✅ companions：addTamer/addDemon/addSlimeGG/addCompanionship；恶魔 3 身位/近角色优先/角色伤联动 |
| M1 | main.js 全局错误外显；match.js onDemonLink 接线（角色伤害联动）；素材落盘 | ✅ |

### 自测

| 检查项 | 结果 |
|--------|------|
| 7 模块 selftest | ✅ 全 RESULT PASS |
| npm run build | ✅ 637ms |

**结论**：M4 / M5 / M7 / M8 / M11 **pass**；M1 已补 onDemonLink 接线（恶魔角色伤害联动）。**待实机**：恶魔改武器后攻击重算的持久化（若后续升级覆盖，联调再加固）。

> ⚠️ **P28 后查（伤害数字封顶）**：M5 连续 3 次零改动（`dealDamage.applied` 仍 `beforeHp-afterHp`、selftest 仍用无 takeHit mock），M1 按协议**硬停接管**：`dealDamage.applied = Math.max(0, damage)`、selftest 改用真实钳血敌人断言 `d===DMG_MAX`、并把旧断言改为 raw；另补 `match.js` `onDamage/onPlayerDamage` 透传 `meta`。7 模块 selftest + build 全绿。详见 `docs/BLOCKERS/M5-伤害数字封顶-hardstop-M1接管.md`。

---

## 2026-08-24 查收 — P27（M4 ✅ / M5 ✅ / M6 ✅ / M8 ✅）

用户：所有窗口已完成，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M4 | 六娃 `#3F48CC` 扩散圈 | ✅ `UNLOCK_RING_COLOR=#3F48CC` + `drawUnlockRings`（越扩越淡、不超半径） |
| M4 | 三娃护盾视觉 | ✅ `render/ranger.js` `getArmoredShadow` 给**阴影素材**描 `ARMOR_OUTLINE=#e0b84a`；`drawArmorOutline` 矩形已删 |
| M5 | 四娃基础燃烧 30%/s | ✅ `FIRE_DMG_PER_PICK=0.3`/BOOST 0.4；selftest `0.3/0.4` + `ignite dps 30%` |
| M6 | 红圈全怪（含裂怪）/ 怪物成长 / 冰人（4000、可离开、伤害2、子弹蓝）/ 强化怪 | ✅ |
| M8 | 小金刚文本两行/三娃每3个1甲/四娃文案30% | ✅ |
| M1 | `match.js` `hpGrowthAdd=10` | ✅ 已做 |

### 自测

| 检查项 | 结果 |
|--------|------|
| 7 模块 selftest | ✅ 全 RESULT PASS |
| `npm run build` | ✅ 522ms |

**结论**：M4 / M5 / M6 / M8 **pass**。P27 关环（小金刚文本、全怪红圈、六娃扩散圈、怪物成长、冰人、强化怪、四娃30%、三娃每3个1甲均已落地）。

---

## 2026-08-24 派工 — P26（P25 回修）

| 检查项 | 结果 |
|--------|------|
| 定案 | 拾取音效 −50%；小金刚羁绊展示/配色对齐前两羁绊（达 7 才显示）；三娃护盾→素材轮廓黄边；毒刺怪基础 6；五娃减速真 bug（enemies 未读 slowFactor）；四娃/五娃粒子（红/蓝、越升越浅、生灭）；六娃失锁真 bug（getTargets 未传 + unlockUntil/unlockT 字段不一致）；红圈占位保留（等 M10） |
| HANDOFF-P26 | ✅ 已写（M4/M6/M8；M1 接线） |
| M1 接线 | ✅ `match.js`：createPlayer 传 `getTargets`；createEnemies hooks 补 `isTargetBlind`（桥接 `player.isEnemyUnlocked`） |
| 验证 | ✅ match selftest PASS；`npm run build` 580ms |

**结论**：等待 M4 / M6 / M8「请查收」。  
**阻塞项**：无。

---

## 2026-08-24 查收 — P26（M4 ✅ / M8 ✅ / M6 ✅）

用户：其他窗口已完工，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M4 | 三娃护盾：素材最外圈描黄，去竖长方形 | ✅ |
| M6 | 毒刺怪基础 6 | ✅ `STINGER_COUNT0=6`（`6+floor(秒/180)`） |
| M6 | 五娃减速消费 | ✅ `enemies/index.js:354` / `ice.js:47,145` 移动乘 `slowFactor??1` |
| M6 | 四娃红 / 五娃蓝粒子 | ✅ `enemies/index.js` particles（burn/slow、上升、越升越浅、结束/死亡清） |
| M6 | 红圈占位保留 | ✅ |
| M8 | 拾取音效 −50% | ✅ `SFX_GAIN.pickup=2.5` |
| M8 | 小金刚展示/配色对齐前两羁绊 | ✅ |
| M1 | 六娃 `match.js` 接线 | ✅ |

### 自测

| 检查项 | 结果 |
|--------|------|
| 7 模块 selftest | ✅ 全 RESULT PASS（含 enemies 减速/粒子断言） |
| `npm run build` | ✅ 564ms |
| mtime 证据 | `enemies/index.js` 08-25 22:32、`spawner/index.js` 08-25 22:30 → M6 已改 |

**结论**：M4 / M6 / M8 **pass**。P26 关环（六娃、五娃减速、四娃/五娃粒子、毒刺怪 6、拾取音效 −50%、小金刚展示对齐均已落地）。

---

## 2026-08-24 查收 — P25（M4 / M5 / M6 / M7 / M8 + M1 接线）

用户：其他窗口已完工，请查收。

### 磁盘核对

| 窗口 | 检查项 | 结果 |
|------|--------|------|
| M4 | 三娃护甲（`armor/addArmor/getArmor`，可叠、挡一次完整伤）；六娃失锁脉冲角色侧（`unlockDurationFor` 1.0s 起 +0.5s/层、applyUnlockPulse、unlockRemaining） | ✅ `player/index.js` + `player/selftest.mjs` |
| M5 | 四娃点燃（3s、10%/s、+10%/层）、五娃减速（20%/0.3s、+0.2s/层）、七色脉冲（3.0s、1.5 身位、×1.3、30%/0.4s、不击退/不点燃/不破失锁）、高级击退（+0.5 身位/层）、集齐后大娃/二娃/四娃/五娃 +10%（加法） | ✅ `combat/index.js` + `weapons/index.js` |
| M6 | 毒刺怪（300s 接管蘑菇怪、260/20@45s、0.70+0.02 无帽、抗 1 身位、4 结晶 20% 高级）、冰人（3800/0.3/150 结晶 10%/弹幕 17s）、红圈预警 0.8s、环绕生成、蝎子独立 CD（首射 0~5s 错峰、5s 节奏）、失锁敌人侧消费 | ✅ `enemies/`、`spawner/` 与 selftest |
| M7 | 高级结晶（紫边、+5 经验、`spawnCrystalAt` 独立概率、advanced 标记、磁铁/黑洞照吸） | ✅ `world/`、`pickups/` 与 selftest |
| M8 | 七兄弟入池文案（二娃~六娃、黑洞改名七娃、大娃保留）、四选一、小金刚 chip「小金刚 n/7」悬停、HUD 护甲显示、高级击退入池 | ✅ `ui/constants.js`、`ui/session.js`、`views/HudOverlay.vue` |
| 路径边界 | `match.js` 未被子窗口改动（M1 集成路径干净） | ✅ |

### M1 接线

| 检查项 | 结果 |
|--------|------|
| 合体触发 | ✅ `match.js` 新增 `syncVajra()`：读 `session.bonds` 的 `BOND_VAJRA`，`complete` 时 `combat.setVajraComplete(true)`（七色脉冲随之在 combat.update 触发） |
| 失锁/护甲钩子 | ✅ 失锁由 enemies 读 player.unlockRemaining；护甲 HUD 由 session.snapshot.armor → GameShell → HudOverlay |

### 自测

| 检查项 | 结果 |
|--------|------|
| player / combat / enemies / world / companions / ui / match selftest | ✅ 全部 RESULT PASS |
| `npm run build` | ✅ 522ms |
| 实机 | ✅ M1 打开 `http://localhost:5173/`（复用 Vite；浏览器已在对应窗口打开） |


---

## 2026-08-24 查收 — P24（M8 / M11 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| 路径边界（mtime 核对） | ✅ M8 只动 `ui/constants.js`、`ui/session.js`；M11 只动 `companions/**` |
| 天行健文案 | ✅ **实机验证**：档 2/4/6/8 四条「随等级提高…（每 N 级 +X）」 |
| 万物一心阈值 | ✅ `BOND_UNITY_THRESHOLDS=[2,4,6,8]`；**实机验证**：3 种跟班升级 → 档 2；悬停四条精简文案 |
| 小金刚 | ✅ 大娃/黑洞 `bond: BOND_VAJRA`；**实机验证**：两种都选 → chip「小金刚 2」，悬停「大娃与黑洞两种都选择后解锁 / 档 2 · 敬请期待」 |
| M11 新档位 | ✅ `UNITY_ATK_SHARE=0.2`、+0.2 设计单位（×80）、getPriorityTarget 消费含活目标/在表校验与回退；companions selftest PASS |
| M1 接线 | ✅ `match.js`：combat 侧 `onPlayerDamage` 记录玩家击中活敌（跟班 onDamage 不经过，防自锁）；`createCompanions({ getPriorityTarget })`；每局重置 |
| 全量 selftest | ✅ 7 模块全 RESULT PASS |
| `npm run build` | ✅ 541ms |
| 备注 | 档 8（优先目标）需 8 种跟班才可达，当前 4 种最多档 4；优先目标逻辑仅自测通过，实机验证待未来跟班扩充 |

**结论**：M8 / M11 / M9 **pass**。P24 关环。  
**阻塞项**：无。

---

## 2026-08-24 派工 — P24（羁绊改版：天行健文案 / 万物一心 2-4-6-8 / 小金刚）

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P24 | ✅ 已写（M8 文案+阈值+小金刚；M11 新档位效果+优先目标；M1 getPriorityTarget 接线） |
| GAME-SPEC §4.3 | ✅ 万物一心 2/4/6/8 新效果；新增小金刚行 |
| 窗口 | M8 / M11 **in_progress**；M1 接线 pending |

**结论**：等待 M8 / M11「请查收」。  
**阻塞项**：无。

---

## 2026-08-23 — M1 直改（拾取音效真根因：误读 notifyExp 返回值语义）

| 检查项 | 结果 |
|--------|------|
| 现象 | 用户：拾取音只在与升级音重合时出现；其余全部正常 |
| 实测（title 探针 + 无敌局） | ✅ `onCrystal(0)` 连续出现且 HUD 经验在涨 → `shell.notifyExp` 回传的是**本次升了几级**（普通结晶 = 0），不是「获得了经验」 |
| 根因 | ✅ M1 在 P20 接线时把 `gained > 0` 当成「获得经验」，导致拾取音只在触发升级的那颗结晶播放（恰与升级音同帧） |
| 修复 | ✅ `match.js` onCrystal：音效与升级判断解耦——每颗吸收即 `sfx.play('pickup')`；`gained` 仅用于 +1 特效；探针已全部移除 |
| 验证 | ✅ match / ui selftest PASS；build 619ms |

**结论**：pass。此前「素材电平低」是并存的次要因素（增益 ×5 仍有效），本条才是触发缺失的主因。  
**阻塞项**：无。

---

## 2026-08-23 — M1 直改（match.js 拾取音效去节流）

| 检查项 | 结果 |
|--------|------|
| 用户反馈 | ✅ P23 后拾取音可闻但与升级音重合；要求：每颗结晶吸收即播、可叠加、不等待 |
| 改动 | ✅ `match.js` onCrystal 去掉 100ms 节流（M1 集成路径）；`lastPickupSfxMs` 移除 |
| 验证 | ✅ match / ui selftest PASS；build 551ms |

**结论**：pass。设计表已同步。  
**阻塞项**：无。

---

## 2026-08-23 查收 — P23（M8 + M1 联调）

| 检查项 | 结果 |
|--------|------|
| 路径边界（mtime 核对） | ✅ 本环只动 `ui/pixel.css`、`ui/sfx.js`、`ui/settings.js`、`views/GameShell.vue`、`views/SettingsView.vue`、`views/MoreView.vue` |
| 增益表 | ✅ `SFX_GAIN = { pickup: 5.0, levelup: 2.8 }`；`a.volume = min(1, vol × gain)`；心跳走 `startHeartbeat` 不增益 |
| 菜单钳制 | ✅ `.rl-screen` 四边全走 `var(--rl-stage-*, 回退)` |
| 齿轮 / 「……」复位 | ✅ `.rl-gear top:10px right:10px`、`.rl-ellipsis left:10px bottom:10px`（窗口参照） |
| 羁绊悬停 | ✅ `.rl-bond pointer-events:auto`；**实机验证**：hover 弹出「天行健：不同种类升级集齐解锁档位」+ 档 2/4/6/8 全档位（`reached` 深浅类在） |
| 羁绊单列 | ✅ `.rl-bonds flex-direction: column; align-items: flex-end`；282px 保留，断言同步 |
| 回忆详情 | ✅ `min(520px, 94vw)` 起、min-height 220、`rl-mem-lv` 等级突出 |
| 测试右面板 | ✅ **实机验证**：「测试选项」面板承载全部测试项，关闭即收起 |
| 三滑条 | ✅ **实机验证**：总音量/背景音乐/音效音量 三滑条 70%；`bgm = 总×背景`、`sfx = 总×音效`（watch 三项）；bgmVolume 默认 0.7 持久化 |
| 全量 selftest | ✅ 7 模块全 RESULT PASS |
| `npm run build` | ✅ 554ms |
| 临时文件 | ✅ `__soundtest.html` 已删 |

**结论**：M8 **pass**。P23 关环。拾取音效增益效果待用户实机复听确认。  
**阻塞项**：无。

---

## 2026-08-23 派工 — P23（拾取增益 / 菜单钳制 / 羁绊悬停 / 回忆排版 / 测试面板 / 三滑条）

| 检查项 | 结果 |
|--------|------|
| 根因调查（音效） | ✅ M1 真机探针 + 浏览器解码实测：事件/play 调用/解码/接受度/音量全部正常；**拾取素材 RMS −28dB 过轻**（其他 −14~−19）→ 代码增益修复；`__soundtest.html` 临时页留作用户自验（P23 关环删） |
| 根因调查（羁绊悬停） | ✅ `.rl-bonds` 容器 `pointer-events:none`（pixel.css:678）致 hover 永不触发；P20 结构从未可达 |
| HANDOFF-P23 | ✅ 已写（M8 单窗 8 项；含音量三滑条模型：实际 = 总音量 × 分项） |
| 窗口 | M8 **in_progress** |

**结论**：等待 M8「请查收」。  
**阻塞项**：无。

---

## 2026-08-23 查收 — P22（M8 局内 UI + M1 接线）

| 检查项 | 结果 |
|--------|------|
| 路径边界（mtime 核对） | ✅ 本环只动 `ui/pixel.css`、`views/HudOverlay.vue`、`views/UpgradeView.vue`、`views/MoreView.vue` |
| 深色框 `.rl-frame--dark` | ✅ pixel.css:52 |
| 顶部通栏 | ✅ `.rl-topbar.rl-frame--dark`：左心/中计时/右侧位；`left/top/width` 全走 `var(--rl-stage-*, fallback)` |
| 底部经验通栏 | ✅ `top: calc(stage-top + stage-height − 24px)` 对齐画布底；Lv/经验条/蓄力条并入 |
| 齿轮下移 | ✅ `top: stage-top + 40px`（通栏下方）、`left: stage-left + stage-width − 46px`（画布右内侧） |
| 升级卡 | ✅ 160px 深色卡面 |
| 282px 断言 | ✅ 未变值，css 与 selftest 一致保留 |
| 全量 selftest | ✅ 7 个模块全 RESULT PASS |
| `npm run build` | ✅ 567ms；CSS 13.26→14.32 kB |
| M1 接线 | ✅ `App.vue` `--rl-stage-*`（resize + ResizeObserver） |

**结论**：M8 / M9 **pass**。P22 关环，UI 改版（P19 菜单环 + P22 局内环）全部落地。  
**阻塞项**：无。

---

## 2026-08-23 查收 — P21（M4 / M6 / M8 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| 路径边界（mtime 核对） | ✅ M4 只动 `player`；M6 只动 `enemies`（含 ice.js）`spawner`；M8 只动 `ui` `views`；`match.js` 未被子窗口碰 |
| M4 `onHurt` | ✅ 实扣血调一次；无敌/godMode 不调；死亡那下也调 |
| M6 数值 | ✅ `SNAIL_HP_PER=20`、`SLIME_X1_HP_PER=22`；`ICE_MAN_HP=3300`；`ICE_REGEN_DELAY_SEC=3`/`RANGE=BODY*2`/`PER_SEC=20`，进范围停并重置、不超上限、走 onHeal |
| M8 sfx 加固 | ✅ `playing` Set 持有引用到 `ended`/`error`；`preload='auto'`；`shoot='射箭声音.wav'`；`hurt` 入表 |
| M8 排版 / 音量 | ✅ `rl-nudge--inline` 提高等级同行；`sfxVolume` 默认 0.7 clamp 持久化；GameShell watch `sfx.setVolume`；音乐音量仍只控 BGM |
| M1 接线 | ✅ `createPlayer({ onHurt: () => sfx.play('hurt') })` |
| 全量 selftest | ✅ player / combat / enemies / world / companions / ui / match 全 RESULT PASS |
| `npm run build` | ✅ 548ms |
| 开游戏实机 | ✅ 5173 常驻；刷新即 P21 版（音效逐项请用户复听） |

**结论**：M4 / M6 / M8 / M9 **pass**。P21 关环。  
**阻塞项**：无。

---

## 2026-08-23 派工 — P22（局内 UI：HUD 顶部通栏 / 齿轮下移 / 画布钳制 / 换装）

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P22 | ✅ 已写（M8 单窗；M1 的 App.vue 变量接线已完成并 build 通过） |
| `App.vue` 画布矩形 → `--rl-stage-*` | ✅ resize + ResizeObserver 双通道 |
| 窗口 | M8 **in_progress**；M9 接线 in_progress（已做完，待随环关闭） |

**结论**：等待 M8「请查收」。  
**阻塞项**：无。

---

## 2026-08-23 派工 — P21（音效修复与新增 / 怪物成长 / 冰人回血 / 设置排版 / 音效音量）

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P21 | ✅ 已写（M4 onHurt / M6 数值与冰人回血 / M8 sfx 加固+排版+音效音量） |
| 素材 | ✅ `射箭声音.wav`、`受伤音效.mp3` 两边拷入，SHA256 一致 |
| pickup 不响排查 | 已排除：URL 可达（编码后 200）、文件为合法 ID3v2.4 MP3、onCrystal 路径正确、selftest 绿；指向 sfx.js 一次性 Audio 无引用被掐断 → P21 M8 加固修复 |
| GAME-SPEC / 怪物属性表 / ASSETS | ✅ 数值、回血设定、音效清单已更新 |
| 窗口 | M4 / M6 / M8 **in_progress**；M1 接线 pending |

**结论**：等待 M4 / M6 / M8「请查收」。  
**阻塞项**：无。P22（局内 UI）待 P21 关环后立即派。

---

## 2026-08-23 查收 — P20（M5 / M6 / M8 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| 路径边界（mtime 核对） | ✅ M5 只动 `combat` `weapons`；M6 只动 `spawner`；M8 只动 `ui` `views`；`match.js` 未被子窗口碰 |
| M5 `onFire` | ✅ `hooks.onFire?.(fireKindForChar(id))`；不播音；combat selftest PASS（散射单次） |
| M6 数值 | ✅ 蘑菇 32/10、蜗牛 50/15、x-1 120/17、蝎子 105/15；冰人 `ICE_MAN_HP=3000`、`ICE_DASH/BARRAGE/ORCHID_PERIOD=12/22/32`、重生 ×1.4ⁿ |
| M8 文案 | ✅ 穿透「穿透 +1」；敏捷「移速 +0.15」且 `MOVE_SPEED_BONUS===0.15`；强化射击 `descFor(item, charId)` 游侠激光原文 / 其他「+15」（三选一+回忆） |
| M8 羁绊悬停 | ✅ `.rl-bond-tip` + `.rl-bond-tier.reached` 深浅档位；绝对定位不占布局 |
| M8 音效 | ✅ `ui/sfx.js` 8 键映射、心跳独占循环轨、音量跟随；GameShell 接 levelup/defeat/victory/heartbeat 四相位 |
| M1 接线 `match.js` | ✅ combat hooks `onFire → sfx.play(kind)`；结晶 `onCrystal` pickup 节流 100ms |
| 全量 selftest | ✅ player / combat / enemies / world / companions / ui / match 全 RESULT PASS |
| `npm run build` | ✅ 551ms |
| 开游戏实机 | ✅ Vite 5173 常驻（复用）；浏览器刷新即 P20 版 |

**结论**：M5 / M6 / M8 / M9 **pass**。P20 全窗完成。  
**阻塞项**：无。

---

## 2026-08-23 派工 — P20（怪物血量 / 冰人 / 文案 / 羁绊悬停 / 音效）

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P20 | ✅ 已写（M5 钩子 / M6 数值 / M8 文案+悬停+音效） |
| 音效素材 8 个 | ✅ 桌面 `Roger-png/游戏音乐` → `frontend/public/assets/游戏音乐/` + `assets/source/游戏音乐/`，SHA256 两边一致 |
| M10 关闭 | ✅ 用户确认 20 个升级图标全部采用（唯快不破/精益求精三处一致）；「+1」特效永久程序绘制（P5/P9 遗留关闭） |
| GAME-SPEC / 怪物属性表 | ✅ 数值与音效清单已更新 |
| 窗口 | M5 / M6 / M8 **in_progress**；M1 接线 pending |

**结论**：等待 M5 / M6 / M8「请查收」。  
**阻塞项**：无。

---

## 2026-08-23 查收 — P19（M8 UI 像素框架 · 菜单环）

| 检查项 | 结果 |
|--------|------|
| 路径边界（mtime 核对） | ✅ 本环只动 `ui/pixel.css`、`ui/selftest.mjs`、`views/StartView.vue`、`views/SettingsView.vue`，无越界 |
| token 层 | ✅ `:root` 变量齐全（色板 + 间距/字号标尺 + 遮罩/阴影）；`:root` 外零残留 hex；176 处 `var(--rl-*)` |
| `.rl-frame` / `--pop` | ✅ 外墨内亮双层硬边框 + 硬投影；另有 `.rl-divider` / `.rl-ribbon` |
| 像素红线 | ✅ 无圆角（仅 reset 0）/无渐变/无模糊；过渡只用 `steps(2, end)`；focus-visible 加强 |
| 只改皮 | ✅ StartView script 与改版前逐字一致（props/emit/文案）；`rl-char-tip`/`pre-line` 机制原样；SettingsView 文案红线全在 |
| toggle 色义 / 死样式 | ✅ `.rl-toggle.on` 用 `--rl-sub` 绿；`.rl-pick.locked`、`.rl-avatar.q` 已删 |
| selftest | ✅ RESULT PASS（含新增 token 层 / rl-frame / 死样式断言） |
| `npm run build` | ✅ 539ms；CSS 7.94→12.51 kB |
| 开游戏实机 | ✅ M1 已开 5173 过菜单流（浏览器） |

**结论**：M8 / P19 **pass**。P20 局内环（顶部通栏 / 齿轮下移 / 画布钳制 / 升级卡结算换装）待派。  
**阻塞项**：无。

---

## 2026-08-23 派工 — P19（UI 像素框架 · 菜单环）

| 检查项 | 结果 |
|--------|------|
| 基线 `node src/ui/selftest.mjs` + `npm run build` | ✅ RESULT PASS；Vite 构建通过（P18 后代码） |
| HANDOFF-P19 | ✅ 已写（M8 单窗：token 层 + `.rl-frame` + 标题/选角/难度/设置换装） |
| GAME-SPEC §7 | ✅ 新增第 9 条视觉规范 |
| 窗口 | M8 **in_progress**；P20（局内环：顶部通栏/齿轮下移/画布钳制）待 P19 查收后派 |

**结论**：等待 M8「请查收」。  
**阻塞项**：无。编号说明：P18 已被玩法环（蝎子/羁绊/难度二）占用并关闭，UI 环顺延为 P19/P20。

---

## 2026-08-23 查收 — P18（M5 / M6 / M7 / M8 / M11 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| M5 `combat/**` `weapons/**` | ✅ FIRE_INTERVAL 0.315；唯快不破仍 ÷1.2 |
| M6 `enemies/**` `spawner/**` | ✅ 蝎子 300s；史莱姆 115/180s；冰人 CD 15/25/35、死后 180s 重生血 2800、掉 300；灰树 80 / 自损上限 8+分钟；getHpGrowthAdd |
| M7 `world/**` `pickups/**` | ✅ treeHp extra；spawnCrystalBurst 300 抖动 |
| M8 `ui/**` `views/**` | ✅ 羁绊不重复 id；去掉升级白送；难度二 2 杀+600s；右侧 rl-bonds |
| M11 `companions/**` | ✅ setUnityTier 3/6/9 |
| combat / enemies / world / companions / ui / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |
| `match.js` | ✅ getHpGrowthAdd；spawnCrystalBurst；ice_man → addBossKill |

**结论**：M5 / M6 / M7 / M8 / M11 / M9 **pass**。  
**阻塞项**：唯快不破 / 精益求精图标仍待定（与本环无关）。

---

## 2026-08-23 派工 — P18

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P18 | ✅ 已写 |
| 设计表 / GAME-SPEC / 怪物属性表 / ASSETS | ✅ 蝎子怪、羁绊、0.315、Boss 重生、难度二、灰树 80 / 自损上限 8 |
| 素材 | ✅ `小怪/蝎子怪.png` 两边都有 |
| 窗口 | M5 / M6 / M7 / M8 / M11 **in_progress**；M9 pending；M10 仍等唯快不破/精益求精 |

**结论**：等待子窗口请查收。  
**阻塞项**：唯快不破 / 精益求精图标未到（与本环无关）。

---

## 2026-08-22 查收 — P17（M5 / M6 / M7 / M8 / M11 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| M5 `combat/**` `weapons/**` | ✅ 1 身位长条；线性伤/长；3 大娃满蓄约 77px 非正方形；takeHit 实伤数字 |
| M6 `enemies/**` `spawner/**` | ✅ 移速 0.62/0.77/0.87/1.17；甲像素黄边；takeHit 返回 14 |
| M7 `world/**` | ✅ hitAt dealt；hitSlashAt OBB |
| M8 `ui/**` `views/**` | ✅ 选角两行原文；bat 普通池 15；`upgrades/bat.png` |
| M11 `companions/**` | ✅ 蝙蝠伤 7；每杀 200 回 1 心 |
| combat / enemies / world / companions / ui / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |
| `match.js` | ✅ `hitSlashAt`；跟班 `onHeal` |

**结论**：M5 / M6 / M7 / M8 / M11 / M9 **pass**。  
**阻塞项**：唯快不破 / 精益求精图标仍待定（与本环无关）。

---

## 2026-08-22 派工 — P17

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P17 | ✅ 已写 |
| 设计表 / GAME-SPEC / 怪物属性表 / ASSETS | ✅ 战士 1 身位长条、移速再减、蝙蝠、甲描边、实伤数字 |
| 素材 | ✅ `跟班/蝙蝠.png` 与 `upgrades/bat.png` 两边都有 |
| 窗口 | M5 / M6 / M7 / M8 / M11 **in_progress**；M9 pending；M10 仍等唯快不破/精益求精 |

**结论**：等待子窗口请查收。  
**阻塞项**：唯快不破 / 精益求精图标未到（与本环无关）。

---

## 2026-08-21 查收 — P16（M5 / M6 / M8 / M11 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| M5 `combat/**` `weapons/**` | ✅ 扩散 alpha 淡出；crit 帽 100%；refine ×1.7；only_fast /1.2；游侠第一次 +5 激光，战士第一次 +15 无激光 |
| M6 `enemies/**` `spawner/**` | ✅ 移速 0.65/0.8/0.90；蜗牛甲 1；冰人 draw 48 / 子弹 200 / 3 兰花；回 10；第 2 次回血叠甲；冰人移速仍 0.7 |
| M8 `ui/**` `views/**` | ✅ 选角文案；pierce 16/31；crit「暴击率 +10」；empower 全角色；only_fast 门；refine / strange_egg；only_fast/refine 空白图 |
| M11 `companions/**` | ✅ 蛋 100/300 阶段；20%/50%/80%；自己每杀 100 +1 |
| M10 | ⏳ 唯快不破 / 精益求精待定，局内空白 |
| combat / enemies / companions / ui / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |
| `match.js` | ✅ `getKills: () => session.kills` |

**结论**：M5 / M6 / M8 / M11 / M9 **pass**。M10 图标待定。  
**阻塞项**：唯快不破、精益求精图标未到。

---

## 2026-08-21 派工 — P16

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P16 | ✅ 已写 |
| 设计表 / GAME-SPEC / 怪物属性表 / ASSETS | ✅ 蛋阶段 100/300、甲、移速、强化射击全角色、冰人不减移速 |
| 素材 | ✅ `跟班/奇怪的蛋-x/y/z.png` 与 `upgrades/strange_egg.png` 两边都有 |
| 窗口 | M5 / M6 / M8 / M11 **in_progress**；M9 pending；M10 等唯快不破/精益求精图 |

**结论**：等待子窗口请查收。  
**阻塞项**：唯快不破 / 精益求精图标未到，局内空白方块。

---

## 2026-08-21 查收 — P15（M4 / M5 / M6 / M8 / M10 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| M4 `player/**` `render/**` | ✅ 局内不画目标字；queue 空实现 |
| M5 `combat/**` `weapons/**` | ✅ 法师 ×3.0 / 公式 42.5 / 0.3s 扩散；战士身前+满蓄伤×1.6；暴击 0 / ×1.5 / +10 |
| M6 `enemies/**` `spawner/**` | ✅ 冰人 2000 / 子弹 224 / 冲刺 8 身位 1～6；dummy 999/500/右侧 3 身位 |
| M8 `ui/**` `views/**` | ✅ 难度悬停目标；crit 入池；自选升级+红 X；火柴人开关 |
| M10 `upgrades/crit.png` | ✅ public + source 两边都有 |
| player / combat / enemies / ui / match selftest | ✅ RESULT PASS |
| `match.js` | ✅ 去掉 queueObjectiveFx；setDummyEnabled；木桩可出伤害数字 |
| GameShell | ✅ ESC 先关 picker；grant-upgrade → applyUpgrade |

**结论**：M4 / M5 / M6 / M8 / M10 / M9 **pass**。P15 全窗完成。  
**阻塞项**：无。

---

## 2026-08-21 派工 — P15

| 检查项 | 结果 |
|--------|------|
| HANDOFF-P15 | ✅ 已写 |
| 设计表 / GAME-SPEC / 怪物属性表 | ✅ 冰人 2000、冲刺 8 身位、法师×3.0 扩散、暴击、测试木桩 |
| 窗口 | M4 / M5 / M6 / M8 **in_progress**；M9 pending；M10 等暴击图 |

**结论**：等待子窗口请查收。  
**阻塞项**：无。

---

## 2026-08-20 查收 — P14（M4 / M5 / M6 / M8 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| M4 `player/**` `render/**` | ✅ spawnHealNum 绿边；OBJECTIVE_LIFE=5；createPlayer 不自动开始 |
| M5 `combat/**` `weapons/**` | ✅ 强化箭矢x 激光 680；法师 ×2.6 / 未蓄 8px；战士无限穿透、击退 0.5×穿透、满蓄 ×1.6；knockbackScale |
| M6 `enemies/**` `spawner/**` | ✅ 冰人 420s/1000/×0.5；兰花 1 血无接触；弹幕/冲刺/逃跑常量对齐 |
| M8 `ui/**` `views/**` | ✅ 满蓄模式；testElapsedSec 0～600；选角悬停 4/22/0 |
| player / combat / enemies / ui / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |
| `match.js` | ✅ queueObjectiveFx；onHeal；开局 setElapsedSec |
| GameShell 滑条 | ✅ 仅测试模式且时间滑条变化时写入 elapsed（避免改音量把时间打回 0） |

**结论**：M4 / M5 / M6 / M8 / M9 **pass**。P14 全窗完成。  
**阻塞项**：无。

---

## 2026-08-20 派工 — P14

| 检查项 | 结果 |
|--------|------|
| 素材拷入 public + source | ✅ 冰人 / 兰花 / 强化箭矢x / 怪物子弹 |
| HANDOFF-P14 | ✅ 已写 |
| 窗口 | M4 / M5 / M6 / M8 **in_progress**；M9 pending |

**结论**：等待子窗口请查收。  
**阻塞项**：无。

---

## 2026-08-20 查收 — P13 M7 复验 + M1 接线

| 检查项 | 结果 |
|--------|------|
| M7 `world/**` `pickups/**` | ✅ magnetBonus += 1；范围 2→3→4 身位 |
| world selftest | ✅ RESULT PASS |
| `App.vue` notifyExp 回传 | ✅ 结晶升级能入队 +1 |
| `match.js` 进 levelup 当帧停顿 | ✅ 不再 shell.tick |
| match / ui / combat selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |

**结论**：M7 / M9 **pass**。P13 全窗完成。  
**阻塞项**：无。

---

## 2026-08-20 查收 — P13（M4 / M5 / M6 / M7 / M8）

| 检查项 | 结果 |
|--------|------|
| M4 `player/**` `render/**` | ✅ HP_BY_CHAR 3/4/2；DMG_ADVANCE=12；≥100 黄 ≥200 红 |
| M5 `combat/**` `weapons/**` | ✅ 图集切帧、法师 25/0/4/×2.3、战士 22/1/2/1.5 身位单次、大娃 +40%、强化 ceil×2.5/+2/溢出 |
| M6 `enemies/**` `spawner/**` | ✅ SLIME_X1_UNLOCK_SEC=240；239 不刷、240 第一波 |
| M7 `world/**` `pickups/**` | ❌ 仍 `magnetMul *= 1.5`；selftest 仍断言 ×1.5 / 2.25 |
| M8 `ui/**` `views/**` | ✅ 磁铁/大娃/强化射击文案；HUD 跟 hpMax |
| player / combat / enemies / ui selftest | ✅ RESULT PASS |
| world selftest | ⚠️ 绿，但是旧规格（×1.5），不算本环完成 |
| `match.js` 接线 | ⏸ 等 M7 |

**结论**：M4 / M5 / M6 / M8 **pass**。M7 **fail** 打回。  
**阻塞项**：磁铁未改为每次 +1 身位。

---

## 2026-08-20 查收 — P12（M4 / M5 / M8 / M11 + M1 接线）

| 检查项 | 结果 |
|--------|------|
| M4 路径 `player/**` `render/**` | ✅ charId / deathAnimDone / addEmptyHpMax / dmgnum.js |
| M5 路径 `combat/**` `weapons/**` | ✅ 法球、挥砍不飞、满蓄×1.25、empower_shot、onDamage；挥砍/强化箭未 chromaBlack |
| M8 路径 `ui/**` `views/**` | ✅ 三角色解锁、空血 11/21/31、强化射击仅游侠 |
| M11 路径 `companions/**` | ✅ 命中 onDamage / spawnDamageNum |
| `match.js` 接线 | ✅ charId、deathAnimDone 后再 notifyDead、伤害数字绘制 |
| player / combat / ui / companions / match selftest | ✅ RESULT PASS |
| `npm run build` | ✅ |

**结论**：M4 / M5 / M8 / M11 / M9 **pass**。  
**阻塞项**：无。

---

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
