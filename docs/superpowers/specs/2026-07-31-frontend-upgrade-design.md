# 前端地基收敛 · 设计文档

日期：2026-07-31
范围：`frontend/`（Vue 3 + Vite + Naive UI + UnoCSS），共 4081 行、8 个组件 + 9 个页面
状态：待实施

---

## 1. 这轮要解决什么

`UPGRADE_TODO.md` 里剩余 66 项的写法是「用 `n-grid` 优化布局」「用 `n-spin` 优化加载状态」这类组件替换清单——描述的是手段而非目标。逐条打勾做完，下面这些问题一个都不会消失。

这轮的目标是把地基理顺：**颜色有单一真相、数据访问有统一入口、加载与错误有统一呈现**。不做视觉重塑。

### 1.1 现状证据

以下均为实测数据，不是估计。

**三套并存且互相漂移的调色板：**

| 来源 | 底色 | 主色 | 谁在用 |
|---|---|---|---|
| `src/config/colorTokens.js` | `#000000` | `#00a8ff` | CSS 变量 → 页面 scoped CSS |
| `src/config/theme.js` 硬编码 | `#0a0f1a`（19 处）、`#050810`（8 处）、`#0d1220`（7 处） | 辉光 `rgba(89,216,255,…)` | 所有 Naive 组件 |
| `uno.config.js` | `#2F333D` | `#1EB5E8` | 无人使用 |

`theme.js` 顶部 `import { colorTokens }` 了，但组件表面色另起了一套藏青；`uno.config.js` 注释写着「与现有 CSS 变量对齐」，实际停留在上一版设计。

**UnoCSS 装了但没人用**——全项目仅 4 处原子类命中。原因不是习惯问题：写 `bg-box` 拿到的是 `#21252E` 灰，跟纯黑页面明显不搭，所以大家写着写着退回手写 CSS。配置骗人。

**CSS 变量映射是手写的，漏了 8 个 token。** `colorTokens.js` 定义了 `textMuted` / `textSubtle` / `textDisabled` / `borderSoft` 等，`cssVariableMap` 没映射它们。结果 `var(--color-text-muted)` 被使用 5 次却从未定义，那几处文字渲染的是继承色。

**命名冲突（尚未引爆）**：`uno.config.js` 的 shortcuts 定义了 `container` / `tech-box` / `page-header` / `section-title`，而 `main.css` 里同名全局类真实存在且正在被使用（分别 11 / 17 / 9 / 2 处引用）。目前 UnoCSS 未被触发所以相安无事，一旦开始用原子类，两边同时命中，胜负取决于 CSS 注入顺序。

**没有数据层**：`apiClient` 被 8 个文件直接调用，各写各的 try-catch。具体问题：

- `response.data.data || response.data` 这个「不确定 v4 还是 v5」的防御写法散落 6 处。实际是 v5。
- `ProductDetail.vue` 中 slug 直接字符串拼进 URL 未编码；同一文件内 query string 与 axios `params` 两种写法混用。
- **静默失败**：`ProjectsBar`、`SiteHeader`、`csd20.vue` 三处 catch 中只有 `console.error`，接口挂了页面空白且用户无感知。
- 错误处理三种风格并存：抛 `Error`（ProductDetail）、设 error 字符串（EventList）、静默（上述三处）。
- `HomeView` 并行请求三个接口，**完全没有 loading / error 状态**。
- `SiteHeader` 与 `ProjectsBar` 请求同一个 `/projects`，各自维护一份 `normalizeProjects`。
- `ProductList` 为拿分类去重，把全量 products 拉下来在前端 `Set`。
- 全站没有任何一处可以重试，接口抖动只能刷新页面。

**字体加载三次，其中两个 0 引用：**

| 加载位置 | 字体 | 全站引用 |
|---|---|---|
| `index.html` `<link>`（含 preconnect） | Jost、Roboto Mono | 0 处、0 处 |
| `base.css` `@import url(…)` | Orbitron、Space Grotesk | 2 处、2 处 |

真正在用的两个走 CSS `@import`——浏览器要先下完 `base.css` 才发现它，比 `<link>` 慢一轮往返且阻塞渲染。另有 4 处直接写 `monospace` / `Courier New`。

**断点 4 个值，其中两个是手滑**：`768px`（6 处）、`640px`（3 处）、`992px`（1 处）、`980px`（1 处）。

