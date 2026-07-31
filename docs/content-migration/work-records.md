# work 记录录入清单

Strapi 的内容数据不随 git 同步。schema 由代码带过去，**下面 10 条记录需要在生产 Admin 手工建立**
（或本地建好后 `npx strapi export` / `npx strapi import`）。

前置：`pm2 restart strapi-main` 让新 schema 生效，并在 Settings → Roles → Public
为 **work** 勾选 `find` 与 `findOne`。

## 从既有 project 迁移（5 条）

| slug | title | workType | status | 备注 |
|---|---|---|---|---|
| `booth-kernel` | 摊盒 Booth-Kernel | `tool` | `maintained` | `toolDetail.homepage` = https://boothkernel.secret-sealing.club/ |
| `sumireko-2026` | 2026宇佐见堇子角色日接力 | `site` | `ended` | `siteDetail.url` = https://sumireko2026.secret-sealing.club |
| `mamizou-2026` | 2026二岩猯藏角色日接力 | `site` | `ended` | `siteDetail.url` = https://mamizou2026.secret-sealing.club |
| `hourai-2025` | 2025蓬莱人形23周年纪念接力 | `site` | `ended` | `siteDetail.url` = https://hourai2025.secret-sealing.club/ |
| `csd20` | 梦违科学世纪20周年纪念合同志 | `publication` | `ended` | 内容与媒体见 `docs/content-migration/csd20.md`，含封面、两张宣传图、主题曲 mp3，需全部上传 |

## 从硬编码页迁移（1 条）

| slug | title | workType | status | 备注 |
|---|---|---|---|---|
| `zhu-yuanzhang` | 东方朱元璋 | `game` | `discontinued` | 正文见 `docs/content-migration/zhu-yuanzhang.md`；两张配图需上传 |

> **三条特制页迁来的记录（`csd20`、`zhu-yuanzhang`）在录入完成前，`/works/<slug>` 会显示空态。** 旧链接的重定向已经生效，落到的是一个还没有内容的页面。若在意这段窗口期，先录这两条再上前端。

## 新建（4 条）

| slug | title | workType | status | 备注 |
|---|---|---|---|---|
| `thtk-studio` | THTK-Studio | `tool` | `maintained` | `toolDetail.repoUrl` = https://github.com/Renko6626/THTK-Studio |
| `booth-manual` | 社团出摊教程 | `tool` | `released` | |
| （待定） | 东方设定 agent | `tool` | `in-development` | 名称与正文由社团方确定 |
| （待定） | 新游戏项目 | `game` | `in-development` | **`recruiting` 开启**，填 `recruitingRoles`；无封面、无 details 属正常 |

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
