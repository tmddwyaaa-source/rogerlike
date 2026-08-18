# 素材清单（已识别）

> 旧源：`C:\Users\user\Desktop\Roger-png`  
> 新角色包：`C:\Users\user\Desktop\craftpix-net-436971-free-top-down-roguelike-game-kit-pixel-art\1 Characters`  
> 仓库副本：`assets/source/` + `frontend/public/assets/`

## 目录结构

```
assets/source/  与  frontend/public/assets/
├── upgrades/       ← 过审升级图标 {id}.png；没有则局内空白方块
├── 游戏音乐/       ← music.ogg（循环 BGM）
├── fx/             ← 过审后的升级 +1 图（可选）
├── characters/
│   ├── 1/          ← 游侠（Idle/Walk/Attack/Hurt/Death，D/S/U）
│   └── Other/      ← Arrow.png, Shadow.png, D/S/U_Blood.png
├── 小怪/
├── 跟班/
├── 树木/
├── 子弹/            ← 手枪时代遗留，P3 后箭矢改用 characters/Other
└── 换弹显示动画/
```

## 用途映射

| 文件 | 用途 | 备注 |
|------|------|------|
| `小怪/蘑菇怪.png` | 蘑菇怪 | 32×32 单帧；深色底透明 |
| `小怪/蜗牛怪.png` | 蜗牛怪 | 32×32 单帧；深色底透明 |
| `小怪/裂怪.png` | 裂怪 | 32×32 单帧；灰树毁后爆出 |
| `小怪/史莱姆x-1.png` | 史莱姆x-1 | 32×32 单帧；≥300s |
| `小怪/史莱姆x-3.png` | 史莱姆x-3 | 32×32 单帧；x-1 死亡分裂 |
| `跟班/地精.png` | 地精跟班 | 32×32 单帧；源为桌面 `跟班/地精.png` |
| `跟班/兔子.png` | 兔子跟班 | 32×32 单帧；源为桌面 `跟班/兔子.png` |
| `upgrades/goblin.png` | 地精升级图标 | 源为桌面 `跟班选项/地精.png` |
| `upgrades/rabbit.png` | 兔子升级图标 | 源为桌面 `跟班选项/兔子.png` |
| `小怪/…octocat….png` | 旧小怪条带 | 已停用，可留作备份 |
| `树木/浅树.png` | 普通树 | 已确认；程序草地对齐其浅绿/树干色 |
| `树木/灰树.png` | 灰树 | 可受击、自损、毁后延迟刷怪 |

## 程序生成（无现成 PNG）

| 资源 | 说明 |
|------|------|
| 主角火柴人 | ≤14×7；**P3 起为无 Image 兜底**，局内默认游侠贴图 |
| 游侠 | `characters/1/` D/S/U 动画；脚下 `Other/Shadow.png` |
| 箭矢 / 击中 | `Other/Arrow.png`；`Other/{D,S,U}_Blood.png` |
| 经验结晶 | 像素结晶体 |
| 水果 | 红色像素，约主角大小 |
| 草地 | 浅绿简约，对齐浅树 |
| UI / 升级图标 | 过审 PNG 在 `upgrades/{id}.png`；缺图空白方块。高级项左上红点（程序画） |
| BGM | `游戏音乐/music.ogg`（桌面 `Roger-png/游戏音乐` 已拷入） |

## 识别状态

| 项 | 状态 |
|----|------|
| 路径可读 | ✅ |
| 文件枚举 | ✅ 3 个 PNG + 2 分类目录 |
| 浅树确认（可生成草地） | ✅ |
| 拷入仓库 | ✅ `assets/source/` |
| 史莱姆已入素材 | ✅ public + source `小怪/史莱姆x-1.png`、`史莱姆x-3.png` |
