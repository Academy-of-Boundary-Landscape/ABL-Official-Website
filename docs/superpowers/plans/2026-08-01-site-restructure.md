# 站点重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把整个站点的信息架构切换到以作品为主轴——导航收敛为四项、首页围绕在制游戏与作品重排、新建 `/about` 与 `/join`、旧的周边贩售业务体面归档。

**Architecture:** Strapi 新增 `page` 内容类型承载 `/about` 与 `/join` 的策展文案（维护者将赴海外，改文案不该需要发版）。前端复用 Spec 1 建好的 `WorkCard` / `StatusBadge` / `ContentBlocks` / `AsyncBoundary` / `useStrapiResource`，新增一个纯函数 `mergeTimeline` 把展会与作品混排成社团时间线。旧路径全部改为 `redirect` 路由，沿用 Spec 1 的纯数据 + 桩组件行为测试方案。

**Tech Stack:** Vue 3 + Vite 7 + vue-router 4 + Naive UI 2.43 + UnoCSS + Vitest 3（Node 环境，无 jsdom）；Strapi 5.23.3 + axios。

配套文档：[站点重构 · 设计](../specs/2026-08-01-site-restructure-design.md) · [Spec 1 设计](../specs/2026-07-31-work-content-model-design.md)

## Global Constraints

- **不引入 jsdom 或组件测试框架。** vitest 跑在 Node 环境。需要验证的逻辑一律先抽为纯函数再单测。
- **`npx eslint .` 退出码必须保持 0。** 这是 Spec 1 赢下来的 CI 门禁。
- **不修改 `product` / `convention` 的 schema**，一条数据不删。
- **不做作品或页面专属组件路由**，沿用统一形式政策。
- **旧链接不得 404**，8 条重定向逐条行为测试。
- **不新增颜色 token**（`src/config/__tests__/tokens.spec.js` 守着）。
- 断点移动优先（`@screen sm/md/lg`），不得写 `max-width` 媒体查询。
- 复用 `useStrapiResource`、`AsyncBoundary`、`colorTokens`、`WorkCard`、`StatusBadge`、`ContentBlocks`。
- **新增任何 Strapi 字段前，先确认它不是 Strapi 的保留词。** 2026-08-01 的教训：`work.status` 与 Strapi 5 文档状态（draft/published）撞车，导致 admin 面板完全无法发布，而 API 层一切正常、95 条测试全绿——只有真人点按钮才会暴露。已知危险词至少有 `status`、`type`、`locale`。本轮新增的 `page` 只有 `title` / `slug` / `body` 三个字段，均已确认安全。

---

## File Structure

**Strapi（`strapi-backend/`）**

| 文件 | 职责 |
|---|---|
| `src/api/page/content-types/page/schema.json` | `page` 集合类型：`title` / `slug` / `body` |
| `src/api/page/controllers/page.ts` `routes/page.ts` `services/page.ts` | 核心工厂脚手架，与 `work` 同构 |

**前端（`frontend/`）**

| 文件 | 职责 |
|---|---|
| `src/composables/usePages.js` | `usePageBySlug(slug)`，深挖 `body` 动态区 |
| `src/utils/timeline.js` | **纯函数** `mergeTimeline(conventions, works)` |
| `src/utils/__tests__/timeline.spec.js` | 上者的测试 |
| `src/composables/__tests__/pages.spec.js` | `usePageBySlug` 的测试 |
| `src/components/work/WorkHero.vue` | 首页大图位，**必须支持无封面模式** |
| `src/views/AboutView.vue` | `/about` |
| `src/views/JoinView.vue` | `/join` |
| `src/views/ArchiveProductList.vue` | `/archive/products`（由 `ProductList.vue` 改造而来） |
| `src/views/HomeView.vue` | **重写**：三区块 |
| `src/views/ProductDetail.vue` | 改造：去购买引导与推荐位 |
| `src/router/routes.js` `redirects.js` | 新路由与 5 条新重定向 |
| `src/components/SiteHeader.vue` | 一级导航收敛为四项，去掉作品下拉 |
| `src/components/SiteFooter.vue` | 加归档入口 |
| `src/components/ProjectsBar.vue` | **删除**（238 行轮播被 `WorkCard` 网格取代） |
| `src/components/CategoryFilter.vue` | **删除** |
| `src/views/RecruitmentView.vue` | **删除**（正文迁入 `page:join`） |
| `src/composables/useProducts.js` | 删 `category` / `search` / `sort` 参数与两个死函数 |

**文档**

| 文件 | 职责 |
|---|---|
| `docs/content-migration/pages.md` | 从 `HomeView` 与 `RecruitmentView` 提取的正文，供录入 `page:about` / `page:join` |

---

### Task 1: Strapi `page` 内容类型与正文存档

`/about` 与 `/join` 的正文**已经存在**——分别散在 `HomeView.vue` 的介绍区和 `RecruitmentView.vue` 里。本任务建好承载它们的内容类型，并把正文逐字提取成录入稿。后续任务才会删掉这两个组件里的对应部分。

**Files:**
- Create: `strapi-backend/src/api/page/content-types/page/schema.json`
- Create: `strapi-backend/src/api/page/controllers/page.ts`
- Create: `strapi-backend/src/api/page/routes/page.ts`
- Create: `strapi-backend/src/api/page/services/page.ts`
- Create: `docs/content-migration/pages.md`
- Modify（自动重新生成，需提交）: `strapi-backend/types/generated/contentTypes.d.ts`

**Interfaces:**
- Produces: REST 端点 `GET /api/pages`、`GET /api/pages?filters[slug][$eq]=<slug>`；字段 `title` `slug` `body`；`body` 动态区组件与 `work.body` 完全相同。

- [ ] **Step 1: 建 schema**

`strapi-backend/src/api/page/content-types/page/schema.json`：

```json
{
  "kind": "collectionType",
  "collectionName": "pages",
  "info": {
    "singularName": "page",
    "pluralName": "pages",
    "displayName": "page"
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
    "body": {
      "type": "dynamiczone",
      "components": [
        "content-block.content-block",
        "embedding.link-embed",
        "embedding.iframe-embed",
        "embedding.file-embed",
        "embedding.audio-embed"
      ]
    }
  }
}
```

**只有三个字段，且都不是 Strapi 保留词。** 不要"顺手"加 `status`（页面发布状态由 `draftAndPublish` 管）或 `type`——这两个词会撞 Strapi 内部概念，`work.status` 就是这么让 admin 面板完全无法发布的。

- [ ] **Step 2: 建三个脚手架文件**

与 `src/api/work/` 下同名文件逐字同构，只把 `work` 换成 `page`。

`strapi-backend/src/api/page/controllers/page.ts`：

```ts
/**
 * page controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::page.page');
```

`strapi-backend/src/api/page/routes/page.ts`：

```ts
/**
 * page router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::page.page');
```

