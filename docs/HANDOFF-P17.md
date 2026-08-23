# 交接 — P17（选角文案 / 移速 / 战士长条挥砍 / 蝙蝠 / 甲描边 / 实伤数字）

> **主导**：M1  
> **日期**：2026-08-22  
> **本环窗口**：M5、M6、M7、M8、M11。接线（蝙蝠 `addBat`、树的伤害数字）等各窗请查收后由 **M1** 做。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

已拍板：选角文案按用户原文；移速基础 −0.03、成长 −0.02（**冰人不改**）；战士未蓄 **1 身位**；伤害与范围都随蓄力线性到 ×1.6；大娃可以吃，但禁止把「长度」当成正方形边长。蝙蝠普通池。甲用像素黄描边。数字显示本次实际扣血；灰树/浅树也弹。

素材已由 M1 拷入：

| 文件 | 用途 |
|------|------|
| `跟班/蝙蝠.png` | 蝙蝠跟班 |
| `upgrades/bat.png` | 升级「蝙蝠」 |

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M5** | 战士 1 身位长条判定；蓄力线性伤/长；大娃只拉长与略加厚；实伤数字；挥砍打树也弹数字 | `frontend/src/game/combat/**`、`frontend/src/game/weapons/**` |
| **M6** | 移速 −0.03/−0.02；甲改像素黄描边；`takeHit` 返回实伤 | `frontend/src/game/enemies/**`、`frontend/src/game/spawner/**` |
| **M7** | 灰树/浅树挨打弹伤害数字；挥砍用长条打树（不要用巨大圆半径） | `frontend/src/game/world/**`、`frontend/src/game/pickups/**` |
| **M8** | 选角悬停原文；蝙蝠入普通池 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M11** | 蝙蝠跟班：伤 7，每杀 200 回玩家 1 心 | `frontend/src/game/companions/**` |
| **M1** | 规格、素材、查收、`match.js` | `docs/**`、设计表、集成路径 |

本环不开 M4 / M10。不要改冰人移速倍率、灰树/普通树刷怪公式。

---

## 1. 战士挥砍（M5）— 这是本环重点

### 错在哪

现在 `drawW = drawH = SLASH_RANGE * sizeMul`，`sizeMul = 大娃 × 满蓄×1.6`，判定还是轴对齐正方形。3 个大娃满蓄会变成约 116×116 的方块，盖住半个 225 高的视野。

### 新公式

导出：`SLASH_RANGE = BODY`（未蓄 1 身位）、`SLASH_THICK = BODY * 0.5`（厚度，约 11px）、`WARRIOR_FULL_SIZE = 1.6`。

蓄力比 `r = 0～1`，大娃 `g = 1 + 0.4n`：

| 量 | 公式 |
|----|------|
| 长度（沿鼠标） | `BODY * (1 + 0.6*r) * g` |
| 厚度（垂直鼠标） | `SLASH_THICK * g`（**不要**再乘蓄力长度） |
| 伤害 | 已有：`攻击 * (1 + 0.6*r)`，满蓄 ×1.6。保持线性 |

`chargeSizeMul` 战士改为随 `r` 线性：`g * (1 + 0.6*r)`，不要 `r>=1` 才跳。这个倍率**只用于长度**。厚度单独算。

### 几何

- 起点：身体朝鼠标最前沿（`SLASH_BODY_FRONT = BODY_W/2`），贴脸能打到。
- 中心：前沿沿鼠标再走 `长度/2`。
- 判定：沿 `ang` 的旋转矩形（OBB），长 × 厚。**禁止**再用 `drawW×drawH` 的轴对齐正方形。
- 贴图：按这个长条旋转绘制；可略大于判定，**远端不得超过长度**。
- 无限穿透；每刀对每个目标只结算一次。

### 伤害数字（M5 侧）

- `notifyDamage` **不要**再因 `knockbackable === false` 丢掉（树要弹）。
- 打怪：弹出 **`takeHit` 实际扣掉的血**（有甲则是 ×0.7 后），不是面板攻击力。`takeHit` 若没返回值，可先按传入伤害，但 M6 会改成返回实伤。
- 打树：`hitWorld` 命中后按本次伤害弹数字（树坐标）。挥砍打树用同一条 OBB，不要把 `radius` 设成半个长度。

自测：未蓄长度 = BODY；满蓄长度 = 1.6×BODY；3 大娃满蓄长度 = 1.6×2.2×BODY ≈ 77px（**不是** 100+ 的正方形边）；厚度 = 11×2.2 ≈ 24，远小于长度；半蓄伤害与范围都是中间值。`node src/game/combat/selftest.mjs` 全绿。

---

## 2. 移速与甲描边（M6）

### 移速（冰人除外）

