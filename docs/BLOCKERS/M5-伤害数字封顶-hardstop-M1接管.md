# BLOCKER — M5 伤害数字不按血量封顶（连续 3 次零改动，M1 硬停接管）

> **日期**：2026-08-24  
> **提单**：M1  
> **涉及模块**：combat（M5 规定路径 `game/combat/**`、`game/weapons/**`）  
> **状态**：已由 M1 直接实现修复（协议“换方案”路径），M5 不再空跑。

## 问题

伤害数字按怪物剩余血量封顶（怪剩 36 血、打 40 → 显示 36）。用户要求“造成多少伤害显示多少伤害”。

## 打回历程

| 轮次 | 结果 | 证据 |
|------|------|------|
| #1 | 未改 | `combat/index.js` `dealDamage.applied` 仍 `beforeHp-afterHp`；selftest 用无 `takeHit` 的 `makeCreep` |
| #2 | 未改 | 同上；M5 自述“仅缺 M1 透传 meta”——但 core 的 `applied` 仍未改 |
| #3 | 未改 | `dealDamage.applied` 仍 265 行 `beforeHp-afterHp`；selftest 仍 `makeCreep(40,5)` |

> 三连“未改”，触发 M1 硬停（协议：同卡点最多 4 次；此处 3 次零改动，按“禁止盲目第 5 次”精神提前接管）。

## 根因

- `dealDamage()` 的 `applied` 用 `beforeHp - afterHp`（被真实敌人 `takeHit` 的 `hp<=0 ⇒ hp=0` 截断）。
- M5 自测用无 `takeHit` 的 mock（`hurt` 兜底 `hp-=damage` 使 hp 变负），`beforeHp-afterHp` 恰好等于原始伤害，故“过”。
- M1 缺口：`match.js` `onDamage`/`onPlayerDamage` 未透传 `meta` 给 `spawnDamageNum`（已由 M1 补齐）。

## M1 已修复（直接实现）

1. `combat/index.js` `dealDamage`：`applied = Math.max(0, damage)`（显示值＝原始命中伤害，不按余血截断；`dealt` 仍用于实际扣减/溢出）。
2. `combat/selftest.mjs`：`truncHit` 增加**真实钳血 `takeHit`**（`hp≤0⇒0`，返回实扣），断言 `d === DMG_MAX`；并把旧断言 `pops takeHit dealt`（`7`）改为 `raw damage not clamped`（`DMG_MAX`），以符合“显示原始伤害”的新规则。
3. `match.js`：`onDamage(ent,dmg,meta)` / `onPlayerDamage(ent,dmg,meta)` 透传 `meta` 给 `spawnDamageNum`。

## 验证

- 7 模块 selftest 全 RESULT PASS；`npm run build` 576ms。

## 结论

M5 交付未达；已由 M1 直接修复。后续该模块如有类似“连续未落地”情形，按协议优先 M1 接管。