**43 处 `:deep()`**，其中约 10 处穿透 Naive 内部 BEM 类名（`.n-timeline-item-content__title`、`.n-menu-item--selected`、`.n-tag`）。这些是组件库实现细节，升版本可能改名；它们存在的原因是 `themeOverrides` 里没有 `Timeline` 等配置，只能靠 `:deep` 硬改。其余 33 处穿透自有子组件（`.markdown-block`、`.tracklist`），属正当用法。

### 1.2 已确认的决策

| 议题 | 决定 |
|---|---|
| 本轮目标 | 先理地基，不做视觉重塑 |
| 样式架构 | 三层分工 + 单一颜色源 |
| 数据层粒度 | 通用底座 + 每资源薄封装 |
| 验证方式 | 数据层写 Vitest 单测，页面人工逐页对照 |
| 改造范围 | 一次性全站收敛（9 个页面全做） |
| 观感基准 | 向 token 看齐，允许微差 |
| 执行顺序 | 基础设施先行，随后按页纵切，每页一个 commit |

---

## 2. 设计

### 2.1 颜色单一源

**收编藏青系，而非抹平。** `#0a0f1a` 使用 19 次、`#050810` 8 次，这个量级是有意让组件表面比页面底色浅一档的层次设计，不是脏数据。因此提升为正式 token：

```
background      #000000    页面底
surface         #0a0f1a    卡片 / 按钮 / 输入框表面
surfaceRaised   #0d1220    hover 态
surfaceSunken   #050810    强调按钮文字色 / 更深的凹陷
```

`rgba(89,216,255,…)` 那组辉光同理收编为 `glowAccent` / `glowAccentStrong`。改完 `theme.js` 中不应残留任何字面量颜色。

**删掉手写的 `cssVariableMap`，改为自动派生。** 按 `camelCase → --color-kebab-case` 规则全量生成。「定义了但忘记映射」这类 bug 从结构上消失。

**`uno.config.js` 的 `theme.colors` 直接 import `colorTokens` 生成**，不再手抄。

三路输出——CSS 变量、Naive `themeOverrides`、Uno theme——从此都是同一份数据的投影。改 `colorTokens.js` 一个数字，三处同时跟着变。

**删掉 `uno.config.js` 中冲突的 4 个 shortcut**（`container` / `tech-box` / `page-header` / `section-title`），保留 `main.css` 实现——它才是页面正在用的那个，且带有 shortcut 版本没有的左右描边特效。`card-base` 无人引用，一并删。

### 2.2 数据层

**底座 `src/composables/useStrapiResource.js`，导出两个函数：**

```js
useStrapiList(resource, params, options)  // → { data, meta, loading, error, isEmpty, refresh }
useStrapiOne(resource, params)            // → { data, loading, error, notFound, refresh }
```

底座职责：

1. 解包 v5 响应（`response.data.data`），不再兼容 v4，删除散落的 6 处 `|| response.data`
2. `AbortController` 取消在途请求（params 变化或组件卸载时）
3. 错误统一成 `{ message, status }`
4. `params` 接受 ref 或 getter，变化时自动重发；提供 `debounce` 选项

第 4 条直接替代 `EventList` 中手写的 `watch` + `clearTimeout` 防抖。

**资源层，每资源一个文件，把 Strapi 约定钉死：**

```js
useEvents({ limit, search })      // populate: 'coverImage', sort: 'date:desc'
useEvent(slug)                    // populate: { mainContent: { populate: '*' } }
useProducts({ category, search }) // populate: 'coverImage', sort: 'releaseDate:desc'
useProduct(slug)                  // populate: '*'；顺带修掉 slug 未编码
useProjects({ limit })            // populate: 'coverImage', sort: 'date:desc'；normalizeProjects 收拢至此
useConventions({ upcoming })      // filters[date][$gte] = today
```

页面从此不碰 `populate`。后台给 event 加封面字段，改一个文件即可。

**两处特殊逻辑保留但收编：**

- `EventDetail` 的「dynamic zone 中 product embed 只带 id，需二次批量拉取」是真实需求 → `useProductsByIds(ids)`
- `ProductDetail` 的随机推荐行为不变 → `useRecommendedProducts(excludeId)`

**静默失败全部改为向上暴露 `error`**，由 `AsyncBoundary` 决定呈现。

### 2.3 统一的加载 / 空 / 错误呈现

组件 `src/components/AsyncBoundary.vue`，插槽包住内容：

