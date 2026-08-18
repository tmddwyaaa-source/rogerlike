# 交接 — P5（无等级上限 / 测试提高等级 / 音乐 / 选角立绘 / 升级 +1）

> **主导**：M1  
> **日期**：2026-08-15  
> **禁止**：非 M 编号窗口。本环窗口：**M8、M4、M10**；接线 **M1**。  
> 子窗口禁止标 Registry `done`。完工说：`M{n} 已完成，请主导窗口查收。`

环内：**斥候 → 主力 → 搜剿**；同一卡点最多 4 次。

---

## 窗口分工

| 编号 | 本环职责 | 规定路径 |
|------|----------|----------|
| **M8** | ①无等级上限 ②测试「提高等级」0～3，关设置后弹出最多 3 次三选一 ③循环 BGM 跟音量滑条 ④选角页游侠朝右立绘 | `frontend/src/ui/**`、`frontend/src/views/**` |
| **M4** | 升级时角色周围出现「+1」 | `frontend/src/game/player/**`、`frontend/src/game/render/**` |
| **M10** | 「+1」图 | **用户放弃**；局内用 M4 程序「+1」 |
| **M1** | 规格、拷音乐、查收；`match.js` 去掉开局 `setLevel`、把升级次数交给 M4 播 +1 | `docs/**`、`match.js`（等 M8/M4 请查收后再接） |

M8 不改 `match.js` / `player`。M4 不改 `ui` / `views`。M10 不改 `frontend/src`。

---

## 1. 无等级上限

- 删除「满 30 级停涨」：`addExp` 可一直升级；`expNeedForLevel` 只保证等级 ≥1，**不要**再 `min(30)`。
- 可删 `LEVEL_MAX = 30`，或改成测试用常量 **不要**再当等级帽。
- HUD / 结算 / 回忆仍显示当前等级数字即可。
- 自测：去掉 `LEVEL_MAX === 30`；加「连升两级不封顶」。

## 2. 测试模式：提高当前等级

旧：设置里把等级调到 1～30，立刻 `setLevel`，**不给**三选一。

新：

| 项 | 规格 |
|----|------|
| 控件文案 | **提高等级**（不要再显示成绝对等级 1～30） |
| 可选值 | **0～3**（0=不提高；3=提高 3 级） |
| 何时生效 | **关掉设置页时**（返回），不是按 +/− 当时 |
| 局内 | `level += n`，`pending += n`，然后进入 `upgrade`；选完一张若 `pending>0` 再出下一张，**最多 3 次** |
| 主页设置 | 不在对局里：改这个数 **不要**改会话等级，关掉后也 **不要**出三选一 |
| 打开设置 | 草稿每次从 **0** 起 |

`setLevel` 若仍留下，不要在点 +/− 时调用。关设置时走类似 `boostLevels(n, ctx)`。

已有 `pending` 队列可直接用。

## 3. 游戏音乐（素材已拷）

| 用途 | 路径 |
|------|------|
| 运行时 | `frontend/public/assets/游戏音乐/music.ogg` → `/assets/游戏音乐/music.ogg` |
| 备份 | `assets/source/游戏音乐/music.ogg` |

- 主页出现就开始 **循环** 播放。
- 音量滑条 **即时** 改 `audio.volume`；0 = 静音。
- 不要重复 `new Audio` 叠很多轨。设置页打开时音乐继续。
- 自测：至少断言 URL 常量和「volume 写入会被 audio 读取」的接口（Node 里可 mock）。

## 4. 选角立绘

- 「选择角色」里游侠不要写「人」。
- 用侧向 Idle：`/assets/characters/1/S_Idle.png`（32×32 格，Idle 4 帧，用 **第 0 帧**）。
- **朝右**：原图侧向朝左，CSS `scaleX(-1)` 或 canvas 翻转。
- `image-rendering: pixelated`；锁定的「敬请期待」仍用 `?`。

