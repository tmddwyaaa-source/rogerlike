# 交接 — P12（三角色 / 死亡动画 / 空血上限 / 伤害数字 / 强化射击）

> **主导**：M1  
> **日期**：2026-08-20  
> **本环窗口**：M4、M5、M8、M11。接线（`match.js` 等死亡弹窗、charId、伤害数字绘制）等各窗请查收后由 **M1** 做。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

素材已由 M1 拷入 `frontend/public/assets/` 与 `assets/source/`：

| 用途 | 路径 |
|------|------|
| 游侠 | `characters/1/`（含 Death 8 帧） |
| 战士 | `characters/2/` |
| 法师 | `characters/3/` |
| 法球 | `子弹/法球.png`（4×4；另有 `characters/Other/Fireball.png`） |
| 挥砍（已黑边） | `子弹/挥砍-1.png`～`挥砍-3.png`（576×96 = 6 帧 × 96） |
| 强化箭矢（已黑边） | `子弹/强化箭矢-1.png`～`强化箭矢-3.png`（同上） |
| 伤害数字 | `游戏数字/tile_0.png`～`tile_9.png`（16×16） |
| 强化射击图标 | `upgrades/empower_shot.png`（用户原图，已过审拷入） |

挥砍 / 强化箭矢：**透明底 + 不透明 1px 黑描边**。禁止再 `chromaBlack`，否则黑边会被抠掉。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M4** | 三角色贴图；死亡动画播完信号；空血上限接口；伤害数字渲染 | `frontend/src/game/player/**`、`frontend/src/game/render/**` |
| **M5** | 法师法球、战士近战挥砍、满蓄弹体 +25%、强化射击、命中出伤害数字 | `frontend/src/game/combat/**`、`frontend/src/game/weapons/**` |
| **M8** | 选角解锁战士/法师；每 10 次升级空血上限；强化射击文案（游侠高级） | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M11** | 跟班打中怪时同样弹出伤害数字 | `frontend/src/game/companions/**` |
| **M1** | 规格、素材、查收、`match.js` 接线 | `docs/**`、设计表 |

本环 **不开 M10**（强化射击图标用户已给）。不要改灰树/普通树/刷怪。

---

## 1. 角色与死亡（M4）

三种角色同一套动画表：D/S/U × Idle(4) / Walk(6) / Attack(4) / Hurt(2) / **Death(8)**，格 32×32，脚下 Shadow。死亡都是「站立 → 后仰掉武器 → 缩小溶解到 1 像素」。

| charId | 中文 | 文件夹 |
|--------|------|--------|
| `ranger` | 游侠 | `characters/1/` |
| `warrior` | 战士 | `characters/2/` |
| `mage` | 法师 | `characters/3/` |

`createPlayer({ charId })` 按 id 读对应目录。默认仍 `ranger`。

**死亡流程（本窗只做信号，弹窗接线留 M1）：**

- `hp <= 0`：停移动、停蓄力，播 Death；8 帧 × 8fps = **1.0s**，最后一帧停住。
- 导出 `deathAnimDone(player)`（或 `player.deathAnimDone()`）：`deathT >= 1.0` 为 true。
- 不要自己改 `match.js`。现在 `match.js` 一掉血就 `notifyDead`，查收后由 M1 改为等 `deathAnimDone`。

**空血上限接口：** `addEmptyHpMax()` → 只 `hpMax += 1`，**当前 hp 不变**（和 `addVitality` 回 1 滴区分）。HUD 已能画空心。

**伤害数字：** 新建 `render/dmgnum.js`（或同等）。读 `游戏数字/tile_{0-9}.png`。导出：

- `spawnDamageNum(x, y, amount, unitId?)`
- `updateDamageNums(dt)` / `drawDamageNums(ctx)`

每个受伤单位自己头顶一组数字，不要把不同单位的伤害加在一起。同一单位连续受伤则新数字错开上浮。黑底按现有角色同样抠透明（数字本身已有深色描边）。

自测：

- `createPlayer({ charId: 'mage' }).name === '法师'`（战士同理）
- `hp=0` 后 `anim==='Death'`；`deathT=0.5` 未 done，`deathT=1.0` done
- `addEmptyHpMax`：hpMax 3→4，hp 仍 3
- 伤害数字：spawn 20 后队列非空

`node src/game/player/selftest.mjs` 全绿。

---

## 2. 武器 / 满蓄变大 / 强化射击 / 命中数字（M5）

按 `player.charId` 分支（没有则当游侠）。

### 游侠（现状 + 满蓄变大 + 强化射击）

