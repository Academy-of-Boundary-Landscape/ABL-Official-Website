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
pm2 restart strapi-main
pm2 logs strapi-main
```

Key config files for production:
- `docker-compose.yml` — PostgreSQL + Frontend services
- `strapi-backend/.env` — Strapi env (DATABASE_CLIENT=postgres, DATABASE_HOST=127.0.0.1, DATABASE_PORT=5433)
- `/etc/nginx/sites-available/abl_website.conf` — host nginx reverse proxy
- `frontend/Dockerfile` — multi-stage build with npmmirror registry
- `deploy.sh` — deployment helper script

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
Content types live under `strapi-backend/src/api/<name>/content-types/<name>/schema.json` with default controllers/routes/services. Current collection types: **convention, event, product, project**.

Reusable components under `strapi-backend/src/components/` (e.g. `embedding.*` embeds, `content-block.content-block`, `staff.*`). The `event` type's `mainContent` is a **dynamic zone** composing these embed components — the frontend must handle each `__component` variant.

Database is env-driven (`config/database.ts`): **SQLite** in dev (`.tmp/data.db`), **PostgreSQL** in production (Docker container `abl-postgres`, exposed on host port 5433). Backend env lives in `strapi-backend/.env` (git-ignored); template at `strapi-backend/.env.dist`.

The read-only API surface is documented in `simpler_documentation.md`; `strapi-backend/openapi.json` / `backend_ap.json` hold fuller OpenAPI specs.

## Data-sync gotcha (important for onboarding)

Git syncs the **schema only**, not content or media:
- After `git pull`, the local DB is empty and uploaded images 404 — this is expected. Create test content and upload local images through the admin panel.
- When you change a content type, Strapi regenerates the schema JSON (and `types/generated/`). **These JSON changes must be committed** so teammates' DBs migrate automatically.
- Never commit `.env`, `public/uploads/`, or local SQLite DB files (all git-ignored).
