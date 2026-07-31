# 作品体系与内容模型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立统一的 `work` 内容类型与配套前端页面，把社团的游戏、工具、活动站、出版物收进同一个作品体系，替换掉字段贫瘠、只能硬编码路由的 `project`。

**Architecture:** Strapi 新增 `work` 集合类型，用 `workType` 字段判别四种作品，类型专属字段走 `details` 动态区（至多一个组件）。`event` 增加 `relatedWork` 关联，使开发日志能挂到具体作品上。前端新增 `/works` 列表与 `/works/:slug` 详情，复用既有的 `useStrapiResource` 数据层与 `AsyncBoundary` 状态组件；渲染分支逻辑一律抽成 `src/utils/work.js` 里的纯函数以便在 Node 环境单测。旧的 `/project/*` 路径改为 `redirect` 路由。

**Tech Stack:** Vue 3 + Vite 7 + vue-router 4 + Naive UI 2.43 + UnoCSS + Vitest 3（Node 环境，无 jsdom）；Strapi 5.23.3 + axios。

配套设计文档：[作品体系与内容模型 · 设计](../specs/2026-07-31-work-content-model-design.md)

## Global Constraints

- **不引入 jsdom 或组件测试框架。** 需要验证的渲染逻辑一律先抽成纯函数再单测。
- **不修改 `product` / `convention` 的 schema**，一个字段不改、一条数据不删。
- **复用现有地基**：`useStrapiResource`、`AsyncBoundary`、`colorTokens`、Naive UI + UnoCSS。不新建平行的数据层、状态组件或色板。
- **不新增颜色 token。** 状态徽标全部复用既有 token（见 Task 3），新增 token 会牵动 `src/config/__tests__/tokens.spec.js` 的守卫测试。
- **旧链接不得 404**，一律用 `redirect` 路由，不得直接删除路径。
- **字段名用 `workType` 而非 `type`**（设计文档 §3.1 写作 `type`，本计划刻意收窄）。理由：`type` 同时是 Strapi 属性定义自身的键名，作为字段名有与内部 schema 词汇冲突的风险；`workType` 零成本规避。前端属性访问一律 `work.workType`。
- **`npm run lint` 在分支基线就以退出码 1 结束**（`csd20.vue` / `csd20music.vue` 上两条 `vue/multi-word-component-names`）。验收标准是"相对基线无新增错误"，不是"通过"。
- 每个 Task 结束时 `npm test` 全绿、`npm run build` 通过。

---

## File Structure

**Strapi（`strapi-backend/`）**

| 文件 | 职责 |
|---|---|
| `src/api/work/content-types/work/schema.json` | `work` 集合类型定义 |
| `src/api/work/controllers/work.ts` `routes/work.ts` `services/work.ts` | 核心工厂脚手架，与 `event` 同构 |
| `src/components/work/game-detail.json` | 游戏专属字段 |
| `src/components/work/tool-detail.json` | 工具专属字段 |
| `src/components/work/site-detail.json` | 活动站专属字段 |
| `src/components/work/publication-detail.json` | 出版物专属字段 |
| `src/components/work/recruiting-role.json` | 招募岗位（可重复） |
| `src/components/work/download-channel.json` | 下载渠道（可重复，游戏与工具共用） |
| `src/api/event/content-types/event/schema.json` | 改：`category` 枚举替换、新增 `relatedWork` |

**前端（`frontend/`）**

| 文件 | 职责 |
|---|---|
| `src/utils/work.js` | **纯函数**：类型/状态中文标签、`details` 动态区取块、平台串解析。全部可在 Node 下单测 |
| `src/utils/__tests__/work.spec.js` | 上者的测试 |
| `src/composables/useWorks.js` | `useWorkList` / `useWorkBySlug` / `useWorkNews`，固定 `populate` 与排序 |
| `src/composables/__tests__/works.spec.js` | 上者的测试 |
| `src/router/redirects.js` | **纯数据**：旧路径 → 新路径映射与路由记录生成 |
| `src/router/routes.js` | 路由表数组，从 `index.js` 抽出以便测试导入 |
| `src/router/__tests__/redirects.spec.js` | 用桩组件构造 router，验证重定向真的会跳 |
| `src/router/index.js` | 改：消费 `routes.js`，保留既有 `onError` |
| `src/components/work/StatusBadge.vue` | `status` + `recruiting` 徽标 |
| `src/components/work/WorkCard.vue` | 列表卡片，**必须处理无封面的预告态** |
| `src/components/work/ContentBlocks.vue` | `body` 动态区渲染（Markdown / 链接 / iframe / 文件四种块），自带样式 |
| `src/components/work/GameDetail.vue` | 游戏专属区块 |
| `src/components/work/ToolDetail.vue` | 工具专属区块（多渠道下载、更新日志） |
| `src/components/work/SiteDetail.vue` | 活动站专属区块 |
| `src/components/work/PublicationDetail.vue` | 出版物专属区块 |
| `src/views/WorkList.vue` | `/works` |
| `src/views/WorkDetail.vue` | `/works/:slug` |
| `src/components/ProjectsBar.vue` | 改：数据源换成 `useWorkList` |
| `src/components/SiteHeader.vue` | 改：下拉数据源换成 `useWorkList`，链接指向 `/works/:slug` |
| `src/composables/useProjects.js` | **删除** |
| `src/views/zyzView.vue` | **删除**（正文先导出到 `docs/content-migration/`） |

**文档**

| 文件 | 职责 |
|---|---|
| `docs/content-migration/zhu-yuanzhang.md` | 从 `zyzView.vue` 提取的正文，供人工录入 Strapi |
| `docs/content-migration/work-records.md` | 10 条 work 记录的录入清单 |

---

### Task 1: Strapi 内容模型

建立 `work` 集合类型、六个组件，并改造 `event`。这是全部后续任务的地基——前端拿不到 `/api/works` 就什么都做不了。

**Files:**
- Create: `strapi-backend/src/components/work/download-channel.json`
- Create: `strapi-backend/src/components/work/recruiting-role.json`
- Create: `strapi-backend/src/components/work/game-detail.json`
- Create: `strapi-backend/src/components/work/tool-detail.json`
- Create: `strapi-backend/src/components/work/site-detail.json`
- Create: `strapi-backend/src/components/work/publication-detail.json`
- Create: `strapi-backend/src/api/work/content-types/work/schema.json`
- Create: `strapi-backend/src/api/work/controllers/work.ts`
- Create: `strapi-backend/src/api/work/routes/work.ts`
- Create: `strapi-backend/src/api/work/services/work.ts`
- Modify: `strapi-backend/src/api/event/content-types/event/schema.json`
- Modify（自动重新生成，需提交）: `strapi-backend/types/generated/contentTypes.d.ts`、`strapi-backend/types/generated/components.d.ts`

**Interfaces:**
- Produces: REST 端点 `GET /api/works`、`GET /api/works?filters[slug][$eq]=<slug>`；`work` 字段名 `title` `slug` `workType` `status` `recruiting` `recruitingRoles` `summary` `coverImage` `body` `staff` `details` `startDate` `featured` `order` `customView` `news`；`event` 新增字段 `relatedWork`；`details` 动态区组件标识 `work.game-detail` / `work.tool-detail` / `work.site-detail` / `work.publication-detail`。

- [ ] **Step 1: 建两个共用组件**

`strapi-backend/src/components/work/download-channel.json`：

```json
{
  "collectionName": "components_work_download_channels",
  "info": {
    "displayName": "downloadChannel",
    "icon": "download"
  },
  "options": {},
  "attributes": {
    "channelName": {
      "type": "string",
      "required": true
    },
    "url": {
      "type": "string",
      "required": true
    }
  },
  "config": {}
}
```

`strapi-backend/src/components/work/recruiting-role.json`：

```json
{
  "collectionName": "components_work_recruiting_roles",
  "info": {
    "displayName": "recruitingRole",
    "icon": "user"
  },
  "options": {},
  "attributes": {
    "roleName": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "count": {
      "type": "integer"
    }
  },
  "config": {}
}
```

- [ ] **Step 2: 建四个类型专属组件**

`strapi-backend/src/components/work/game-detail.json`：

```json
{
  "collectionName": "components_work_game_details",
  "info": {
    "displayName": "gameDetail",
    "icon": "puzzle"
  },
  "options": {},
  "attributes": {
    "platforms": {
      "type": "string"
    },
    "basedOn": {
      "type": "string"
    },
    "engine": {
      "type": "string"
    },
    "trailerUrl": {
      "type": "string"
    },
    "screenshots": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"]
    },
    "downloads": {
      "type": "component",
      "repeatable": true,
      "component": "work.download-channel"
    }
  },
  "config": {}
}
```

`strapi-backend/src/components/work/tool-detail.json`：

```json
{
  "collectionName": "components_work_tool_details",
  "info": {
    "displayName": "toolDetail",
    "icon": "code"
  },
  "options": {},
  "attributes": {
    "repoUrl": {
      "type": "string"
    },
    "homepage": {
      "type": "string"
    },
    "platforms": {
      "type": "string"
    },
    "currentVersion": {
      "type": "string"
    },
    "license": {
      "type": "string"
    },
    "downloads": {
      "type": "component",
      "repeatable": true,
      "component": "work.download-channel"
    },
    "changelog": {
      "type": "richtext"
    }
  },
  "config": {}
}
```

`strapi-backend/src/components/work/site-detail.json`：

```json
{
  "collectionName": "components_work_site_details",
  "info": {
    "displayName": "siteDetail",
    "icon": "globe"
  },
  "options": {},
  "attributes": {
    "url": {
      "type": "string",
      "required": true
    },
    "eventDate": {
      "type": "date"
    },
    "participantCount": {
      "type": "integer"
    }
  },
  "config": {}
}
```

`strapi-backend/src/components/work/publication-detail.json`：