`strapi-backend/src/api/page/services/page.ts`：

```ts
/**
 * page service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::page.page');
```

- [ ] **Step 3: 启动 Strapi 验证内容类型被接受**

```bash
cd strapi-backend
[ -f .env ] || cp .env.dev .env
npm run develop
```

Expected：启动日志无 schema 错误。保持进程运行，另开终端：

```bash
curl -s -o /dev/null -w '%{http_code}\n' --noproxy '*' http://localhost:1337/api/pages
```

Expected：**403**（路由已注册，Public 未授权）。**404 说明内容类型没被接受**，回 Step 1 检查。

开放 Public 权限与建记录属于内容操作，**本任务不做**——控制方会在统一验证阶段处理。在报告里如实写明。

- [ ] **Step 4: 提取 `/about` 的正文**

创建 `docs/content-migration/pages.md`。第一部分从 `frontend/src/views/HomeView.vue` 的「基本介绍 / INTRODUCTION」区块**逐字**抄出三段内容：`article-body` 的两段介绍、`联系我们 / CONTACT` 的 QQ 群与邮箱、`社团设定 / SETTINGS` 的三段设定文字（含 `.highlight` 那段的加粗强调）。

文档骨架：

```markdown
# page 记录录入稿

两条 `page` 记录，正文取自即将被删除的组件，逐字提取，未改写。

录入目标：Strapi `page` 集合。前置：`update-strapi.sh` 让 schema 生效，
并在 Settings → Roles → Public 为 **page** 勾选 `find` 与 `findOne`。

---

## 记录一：`about`

- `title`：关于我们
- `slug`：`about`

来源：`frontend/src/views/HomeView.vue` 的「基本介绍 / INTRODUCTION」区块（该区块随首页重写删除）。

### body 建议结构

1. `contentBlock`：社团介绍 + 联系方式 + 社团设定（下面三节合成一个 Markdown 块即可）

### 正文

（此处逐字抄写 HomeView 的介绍段、联系方式、社团设定三节）
```

- [ ] **Step 5: 提取 `/join` 的正文**

在同一份文档里追加第二部分，从 `frontend/src/views/RecruitmentView.vue` 提取：

- 页头标题与副标题
- `我们是怎样的社团？` 的四段介绍（`intro-text`）
- `jobOpenings` 数组里**每一个岗位**的 `title` / `tag` / `description` / `requirements` 全部条目 / `notes` 全部条目
- `申请渠道` 一节的全部文字，含邮箱、"邮件里建议包含"的三条、以及末尾那句回复时限说明

**逐字抄，不摘要、不合并、不改写。** 那几段岗位描述写得很具体（技术栈、期望、"不要求科班出身"的态度），是社团的声音，丢一句就是丢一句。

按设计文档 §2，**申请渠道要加上 QQ 群**——在录入稿里留出位置并标注「QQ 群号待社团方填写」，邮箱保持现有的 `contact@abl.secret-sealing.club`。

- [ ] **Step 6: 提交**

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git add strapi-backend/src/api/page strapi-backend/types/generated docs/content-migration/pages.md
git commit -m "feat: :sparkles: 新增 page 内容类型，提取 about/join 正文录入稿"
```

`types/generated/` 由 Strapi 启动自动重新生成，必须一并提交。

---

### Task 2: 资源层与时间线纯函数

**Files:**
- Create: `frontend/src/composables/usePages.js`
- Create: `frontend/src/composables/__tests__/pages.spec.js`
- Create: `frontend/src/utils/timeline.js`
- Create: `frontend/src/utils/__tests__/timeline.spec.js`

**Interfaces:**
- Consumes: 既有 `useStrapiOne(resource, params)`（`src/composables/useStrapiResource.js`）。
- Produces:
  - `usePageBySlug(slug) → { data, loading, error, notFound, refresh }`
  - `mergeTimeline(conventions, works) → Array<{ key, date, kind, title, label, to }>`

- [ ] **Step 1: 写 `src/utils/__tests__/timeline.spec.js`（先失败）**

```js
import { describe, it, expect } from 'vitest'
import { mergeTimeline } from '@/utils/timeline'

const conv = (name, date) => ({ id: `c${name}`, name, date })
const work = (title, startDate, workType = 'tool', slug = title) => ({
  id: `w${title}`,
  title,
  startDate,
  workType,
  slug,
})

