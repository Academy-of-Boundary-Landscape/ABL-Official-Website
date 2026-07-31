# 前端地基收敛 · 交接说明

分支：`feat/frontend-foundation`（`a5a8bbd..e09544f`，39 个 commit）
日期：2026-07-31
配套文档：[设计](specs/2026-07-31-frontend-upgrade-design.md) · [实施计划](plans/2026-07-31-frontend-foundation-consolidation.md)

---

## 这个分支做了什么

| | 改动前 | 现在 |
|---|---|---|
| 调色板 | 3 套互相漂移 | 1 个源，三路投影（CSS 变量 / Naive 主题 / UnoCSS），5 条守卫测试锁死 |
| 数据请求 | 8 个文件各写各的 try-catch | 1 个底座 + 6 个资源封装 |
| `.vue` 里的 `apiClient` / `populate` | 8 处 / 散落各页 | 0 / 0 |
| 加载 · 空 · 错误态 | 3 种风格 + 3 处静默失败 | `AsyncBoundary` 统一，全部可重试 |
| 测试 | 0 | 66 |
| 手写媒体查询 | 11 条桌面优先 | 0（仅剩 1 条 `hover` 查询，非尺寸断点） |

---

## ⚠️ 合并前必须人工验证

**没有任何人或工具看到过这些页面渲染出来。** 开发库为空（各集合 `total: 0`），整个执行过程中无浏览器可用。所有「观感不变」的结论都建立在静态比对——取值逐字节对照、构建产物 CSS 对比、CSS 层叠推理——而非观察。

按顺序走，第 1、2 步最关键。

### 1. 先建测试数据

没有数据，下面全部无意义。最少需要：

- 3 个 product（`available` 分别为 true / false / 空；都带封面图），其中一个标题必须是 `梦违科学世纪20周年合同志`
- 3 个 event，其中一个的 `mainContent` 动态区要包含一个挂了 **≥2 个制品**的 product-embed，外加 link / iframe / file 各一种嵌入块
- 2 个未来日期的 convention
- 2 个 project（一个外链、一个站内链接）

### 2. 确认 `.container` 宽度已恢复

在 1200px 和 1920px 两个宽度下打开首页，与线上站点对比。内容列宽度应连续变化（`min(1600px, 100vw)`，两侧 2rem 留白），**不应**在断点处出现跳变。

> 这一步在验证本轮最严重的一个 bug 的修复。详见下方「已知观感变化」。

### 3. 四个全局类的观感对照

与线上并排看：

| 类 | 线上现在（被 UnoCSS shortcut 覆盖） | 本分支（`main.css` 的真实实现） |
|---|---|---|
| `.tech-box` | padding `1.5rem`；左右描边 3px；渐变后面透着 `#21252E` 灰；hover 是通用灰阴影 | padding `1.5rem 2rem`；描边 4px；纯黑底；**hover 出现蓝紫辉光** |
| `.section-title` | 青色 `#1EB5E8` 文字 + 青色下边框，`1.25rem` | 白色 `var(--color-heading)` + 白边框，`1.5rem` |
| `.page-header` | margin `5rem 0` | `40px 0 80px` |
| `.container` | `max-width: 80rem`，padding `1rem` | `min(1600px, 100vw)`，padding `2rem` |

### 4. 六个 AsyncBoundary 的三种状态

消费者：`HomeView`（3 个，互相独立）、`EventList`、`ProductList`、`ProductDetail`、`EventDetail`、`ProjectsBar`、`csd20`。

每个都要过：正常 → DevTools 断网看错误态并点「重试」确认能恢复 → 搜一个匹配不到的关键词看空态。

**特别验证故障隔离**：在 DevTools 里只拦截 `/api/conventions`，首页的「最新制品」和「最新动态」必须照常渲染。改造前这三个接口共用一个 `Promise.all`，一个挂全都空白。

### 5. 制品详情页的推荐位

库里放 6 个以上制品，反复刷新详情页，**当前正在看的制品不能出现在自己的「其他社团制品推荐」里**。

### 6. 九个页面各做一次缩放扫描

从 1600px 拖到 360px，注意只在某个区间出问题的情况。重点看 1024↔1023、992↔980（首页两个网格和招募按钮的行为在 992–1023px 区间有变化），以及 768 / 640 这两个边界值。

