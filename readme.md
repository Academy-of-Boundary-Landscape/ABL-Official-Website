
# 🏛️ 社团官网 | Project Documentation

欢迎加入本项目！这是一个基于 **Vue 3 (前端)** 和 **Strapi v5 (后端)** 的全栈项目。

本项目采用 Monorepo 结构：
- `/frontend`: Vue 3 + Vite 前端代码
- `/strapi-backend`: Strapi v5 Headless CMS 后端代码
- `/backend`: 旧版遗留代码（已废弃，忽略）

---

## 📚 关于 Strapi 后端 (写给前端/新成员)

如果你没接触过 Strapi，可以把它简单理解为 **“一个帮你自动写好后端接口的后台管理系统”**。

1.  **什么是 Headless CMS（无头内容管理系统）？**
    *   传统 CMS (如 WordPress) 把“内容管理”和“网页展示”耦合在一起。
    *   **Strapi (无头)** 只负责管理内容并提供 API。它不关心网页长什么样，只通过 JSON 数据与前端 (Vue) 交互。

2.  **我们为什么用它？**
    *   **省事**：我们不需要手写 CRUD（增删改查）代码。只需在后台点击“创建文章模型”，Strapi 就会自动生成对应的数据库表和 REST API 接口。
    *   **分离**：开发环境使用 **SQLite** (轻量，无需配置)，生产环境使用 **PostgreSQL** (Docker 容器)。Strapi 帮我们屏蔽了数据库的差异。

3.  **核心概念**：
    *   **Collection Type**: 集合类型。比如“文章 (Article)”、“成员 (Member)”，可以有多条记录。
    *   **Single Type**: 单一类型。比如“关于我们页面”、“首页配置”，全局只有一份数据。
    *   **Components**: 组件。可复用的数据结构，比如“SEO信息”、“轮播图条目”。

> **提醒**：Strapi后端也有一个它自带的图形化内容管理界面 (CMS)，你可以访问它来创建和管理内容类型 (Content Types) 以及数据。你原则上在npm run dev之下就可以直接访问它，但它并不是本项目的重点，建议你先专注于前端部分，这个后台主要用来管理内容。

---

## ⚠️ 必读：关于数据同步的“坑”

**Git 只同步“骨架”，不同步“血肉”！**

当你 `git pull` 代码并启动项目后，你会发现：
1.  **数据库是空的**：你看不到任何文章、社团成员介绍。
2.  **图片全是裂的**：`uploads` 文件夹被 Git 忽略，本地没有图片文件。

**✅ 你需要做的是**：
1.  **自行造假数据**：在本地开发环境 (`npm run develop`)，进入后台手动创建几篇测试文章，上传几张本地图片。
    *   *放心，本地数据只存在于你的电脑里 (`.tmp/data.db`)，不会影响服务器，也不会被提交代码。*
2.  **同步结构变更**：如果你在开发中修改了“文章”增加了“作者”字段，Strapi 会自动生成 JSON 文件。**这些 JSON 文件必须提交到 Git**，这样队友拉取代码后，他们的 Strapi 才会自动更新数据库结构。

---
## 关于Vue前端部分，请参考 `/frontend/README.md`。

## 🛠️ 快速开始

