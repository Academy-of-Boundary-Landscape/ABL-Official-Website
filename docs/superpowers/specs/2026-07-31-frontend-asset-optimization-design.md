# 前端资源与首屏优化 · 设计文档

日期：2026-07-31
范围：`frontend/` 静态资源、字体加载、路由代码分割
状态：待实施
前序：[前端地基收敛设计](2026-07-31-frontend-upgrade-design.md) 第 5 节把这些明确推迟；本文档是解禁其中三项。

---

## 1. 现状证据

以下均为实测，非估计。

### 1.1 静态资源

| 文件 | 像素尺寸 | 体积 | 实际显示尺寸 |
|---|---|---|---|
| `csd20related/csd_20_title.png` | 2480 × 3508 | 17 MB | 画册封面，页内约 450px 宽，点击后模态框 `max-width: 90vw` |
| `csd20related/csd20_theme.mp3` | — | 8.2 MB | 320 kbps |
| `csd20related/宣传图12.png` | 2150 × 1518 | 5.5 MB | 缩略图约 32% 宽 |
| `csd20related/宣传图10.png` | 2150 × 1518 | 3.2 MB | 同上 |
| `hourai_poster.png` | 1192 × 974 | 2.0 MB | **全项目零引用** |
| `zyz_title.png` | 1173 × 941 | 1.9 MB | zyzView 内嵌图 |
| `calabi-yau.png` | 2850 × 2832 | 984 KB | `body::before` 背景，CSS 限死 `min(92vw, 1280px)` |
| `abl_logo.png` | 2520 × 2231 | 776 KB | 页头 logo，高 3rem（48px）/ 5.1rem（82px） |
| `zyz_screenshot.png` | 653 × 480 | 560 KB | zyzView 内嵌图 |

合计约 40 MB。全部带 alpha 通道。

`csd_20_title.png` 的 2480 × 3508 正好是 A4 @ 300 dpi——这是印刷母版。`abl_logo.png` 以 2520px 宽渲染成 82px 高，线性方向超出 27 倍。

### 1.2 成本分布（此前被误述，此处更正）

Vite 把图片作为独立文件输出，浏览器按需请求，因此 40 MB 并非每次访问都下载。真实分布：

- **每个页面都要下载**：`calabi-yau.png`（984 KB）+ `abl_logo.png`（776 KB）+ `index.js`（656 KB）≈ **2.4 MB**
- **仅 `/project/csd20` 下载**：其余约 26 MB

按「每次访问都付」衡量，logo 与背景图的优先级高于那张 17 MB 的封面。

### 1.3 字体

`index.html` 通过 Google Fonts `<link>` 加载 Orbitron（500、600）、Space Grotesk（400、500、600）、Roboto Mono（400），另有两条 `preconnect`。国内访问不稳定，失败时回落到系统字体。

### 1.4 代码分割

`router/index.js` 全部静态导入，产物只有一个 `index.js`（656 KB）。`bytemd` / `marked`（仅 `EventDetail` 使用）与 `swiper`（仅 `ProjectsBar` 使用）都被打进首屏包。

---

## 2. 已确认的决策

| 议题 | 决定 |
|---|---|
| 本批范围 | 图片、字体、路由代码分割三项；**音频不动** |
| 音频 | 保持 320 kbps。音乐社团的作品，音质优先于体积 |
| 大图质量基准 | 长边 1600 px，印刷母版不进打包 |
| 转换时机 | 一次性转好并提交产物，不引入构建期插件 |
| 字体策略 | 与现状 1:1 自托管，不趁机增删字重 |
| 代码分割 | 路由级懒加载，不做 `manualChunks` |

---

## 3. 设计

### 3.1 图片

目标尺寸按各自的实际显示需求确定，不统一裁到同一尺寸。

| 文件 | 目标 | 依据 | 预计体积 |
|---|---|---|---|
| `abl_logo.png` | 200 px 宽 WebP | 显示 48–82 px 高，200 px 覆盖 2x 屏 | ~15 KB |
| `calabi-yau.png` | 1280 px 宽 WebP | CSS 写死 `min(92vw, 1280px)` | ~120 KB |
| `csd_20_title.png` | 长边 1600 px WebP | 大图质量基准 | ~1.1 MB |
| `宣传图12.png` / `宣传图10.png` | 长边 1600 px WebP | 同上 | 各 ~400 KB |
| `zyz_title.png` | 1200 px 宽 WebP | 已接近显示尺寸，收益主要来自换格式 | ~250 KB |
| `zyz_screenshot.png` | 保持 653 px，转 WebP | 尺寸本就合理 | ~80 KB |
| `hourai_poster.png` | **删除** | 全项目零引用 | — |

预期结果：每页必付的图片从 1.72 MB（`calabi-yau` 984 KB + `abl_logo` 776 KB）降至约 135 KB；`/project/csd20` 从约 26 MB 降至约 2 MB。

**只输出 WebP，不做 `<picture>` 回退。** 所有现代浏览器均支持 WebP；加回退需要双份文件与模板改造，收益不匹配成本。

**印刷母版移至 `frontend/assets-src/`**，不被 Vite 打包，但仍在 git 中。注意：这些文件早已存在于 git 历史，移动或删除不会缩小仓库克隆体积——此举的收益只在构建产物。

转换用 ImageMagick 一次性完成并提交产物。同时提交 `frontend/scripts/optimize-images.sh` 记录所用参数，供日后新增图片时参照。该脚本不接入构建流程。

### 3.2 自托管字体

`frontend/public/fonts/` 存放六个 woff2 文件（Orbitron 500/600、Space Grotesk 400/500/600、Roboto Mono 400），仅 latin 子集，合计约 120 KB。

`src/assets/base.css` 中声明对应的 `@font-face`，统一加 `font-display: swap`。删除 `index.html` 中的 Google Fonts `<link>` 与两条 `preconnect`。

字族与字重与现状**逐一对应**，不增不减——本批的前提仍是观感不变。副作用是国内访问不再依赖 Google Fonts 可达性，并省去两次跨域握手。

### 3.3 路由懒加载

`src/router/index.js` 中的静态 `import` 全部改为 `() => import(...)` 形式。九个页面各成一个 chunk；`bytemd` / `marked` 随 `EventDetail` 的 chunk 走，`swiper` 随使用它的组件走。

不做 `manualChunks`：块边界需要反复调试，调不好会产生重复代码，而当前首屏收益主要来自把详情页依赖移出主包，路由分割已能达成。

---

## 4. 验收

全部可测量，不依赖肉眼：

- 构建产物中 `index.js` 体积显著下降，且出现多个路由 chunk
- 每页首屏资源总量（当前约 2.4 MB）
- 66 个既有测试保持通过、`npm run build` 与 `npm run lint` 通过
- 实施报告须附改前 / 改后的 `dist/` 体积对照表

**需要人工确认的只有一项**：转换后图片是否存在可见画质损失，尤其 csd20 的三张作品图。执行环境无浏览器，此项无法自动化。

---

## 5. 明确不做

- **音频降码率**——用户决定保持 320 kbps
- **`<picture>` 多格式回退**——见 3.1
- **`manualChunks` 手动分包**——见 3.3
- **构建期图片处理插件**——这些图几乎不变，自动化价值不足以抵消新依赖与构建耗时
- **图片迁入 Strapi 媒体库**——csd20 是硬编码单页，改读 CMS 是另一件事
- **字重瘦身**——省不了多少，却要冒观感变化风险
- 前序 spec 第 5 节中的其余条目（`project` 缺 slug、`csd20` 标题硬匹配、`ProductList` 全量去重等）仍然维持推迟
