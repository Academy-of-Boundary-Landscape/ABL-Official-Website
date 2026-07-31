# 前端升级任务清单 - Naive UI + UnoCSS

> **2026-07-31 重写说明**：本文件此前的多项条目已被
> `docs/superpowers/plans/2026-07-31-frontend-foundation-consolidation.md`
> （及其 `.superpowers/sdd/2026-07-31-frontend-foundation-consolidation/` 下的执行记录）
> 中的改造消解或明确决定不做，详见各条目旁注。剩余的未完成条目已按「目标」而非
> 「手段」重述——不再规定必须用哪个 Naive UI 组件，只描述用户能感知到的缺口，
> 具体怎么实现留给后续任务决定。

## 📋 项目概述

将前端项目从 Element Plus + 自定义 CSS 迁移到 Naive UI + UnoCSS，提升美观度和可维护性。

---

## 🎯 阶段一：基础设施优化 ✅ 已完成

### 1.1 移除 Element Plus ✅

- [x] 卸载 `element-plus` 和 `@element-plus/icons-vue` 依赖（package.json 已无 element 相关依赖）
- [x] 从 `main.js` 中移除 Element Plus 相关代码
- [x] 从 `package.json` 中清理依赖

### 1.2 优化 UnoCSS 配置 ✅

- [x] 在 `uno.config.js` 中添加主题颜色配置（primary/background/box 等，现由 `colorTokens.js` 单一源派生）
- [x] 添加自定义快捷方式（`card-base` 仍在用，原样迁移到 `main.css`；`tech-box`/`container` 明确决定保留 `main.css` 实现，见下方 4.1）
- [x] 配置响应式断点（xs~2xl，已在 2026-07-31 改造中用于替换全部手写 `@media`）
- [x] 启用 transformerDirectives

### 1.3 建立 Naive UI 主题系统 ✅

- [x] 创建 `src/config/theme.js` 主题配置文件
- [x] 定义全局主题变量（`src/config/colorTokens.js` 为唯一颜色源，派生 CSS 变量与 Uno `theme.colors`，由 4 条守卫测试保证三者不漂移）
- [x] 在 App.vue 中应用主题配置（`n-config-provider`）

---

## 🎨 阶段二：核心组件迁移 ✅ 基本完成

### 2.1 导航组件（SiteHeader.vue）✅

- [x] 使用 `n-layout-header` 替换自定义 header
- [x] 使用 `n-menu` 替换自定义导航菜单
- [ ] 项目下拉菜单目前用 `n-menu` 的子菜单实现，未用 `n-dropdown`——是否值得换，视觉差异不大，暂不安排
- [x] 使用 `n-drawer` 改进移动端菜单（`n-drawer` + `n-drawer-content`）
- [x] 优化 Logo 和标题布局

### 2.2 卡片组件 ✅

#### EventCard.vue

- [x] 使用 `n-card` 重构卡片结构
- [x] 使用 `n-tag` 显示分类标签
- [x] 使用 UnoCSS 实现悬停效果
- [x] 优化图片展示

#### ProductCard.vue

- [x] 使用 `n-card` 重构卡片结构
- [x] 使用 `n-tag` 显示分类标签
- [x] 优化图片加载和占位符
- [x] 统一卡片样式

### 2.3 页脚组件（SiteFooter.vue）✅

- [x] 使用 `n-layout-footer` 替换自定义 footer
- [x] 使用 `n-space` 优化布局
- [x] 使用 `n-button` 优化链接样式

### 2.4 其他组件

#### CategoryFilter.vue ✅

- [x] 使用 `n-select` 替换自定义筛选器（未用 `n-radio-group`，`n-select` 已满足需求，不再列为待办）

#### ProjectsBar.vue（部分完成）

- [ ] 项目展示目前用 `n-carousel` 轮播，未用 `n-grid` 平铺——两种是不同的展示形态而非未完成度问题，是否切换取决于产品决策，暂不安排
- [x] 使用 `n-card` 统一项目卡片

---

## 📄 阶段三：页面视图迁移

> 现状（2026-07-31 更新）：全部九个页面已统一接入 `useProducts` / `useEvents` /
> `useConventions` / `useProjects` 数据层与 `AsyncBoundary` 加载/错误/空态封装
> （见 `src/composables/`、`src/components/AsyncBoundary.vue`）。
> 是否引入更多 Naive UI 组件（`n-breadcrumb`、`n-pagination`、`n-image` 等）
> 是独立于数据层迁移的展示层决策，按下面各页面的具体缺口分别列出。

### 3.1 首页（HomeView.vue）