```json
{
  "collectionName": "components_work_publication_details",
  "info": {
    "displayName": "publicationDetail",
    "icon": "book"
  },
  "options": {},
  "attributes": {
    "releaseDate": {
      "type": "date"
    },
    "spec": {
      "type": "string"
    },
    "contributorCount": {
      "type": "integer"
    }
  },
  "config": {}
}
```

- [ ] **Step 3: 建 `work` 集合类型**

`strapi-backend/src/api/work/content-types/work/schema.json`：

```json
{
  "kind": "collectionType",
  "collectionName": "works",
  "info": {
    "singularName": "work",
    "pluralName": "works",
    "displayName": "work"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "workType": {
      "type": "enumeration",
      "enum": ["game", "tool", "site", "publication"],
      "required": true
    },
    "status": {
      "type": "enumeration",
      "enum": [
        "planned",
        "in-development",
        "released",
        "maintained",
        "ended",
        "discontinued"
      ],
      "required": true
    },
    "recruiting": {
      "type": "boolean",
      "default": false
    },
    "recruitingRoles": {
      "type": "component",
      "repeatable": true,
      "component": "work.recruiting-role"
    },
    "summary": {
      "type": "text",
      "required": true
    },
    "coverImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "body": {
      "type": "dynamiczone",
      "components": [
        "content-block.content-block",
        "embedding.link-embed",
        "embedding.iframe-embed",
        "embedding.file-embed"
      ]
    },
    "staff": {
      "type": "component",
      "repeatable": true,
      "component": "staff.staff"
    },
    "details": {
      "type": "dynamiczone",
      "max": 1,
      "components": [
        "work.game-detail",
        "work.tool-detail",
        "work.site-detail",
        "work.publication-detail"
      ]
    },
    "startDate": {
      "type": "date"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "customView": {
      "type": "string"
    },
    "news": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::event.event",
      "mappedBy": "relatedWork"
    }
  }
}
```

**`body` 只放 Task 4 的 `ContentBlocks.vue` 真正会渲染的四种嵌入块。** `event.mainContent` 里还有 `embedding.product-embed` 与 `embedding.pdf-embed`——前者需要二次批量补全制品数据（`useProductsByIds` + `ProductCard`），后者在 `EventDetail.vue` 里其实**从未被渲染**（该组件的 `v-if` 链里没有它，是既有的遗留问题）。给 `work.body` 开一个前端会静默丢弃的块类型，等于给编辑埋一个"填了没反应"的坑。需要时再加是纯增量改动。

**`coverImage` 刻意不加 `required`。** 设计文档 §3.1：新游戏是预告态条目，没有封面。现有 `project.coverImage` 是 `required`，正是预告态建不出来的直接原因。**不要"顺手补上"这个必填。**

**`details` 的 `max: 1`** 把"至多挂一个组件"从约定变成 schema 层约束。**如果 Strapi 启动时报出 `max` 不被动态区接受**，去掉这个键，改为依赖 Task 2 的 `resolveDetailBlock()` 降级（该函数已覆盖"挂多个"与"类型不匹配"两种情况）。启动报错即为证据，不要凭猜测提前删掉。

- [ ] **Step 4: 建三个脚手架文件**

三份与 `src/api/event/` 下同名文件逐字同构，只把 `event` 换成 `work`。

`strapi-backend/src/api/work/controllers/work.ts`：

```ts
/**
 * work controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::work.work');
```

`strapi-backend/src/api/work/routes/work.ts`：

```ts
/**
 * work router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::work.work');
```

`strapi-backend/src/api/work/services/work.ts`：

```ts
/**
 * work service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::work.work');
```

- [ ] **Step 5: 改造 `event`**

在 `strapi-backend/src/api/event/content-types/event/schema.json` 的 `attributes` 里，把 `category` 整块替换为下面这段，并在 `mainContent` 之后追加 `relatedWork`。其余字段（`title` `slug` `date` `coverImage` `isUrgent` `mainContent`）**一个字都不动**：

```json
    "category": {
      "type": "enumeration",
      "enum": ["devlog", "announcement", "release"]
    },
    "relatedWork": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::work.work",
      "inversedBy": "news"
    }
```

生产库里 10 条既有数据的枚举迁移映射（`new-project` → `release`、`monthly-release` → `release`、`announcement` 不变）属于人工内容操作，写在 Task 6 的迁移清单里，本步不涉及。本地开发库是空的，无数据迁移问题。

- [ ] **Step 6: 启动 Strapi，验证内容类型被接受**

```bash
cd strapi-backend
cp -n .env.dev .env
npm install
npm run develop
```

Expected：启动日志无 schema 错误，末尾打印 admin 与 API 地址。若因 `details` 的 `max` 键报错，按 Step 3 的说明去掉它再启动。

保持进程运行，另开一个终端做下一步。

- [ ] **Step 7: 验证 REST 端点存在**

```bash
curl -s -o /dev/null -w '%{http_code}\n' --noproxy '*' http://localhost:1337/api/works
```

Expected：`403`（路由存在但 Public 角色未授权）。**`404` 说明内容类型没被注册**，回到 Step 3 检查。

然后在 `http://localhost:1337/admin` → Settings → Roles → Public，为 **work** 勾选 `find` 与 `findOne` 并保存。再跑一次：

```bash
curl -s --noproxy '*' 'http://localhost:1337/api/works' | head -c 200
```

Expected：`200`，返回 `{"data":[],"meta":{"pagination":{...}}}`。

- [ ] **Step 8: 建一条预告态种子数据**

后续任务需要本地有数据可渲染，且**预告态是本轮最容易做错的一处**（设计文档 §5），必须尽早有真实样本。

在 admin 面板新建一条 work 并发布：

- `title`：`新游戏企划`
- `slug`：`new-game`（由 title 自动生成后手工改成这个值）
- `workType`：`game`
- `status`：`in-development`
- `recruiting`：开
- `recruitingRoles`：加一条，`roleName` = `美术 / 立绘`，`description` = `负责角色立绘与 UI 素材`，`count` = `2`
- `summary`：`内核开发完成，正在招募美术资产制作者。`
- **`coverImage`：留空**
- **`body`：留空**
- **`details`：留空**

再建第二条用于对照的完整条目并发布：

- `title`：`THTK-Studio`，`slug`：`thtk-studio`，`workType`：`tool`，`status`：`maintained`
- `summary`：`面向东方 Project 资源的图形化集成脚本编辑器。`
- `details` 挂 `toolDetail`：`repoUrl` = `https://github.com/Renko6626/THTK-Studio`，`platforms` = `Windows`，`currentVersion` = `1.0`
- `featured`：开

验证：

```bash
curl -s --noproxy '*' 'http://localhost:1337/api/works?populate=*' | head -c 600
```

Expected：返回两条数据，`new-game` 那条的 `coverImage` 为 `null`、`details` 为 `[]`。

- [ ] **Step 9: 提交**

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git add strapi-backend/src/api/work strapi-backend/src/components/work \
        strapi-backend/src/api/event/content-types/event/schema.json \
        strapi-backend/types/generated
git commit -m "feat: :sparkles: 新增 work 内容类型与六个配套组件，event 加 relatedWork 关联"
```

`types/generated/` 是 Strapi 启动时自动重新生成的，必须一并提交——队友 `git pull` 后类型才对得上。

---

### Task 2: 前端资源层与纯函数

把所有会产生渲染分支的判断抽成纯函数，再建资源层封装。这两块是本计划唯一能被自动化测试完整覆盖的部分，先做。

**Files:**
- Create: `frontend/src/utils/work.js`
- Create: `frontend/src/utils/__tests__/work.spec.js`
- Create: `frontend/src/composables/useWorks.js`
- Create: `frontend/src/composables/__tests__/works.spec.js`

**Interfaces:**
- Consumes: Task 1 的 `/api/works` 端点与字段名；既有 `useStrapiList(resource, params, options)` / `useStrapiOne(resource, params)`（见 `src/composables/useStrapiResource.js`）。
- Produces:
  - `src/utils/work.js`：`WORK_TYPES: string[]`、`WORK_STATUSES: string[]`、`typeLabel(workType) → string`、`statusLabel(status) → string`、`resolveDetailBlock(details, workType) → object|null`、`parsePlatforms(raw) → string[]`
  - `src/composables/useWorks.js`：`useWorkList({ workType, featuredOnly, limit }) → { data, meta, loading, error, isEmpty, refresh }`、`useWorkBySlug(slug) → { data, loading, error, notFound, refresh }`、`useWorkNews(slug, limit) → { data, meta, loading, error, isEmpty, refresh }`

- [ ] **Step 1: 写 `src/utils/__tests__/work.spec.js`（先失败）**

```js
import { describe, it, expect } from 'vitest'
import {
  WORK_TYPES,
  WORK_STATUSES,
  typeLabel,
  statusLabel,
  resolveDetailBlock,
  parsePlatforms,
} from '@/utils/work'

describe('常量', () => {
  it('四种作品类型与六种状态，顺序即列表页与后台的展示顺序', () => {
    expect(WORK_TYPES).toEqual(['game', 'tool', 'site', 'publication'])
    expect(WORK_STATUSES).toEqual([
      'planned',
      'in-development',
      'released',
      'maintained',
      'ended',
      'discontinued',
    ])
  })
})

