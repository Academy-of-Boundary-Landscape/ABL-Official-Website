# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack website for a club/circle ("社团官网"). Monorepo with two independent apps:

- `frontend/` — Vue 3 + Vite SPA (the primary focus of development).
- `strapi-backend/` — Strapi v5 headless CMS (provides the REST API + admin panel). Note: docs sometimes call it "Strapi v4", but the installed version is **5.23.3**.

Ignore `backend/` — it is a legacy/unused stub (git-ignored, empty `app/api` and `app/models`). All backend work happens in `strapi-backend/`.

Much of the in-repo documentation (`readme.md`, `frontend/README.md`, `simpler_documentation.md`) is written in Chinese for onboarding new members.

## Commands

### Frontend (`cd frontend`)
- `npm run dev` — start Vite dev server (default port 5173).
- `npm run build` — production build to `frontend/dist/`.
- `npm run preview` — preview the production build.
- `npm run lint` — ESLint with `--fix`.
- `npm run format` — Prettier over `src/`.

No test suite is configured for either app.

### Backend (`cd strapi-backend`)
- `npm run develop` (alias `dev`) — start Strapi in dev mode with admin auto-reload. Admin at `http://localhost:1337/admin` (register a local admin on first run), API under `http://localhost:1337/api`.
- `npm run build` — build the admin panel.
- `npm run start` — run without the autoreload/content-type-builder (production mode).
- `npm run upgrade` / `npm run upgrade:dry` — run `@strapi/upgrade`.

## Development Workflow (开发流程)

### First-time setup

```bash
git clone git@github.com:Academy-of-Boundary-Landscape/ABL-Official-Website.git
cd ABL-Official-Website

# Backend
cd strapi-backend
cp .env.dev .env          # dev env uses SQLite, works out of the box
npm install
npm run develop            # Admin: http://localhost:1337/admin (register on first run)
                           # API:   http://localhost:1337/api

# Frontend (new terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173, HMR hot reload
```

### Daily iteration loop

```
┌─ 1. 改代码 ─────────────────────────────────────────────┐
│                                                          │
│  frontend/  →  npm run dev (HMR 即时生效，不用刷新)       │
│  strapi-backend/ → npm run develop (改 Content-Type 用)  │
│                                                          │
├─ 2. 查数据类型 ──────────────────────────────────────────┤
│                                                          │
│  simpler_documentation.md    ← 最全，中文，推荐           │
│  strapi-backend/src/api/*/content-types/*/schema.json   │
│  strapi-backend/types/generated/contentTypes.d.ts       │
│                                                          │
├─ 3. 提交+部署 ───────────────────────────────────────────┤
│                                                          │
│  git add -A && git commit -m "..." && git push           │
│                                                          │
│  # 改了 strapi-backend/src/ 就先跑这个（顺序不能反）：      │
│  ssh root@server 'bash /home/deploy/abl_website/update-strapi.sh' │
│                                                          │
│  # 前端：                                                  │
│  ssh deploy@server 'bash /home/deploy/abl_website/update.sh' │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### What syncs and what doesn't

| 改动 | Git 同步? | 部署方式 |
|---|---|---|
| 前端代码 (Vue/CSS/JS) | ✅ 同步 | `update.sh` (Docker rebuild, ~30s) |
| Content-Type 结构 (增删字段) | ✅ 同步 (schema JSON) | **`update-strapi.sh`**（必须重新 build，见下） |
| `strapi-backend/src/` 下的任何改动 | ✅ 同步 | **`update-strapi.sh`** |
| Content 数据 (文章/制品内容) | ❌ 不同步 | 生产 Admin 手动建，或 export → import |
| 上传图片/文件 | ❌ 不同步 | 本地传测试图即可 |
| Strapi 配置 (plugins/权限) | ⚠️ 部分同步 | 大部分是数据库配置，不走 git |

### Changing Content-Types (important!)

**只能在 `develop` 模式下改**（production 模式禁用了 Content-Type Builder）：

```bash
# 本地
cd strapi-backend && npm run develop
# → Admin 面板改 Content-Type
# → git diff 看 schema.json 变了
# → git commit + push