```vue
<AsyncBoundary :loading="loading" :error="error" :empty="isEmpty" @retry="refresh">
  <EventCard v-for="e in data" :key="e.id" :event="e" />
</AsyncBoundary>
```

三态默认实现走 Naive：`n-skeleton` / `n-empty` / 错误态带重试按钮回调 `refresh`。

**默认文案沿用现有终端风格**，不采用 Naive 默认英文。`>> 正在获取最新情报...`、`>> [错误] 无法连接至情报服务器` 是站点调性的一部分，统一状态处理不应把它洗成通用组件库的样子。`main.css` 中的 `.status-box` 由该组件内化后删除，10 处调用点跟随组件走。

**骨架屏按内容形状分两种**：列表页用卡片网格骨架，详情页用文本行骨架。通用转圈会在列表页造成明显布局跳动。

**`HomeView` 使用三个独立的 `AsyncBoundary`，而非整页包一个。** 首页并行请求 products / events / conventions，整页共用状态会导致展会接口挂掉时连带最新制品和社团介绍一起消失。按区块隔离后，坏掉的那块显示错误态并可单独重试，其余照常渲染。

### 2.4 样式分工的执行规则

**三层边界判据：**

| 层 | 负责 | 判据 |
|---|---|---|
| UnoCSS | grid/flex、间距、字号、断点、显隐 | 能用一两个原子类表达的 |
| Naive UI | 按钮、输入、分页、骨架屏、空状态 | 有交互状态的 |
| scoped CSS | `clip-path` 切角、多层 `box-shadow` 发光、渐变分割线、伪元素装饰、`writing-mode`、`@keyframes` | 原子类写出来会比 CSS 更难读的 |

最后一条是刻意留的口子——不追求消灭 scoped CSS。招募按钮的 `clip-path` 六边形切角强写成原子类只会更糟。

**全局类按实际引用数决定去留：**

- 保留：`.tech-box`（17）、`.container`（11）、`.page-header`（9）
- `.status-box`（10）：由 `AsyncBoundary` 内化后从 `main.css` 删除
- 删除：`.main-title`——定义了但 **0 引用**，死代码
- 移回页面 scoped：`.product-list-view` 仅 1 处引用却占据全局命名空间
- `.section-title`（2）：CSS 类保留；其同名 shortcut 已在 2.1 中随冲突项一并删除
- `.divider`（3）、`.main-content`（5）：保留，无冲突

**断点迁移要翻转方向。** 现状是 `max-width` 桌面优先，UnoCSS 是 `min-width` 移动优先，`md:` 含义相反。这是整轮改造最容易埋 bug 的地方——写反了在桌面端完全正常，只在窄屏炸。因此断点迁移单独成一个阶段，验收明确要求缩窗口过一遍。`992px` 与 `980px` 一并归到 `lg`（1024），接受微差。

**字体收拾：** 删除 `index.html` 中 0 引用的 Jost / Roboto Mono 及其 preconnect；把在用的 Orbitron / Space Grotesk 从 `base.css` 的 `@import` 提到 `index.html` 的 `<link>`；4 处裸写的 `monospace` / `Courier New` 统一成一个 token。此项严格说超出「地基」范围，但它是删代码而非加代码。

### 2.5 测试范围

Vitest，只测纯逻辑。不引 jsdom、不测组件渲染——composable 用的 `ref` / `watch` 在 Node 中可直接运行，仅 `onUnmounted` 类生命周期需要一层 `effectScope` 测试辅助。

覆盖四块：

1. **`useStrapiResource` 底座**：v5 响应解包；错误映射（网络超时 / 403 / 404 / 500 各映射成什么 `message`）；params 变化触发重发；防抖；**组件卸载时取消在途请求且不写回状态**（快速切页导致旧响应覆盖新数据是最易漏的一类 bug）。
2. **资源层发出的请求参数**：断言 `useEvents()` 确实带 `populate: 'coverImage'` 与 `sort: 'date:desc'`。价值在于以后谁删了 `populate`，测试立刻红，而不是等线上图片全空。
3. **`getStrapiMedia`**：相对路径拼接、绝对 URL 直返、`null` / `undefined`、v5 各种媒体形状。该函数目前无任何测试却被全站依赖。
4. **配置守卫**（三条断言）：
   - 派生结果覆盖 `colorTokens` 全部键
   - `theme.js` 源码中不出现字面量颜色（正则扫 `#[0-9a-fA-F]{6}` 与 `rgba(`）
   - `uno.config.js` 的 colors 与 `colorTokens` 同源