describe('mergeTimeline', () => {
  it('两个来源按日期倒序混排', () => {
    const out = mergeTimeline(
      [conv('北京tho', '2025-11-08'), conv('武汉tho', '2025-10-04')],
      [work('摊盒', '2026-01-24'), work('csd20', '2025-09-13', 'publication')],
    )
    expect(out.map((x) => x.title)).toEqual(['摊盒', '北京tho', '武汉tho', 'csd20'])
  })

  it('展会标「出展」，作品标其类型中文名', () => {
    const out = mergeTimeline([conv('北京tho', '2025-11-08')], [work('摊盒', '2026-01-24')])
    expect(out[0]).toMatchObject({ kind: 'work', label: '工具', to: '/works/摊盒' })
    expect(out[1]).toMatchObject({ kind: 'convention', label: '出展', to: null })
  })

  it('缺日期的条目排在最后，不抛错', () => {
    const out = mergeTimeline([conv('无日期展会', null)], [work('有日期', '2025-01-01')])
    expect(out.map((x) => x.title)).toEqual(['有日期', '无日期展会'])
  })

  it('同日期时展会排在作品之前——那天先出展，才有后来的产出', () => {
    const out = mergeTimeline([conv('同日展会', '2025-05-05')], [work('同日作品', '2025-05-05')])
    expect(out.map((x) => x.kind)).toEqual(['convention', 'work'])
  })

  it('任一来源为空、两个都为空、传 null 都返回数组而不抛错', () => {
    expect(mergeTimeline([], [work('只有作品', '2025-01-01')])).toHaveLength(1)
    expect(mergeTimeline([conv('只有展会', '2025-01-01')], [])).toHaveLength(1)
    expect(mergeTimeline([], [])).toEqual([])
    expect(mergeTimeline(null, undefined)).toEqual([])
  })

  it('每个条目有稳定且唯一的 key，供 v-for 使用', () => {
    const out = mergeTimeline(
      [conv('展会', '2025-01-01')],
      [work('作品', '2025-01-01')],
    )
    const keys = out.map((x) => x.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true)
  })

  it('脏数据（null 条目、缺 title）被跳过而不是渲染成空行', () => {
    const out = mergeTimeline([null, conv('正常', '2025-01-01')], [{ id: 'x', startDate: '2025-02-02' }])
    expect(out.map((x) => x.title)).toEqual(['正常'])
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx vitest run src/utils/__tests__/timeline.spec.js
```

Expected：FAIL，报 `Failed to resolve import "@/utils/timeline"`。

- [ ] **Step 3: 写 `src/utils/timeline.js`**

```js
import { typeLabel } from './work'

/**
 * 把展会与作品混排成一条社团时间线，按日期倒序。
 *
 * 为什么合并两个来源：社团已经不出摊了，about 页上单挂一串展会记录读者
 * 不知道该作何感想。两条线混在一起，转型叙事会自己浮现——越往下越是展会，
 * 越往上越是作品。
 *
 * 缺日期的条目排在最后而不是抛错：Strapi 里 date 字段可空，
 * 生产数据里真的有 qqgroup 为 "None" 这类脏值，日期同理不能假设一定有。
 */
export const mergeTimeline = (conventions, works) => {
  const items = []

  for (const c of Array.isArray(conventions) ? conventions : []) {
    if (!c?.name) continue
    items.push({
      key: `convention-${c.id}`,
      date: c.date ?? null,
      kind: 'convention',
      title: c.name,
      label: '出展',
      to: null,
    })
  }

  for (const w of Array.isArray(works) ? works : []) {
    if (!w?.title) continue
    items.push({
      key: `work-${w.id}`,
      date: w.startDate ?? null,
      kind: 'work',
      title: w.title,
      label: typeLabel(w.workType),
      to: w.slug ? `/works/${w.slug}` : null,
    })
  }

  // 缺日期的排最后；同日期时展会在前——那天先出展，才有后来的产出
  return items.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.kind === b.kind ? 0 : a.kind === 'convention' ? -1 : 1
  })
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd frontend && npx vitest run src/utils/__tests__/timeline.spec.js
```

Expected：PASS，7 条全绿。

- [ ] **Step 5: 写 `src/composables/__tests__/pages.spec.js`（先失败）**

沿用 `src/composables/__tests__/works.spec.js` 的组织方式。

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { usePageBySlug } from '@/composables/usePages'

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

describe('usePageBySlug', () => {
  it('按 slug 过滤并深挖 body 动态区', async () => {
    const { stop } = withScope(() => usePageBySlug('about'))
    await flush()
    expect(pathOf()).toBe('/pages')
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'about' } })
    // 动态区内层的媒体（音频、文件）不深挖就取不到
    expect(paramsOf().populate).toEqual({ body: { populate: '*' } })
    stop()
  })

  it('slug 变化会重新请求', async () => {
    const slug = ref('about')
    const { stop } = withScope(() => usePageBySlug(slug))
    await flush()
    slug.value = 'join'
    await flush()
    expect(paramsOf(1).filters).toEqual({ slug: { $eq: 'join' } })
    stop()
  })

  it('记录不存在时 notFound 为真而不是抛错——页面要能降级', async () => {
    const { result, stop } = withScope(() => usePageBySlug('nope'))
    await flush()
    expect(result.notFound.value).toBe(true)
    expect(result.data.value).toBeNull()
    stop()
  })
})
```

- [ ] **Step 6: 跑测试确认失败**

```bash
cd frontend && npx vitest run src/composables/__tests__/pages.spec.js
```

Expected：FAIL，报 `Failed to resolve import "@/composables/usePages"`。

- [ ] **Step 7: 写 `src/composables/usePages.js`**

```js
import { toValue } from 'vue'
import { useStrapiOne } from './useStrapiResource'

/**
 * 按 slug 取一条 page 记录（`about` / `join` / `home`）。
 *
 * 页面必须容忍记录不存在：社团方是分批录入的，缺了某条时对应区块
 * 降级为空态或整块不渲染，而不是让整页崩掉。notFound 就是给这个用的。
 */
export function usePageBySlug(slug) {
  return useStrapiOne('pages', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: { body: { populate: '*' } },
  }))
}
```

- [ ] **Step 8: 跑全量测试**

```bash
cd frontend && npm test
```

Expected：既有 95 条 + 本任务新增 10 条全部通过。本任务只新增文件，既有测试若失败说明越界了。

- [ ] **Step 9: 提交**

```bash
git add frontend/src/utils/timeline.js frontend/src/utils/__tests__/timeline.spec.js \
        frontend/src/composables/usePages.js frontend/src/composables/__tests__/pages.spec.js
git commit -m "feat: :sparkles: page 资源层与时间线合并纯函数，含单元测试"
```

---

### Task 3: 路由与重定向

新增五条路由与五条重定向，全部用桩组件测行为。此任务只动路由层，页面组件在后续任务建立——**因此本任务结束时 `/about` 等路由会指向尚不存在的组件，故本任务的路由先全部指向占位组件，Task 5/6/7 再替换为真实组件。**

**Files:**
- Create: `frontend/src/views/PlaceholderView.vue`
- Modify: `frontend/src/router/redirects.js`
- Modify: `frontend/src/router/routes.js`
- Modify: `frontend/src/router/__tests__/redirects.spec.js`

**Interfaces:**
- Consumes: Spec 1 建好的 `LEGACY_REDIRECTS` / `redirectRoutes()`。
- Produces: 路由 name `news`（`/news`）、`NewsDetail`（`/news/:slug`）、`join`（`/join`）、`about`（`/about`）、`archiveProducts`（`/archive/products`）、`archiveProductDetail`（`/archive/products/:slug`）。

- [ ] **Step 1: 改 `src/router/__tests__/redirects.spec.js`（先失败）**

把 `LEGACY_REDIRECTS` 的期望值替换为八条，并给 `makeRouter` 的桩路由补上新路径：

```js
  it('八条旧路径都有映射', () => {
    expect(LEGACY_REDIRECTS).toEqual({
      '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
      '/project/csd20': '/works/csd20',
      '/project/csd20/music': '/works/csd20',
      '/events': '/news',
      '/events/:slug': '/news/:slug',
      '/recruitment': '/join',
      '/products': '/archive/products',
      '/products/:slug': '/archive/products/:slug',
    })
  })
```

`makeRouter` 的桩路由数组改为：

```js
    routes: [
      ...redirectRoutes(),
      { path: '/works', name: 'works', component: Stub },
      { path: '/works/:slug', name: 'WorkDetail', component: Stub },
      { path: '/news', name: 'news', component: Stub },
      { path: '/news/:slug', name: 'NewsDetail', component: Stub },
      { path: '/join', name: 'join', component: Stub },
      { path: '/about', name: 'about', component: Stub },
      { path: '/archive/products', name: 'archiveProducts', component: Stub },
      { path: '/archive/products/:slug', name: 'archiveProductDetail', component: Stub },
    ],
```

并新增一条**带参数重定向**的用例——这是本任务最容易做错的地方：

```js
  it('带 :slug 的重定向要把参数带过去，不能落到字面量 :slug 上', async () => {
    const router = makeRouter()
    await router.push('/events/thtk-studio-pub')
    expect(router.currentRoute.value.path).toBe('/news/thtk-studio-pub')
    expect(router.currentRoute.value.params.slug).toBe('thtk-studio-pub')

    await router.push('/products/csd20')
    expect(router.currentRoute.value.path).toBe('/archive/products/csd20')
    expect(router.currentRoute.value.params.slug).toBe('csd20')
  })
```

原有的 `it.each` 遍历 `LEGACY_REDIRECTS` 的用例会把 `/events/:slug` 当字面路径 push，需要改成**跳过含 `:` 的条目**（它们由上面那条专门的用例覆盖）：

```js
  const literal = Object.entries(LEGACY_REDIRECTS).filter(([from]) => !from.includes(':'))
  it.each(literal)('%s 会真的跳到 %s', async (from, to) => {
    const router = makeRouter()
    await router.push(from)
    expect(router.currentRoute.value.path).toBe(to)
  })
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd frontend && npx vitest run src/router/__tests__/redirects.spec.js
```

Expected：FAIL，`LEGACY_REDIRECTS` 只有三条、不等于期望的八条。

- [ ] **Step 3: 改 `src/router/redirects.js`**

```js
/**
 * 旧路径 → 新路径。
 *
 * 站外有引用（通贩页、QQ 群、GitHub README、以及 docs/content-migration/
 * 里指导作者写的 /products/csd20 链接），这些路径不能直接删掉变 404。
 *
 * 写成纯数据是为了能在 Node 环境下用桩组件构造 router 验证跳转行为，
 * 而不是只断言路由数组的结构——本项目吃过结构性守卫的亏。
 */
export const LEGACY_REDIRECTS = {
  '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
  '/project/csd20': '/works/csd20',
  // 主题曲页已并入作品页（音乐是 body 里的一个 audio-embed 块）
  '/project/csd20/music': '/works/csd20',
  '/events': '/news',
  '/events/:slug': '/news/:slug',
  '/recruitment': '/join',
  '/products': '/archive/products',
  '/products/:slug': '/archive/products/:slug',
}

export const redirectRoutes = () =>
  Object.entries(LEGACY_REDIRECTS).map(([path, redirect]) => ({ path, redirect }))

export default redirectRoutes
```

**vue-router 对同名动态段的重定向会自动带参数**——`/events/:slug` → `/news/:slug` 里的 `:slug` 会被填成实际值，不需要写重定向函数。Step 1 的那条用例就是验证这一点；如果它红了，改成函数形式：

```js
{ path: '/events/:slug', redirect: (to) => `/news/${to.params.slug}` }
```

- [ ] **Step 4: 建占位组件**

`frontend/src/views/PlaceholderView.vue`——本任务临时用，Task 5/6/7 会逐个替换掉，最后删除。

```vue
<template>
  <div class="container">
    <p class="placeholder-note">&gt;&gt; 此页面正在建设中。</p>
  </div>
</template>

<style scoped>
.placeholder-note {
  margin: 6rem 0;
  text-align: center;
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
}
</style>
```

- [ ] **Step 5: 改 `src/router/routes.js`**

删掉 `/recruitment`、`/products`、`/products/:slug`、`/events`、`/events/:slug` 五条组件路由（它们的路径已进重定向表），新增六条。`/` 与 `/works*` 保持不动。改动后的完整数组：

```js
import { redirectRoutes } from './redirects'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/works',
    name: 'works',
    component: () => import('../views/WorkList.vue'),
  },
  {
    path: '/works/:slug',
    name: 'WorkDetail',
    component: () => import('../views/WorkDetail.vue'),
  },
  {
    path: '/news',
    name: 'news',
    component: () => import('../views/EventList.vue'),
  },
  {
    path: '/news/:slug',
    name: 'NewsDetail',
    component: () => import('../views/EventDetail.vue'),
  },
  {
    path: '/join',
    name: 'join',
    component: () => import('../views/PlaceholderView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/PlaceholderView.vue'),
  },
  {
    path: '/archive/products',
    name: 'archiveProducts',
    component: () => import('../views/PlaceholderView.vue'),
  },
  {
    path: '/archive/products/:slug',
    name: 'archiveProductDetail',
    component: () => import('../views/ProductDetail.vue'),
  },
  ...redirectRoutes(),
]

export default routes
```

**`/news` 与 `/news/:slug` 直接指向既有的 `EventList.vue` / `EventDetail.vue`，组件不改名。** 与 spec §3.1 一致：Strapi 集合仍叫 `event`、API 仍是 `/api/events`，前端组件跟着后端命名走，只有用户可见的路由改成 `/news`。

- [ ] **Step 6: 把站内指向旧路径的链接改成新路径**

重定向是给**站外**引用兜底的。站内自己还指着旧路径的话，每次点击都白白多跳一次，而且这些链接迟早会被当成"还在用旧路由"的证据。六处，全部实测确认存在：

| 文件:行 | 改前 | 改后 |
|---|---|---|
| `src/components/ProductCard.vue:62` | `router.push(\`/products/${props.product.slug}\`)` | `router.push(\`/archive/products/${props.product.slug}\`)` |
| `src/components/EventCard.vue:92` | `router.push(\`/events/${props.event.slug}\`)` | `router.push(\`/news/${props.event.slug}\`)` |
| `src/views/EventDetail.vue:13` | `to="/events"` | `to="/news"` |
| `src/views/ProductDetail.vue:15` | `to="/products"` | `to="/archive/products"` |
| `src/views/WorkDetail.vue:36` | `to="/recruitment"` | `to="/join"` |
| `src/views/WorkDetail.vue:58` | `` :to="`/events/${item.slug}`" `` | `` :to="`/news/${item.slug}`" `` |

`SiteHeader.vue` 里的三处由 Task 4 处理，`HomeView.vue` 的浮动按钮由 Task 5 随整块删除，本步不动它们。

**`src/composables/useEventAPI.js` 里的 `/events` 不要改**——那些是 Strapi 的 **API 路径**不是前端路由，而且该文件已废弃（CLAUDE.md 明确标注，且实测零引用）。它的清理列在 Task 7。

验证：

```bash
cd frontend && grep -rn "'/events\|\`/events\|'/products\|\`/products\|'/recruitment" src \
  --include=*.vue | grep -v 'SiteHeader\|HomeView' || echo "  站内旧链接已清理 ✓"
```

Expected：`站内旧链接已清理 ✓`（`SiteHeader` 与 `HomeView` 留给后面的 Task）。

- [ ] **Step 7: 跑测试与构建**

```bash
cd frontend && npm test && npm run build && npx eslint . ; echo "eslint exit=$?"
```

Expected：重定向测试全绿（含新增的带参数用例）；构建成功；eslint 退出码 0。

- [ ] **Step 8: 提交**

```bash
git add frontend/src
git commit -m "feat: :truck: 新增 /news /join /about /archive 路由与五条重定向，站内链接同步"
```

---

### Task 4: 导航与页脚

**Files:**
- Modify: `frontend/src/components/SiteHeader.vue`
- Modify: `frontend/src/components/SiteFooter.vue`

**Interfaces:**
- Consumes: Task 3 建立的路由。

- [ ] **Step 1: 一级导航收敛为四项**

在 `SiteHeader.vue` 的菜单项数组里：

1. **删掉** `key: 'products'` 那一项（制品退出一级导航，归档入口进页脚）
2. `key: 'events'` 的链接从 `/events` 改为 `/news`，文案从 `动态 // Events` 改为 `动态 // News`
3. `key: 'recruitment'` 的链接从 `/recruitment` 改为 `/join`，文案从 `招募 // Join` 改为 `加入我们 // Join`
4. **`key: 'project'` 那一项去掉 `children`**，改为直接链向 `/works` 的普通菜单项：

```js
  {
    label: () =>
      h(
        RouterLink,
        { to: '/works', class: 'menu-link' },
        {
          default: () => '作品 // Works',
        },
      ),
    key: 'works',
  },
```

5. **新增** `关于 // About` 一项，链向 `/about`，形式与上面同构

**去掉下拉的连带收益**：`SiteHeader` 不再需要 `useWorkList`，把相关的 import、调用、以及 `projectMenuChildren` 计算属性一并删除。这顺手消掉了一个既有技术债——`SiteHeader` 与首页各发一次 `GET /works` 的重复请求。

导航顺序按 spec §3.1：**作品 / 动态 / 加入我们 / 关于**。主页项保留在最前。

- [ ] **Step 2: 页脚加归档入口**

在 `SiteFooter.vue` 的 `n-space` 里，版权行**之前**插入一行链接：

```vue
      <n-space :size="16" align="center">
        <RouterLink to="/archive/products" class="footer-link">制品归档</RouterLink>
        <RouterLink to="/about" class="footer-link">关于我们</RouterLink>
      </n-space>
```

`<script setup>` 补上 `import { RouterLink } from 'vue-router'`，样式加：

```css
.footer-link {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
  text-decoration: none;
}

.footer-link:hover {
  color: var(--color-accent);
}
```

- [ ] **Step 3: 跑测试与构建**

```bash
cd frontend && npm test && npm run build && npx eslint . ; echo "eslint exit=$?"
```

Expected：全绿；eslint 退出码 0。

- [ ] **Step 4: 确认 `/works` 与旧路径在导航里都不再出现**

```bash
cd frontend && grep -n "to: '/products'\|to: '/events'\|to: '/recruitment'\|projectMenuChildren\|useWorkList" src/components/SiteHeader.vue || echo "  已清理干净 ✓"
```

Expected：`已清理干净 ✓`。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/SiteHeader.vue frontend/src/components/SiteFooter.vue
git commit -m "feat: :art: 一级导航收敛为四项，去掉作品下拉与其重复请求"
```

---

### Task 5: 首页重写

**Files:**
- Create: `frontend/src/components/work/WorkHero.vue`
- Modify: `frontend/src/views/HomeView.vue`
- Delete: `frontend/src/components/ProjectsBar.vue`

**Interfaces:**
- Consumes: `useWorkList({ limit })`、`useEvents({ limit })`、`WorkCard`、`StatusBadge`、`AsyncBoundary`、`usePageBySlug`、`getStrapiMedia`、`typeLabel`。
- Produces: `WorkHero.vue` props `{ work: Object }`。

- [ ] **Step 1: 写 `src/components/work/WorkHero.vue`**

**这是本轮最容易做丑的一处。** 大图位落在排序第一的作品上，而按录入清单那是在制新游戏——它**没有封面**（预告态）。无封面模式不得退化成灰色占位块。

```vue
<template>
  <RouterLink :to="`/works/${work.slug}`" class="work-hero" :class="{ 'has-cover': coverUrl }">
    <div v-if="coverUrl" class="work-hero-media">
      <img :src="coverUrl" :alt="work.title" />
    </div>

    <div class="work-hero-body">
      <div class="work-hero-meta">
        <span class="work-hero-type">{{ typeText }}</span>
        <StatusBadge :status="work.workStatus" :recruiting="Boolean(work.recruiting)" />
      </div>
      <h2 class="work-hero-title">{{ work.title }}</h2>
      <p class="work-hero-summary">{{ work.summary }}</p>
      <span v-if="work.recruiting" class="work-hero-cta">&gt;&gt; 我们在找人</span>
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
/* 无封面时视觉重量来自排版与留白，不是占位块——
   在制新游戏正是预告态，没有图可看，注意力自然落到状态与 CTA 上。 */
.work-hero {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2.5rem 2rem;
  margin: 2rem 0 3rem;
  background: var(--color-box-strong);
  border: 1px solid var(--color-border-soft);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.work-hero:hover {
  border-color: var(--color-hover-border);
  box-shadow: 0 0 24px var(--color-box-glow);
}

.work-hero-media img {
  display: block;
  max-width: 100%;
  max-height: 40vh;
  width: auto;
  margin: 0 auto;
}

.work-hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.work-hero-type {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

/* 无封面时标题更大，撑住块面 */
.work-hero-title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.3;
  color: var(--color-heading);
}

.work-hero.has-cover .work-hero-title {
  font-size: 1.6rem;
}

.work-hero-summary {
  margin: 0;
  max-width: 44rem;
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-muted);
}

.work-hero-cta {
  align-self: flex-start;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-family: var(--font-family-mono);
}

/* 移动优先：窄屏纵向堆叠（上方默认值），md 起有封面时左右分栏 */
@screen md {
  .work-hero.has-cover {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    align-items: center;
    gap: 2.5rem;
  }
}
</style>
```

- [ ] **Step 2: 重写 `src/views/HomeView.vue` 的模板**

三个内容区块。**删掉**：`ProjectsBar` 区块、展会 timeline、最新制品侧栏、「基本介绍 / 联系我们 / 社团设定」整块（已提取到 `page:about`）、浮动「加入我们」按钮。

```vue
<template>
  <div class="home-view container">
    <section class="page-header flex flex-col items-center text-center gap-4 lg:flex-row lg:gap-8">
      <div class="header-content">
        <h1 class="title">境界景观学会</h1>
        <p class="subtitle">In search of the vacua where phantasm resides.</p>
      </div>
    </section>

    <!-- page:home 记录存在时渲染，不存在则整块不渲染。
         定位陈述由社团方自行撰写，本轮不写文案，只留口子。 -->
    <ContentBlocks v-if="homeBlocks.length" :blocks="homeBlocks" />

    <AsyncBoundary
      :loading="worksLoading"
      :error="worksError"
      :empty="worksEmpty"
      empty-text=">> 暂无作品。"
      @retry="refreshWorks"
    >
      <WorkHero v-if="heroWork" :work="heroWork" />
      <div v-if="gridWorks.length" class="work-grid">
        <WorkCard v-for="work in gridWorks" :key="work.id" :work="work" />
      </div>
    </AsyncBoundary>

    <TechSection title="最新动态 / NEWS" custom-class="event-section">
      <AsyncBoundary
        :loading="eventsLoading"
        :error="eventsError"
        :empty="eventsEmpty"
        empty-text=">> 暂无最新动态。"
        @retry="refreshEvents"
      >
        <div class="events-compact-list">
          <EventCard v-for="event in recentEvents" :key="event.id" :event="event" />
        </div>
      </AsyncBoundary>
    </TechSection>
  </div>
</template>
```

- [ ] **Step 3: 重写 `<script setup>`**

```vue
<script setup>
import { computed } from 'vue'
import EventCard from '@/components/EventCard.vue'
import TechSection from '@/components/TechSection.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import WorkHero from '@/components/work/WorkHero.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import { useWorkList } from '@/composables/useWorks'
import { useEvents } from '@/composables/useEvents'
import { usePageBySlug } from '@/composables/usePages'

// 排序第一条占大图位（featured:desc, order:desc, startDate:desc），
// 其余走网格。featured 的职责由此具体化为「谁占大图位」。
const {
  data: works,
  loading: worksLoading,
  error: worksError,
  isEmpty: worksEmpty,
  refresh: refreshWorks,
} = useWorkList({ limit: 9 })

const heroWork = computed(() => works.value?.[0] ?? null)
const gridWorks = computed(() => (works.value ?? []).slice(1))

const {
  data: recentEvents,
  loading: eventsLoading,
  error: eventsError,
  isEmpty: eventsEmpty,
  refresh: refreshEvents,
} = useEvents({ limit: 3 })

// page:home 缺失时 data 为 null，homeBlocks 为空数组，整块不渲染
const { data: homePage } = usePageBySlug('home')
const homeBlocks = computed(() => homePage.value?.body ?? [])
</script>
```

- [ ] **Step 4: 清理样式**

删掉 `HomeView.vue` 的 `<style scoped>` 里已经没有使用者的规则：`.events-conventions-grid`、`.timeline-wrapper`、`.main-layout`、`.sidebar`、`.products-list`、`.main-content`、`.article-body`、`.contact-grid`、`.contact-item`、`.subsection-title`、`.setting-text`、`.highlight`、`.floating-recruit-btn` 及其全部媒体查询变体。

新增网格样式（移动优先）：

```css
.work-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

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
```

保留 `.home-view`、`.page-header`、`.header-content`、`.title`、`.subtitle`、`.events-compact-list` 及其断点覆盖。

- [ ] **Step 5: 删除 `ProjectsBar.vue`**

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git rm frontend/src/components/ProjectsBar.vue
grep -rn 'ProjectsBar' frontend/src && echo "还有引用，先处理掉" || echo "零引用 ✓"
```

Expected：`零引用 ✓`（Task 4 已把 `SiteHeader` 的作品下拉去掉，本步删掉首页的用法）。

- [ ] **Step 6: 跑测试与构建**

```bash
cd frontend && npm test && npm run build && npx eslint . ; echo "eslint exit=$?"
```

Expected：全绿；eslint 退出码 0；产物里不再有 `ProjectsBar` 相关代码。

- [ ] **Step 7: 提交**

```bash
git add -A frontend/src
git commit -m "feat: :art: 首页重写为三区块，ProjectsBar 轮播退役"
```

---

### Task 6: `/about` 与 `/join`

**Files:**
- Create: `frontend/src/views/AboutView.vue`
- Create: `frontend/src/views/JoinView.vue`
- Modify: `frontend/src/router/routes.js`
- Delete: `frontend/src/views/RecruitmentView.vue`

**Interfaces:**
- Consumes: `usePageBySlug`、`mergeTimeline`、`useConventions`、`useWorkList`、`ContentBlocks`、`AsyncBoundary`。

- [ ] **Step 1: 写 `src/views/AboutView.vue`**

三段：`page:about` 正文 → 社团时间线 → 归档入口。

```vue
<template>
  <div class="about-view container">
    <section class="page-header">
      <h1 class="section-title">关于 // About</h1>
    </section>

    <AsyncBoundary
      :loading="pageLoading"
      :error="pageError"
      :empty="pageNotFound"
      skeleton="text"
      empty-text=">> 关于页正文尚未录入。"
      @retry="refreshPage"
    >
      <ContentBlocks v-if="blocks.length" :blocks="blocks" />
    </AsyncBoundary>

    <section class="about-timeline">
      <h2 class="detail-subtitle">我们走过的路</h2>
      <AsyncBoundary
        :loading="timelineLoading"
        :error="timelineError"
        :empty="timelineEmpty"
        skeleton="text"
        empty-text=">> 暂无记录。"
        @retry="refreshTimeline"
      >
        <ul class="timeline-list">
          <li v-for="item in timeline" :key="item.key" class="timeline-item">
            <span class="timeline-date">{{ item.date || '——' }}</span>
            <span class="timeline-label" :class="`is-${item.kind}`">{{ item.label }}</span>
            <RouterLink v-if="item.to" :to="item.to" class="timeline-title">
              {{ item.title }}
            </RouterLink>
            <span v-else class="timeline-title">{{ item.title }}</span>
          </li>
        </ul>
      </AsyncBoundary>
    </section>

    <section class="about-archive">
      <h2 class="detail-subtitle">存档</h2>
      <p class="about-archive-note">
        社团已停止周边贩售与展会出摊。历史制品保留在
        <RouterLink to="/archive/products">制品归档</RouterLink>。
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import { usePageBySlug } from '@/composables/usePages'
import { useConventions } from '@/composables/useConventions'
import { useWorkList } from '@/composables/useWorks'
import { mergeTimeline } from '@/utils/timeline'

const {
  data: page,
  loading: pageLoading,
  error: pageError,
  notFound: pageNotFound,
  refresh: refreshPage,
} = usePageBySlug('about')
const blocks = computed(() => page.value?.body ?? [])

// 展会全量（9 条），作品全量（11 条）——规模远小于分页上限，不做分页
const {
  data: conventions,
  loading: convLoading,
  error: convError,
  refresh: refreshConventions,
} = useConventions({ limit: 100 })
const {
  data: works,
  loading: worksLoading,
  error: worksError,
  refresh: refreshWorks,
} = useWorkList({ limit: 100 })

const timeline = computed(() => mergeTimeline(conventions.value, works.value))
const timelineLoading = computed(() => convLoading.value || worksLoading.value)
const timelineError = computed(() => convError.value || worksError.value)
// isEmpty 要看合并后的结果，不是任一来源的原始列表
const timelineEmpty = computed(
  () => !timelineLoading.value && !timelineError.value && timeline.value.length === 0,
)
const refreshTimeline = () => {
  refreshConventions()
  refreshWorks()
}
</script>

<style scoped>
.detail-subtitle {
  font-size: 1.1rem;
  color: var(--color-heading);
  margin: 0 0 1rem;
}

.about-timeline,
.about-archive {
  margin: 3rem 0;
}

.timeline-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.timeline-item {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.25rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.timeline-date {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.timeline-label {
  justify-self: start;
  padding: 0.1rem 0.5rem;
  border: 1px solid currentColor;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
}

.timeline-label.is-convention {
  color: var(--color-text-subtle);
}

.timeline-label.is-work {
  color: var(--color-accent);
}

.timeline-title {
  color: var(--color-text);
  text-decoration: none;
}

a.timeline-title:hover {
  color: var(--color-accent);
}

.about-archive-note {
  color: var(--color-text-muted);
  line-height: 1.8;
}

.about-archive-note a {
  color: var(--color-accent);
}

/* 移动优先：窄屏三行堆叠，md 起一行三列 */
@screen md {
  .timeline-item {
    grid-template-columns: 7rem 5rem 1fr;
    align-items: center;
    gap: 1rem;
  }
}
</style>
```

- [ ] **Step 2: 写 `src/views/JoinView.vue`**

一段：`page:join` 正文。岗位与申请渠道全部写在正文里（设计文档 §3.5：完全手写，不从 work 聚合）。

```vue
<template>
  <div class="join-view container">
    <section class="page-header">
      <h1 class="section-title">加入我们 // Join</h1>
    </section>

    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="notFound"
      skeleton="text"
      empty-text=">> 招募信息尚未录入。"
      @retry="refresh"
    >
      <ContentBlocks v-if="blocks.length" :blocks="blocks" />
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import { usePageBySlug } from '@/composables/usePages'

const { data: page, loading, error, notFound, refresh } = usePageBySlug('join')
const blocks = computed(() => page.value?.body ?? [])
</script>
```

本页没有独有样式，不写 `<style>` 块——排版全部来自 `ContentBlocks` 与全局的 `.container` / `.page-header` / `.section-title`。

- [ ] **Step 3: 接线并删除旧页面**

`src/router/routes.js` 里把 `/join` 与 `/about` 的 component 从 `PlaceholderView.vue` 换成：

```js
  {
    path: '/join',
    name: 'join',
    component: () => import('../views/JoinView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
  },
```

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git rm frontend/src/views/RecruitmentView.vue
grep -rn 'RecruitmentView' frontend/src && echo "还有引用" || echo "零引用 ✓"
```

- [ ] **Step 4: 跑测试与构建**

```bash
cd frontend && npm test && npm run build && npx eslint . ; echo "eslint exit=$?"
```

Expected：全绿；eslint 退出码 0；产物里出现 `AboutView` / `JoinView` chunk。

- [ ] **Step 5: 提交**

```bash
git add -A frontend/src
git commit -m "feat: :sparkles: 新建 /about 与 /join，招募页正文迁入 page:join"
```

---

### Task 7: 归档化与死代码清理

**Files:**
- Create: `frontend/src/views/ArchiveProductList.vue`
- Modify: `frontend/src/views/ProductDetail.vue`
- Modify: `frontend/src/composables/useProducts.js`
- Modify: `frontend/src/composables/__tests__/resources.spec.js`
- Modify: `frontend/src/router/routes.js`
- Modify: `CLAUDE.md`、`UPGRADE_TODO.md`
- Delete: `frontend/src/views/ProductList.vue`、`frontend/src/components/CategoryFilter.vue`、`frontend/src/views/PlaceholderView.vue`

- [ ] **Step 1: 写 `src/views/ArchiveProductList.vue`**

由 `ProductList.vue` 改造：**保留网格与卡片，删掉全部贩售运营功能**（分类筛选、搜索、排序）。

```vue
<template>
  <div class="archive-product-list-view container">
    <section class="page-header">
      <h1 class="section-title">制品归档 // Archive</h1>
      <p class="archive-note">
        &gt;&gt; 社团已停止周边贩售与展会出摊。以下为历史制品存档，仅供查阅。
      </p>
    </section>

    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      empty-text=">> 归档中暂无制品。"
      @retry="refresh"
    >
      <div class="product-grid">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { useProducts } from '@/composables/useProducts'
import ProductCard from '@/components/ProductCard.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

// 15 条制品远小于分页上限，不做分页；默认排序 releaseDate:desc 正是归档需要的
const { data: products, loading, error, isEmpty, refresh } = useProducts({ limit: 100 })
</script>

<style scoped>
.archive-note {
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* 移动优先：窄屏单列，sm 起两列，lg 起三列 */
@screen sm {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@screen lg {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
```

**这段说明文案硬编码在组件里，不走 `page`**——它是系统性告示而非编辑内容。

- [ ] **Step 2: 改造 `ProductDetail.vue`**

先通读文件，定位下列具体标识符，然后做四件事：

1. **删掉推荐位整块**。`<script setup>` 里删 `import { useProduct, useRecommendedProducts } from '@/composables/useProducts'` 中的 `useRecommendedProducts`、它的调用语句、以及由它解构出的全部变量（推荐列表、loading、error、isEmpty、refresh）。模板里删掉包裹这些变量的整个区域——它是一个带小标题、内含 `ProductCard` 循环与 `AsyncBoundary` 的 `<section>`。删完后 `ProductCard` 若在本文件已无使用者，其 import 也一并删除。

   验证：`grep -n 'useRecommendedProducts\|recommend' src/views/ProductDetail.vue` 应无输出。

2. **删掉购买引导**。搜索 `购买`、`下单`、`通贩`、`storageId`、`price` 相关的按钮或行动号召元素并删除。**注意保留 `price` 本身作为信息展示**（第 3 点），删的是"促成购买"的元素。

3. **价格：实测已经是普通信息行，大概率无需改动。** 写计划时核对过，它渲染成 `<p><strong>通常价格:</strong> {{ product.price ? … }}</p>`，与其他信息并列，没有独立的大字号或高亮规则。**先确认现状再动手**——如果确实没有强调样式，本条跳过，在报告里写明"已核实无需改动"，不要为了凑数去改它。若发现确有强调样式（如独立的 `.price` 规则），才把它降为与 `releaseDate` 同级。

   `storageId`（制品编号）**保留**。它是目录编号不是贩售功能，spec §3.6 的删除清单里也没有它，不要顺手删。

4. **加停售标注**——在标题下方加一行：

```vue
      <p class="archive-notice">&gt;&gt; 本制品已停止贩售，此页为历史存档。</p>
```

```css
.archive-notice {
  color: var(--color-text-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
}
```

**代理发行标注不需要改代码**——内容侧早有做法（`太田顺也伯伯讲故事` 的 `description` 开头就写着「_本制品为代理发行，原作社团为_**草根人类网络**」），其余几本由社团方照此在后台补写。

- [ ] **Step 3: 收窄 `useProducts` 并删两个死函数**

`src/composables/useProducts.js` 改为：

```js
import { toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

/**
 * 制品列表。归档页不筛选、不搜索、不排序——那些是贩售运营功能，
 * 而贩售已经停止。默认排序 releaseDate:desc 保留，归档正需要它。
 */
export function useProducts({ limit } = {}, options = {}) {
  return useStrapiList(
    'products',
    () => {
      const lim = toValue(limit)
      return {
        populate: 'coverImage',
        sort: 'releaseDate:desc',
        ...(lim ? { 'pagination[limit]': lim } : {}),
      }
    },
    options,
  )
}

export function useProduct(slug) {
  return useStrapiOne('products', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: '*',
  }))
}

/**
 * EventDetail 的动态区里 product 嵌入块只带 id，需要二次批量补全。
 * 用 $in 一次取回，不要在循环里逐个请求。
 */
export function useProductsByIds(ids) {
  const list = useStrapiList(
    'products',
    () => ({
      filters: { id: { $in: toValue(ids) ?? [] } },
      populate: 'coverImage',
    }),
    { immediate: (toValue(ids) ?? []).length > 0 },
  )

  const byId = computed(() =>
    Object.fromEntries((list.data.value ?? []).map((item) => [item.id, item])),
  )

  // id 列表为空时尚未发起请求，不能算"查无结果"——避免在 ids 到来前闪一下空态。
  const isEmpty = computed(() => (toValue(ids)?.length ?? 0) > 0 && list.isEmpty.value)

  return { ...list, byId, isEmpty }
}
```

顶部 import 补上 `computed`：`import { computed, toValue } from 'vue'`。

**删掉的**：`useProductByTitle`（Spec 1 起即为死代码）、`useRecommendedProducts`（推荐位删除后无调用方）、`useProducts` 的 `category` / `search` / `sort` 三个参数。

**顺带删掉 `src/composables/useEventAPI.js`**（206 行）。CLAUDE.md 早已标注它废弃、被 `strapi.js` 取代，实测**零引用**。它还带着一整套 `POST` / `PUT` / `DELETE` / 批量删除 / 导出的方法，对着一个只读的公开站点——留着只会误导后来的人以为站点有写接口。

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git rm frontend/src/composables/useEventAPI.js
grep -rn 'useEventAPI' frontend/src && echo "还有引用" || echo "零引用 ✓"
```

同步删掉 `src/composables/__tests__/resources.spec.js` 里针对这两个函数与那三个参数的全部用例。**测试总数会下降，这是预期内的**，不是回归。

- [ ] **Step 4: 接线并删除旧文件**

`src/router/routes.js` 里 `/archive/products` 的 component 换成 `ArchiveProductList.vue`。

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git rm frontend/src/views/ProductList.vue frontend/src/components/CategoryFilter.vue \
       frontend/src/views/PlaceholderView.vue
grep -rn 'ProductList\|CategoryFilter\|PlaceholderView\|useProductByTitle\|useRecommendedProducts' frontend/src \
  && echo "还有引用，先处理掉" || echo "零引用 ✓"
```

Expected：`零引用 ✓`。（注意 `ArchiveProductList` 含 `ProductList` 子串，grep 时若命中它属正常，人工确认即可。）

- [ ] **Step 5: 全站排查通贩入口**

```bash
cd /data/sunyunbo/www/ABL-Official-Website
grep -rn '通贩\|线上订购\|下单\|购买' frontend/src || echo "前端已无通贩入口 ✓"
```

前端若有残留一并删除。**既有 event 正文里的通贩链接属内容侧**，无法用代码删——在 `docs/content-migration/pages.md` 末尾追加一条待办，提醒社团方去后台检查那条「社团线上通贩发布」动态。

- [ ] **Step 6: 更新文档**

`CLAUDE.md` 的 Backend 结构一节，把内容类型清单改为 **convention, event, product, project, work, page**，并说明 `page` 承载 `/about` 与 `/join` 的策展文案。

`UPGRADE_TODO.md` 的 §3.5 之后追加：

```markdown
### 3.6 站点重构（2026-08-01 Spec 2）

- [x] 一级导航收敛为四项：作品 / 动态 / 加入我们 / 关于
- [x] 首页重写为三区块（在制游戏 hero + 作品网格 + 最新动态），ProjectsBar 轮播退役
- [x] 新增 page 内容类型，/about 与 /join 的正文由 CMS 承载
- [x] /about 时间线合并展会与作品两个来源
- [x] 制品归档化：/archive/products，砍掉筛选/搜索/排序/推荐位
- [x] 清掉 useProductByTitle、useRecommendedProducts、CategoryFilter
- [ ] 中英双语 —— 见 Spec 3
```

- [ ] **Step 7: 跑测试、lint 与构建**

```bash
cd frontend && npm test ; npx eslint . ; echo "eslint exit=$?" ; npm run build
```

Expected：测试全绿（总数因删用例而下降）；**eslint 退出码 0**；构建成功。在报告里说明测试增减各来自哪里。

- [ ] **Step 8: 提交**

```bash
cd /data/sunyunbo/www/ABL-Official-Website
git add -A frontend/src CLAUDE.md UPGRADE_TODO.md docs/content-migration
git commit -m "feat: :fire: 制品归档化，清除贩售运营功能与死代码"
```

---

## 完成后

### 部署顺序不能颠倒

```bash
git push
ssh root@server 'bash /home/deploy/abl_website/update-strapi.sh'   # 先让 page schema 生效
# → 生产 Admin 给 page 开放 Public 的 find / findOne
ssh deploy@server 'bash /home/deploy/abl_website/update.sh'         # 再上前端
```

先上前端会让 `/about` 与 `/join` 对着一个尚不存在的端点报错。

### 只能人工做的

- **录入两条 `page` 记录**（`about` / `join`），正文见 `docs/content-migration/pages.md`。可选的第三条 `home` 由社团方决定是否撰写定位陈述。
- **`page:join` 的 QQ 群号**需要社团方填写（录入稿里已留位置）。
- **检查那条「社团线上通贩发布」动态**，把失效的通贩链接从正文里去掉。
- 补写其余几本代理发行制品的 `description` 标注。

### 需要肉眼确认的（没有测试能守）

- **首页有内容 / 无内容两种形态**都要成立
- **`WorkHero` 的无封面模式**——本轮最容易做丑的一处
- `/about` 时间线的展会与作品混排顺序是否讲得通
- 归档页看起来像「存档」而不是「坏掉的商店」
- `page` 记录缺失时 `/about` `/join` `/` 都不崩

### 后续工单

- `ContentBlocks.vue` 仍在 `components/work/` 下，却被 `page` 与首页复用，路径名已不准确。移动它要连带调整 `detail-shared.css` 的相对路径，风险不大但与本轮无关。
- `EventList.vue` / `EventDetail.vue` / `EventCard.vue` 的组件名与用户可见的 `/news` 路由不一致——刻意为之，组件跟随 Strapi 集合名 `event`。
- Spec 3「中英双语」的全部范围。