## 5. 升级 +1（M4 + 可选 M10）

- 每次等级 +1（经验升级或测试提高），角色 **周围** 冒出 **「+1」**，上浮并消失。
- 一次提高 3 级：出 **3** 个 +1（可错开一点），不要写成一个「+3」。
- 无过审图：M4 程序画像素「+1」。
- 有 `frontend/public/assets/fx/levelup.png`：用该图。
- M4 导出例如 `player.queueLevelUpFx(n)`；**不要**改 `match.js`（M1 查收时再接）。

M10：先和用户对画面；用户说采用/手绘后再拷。禁止一轮连生多张。禁止擅自 GenerateImage（用户说可讨论或自己画）。

---

## 成功标准

1. 经验可升到 30 级以上；公式仍 `15+4×(level−1)`。
2. 测试提高 3 → 关设置 → 连续最多 3 次三选一；等级 +3。
3. 能听到循环 BGM，拖音量立刻变。
4. 选角页能看出朝右的游侠。
5. 升级时角色旁有 +1（程序或过审 PNG）。

---

## M8 开工粘贴块

```text
@multi-window_M @game-developer
我是 M8 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P5.md 与 docs/MODULE-REGISTRY.md 中 M8。
当前角色：先斥候（只调查，禁止改文件），通过后再转主力。
按斥候 → 主力 → 搜剿；同一卡点最多 4 次。
只改：frontend/src/ui/** 、frontend/src/views/**
不要改 match.js / player / combat。不要标 Registry done。

本环四件事：
1. 去掉等级上限 30；expNeed 不要再夹到 30。
2. 测试模式「提高等级」0～3；只在局内关掉设置后生效，pending 最多 3 次三选一。主页设置改这个数不要改等级。
3. 循环播放 /assets/游戏音乐/music.ogg，音量滑条即时生效。
4. 选角页游侠用 S_Idle 第 0 帧并水平翻转朝右。

完成后说：M8 已完成，请主导窗口查收。
```

---

## M4 开工粘贴块

```text
@multi-window_M @game-developer
我是 M4 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P5.md。当前角色：先斥候，通过后再主力。
只改：frontend/src/game/player/** 、frontend/src/game/render/**
不要改 ui / views / match.js。不要标 Registry done。

本环：角色升级时周围出现「+1」上浮消失。一次升 n 级出 n 个 +1。
无 fx/levelup.png 时程序绘制；有则用该 PNG。
导出 queueLevelUpFx(n)（或同等接口）给 M1 接线。更新 selftest。
完成后说：M4 已完成，请主导窗口查收。
```

---

## M10 开工粘贴块（+1 图，先讨论）

```text
@multi-window_M @game-upgrade-icons @game-developer
我是 M10 窗口。项目路径：D:\Cursor_projectt\rogerlike
请读 docs/HANDOFF-P5.md。当前角色：先斥候。
规定路径：assets/icon-review/** ；用户说「采用」后才写入 frontend/public/assets/fx/levelup.png 与 assets/source/fx/levelup.png
禁止改 frontend/src。不要标 Registry done。不要擅自 GenerateImage。

本环：升级「+1」贴图。先用文字描述构图（小像素「+1」、奶油底或透明、对齐现有图标画风），等用户说生图 / 自己画 / 不需要图（用 M4 程序字）。
一次最多一张。采用后再拷贝。
完成后说：M10 已完成，请主导窗口查收。
```

---

## 回 M1 查收话术

```text
@multi-window_M @game-developer
我是 M1。当前角色：搜剿（只验收）。
用户汇报：M{4 或 8 或 10} 已完成，请查收。
读 docs/HANDOFF-P5.md + 磁盘 + selftest；pass 则更新 Registry / RECEIPT-LOG。
M8+M4 都过后再改 match.js：去掉开局 setLevel；addExp/测试提高后调用 queueLevelUpFx。
```