describe('typeLabel / statusLabel', () => {
  it('四种类型都有中文标签', () => {
    expect(typeLabel('game')).toBe('游戏')
    expect(typeLabel('tool')).toBe('工具')
    expect(typeLabel('site')).toBe('活动站')
    expect(typeLabel('publication')).toBe('出版物')
  })

  it('六种状态都有中文标签', () => {
    expect(statusLabel('planned')).toBe('构思中')
    expect(statusLabel('in-development')).toBe('开发中')
    expect(statusLabel('released')).toBe('已发布')
    expect(statusLabel('maintained')).toBe('持续维护')
    expect(statusLabel('ended')).toBe('已结束')
    expect(statusLabel('discontinued')).toBe('已停止')
  })

  it('未知值不抛错——后台加了新枚举值而前端没跟上时，页面不能白屏', () => {
    expect(typeLabel('nonsense')).toBe('作品')
    expect(typeLabel(undefined)).toBe('作品')
    expect(statusLabel('nonsense')).toBe('')
    expect(statusLabel(null)).toBe('')
  })
})

describe('resolveDetailBlock', () => {
  const gameBlock = { __component: 'work.game-detail', engine: 'thcrap' }
  const toolBlock = { __component: 'work.tool-detail', repoUrl: 'https://example.com' }

  it('取出与 workType 匹配的那一块', () => {
    expect(resolveDetailBlock([gameBlock], 'game')).toBe(gameBlock)
    expect(resolveDetailBlock([toolBlock], 'tool')).toBe(toolBlock)
  })

  it('动态区里挂了不匹配的组件时返回 null，详情页降级为只渲染 body', () => {
    expect(resolveDetailBlock([toolBlock], 'game')).toBeNull()
  })

  it('挂了多个组件时只认匹配的那个——schema 的 max:1 若失效，前端仍然确定', () => {
    expect(resolveDetailBlock([toolBlock, gameBlock], 'game')).toBe(gameBlock)
  })

  it('预告态：动态区为空、为 null、字段缺失都返回 null 而不抛错', () => {
    expect(resolveDetailBlock([], 'game')).toBeNull()
    expect(resolveDetailBlock(null, 'game')).toBeNull()
    expect(resolveDetailBlock(undefined, 'game')).toBeNull()
    expect(resolveDetailBlock([gameBlock], undefined)).toBeNull()
    expect(resolveDetailBlock([null, gameBlock], 'game')).toBe(gameBlock)
  })
})