- [x] 数据获取与加载/错误/空态已统一（`useProducts`/`useEvents`/`useConventions` + `AsyncBoundary`）
- [x] 响应式布局已改为 UnoCSS 移动优先断点（2026-07-31，原手写 `@media` 已全部替换）

### 3.2 动态相关页面

#### EventList.vue

- [ ] 事件数量超过一屏时需要分页或加载更多——当前全量渲染，列表很长时需要处理
- [x] 加载状态已统一（`AsyncBoundary`）

#### EventDetail.vue

- [ ] 详情页需要一条返回列表的导航路径（当前只有页面内一个「返回」链接，无面包屑/多级路径提示）
- [ ] 图片展示可以支持点击放大预览——当前是普通 `<img>`，无预览交互

### 3.3 制品相关页面

#### ProductList.vue

- [ ] 制品数量超过一屏时需要分页——当前全量渲染
- [x] 筛选器已用 `n-select`（`CategoryFilter.vue`）

#### ProductDetail.vue

- [ ] 详情页需要一条返回列表的导航路径（同 EventDetail）
- [ ] 多图展示可以支持画廊/预览——当前仅单张封面图

### 3.4 其他页面

#### RecruitmentView.vue

- [ ] 招募信息条目较多时的可读性可以优化（当前是纯 CSS 卡片列表，功能上无缺失）

#### zyzView.vue

- [x] 已随数据层迁移完成基本对齐（Task 15）

#### csd20.vue & csd20music.vue

- [ ] 多媒体（图册/音乐）展示可以做得更精致——当前是原生 `<img>`/`<audio>`，功能完整但无画廊/播放器组件

---

## 🎭 阶段四：样式系统重构

### 4.1 全局样式优化

- [x] ~~保留必要的 CSS 变量~~ → 已由 `colorTokens.js` 单一源 + 4 条守卫测试完成，不再是待办
- [x] ~~将 `.tech-box` 转换为 UnoCSS shortcut~~ → **已决定不做**：`.tech-box` 的 clip-path 角标、多层 hover 辉光等效果在 `main.css` 里比拆成 Uno shortcut 更易读，保留现有实现（见 spec 2.4 节）
- [x] ~~将 `.container` 转换为 UnoCSS 工具类~~ → **已决定不做**，理由同上
- [x] ~~优化响应式断点~~ → 已完成（2026-07-31，全部手写 `@media (max-width: …)` 改为 UnoCSS 移动优先 `sm:`/`md:`/`lg:` 前缀或 `@screen` 指令）

### 4.2 清理冗余样式

- [x] `.main-title`（`base.css`，零使用）、`.product-list-view.container`（仅 1 处使用，已搬回 `ProductList.vue` 的 scoped 样式）等死代码已清理（2026-07-31）
- [x] `purchaseLinks` 通贩地址模块（`ProductDetail.vue`，Strapi schema 中从未定义、从未渲染过）已整体删除
- [ ] 是否还有其他未使用的 CSS 类，未做过全量扫描，欢迎随手清理

### 4.3 统一设计令牌

- [x] ~~定义统一的颜色系统~~ → 已完成，`colorTokens.js` 为唯一源，`base.css` 生成块 / `uno.config.js` colors / `theme.js` themeOverrides 三处均从它派生，4 条守卫测试防止再次漂移
- [ ] 间距系统目前依赖 UnoCSS 默认比例尺（0.25rem 步进），未做站点专属定义——是否需要，视觉上暂无问题
- [ ] 圆角和阴影仍分散在各组件 scoped CSS 里手写，未抽取为令牌
- [x] 字体规范已统一：正文/等宽两类字体通过 `--font-family-body`/`--font-family-heading`/`--font-family-mono` 三个 token 引用，站内不再有裸写的 `monospace`/`Courier New`

---

## ✨ 阶段五：功能增强

### 5.1 加载与状态优化

- [x] ~~使用 `n-spin` 统一所有加载状态~~ → 已由 `AsyncBoundary` 统一覆盖全部九个页面
- [x] ~~使用 `n-empty` 优化空数据状态~~ → 已实现后又改回终端风纯文本（`>>` 前缀），理由：`n-empty` 的居中图标观感是通用后台管理系统风格，与本站终端调性不符（2026-07-31 用户裁定）
- [x] ~~添加骨架屏（`n-skeleton`）~~ → 已由 `AsyncBoundary` 的 `skeleton` prop（`list`/`text`/`none`）统一覆盖

### 5.2 图片优化

- [ ] 图片懒加载——当前无懒加载，页面图片较多时可能影响首屏
- [ ] 图片预览功能——见上方 3.2/3.3 中详情页的画廊需求
- [ ] 占位符已有基础实现（`ProductCard`/`EventCard` 的 `image-placeholder`），细节可以再打磨

