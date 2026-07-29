# 前端升级任务清单 - Naive UI + UnoCSS

## 📋 项目概述

将前端项目从 Element Plus + 自定义 CSS 迁移到 Naive UI + UnoCSS，提升美观度和可维护性。

---

## 🎯 阶段一：基础设施优化 ✅ 已完成

### 1.1 移除 Element Plus ✅

- [x] 卸载 `element-plus` 和 `@element-plus/icons-vue` 依赖（package.json 已无 element 相关依赖）
- [x] 从 `main.js` 中移除 Element Plus 相关代码
- [x] 从 `package.json` 中清理依赖

### 1.2 优化 UnoCSS 配置 ✅

- [x] 在 `uno.config.js` 中添加主题颜色配置（primary/background/box 等）
- [x] 添加自定义快捷方式（shortcuts：tech-box / card-base / container 等）
- [x] 配置响应式断点（xs~2xl）
- [x] 启用 transformerDirectives

### 1.3 建立 Naive UI 主题系统 ✅

- [x] 创建 `src/config/theme.js` 主题配置文件
- [x] 定义全局主题变量（另有 `src/config/colorTokens.js` 注入 CSS 变量）
- [x] 在 App.vue 中应用主题配置（`n-config-provider`）

---

## 🎨 阶段二：核心组件迁移 ✅ 基本完成

### 2.1 导航组件（SiteHeader.vue）✅

- [x] 使用 `n-layout-header` 替换自定义 header
- [x] 使用 `n-menu` 替换自定义导航菜单
- [ ] 使用 `n-dropdown` 实现项目下拉菜单（当前用 `n-menu` 的子菜单实现）
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

- [x] 使用 `n-select` 替换自定义筛选器
- [ ] 使用 `n-radio-group` 优化分类选择（改用了 `n-select`，未用 radio-group）

#### ProjectsBar.vue（部分完成）

- [ ] 使用 `n-grid` 优化项目展示（当前用 `n-carousel` 轮播实现）
- [x] 使用 `n-card` 统一项目卡片

---

## 📄 阶段三：页面视图迁移 ⚠️ 大部分未完成

> 现状：仅 `HomeView.vue` 用到了 Naive UI（`n-timeline` / `n-divider`）。
> `EventList` / `EventDetail` / `ProductList` / `ProductDetail` / `RecruitmentView` /
> `zyzView` / `csd20*` 等页面**尚未**引入 Naive UI 组件，仍为原生 HTML/CSS。

### 3.1 首页（HomeView.vue）（部分完成）

- [ ] 使用 `n-grid` 优化整体布局（当前用 `n-timeline` 组织内容，未用 grid）
- [ ] 使用 `n-spin` 优化加载状态
- [ ] 使用 `n-space` 替换自定义间距
- [ ] 优化响应式布局

### 3.2 动态相关页面

#### EventList.vue

- [ ] 使用 `n-grid` 展示事件列表
- [ ] 使用 `n-pagination` 实现分页
- [ ] 使用 `n-spin` 优化加载状态

#### EventDetail.vue

- [ ] 使用 `n-breadcrumb` 添加面包屑导航
- [ ] 使用 `n-image` 优化图片展示
- [ ] 使用 `n-card` 组织内容区块

### 3.3 制品相关页面

#### ProductList.vue

- [ ] 使用 `n-grid` 展示制品列表
- [ ] 使用 `n-pagination` 实现分页
- [ ] 优化筛选器组件

#### ProductDetail.vue

- [ ] 使用 `n-breadcrumb` 添加面包屑导航
- [ ] 使用 `n-image-gallery` 展示多图
- [ ] 使用 `n-descriptions` 展示详细信息

### 3.4 其他页面

#### RecruitmentView.vue

- [ ] 使用 `n-card` 组织招募信息
- [ ] 使用 `n-list` 优化列表展示

#### zyzView.vue

- [ ] 使用 Naive UI 组件重构
- [ ] 优化布局和样式

#### csd20.vue & csd20music.vue