# 服务器
ssh root@server 'bash /home/deploy/abl_website/update-strapi.sh'
```

**⚠️ 不要只 `pm2 restart strapi-main`——那样什么都不会生效。**

PM2 跑的是 `strapi start`，它加载编译产物 `strapi-backend/dist/`，**不读 `src/`**。而 `dist/` 是 git-ignored 的构建产物，所以 `git pull` 只更新了 `src/`。不跑 `npm run build`，新的内容类型根本不会被注册——`/api/<新类型>` 返回 404，**但 `pm2 restart` 会报成功、Strapi 会打印 `started successfully`，没有任何报错**。

2026-08-01 就是这么坏的：`work` 内容类型上线后 `/api/works` 一直 404，而所有信号都显示部署成功了。`update-strapi.sh` 把 build 固化进流程，并在结尾逐个 curl 端点，404 就以非零码退出。

另一个坑：`strapi build` 把 admin 面板的产物写进 `node_modules/@strapi/admin/` **里面**，所以任何一次重装依赖都会抹掉它，必须在 `npm install` 之后重建。脚本里的顺序已经处理了这一点。

Strapi 启动时会自动检测 schema 变更并迁移数据库——这部分是对的，缺的只是 build。

### Getting production data for local testing

生产数据不在 git 里，需要手动导出：

```bash
# 生产 Strapi Admin → Settings → Config Sync → Export
# 或命令行:
ssh root@server 'cd /home/deploy/abl_website/strapi-backend && npx strapi export -f /tmp/export.tar.gz'
scp root@server:/tmp/export.tar.gz .
cd strapi-backend && npx strapi import -f export.tar.gz --force
```

## Production Deployment (Hybrid Architecture)

The project runs on a single VPS under `deploy` user at `/home/deploy/abl_website/`.

**What runs where:**

| Component | Runtime | Details |
|---|---|---|
| **Frontend** | Docker (`abl-frontend`) | nginx:alpine serving `dist/` on `127.0.0.1:8080` |
| **PostgreSQL** | Docker (`abl-postgres`) | postgres:16-alpine on `127.0.0.1:5433` (host 5432 already taken by system postgres) |
| **Strapi** | Host (PM2 `strapi-main`) | Runs directly on host from `/home/deploy/abl_website/strapi-backend/`, connects to Docker PostgreSQL at `127.0.0.1:5433` |
| **Host nginx** | Host (system) | SSL termination + reverse proxy: `abl.secret-sealing.club` → `127.0.0.1:8080`, `api.abl.secret-sealing.club` → `127.0.0.1:1337` |

**Why Strapi is NOT in Docker:** Strapi's multi-stage build with native modules (sharp, better-sqlite3) is too heavy to rebuild on every deploy. Running it directly on the host via PM2 is faster and simpler.

**Deployment workflow:**
```bash
# As deploy user (Docker + nginx):
cd /home/deploy/abl_website
bash deploy.sh          # build frontend + start all Docker services
docker compose restart frontend  # restart frontend only
sudo nginx -s reload    # after nginx config changes

