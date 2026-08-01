# work 记录录入清单

> ## ✅ 2026-08-01：11 条记录已作为**草稿**建入生产
>
> 通过 API 批量录入，先在本地跑通并用 headless 浏览器验证过渲染，再打的生产。
> **全部是草稿，公开接口看不到**（`/api/works` 对访客返回 0 条）。
>
> 你现在要做的**不是创建，而是审核 + 发布**：
>
> 1. 进 `https://api.abl.secret-sealing.club/admin` → Content Manager → Work
> 2. 逐条过目（正文素材全部取自你自己写过的 project / event 正文与两份存档，不是新编的）
> 3. **改掉两条占位文案**：`new-game` 与 `touhou-agent` 的标题和 `summary` 都带着 `【待填】`
> 4. 裁定 `booth-manual` 归 `tool` 还是 `publication`
> 5. 确认无误后逐条 **Publish**
>
> 媒体已上传：csd20 的封面、两张宣传图、8.15 MB 主题曲，以及朱元璋的两张配图。
>
> 用完记得去 Settings → API Tokens 把 `content-migration` 这个 token **revoke** 掉。
>
> 下面的原始清单保留作为字段依据与核对用。

Strapi 的内容数据不随 git 同步。schema 由代码带过去，这 11 条记录原本需要在生产 Admin 手工建立
（或本地建好后 `npx strapi export` / `npx strapi import`）。

**每条的完整字段值（含必填的 `summary`）见文末「逐条录入稿」**——下面几张表只给排序键与要点。

前置：`ssh root@server 'bash /home/deploy/abl_website/update-strapi.sh'` 让新 schema 生效
（**不能只 `pm2 restart`**——`strapi start` 加载的是编译产物 `dist/`，不 build 等于没改），
并在 Settings → Roles → Public
为 **work** 勾选 `find` 与 `findOne`。

## `featured` / `order` / `startDate` 怎么填

`/works` 与首页轮播都按 `sort=featured:desc,order:desc,startDate:desc` 排序（见
`frontend/src/composables/useWorks.js`）。三个键必须填出真实的区分度，否则排序在
所有记录间退化成常量、数据库返回顺序不确定。

- **`featured`**：只抬高排序优先级，不做硬过滤（`featured:desc` 排在最前 + 首页轮播
  `limit: 6`，精选自然出现在轮播最前面；不提供"仅显示精选"开关，见设计文档 §3.1）。
  下面精选的是「在制新游戏」「THTK-Studio」「摊盒」三条——转型后最想被看见的三件事。
- **`order`**：手工序，降序优先。数值越大越靠前。整体排序意图：**在制新游戏最靠前
  → 仍在维护/开发的工具（THTK-Studio、摊盒、东方设定 agent、社团出摊教程）
  → 活动站与出版物（这四条 `order` 相同，靠 `startDate` 互相排序）→ 已停止的
  朱元璋最后**（显式给它全表最低的 `order`，不依赖默认值恰好是 0 这件事本身
  可靠）。
- **`startDate`**：能确认的填确认值（摊盒、csd20、三个接力站，见下表；朱元璋的
  2025-07-06 取自 `zhu-yuanzhang.md` 里「2025年7月6日初次部署」的记录，也是确认值，
  不是占位）。THTK-Studio、社团出摊教程、东方设定 agent、新游戏项目四条没有可考据
  的确切起始日，**表中日期是占位，社团方录入时请核实并改成实际值**——占位值本身
  已经按上面的排序意图给出合理的先后关系，即使社团方一直没空确认，排序也不会乱。

## 从既有 project 迁移（5 条）