- [ ] 使用 `n-card` 组织内容
- [ ] 使用 `n-image` 展示图片
- [ ] 优化多媒体展示

---

## 🎭 阶段四：样式系统重构

### 4.1 全局样式优化

- [ ] 保留必要的 CSS 变量（在 `base.css` 中）
- [ ] 将 `.tech-box` 转换为 UnoCSS shortcut
- [ ] 将 `.container` 转换为 UnoCSS 工具类
- [ ] 优化响应式断点

### 4.2 清理冗余样式

- [ ] 移除已迁移到 UnoCSS 的自定义样式
- [ ] 清理未使用的 CSS 类
- [ ] 优化 `main.css` 文件结构

### 4.3 统一设计令牌

- [ ] 定义统一的颜色系统
- [ ] 定义统一的间距系统
- [ ] 定义统一的圆角和阴影
- [ ] 定义统一的字体规范

---

## ✨ 阶段五：功能增强

### 5.1 加载与状态优化

- [ ] 使用 `n-spin` 统一所有加载状态
- [ ] 使用 `n-empty` 优化空数据状态
- [ ] 添加骨架屏（`n-skeleton`）

### 5.2 图片优化

- [ ] 使用 `n-image` 支持懒加载
- [ ] 使用 `n-image` 支持预览功能
- [ ] 优化占位符显示

### 5.3 交互优化

- [ ] 统一使用 Naive UI 的过渡动画
- [ ] 添加 `n-message` 全局提示
- [ ] 添加 `n-notification` 通知功能
- [ ] 优化表单验证反馈

### 5.4 无障碍优化

- [ ] 确保所有组件支持键盘导航
- [ ] 添加 ARIA 标签
- [ ] 优化屏幕阅读器支持

---

## 🧪 阶段六：测试与优化

### 6.1 功能测试

- [ ] 测试所有页面功能正常
- [ ] 测试路由跳转
- [ ] 测试 API 数据获取
- [ ] 测试响应式布局

### 6.2 浏览器兼容性测试

- [ ] Chrome 测试
- [ ] Firefox 测试
- [ ] Safari 测试
- [ ] Edge 测试
- [ ] 移动端浏览器测试

### 6.3 性能优化

- [ ] 检查包体积变化
- [ ] 优化首屏加载时间
- [ ] 优化图片资源
- [ ] 启用代码分割

### 6.4 文档更新

- [ ] 更新 README.md
- [ ] 编写组件使用文档
- [ ] 记录迁移过程中的重要决策

---

## 📊 进度追踪（2026-07-29 按代码实际情况核对）

- **阶段一（基础设施）**: ✅ 完成
- **阶段二（核心组件迁移）**: ✅ 基本完成（ProjectsBar 用轮播代替 grid，个别 dropdown/radio 用了替代方案）
- **阶段三（页面视图迁移）**: ⚠️ 仅 HomeView 部分完成，其余列表/详情页未迁移
- **阶段四（样式系统重构）**: 🔶 部分完成（UnoCSS shortcut/设计令牌已建立，冗余 CSS 清理未系统进行）
- **阶段五（功能增强）**: ⬜ 基本未开始（n-spin/n-empty/n-skeleton/n-image/n-message 全项目 0 处使用）
- **阶段六（测试与优化）**: ⬜ 未开始

**总体进度**: 约 40%（基础设施与核心组件已迁移，页面级视图与增强功能待做）

---

## 📝 备注

1. **迁移原则**: 优先使用 Naive UI 组件，不满足需求时再使用 UnoCSS
2. **渐进式迁移**: 一次迁移一个组件，确保功能正常后再继续
3. **向后兼容**: 保持 API 接口不变，只重构前端展示层
4. **测试优先**: 每完成一个阶段进行全面测试

---

## 🔗 相关文档

- [Naive UI 官方文档](https://www.naiveui.com/)
- [UnoCSS 官方文档](https://unocss.dev/)
- [Strapi API 文档](./simpler_documentation.md)