第 4 条是这轮最有价值的测试。本次修的核心问题就是「三套调色板各自漂移」，守卫测试让它无法复发。

**不测**：页面组件、布局、样式、视觉——交给人工逐页对照。

---

## 3. 实施阶段与验收

每阶段独立 commit；阶段 3 每页一个 commit。

| 阶段 | 内容 | 验收 |
|---|---|---|
| 0 | `colorTokens` 三路输出 + 守卫测试 | 测试绿；跑 dev 全站观感与改前一致（已知微差除外） |
| 1 | 数据层底座 + 资源封装 + 测试 | 测试绿；页面尚未接入，站点行为不变 |
| 2 | `AsyncBoundary` 组件 | 断网跑一次，确认三态与重试均正确 |
| 3 | 9 个页面逐个迁移 | 每页跑 dev 对照桌面视图 |
| 4 | 断点翻转 `max-width` → `min-width` | 缩窄浏览器把 9 页再过一遍 |
| 5 | 清理：删死类、删冲突 shortcut、字体收拾 | `npm run build` 通过 + 全站再过一遍 |

**阶段 3 的页面顺序**（按「最快压出底座设计缺陷」排）：

1. `HomeView` —— 三接口并行、零状态处理，最能验证 `AsyncBoundary` 的区块隔离
2. `EventDetail` —— 496 行最长，含 N+1 二次拉取
3. `EventList`
4. `ProductList`
5. `ProductDetail`
6. `ProjectsBar` + `SiteHeader` —— 共享 `useProjects`，一起改
7. `RecruitmentView`
8. `zyzView`
9. `csd20` + `csd20music`

**前两个页面改完是真正的检查点。** 若 `useStrapiResource` 接口设计有问题，会在这两个页面暴露；此时返工成本是两个文件而非九个。

---

## 4. 风险

1. **断点写反** —— 桌面端看着完全正常，只在窄屏炸。缓解：阶段 4 独立成步，验收明确要求缩窗口。
2. **对比度** —— `var(--color-text-muted)` 那 5 处第一次真正生效，`#b0b0b0` 落在纯黑底上需确认可读。太暗则调 token 值（单一源，改一处即可）。
3. **`:deep` 穿透 Naive 内部类的约 10 处** —— 正确修法是给 `themeOverrides` 补上 `Timeline` 等缺失配置以替换 `:deep`，但这会改变实际渲染，与「不改观感」有张力。处理方式：阶段 3 遇到时逐个判断，能用 `themeOverrides` 干净替代的就换，换了明显走样的保留 `:deep` 并记录。不强行清零。

---

## 5. 明确不做

以下均已讨论并决定推迟，记录在此避免实施时范围蔓延：

- **视觉重塑 / 重新定调色板** —— 本轮只做归并，不重新审视配色。
- **性能与包体积** —— `csd_20_title.png` 17.5 MB、`宣传图12` 5.7 MB、`csd20_theme.mp3` 8.5 MB 全部打进 `dist/`；主 JS 633 KB（gzip 197 KB）未做代码分割。独立一轮处理。
- **自托管字体** —— Google Fonts 在国内访问不稳定，字体大概率加载失败回落系统字体。根治需自托管字体文件，独立一件事。
- **`csd20.vue` 按标题字符串硬匹配制品**（`title: { $eq: '梦违科学世纪20周年合同志' }`）—— 后台改一个字页面就空。正确修法是给它稳定的 slug 或标识字段，但要动 Strapi Content-Type 和生产库既有内容，会让 diff 与回滚都复杂。本轮只把该请求收进资源层，硬匹配保持原样。
- **`ProductList` 拉全量 products 做分类去重** —— 数据量大后会拖慢。属于数据获取策略优化，本轮只做搬迁不改算法。
- **`ProductDetail` 随机推荐的两次往返** —— 行为不变，仅收编。
- **`project` 内容类型缺 slug 字段** —— 后端 `project` 已建好，但前端仍是 `/project/csd20` 这类硬编码路由，没有 `:slug` 动态路由（`product` / `event` 都有）。做动态项目页需先在 Content-Type Builder 加 slug。独立一件事。
- **`UPGRADE_TODO.md` 中纯组件替换的条目** —— 本轮完成后应重写该文件：一部分条目会被自然消解（统一状态组件覆盖了所有 `n-spin` / `n-empty` / 骨架屏条目），剩余的需按「目标」而非「手段」重述。