| slug | title | workType | status | featured | order | startDate | 备注 |
|---|---|---|---|---|---|---|---|
| `booth-kernel` | 摊盒 Booth-Kernel | `tool` | `maintained` | `true` | `85` | `2026-01-24`（确认值） | `toolDetail.homepage` = https://boothkernel.secret-sealing.club/ |
| `sumireko-2026` | 2026宇佐见堇子角色日接力 | `site` | `ended` | `false` | `50` | `2026-01-29`（确认值） | `siteDetail.url` = https://sumireko2026.secret-sealing.club |
| `mamizou-2026` | 2026二岩猯藏角色日接力 | `site` | `ended` | `false` | `50` | `2026-02-26`（确认值） | `siteDetail.url` = https://mamizou2026.secret-sealing.club |
| `hourai-2025` | 2025蓬莱人形23周年纪念接力 | `site` | `ended` | `false` | `50` | `2025-08-11`（确认值） | `siteDetail.url` = https://hourai2025.secret-sealing.club/ |
| `csd20` | 梦违科学世纪20周年纪念合同志 | `publication` | `ended` | `false` | `50` | `2025-09-13`（确认值） | 内容与媒体见 `docs/content-migration/csd20.md`，含封面、两张宣传图、主题曲 mp3，需全部上传 |

四条 `site`/`publication` 的 `order` 特意给成相同值（`50`）——它们同属"活动站与出版物"这一
排序桶，桶内顺序不用手工序，交给 `startDate:desc` 排：`mamizou-2026`（02-26）＞
`sumireko-2026`（01-29）＞`csd20`（09-13，上一年）＞`hourai-2025`（08-11，上一年最早）。

## 从硬编码页迁移（1 条）

| slug | title | workType | status | featured | order | startDate | 备注 |
|---|---|---|---|---|---|---|---|
| `zhu-yuanzhang` | 东方朱元璋 | `game` | `discontinued` | `false` | `0`（全表最低，显式排最后） | `2025-07-06`（确认值，见上） | 正文见 `docs/content-migration/zhu-yuanzhang.md`；两张配图需上传 |

> **三条特制页迁来的记录（`csd20`、`zhu-yuanzhang`）在录入完成前，`/works/<slug>` 会显示空态。** 旧链接的重定向已经生效，落到的是一个还没有内容的页面。若在意这段窗口期，先录这两条再上前端。

## 新建（5 条）

| slug | title | workType | status | featured | order | startDate | 备注 |
|---|---|---|---|---|---|---|---|
| `thtk-studio` | THTK-Studio | `tool` | `maintained` | `true` | `90` | `2025-05-01`（占位，待社团方确认实际立项/发布日期） | `toolDetail.repoUrl` = https://github.com/Renko6626/THTK-Studio |
| `abl-sale-tool` | 社团自动化出摊系统 | `tool` | `discontinued` | `false` | `10` | `2025-09-01`（确认值，上线动态日期） | **原清单遗漏**。摊盒的**前身**（网页版），已废弃；`repoUrl` = https://github.com/Renko6626/abl_sale_tool |
| `booth-manual` | 社团出摊教程 | `tool` | `released` | `false` | `75` | `2025-11-01`（占位，待社团方确认） | 归 `tool` 还是 `publication` 需社团方裁定，见逐条稿 |
| （待定） | 东方设定 agent | `tool` | `in-development` | `false` | `80` | `2026-06-01`（占位，待社团方确认） | 名称与正文由社团方确定 |
| （待定） | 新游戏项目 | `game` | `in-development` | `true` | `100`（全表最高，显式排最前） | `2026-05-01`（占位，待社团方确认） | **`recruiting` 开启**，填 `recruitingRoles`；无封面、无 details 属正常 |

## event 的枚举迁移（10 条既有动态）

`category` 枚举已改为 `devlog` / `announcement` / `release`。既有数据需逐条改：

| 原值 | 条数 | 改为 |
|---|---|---|
| `new-project` | 3 | `release` |
| `monthly-release` | 3 | `release` |
| `announcement` | 4 | `announcement`（不变） |

顺带给 4 条软件相关动态补 `relatedWork` 关联：

