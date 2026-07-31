# 前端资源与首屏优化 · 交接说明

分支：`feat/asset-optimization`（`cb44476..ababe22`，8 个 commit）
日期：2026-07-31
配套文档：[设计](specs/2026-07-31-frontend-asset-optimization-design.md) · [实施计划](plans/2026-07-31-frontend-asset-optimization.md)

---

## 成果

| | 改动前 | 现在 |
|---|---|---|
| **每页必付** | 2.4 MB | **604 KB** |
| 主 JS 包 | 656 KB（单块） | 432 KB + 15 个路由块 |
| 所有 JS chunk 之和 | 668 KB | 674 KB（分割开销仅 +1%，无重复代码） |
| `/project/csd20` | 约 26 MB | 约 790 KB |
| `dist/` 总计 | 39 MB | 11 MB（其中 8.2 MB 是按决定保留的 mp3） |
| 字体 | 依赖 Google Fonts 可达性 | 自托管 4 个文件，带 hash 进 `/assets/` |

图片转换可复现：`frontend/scripts/optimize-images.sh` 从 `assets-src/` 的母版重新生成，终审独立重跑后得到**逐字节相同**的输出。

---

## ⚠️ 合并前必须人工在浏览器中验证

**没有任何人或工具看到过这些页面渲染出来。** 执行全程无浏览器，开发库为空。所有「观感不变」的结论都建立在静态比对之上——字节比对、像素尺寸核对、CSS 推理——而非观察。

按「弄错了后果最严重」排序：

### 1. csd20 的三张作品图，看大图

访问 `/project/csd20`，点封面打开模态框（`max-width: 90vw`）。

`csd_20_title` 从 A4@300dpi 母版缩到 1131×1600、WebP q82，**体积降了 44 倍**。这是唯一无法用静态分析替代的判断，而且是社团自己的作品。重点看渐变和大面积纯色有没有色带，看海报里的细线条和文字有没有糊。

不满意就把 `scripts/optimize-images.sh` 里的 `Q_ART` 从 82 调到 90 重跑，再量一次体积。

### 2. 字体确实加载了——用请求验证，不能只看页面

```bash
curl -sI https://abl.secret-sealing.club/assets/space-grotesk-variable-<hash>.woff2
```

必须返回 `200` + `font/*` 类型 + 约 22 KB，**不能是 `text/html`**。

原因：nginx 配置是 `try_files $uri $uri/ /index.html` 加 `error_page 404 /index.html`，路径错了会返回 200 加 SPA 外壳。浏览器拒绝解析，`font-display: swap` 保持回退字体——页面看起来只是「有点不对」，跟这轮要消灭的 bug 长得一模一样。**光看页面分辨不出来。**

字体已移入 `src/assets/fonts/` 由 Vite 打 hash，路径错会在构建时报错而不是运行时，所以这一步主要是确认部署没出岔子。

再在 DevTools → Network 确认每个字体**只被请求一次**（这是可变字体去重的意义），Fonts 面板确认 Orbitron 渲染为 500/600、Space Grotesk 为 400/500/600。

### 3. 九个路由都能导航

`/`、`/recruitment`、`/products`、`/products/:slug`、`/events`、`/events/:slug`、`/project/zhu-yuanzhang`、`/project/csd20`、`/project/csd20/music`

每个 chunk 只在首次导航时执行，**没访问过的路由等于没执行过的代码**。每条都要「点进去」和「直接在该 URL 上硬刷新」各做一次——后者单独考验 nginx 的 SPA 回退。

### 4. 页头 logo，桌面宽度 + 高分屏

2520px → 200px 是这批里最激进的缩放，而且 logo 出现在每一页。边缘发虚或者有光晕的话，每个访客都会看到。

### 5. `calabi-yau` 背景图

以 `opacity: 0.16` 铺在纯黑上，尺寸 `min(92vw, 1280px)`。看暗部渐变有没有色带——这正是 WebP q82 最弱的地方，而低透明度**不会**掩盖它。

### 6. 部署后硬刷新一次再导航

验证 `router.onError`：如果点击导航毫无反应，说明处理器没生效。

---

## 后续工单

- **`router.onError` 没有防重载循环的护栏。** 若服务器持续故障（重载后 chunk 依然取不到），会陷入刷新循环。加一个 `sessionStorage` 标记即可一次性化解。终审判定为非阻塞——该场景下站点本来就是坏的。
- **`bytemd` 与 `swiper` 是未使用的依赖**，`src/` 下零引用，可以从 `package.json` 移除。
- **`npm run lint` 在分支基线就以退出码 1 结束**，两条 `vue/multi-word-component-names` 错误在 `csd20.vue` / `csd20music.vue` 上。要么给这两个文件关掉该规则，要么重命名组件。
- **主包仍有 432 KB**，大部分是 Naive UI。`manualChunks` 按 spec §5 明确不做，日后想再压首屏可以重新考虑。
- **Space Grotesk 的 vietnamese 子集未自托管**，站点无越南语内容，如有需要再加。

---

## 执行中暴露的计划缺陷

延续本项目的模式，这轮又出了三处，共性依然相同——**从静态假设推断运行时行为，而不去看实际输出**：

1. 计划的字体命名 `<字族>-<字重>.woff2` 假设每个字重是独立文件，实际 Google 对 Orbitron 与 Space Grotesk 发的是**可变字体**。首版照字面下了六个文件（实为三份内容），因浏览器按 URL 缓存，反而比基线多传约 56 KB。
2. spec §1.4 声称 `bytemd` 与 `swiper` 被打进首屏包——这两个包在 `src/` 里**从未被 import**。现状证据本身是编的。
3. 「`npm run lint` 通过」这条验收标准**不可能满足**，因为基线就是失败的。写的时候没跑过。

三处都已在分支内修复并订正了对应文档。
