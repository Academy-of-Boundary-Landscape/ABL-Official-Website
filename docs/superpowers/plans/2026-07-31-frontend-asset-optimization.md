# 前端资源与首屏优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把印刷分辨率的静态资源缩到显示尺寸并转 WebP、把 Google Fonts 改为自托管、把路由改为懒加载，在不改变观感的前提下大幅降低首屏与页面资源量。

**Architecture:** 三件互不依赖的事。图片一次性用 ImageMagick 转换并提交产物，印刷母版移出打包目录；字体下载到 `public/fonts/` 并在 `base.css` 声明 `@font-face`；路由把静态 `import` 改为动态 `import()`。全部改动可用构建产物体积客观验收。

**Tech Stack:** Vue 3 + Vite 7 + UnoCSS + ImageMagick 6（系统已装，支持 WebP/AVIF）

**依据 spec:** `docs/superpowers/specs/2026-07-31-frontend-asset-optimization-design.md`

## Global Constraints

- 所有命令在 `frontend/` 目录下执行，除非另有说明。
- **不改变观感。** 图片缩放到显示尺寸不算改观感；改变构图、裁剪、配色算。
- **音频不动。** `csd20_theme.mp3` 保持 320 kbps 原样。
- 只输出 WebP，不做 `<picture>` 多格式回退。
- 字族与字重与现状 1:1 对应，不增不减。
- 不引入构建期图片处理插件，不做 `manualChunks`。
- 66 个既有测试必须保持通过；`npm run build` 与 `npm run lint` 必须通过。
- 每个 Task 一个 commit，仓库风格：`type: :emoji: 中文描述`。
- `src/assets/base.css` 的 `:root` 颜色块是机器生成的，本计划不涉及它——若因故需要改 `colorTokens.js`，必须跑 `npm run tokens:sync`。

---

## 文件结构

**新建：**

| 文件 | 职责 |
|---|---|
| `frontend/scripts/optimize-images.sh` | 记录本次转换所用的确切参数，供日后新增图片参照。不接入构建流程 |
| `frontend/assets-src/` | 存放印刷母版，不被 Vite 打包 |
| `frontend/public/fonts/*.woff2` | 六个自托管字体文件 |

**修改：**

| 文件 | 改动 |
|---|---|
| `frontend/src/assets/images/**` | PNG 换成 WebP，母版移走，删除 `hourai_poster.png` |
| `frontend/src/assets/base.css` | 背景图引用改 WebP；新增 6 条 `@font-face` |
| `frontend/index.html` | 删除 Google Fonts `<link>` 与两条 `preconnect` |
| `frontend/src/components/SiteHeader.vue:6` | logo 引用改 WebP |
| `frontend/src/views/zyzView.vue:12-13` | 两张图引用改 WebP |
| `frontend/src/views/projects/csd20.vue:228-230` | 三张图引用改 WebP |
| `frontend/src/router/index.js` | 9 个静态 import 改为动态 import |

---

## Task 1: 图片缩尺寸转 WebP，母版移出打包目录

本 Task 的转换参数已实测验证，下表的「转换后」是真实输出体积，不是估算。

**Files:**
- Create: `frontend/scripts/optimize-images.sh`
- Create: `frontend/assets-src/`（目录）
- Modify: `frontend/src/assets/images/` 下 8 个文件（7 个转成 WebP 后母版移走，`hourai_poster.png` 直接删除）
- Modify: `frontend/src/assets/base.css:98`
- Modify: `frontend/src/components/SiteHeader.vue:6`
- Modify: `frontend/src/views/zyzView.vue:12,13`
- Modify: `frontend/src/views/projects/csd20.vue:228,229,230`

**Interfaces:**
- Produces: 六个 `.webp` 文件，路径与原 PNG 同目录同名；后续 Task 不依赖本 Task

- [ ] **Step 1: 确认 `hourai_poster.png` 仍然零引用**

Run: `cd frontend && grep -rn "hourai" src/ public/ index.html`
Expected: 无输出。

若有输出，说明状况已变，**跳过删除它**，并在报告中说明。

- [ ] **Step 2: 先把母版移到 `assets-src/`，再删死图**

顺序很重要：先移动，转换脚本才能有稳定的「源目录 → 目标目录」，日后可重复运行。

```bash
cd frontend
mkdir -p assets-src/csd20related
git mv src/assets/images/abl_logo.png                   assets-src/
git mv src/assets/images/calabi-yau.png                 assets-src/
git mv src/assets/images/zyz_title.png                  assets-src/
git mv src/assets/images/zyz_screenshot.png             assets-src/
git mv src/assets/images/csd20related/csd_20_title.png  assets-src/csd20related/
git mv src/assets/images/csd20related/宣传图12.png       assets-src/csd20related/
git mv src/assets/images/csd20related/宣传图10.png       assets-src/csd20related/
git rm src/assets/images/hourai_poster.png
```

