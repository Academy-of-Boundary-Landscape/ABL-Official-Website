# 站点重构 · 交接说明

分支：`feat/site-restructure`（`594d73b..d7ba606`，16 个 commit）
日期：2026-08-01
配套文档：[设计](specs/2026-08-01-site-restructure-design.md) · [实施计划](plans/2026-08-01-site-restructure.md) · [page 录入稿](../content-migration/pages.md)

社团转型三个 spec 中的第二个。Spec 1 建立了 `work` 作品实体；本轮把整站信息架构切换到以作品为主轴，并让退出的贩售业务体面归档。

---

## 成果

| | 改动前 | 现在 |
|---|---|---|
| 一级导航 | 5 项，含「制品」「招募」 | 主页 + **作品 / 动态 / 加入我们 / 关于** |
| 首页 | 一半在服务要退出的业务（展会时间线、制品侧栏、238 行自写轮播） | 三区块：在制游戏 hero → 作品网格 → 最新动态 |
| `/about` `/join` 的文案 | 硬编码在 Vue 里，改一个字要发版 | Strapi `page` 记录，后台随时可改 |
| 周边贩售 | 筛选 + 搜索 + 排序 + 推荐位 + 库存状态 | `/archive/products`，只剩网格与详情 |
| 测试 | 95 | **100** |
| 主包 | 440.24 kB（gzip 137.86） | **399.05 kB**（gzip 121.92） |
| `dist/` | — | 972 KB |
| 净改动 | — | +2462 / −2071 行，38 个文件 |

**删除的五个文件**：`ProjectsBar.vue`（238 行自写轮播）、`RecruitmentView.vue`（344 行硬编码文案）、`ProductList.vue`、`CategoryFilter.vue`、`useEventAPI.js`（206 行零引用，还带着一整套写接口方法对着只读站点）。

---

## ⚠️ 部署顺序不能错，否则站点会比现在更空

**这是本轮最重要的一段。** `RecruitmentView.vue` 那 344 行硬编码文案已经删了，`/join` 现在只渲染 CMS 里的 `page:join`。而生产上**既没有 `page` 记录、也没给 `page` 开 Public 权限**，11 条 work 还是草稿。

直接部署前端的话：`/join` 与 `/about` 变成两个空盒子，首页是两个叠着的空状态框。

```bash
# 1. 推分支
git push

# 2. 先让 page schema 生效（不能只 pm2 restart——strapi start 加载的是编译产物）
ssh root@server 'bash /home/deploy/abl_website/update-strapi.sh'

# 3. 生产 Admin → Settings → Roles → Public，给 page 勾 find / findOne

# 4. 录入两条 page 记录（正文见 docs/content-migration/pages.md）

# 5. 发布那 11 条 work 草稿（清单见 docs/content-migration/work-records.md）

# 6. 最后才上前端
ssh deploy@server 'bash /home/deploy/abl_website/update.sh'
```

设计文档 §1.3 与 §2 本来就写着「先录内容，再实施本 spec」，实施还是先跑了——所以这个顺序现在是硬约束。

---

## 只能人工做的

- **录入 `page:about` 与 `page:join`**，正文在 `docs/content-migration/pages.md`，从被删掉的两个组件逐字提取，未改写。
- ~~两个邮箱不一致需要裁决~~ **已解决（2026-08-01）**：旧首页写 `contact@secret-sealing.club`、旧招募页写 `contact@abl.secret-sealing.club`，本就不一致只是分散在两处没人注意。社团方裁决统一为 **`1471850534@qq.com`**，`pages.md` 两处与 `csd20.md` 一处均已改。
- **`page:join` 的 QQ 群号**待填（录入稿里用 HTML 注释包着，不会被误当正文粘贴）。
- 可选的第三条 `page:home`——定位陈述由你自己写，不写就整块不渲染。
- 检查那条「社团线上通贩发布」动态，把失效的通贩链接从正文里去掉。

---

## 尚未有人看到过页面渲染

**没有做视觉验证。** 生产库为空、本地库也没有 `page` 记录，整个执行过程无浏览器。所有「渲染正确」的结论都建立在读模板与追踪 `v-if` 分支之上。

内容录完之后，建议按这个顺序看一遍：

1. **首页的两种形态**——有内容与无内容都要成立
2. **`WorkHero` 的无封面模式**——本轮最容易做丑的一处，且没有测试能守。在制新游戏没有封面，这个位置必须靠排版和状态徽标撑住，不能是灰色占位块
3. **`/about` 时间线**的展会与作品混排顺序是否讲得通
4. **归档页**读起来像「存档」还是「坏掉的商店」
5. `page` 记录缺失时 `/`、`/about`、`/join` 都不崩

---

## 遗留