| 对象 | 基础 | 成长 |
|------|------|------|
| 蘑菇 | 0.65→**0.62** | 0.06→**0.04**（1.4 帽仍在） |
| 裂怪 | 0.8→**0.77** | 同 0.04 |
| 蜗牛 | 0.65→**0.62** | 0.05→**0.03** |
| 史莱姆x-1 | 0.90→**0.87** | 0.05→**0.03** |
| 兰花 | 1.2→**1.17** | 无 |
| 冰人 | **不改** | — |
| x-3 | 仍快照 +0.10 | — |

### 甲描边

删掉 `strokeRect` 大方框。像 `dmgnum.js` 的 `outlineSheet`：只给素材**不透明像素**描 **1px 黄边**（`#e0b84a` 或接近伤害数字黄）。没甲不画。可对 sheet 预生成描边版，或绘制时套一层。

### takeHit 返回实伤

有甲：`armor -= 1`，实伤 = `dmg * 0.7`，扣血，**return 实伤**。没甲：return 本次扣掉的数。无敌/死透 return 0。跟班打怪也走 `takeHit`。

自测：新移速常量；甲无方框（断言不再 `strokeRect`，改为 outline 路径）；takeHit(20) 有甲返回 14。`node src/game/enemies/selftest.mjs` 全绿。

---

## 3. 树的伤害数字与挥砍打树（M7）

`hitAt` 命中后让调用方知道打中了哪棵树、扣了多少。建议返回 `{ hit, destroyed, tree, dealt }`，`dealt` = 本次传入的 `damage`（树没有甲）。

增加挥砍用的命中：例如 `hitSlashAt({ x, y, ang, length, thick, damage })`，用旋转矩形对树 AABB。M5 会改 `hitWorld` 来调它。不要改刷树公式、掉落、磁铁。

自测：hitAt 带 dealt；slash OBB 能打到身前的树、打不到侧面很远的树。`node src/game/world/selftest.mjs` 全绿。

---

## 4. 选角文案与蝙蝠选项（M8）

`formatCharStats` 两行（可用 `\n`，选角 tip `white-space: pre-line`）：

```
基础属性：血量：N | 伤害：N | 穿透：0 | 满蓄：xxx%
角色特点：……
```

原文：

- 法师 2 / 25 / 0 / 150%：蓄力释放范围伤害，蓄力越久范围越大（最高3倍）；每点穿透额外增加20%伤害。
- 战士 4 / 22 / 0 / 160%：近战攻击拥有无限穿透效果；蓄力越久攻击范围越大（最高1.6倍）；每拥有1点穿透，额外增加0.5身位击退效果
- 游侠 3 / 20 / 0 / 200%：远程射手，蓄力释放穿透箭矢

不要再拼「每升级15次穿透+1」。局内每 15 次穿透仍在。

普通池追加 `{ id: 'bat', title: '蝙蝠', desc: '生成 1 个蝙蝠跟班；该蝙蝠每击杀 200 敌人，角色回复 1 滴血' }`，放在兔子后面。图标 `upgrades/bat.png`（已拷）。`applyUpgrade('bat')` → `companions.addBat`（没有就 `pendingBat`）。普通池数量 **15**。不要改 backend。不要生图。

自测：三人文案；bat 在普通池；addBat hook。`node src/ui/selftest.mjs` 全绿。

---

## 5. 蝙蝠跟班（M11）

`addBat()`。贴图 `跟班/蝙蝠.png`。伤 **7** + 跟班加成。间隔 0.4s。无血无击退。碰撞才打。最多 **1** 个目标（同兔子）。可叠。移速 = add 当时角色速度。独立索敌。

该蝙蝠 **自己每杀死 200 敌人**：`player.heal(1)`（或 `hooks.onHeal`）。用该蝙蝠的击杀计数，不要用角色击杀。吃地精 +10。

自测：伤 7；+10→17；200 杀回 1；两只蝙蝠各自计数。`node src/game/companions/selftest.mjs` 全绿。

---

## 6. M1 接线（子窗口不要做）

- `applyUpgrade('bat')` 已由 M8 调 `addBat`
- `hitWorld` 树数字：若 M5 已在 combat 里 `onDamage(tree, dealt)` 则 match 不用再包一层
- 蝙蝠回血：若 M11 调 `player.heal`，match 已有 `onHeal` 则绿字会出；否则 `createCompanions({ hooks: { onHeal } })`

---

## 成功标准

| 窗 | 标准 |
|----|------|
| M5 | 1 身位长条；线性伤/长；大娃不盖半屏；实伤数字；combat selftest 绿 |
| M6 | 移速；像素黄边；takeHit 返回值；enemies selftest 绿 |
| M7 | 树 dealt + slash OBB；world selftest 绿 |
| M8 | 选角原文；bat 入池；ui selftest 绿 |
| M11 | 蝙蝠 7 / 200 回血；companions selftest 绿 |
| M1 | 查收后接线 + match selftest + build |
