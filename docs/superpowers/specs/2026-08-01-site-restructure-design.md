# 站点重构 · 设计文档

日期：2026-08-01
范围：一级导航改版、首页重排、新建 `/about` 与 `/join`、旧业务归档化、`page` 内容类型
状态：待实施（**实施排在内容录入之后**，见 §1.3）
前序：[作品体系与内容模型](2026-07-31-work-content-model-design.md)（Spec 1，已合并上线）
后续：Spec 3「中英双语」，不在本轮范围

这是社团转型三个 spec 中的第二个。Spec 1 建立了 `work` 作品实体与 `/works` 页面；本轮把整个站点的信息架构切换到以作品为主轴，并让退出的业务体面地归档。

---

## 1. 现状与前提

### 1.1 首页有一半在服务要退出的业务

`frontend/src/views/HomeView.vue`（324 行）当前结构：

```
社团名 + 副标题
社团线上项目          ← ProjectsBar 轮播（238 行自写组件）
最新动态 | 近期展会    ← 并排；展会是 n-timeline
最新制品 + 侧栏
另有一个浮动「加入我们」按钮
```

**两个区块直接绑在要退出的业务上**（近期展会、最新制品），而转型后该有的东西一个都不存在。这不是"重排"，接近重写。

### 1.2 Spec 1 留下的可复用件

- `WorkCard.vue` / `StatusBadge.vue` —— 作品卡片与状态徽标
- `useWorkList` —— 固定排序 `featured:desc, order:desc, startDate:desc`
- `AsyncBoundary` —— 加载 / 空 / 错误三态，空态文案是终端风 `>> …`
- `src/router/redirects.js` —— 纯数据重定向表 + 桩组件行为测试方案
- `src/utils/work.js` —— 纯函数层，含读 Strapi schema 断言前后端枚举一致的守卫测试

### 1.3 生产 `work` 目前是空的

Spec 1 已上线，`/api/works` 返回 200 但 `data: []`。10 条记录待人工录入（`docs/content-migration/work-records.md`）。

**因此本 spec 的实施排在内容录入之后。** 设计可以现在定，但让开发者对着空库做首页，会重演 Spec 1 那种「没有人看到过页面渲染出来」的处境。

---

## 2. 已确认的决策

| 议题 | 决定 |
|---|---|
| 上线时序 | **先录内容，再实施本 spec** |
| 空内容防御 | 显示终端风空态文案（复用 `AsyncBoundary`），不做区块级隐藏 |
| 策展文案归属 | 新建 Strapi `page` 内容类型，`/about` 与 `/join` 的正文由 CMS 承载 |
| 申请渠道 | QQ 群 + 保留邮箱，**写在 `page:join` 正文里**，不新增字段 |
| 首页作品区 | **网格 + 头部一张大图**；`ProjectsBar` 轮播退役 |
| 展会归宿 | 并入 `/about` 时间线，**不建** `/archive/conventions` |
| `/about` 时间线 | **合并展会与作品两个来源**按日期倒序 |
| `/join` 岗位 | **完全手写在 `page:join`**，不从 work 聚合（代价见 §4.2） |
| 定位陈述 | 本轮不写。`page:home` 记录存在时渲染，不存在则整块不渲染 |
| 代理发行标注 | 走内容侧（`description` markdown），**不改 `product` schema** |

---

## 3. 设计

### 3.1 导航与路由

一级导航收敛为四个内容入口（作品 / 动态 / 加入我们 / 关于），外加保留的主页项：

```
主页 // Home      作品 // Works      动态 // News      加入我们 // Join      关于 // About
```

`制品` 与 `招募` 退出一级导航——前者归档，后者改名进 `/join`。归档入口放页脚与 `/about`，不占一级位置：它是过去时。

**路由表（本轮完成后的全貌）**