**行为**
- **`iframe-embed` 全站是坏的（前置问题，非本轮引入）**：后端 schema 的字段是 `iframeTitle` / `iframeCode`，前端两处却都读 `block.iframeContent`——这个字段在整个后端不存在，渲染出来是 `<iframe src="undefined">`。两处：`frontend/src/components/work/ContentBlocks.vue:18`、`frontend/src/views/EventDetail.vue:67`（后者是 Spec 1 之前的旧代码，说明这个错位一直没被发现——大概从来没人真的用过 iframe 块）。

  修之前要先裁决**存什么**：字段名叫 `Code` 说明原意是「粘贴整段 `<iframe>` 嵌入代码」，而前端当 `src` URL 用，是双重错位。存整段代码更灵活（B站/itch.io 给的就是整段），但要过 `v-html`；存 URL 更安全，但很多平台的嵌入代码带参数，得让录入的人自己拆。`iframeTitle` 目前前端完全没用上，无论哪种修法都该接上（无障碍）。

  优先级不低：iframe 是「统一形式 + embed」方案里最主要的逃生舱——试玩嵌入、视频、外部展示都走它。少了它，遇到花活就只剩「改 Vue」一条路，而当初选这个方案就是为了不必每次改 Vue。
- 首页作品网格取 `limit: 7`（hero 1 + 网格 6）；`/works` 与 `/archive/products` 均硬编码 `limit: 100`，条目数远小于上限，未做分页
- `/archive` 无路由、全站无 404 catch-all——截断 `/archive/products` 到 `/archive` 会渲染出页头页脚加一片空白。既有模式，本轮未引入

**代码整洁**
- `usePageBySlug` + `blocks` computed + `ContentBlocks` 的样板在 `HomeView` / `AboutView` / `JoinView` 三处各写一份
- `WorkHero` 与 `WorkCard` 的 `coverUrl` / `typeText` 计算逐字重复
- `AboutView` 的 `useWorkList` 仍 `populate: 'coverImage'`，时间线用不到
- `EventDetail.vue` / `ProductDetail.vue` 的页头仍用旧的 `<h1 class="title">// …</h1>` 模式（详情页，不在本轮统一的五个导航目的地之列）
- `simpler_documentation.md` 已积累两个 spec 的漂移——没有 `work`（Spec 1），也没有 `page`（本轮），而 CLAUDE.md 仍称它为 "the read-only API surface"

---

## 这一轮计划出的错

五处，比 Spec 1 少，但**多了一个新品种**：

1. 六个作品组件的 scoped 样式在计划里逐字重复了六遍（开工前自查发现，抽成 `detail-shared.css`）
2. `mergeTimeline` 的同日期 tie-break **是不可达的死逻辑**——展会先入数组、`sort` 又是稳定的，那行删掉输出不变。复审做变异测试才发现。修法是把两个循环调换，让 tie-break 真正承重
3. **`vue-router` 字符串重定向不会自动带参数**——`redirect: '/news/:slug'` 会落到字面量 `:slug` 上。实测推翻了计划里的断言
4. **`WorkHero` 正文说 CTA 链向 `/join`，代码却把整卡包成一个 `RouterLink`**——那句「我们在找人」是个假按钮。而且不能简单把 CTA 换成 `RouterLink`（嵌套 `<a>` 非法），要把容器改成 `<article>`
5. **归档页仍显示「有库存」**，就在「已停止贩售」标注下面几行。我的删除清单只写了「购买引导」，没点名库存状态

前三处是老毛病——**从静态假设推断运行时行为**。第 4 处是新品种：**同一个 Task 内正文与代码打架**，两处各自自洽、凑一起才矛盾。第 5 处是抽象描述与具体清单之间的缝隙。

### 终审还抓到一条测试自身的问题

`redirects.spec.js` 原本手写八条桩路由，**从不引用真实的 `routes.js`**。把 `/news` 改个名，100 条测试全绿而 `/events` 404——「旧链接不得 404」这条核心约束，守它的测试对着的是一张自编的路由表。

已改为驱动真实路由表，并实测验证：改 `routes.js` 的 `/news` → 对应测试变红。

### 一条被推翻的记录

Task 3 的复审报告说「函数式重定向会丢弃 query 与 hash」，记进了遗留清单。**终审实测推翻了它**——vue-router 对字符串和函数两种形式都会把 `to.query` / `to.hash` 并进目标。该条已作废，不再背着走。

---

## 与 Spec 1 的一个对比

Spec 1 的交接说明写着「**没有任何人或工具看到过这些页面渲染出来**」；合并前我补做了 headless 验证，才发现封面把详情页压垮、正文图片是破图两个问题。

本轮又回到了「没看过」的状态——因为 `page` 记录和 work 内容都还不存在，连种子数据都灌不出有意义的页面。**这不是流程退步，是内容与代码的先后顺序被颠倒了的必然结果。** 内容录完之后那一遍视觉验证不能省。