- 「THTK-Studio 东方脚本的集成开发工具」→ `thtk-studio`
- 「摊盒 Booth-Kernel——现代的同人出摊系统」→ `booth-kernel`
- 「【发布】THO展会出摊助手-局域网版」→ `booth-kernel`
- 「社团出摊教程开源」→ `booth-manual`
- 「社团自动化出摊系统上线」→ `abl-sale-tool`

---

# 逐条录入稿

`summary` 是 **required**，不填存不下记录，所以下面每条都给了可直接粘贴的草稿——按你自己的语感改，别当成必须照抄。

`slug` / `workType` / `status` / `featured` / `order` / `startDate` 见上面的表，这里不重复。

**通用**：`draftAndPublish` 开着，建完记得点 **Publish**，否则 `/api/works` 取不到。

---

## 1. `booth-kernel` 摊盒 Booth-Kernel

**summary**
> 开源的同人摊主出摊辅助工具。用平板与手机做摊位前的电子菜单，支持局域网多机互联，自动完成销售统计与财务报表。

**details → toolDetail**

| 字段 | 值 |
|---|---|
| `homepage` | `https://boothkernel.secret-sealing.club/` |
| `repoUrl` | `https://github.com/Academy-of-Boundary-Landscape`（动态正文给的是组织页，若有独立仓库请换成仓库地址） |
| `platforms` | `Windows, Android` |
| `currentVersion` | `1.0.5`（取自动态里的下载文件名，请核实） |
| `license` | 待填 |
| `downloads` | 「GitHub Release」+「国内直链」两条。国内直链正是那条动态存在的理由——防止连不上 GitHub |
| `changelog` | 抄动态「摊盒 Booth-Kernel——现代的同人出摊系统」里的更新日志段 |

**body 里值得提一句它的来历**：摊盒是网页版 `abl-sale-tool` 的重写版本。两条记录互相引用（用 Markdown 链接指向 `/works/abl-sale-tool`），"网页版不够用 → 重写成桌面+移动版"这条线就完整了。

---

## 2. `abl-sale-tool` 社团自动化出摊系统 ⚠️ 原清单遗漏

**摊盒的前身**——2025-09-01 上线的网页版，后来被摊盒（桌面/移动版）取代，**已废弃**。服务器上那个 `abl-booth-tool` 进程还开着，只是因为有朋友仍在用，不代表社团还在维护它。

`status` = `discontinued`，`order` = `10`（排在已结束的活动站之下、朱元璋之上）。

**summary**
> 摊盒的前身。出摊点单与销售统计的网页应用，已由摊盒 Booth-Kernel 取代。

**details → toolDetail**：`repoUrl` = `https://github.com/Renko6626/abl_sale_tool`，`platforms` = `Web`

**body**：动态「社团自动化出摊系统上线」的正文可以整段搬过来（核心价值与主要特性两节写得很完整），**但开头请加一句说明它已被摊盒取代**——否则读者会照着去用一个不再维护的东西。

**为什么废弃了还要收进来**：它是摊盒的源头，两条记录连起来才讲得通"我们做了个网页版，用下来不够，于是重写成了桌面+移动版"。这跟朱元璋一样——停掉的东西也是走过的路。

---

## 3–5. 三个接力站（`sumireko-2026` / `mamizou-2026` / `hourai-2025`）

**summary**（各一条）
> 为 2026 年宇佐见堇子角色日接力制作的总结与展示网站，收录 25 位参与者的作品。

> 为 2026 年二岩猯藏角色日接力制作的总结与展示网站。

> 为 2025 年蓬莱人形 23 周年 24h 纪念接力制作的展示网站，集中收录 24 位作者的创作。

**details → siteDetail**

| slug | `url` | `eventDate` | `participantCount` |
|---|---|---|---|
| `sumireko-2026` | `https://sumireko2026.secret-sealing.club` | `2026-01-29` | `25` |
| `mamizou-2026` | `https://mamizou2026.secret-sealing.club` | `2026-02-26` | 原文没给，待填 |
| `hourai-2025` | `https://hourai2025.secret-sealing.club/` | `2025-08-11` | `24` |