| 路径 | 页面 | 来源 |
|---|---|---|
| `/` | 首页 | 重写 |
| `/works` `/works/:slug` | 作品列表 / 详情 | Spec 1 已建 |
| `/news` `/news/:slug` | 动态与开发日志 | 原 `/events` |
| `/join` | 加入我们 | 原 `/recruitment` |
| `/about` | 关于社团 | 新建 |
| `/archive/products` | 制品归档 | 原 `/products` |
| `/archive/products/:slug` | 制品详情（内容保留） | 原 `/products/:slug` |

**重定向表**（沿用 `redirects.js` 纯数据机制，逐条行为测试）

| 旧路径 | 新路径 |
|---|---|
| `/events` | `/news` |
| `/events/:slug` | `/news/:slug` |
| `/recruitment` | `/join` |
| `/products` | `/archive/products` |
| `/products/:slug` | `/archive/products/:slug` |

加上 Spec 1 已有的三条 `/project/*`，全站重定向共 8 条。

**`/products/:slug` 这条不能漏**：`docs/content-migration/csd20.md` 指导作者在正文里写了指向 `/products/csd20` 的链接，缺了它那个链接会断。

Strapi 集合名与 API 路径（`/api/events`）**不改**——前端路由叫 `/news` 与后端命名解耦即可，改集合名会牵动权限配置与既有数据。

### 3.2 `page` 内容类型

路径：`strapi-backend/src/api/page/content-types/page/schema.json`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | |
| `slug` | uid（targetField: `title`） | 是 | 取值限于 `about` / `join` / `home` |
| `body` | dynamiczone | 否 | 复用 work 那套：`content-block.content-block` + `embedding.link-embed` / `iframe-embed` / `file-embed` / `audio-embed` |

`options.draftAndPublish` 为 `true`，与现有内容类型一致。

**为什么值得多一个内容类型**：维护者将赴海外、时间零碎。改一句文案要走「改 Vue 文件 → 提交 → 部署」三步，实际结果就是永远不改。三条记录换来文案随时可编辑，值。

**页面在记录缺失时不得崩**。`/about` 与 `/join` 的正文缺失时渲染空态文案，页面其余部分（时间线、归档入口）照常；`page:home` 缺失时首页那一块整块不渲染。

### 3.3 首页

**区块从原计划的六个收敛为三个**（外加站点通用的页头页脚）。

原计划把「在制游戏状态卡」与「招募钩子」分列第 2、3 块。实施前发现二者重复：大图位落在在制游戏上，而那条记录**没有封面**，这张卡的视觉重量只能来自排版与状态，招募 CTA 放进去正好填补空白。再单开一个招募区块，等于在同一屏把同一批岗位说两遍。

```
社团名 + 副标题（保持现状）
  └ page:home 正文（有则渲染，无则整块不渲染）

1. 在制游戏 hero      大图位，含招募 CTA
2. 作品流网格          能力证明：工具、活动站、历史作品
3. 最新动态            3 条 news，链到 /news
```

**hero 取排序后的第一条**（`featured:desc, order:desc, startDate:desc`）。按录入清单，那是 `新游戏项目`（`featured=true`、`order=100`，全表最高）。不需要新字段或新查询——`featured` 的职责由此变得具体：**它决定谁占大图位**。

**作品列表为空时**（当前生产状态），hero 与网格合并为一个 `AsyncBoundary` 空态，显示终端风文案，不渲染空的 hero 外壳。

**hero 有两种渲染模式，先上线的是没有图的那种：**

- **有封面**：全宽卡，封面占一侧，标题与状态在另一侧
- **无封面**：**不得退化为灰色占位块**。改为纯排版 hero——大字标题、`开发中` + `招募中` 双徽标、`summary`、以及链向 `/join` 的 CTA，用站内既有的终端风边框撑住块面

没有图反而让招募信息落了地：视线没有图可看，自然落到「内核开发完成，正在招募美术资产制作者」和 CTA 上。等美术资产做出来，同一个位置自动切到有封面的模式——那时展示重心本来也该从「求人」转向「看作品」。