### 5.3 交互优化

- [ ] 页面切换过渡动画已有基础实现（`App.vue` 的 `<transition name="fade">`），组件级过渡（列表增删等）还没有
- [ ] 全局提示（表单提交成功/失败等）目前没有统一机制——按需再加，避免过度设计
- [ ] 表单验证反馈——当前站内唯一的输入是搜索框（无需验证）和邮件申请（走 `mailto:`，不涉及表单提交），暂无实际需求

### 5.4 无障碍优化

- [ ] 键盘导航、ARIA 标签、屏幕阅读器支持均未做专项检查——不是本轮改造范围，需要单独立项

---

## 🧪 阶段六：测试与优化

### 6.1 功能测试

- [x] 数据层（`useStrapiResource` 及各资源封装）已有 55 条单测覆盖参数拼装、防抖、取消、生命周期等逻辑
- [x] 4 条配置守卫测试覆盖颜色令牌单一源不漂移
- [ ] 路由跳转、页面级渲染仍无自动化测试——按全局约束本轮不引入 jsdom/组件测试，需要专项评估测试策略
- [ ] API 数据获取的集成测试（对接真实/mock Strapi）尚未建立

### 6.2 浏览器兼容性测试

- [ ] Chrome / Firefox / Safari / Edge 桌面端测试
- [ ] 移动端浏览器测试——2026-07-31 断点改造后本应在 375px/768px/1440px 三个宽度下走查九个页面，但执行环境无浏览器，只完成了构建产物的编译期校验，仍欠一次真实的窄屏视觉走查

### 6.3 性能优化

- [ ] 检查包体积变化——`npm run build` 已提示单个 chunk 超过 500KB（含图片/音频资源），可考虑代码分割
- [ ] 优化首屏加载时间
- [ ] 图片资源体积较大（多张 PNG 超过 1MB），可考虑压缩或懒加载
- [ ] 启用代码分割——当前路由是全部静态 import（见 `src/router/index.js`），未用 `() => import(...)` 懒加载

### 6.4 文档更新

- [ ] 更新 README.md
- [ ] 编写组件使用文档
- [x] 迁移过程中的重要决策已记录在 `docs/superpowers/plans/2026-07-31-frontend-foundation-consolidation.md`
      及 `.superpowers/sdd/2026-07-31-frontend-foundation-consolidation/` 下的各批次报告中

---

## 📊 进度追踪（2026-07-31 按代码实际情况核对）

- **阶段一（基础设施）**: ✅ 完成
- **阶段二（核心组件迁移）**: ✅ 基本完成（ProjectsBar 用轮播代替 grid、项目菜单用 `n-menu` 子菜单代替 `n-dropdown`，均为形态选择而非未完成）
- **阶段三（页面视图迁移）**: ✅ 数据层与加载/错误/空态已统一；⚠️ 分页、面包屑、图片画廊等展示层增强仍待做
- **阶段四（样式系统重构）**: ✅ 颜色令牌单一源 + 断点移动优先化已完成；`.tech-box`/`.container` 明确决定不转 Uno shortcut；圆角/阴影/间距令牌化仍未做
- **阶段五（功能增强）**: ✅ 加载/空态已由 `AsyncBoundary` 统一；⬜ 图片懒加载/预览、全局提示、无障碍优化均未开始
- **阶段六（测试与优化）**: 🔶 数据层与令牌单测已建立；⬜ 组件/集成/浏览器兼容性测试、性能优化、文档更新未开始

---

## 📝 备注

1. **迁移原则**: 优先使用 Naive UI 组件，不满足需求时再使用 UnoCSS
2. **渐进式迁移**: 一次迁移一个组件，确保功能正常后再继续
3. **向后兼容**: 保持 API 接口不变，只重构前端展示层
4. **测试优先**: 每完成一个阶段进行全面测试
5. **本轮改造记录**: 2026-07-31 的颜色单一源、数据层、AsyncBoundary、断点移动优先化改造的完整过程、决策理由与验证记录见
   `docs/superpowers/plans/2026-07-31-frontend-foundation-consolidation.md` 及同目录 `.superpowers/sdd/` 下的批次报告

---

## 🔗 相关文档

- [Naive UI 官方文档](https://www.naiveui.com/)
- [UnoCSS 官方文档](https://unocss.dev/)
- [Strapi API 文档](./simpler_documentation.md)
- [2026-07-31 前端基座整合计划](./docs/superpowers/plans/2026-07-31-frontend-foundation-consolidation.md)