---

## 6. `csd20` 梦违科学世纪20周年纪念合同志

**summary**
> 纪念秘封专辑《梦违科学世纪》发行二十周年的合同志，收录二十余位秘封同好的画作，并附一首特典曲目。

**details → publicationDetail**：`releaseDate` = `2025-09-13`，`contributorCount` = `20`（原文「二十余位」，填确切数或留空），`spec` 待填（开本/页数）

**正文与媒体全部见 `docs/content-migration/csd20.md`** —— 封面、两张宣传图、主题曲 mp3 都要上传，body 的建议结构那份文档里写好了。

---

## 7. `zhu-yuanzhang` 东方朱元璋

**summary**
> 东方天空璋的恶搞向魔改二创模组，已完成博丽灵梦线 1–6 面的原创对话剧情。

**details → gameDetail**：`basedOn` = `东方天空璋 / thcrap`，`platforms` = `Windows`，`screenshots` 上传 `frontend/assets-src/` 下那两张

**正文与制作名单见 `docs/content-migration/zhu-yuanzhang.md`**，逐字抄好了。

---

## 8. `thtk-studio` THTK-Studio

**summary**
> 面向东方 Project 资源的图形化集成脚本编辑器，基于 Touhou-Toolkit，在同一环境里处理 ANM / STD / MSG / ECL 脚本。

**details → toolDetail**：`repoUrl` = `https://github.com/Renko6626/THTK-Studio`，`platforms` = `Windows`，`currentVersion` = `1.0`，`downloads` 加一条 GitHub Release（`.../releases/tag/THTK-Studio`）

**body**：动态「THTK-Studio 东方脚本的集成开发工具」的正文可整段搬，「主要功能一览」那五条写得很好。截图 `thanm_show.png` 已在 Strapi 媒体库里，直接引用。

---

## 9. `booth-manual` 社团出摊教程

**summary**
> 开源的社团出摊教学文档，覆盖展前准备、现场工作到展后收尾的完整流程。

**`workType` 需要你裁定**：它是文档不是软件。

- 归 `tool` —— 它是"帮你把事做成"的资源，与两个出摊软件同属一条线，放一起叙事连贯
- 归 `publication` —— 更诚实，它确实是出版物

我倾向 `tool`（三件出摊相关产出排在一起，转型故事更清楚），但这是你的判断。

**details → toolDetail**：`repoUrl` = `https://github.com/Renko6626/tho-booth-manual`

---

## 10. 东方设定 agent — 内容由你提供

只有 `workType` = `tool`、`status` = `in-development` 是我建议的，其余全部待你填：**名称、slug、summary、仓库地址、能力说明**。

服务器上的 pm2 进程 `touhou-agent-api` 应该就是它，可以从那里取仓库信息。

---

## 11. 新游戏项目 — 内容由你提供

**这条是首页大图位的占据者**（`featured=true` + `order=100` 全表最高），所以它的 `summary` 是全站曝光最高的一句话。

待你填：**名称、slug、summary**。

**`recruiting` 必须开启**，并填 `recruitingRoles`（至少一条：`roleName` = 美术 / 立绘，`description`、`count`）。

**无 `coverImage`、无 `details`、无 `body` 是正常的**——Spec 1 专门为这种预告态做了设计并验证过，详情页会只显示标题、摘要、双徽标与招募区块，不会塌。

---

## 还需要你确认的一件事

**`mapchart-backend`**（服务器上跑着的另一个 pm2 进程）是什么？如果是社团的产出，它也该进作品体系。

（`sumireko-api` 按堇子接力站的后端处理，不单独立条目——它是那个站的基础设施，已含在 `sumireko-2026` 里。`abl-booth-tool` 已确认是 `abl-sale-tool` 的部署实例，见第 2 条。）
