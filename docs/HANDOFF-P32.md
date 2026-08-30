# HANDOFF-P32

> M1 派工 · 日期：2026-08-28
> 本环开窗：**M8**（UI+升级机制）+ **M5**（武器/击退）。
> 并行开窗 → 各自完成后说「M{n} 已完成，请查收」→ 回 M1 查收。

## 需求总览（5 条）
1. 回忆界面角色立绘：下移、加对局同款底部阴影、悬停展示角色信息并触发待机动画（与选角一致）。
2. 回忆界面：属性条与升级选项之间新增「羁绊显示模块」，宽度与升级选项区对齐，属性条总长 = 升级选项区 + 羁绊模块，各羁绊悬停提示效果。
3. 所有角色新增基础能力：初始默认 **0.5 攻击击退值**（身位）。
4. 高级升级选项「击退」效果：**0.5 → 1** 身位。
5. 高级升级选项出现机制：**该次升级到达的等级 %5==0（含5）时必出 1 个高级项**；其余槽位**各自独立 30%** 概率出高级。

---

## M8 任务（frontend/src/ui/** + frontend/src/views/**）

### 8.1 回忆界面（MoreView.vue + pixel.css）
`frontend/src/views/MoreView.vue` 的「对局详情」`rl-mem-hero`：
- **立绘下移**：调整立绘容器，让角色立绘视觉中心下移（可用 padding-top / align-items 微调），避免显得偏上。
- **底部阴影**：参照对局脚下阴影 `assets/characters/Other/Shadow.png`，在立绘底部绘制/贴同一张阴影素材（可复用 `RangerPortrait` 或在其下方叠一个 `<img>` 阴影，风格对齐对局 `drawShadow`：阴影宽约 13px、高 6px，位于脚底）。仅视觉，不参与交互。
- **悬停交互**：给立绘加 `@mouseenter/@mouseleave`，悬停时：
  - `RangerPortrait` 加 `:animate="hover"`（待机动画，复用选角 `StartView.vue` 的做法）。
  - 展示角色基本信息介绍。**复用选角 `formatCharStats(charById(memCharId))`**（基础属性 + 角色特点），作为悬停提示（tooltip）展示。
- 参照：`frontend/src/views/StartView.vue` 选角 `@mouseenter="hoverId=ch.id"` 与 `@mouseleave="hoverId=''"`、`rl-char-tip` 展示方式。

### 8.2 羁绊显示模块 + 属性条布局（MoreView.vue + pixel.css）
- 在「升级选项」区与顶部属性条之间新增**羁绊模块**（`rl-mem-bonds`）。
- **布局**：顶部属性条横跨「羁绊模块 + 升级选项区」两列；羁绊模块宽度与「升级选项区」对齐（两栏等宽，可 flex 两列）。属性条整体视觉长度 = 两栏总宽。
- **内容**：用 `listActiveBonds(current.upgrades)`（`ui/session.js` 已导出）计算本局已激活羁绊（天行健/万物一心/小金刚，仅当前已激活档位）。每项显示羁绊名 + 当前档位（rank）；无激活羁绊时显示「暂未激活羁绊」占位。
- **悬停提示**：每项羁绊 `@mouseenter`/`title`（或自定义 tooltip）展示效果，取 `BOND_DESC[id]` + `bondTiers(id)` 逐档效果。`BOND_DESC`/`bondTiers` 在 `frontend/src/ui/constants.js` 已导出。
- 注意：`MoreView.vue` 需引入 `listActiveBonds`、`BOND_DESC`、`bondTiers`、`formatCharStats`、`charById`（多数已可从 `ui/constants.js` / `ui/session.js` 取）。

### 8.3 高级升级出现机制（ui/session.js）
- 改 `pickUpgradeChoices(combat, count, random, opts)`：
  - 读取触发等级：`const lvl = opts.level | 0`（M8 同时更新调用方传 `level`）。`mandatory = lvl > 0 && lvl % ADVANCED_OFFER_EVERY === 0`（`ADVANCED_OFFER_EVERY=5`）。
  - **每槽独立判定**：遍历每槽 i：
    - 若 `mandatory && i === 0` → 强制铺高级（若高级池非空）。
    - 否则 `if (rng() < ADVANCED_OFFER_CHANCE)` → 该槽高级（`ADVANCED_OFFER_CHANCE=0.3`）。
    - 高级池取不到时（空）回退普通池。
    - 普通/高级都从对应池 `splice` 取，避免同一次三选一重复（高级池也去重）。
  - **保持** 二娃「四选一」`erseChance` 的 +1 槽逻辑（新增槽同样按上述独立判定）。