**作品流网格**复用 `WorkCard`，与 `/works` 同一套卡片，排除已占据 hero 的那条。

**从首页删除**

| 现有区块 | 处置 | 理由 |
|---|---|---|
| 近期展会 timeline | 移到 `/about` | 9 条全是过去时 |
| 最新制品（3 个 `ProductCard`） | 删除 | 归档业务不再上首页 |
| `ProjectsBar.vue`（238 行轮播） | **退役** | 换成 `WorkCard` 网格；轮播适合少量大图，不适合扫视 |
| 浮动「加入我们」按钮 | **删除** | 导航有入口、hero 有 CTA，第三处冗余；且它是全站响应式最复杂的一处（7 个属性含 `writing-mode` / `transform`） |

### 3.4 `/about`

三段：`page:about` 正文 → 社团时间线 → 归档入口。

**时间线合并 `convention` 与 `work` 两个来源**，按日期倒序，展会条目标「出展」、作品条目标其 `workType` 中文标签。转型叙事会自己浮现：越往下越是展会，越往上越是作品。

合并逻辑抽为纯函数放进 `src/utils/timeline.js`，在 Node 环境单测——沿用本项目「需要验证的逻辑先抽成纯函数」的全局约束。函数签名：

```
mergeTimeline(conventions, works) → Array<{ date, kind: 'convention'|'work', title, label, to? }>
```

`kind` 决定标签样式，`to` 为作品的站内路径（展会无链接）。缺日期的条目排在最后而非抛错。

### 3.5 `/join`

三段：`page:join` 正文 → 岗位 → 申请渠道。

**岗位完全手写在 `page:join` 的正文里**，不从 work 聚合。申请渠道（QQ 群 + 邮箱）同样写在正文里——群号与邮箱会变，写在正文里随时可改；为它单开 schema 字段是过度设计。

首页 hero 的 CTA 链到本页。

### 3.6 归档化

**`/archive/products` 列表页**：按 `releaseDate` 倒序的简单网格，顶部一句说明本社团已停止周边贩售、以下为历史存档。该说明是系统性告示而非编辑内容，**硬编码在组件里**，不走 `page`。

**砍掉的全部是贩售运营功能**：`CategoryFilter.vue` 退役、搜索框删除、排序删除、推荐位删除、价格从强调位降为普通信息。

**`/archive/products/:slug` 保留内容**：标题、封面、`description` markdown 正文、发行日期、发行展会。去掉购买引导。

**代理发行标注走内容侧，不改 `product` schema**。内容里早有现成做法——`太田顺也伯伯讲故事` 的 `description` 开头写着「_本制品为代理发行，原作社团为_**草根人类网络**」。樱庭友纪老师那几本照此办理即可。

**全站排查通贩入口并下线**。停止贩售后那个链接留着会真收到订单。排查范围包括 `SiteFooter`、`ProductDetail`、以及既有 event 正文中的链接（正文属内容侧，列入录入清单）。

### 3.7 顺带清除的死代码

归档化会让一批代码彻底失去调用方，本轮一并清理：

| 目标 | 现状 |
|---|---|
| `useProductByTitle` | Spec 1 起即为死代码 |
| `useRecommendedProducts` | 推荐位删除后失去调用方 |
| `useProducts` 的 `category` / `search` / `sort` **参数** | 归档页不筛不搜不排。**默认排序 `releaseDate:desc` 保留**——归档页正需要它，删的是可传参的能力，不是默认值 |
| `CategoryFilter.vue` | 整个组件退役 |
| `ProjectsBar.vue` | 被 `WorkCard` 网格取代 |

对应的既有测试同步删除，测试总数会下降——这是预期内的，不是回归。

---

## 4. 全局约束

