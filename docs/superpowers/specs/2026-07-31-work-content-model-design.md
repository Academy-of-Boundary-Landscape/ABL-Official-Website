# 作品体系与内容模型 · 设计文档

日期：2026-07-31
范围：Strapi `work` 内容类型、`event` 关联改造、现有内容迁移、前端 `/works` 页面与全套重定向
状态：待实施
后续：本文档是社团转型三个 spec 中的第一个（地基）。Spec 2「站点重构」与 Spec 3「中英双语」在第 6 节列明，不在本轮范围。
实施计划：[作品体系与内容模型 Implementation Plan](../plans/2026-07-31-work-content-model.md)

> **2026-07-31 修订 A**（编写实施计划时核对代码库发现）：字段名 `type` 改为 `workType`（§3.1）；`details` 的「至多一个组件」可由 schema 的 `max` 键强制而非仅靠约定（§3.2）；`body` 允许的嵌入块收窄到前端真正会渲染的几种（§3.1）。
>
> **2026-07-31 修订 B**（用户裁定）：**取消 `customView` 逃生舱，主站只保留统一形式。** 三个特制页（`zyzView.vue`、`csd20.vue`、`csd20music.vue`）全部退役，内容改由 `work` 记录 + `body` 嵌入块表达。新增 `embedding.audio-embed` 承载 csd20 的主题曲播放器。详见 §3.7。

---

## 1. 背景：社团转型

社团结束了「同人周边贩售 + 展会出摊」模式，转向**技术开发与同人游戏制作**。

### 1.1 转型其实已经发生，只是网站没跟上

拉取生产 API 的实测结果：

| 内容类型 | 条数 | 当前前端投入 | 转型后地位 |
|---|---|---|---|
| `product` 周边制品 | 15 | **最重**：列表 + 分类筛选 + 搜索 + 排序 + 详情 + 推荐位 + 价格 + 库存号 | 归档 |
| `convention` 展会 | 9 | 首页时间线 | 归档 |
| `event` 动态 | 10 | 列表 + 详情 + 动态区（4 种嵌入块） | 保留并拆分 |
| `project` 企划 | 5 | **最轻**：无 slug、硬编码路由、仅一个 `link` 字段 | 升为主角 |

10 条 event 里有 4 条是软件发布（自动化出摊系统、社团出摊教程开源、THTK-Studio、摊盒 Booth-Kernel）。5 个 project 里 2 个是软件，另外 3 个是社团为东方社区接力活动制作的独立展示网站。

**矛盾在于：要做的主线在网站上是二等公民，要退出的业务占着最好的位置。**

### 1.2 定位陈述

`zyzView.vue` 显示 `/project/zhu-yuanzhang` 的《东方朱元璋》是东方天空璋的魔改二创模组，制作方式是「利用 thtk 系列的解包工具，基于 thcrap 对原作进行魔改」。而 THTK-Studio 正是为让这类魔改更好做而编写的图形化编辑器。

因果关系由此确定，社团的一句话定位是：

> **为了做二创游戏，我们造了做二创游戏的工具，然后把工具开源给了所有人。**

这句话同时解释了四类产出：游戏、THTK-Studio、摊盒（为出摊而造后开源）、东方设定 agent。**工具不是副业，是主线的基础设施，并且本身成为了他人可用的作品。**

因此不采用「技术开发」与「同人游戏」两条并列主线——网站上两条并列主线等于没有主线，首屏与导航的每个层级决策都会变成平局。采用**一条主线（东方二创开发团队）+ 统一的作品实体**。

### 1.3 约束现状

- 在制游戏：朱元璋已停止，**新项目取代它**，内核开发完成，正在招募美术资产制作者，**当前无可展示素材**。
- 维护人力：社团有稳定成员，但**只有一人接触网站**，且该成员将赴海外读博。内容模型必须可由单人维护。
- 现有前端地基（`colorTokens` 单一色源、`useStrapiResource` 数据层、`AsyncBoundary` 状态组件、66 条测试）刚于同日完成收敛，本轮全部复用，不建平行体系。