未开强化射击：普通箭 `Other/Arrow.png`。未蓄 = 攻击；满蓄 = 攻击 ×2。

**所有角色默认：满蓄（ratio≥1）弹体与碰撞半径 ×1.25**，再叠「大娃」。常量例如 `CHARGE_SIZE_BONUS = 0.25`。

**强化射击** `empower_shot`（数值在本窗，文案在 M8）：

| 次数 | 效果 |
|------|------|
| 第 1 次 | 仅 **满蓄** 换成强化箭矢（`子弹/强化箭矢-1/2/3.png` 三选一或轮换）。速度 **780**（原 520 的 1.5×）。满蓄伤害改为攻击 **×3**。该发穿透 **+4**（叠在原满蓄+1 与穿透升级上）。未满蓄仍普通箭、原公式。 |
| 第 2 次及以后 | 攻击 **+15**（可叠） |

强化箭矢 6 帧 × 96 格，朝向射击方向。**不要 chromaBlack。**

### 法师

弹体 `子弹/法球.png`（4×4，绘制放大整数倍，建议 ×3 或 ×4）。远程飞行，仍按住蓄力松开。满蓄同样 ×1.25 大小、伤害公式与游侠相同（无强化射击）。

### 战士（近战）

`子弹/挥砍-1/2/3.png` 三张为 6 帧挥砍特效变体。生成在角色面向的身前（约 0.8～1.2 身位），**不飞出地图**。播完 6 帧消失。命中身前近战盒内的敌人。三张按次轮换或随机。**不要 chromaBlack。**

命中活怪（`takeHit` / 扣 hp）时调用 M4 的 `spawnDamageNum`（或 `hooks.onDamage(target, dmg)`，没有则跳过）。树可不出数字。

自测：

- 满蓄 sizeMul 含 ×1.25
- `empower_shot` 第一次：满蓄伤害 20→60，pierce 比普通满蓄多 4
- 第二次：attack +15
- 战士弹体位移约 0（不飞向地图边缘）
- `node src/game/combat/selftest.mjs` 全绿

---

## 3. 选角 / 每 10 次空血 / 强化射击文案（M8）

选角页三个都可点，去掉「敬请期待」：

| 按钮 | charId | 立绘 |
|------|--------|------|
| 游侠 | `ranger` | `characters/1/S_Idle.png` 第 0 帧朝右 |
| 战士 | `warrior` | `characters/2/S_Idle.png` 同规则 |
| 法师 | `mage` | `characters/3/S_Idle.png` 同规则 |

`onPickChar` 必须把 id 写入 `session.charId`，开局不要重置成游侠。

**每升级 10 次空血上限：** 与每 5 级攻/速同一套计数。升到 **11 / 21 / 31…** 时 `addEmptyHpMax`（只加上限）。自然升级与测试提高都算。不要回血。

**强化射击** 入 `UPGRADES`：

- `id: 'empower_shot'`
- 名称：强化射击
- 文案建议：`满蓄改为强化箭矢，伤害 ×3，穿透 +4；再次选择伤害 +15`
- `tier: 'advanced'`
- **仅游侠**出现在高级池（`charId==='ranger'`）。战士/法师抽高级仍只有地精等。
- `applyUpgrade` 调 `combat.applyUpgrade('empower_shot')`；加入 `WEAPON_IDS`
- 图标已在 `upgrades/empower_shot.png`，不要空白、不要生图

`pickUpgradeChoices` 需要能读 `opts.charId` / `ctx.player.charId`。

自测：普通池数量不变；高级池含强化射击；非游侠 `availableUpgrades` 高级不含它；升 1→11 一次 `addEmptyHpMax`；`node src/ui/selftest.mjs` 全绿。  
改掉「advanced 只有地精 1 个」这类旧断言。

---

## 4. 跟班伤害数字（M11）

跟班 `takeHit` 成功造成伤害后，对**该目标** `spawnDamageNum(target.x, target.y, dmg, target)`（或 `hooks.onDamage`）。规则与角色子弹相同：每单位单独显示。

没伤害数字模块时跳过，不要 import `match.js` / `ui`。

自测：打中一只怪后若存在 spawn 函数则被调用；两只怪伤害不相加。`node src/game/companions/selftest.mjs` 全绿。

---

## M1 稍后接线（子窗口不要改）

- `match.js`：`hp<=0` 先不 `notifyDead`；等 `deathAnimDone` 再弹结算。死亡期间仍绘制角色。
- `begin` 把 `session.charId` 传给 `createPlayer`
- 每帧 `updateDamageNums` + `drawDamageNums`
