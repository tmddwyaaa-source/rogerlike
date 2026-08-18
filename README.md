# 类幸存者

网页端 2D 俯视像素「类吸血鬼幸存者」肉鸽小游戏。  
WASD 移动，鼠标瞄准，**按住蓄力、松开射击**。存活 **10 分钟** 胜利，生命归零失败。

技术栈与项目经历（可贴简历）：[项目经历.md](项目经历.md)

## 怎么玩（本地）

游戏本体只需要前端：

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 [http://localhost:5173/](http://localhost:5173/)。

不启动后端也能完整开局、升级、结算。「回忆」和音量存在浏览器本地。

## 技术栈（摘要）

| 部分 | 技术 |
|------|------|
| 游戏 | Vue 3、Vite、Canvas 2D |
| 统计 API（可选） | Spring Boot 3、Java 17、MyBatis-Plus、MySQL |

## 可选：对局统计后端

默认连本机 `http://localhost:8080/api`。后端没开时，开局会忽略上报，**不影响游玩**。

1. 本机安装 MySQL，建库名可用 `rogerlike`。
2. 复制 `backend/src/main/resources/application-local.yml.example` 为 `application-local.yml`，填入本机用户名和密码（该文件不会进 Git）。
3. 在 `backend/` 用 Maven 启动 Spring Boot。

## 仓库里还有什么

| 路径 | 说明 |
|------|------|
| `frontend/` | 可玩客户端 |
| `backend/` | 可选统计 API |
| `游戏当前设计表.md` | 当前玩法数值 |
| `docs/` | 规格与开发记录 |

角色贴图来自 [Craftpix](https://craftpix.net/) 免费 Top-down Roguelike 像素包，公开分发请遵守其许可。

## 开发中

本项目仍会继续改玩法与数值。当前公开版本对应可玩停点，不以「做完」为准。