---

## 2. 已确认的决策

| 议题 | 决定 |
|---|---|
| 主线定位 | 一条主线（东方二创开发团队），游戏与工具是其下两类作品 |
| 内容模型 | **统一 `work` 实体 + `workType` 判别**，不建 `game` / `software` 两个并列实体 |
| 旧业务处理 | 保数据、砍运营前端（Strapi 数据一条不删，前端删掉贩售运营功能） |
| 国际化 | 本轮做中英双语，但**放在 Spec 3**，本 spec 只保证建模不排斥 i18n |
| GitHub 为事实源 | **不做**。主线是游戏，游戏不走 GitHub Release，收益只落在两个工具上却要引入构建期拉取与缓存兜底。YAGNI |
| 特制页 | **不做。** 主站只有统一形式，三个既有特制页全部退役。需要"花活"时走独立子域名或 `iframe-embed`，见 §3.7 |

---

## 3. 设计

### 3.1 `work` 内容类型

路径：`strapi-backend/src/api/work/content-types/work/schema.json`

**公共字段**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | |
| `slug` | uid（targetField: `title`） | 是 | 修掉 `project` 无 slug、只能硬编码路由的缺陷 |
| `workType` | enumeration | 是 | `game` / `tool` / `site` / `publication`。**不叫 `type`**：该词同时是 Strapi 属性定义自身的键名，作为字段名有与内部 schema 词汇冲突的风险，`workType` 零成本规避 |
| `status` | enumeration | 是 | `planned` / `in-development` / `released` / `maintained` / `ended` / `discontinued` |
| `recruiting` | boolean（默认 `false`） | 否 | **与 `status` 正交**：新游戏 = `in-development` + `recruiting`；摊盒 = `maintained`；朱元璋 = `discontinued` |
| `recruitingRoles` | component `work.recruiting-role`，repeatable | 否 | 供首页招募块与 Spec 2 的 `/join` 消费 |
| `summary` | text | 是 | 一句话简介，列表卡片用 |
| `coverImage` | media（single） | **否** | 必须可空——`project.coverImage` 当前为 required，正是预告态条目的拦路虎 |
| `body` | dynamiczone | 否 | `content-block.content-block` + `embedding.link-embed` / `iframe-embed` / `file-embed` / **`audio-embed`（新建）**。**不含 `product-embed` 与 `pdf-embed`**：前者需要二次批量补全制品数据，后者在 `EventDetail.vue` 里其实从未被渲染（那条 `v-if` 链没有它）。开一个前端会静默丢弃的块类型，等于给编辑埋一个"填了没反应"的坑 |
| `staff` | component `staff.staff`，repeatable | 否 | 复用现有组件，朱元璋制作名单直接迁入 |
| `details` | dynamiczone | 否 | 类型专属字段，见 3.2 |
| `startDate` | date | 否 | |
| `featured` | boolean（默认 `false`） | 否 | **只抬高排序优先级，不做硬过滤**——`sort` 里 `featured:desc` 排在最前，配合首页轮播的 `limit: 6`，精选作品自然出现在轮播最前面。不提供单独的"仅显示精选"过滤开关：那样的硬过滤没有增加任何能力（排序 + `limit` 已经实现了"精选优先出现在首页"），却引入一个真实风险——社团方忘记勾选任何一条时，首页轮播会因为过滤结果为空而直接变成空态。 |
| `order` | integer（默认 `0`） | 否 | 手工排序，降序优先 |

`options.draftAndPublish` 设为 `true`，与现有四个内容类型一致。

**为什么 `recruiting` 与 `status` 分开**：招募状态与开发进度正交。一个 `maintained` 的工具可能在招贡献者，一个 `in-development` 的游戏可能不缺人。合并成单一枚举会产生 `in-development-recruiting`、`maintained-recruiting` 这类组合爆炸值。