- **不引入 jsdom 或组件测试框架。** 需要验证的逻辑一律先抽为纯函数再单测。
- **`npx eslint .` 退出码必须保持 0。** 这是 Spec 1 刚赢下来的 CI 门禁。
- **不修改 `product` / `convention` 的 schema**，一条数据不删。
- **不做作品或页面专属组件路由**，沿用 Spec 1 §3.7 的统一形式政策。
- **旧链接不得 404**，8 条重定向逐条行为测试。
- **不新增颜色 token**（`src/config/__tests__/tokens.spec.js` 守着）。
- 断点移动优先，不得写 `max-width` 媒体查询。
- 复用 `useStrapiResource`、`AsyncBoundary`、`colorTokens`、`WorkCard`、`StatusBadge`。

### 4.1 已知的重复：岗位有两处

`/join` 手写岗位，作品详情页从 `work.recruitingRoles` 渲染岗位。**招满了要两边都改，忘了就会打架。**

缓解办法是把两者职责收窄到不重叠：`work.recruiting` 只负责卡片与详情页上那个「招募中」徽标（"这个作品在招人"），`page:join` 是"具体招什么"的唯一出处。轻微不同步可以容忍。

这是用户明确选择的取舍（备选是从 work 聚合，一处维护但文案自由度低）。

---

## 5. 验收

可自动化：

- **8 条重定向逐条行为测试**：桩组件 + `createMemoryHistory`，`router.push(旧路径)` 后断言落点。不测数组结构——本项目吃过结构性守卫的亏。
- **`mergeTimeline` 单测**：展会与作品混排顺序、同日期、缺日期条目排最后、两个来源分别为空、都为空。
- `npm test` 全绿。测试总数会**双向变动**：新增重定向与 `mergeTimeline` 用例，同时删除 `useProductByTitle` / `useRecommendedProducts` / `useProducts` 参数相关的既有用例。实施报告须说明增减各来自哪里，净值本身不作为验收指标。
- `npm run build` 通过；`npx eslint .` 退出码 0。
- 实施报告须附新增/删除文件清单与测试数量增减来源。

需要人工确认（实施者无浏览器，由控制方用 headless 浏览器 + 种子数据先过一遍，真实观感待内容录入后由社团方确认）：

- **首页的两种形态**：有内容与无内容都要成立
- **hero 的无封面模式**——本轮最容易做丑的一处，且没有测试能守
- `/about` 时间线的展会与作品混排顺序是否讲得通
- 归档页看起来像「存档」而不是「坏掉的商店」
- `page` 记录缺失时 `/about` `/join` `/` 都不崩

---

## 6. 明确不做

- **Spec 3「中英双语」**：Strapi i18n、UI 静态字典、`/en/` 路由前缀、正文英文可选并回落中文
- **`/archive/conventions`**：展会并入 `/about`
- **从 work 聚合 `/join` 岗位**：见 §4.1
- **首页定位陈述文案**：留 `page:home` 的口子，文案由社团方自行撰写
- **`product` schema 变更**：代理发行标注走内容侧
- **分页**：`/works` 与 `/archive/products` 均硬编码 `limit`，条目数远小于上限
- Spec 1 遗留但与本轮无关的项：`ContentBlocks` 与 `EventDetail` 的两份动态区实现、`embedding.pdf-embed` 从未被渲染、`useStrapiResource` 的重复请求闪烁

---

## 7. 运维成本

1. **新增 `page` 内容类型**，生产需走 `update-strapi.sh`（pull + build + restart），并在 Admin 为 `page` 开放 Public 的 `find` / `findOne`。**只 `pm2 restart` 不生效**——见 CLAUDE.md。
2. **三条 `page` 记录（`about` / `join` / 可选 `home`）需人工录入**，正文由社团方撰写。本 spec 交付承载结构，不交付文案。
3. `event` 的 10 条既有数据仍需按 Spec 1 的清单迁移 `category` 枚举，与本轮独立。
