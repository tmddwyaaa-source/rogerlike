# 升级图标画风锁

> M1 规格。M10 必读。对齐局内原来的 **12×12 程序像素画**（`frontend/src/ui/icons.js` 的 `ICON_MAPS`），不是 AI 插画。

## 为什么上一轮 M10 偏了

先前其他窗口里好看的，是 **12×12、6～8 色、一个剪影、最近邻放大** 的小像素画（靴子、双箭、钟、闪电……）。

M10 第一轮提示词写成了 “pixel-art upgrade icon + 带金翼的皮靴 + 速度线”。生图模型会把它理解成 **高清插画**：材质、光影、多余零件、水印。那不是游戏画风。

## 硬规格

| 项 | 必须 |
|----|------|
| 逻辑分辨率 | **12×12** 像素（与 `ICON_SIZE` 相同） |
| 落盘 | 用最近邻放大到 **48×48**（×4，对齐局内默认缩放） |
| 颜色 | 只用 `ICON_PALETTE`：`#2c2c28` `#f4e8c0` `#5a8f3a` `#c5e0a3` `#cec95f` `#c42b5a` `#5a4030` `#9e5a4f` |
| 构图 | 正中 **一个** 剪影；四周留空 |
| 边缘 | 1px 墨色描边；色块平整 |

## 禁止

- 皮面/布纹/金属高光、渐变、软阴影、3D、景深
- 翅膀、速度线、粒子、装饰道具堆叠
- 字母、数字、水印、UI 框
- 「细节丰富的像素风」「手绘插画」类提示词

## 已有 `ICON_MAPS` 的 id（默认栅格化，不要生图）

| id | 本来画的就是 |
|----|----------------|
| `move_speed` | 一只靴子 |
| `ammo_cap` | 两支箭 |
| `reload` | 时钟 |
| `power` | 闪电 |
| `survive` | 心 |
| `recover` | 十字宝石 |
| `earth` | 小树 |
| `pierce` | 斜箭 |
| `eyes` | 两只眼 |
| `giant` | 大脑袋 |

这些 id：**禁止** GenerateImage。用技能脚本把 `ICON_MAPS` 栅格成 PNG，给你检查。

## 没有 `ICON_MAPS` 的 id（如 `blackhole`）

先在 `assets/icon-review/{id}.map.txt` 手写 12 行 × 12 列（字符同 `ICON_MAPS`：`.` 空、`k` 墨、`w` 奶油、`g` 树绿、`l` 浅绿、`y` 金、`r` 玫红、`b` 棕、`n` 土红），再栅格化。

只有用户明确说「用 AI 生」时才 GenerateImage，且必须：

- 提示词用本文件「生图提示词（仅例外）」
- 生完立刻量化到 12×12 + 调色板，再 ×4 放大；不能把原图直接当过审文件

## 生图提示词（仅例外）

```text
Tiny 12x12 video-game inventory sprite, NOT an illustration.
Exactly 12 by 12 pixels, then nearest-neighbor enlarged.
Flat fill, 1-pixel black outline, no anti-aliasing, no gradients,
no texture, no glow, no watermark, no text, no extra props.
One centered silhouette only. Cream background #f4e8c0.
Palette only: #2c2c28 #f4e8c0 #5a8f3a #c5e0a3 #cec95f #c42b5a.
Looks like a Game Boy Color item icon. Subject: {一个物体，等同 ICON_MAPS 的简单程度}.
```