### 1. 环境准备
确保你的电脑安装了：
*   [Node.js](https://nodejs.org/) (推荐 v18 或 v20 LTS)
*   npm 或 yarn

### 2. 后端启动 (Strapi)

```bash
cd strapi-backend

# 1. 安装依赖
npm install

# 2. 配置环境变量
# 复制示例文件。示例里包含开发专用的假密钥，直接用即可。
cp .env.example .env

# 3. 启动开发模式
npm run develop
```

*   **后台管理**: [http://localhost:1337/admin](http://localhost:1337/admin) (首次需注册本地管理员)
*   **API 地址**: [http://localhost:1337/api](http://localhost:1337/api)

> **注意**: 如果你是第一次运行，Strapi 会自动创建本地 SQLite 数据库文件。你需要注册第一个管理员账号。

### 3. 前端启动 (Vue)

```bash
# 新开一个终端窗口
cd frontend

# 1. 安装依赖
npm install

# 2. 检查环境变量
# 确保项目根目录下有 .env.local 或 .env，且 VITE_API_URL 指向本地后端
# VITE_API_URL=http://localhost:1337

# 3. 启动前端
npm run dev
```

---

## 🔌 前端开发指南：如何调用 API？

Strapi 会根据内容类型名称自动生成 REST API。

### 1. 查找 API 路径
假设我们在后台创建了一个集合类型叫 `Article` (复数形式 articles)：

*   **获取所有文章**: `GET /api/articles`
*   **获取单篇文章**: `GET /api/articles/:id`
*   **创建文章**: `POST /api/articles`

### 2. 这里的坑：API 默认是不公开的 (403 Forbidden)
如果你请求接口报错 403，是因为权限没开。
1.  进入后台 -> **Settings** -> **Users & Permissions Plugin** -> **Roles**。
2.  点击 **Public** (代表未登录用户)。
3.  在 Permissions 列表中找到 `Article`，勾选 `find` (列表) 和 `findOne` (详情)。
4.  点击 Save。现在前端就能获取数据了。

### 3. 这里的坑：关联数据默认不返回 (Populate)
默认情况下，Strapi 为了性能，**不返回** 图片、关联关系（比如文章的作者）。
如果你发现 API 返回的数据里没有图片 URL，请使用 `populate` 参数：

*   **简单粗暴获取所有关联**:
    `GET /api/articles?populate=*`
*   **只获取图片字段 (假设字段名叫 cover)**:
    `GET /api/articles?populate=cover`

### 4. 查看文档
*   *基础文档*：直接访问 [Strapi 官方 API 文档](https://docs.strapi.io/dev-docs/api/rest)。
*   *本项目文档*：(如果安装了 Documentation 插件) 访问 [http://localhost:1337/documentation](http://localhost:1337/documentation) 查看自动生成的 Swagger UI。

---

## 🚀 生产环境部署

生产服务器为单台 VPS，项目位于 `/home/deploy/abl_website/`，采用**混合架构**：

| 组件 | 运行方式 | 说明 |
|---|---|---|
| **前端** | Docker (`abl-frontend`) | nginx:alpine 提供静态文件，`127.0.0.1:8080` |
| **数据库** | Docker (`abl-postgres`) | PostgreSQL 16，`127.0.0.1:5433` |
| **Strapi** | 宿主机 PM2 (`strapi-main`) | 直连 Docker PostgreSQL |
| **Nginx** | 宿主机 system | SSL 终结 + 反向代理 |

**为什么不把 Strapi 放进 Docker？** Strapi 本体太大（含 sharp 等原生模块），每次部署重新构建镜像太慢。跑在宿主机上通过 PM2 管理更快更简单。

```bash
# 日常部署（deploy 用户）
cd /home/deploy/abl_website
bash deploy.sh          # 构建前端 + 启动 Docker 服务
docker compose restart frontend  # 仅重启前端

# Strapi 管理（需要 root）
pm2 restart strapi-main
pm2 logs strapi-main
```

---

## 🤝 协作规范 (Git Workflow)

1.  **不要提交的文件**：
    *   `node_modules`
    *   `dist` / `.cache` / `build`
    *   `.env` (严禁提交，含密钥)
    *   `strapi-backend/public/uploads` (本地测试图片不要传)
    *   `strapi-backend/.tmp` (本地 SQLite 数据库不要传)
    *   `.env` (Docker Compose 环境变量，含数据库密码)

2.  **遇到冲突怎么办？**
    *   如果拉取代码后 Strapi 启动报错，通常是依赖或缓存问题。
    *   尝试：`rm -rf node_modules .cache build` 然后重新 `npm install && npm run develop`。
    *   `strapi-backend` 目录路径问题：项目之前叫 `backend/`，现已重命名为 `strapi-backend/`。

更详细的架构说明、Docker 配置、部署流程请参考 [CLAUDE.md](./CLAUDE.md)。

---

## ❓ 常见问题

**Q: 前端图片显示 404？**
A: 正常。前端请求的是 `localhost:1337/uploads/xxx.jpg`，但你本地并没有这张图。请去后台重新传一张图，或者修改前端代码暂时指向一张占位图。

**Q: 登录 Strapi 显示 "Invalid credentials"？**
A: 本地数据库是独立的。不要试图用服务器的账号登录本地，请点击 "Register" 注册一个新的本地管理员。

**Q: 我修改了 Content Type，但 git status 只有 JSON 变化？**
A: 对的。Strapi 用文件（Schema JSON）来描述数据库结构。**务必提交这些 JSON 文件**，这样队友 pull 下来后，Strapi 才会帮他们自动更新数据库表结构。
```