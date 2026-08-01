# work 记录录入清单

Strapi 的内容数据不随 git 同步。schema 由代码带过去，**下面 10 条记录需要在生产 Admin 手工建立**
（或本地建好后 `npx strapi export` / `npx strapi import`）。

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

## 新建（4 条）

| slug | title | workType | status | featured | order | startDate | 备注 |
|---|---|---|---|---|---|---|---|
| `thtk-studio` | THTK-Studio | `tool` | `maintained` | `true` | `90` | `2025-05-01`（占位，待社团方确认实际立项/发布日期） | `toolDetail.repoUrl` = https://github.com/Renko6626/THTK-Studio |
| `booth-manual` | 社团出摊教程 | `tool` | `released` | `false` | `75` | `2025-11-01`（占位，待社团方确认） | |
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