### 7. 首页的浮动「加入我们」按钮

翻转规则最多的一处（7 个属性，含 `writing-mode` 和 `transform`）。桌面：竖排文字，钉在右侧中部；移动：横排，右下角。

### 8. 其余

- `EventDetail` 动态区四种嵌入块都渲染，product-embed 的卡片要填上内容而不是停留在空壳
- `EventList` 快速输入时每次停顿只发一个请求，结果不闪回旧数据
- 导航栏「企划」下拉有内容，768px 以下抽屉能打开；拦掉 `/api/projects` 后应降级为「暂无项目」而非页面崩坏
- 等宽字体位置（首页副标题、时间线日期、联系方式）现在是 Roboto Mono 而非 Courier New

---

## 后续工单（本轮明确不做）

来自 spec 第 5 节的既定决策，以及执行期判定为 Minor 的发现。

**性能与体积**
- `csd_20_title.png` 17.5MB、`宣传图12` 5.7MB、`csd20_theme.mp3` 8.5MB 全部打进 `dist/`；主 JS 633KB 未做代码分割
- Google Fonts 在国内不稳定，需要自托管字体文件
- `SiteHeader` 与 `ProjectsBar` 仍各发一次 `GET /projects`；`ProductList` 仍发两次 `GET /products`（列表 + 分类源）。共享的是代码，不是请求
- `ProductList` 的分类去重仍是拉全量到前端 `Set`

**数据模型**
- `project` 内容类型缺 `slug` 字段，所以项目页仍是硬编码路由，没有 `/projects/:slug`
- `csd20.vue` 仍按标题字符串匹配制品，后台改一个字页面就空

**代码整洁**
- `useStrapiOne` 不接受 `options`，硬编码 `immediate: true`
- `AsyncBoundary` 的 `loadingText` 仅在 `skeleton="none"` 时可达，prop 默认值与实际行为不一致
- 防抖版 `refresh()` 被取代时其 promise 永不 settle（当前无人 await）
- params watcher 的 `deep: true` 对每次新建对象的 getter 无收益
- `ContentRenderer.vue` 已成孤儿组件（零导入者）；`RecruitmentView` 的 `.tracks`/`.track`、`main.css` 的 `.tech-box.light` 均为死代码
- `ProductList` 仍用原生 `<input>` 搜索框，而 `EventList` 已换成 `n-input`
- `ProductList` 的 300ms 防抖套在整个参数上，点分类和排序也要等

---

## 执行中暴露的计划缺陷（供日后写计划时参考）

这轮计划本身出了 8 处错，全部在执行中被发现并修复。值得记下来的是它们的**共性**：

1. 断言 `card-base` shortcut 无人引用 → 实际两个卡片组件都在用
2. Task 10 伪代码写单数 `product` → 真实 schema 是复数 `products`（oneToMany）
3. `themeOverrides.Timeline` 键名错误（`titleFontSize` 应为 `titleFontSizeMedium`），配置从未生效
4. Task 18 的 CSS 片段丢失四处 alpha 通道，会让错误态发蓝光
5. 遗漏 `SiteFooter.vue`，其 `var(--color-primary)` 从未被定义
6. 颜色迁移只覆盖 `<style>` 块，遗漏模板内联 `style=""` 属性
7. 断点翻转把「与继承值重复的声明」当成差异项，凭空造出 `lg:text-left`
8. **（Critical）** 断言「删掉 shortcut 后 `main.css` 会接管」——实际一直是 shortcut 在渲染，且删掉后是 `presetUno` 的内建 `container` 规则顶上来

**共性：全部是「从源码推断运行时行为」而没有验证输出。** 第 8 条尤其典型——`uno.config.js` 和 `main.css` 两份源码怎么读都看不出谁赢，答案只存在于构建产物里。

对应的防御手段也已落地：`tokens.spec.js` 里那条守卫从「断言不存在同名 shortcut」（结构性，bug 上线时它是绿的）改成了「调用 UnoCSS 生成器，断言这四个类名产不出 CSS」（行为性）。复审验证过：把配置回退到修复前，这条测试会红。