describe('parsePlatforms', () => {
  it('半角逗号、全角逗号、顿号、空格都能分隔', () => {
    expect(parsePlatforms('Windows,Android')).toEqual(['Windows', 'Android'])
    expect(parsePlatforms('Windows，Android')).toEqual(['Windows', 'Android'])
    expect(parsePlatforms('Windows、Android')).toEqual(['Windows', 'Android'])
    expect(parsePlatforms('Windows Android')).toEqual(['Windows', 'Android'])
  })

  it('空值与全分隔符返回空数组，不返回 [""]', () => {
    expect(parsePlatforms('')).toEqual([])
    expect(parsePlatforms(null)).toEqual([])
    expect(parsePlatforms(undefined)).toEqual([])
    expect(parsePlatforms(' , , ')).toEqual([])
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx vitest run src/utils/__tests__/work.spec.js
```

Expected：FAIL，报 `Failed to resolve import "@/utils/work"`。

- [ ] **Step 3: 写 `src/utils/work.js`**

```js
export const WORK_TYPES = ['game', 'tool', 'site', 'publication']

export const WORK_STATUSES = [
  'planned',
  'in-development',
  'released',
  'maintained',
  'ended',
  'discontinued',
]

const TYPE_LABELS = {
  game: '游戏',
  tool: '工具',
  site: '活动站',
  publication: '出版物',
}

const STATUS_LABELS = {
  planned: '构思中',
  'in-development': '开发中',
  released: '已发布',
  maintained: '持续维护',
  ended: '已结束',
  discontinued: '已停止',
}

const DETAIL_COMPONENT_BY_TYPE = {
  game: 'work.game-detail',
  tool: 'work.tool-detail',
  site: 'work.site-detail',
  publication: 'work.publication-detail',
}

/** 未知类型回落到通用字样，不返回空串——卡片上的类型位不能是空白 */
export const typeLabel = (workType) => TYPE_LABELS[workType] ?? '作品'

/** 未知状态回落到空串——徽标整个不渲染，比显示 "undefined" 好 */
export const statusLabel = (status) => STATUS_LABELS[status] ?? ''

/**
 * 从 details 动态区里挑出与 workType 匹配的那一块。
 *
 * schema 已用 max:1 限制至多挂一个组件，但这里不依赖那条约束：
 * 后台可能挂错类型（游戏条目挂了 toolDetail），也可能 max 键在某个
 * Strapi 版本上失效。任何异常情况一律返回 null，详情页降级为只渲染 body。
 */
export const resolveDetailBlock = (details, workType) => {
  const expected = DETAIL_COMPONENT_BY_TYPE[workType]
  if (!expected || !Array.isArray(details)) return null
  return details.find((block) => block?.__component === expected) ?? null
}

/** 平台是自由文本，允许半角/全角逗号、顿号、空格混用 */
export const parsePlatforms = (raw) =>
  String(raw ?? '')
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd frontend && npx vitest run src/utils/__tests__/work.spec.js
```

Expected：PASS，20 条左右断言全绿。

- [ ] **Step 5: 写 `src/composables/__tests__/works.spec.js`（先失败）**

沿用 `src/composables/__tests__/resources.spec.js` 的组织方式：`effectScope` 包裹、`vi.spyOn(apiClient, 'get')`、`flush()` 等待。

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useWorkList, useWorkBySlug, useWorkNews } from '@/composables/useWorks'

const withScope = (fn) => {
  const scope = effectScope()
  const result = scope.run(fn)
  return { result, stop: () => scope.stop() }
}
const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

let get
const paramsOf = (call = 0) => get.mock.calls[call][1].params
const pathOf = (call = 0) => get.mock.calls[call][0]

beforeEach(() => {
  get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: [], meta: null } })
})
afterEach(() => vi.restoreAllMocks())

describe('useWorkList', () => {
  it('固定带 coverImage 与三级排序——精选优先、手工序次之、开始时间兜底', async () => {
    const { stop } = withScope(() => useWorkList())
    await flush()
    expect(pathOf()).toBe('/works')
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('featured:desc,order:desc,startDate:desc')
    expect(paramsOf().filters).toBeUndefined()
    stop()
  })

  it('workType 映射到 filters，"all" 与空值不产生过滤', async () => {
    const workType = ref('all')
    const { stop } = withScope(() => useWorkList({ workType }))
    await flush()
    expect(paramsOf().filters).toBeUndefined()

    workType.value = 'game'
    await flush()
    expect(paramsOf(1).filters).toEqual({ workType: { $eq: 'game' } })

    workType.value = ''
    await flush()
    expect(paramsOf(2).filters).toBeUndefined()
    stop()
  })

  it('featuredOnly 产生 featured 过滤', async () => {
    const { stop } = withScope(() => useWorkList({ featuredOnly: true }))
    await flush()
    expect(paramsOf().filters).toEqual({ featured: { $eq: true } })
    stop()
  })

  it('limit 映射到 pagination[limit]，ref(0) 不应发送——不能用裸 Ref 做真值判断', async () => {
    const { stop } = withScope(() => useWorkList({ limit: ref(0) }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBeUndefined()
    stop()

    const s2 = withScope(() => useWorkList({ limit: 6 }))
    await flush()
    expect(paramsOf(1)['pagination[limit]']).toBe(6)
    s2.stop()
  })
})

describe('useWorkBySlug', () => {
  it('按 slug 过滤，并深挖 body 与 details 两个动态区', async () => {
    const { stop } = withScope(() => useWorkBySlug('new-game'))
    await flush()
    expect(pathOf()).toBe('/works')
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'new-game' } })
    // 动态区内层的媒体（游戏截图）不深挖就取不到
    expect(paramsOf().populate).toEqual({
      coverImage: true,
      staff: true,
      recruitingRoles: true,
      body: { populate: '*' },
      details: { populate: '*' },
    })
    stop()
  })

  it('slug 变化会重新请求', async () => {
    const slug = ref('a')
    const { stop } = withScope(() => useWorkBySlug(slug))
    await flush()
    slug.value = 'b'
    await flush()
    expect(paramsOf(1).filters).toEqual({ slug: { $eq: 'b' } })
    stop()
  })
})

describe('useWorkNews', () => {
  it('按关联作品的 slug 过滤 events，日期倒序', async () => {
    const { stop } = withScope(() => useWorkNews('thtk-studio'))
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().filters).toEqual({ relatedWork: { slug: { $eq: 'thtk-studio' } } })
    expect(paramsOf().sort).toBe('date:desc')
    expect(paramsOf()['pagination[limit]']).toBe(10)
    stop()
  })

  it('slug 为空时不发请求——详情页数据还没落地时不能先打一发无过滤的全量查询', async () => {
    const { stop } = withScope(() => useWorkNews(ref('')))
    await flush()
    expect(get).not.toHaveBeenCalled()
    stop()
  })
})
```

- [ ] **Step 6: 跑测试确认失败**

```bash
cd frontend && npx vitest run src/composables/__tests__/works.spec.js
```

Expected：FAIL，报 `Failed to resolve import "@/composables/useWorks"`。

- [ ] **Step 7: 写 `src/composables/useWorks.js`**

```js
import { toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

/**
 * 作品列表。排序语义：精选置顶 → 手工序 → 开始时间。
 * sort 用逗号分隔的字符串而不是数组：axios 会把数组序列化成 sort[]=…，
 * Strapi 认的是 sort=a:desc,b:desc。
 */
export function useWorkList({ workType, featuredOnly, limit } = {}, options = {}) {
  return useStrapiList(
    'works',
    () => {
      const t = String(toValue(workType) ?? '').trim()
      const lim = toValue(limit)
      const filters = {}
      if (t && t !== 'all') filters.workType = { $eq: t }
      if (toValue(featuredOnly)) filters.featured = { $eq: true }
      return {
        populate: 'coverImage',
        sort: 'featured:desc,order:desc,startDate:desc',
        ...(lim ? { 'pagination[limit]': lim } : {}),
        ...(Object.keys(filters).length ? { filters } : {}),
      }
    },
    options,
  )
}

/**
 * 作品详情。body 与 details 是动态区，内层还有媒体（游戏截图）与
 * 可重复组件（下载渠道），不写 { populate: '*' } 深挖就只能拿到组件外壳。
 */
export function useWorkBySlug(slug) {
  return useStrapiOne('works', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: {
      coverImage: true,
      staff: true,
      recruitingRoles: true,
      body: { populate: '*' },
      details: { populate: '*' },
    },
  }))
}

/**
 * 某个作品的开发日志与发布动态。
 * slug 为空时不发请求：详情页先取 work 再取 news，slug 落地前发出去的
 * 请求会因为 filters 里带 undefined 被 axios 丢弃，变成一次无过滤的全量查询。
 */
export function useWorkNews(slug, limit = 10) {
  return useStrapiList(
    'events',
    () => ({
      filters: { relatedWork: { slug: { $eq: toValue(slug) } } },
      populate: 'coverImage',
      sort: 'date:desc',
      'pagination[limit]': limit,
    }),
    { immediate: Boolean(toValue(slug)) },
  )
}
```

- [ ] **Step 8: 跑全量测试**

```bash
cd frontend && npm test
```

Expected：既有 66 条 + 本任务新增全部通过。**若既有测试出现失败，说明改动越界了**——本任务只新增文件，不改任何既有文件。

- [ ] **Step 9: 提交**

```bash
git add frontend/src/utils frontend/src/composables/useWorks.js \
        frontend/src/composables/__tests__/works.spec.js
git commit -m "feat: :sparkles: 新增 work 资源层与纯函数工具，含单元测试"
```

---

### Task 3: 作品列表页与路由骨架

建 `/works` 列表页、两个展示组件，并把路由表抽成可测试的模块。

**Files:**
- Create: `frontend/src/components/work/StatusBadge.vue`
- Create: `frontend/src/components/work/WorkCard.vue`
- Create: `frontend/src/views/WorkList.vue`
- Create: `frontend/src/router/routes.js`
- Modify: `frontend/src/router/index.js`

**Interfaces:**
- Consumes: Task 2 的 `useWorkList`、`typeLabel`、`statusLabel`、`WORK_TYPES`；既有 `AsyncBoundary`（props：`loading` `error` `empty` `skeleton` `loadingText` `emptyText`，事件 `retry`）；既有 `getStrapiMedia(mediaObject)`（`@/composables/strapi`）。
- Produces: `src/router/routes.js` 默认导出 `routes` 数组；路由 name `works`（`/works`）；`StatusBadge` props `{ status: String, recruiting: Boolean }`；`WorkCard` props `{ work: Object }`。

**不新增颜色 token。** 徽标配色全部复用 `colorTokens.js` 既有值：招募中用 `var(--color-accent)`，`in-development` 用 `var(--color-warning)`，`released` / `maintained` 用 `var(--color-success)`，`ended` / `discontinued` 用 `var(--color-text-subtle)`，`planned` 用 `var(--color-text-muted)`。新增 token 会牵动 `src/config/__tests__/tokens.spec.js` 的守卫测试。

- [ ] **Step 1: 写 `src/components/work/StatusBadge.vue`**

```vue
<template>
  <span class="status-badge-group">
    <span v-if="label" class="status-badge" :class="`is-${status}`">{{ label }}</span>
    <span v-if="recruiting" class="status-badge is-recruiting">招募中</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { statusLabel } from '@/utils/work'

const props = defineProps({
  status: { type: String, default: '' },
  recruiting: { type: Boolean, default: false },
})

// 未知状态时 statusLabel 返回空串，整个徽标不渲染
const label = computed(() => statusLabel(props.status))
</script>

<style scoped>
.status-badge-group {
  display: inline-flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border: 1px solid currentColor;
  color: var(--color-text-muted);
}

.is-planned {
  color: var(--color-text-muted);
}
.is-in-development {
  color: var(--color-warning);
}
.is-released,
.is-maintained {
  color: var(--color-success);
}
.is-ended,
.is-discontinued {
  color: var(--color-text-subtle);
}
.is-recruiting {
  color: var(--color-accent);
}
</style>
```

- [ ] **Step 2: 写 `src/components/work/WorkCard.vue`**

**预告态是这个组件的主要风险**：`coverImage` 可能为 `null`，`summary` 可能很短。没有封面时必须渲染占位块而不是破图或塌陷的空白。

```vue
<template>
  <RouterLink :to="`/works/${work.slug}`" class="work-card">
    <div class="work-card-media">
      <img v-if="coverUrl" :src="coverUrl" :alt="work.title" loading="lazy" />
      <!-- 预告态：新作品往往还没有封面，这里必须撑住卡片高度 -->
      <div v-else class="work-card-placeholder">
        <span>{{ typeText }}</span>
      </div>
    </div>

    <div class="work-card-body">
      <div class="work-card-meta">
        <span class="work-card-type">{{ typeText }}</span>
        <StatusBadge :status="work.status" :recruiting="Boolean(work.recruiting)" />
      </div>
      <h3 class="work-card-title">{{ work.title }}</h3>
      <p class="work-card-summary">{{ work.summary }}</p>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getStrapiMedia } from '@/composables/strapi'
import { typeLabel } from '@/utils/work'
import StatusBadge from '@/components/work/StatusBadge.vue'

const props = defineProps({
  work: { type: Object, required: true },
})

const coverUrl = computed(() => getStrapiMedia(props.work?.coverImage))
const typeText = computed(() => typeLabel(props.work?.workType))
</script>

<style scoped>
.work-card {
  display: flex;
  flex-direction: column;
  background: var(--color-box-strong);
  border: 1px solid var(--color-border-soft);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.work-card:hover {
  border-color: var(--color-hover-border);
  box-shadow: 0 0 16px var(--color-box-glow);
}

.work-card-media {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.work-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 无封面时的占位：与图片同样的宽高比，卡片高度不塌 */
.work-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-sunken);
  color: var(--color-text-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
  letter-spacing: 0.2em;
}

.work-card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.work-card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.work-card-type {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  color: var(--color-text-subtle);
}

.work-card-title {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-heading);
}

.work-card-summary {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
}
</style>
```

- [ ] **Step 3: 写 `src/views/WorkList.vue`**

```vue
<template>
  <div class="work-list-view container">
    <header class="page-header">
      <h1 class="section-title">作品 // Works</h1>
      <p class="page-lead">为了做二创游戏，我们造了做二创游戏的工具，然后把工具开源给了所有人。</p>
    </header>

    <nav class="type-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="type-tab"
        :class="{ 'is-active': activeType === tab.value }"
        @click="activeType = tab.value"
      >
        {{ tab.label }}
      </button>
    </nav>

    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      empty-text=">> 该分类下暂无作品。"
      @retry="refresh"
    >
      <div class="work-grid">
        <WorkCard v-for="work in data" :key="work.id" :work="work" />
      </div>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWorkList } from '@/composables/useWorks'
import { typeLabel } from '@/utils/work'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import WorkCard from '@/components/work/WorkCard.vue'

// site 与 publication 合并进"其他"：各自只有个位数条目，单独开页签是空架子
const activeType = ref('all')

const tabs = computed(() => [
  { value: 'all', label: '全部' },
  { value: 'game', label: typeLabel('game') },
  { value: 'tool', label: typeLabel('tool') },
  { value: 'other', label: '其他' },
])

// "其他"要一次拿 site 与 publication 两类，用 $in 而不是 $eq，
// 所以这里不能直接把 activeType 交给 useWorkList 的 workType。
const workType = computed(() => (activeType.value === 'other' ? 'all' : activeType.value))

const { data: rawData, loading, error, refresh } = useWorkList({ workType })

const data = computed(() => {
  const list = rawData.value ?? []
  if (activeType.value !== 'other') return list
  return list.filter((w) => w?.workType === 'site' || w?.workType === 'publication')
})

// isEmpty 要看前端过滤之后的结果，不是资源层的原始列表——
// 否则"其他"页签在过滤光时会误判为非空，渲染出一个空网格。
const isEmpty = computed(() => !loading.value && !error.value && data.value.length === 0)
</script>

<style scoped>
.page-lead {
  color: var(--color-text-muted);
  max-width: 42rem;
  line-height: 1.8;
}

.type-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.type-tab {
  padding: 0.4rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.type-tab:hover {
  color: var(--color-heading);
  border-color: var(--color-hover-border);
}

.type-tab.is-active {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.work-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* 移动优先：窄屏单列，sm 起两列，lg 起三列 */
@screen sm {
  .work-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@screen lg {
  .work-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
```

- [ ] **Step 4: 抽出 `src/router/routes.js`**

把 `src/router/index.js` 里的 `routes` 数组原样搬进新文件，并追加 `/works` 一条。**九条既有路由的 path、name、component 一个字都不改。**

```js
export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/recruitment',
    name: 'recruitment',
    component: () => import('../views/RecruitmentView.vue'),
  },
  {
    path: '/project/zhu-yuanzhang',
    name: 'zhu-yuanzhang',
    component: () => import('../views/zyzView.vue'),
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('../views/ProductList.vue'),
  },
  {
    path: '/products/:slug',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue'),
  },
  {
    path: '/events',
    name: 'EventList',
    component: () => import('../views/EventList.vue'),
  },
  {
    path: '/events/:slug',
    name: 'EventDetail',
    component: () => import('../views/EventDetail.vue'),
  },
  {
    path: '/project/csd20',
    name: 'csd20',
    component: () => import('../views/projects/csd20.vue'),
  },
  {
    path: '/project/csd20/music',
    name: 'csd20music',
    component: () => import('../views/projects/csd20music.vue'),
  },
  {
    path: '/works',
    name: 'works',
    component: () => import('../views/WorkList.vue'),
  },
]

export default routes
```

- [ ] **Step 5: 改 `src/router/index.js` 消费它**

只替换 `routes` 的来源，**`router.onError` 那段整块保留不动**：

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 部署后 chunk 文件名会变，已打开的旧页面点击导航会请求到不存在的 chunk。
// 动态 import 失败时 vue-router 会静默中止导航——点击看起来毫无反应。
// 这里捕获该错误并整页重载，让用户拿到新版本。
router.onError((err) => {
  const message = err?.message ?? ''
  if (
    /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(
      message,
    )
  ) {
    window.location.reload()
  }
})

export default router
```

- [ ] **Step 6: 跑测试与构建**

```bash
cd frontend && npm test && npm run build
```

Expected：测试全绿（本步没加测试，但既有测试不能被路由重构打破）；构建成功，产物里出现新的 `WorkList` chunk。

- [ ] **Step 7: 起开发服务器肉眼确认**

Strapi 需在 1337 运行（Task 1 Step 6 起的进程，若已关闭则重启）。

```bash
cd frontend && npm run dev
```

访问 `http://localhost:5173/works`。Expected：

- 两条种子数据都出现
- **`new-game` 那张卡显示"游戏"占位块而不是破图**，卡片高度与 `thtk-studio` 那张一致
- `new-game` 有"开发中"与"招募中"两个徽标，`thtk-studio` 有"持续维护"
- 切到"游戏"页签只剩 `new-game`，切到"其他"页签显示空态文案

- [ ] **Step 8: 提交**

```bash
git add frontend/src/components/work frontend/src/views/WorkList.vue \
        frontend/src/router
git commit -m "feat: :sparkles: 作品列表页与状态徽标，路由表抽出为独立模块"
```

---

### Task 4: 作品详情页与四个类型专属区块

**Files:**
- Create: `frontend/src/components/work/ContentBlocks.vue`
- Create: `frontend/src/components/work/GameDetail.vue`
- Create: `frontend/src/components/work/ToolDetail.vue`
- Create: `frontend/src/components/work/SiteDetail.vue`
- Create: `frontend/src/components/work/PublicationDetail.vue`
- Create: `frontend/src/views/WorkDetail.vue`
- Modify: `frontend/src/router/routes.js`

**Interfaces:**
- Consumes: Task 2 的 `useWorkBySlug` / `useWorkNews` / `resolveDetailBlock` / `parsePlatforms` / `typeLabel`；既有 `AsyncBoundary`、`getStrapiMedia`。
- Produces: 路由 name `WorkDetail`（`/works/:slug`）；四个 detail 组件统一 props `{ block: Object }`。

- [ ] **Step 1: 写 `src/components/work/ToolDetail.vue`**

```vue
<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="platforms.length">
        <dt>平台</dt>
        <dd>{{ platforms.join(' / ') }}</dd>
      </template>
      <template v-if="block.currentVersion">
        <dt>当前版本</dt>
        <dd>{{ block.currentVersion }}</dd>
      </template>
      <template v-if="block.license">
        <dt>许可证</dt>
        <dd>{{ block.license }}</dd>
      </template>
    </dl>

    <div class="detail-links">
      <a v-if="block.repoUrl" :href="block.repoUrl" target="_blank" rel="noopener noreferrer">
        &gt;&gt; 仓库
      </a>
      <a v-if="block.homepage" :href="block.homepage" target="_blank" rel="noopener noreferrer">
        &gt;&gt; 项目主页
      </a>
    </div>

    <div v-if="downloads.length" class="detail-downloads">
      <h3 class="detail-subtitle">下载</h3>
      <!-- 多渠道：GitHub 连不上时国内直链是唯一出路，两个都要露出来 -->
      <a
        v-for="channel in downloads"
        :key="channel.id ?? channel.url"
        :href="channel.url"
        class="download-channel"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ channel.channelName }}
      </a>
    </div>

    <div v-if="block.changelog" class="detail-changelog">
      <h3 class="detail-subtitle">更新日志</h3>
      <div class="markdown-block" v-html="renderedChangelog"></div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import { parsePlatforms } from '@/utils/work'

const props = defineProps({
  block: { type: Object, required: true },
})

const platforms = computed(() => parsePlatforms(props.block?.platforms))
const downloads = computed(() => props.block?.downloads ?? [])
// 站内既有两处（EventDetail、ProductDetail）都用 marked(text) 这种调用形式，
// 不是 marked.parse()。保持一致。
const renderedChangelog = computed(() => marked(props.block?.changelog ?? ''))
</script>

<style scoped>
.detail-block {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}

.detail-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1.5rem;
  margin: 0;
}

.detail-facts dt {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.detail-facts dd {
  margin: 0;
  color: var(--color-text);
}

.detail-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.detail-links a {
  font-family: var(--font-family-mono);
  color: var(--color-accent);
  text-decoration: none;
}

.detail-links a:hover {
  color: var(--color-accent-hover);
}

.detail-subtitle {
  font-size: 1rem;
  color: var(--color-heading);
  margin: 0 0 0.75rem;
}

.detail-downloads {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.download-channel {
  display: inline-flex;
  padding: 0.45rem 1.1rem;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text);
  text-decoration: none;
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
}

.download-channel:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.markdown-block {
  color: var(--color-text);
  line-height: 1.8;
}

.markdown-block :deep(h1),
.markdown-block :deep(h2),
.markdown-block :deep(h3) {
  color: var(--color-heading);
}

.markdown-block :deep(a) {
  color: var(--color-accent);
}
</style>
```

- [ ] **Step 2: 写 `src/components/work/GameDetail.vue`**

```vue
<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="platforms.length">
        <dt>平台</dt>
        <dd>{{ platforms.join(' / ') }}</dd>
      </template>
      <template v-if="block.basedOn">
        <dt>基于</dt>
        <dd>{{ block.basedOn }}</dd>
      </template>
      <template v-if="block.engine">
        <dt>引擎</dt>
        <dd>{{ block.engine }}</dd>
      </template>
    </dl>

    <a
      v-if="block.trailerUrl"
      :href="block.trailerUrl"
      class="detail-trailer"
      target="_blank"
      rel="noopener noreferrer"
    >
      &gt;&gt; 观看 PV
    </a>

    <div v-if="screenshots.length" class="detail-screenshots">
      <h3 class="detail-subtitle">截图</h3>
      <div class="screenshot-grid">
        <img
          v-for="shot in screenshots"
          :key="shot.id"
          :src="urlOf(shot)"
          :alt="shot.alternativeText || '游戏截图'"
          loading="lazy"
        />
      </div>
    </div>

    <div v-if="downloads.length" class="detail-downloads">
      <h3 class="detail-subtitle">下载</h3>
      <a
        v-for="channel in downloads"
        :key="channel.id ?? channel.url"
        :href="channel.url"
        class="download-channel"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ channel.channelName }}
      </a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { getStrapiMedia } from '@/composables/strapi'
import { parsePlatforms } from '@/utils/work'

const props = defineProps({
  block: { type: Object, required: true },
})

const platforms = computed(() => parsePlatforms(props.block?.platforms))
const screenshots = computed(() => props.block?.screenshots ?? [])
const downloads = computed(() => props.block?.downloads ?? [])
const urlOf = (shot) => getStrapiMedia(shot)
</script>

<style scoped>
.detail-block {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}

.detail-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1.5rem;
  margin: 0;
}

.detail-facts dt {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.detail-facts dd {
  margin: 0;
  color: var(--color-text);
}

.detail-trailer {
  align-self: flex-start;
  font-family: var(--font-family-mono);
  color: var(--color-accent);
  text-decoration: none;
}

.detail-subtitle {
  font-size: 1rem;
  color: var(--color-heading);
  margin: 0 0 0.75rem;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.screenshot-grid img {
  width: 100%;
  display: block;
  border: 1px solid var(--color-border-soft);
}

@screen md {
  .screenshot-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.detail-downloads {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.download-channel {
  display: inline-flex;
  padding: 0.45rem 1.1rem;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text);
  text-decoration: none;
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
}

.download-channel:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
```

- [ ] **Step 3: 写 `src/components/work/SiteDetail.vue`**

```vue
<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="block.eventDate">
        <dt>活动日期</dt>
        <dd>{{ block.eventDate }}</dd>
      </template>
      <template v-if="block.participantCount">
        <dt>参与人数</dt>
        <dd>{{ block.participantCount }}</dd>
      </template>
    </dl>

    <a
      v-if="block.url"
      :href="block.url"
      class="detail-primary-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      &gt;&gt; 访问活动站
    </a>
  </section>
</template>

<script setup>
defineProps({
  block: { type: Object, required: true },
})
</script>

<style scoped>
.detail-block {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}

.detail-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1.5rem;
  margin: 0;
}

.detail-facts dt {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.detail-facts dd {
  margin: 0;
  color: var(--color-text);
}

.detail-primary-link {
  align-self: flex-start;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  text-decoration: none;
  font-family: var(--font-family-mono);
}

.detail-primary-link:hover {
  background: var(--color-accent);
  color: var(--color-on-accent);
}
</style>
```

- [ ] **Step 4: 写 `src/components/work/PublicationDetail.vue`**

```vue
<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="block.releaseDate">
        <dt>发行日期</dt>
        <dd>{{ block.releaseDate }}</dd>
      </template>
      <template v-if="block.spec">
        <dt>规格</dt>
        <dd>{{ block.spec }}</dd>
      </template>
      <template v-if="block.contributorCount">
        <dt>参与作者</dt>
        <dd>{{ block.contributorCount }} 位</dd>
      </template>
    </dl>
  </section>
</template>

<script setup>
defineProps({
  block: { type: Object, required: true },
})
</script>

<style scoped>
.detail-block {
  margin: 2rem 0;
}

.detail-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1.5rem;
  margin: 0;
}

.detail-facts dt {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.detail-facts dd {
  margin: 0;
  color: var(--color-text);
}
</style>
```

- [ ] **Step 5: 写 `src/views/WorkDetail.vue`**

```vue
<template>
  <div class="work-detail-view container">
    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="notFound"
      skeleton="text"
      empty-text=">> 找不到这个作品。"
      @retry="refresh"
    >
      <article v-if="work" class="work-detail">
        <header class="page-header">
          <div class="work-detail-meta">
            <span class="work-detail-type">{{ typeText }}</span>
            <StatusBadge :status="work.status" :recruiting="Boolean(work.recruiting)" />
          </div>
          <h1 class="section-title">{{ work.title }}</h1>
          <p class="work-detail-summary">{{ work.summary }}</p>
        </header>

        <img v-if="coverUrl" :src="coverUrl" :alt="work.title" class="work-detail-cover" />

        <!-- 招募位放在正文之前：招人是当前作品页最重要的转化动作 -->
        <section v-if="work.recruiting && roles.length" class="work-recruiting">
          <h2 class="detail-subtitle">正在招募</h2>
          <ul class="role-list">
            <li v-for="role in roles" :key="role.id ?? role.roleName">
              <strong>{{ role.roleName }}</strong>
              <span v-if="role.count"> × {{ role.count }}</span>
              <p v-if="role.description">{{ role.description }}</p>
            </li>
          </ul>
          <RouterLink to="/recruitment" class="detail-primary-link">&gt;&gt; 联系我们</RouterLink>
        </section>

        <!-- 类型专属区块：类型不匹配或动态区为空时 detailBlock 为 null，整块不渲染 -->
        <component :is="detailComponent" v-if="detailComponent && detailBlock" :block="detailBlock" />

        <ContentBlocks v-if="work.body?.length" :blocks="work.body" />

        <section v-if="staff.length" class="work-staff">
          <h2 class="detail-subtitle">制作名单</h2>
          <ul class="staff-list">
            <li v-for="member in staff" :key="member.id ?? member.name">
              <span class="staff-role">{{ member.role }}</span>
              <span class="staff-name">{{ member.name }}</span>
            </li>
          </ul>
        </section>

        <section v-if="news.length" class="work-news">
          <h2 class="detail-subtitle">开发日志与动态</h2>
          <ul class="news-list">
            <li v-for="item in news" :key="item.id">
              <RouterLink :to="`/events/${item.slug}`">
                <span class="news-date">{{ item.date }}</span>
                <span class="news-title">{{ item.title }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </article>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getStrapiMedia } from '@/composables/strapi'
import { useWorkBySlug, useWorkNews } from '@/composables/useWorks'
import { resolveDetailBlock, typeLabel } from '@/utils/work'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import StatusBadge from '@/components/work/StatusBadge.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import GameDetail from '@/components/work/GameDetail.vue'
import ToolDetail from '@/components/work/ToolDetail.vue'
import SiteDetail from '@/components/work/SiteDetail.vue'
import PublicationDetail from '@/components/work/PublicationDetail.vue'

const route = useRoute()
const slug = toRef(() => route.params.slug)

const { data: work, loading, error, notFound, refresh } = useWorkBySlug(slug)
const { data: newsData } = useWorkNews(slug)

const coverUrl = computed(() => getStrapiMedia(work.value?.coverImage))
const typeText = computed(() => typeLabel(work.value?.workType))
const roles = computed(() => work.value?.recruitingRoles ?? [])
const staff = computed(() => work.value?.staff ?? [])
const news = computed(() => newsData.value ?? [])

const detailBlock = computed(() =>
  resolveDetailBlock(work.value?.details, work.value?.workType),
)

const DETAIL_COMPONENTS = {
  game: GameDetail,
  tool: ToolDetail,
  site: SiteDetail,
  publication: PublicationDetail,
}

const detailComponent = computed(() => DETAIL_COMPONENTS[work.value?.workType] ?? null)
</script>

<style scoped>
.work-detail-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.work-detail-type {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.work-detail-summary {
  color: var(--color-text-muted);
  font-size: 1.05rem;
  line-height: 1.8;
  max-width: 46rem;
}

.work-detail-cover {
  width: 100%;
  display: block;
  border: 1px solid var(--color-border-soft);
  margin-bottom: 2rem;
}

.detail-subtitle {
  font-size: 1.1rem;
  color: var(--color-heading);
  margin: 0 0 0.75rem;
}

.work-recruiting,
.work-staff,
.work-news {
  margin: 2.5rem 0;
}

.role-list,
.staff-list,
.news-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}

.role-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.role-list p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.staff-list li {
  display: flex;
  gap: 1rem;
  padding: 0.35rem 0;
}

.staff-role {
  min-width: 8rem;
  color: var(--color-text-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
}

.news-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.news-list a {
  display: flex;
  gap: 1rem;
  color: var(--color-text);
  text-decoration: none;
}

.news-list a:hover {
  color: var(--color-accent);
}

.news-date {
  min-width: 7rem;
  color: var(--color-text-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
}

.detail-primary-link {
  display: inline-flex;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  text-decoration: none;
  font-family: var(--font-family-mono);
}

.detail-primary-link:hover {
  background: var(--color-accent);
  color: var(--color-on-accent);
}
</style>
```

上面 import 的 `ContentBlocks` 需要新建，路径是 `src/components/work/ContentBlocks.vue`（注意在 `work/` 子目录下，不是 `components/` 根目录）。

**为什么新建而不是复用 `EventDetail.vue` 的实现：** `EventDetail.vue` 内部自己渲染 `mainContent` 动态区，那段模板配套的 `.markdown-block` / `.link-embed-block` / `.iframe-embed-block` 等样式写在它的 `<style scoped>` 里。把那段模板抽进子组件，scoped 选择器立刻失配，`EventDetail` 会掉样式——这是一次有回归风险的重构，`EventDetail` 又没有测试覆盖。本任务**不动 `EventDetail`**，新建一个自带样式的组件给 `WorkDetail` 用。

这确实留下了两处相似的动态区渲染逻辑。**这是有意的**：合并需要先把 `EventDetail` 的 scoped 样式一起搬走并逐一核对观感，属于独立的一件事。已记入文末「后续工单」。

- [ ] **Step 5b: 写 `src/components/work/ContentBlocks.vue`**

只渲染 Task 1 里 `work.body` 允许的四种块。写法与取值路径照抄 `EventDetail.vue`（`contentMd` / `linkName` + `linkContent` / `iframeContent` / `File` + `FileName`），确保后台填法一致。

```vue
<template>
  <div class="content-blocks">
    <div v-for="(block, index) in blocks" :key="index">
      <div
        v-if="block.__component === 'content-block.content-block'"
        class="markdown-block"
        v-html="renderMarkdown(block.contentMd)"
      ></div>

      <div v-else-if="block.__component === 'embedding.link-embed'" class="link-embed-block">
        <a :href="block.linkContent" target="_blank" rel="noopener noreferrer" class="external-link">
          {{ block.linkName || block.linkContent }}
        </a>
      </div>

      <div v-else-if="block.__component === 'embedding.iframe-embed'" class="iframe-embed-block">
        <iframe
          :src="block.iframeContent"
          frameborder="0"
          class="embedded-iframe"
          allowfullscreen
        ></iframe>
      </div>

      <div
        v-else-if="block.__component === 'embedding.file-embed' && block.File?.length"
        class="file-embed-block"
      >
        <a
          :href="fileUrl(block.File[0])"
          :download="block.FileName || block.File[0].name || '下载文件'"
          class="external-link"
        >
          {{ block.FileName || block.File[0].name || '下载文件' }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { marked } from 'marked'
import { getStrapiMedia } from '@/composables/strapi'

defineProps({
  blocks: { type: Array, default: () => [] },
})

// 与 EventDetail.vue 一致：marked(text)，不是 marked.parse(text)
const renderMarkdown = (markdownText) => marked(markdownText || '')
const fileUrl = (file) => getStrapiMedia(file)
</script>

<style scoped>
.content-blocks {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}

.markdown-block {
  color: var(--color-text);
  line-height: 1.8;
}

.markdown-block :deep(h1),
.markdown-block :deep(h2),
.markdown-block :deep(h3) {
  color: var(--color-heading);
}

.markdown-block :deep(a) {
  color: var(--color-accent);
}

.markdown-block :deep(img) {
  max-width: 100%;
  height: auto;
}

.external-link {
  display: inline-flex;
  padding: 0.45rem 1.1rem;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text);
  text-decoration: none;
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
}

.external-link:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.embedded-iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--color-border-soft);
}
</style>
```

在 `WorkDetail.vue` 里把 import 路径写成 `import ContentBlocks from '@/components/work/ContentBlocks.vue'`。

- [ ] **Step 6: 加 `/works/:slug` 路由**

在 `src/router/routes.js` 的 `/works` 之后追加：

```js
  {
    path: '/works/:slug',
    name: 'WorkDetail',
    component: () => import('../views/WorkDetail.vue'),
  },
```

- [ ] **Step 7: 跑测试与构建**

```bash
cd frontend && npm test && npm run build
```

Expected：全绿；构建产物新增 `WorkDetail` chunk。

- [ ] **Step 8: 肉眼确认两种极端**

开发服务器访问：

- `http://localhost:5173/works/thtk-studio` —— 有 `toolDetail`，仓库链接、平台、版本都在
- `http://localhost:5173/works/new-game` —— **预告态：无封面、无正文、无 details。页面必须只显示标题、摘要、状态徽标与招募位，不能出现空的分隔线、孤立标题或塌陷区块**
- `http://localhost:5173/works/does-not-exist` —— 空态文案 `>> 找不到这个作品。`

- [ ] **Step 9: 提交**

```bash
git add frontend/src/components/work frontend/src/views/WorkDetail.vue frontend/src/router/routes.js
git commit -m "feat: :sparkles: 作品详情页与四种类型专属区块"
```

---

### Task 5: 旧路径重定向与 customView 逃生舱

**Files:**
- Create: `frontend/src/router/redirects.js`
- Create: `frontend/src/router/__tests__/redirects.spec.js`
- Create: `docs/content-migration/zhu-yuanzhang.md`
- Modify: `frontend/src/router/routes.js`
- Modify: `frontend/src/views/projects/csd20.vue`
- Delete: `frontend/src/views/zyzView.vue`

**Interfaces:**
- Consumes: Task 3 的 `src/router/routes.js`。
- Produces: `src/router/redirects.js` 导出 `LEGACY_REDIRECTS: Record<string,string>` 与 `redirectRoutes(): Array<{path, redirect}>`；路由 `/works/csd20`、`/works/csd20/music` 由具名记录承载。

- [ ] **Step 1: 写 `src/router/__tests__/redirects.spec.js`（先失败）**

用桩组件构造 router，验证重定向**真的会跳**，而不只是断言数组结构长得对。本项目历史上吃过结构性守卫的亏（bug 上线时守卫是绿的），这里必须测行为。vue-router 在 Node 环境下可用，不需要 jsdom。

```js
import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { LEGACY_REDIRECTS, redirectRoutes } from '@/router/redirects'

// 桩组件：只为让路由能匹配，避免加载真实 .vue 及其 Naive UI 依赖
const Stub = { render: () => null }

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      ...redirectRoutes(),
      { path: '/works', name: 'works', component: Stub },
      { path: '/works/:slug', name: 'WorkDetail', component: Stub },
      { path: '/works/csd20/music', name: 'csd20music', component: Stub },
    ],
  })

describe('旧路径重定向', () => {
  it('三条 /project/* 旧路径都有映射', () => {
    expect(LEGACY_REDIRECTS).toEqual({
      '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
      '/project/csd20': '/works/csd20',
      '/project/csd20/music': '/works/csd20/music',
    })
  })

  it.each(Object.entries(LEGACY_REDIRECTS))('%s 会真的跳到 %s', async (from, to) => {
    const router = makeRouter()
    await router.push(from)
    expect(router.currentRoute.value.path).toBe(to)
  })

  it('重定向后不是 404——匹配到了真实路由记录', async () => {
    const router = makeRouter()
    await router.push('/project/csd20')
    expect(router.currentRoute.value.matched.length).toBeGreaterThan(0)
  })

  it('/works/csd20/music 走具名记录而不是被 /works/:slug 吞掉', async () => {
    const router = makeRouter()
    await router.push('/works/csd20/music')
    expect(router.currentRoute.value.name).toBe('csd20music')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx vitest run src/router/__tests__/redirects.spec.js
```

Expected：FAIL，报 `Failed to resolve import "@/router/redirects"`。

- [ ] **Step 3: 写 `src/router/redirects.js`**

```js
/**
 * 旧 /project/* 路径 → 新 /works/* 路径。
 *
 * 站外有引用（通贩页、QQ 群、GitHub README），这些路径不能直接删掉变 404。
 * 写成纯数据是为了能在 Node 环境下用桩组件构造 router 验证跳转行为，
 * 而不是只断言路由数组的结构。
 */
export const LEGACY_REDIRECTS = {
  '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
  '/project/csd20': '/works/csd20',
  '/project/csd20/music': '/works/csd20/music',
}

export const redirectRoutes = () =>
  Object.entries(LEGACY_REDIRECTS).map(([path, redirect]) => ({ path, redirect }))

export default redirectRoutes
```

- [ ] **Step 4: 改 `src/router/routes.js`**

三处改动：

1. 顶部加 `import { redirectRoutes } from './redirects'`
2. **删掉** `/project/zhu-yuanzhang`、`/project/csd20`、`/project/csd20/music` 三条组件路由
3. 在 `/works/:slug` **之前**加 `/works/csd20/music` 具名路由（先注册更具体的路径，否则 `/works/:slug` 会先匹配 `csd20`，`/music` 段落空），在数组末尾展开 `...redirectRoutes()`

改动后的 `/works` 相关片段：

```js
  {
    path: '/works',
    name: 'works',
    component: () => import('../views/WorkList.vue'),
  },
  // 必须排在 /works/:slug 之前：路径更具体的记录要先注册
  {
    path: '/works/csd20/music',
    name: 'csd20music',
    component: () => import('../views/projects/csd20music.vue'),
  },
  {
    path: '/works/csd20',
    name: 'csd20',
    component: () => import('../views/projects/csd20.vue'),
  },
  {
    path: '/works/:slug',
    name: 'WorkDetail',
    component: () => import('../views/WorkDetail.vue'),
  },
  ...redirectRoutes(),
]
```

**`/works/csd20` 是 `customView` 逃生舱的落地形态**：这条具名路由排在通配 `/works/:slug` 之前，于是 csd20 走它自己的特制页，其余作品走通用详情页。设计文档 §3.4 里 csd20 那条 work 记录的 `customView` 字段填 `csd20`，作用是让后台可读——前端的分发由路由顺序完成，不读该字段。

- [ ] **Step 5: 导出 `zyzView.vue` 正文后删除该组件**

先把正文抠出来存档，供人工录入 Strapi（内容迁移是社团方的活，见设计文档 §7）：

```bash
mkdir -p docs/content-migration
```

创建 `docs/content-migration/zhu-yuanzhang.md`，把 `frontend/src/views/zyzView.vue` 模板里 `// 游戏介绍`、`// 制作名单`、`// 关于作品` 三节的**文字内容**逐段抄成 Markdown，顶部加一段录入说明：

```markdown
# 东方朱元璋 · 内容迁移稿

来源：`frontend/src/views/zyzView.vue`（该组件已于本次改造中删除，内容保存在此供录入 Strapi）。

录入目标：`work` 集合，`slug` = `zhu-yuanzhang`，`workType` = `game`，`status` = `discontinued`。
两张配图在 `frontend/src/assets/images/zyz_title.webp` 与 `zyz_screenshot.webp`，需在后台重新上传。

---

（此处是从组件里逐段抄出的正文与制作名单）
```

抄完后删除组件：

```bash
git rm frontend/src/views/zyzView.vue
```

- [ ] **Step 6: 修掉 csd20 的标题硬匹配**

`frontend/src/views/projects/csd20.vue` 目前用 `useProductByTitle('梦违科学世纪20周年合同志')` 找制品——后台改一个字页面就空。该制品的 slug 是 `csd20`，直接按 slug 取更稳。

把 import 与调用两处改掉：

```js
// 改前
import { useProductByTitle } from '@/composables/useProducts'
// ...
} = useProductByTitle('梦违科学世纪20周年合同志')

// 改后
import { useProduct } from '@/composables/useProducts'
// ...
} = useProduct('csd20')
```

`useProduct(slug)` 的返回结构（`{ data, loading, error, notFound, refresh }`）与 `useProductByTitle` 一致，解构处不需要改。

`useProductByTitle` 失去唯一调用者后**保留不动**——它在 `src/composables/__tests__/resources.spec.js` 里有测试覆盖，删函数要连带改测试文件，与本任务无关。是否清理留给最终复审。

- [ ] **Step 7: 跑测试与构建**

```bash
cd frontend && npm test && npm run build
```

Expected：新增 4 条重定向测试通过；既有测试全绿；构建成功且**不再有 `zyzView` chunk**。

- [ ] **Step 8: 肉眼确认重定向**

开发服务器下逐条访问，确认地址栏跳转且页面正常：

- `http://localhost:5173/project/csd20` → 跳到 `/works/csd20`，csd20 特制页原样渲染
- `http://localhost:5173/project/csd20/music` → 跳到 `/works/csd20/music`
- `http://localhost:5173/project/zhu-yuanzhang` → 跳到 `/works/zhu-yuanzhang`（本地库没有这条记录，显示空态文案属正常）

- [ ] **Step 9: 提交**

```bash
git add frontend/src/router frontend/src/views/projects/csd20.vue docs/content-migration
git rm --cached frontend/src/views/zyzView.vue 2>/dev/null || true
git add -A frontend/src/views
git commit -m "feat: :truck: /project/* 重定向到 /works/*，csd20 改按 slug 取制品，删除 zyzView"
```

---

### Task 6: 切换 project 消费者并退役 useProjects

`project` 内容类型的两个前端消费者改吃 `work`，然后删掉资源封装。这一步之后 `project` 在前端零引用。

**Files:**
- Modify: `frontend/src/components/ProjectsBar.vue`
- Modify: `frontend/src/components/SiteHeader.vue`
- Modify: `frontend/src/composables/__tests__/resources.spec.js`
- Modify: `CLAUDE.md`
- Modify: `UPGRADE_TODO.md`
- Create: `docs/content-migration/work-records.md`
- Delete: `frontend/src/composables/useProjects.js`

**Interfaces:**
- Consumes: Task 2 的 `useWorkList`、`typeLabel`、`statusLabel`。

- [ ] **Step 1: 改 `ProjectsBar.vue` 的数据源**

只换数据来源与字段映射，**轮播形态、样式、`@screen md` 断点全部不动**（导航与展示形态的改版属于 Spec 2）。

`<script setup>` 里的三处改动：

```js
// 改前
import { useProjects } from '@/composables/useProjects'
const { data: rawProjects, loading, error, isEmpty, refresh } = useProjects({ limit: 6 })

const statusLabels = {
  preview: '预告',
  ongoing: '进行中',
  ended: '已结束',
  continuous: '持续更新',
}

const projects = computed(() =>
  rawProjects.value.map((item) => ({
    id: item.id,
    title: item.title || '未命名项目',
    date: item.date || '',
    content: item.content || '',
    link: item.link || '',
    nowStatus: item.nowStatus || '',
    nowStatusLabel: statusLabels[item.nowStatus] || item.nowStatus || '',
    coverUrl: getStrapiMedia(item.coverImage),
  })),
)
```

```js
// 改后
import { useWorkList } from '@/composables/useWorks'
import { statusLabel } from '@/utils/work'
const { data: rawProjects, loading, error, isEmpty, refresh } = useWorkList({ limit: 6 })

const projects = computed(() =>
  rawProjects.value.map((item) => ({
    id: item.id,
    title: item.title || '未命名作品',
    date: item.startDate || '',
    content: item.summary || '',
    // work 一律有 slug，站内路径可以直接拼——不再需要 toInternalProjectPath
    link: `/works/${item.slug}`,
    nowStatus: item.status || '',
    nowStatusLabel: statusLabel(item.status),
    coverUrl: getStrapiMedia(item.coverImage),
  })),
)
```

同时删掉文件末尾的 `isExternalLink` 与 `toInternalProjectPath` 两个函数，并把模板里的外链分支简化——`link` 现在恒为站内路径：

```vue
<!-- 改前：a / RouterLink 二选一 -->
<!-- 改后 -->
<RouterLink v-if="project.link" :to="project.link" class="slide-link"> 查看作品 </RouterLink>
```

模板里 `暂无线上项目。` 改为 `>> 暂无作品。`，`暂无项目介绍。` 改为 `暂无作品介绍。`，`暂无项目可展示。` 改为 `暂无作品可展示。`

- [ ] **Step 2: 改 `SiteHeader.vue` 的下拉数据源**

同样只换数据源与链接生成，**菜单结构、图标、抽屉、样式全部不动**。

```js
// 改前
import { useProjects } from '@/composables/useProjects'
// 改后
import { useWorkList } from '@/composables/useWorks'
```

把 `useProjects(...)` 的调用换成 `useWorkList(...)`（保留原有的参数与解构变量名），把菜单项里的 `toInternalProjectPath(project.link)` 换成 `` `/works/${project.slug}` ``，并删除文件里的 `toInternalProjectPath` 函数。

菜单文案 `企划 // Project` 改为 `作品 // Works`，空态 `暂无项目` 改为 `暂无作品`。

导航项的增删（`/works` 是否进一级导航、`/products` 是否降级）属于 Spec 2，本步不做。

- [ ] **Step 3: 删除 `useProjects.js` 及其测试**

```bash
cd frontend && git rm src/composables/useProjects.js
```

在 `src/composables/__tests__/resources.spec.js` 里：

- 删掉 `import { useProjects, normalizeProjects } from '@/composables/useProjects'` 这一行
- 删掉整个 `describe('useProjects', ...)` 与 `describe('normalizeProjects', ...)` 块（若二者写在同一个 describe 内，则删该块）

- [ ] **Step 4: 跑测试与构建**

```bash
cd frontend && npm test && npm run build
```

Expected：全绿。测试总数比 Task 5 结束时**少了 `useProjects` 的那几条**，这是预期内的。构建成功。

- [ ] **Step 5: 确认 project 在前端零引用**

```bash
cd frontend && grep -rn 'useProjects\|/api/projects\|toInternalProjectPath' src/ || echo '零引用 ✓'
```

Expected：输出 `零引用 ✓`。

- [ ] **Step 6: 写内容迁移清单**

创建 `docs/content-migration/work-records.md`。这是交给社团方在生产后台逐条录入的操作清单（设计文档 §7：内容数据不走 git）。

```markdown
# work 记录录入清单

Strapi 的内容数据不随 git 同步。schema 由代码带过去，**下面 10 条记录需要在生产 Admin 手工建立**
（或本地建好后 `npx strapi export` / `npx strapi import`）。

前置：`pm2 restart strapi-main` 让新 schema 生效，并在 Settings → Roles → Public
为 **work** 勾选 `find` 与 `findOne`。

## 从既有 project 迁移（5 条）

| slug | title | workType | status | 备注 |
|---|---|---|---|---|
| `booth-kernel` | 摊盒 Booth-Kernel | `tool` | `maintained` | `toolDetail.homepage` = https://boothkernel.secret-sealing.club/ |
| `sumireko-2026` | 2026宇佐见堇子角色日接力 | `site` | `ended` | `siteDetail.url` = https://sumireko2026.secret-sealing.club |
| `mamizou-2026` | 2026二岩猯藏角色日接力 | `site` | `ended` | `siteDetail.url` = https://mamizou2026.secret-sealing.club |
| `hourai-2025` | 2025蓬莱人形23周年纪念接力 | `site` | `ended` | `siteDetail.url` = https://hourai2025.secret-sealing.club/ |
| `csd20` | 梦违科学世纪20周年纪念合同志 | `publication` | `ended` | **`customView` 填 `csd20`**；页面走特制路由 |

## 从硬编码页迁移（1 条）

| slug | title | workType | status | 备注 |
|---|---|---|---|---|
| `zhu-yuanzhang` | 东方朱元璋 | `game` | `discontinued` | 正文见 `docs/content-migration/zhu-yuanzhang.md`；配图需重新上传 |

## 新建（4 条）

| slug | title | workType | status | 备注 |
|---|---|---|---|---|
| `thtk-studio` | THTK-Studio | `tool` | `maintained` | `toolDetail.repoUrl` = https://github.com/Renko6626/THTK-Studio |
| `booth-manual` | 社团出摊教程 | `tool` | `released` | |
| （待定） | 东方设定 agent | `tool` | `in-development` | 名称与正文由社团方确定 |
| （待定） | 新游戏项目 | `game` | `in-development` | **`recruiting` 开启**，填 `recruitingRoles`；无封面、无 details 属正常 |

## event 的枚举迁移（10 条既有动态）

`category` 枚举已改为 `devlog` / `announcement` / `release`。既有数据需逐条改：

| 原值 | 条数 | 改为 |
|---|---|---|
| `new-project` | 3 | `release` |
| `monthly-release` | 3 | `release` |
| `announcement` | 4 | `announcement`（不变） |

顺带给 4 条软件相关动态补 `relatedWork` 关联：

- 「THTK-Studio 东方脚本的集成开发工具」→ `thtk-studio`
- 「摊盒 Booth-Kernel——现代的同人出摊系统」→ `booth-kernel`
- 「【发布】THO展会出摊助手-局域网版」→ `booth-kernel`
- 「社团出摊教程开源」→ `booth-manual`
```

- [ ] **Step 7: 更新两处文档**

`CLAUDE.md` 的 Backend 结构一节，把

> Current collection types: **convention, event, product, project**.

改为

> Current collection types: **convention, event, product, project, work**。`work` 是转型后的作品实体（游戏/工具/活动站/出版物），`project` 已停止使用但保留集合以免生产库迁移风险。

同一节末尾追加一句：

> 作品体系的设计见 `docs/superpowers/specs/2026-07-31-work-content-model-design.md`；内容录入清单见 `docs/content-migration/work-records.md`。

`UPGRADE_TODO.md` 的「阶段三：页面视图迁移」末尾追加一节：

```markdown
### 3.5 作品体系（2026-07-31 社团转型）

- [x] 新增 `work` 内容类型统一承载游戏/工具/活动站/出版物，`project` 停止使用
- [x] `/works` 列表与 `/works/:slug` 详情，四种类型各有专属区块
- [x] `event` 新增 `relatedWork` 关联，开发日志可挂到具体作品
- [x] `/project/*` 旧路径全部重定向
- [ ] 导航改版、首页重排、`/about`、归档化、`/join` —— 见 Spec 2
- [ ] 中英双语 —— 见 Spec 3
```

- [ ] **Step 8: 提交**

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git add -A frontend/src CLAUDE.md UPGRADE_TODO.md docs/content-migration
git commit -m "refactor: :recycle: ProjectsBar 与 SiteHeader 改吃 work，useProjects 退役"
```

---

## 完成后

全部 6 个 Task 结束后，`work` 体系已可用但**生产库里还没有任何 work 记录**——`/works` 在生产上会是空态，直到按 `docs/content-migration/work-records.md` 录入完成。这不是缺陷，是设计文档 §7 已声明的运维成本。

部署顺序有依赖，不能颠倒：

1. `git push`
2. `ssh root@server 'cd /home/deploy/abl_website/strapi-backend && git pull && pm2 restart strapi-main'` —— **先让新 schema 生效**
3. 在生产 Admin 为 `work` 开放 Public 的 `find` / `findOne`
4. `ssh deploy@server 'bash /home/deploy/abl_website/update.sh'` —— 再上前端

若先上前端，`/works` 会对着一个尚不存在的端点报 403/404，站点看起来是坏的。

## 后续工单（本计划明确不做）

- **动态区渲染有两份实现**：`WorkDetail` 用 `components/work/ContentBlocks.vue`，`EventDetail` 用自己内联的模板。合并需要把 `EventDetail` 的 `<style scoped>` 一起搬走并逐一核对观感，且 `EventDetail` 无测试覆盖，风险不匹配本轮收益。
- **`embedding.pdf-embed` 在 `EventDetail.vue` 里从未被渲染**——它在 `event.mainContent` 的允许组件列表里，但那条 `v-if` 链没有它。属于既有缺陷，与本轮无关，但值得单独修。
- **`useProductByTitle` 失去唯一调用者**（Task 5 把 csd20 改成按 slug 取）。函数与其测试仍在，清理与否由复审判断。
- **`project` 内容类型在 Strapi 里保留但已零引用**。删除集合需要生产库迁移，风险不匹配收益，维持保留。
- Spec 2（站点重构）与 Spec 3（中英双语）的全部范围，见设计文档 §6。