### 3.2 类型专属字段：`details` dynamic zone

四个组件，每条 work 按其 `workType` 挂载对应的一个。采用 dynamic zone 而非四个常驻可空 component，是为了让后台编辑界面只显示实际相关的字段。

**「至多一个组件」由 schema 的 `"max": 1` 强制**（动态区支持 `min` / `max`）。若某个 Strapi 版本拒绝该键，退回为约定，并依赖前端降级。

无论 schema 是否强制，前端都不假设它成立：`resolveDetailBlock(details, workType)`（见 3.5）在类型不匹配、动态区为空、挂了多个组件时一律返回 `null`，详情页降级为只渲染 `body`，不报错。

新建组件分类 `work`，路径 `strapi-backend/src/components/work/*.json`：

**`work.game-detail`**

| 字段 | 类型 | 说明 |
|---|---|---|
| `platforms` | string | 逗号分隔，前端 split 后渲染为标签 |
| `basedOn` | string | 如「东方天空璋 / thcrap」 |
| `engine` | string | |
| `trailerUrl` | string | PV 链接 |
| `screenshots` | media（multiple） | 截图画廊 |
| `downloads` | component `work.download-channel`，repeatable | 试玩版/正式版下载 |

**`work.tool-detail`**

| 字段 | 类型 | 说明 |
|---|---|---|
| `repoUrl` | string | 仓库地址 |
| `homepage` | string | 项目中心页（摊盒有独立子域名） |
| `platforms` | string | 逗号分隔 |
| `currentVersion` | string | |
| `license` | string | |
| `downloads` | component `work.download-channel`，repeatable | **多渠道下载**，摊盒的「国内直链」需求在此 |
| `changelog` | richtext | 更新日志 |

**`work.site-detail`**

| 字段 | 类型 | 说明 |
|---|---|---|
| `url` | string（必填） | 线上地址 |
| `eventDate` | date | 活动日期 |
| `participantCount` | integer | 参与人数 |

**`work.publication-detail`**

| 字段 | 类型 | 说明 |
|---|---|---|
| `releaseDate` | date | |
| `spec` | string | 规格/页数 |
| `contributorCount` | integer | 参与作者数 |

**`work.recruiting-role`**

| 字段 | 类型 | 说明 |
|---|---|---|
| `roleName` | string（必填） | 如「美术 / 立绘」 |
| `description` | text | |
| `count` | integer | 需要人数，可空表示不限 |

**`work.download-channel`**

| 字段 | 类型 | 说明 |
|---|---|---|
| `channelName` | string（必填） | 如「GitHub Release」「国内直链」 |
| `url` | string（必填） | |

### 3.3 `event` 改造

`event` 当前同时承担公告、发版说明、周边新闻三种职责。本轮改造：

- **`category` 枚举替换**：`new-project` / `announcement` / `monthly-release` → `devlog` / `announcement` / `release`

  迁移映射（10 条现有数据，需在后台逐条改）：

  | 原值 | 条数 | 新值 |
  |---|---|---|
  | `new-project` | 3 | `release` |
  | `monthly-release` | 3 | `release` |
  | `announcement` | 4 | `announcement` |

  `devlog` 是新增值，现有数据无对应项——它服务于转型后的开发日志，由新内容填充。

- **新增 `relatedWork`**：relation，manyToOne → `work`，可空。这是本次改造的关键关联：devlog 挂到具体作品上，作品详情页因此能展示自己的开发日志与发布历史。

- `mainContent` dynamic zone **原样保留**，四种嵌入块继续使用。
- 内容类型名与 API 路径（`/api/events`）**本轮不改名**。前端路由 `/news` 通过重定向与命名解耦即可，改 Strapi 集合名会连带影响权限配置与既有数据，收益不匹配风险。

### 3.4 内容迁移映射

