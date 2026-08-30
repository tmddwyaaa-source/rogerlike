# 交接 — P29（强化结晶紫边 / 万物一心 tier 复核 / 回忆角色立绘 / 选角 hover 待机动画）

> **主导**：M1  
> **本环窗口**：M7、M8、M11。M1 做万物一心运行时探针 + 跨模块核对。  
> 子窗口禁止标 Registry `done`。禁止打开游戏。完工说：`M{n} 已完成，请主导窗口查收。`  
> 环内：斥候 → 主力 → 搜剿；同一卡点最多 4 次。

---

## 0. 本环已定案

- **测试错误 1**：强化结晶紫边不可见。现实现是“加大的紫十字垫在蓝十字后”，只露两端 2px 小尖。需改为**明显的外覆层**（如给结晶外层描紫边/紫环，像怪物甲的紫色描边）。
- **测试错误 2**：万物一心“1 种跟班就 2 档”。M1 已实测：`bondRank(BOND_UNITY, count=1)=0`、阈值 [2,4,6,8]、`setUnityTier` 仅 `syncUnity` 一处调用、`unityDamageAdd` 按 tier>=2 才给生效。**按当前代码不应发生**——很可能系统缓存了旧构建，或运行时另有路径。M1 将加运行时探针抓实际 `setUnityTier` 入参与 `uniqueBondCount` 的调用；M8/M11 复核计数/显示，确保仅达到基础档才生效。
- **调整 3**：回忆面板（`MoreView.vue`）加**角色立绘**，放在**血条左边**（升级图标 + 角色属性/血量左侧），立绘大小与开局选角一致（`RangerPortrait`）。需单局记录 `charId`，回忆读取显示。
- **调整 4**：选角（`StartView.vue`）hover 除文本外，还显示**角色待机（Idle）多帧动画**（悬停时播放）。

---

## 1. M7 — 强化结晶紫边（明显外覆层）

- `world/pickups` `drawCrystal`：把“加大紫十字垫底”改为**清晰可见的紫色外覆层**，例如：再给结晶**外层描一圈紫**（沿十字外轮廓描 1px 紫），或把紫十字画得更宽并包住蓝十字形成明显紫边；确保普通结晶无紫、高级结晶一眼可辨。
- 更新 world selftest（紫边/外覆层的像素断言，确保不是只剩小尖）。

---

## 2. M8 — 回忆角色立绘 / 选角 hover 待机动画 / 万物一心复核

- **回忆立绘**：`MoreView.vue`（回忆）在血条左侧渲染 `RangerPortrait`（尺寸同选角）；单局数据写入 `charId`，回忆读取显示对应角色。无该字段时兜底（如默认游侠）。
- **选角 hover 待机动画**：`StartView.vue` 悬停角色时用 `S_Idle` 帧序列播放待机动画（参考 `RangerPortrait` 取帧），与文本提示同时显示；未悬停保持静态。
- **万物一心复核**：`session.js` `syncUnity` 与 `uniqueBondCount` 确认只按**不同跟班升级种类**计数，且在 `uniqueBondCount < BOND_UNITY_THRESHOLDS[0]（2）` 时不显示 chip、不调 tier>0。若发现显示/计数异常请修，并同步 ui selftest。
- 更新 ui selftest。

---

## 3. M11 — 万物一心 tier 消费复核

- `companions` `setUnityTier` / `unityAdd`：确认 `unityTier` 只在达到阈值时 >0，且 `unityTier` 初值与每次重置正确；`getCompanionBonus` 不因 `unityTier=0` 误发增益。更新 companions selftest。

---

## 4. M1 — 万物一心运行时探针 + 核对

- 在 `match.js` 或 `session` 临时加日志：`syncUnity` 时打印 `uniqueBondCount` 与 `setUnityTier` 入参；用户复现一次即得实际值，据此定点修。
- 若确认是旧构建缓存，请用户硬刷新（Ctrl+Shift+R）后再测。

---

## 5. 派工表

| 窗口 | 内容 | 规定路径 |
|------|------|----------|
| M7 | 强化结晶显著紫外覆层 | `game/world/**`、`game/pickups/**` |
| M8 | 回忆角色立绘；选角 hover 待机动画；万物一心计数/显示复核 | `ui/**`、`views/**` |
| M11 | 万物一心 `setUnityTier`/`unityAdd` 消费复核 | `game/companions/**` |
| M1 | `syncUnity` 运行时探针、跨模块核对、联调 | `match.js`、`docs/**` |

---

## 6. 验收命令

各窗：`node src/…/selftest.mjs` 全绿 → `npm run build` → M1 开游戏实机 → 回写设计表/GAME-SPEC → 更新 RECEIPT-LOG 与 MODULE-REGISTRY。