`assets-src/README.md`：

```markdown
# 印刷／母版分辨率原图

这里的文件**不被 Vite 打包**，只作为源文件保存。

网页用的版本在 `src/assets/images/`，由 `scripts/optimize-images.sh` 从这里生成。
新增图片时把母版放进来，并在脚本中加一行。

注意：这些文件早已存在于 git 历史中，移到这里不会缩小仓库克隆体积——
此举的收益只在构建产物。
```

- [ ] **Step 3: 写转换脚本**

`frontend/scripts/optimize-images.sh`：

```bash
#!/usr/bin/env bash
# 从 assets-src/ 的母版生成 src/assets/images/ 下的网页版本。
# 一次性工具，不接入构建流程——这些图几乎不变，自动化价值不足以抵消
# 新依赖与构建耗时。改图或加图时手动跑一次。
#
# 目标尺寸按各自的实际显示需求确定，不统一裁到同一尺寸：
#   abl_logo        页头显示 48-82px 高，200px 覆盖 2x 屏
#   calabi-yau      base.css 写死 background-size: min(92vw, 1280px)
#   csd20 三张      画册作品图，长边 1600px（点击后模态框 max-width: 90vw）
#   zyz_title       母版仅 1173px，'>' 修饰符使其保持原尺寸，收益来自换格式
#   zyz_screenshot  653px 本就合理，仅换格式
#
# 用法: cd frontend && bash scripts/optimize-images.sh
set -euo pipefail

SRC=assets-src
DST=src/assets/images
Q_ART=82      # 作品图与背景图
Q_UI=88       # logo 等 UI 元素，边缘锐利度更重要

conv() { # conv <相对路径(不含扩展名)> <resize 参数或 -> <质量>
  local rel=$1 geom=$2 q=$3
  local src="$SRC/$rel.png" dst="$DST/$rel.webp"
  mkdir -p "$(dirname "$dst")"
  if [ "$geom" = "-" ]; then
    convert "$src" -quality "$q" -define webp:method=6 "$dst"
  else
    convert "$src" -resize "$geom" -quality "$q" -define webp:method=6 "$dst"
  fi
  printf '%-32s %8s -> %8s  (%s)\n' "$rel" \
    "$(du -h "$src" | cut -f1)" "$(du -h "$dst" | cut -f1)" \
    "$(identify -format '%wx%h' "$dst")"
}

conv abl_logo                     '200x200>'   $Q_UI
conv calabi-yau                   '1280x1280>' $Q_ART
conv zyz_title                    '1200x1200>' $Q_ART
conv zyz_screenshot               '-'          85
conv csd20related/csd_20_title    '1600x1600>' $Q_ART
conv csd20related/宣传图12         '1600x1600>' $Q_ART
conv csd20related/宣传图10         '1600x1600>' $Q_ART
```

`'1600x1600>'` 中的 `>` 表示只在原图超出时才缩小。`zyz_title.png` 母版仅 1173px，因此该参数下它保持原尺寸——这是预期行为，不是漏改。

- [ ] **Step 4: 执行转换**

Run: `cd frontend && bash scripts/optimize-images.sh`

Expected（实测值，允许 ±10% 浮动）：

| 文件 | 原 | 转换后 | 输出尺寸 |
|---|---|---|---|
| `abl_logo.webp` | 776 KB | **12 KB** | 200 × 177 |
| `calabi-yau.webp` | 984 KB | **160 KB** | 1280 × 1272 |
| `zyz_title.webp` | 1.9 MB | **144 KB** | 1173 × 941 |
| `zyz_screenshot.webp` | 560 KB | **64 KB** | 653 × 480 |
| `csd_20_title.webp` | 17 MB | **392 KB** | 1131 × 1600 |
| `宣传图12.webp` | 5.5 MB | **244 KB** | 1600 × 1130 |
| `宣传图10.webp` | 3.2 MB | 约 150 KB | 1600 × 1130 |

若某个文件的实际体积比上表大一倍以上，停下来报告——可能是源图有异常（如嵌入了大量元数据或本身就是 JPEG 换皮）。

- [ ] **Step 5: 更新五处引用**

`src/assets/base.css:98`：
```css
  background-image: url('./images/calabi-yau.webp');
```

`src/components/SiteHeader.vue:6`：
```html
        <img src="@/assets/images/abl_logo.webp" alt="境界景观学会 Logo" />
```

`src/views/zyzView.vue:12-13`：
```html
      <img src="@/assets/images/zyz_title.webp" alt="游戏截图1" />
      <img src="@/assets/images/zyz_screenshot.webp" alt="游戏截图2" />
```