| 来源 | 目标 | `workType` / `status` | 备注 |
|---|---|---|---|
| project「摊盒 Booth-Kernel」 | work | `tool` / `maintained` | `homepage` 填 boothkernel 子域名 |
| project「2026宇佐见堇子角色日接力」 | work | `site` / `ended` | |
| project「2026二岩猯藏角色日接力」 | work | `site` / `ended` | |
| project「2025蓬莱人形23周年纪念接力」 | work | `site` / `ended` | |
| project「梦违科学世纪20周年纪念合同志」+ `csd20.vue` + `csd20music.vue` | work（合并为一条） | `publication` / `ended` | 三处内容合并进一条记录的 `body`；主题曲用 `audio-embed` 块 |
| `zyzView.vue`（东方朱元璋） | work | `game` / `discontinued` | 正文与制作名单迁入 Strapi 后删除该组件 |
| event「THTK-Studio」 | **提升**为 work（原 event 保留并关联） | `tool` / `maintained` | |
| 东方设定 agent | work（全新） | `tool` / `in-development` | 正文与实际 `status` 由社团方在填充内容时确定，建模上先按开发中建立 |
| 社团出摊教程 | work（全新） | `tool` / `released` | |
| 新游戏项目 | work（全新） | `game` / `in-development`，`recruiting` = true | **无 `coverImage`、无 `details`**，验证预告态 |

现有 10 条 event 全部保留，其中软件相关的 4 条补 `relatedWork` 关联。

`project` 内容类型在数据迁移完成后停止使用：从前端移除全部消费点，Strapi 中保留集合但不再录入（**不删除**，避免生产数据库迁移风险）。

### 3.5 前端

**新建**

| 文件 | 职责 |
|---|---|
| `src/composables/useWorks.js` | `useWorkList(params)` / `useWorkBySlug(slug)`，基于现有 `useStrapiResource`，固定 `populate` 与默认排序（`featured` 降序、`order` 降序、`startDate` 降序） |
| `src/views/WorkList.vue` | `/works`，按 `workType` 切页签：全部 / 游戏（`game`）/ 工具（`tool`）/ 其他（`site` 与 `publication` 合并）。用 `AsyncBoundary` 包裹 |
| `src/views/WorkDetail.vue` | `/works/:slug`，渲染公共字段 + 按 `workType` 选择 detail 组件 + 关联 devlog 列表 |
| `src/components/work/WorkCard.vue` | 列表卡片，含状态徽标 |
| `src/components/work/StatusBadge.vue` | `status` + `recruiting` 的标签渲染 |
| `src/components/work/GameDetail.vue` | 游戏专属区块 |
| `src/components/work/ToolDetail.vue` | 工具专属区块（含多渠道下载、更新日志） |
| `src/components/work/SiteDetail.vue` | 活动站专属区块 |
| `src/components/work/PublicationDetail.vue` | 出版物专属区块 |
| `src/utils/work.js` | **纯函数**：`WORK_TYPES` / `WORK_STATUSES` 常量、`typeLabel(workType)`、`statusLabel(status)`、`resolveDetailBlock(details, workType)`、`parsePlatforms(raw)`。把所有会产生渲染分支的判断从组件里抽出来，以便在 Node 环境单测 |
| `src/components/work/ContentBlocks.vue` | `body` 动态区渲染。**不复用 `EventDetail.vue` 的内联实现**：那段模板配套的样式写在它的 `<style scoped>` 里，抽进子组件会让 `EventDetail` 掉样式，而它没有测试覆盖。有意留下两份实现，合并列为后续工单 |

**修改**

- `src/router/index.js`：新增 `/works`、`/works/:slug` 两条路由（**没有任何作品专属路由**）；`/project/zhu-yuanzhang`、`/project/csd20`、`/project/csd20/music` 三条由组件路由改为 `redirect`（见 3.6）。
- `src/components/ProjectsBar.vue`、`src/components/SiteHeader.vue`：改吃 `useWorks` 而非 `useProjects`。形态（轮播、下拉）本轮不动，导航改版属于 Spec 2。
- `src/composables/useProjects.js`：随 `project` 消费点移除而删除。