# As root (Strapi management):
bash update-strapi.sh   # 改了 strapi-backend/src/ 用这个：pull + build + restart + 验证端点
pm2 restart strapi-main # 只在没有代码改动时用（例如换了 .env、重连数据库）
pm2 logs strapi-main
```

Key config files for production:
- `docker-compose.yml` — PostgreSQL + Frontend services
- `ecosystem.config.js` — **PM2 进程定义（Strapi），含 `NODE_ENV=production`**。进程必须由它创建，不要再用命令行临时 `pm2 start npm ...`
- `strapi-backend/.env` — Strapi env（`DATABASE_CLIENT=postgres`、`DATABASE_HOST=127.0.0.1`、`DATABASE_PORT=5433`）。**不写 `NODE_ENV`**，那个由 `ecosystem.config.js` 给
- `strapi-backend/.env.dist` — 模板，**只放占位符**。这个仓库是公开的，写进去的真实密钥等于公开发布
- `/etc/nginx/sites-available/abl_website.conf` — host nginx reverse proxy
- `frontend/Dockerfile` — multi-stage build with npmmirror registry
- `update-strapi.sh` — **改了 `strapi-backend/src/` 走这个**（pull + build + restart + 验证端点）
- `deploy.sh` / `update.sh` — 前端与 Docker 服务

### 为什么生产必须是 `NODE_ENV=production`

development 模式下 Strapi 的 **Content-Type Builder 是开着的**——有人能直接在生产后台改数据结构，而那会写回服务器的 `strapi-backend/src/`，下次 `git pull` 必然冲突。数据结构只有一条合法路径：本地 `npm run develop` 改 → 提交 → `update-strapi.sh`。

本项目没有 `config/env/production/` 目录，所有配置都来自 `.env`，所以切换 `NODE_ENV` **不会**改变数据库或服务器配置——它唯一的作用就是关掉 Content-Type Builder 与其他 dev 专用行为。

首次切换（root）：

```bash
cd /home/deploy/abl_website
pm2 delete strapi-main          # 删掉旧的、命令行临时创建的进程
pm2 start ecosystem.config.js
pm2 save
```

## Architecture

### Frontend ↔ Backend contract
The frontend is client-rendered and talks to Strapi purely over REST. The API layer lives in `frontend/src/composables/strapi.js`:
- `apiClient` — an axios instance whose `baseURL` is `VITE_API_BASE_URL`.
- `getStrapiMedia(mediaObject)` — resolves media URLs, prepending `VITE_MEDIA_BASE_URL` (falls back to `VITE_STRAPI_URL`) to relative paths. It defensively handles both Strapi v4 (`data.attributes.url`) and v5 (`attributes.url` / `url`) media shapes.

`frontend/src/composables/useEventAPI.js` is **deprecated** (superseded by `strapi.js`); don't build on it.

Env vars (Vite `VITE_`-prefixed, per-mode files `frontend/.env.development` / `.env.production`):
- `VITE_STRAPI_URL` — Strapi origin.
- `VITE_API_BASE_URL` — API base (`<origin>/api`).
- `VITE_MEDIA_BASE_URL` — separate host for uploaded media (a CDN/image domain in both dev and prod).

Strapi API conventions that bite: endpoints are **not public by default** (403 until `find`/`findOne` are enabled for the Public role in the admin), and relations/media are **not returned unless** `?populate=...` is passed.

### Frontend structure
- `src/main.js` — entry; loads global CSS + `uno.css`, applies color tokens via `applyColorTokensToCssVars()`, registers Naive UI + router.
- `src/router/index.js` — all routes are statically imported (no lazy loading). Detail pages use `:slug` params (`/products/:slug`, `/events/:slug`); some project pages are hardcoded one-off views under `src/views/projects/`.
- `src/views/` — page-level components. `src/components/` — reusable presentational components.
- `src/config/` — `theme.js` (Naive UI theme + overrides, consumed by `App.vue`'s `n-config-provider`) and `colorTokens.js` (design tokens pushed into CSS vars).
- `ContentRenderer.vue` renders Strapi's structured/dynamic-zone content blocks (paragraphs, headings, and custom embeds like `product-embed`) into components.

UI/styling stack: **Naive UI** (component library), **UnoCSS** (`uno.config.js`), plus bytemd/marked for Markdown. An in-progress migration from Element Plus + hand-written CSS to Naive UI + UnoCSS is tracked in `UPGRADE_TODO.md`. Note: `unplugin-auto-import` / `unplugin-vue-components` are dependencies but are **not** wired into `vite.config.js` — import Vue APIs and Naive UI components explicitly.

Path alias: `@` → `frontend/src`.

### Backend (Strapi) structure
Content types live under `strapi-backend/src/api/<name>/content-types/<name>/schema.json` with default controllers/routes/services. Current collection types: **convention, event, product, project, work**. `work` 是转型后的作品实体（游戏/工具/活动站/出版物），`project` 已停止使用但保留集合以免生产库迁移风险。

Reusable components under `strapi-backend/src/components/` (e.g. `embedding.*` embeds, `content-block.content-block`, `staff.*`). The `event` type's `mainContent` is a **dynamic zone** composing these embed components — the frontend must handle each `__component` variant.

Database is env-driven (`config/database.ts`): **SQLite** in dev (`.tmp/data.db`), **PostgreSQL** in production (Docker container `abl-postgres`, exposed on host port 5433). Backend env lives in `strapi-backend/.env` (git-ignored); template at `strapi-backend/.env.dist`.

The read-only API surface is documented in `simpler_documentation.md`; `strapi-backend/openapi.json` / `backend_ap.json` hold fuller OpenAPI specs.

作品体系的设计见 `docs/superpowers/specs/2026-07-31-work-content-model-design.md`；内容录入清单见 `docs/content-migration/work-records.md`。

## Data-sync gotcha (important for onboarding)

Git syncs the **schema only**, not content or media:
- After `git pull`, the local DB is empty and uploaded images 404 — this is expected. Create test content and upload local images through the admin panel.
- When you change a content type, Strapi regenerates the schema JSON (and `types/generated/`). **These JSON changes must be committed** so teammates' DBs migrate automatically.
- Never commit `.env`, `public/uploads/`, or local SQLite DB files (all git-ignored).