- 调用方位置：
  - `rollOffer`（`session.js`）：把 `offerIndex` 改成同时传 `level: session.level - session.pending + 1`（该次升级对应角色等级；若连升多级，能精确对应到各级）。`offerIndex` 可保留但不再作为高级触发依据。
  - `snapshot`（`session.js` 约 924 行）兜底生成三选一也传 `level: session.level`。
- `ADVANCED_OFFER_EVERY` 仍=5；`ADVANCED_OFFER_CHANCE` 仍=0.3（语义从「必出位概率」变为「每槽独立概率」）。
- 若保留 `isAdvancedOffer` 导出，更新其语义或标注废弃；无其他外部调用时可直接删/改。

### 8.4 击退文案（ui/constants.js）
- `UPGRADES` 中 `{ id: UPGRADE_KNOCKBACK, ... desc: '命中击退 +0.5 身位' }` → `'命中击退 +1 身位'`。

### 8.5 ui 自测（ui/selftest.mjs）同步
- `击退文案` 断言 → `== '命中击退 +1 身位'`。
- 高级出现机制相关断言重写（原「第5次必出」「第4次不含高级」「第5次30%未中」「第10次可出」需按新语义更新）：
  - `pickUpgradeChoices(null, 3, rng, { level: 5 })`（任一 rng）应**至少含 1 个高级**（必出）。
  - `pickUpgradeChoices(null, 3, rng, { level: 4 })` 不应必出；用 rng 控制可验证「每槽独立 30%」。
  - 示例：`()=>0`（恒小于0.3）时 level=4 的 3 槽应全高级；`()=>0.9` 时 level=4 全为普通；`()=>0` 时 level=5 至少 1 高级且其余槽也高级。
- 其余升级池/二娃判定不动。

---

## M5 任务（frontend/src/game/weapons/** + frontend/src/game/combat/**）

### 5.1 基础击退 0.5（所有角色）
- `frontend/src/game/weapons/index.js`：新增 `export const BASE_KNOCKBACK_BODIES = 0.5`。
- `frontend/src/game/combat/index.js` `spawnShot` 的击退计算（约 453 行）：
```js
const knockback = (id === 'warrior'
  ? warriorKnockback(weapon.pierceBonus ?? 0)
  : knockbackForCharge(r)) + BASE_KNOCKBACK_BODIES * BODY + knockbackBonusForPicks(weapon.knockbackPicks ?? 0)
```
（需从 weapons 导入 `BASE_KNOCKBACK_BODIES`，`BODY` 已导入。）

### 5.2 高级「击退」效果 0.5 → 1
- `frontend/src/game/weapons/index.js`：`KNOCKBACK_BONUS_BODIES = 0.5 → 1`（`knockbackBonusForPicks` 每层 +1 身位）。
- `warriorKnockback`（每穿透 +0.5）**保持不变**（该函数只算穿透加成，基础 0.5 在 combat 侧加）。

### 5.3 combat 自测（combat/selftest.mjs）更新（基础 0.5 + 高级 1 后）
已知受影响断言（请按新值重算；多数取整误差 <0.5 已放宽）：
- `full knockback 2 BODY`：满蓄游侠 → 现 `2*BODY` → **`2.5*BODY`**（`player.x + 40 + BODY*2.5`）。
- `combat uncharged + resist → 0 kb`：未蓄 `BODY` + 基础 `0.5*BODY` = `1.5*BODY`，怪抗 `BODY` → 净推 `0.5*BODY`。旧「=0」不再成立，改为 **`snailX + BODY*0.5`**（若设计上想保留「抗性抵消未蓄」，需另加判据，但默认按新平衡改）。
- `warrior full kb 0`：`slash.knockback === 0` → **`=== BODY * 0.5`**。
- `knockback bonus per pick`：`knockbackBonusForPicks(2)` → `KB_BONUS=1` 后为 `2*BODY`（断言 `- BODY` 改 `- BODY*2`）。
- `knockback +0.5 BODY`（P25 高级击退 1 层 + 满蓄）：现 `BODY*2.5` → **`BODY*3.5`**（`2*BODY` 满蓄 + `1*BODY` 高级 1 层 + `0.5*BODY` 基础）。
- `knockbackForCharge`、`warriorKnockback`、`applyKnockback` 显式传距的用例**不改**（它们不依赖基础/加成）。
- 自测跑通为准；若个别断言有取整差异，以实际命中位移为准并保留宽松阈值。

---

## 验收
- M5：`node src/game/combat/selftest.mjs` 全 PASS。
- M8：`node src/ui/selftest.mjs` 全 PASS。
- 集成：M1 跑全部 7 模块自测 + `npm run build` + 打开游戏实机验证回忆界面/选角悬停/升级高级必出/击退位移。