`src/views/projects/csd20.vue:228-230`：
```js
import coverImg from '@/assets/images/csd20related/csd_20_title.webp'
import previewImg1 from '@/assets/images/csd20related/宣传图12.webp'
import previewImg2 from '@/assets/images/csd20related/宣传图10.webp'
```

- [ ] **Step 6: 确认没有残留的 PNG 引用**

Run: `cd frontend && grep -rn "\.png" src/ index.html`
Expected: 无输出。

有输出则说明还有引用点没改，逐个处理。

- [ ] **Step 7: 验证**

```bash
cd frontend
npm run test          # 66/66
npm run build
npm run lint
```

Run: `cd frontend && du -sh dist/assets/ && ls -S dist/assets/ | head -5`
Expected: `dist/assets/` 总体积应从约 40 MB 降到约 10 MB（`csd20_theme.mp3` 的 8.2 MB 仍在其中，且按计划保留）。最大的文件应变成那个 mp3。

- [ ] **Step 8: 提交**

```bash
git add -A frontend
git commit -m "perf: :zap: 图片缩至显示尺寸并转 WebP，母版移出打包目录"
```

---

## Task 2: 自托管字体

**Files:**
- Create: `frontend/public/fonts/`（6 个 woff2）
- Modify: `frontend/src/assets/base.css`（新增 `@font-face`）
- Modify: `frontend/index.html`（删除 Google Fonts `<link>` 与 preconnect）

**Interfaces:**
- Consumes: `base.css` 中已有的 `--font-family-body` / `--font-family-heading` / `--font-family-mono` 三个变量，其取值不变
- Produces: 无对外接口

- [ ] **Step 1: 取得六个 woff2 的真实下载地址**

Google Fonts 的 CSS API 会按 User-Agent 返回不同格式；必须带现代浏览器 UA 才能拿到 woff2。

```bash
cd frontend
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
curl -s -H "User-Agent: $UA" \
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600&family=Space+Grotesk:wght@400;500;600&family=Roboto+Mono&display=swap"
```

输出中每个 `@font-face` 块都带 `/* latin */` 或 `/* latin-ext */` 之类的注释。**只取 `/* latin */` 那些**——本站的中文由系统字体承担，这三个字族本身也不含 CJK 字形。

预期得到 6 个 `.woff2` 链接：Orbitron 500/600、Space Grotesk 400/500/600、Roboto Mono 400。

**若某个字重的 latin 块缺失**，停下来报告，不要用 latin-ext 顶替。

- [ ] **Step 2: 下载**

```bash
cd frontend && mkdir -p public/fonts
# 用 Step 1 得到的实际 URL，按 <字族>-<字重>.woff2 命名，例如：
# curl -s -o public/fonts/orbitron-500.woff2 "https://fonts.gstatic.com/s/orbitron/..."
```

命名规则：`orbitron-500.woff2`、`orbitron-600.woff2`、`space-grotesk-400.woff2`、`space-grotesk-500.woff2`、`space-grotesk-600.woff2`、`roboto-mono-400.woff2`。

验证每个文件确实是字体而非错误页：

```bash
cd frontend && for f in public/fonts/*.woff2; do echo "$(file -b "$f" | head -c 40)  $f"; done
```
Expected: 每行都以 `Web Open Font Format (Version 2)` 开头。单个文件约 6–30 KB，六个合计约 120 KB。

- [ ] **Step 3: 在 base.css 声明 @font-face**

加在 `base.css` 顶部（`AUTO-GENERATED` 标记块**之前**，因为那个块是机器生成的，任何手写内容都不能落在它里面）：

```css
/* 自托管字体：不再依赖 Google Fonts 的可达性，并省去两次跨域握手。
   字族与字重与此前 <link> 加载的完全一致，未增删。
   仅 latin 子集——中文由系统字体承担，这三个字族本身不含 CJK 字形。 */
@font-face {
  font-family: 'Orbitron';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/orbitron-500.woff2') format('woff2');
}
@font-face {
  font-family: 'Orbitron';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/orbitron-600.woff2') format('woff2');
}
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/space-grotesk-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/space-grotesk-500.woff2') format('woff2');
}
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/space-grotesk-600.woff2') format('woff2');
}
@font-face {
  font-family: 'Roboto Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/roboto-mono-400.woff2') format('woff2');
}
```

路径用 `/fonts/...` 而非相对路径：`public/` 下的文件在构建后位于站点根目录。

- [ ] **Step 4: 删除 index.html 里的 Google Fonts**