**删除**

- `src/views/zyzView.vue`、`src/views/projects/csd20.vue`、`src/views/projects/csd20music.vue` 三个特制页全部删除，内容迁入 Strapi。
- `src/assets/images/csd20related/`（9.0 MB：主题曲 mp3 8.5 MB + 三张 webp）移到不参与打包的 `frontend/assets-src/`，原文件上传到 Strapi 媒体库。**`dist/` 直接减少 9 MB**，`/works/csd20` 的图片与音频改由媒体域名提供。

副产物：`csd20.vue` 与 `csd20music.vue` 是全仓库仅有的两条 lint 错误（`vue/multi-word-component-names`）。删除后 `npx eslint .` 退出码归零，`npm run lint` 首次可以作为 CI 门禁使用。

### 3.6 重定向表

站外存在引用（通贩页、QQ 群、GitHub README），旧路径必须重定向而非删除：

| 旧路径 | 新路径 |
|---|---|
| `/project/zhu-yuanzhang` | `/works/zhu-yuanzhang` |
| `/project/csd20` | `/works/csd20` |
| `/project/csd20/music` | `/works/csd20` |

主题曲页并入作品页（音乐成为 `body` 里的一个 `audio-embed` 块），所以 `/project/csd20/music` 与 `/project/csd20` 指向同一个目标。深链粒度变粗是统一形式的代价，站外若有直接指向音乐页的链接，仍能落到正确的作品上。

`/products`、`/events`、`/recruitment` 的重定向属于 Spec 2（站点重构），本轮不动——它们的目标页面（`/archive/*`、`/news`、`/join`）在 Spec 2 才存在。

### 3.7 特制页政策：主站只有统一形式

**主站代码库里不再有作品专属页面，也不保留任何指向专属页面的字段。**

取消 `customView` 而不是留着备用，是因为一个专门用来绕开统一形式的字段本身就是邀请——留着它，下一个"这个项目有点特别"就会绕过去，三年后又是三个特制页。删掉它，政策自我执行；将来真需要时，加回一个字段和一条路由是十分钟的事。

**"花活"有两条已验证的出路，都不向主站收税：**

1. **独立子域名。** 社团已经这样做过四次（sumireko2026、mamizou2026、hourai2025、boothkernel）。技术栈随便挑，发版与主站脱钩，主站只留一条 `work` 记录加 `site-detail.url`。这是重度定制的正确答案。
2. **`iframe-embed`。** 任意复杂的交互做成独立页面挂在别处，嵌进 `body`。视觉上在站内，工程上在站外。

**为什么主站内特制页是三者中最差的：** 它耦合主站的构建、路由、样式与部署，于是每一次横切改造都得带上它；但它既拿不到独立站的自由，也拿不到结构化记录的好处（不能被列表、筛选，不能由非程序员编辑）。两头不靠。

这个代价在本项目里是可量化的：2026-07-31 那轮前端改造中，`csd20.vue` 被反复卷入颜色令牌迁移、断点移动优先化、图片格式转换、路由改造；而全仓库仅有的两条 lint 错误就长在这两个特制页上，让 `npm run lint` 至今无法作为 CI 门禁。三个特制页换来的是每轮改造的固定开销和一条永远修不干净的基线。

**本轮承担的具体代价**（明说，不粉饰）：

- csd20 封面的点击放大模态框会消失。图片预览应当作为**详情页的通用能力**去做（`UPGRADE_TODO.md` §3.2 / §3.3 早已列为待办），而不是为一个作品保留一整个特制页。
- csd20 页面上那张制品卡片降级为 `body` 里的一条 Markdown 链接，指向 `/products/csd20`。Spec 2 会为该路径加上到 `/archive/products/csd20` 的重定向，链接不会断。
- 主题曲页与作品页合并，深链粒度变粗（见 §3.6）。

---