删除这三行（`preconnect` 两条 + `<link>` 一条）：

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
```

- [ ] **Step 5: 确认再无外部字体引用**

Run: `cd frontend && grep -rn "fonts.googleapis\|fonts.gstatic" src/ index.html`
Expected: 无输出。

- [ ] **Step 6: 验证**

```bash
cd frontend
npm run test          # 66/66
npm run build
npm run lint
ls -la dist/fonts/    # 六个 woff2 应被原样复制到产物
```

无浏览器可用，因此**无法确认字体实际渲染效果**。在报告中如实说明这一项未验证。

- [ ] **Step 7: 提交**

```bash
git add -A frontend
git commit -m "perf: :zap: 字体改为自托管，移除 Google Fonts 依赖"
```

---

## Task 3: 路由懒加载与最终体积对照

**Files:**
- Modify: `frontend/src/router/index.js`

**Interfaces:**
- Consumes: 无
- Produces: 无

- [ ] **Step 1: 记录改动前的基线**

```bash
cd frontend && npm run build
ls -S dist/assets/*.js | head -5 | xargs du -h
```

把输出记进报告——Step 5 要做前后对照。

- [ ] **Step 2: 把 9 个静态导入改为动态导入**

删除 `src/router/index.js` 顶部这 9 行 import：

```js
import HomeView from '../views/HomeView.vue'
import RecruitmentView from '../views/RecruitmentView.vue'
import zyzView from '../views/zyzView.vue'
import ProductList from '../views/ProductList.vue'
import ProductDetail from '../views/ProductDetail.vue'
import EventList from '../views/EventList.vue'
import EventDetail from '../views/EventDetail.vue'
import csd20View from '../views/projects/csd20.vue'
import csd20musicView from '../views/projects/csd20music.vue'
```

把路由表中每个 `component:` 的值改为动态导入。保持 `path` 与 `name` 一字不改：

```js
    { path: '/',                    name: 'home',          component: () => import('../views/HomeView.vue') },
    { path: '/recruitment',         name: 'recruitment',   component: () => import('../views/RecruitmentView.vue') },
    { path: '/project/zhu-yuanzhang', name: 'zhu-yuanzhang', component: () => import('../views/zyzView.vue') },
    { path: '/products',            name: 'products',      component: () => import('../views/ProductList.vue') },
    { path: '/products/:slug',      name: 'ProductDetail', component: () => import('../views/ProductDetail.vue') },
    { path: '/events',              name: 'EventList',     component: () => import('../views/EventList.vue') },
    { path: '/events/:slug',        name: 'EventDetail',   component: () => import('../views/EventDetail.vue') },
    { path: '/project/csd20',       name: 'csd20',         component: () => import('../views/projects/csd20.vue') },
    { path: '/project/csd20/music', name: 'csd20music',    component: () => import('../views/projects/csd20music.vue') },
```

**照抄本文件现有的路由定义，不要照抄上面这段的排版**——上面为便于对照压成了单行，实际文件里每个路由是多行对象。`path` 和 `name` 必须与现有值逐字相同；抄错一个 `name` 会让 `router-link :to="{ name: ... }"` 在运行时静默失效，而测试和构建都发现不了。

- [ ] **Step 3: 确认路由名没被改动**

```bash
cd frontend && git diff src/router/index.js | grep -E "^[-+].*name:" | sort | uniq -c | sort -n
```

每个 `name:` 应该成对出现（一个 `-` 一个 `+`）且内容相同；若某个 name 只出现一次，说明它被改动或漏了。

- [ ] **Step 4: 验证**

```bash
cd frontend
npm run test          # 66/66
npm run build
npm run lint
```

- [ ] **Step 5: 体积对照**

```bash
cd frontend
echo "=== JS chunk ==="; ls -S dist/assets/*.js | xargs du -h
echo "=== 产物总计 ==="; du -sh dist/
```

Expected: 不再只有一个 JS 文件，而是主包加若干路由 chunk；主包体积应明显小于 Step 1 记录的 656 KB。

把改前改后的对照表写进报告——这是本 Task 的主要交付物。

- [ ] **Step 6: 提交**

```bash
git add -A frontend
git commit -m "perf: :zap: 路由改为懒加载，详情页依赖移出首屏包"
```

---

## 完成标准

```bash
cd frontend
npm run test                          # 66/66
npm run build && npm run lint         # 均通过
grep -rn "\.png" src/ index.html      # 无输出
grep -rn "fonts.googleapis" src/ index.html   # 无输出
ls dist/assets/*.js | wc -l           # > 1（出现路由 chunk）
du -sh dist/                          # 约 10 MB（其中 8.2 MB 是按计划保留的 mp3）
```

**需要人工在浏览器中确认的两项**（执行环境无浏览器，无法自动化）：

1. 转换后的图片有无可见画质损失，尤其 csd20 的三张作品图与页头 logo
2. 自托管字体是否正常渲染（Orbitron 标题、Space Grotesk 正文、Roboto Mono 等宽处）