## 4. 全局约束

- **不引入 jsdom 或组件测试框架**，沿用上一轮的全局约束。需要验证的渲染逻辑一律抽为纯函数后单测。
- **不修改 `product` / `convention` 的 schema**，一个字段不改、一条数据不删。
- **复用现有地基**：`useStrapiResource`、`AsyncBoundary`、`colorTokens`、Naive UI + UnoCSS。不新建平行的数据层、状态组件或色板。
- **旧链接不得 404**，一律 `redirect` 路由。
- 新增颜色一律进 `colorTokens.js`，由守卫测试覆盖。

---

## 5. 验收

可自动化的部分：

- `useWorks` 的参数拼装、`populate`、默认排序、`workType` 过滤有单元测试，沿用现有 66 条测试的组织方式。
- `resolveDetailBlock(details, workType)` 对四种类型、类型不匹配、动态区为空/为 `null`、挂载多个组件等情况有单元测试（一律降级返回 `null` 而非抛错）；`typeLabel` / `statusLabel` 对未知枚举值有回落测试。
- 重定向表逐条测试：`createRouter` + memory history 在 Node 环境下可跑，不需要 jsdom。
- `npm run build` 通过。
- **`npx eslint .` 退出码为 0。** 基线上仅有的两条错误随特制页删除而消失，这是可验证的产出，不再是"相对基线无新增"的软标准。
- **`dist/` 体积相对基线至少减少 9 MB**（`csd20related/` 的 mp3 与三张 webp 移出打包范围）。
- 实施报告须附：新增/修改文件清单、测试数量变化、`dist/` 体积对照。

需要人工确认的：

- **预告态**：新游戏条目在无 `coverImage`、无 `details`、无 `body` 的情况下，列表卡片与详情页都要体面——不能出现破图、空白区块或布局塌陷。这是本轮最容易做错的一处，且只有肉眼能判断。
- 四种 `workType` 各自的详情页渲染正确的 detail 组件。
- csd20 用统一形式重建后仍然可读：封面、两张宣传图、主题曲播放器、制作信息、作者寄语都在，不因为丢了特制布局而变成一堵纯文字墙。
- 作品详情页正确显示 `relatedWork` 关联过来的 devlog 列表。

---

## 6. 明确不做（留给后续 spec）

**Spec 2 · 站点重构**
一级导航改版（作品 / 动态 / 加入我们 / 关于）；首页六区块重排；新建 `/about` 含展会时间线；归档化（`/archive/*` 路由、砍掉筛选/排序/搜索/推荐位、`CategoryFilter.vue` 退役、`ProductDetail` 去购买引导并加「已停止贩售」与代理发行标注、通贩入口下线）；`/join` 重做消费 `recruitingRoles`。

**Spec 3 · 中英双语**
Strapi 开启 i18n；前端 UI 静态字典（全量双语）；`work` / `event` 正文英文可选并回落中文，标注「暂无英文版本」；`/en/` 路由前缀；归档不做英文。

**本轮之外的其他事项**
- GitHub 作为事实源（见第 2 节 YAGNI 判断）
- `manualChunks` 手动分包
- 未使用依赖 `bytemd` / `swiper` 的清理、孤儿组件 `ContentRenderer.vue` 的删除、`router.onError` 的重载循环护栏——这些属于既有技术债清单，与本轮无关

---

## 7. 已知的运维成本

1. **本 spec 改动 Strapi content-type**，生产需要 `pm2 restart strapi-main`。Strapi 启动时自动检测 schema 变更并迁移数据库。
2. **内容数据不走 git**。第 3.4 节的 10 条 work 记录需要在生产后台手工建立，或本地建好后 `strapi export` / `strapi import`。这是本项目一贯的成本，本轮量较大。
3. **内容填充不属于本 spec 的交付物**：新游戏介绍、东方设定 agent 说明、代理发行措辞等由社团方撰写。本 spec 交付的是承载这些内容的结构。
