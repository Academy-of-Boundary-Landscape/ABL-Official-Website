# 作品体系与内容模型 · 交接说明

分支：`feat/work-content-model`（`2815710..5775565`，11 个 commit）
日期：2026-07-31
配套文档：[设计](specs/2026-07-31-work-content-model-design.md) · [实施计划](plans/2026-07-31-work-content-model.md) · [内容录入清单](../content-migration/work-records.md)

这是社团转型三个 spec 中的第一个。Spec 2「站点重构」与 Spec 3「中英双语」尚未开始，范围见设计文档第 6 节。

---

## 成果

| | 改动前 | 现在 |
|---|---|---|
| 作品实体 | `project`：无 slug、只能硬编码路由、仅一个 `link` 字段 | `work`：`workType` 判别四类，类型专属字段走 `details` 动态区 |
| 作品页面 | 3 个手写的作品专属 Vue 页 + 无列表页 | `/works` 列表 + `/works/:slug` 通用详情，**零专属页** |
| 开发日志 | 无处挂载 | `event.relatedWork` 关联，作品页显示自己的动态流 |
| 测试 | 66 | **95** |
| `npx eslint .` | 退出码 1（两条错误长在被删掉的两个特制页上） | **退出码 0**——本仓库首次，`npm run lint` 可以当 CI 门禁了 |
| `dist/` | 11 MB | **1.1 MB**（8.5 MB 主题曲与三张 webp 移出打包范围） |

---

## 与前两轮不同：这一轮在合并前做了视觉验证

前两轮的交接说明都以「**没有任何人或工具看到过这些页面渲染出来**」开头。这一轮不是。

合并前用 Playwright + headless Chromium 实际跑通了：本地起 Strapi、直接改 SQLite 给 Public 角色开读权限、经 REST 灌两条种子数据、截图并抓控制台错误。结果：

- **预告态成立。** `new-game` 条目无封面、无正文、无 `details`，详情页只渲染类型标签、`开发中` + `招募中` 双徽标、标题、摘要、招募区块与「>> 联系我们」——没有孤立标题、没有空区块、没有塌陷。列表卡片渲染带类型字样的 16:9 占位块，与有封面的卡片等高。这是 spec §5 里写明「只有肉眼能判断」的那一项。
- **`tool-detail` 渲染正确**：平台、版本、许可证、仓库链接、多渠道下载都在。
- **零控制台错误、零失败请求。**
- **排序实证**：`THTK-Studio`（`featured=true`, `order=90`）排在 `新游戏企划`（`featured=false`, `order=100`）之前——`featured:desc` 确实压过 `order`。这验证了终审 I2 的判断：精选靠排序就够，硬过滤只会在没人勾选时把首页轮播变成空态。

截图在 `/tmp/sunyunbo/works-shots/`（临时目录，要留得自己挪走）。

仍未做的：把六个 Task 的改动放到真实内容规模下走一遍窄屏；`site` / `publication` 两类的 detail 区块没有种子数据，未见过渲染。

---

## 合并后必须按顺序做，不能颠倒

```bash
# 1. 推分支
git push

# 2. 先让新 schema 生效（pull + build + restart + 验证端点）
ssh root@server 'bash /home/deploy/abl_website/update-strapi.sh'

# 3. 在生产 Admin 为 work 开放 Public 的 find / findOne
#    （event / product 已经开着，不用动）

# 4. 再上前端
ssh deploy@server 'bash /home/deploy/abl_website/update.sh'
```

**先上前端会让 `/works` 对着一个还不存在的端点报 403/404，站点看起来是坏的。**

## 然后是内容录入，这部分只能人工

`docs/content-migration/work-records.md` 是清单，10 条记录，含 `featured` / `order` / `startDate` 的具体建议值。另外两份是被删掉的特制页的正文存档，逐字抄出来供录入：

- `docs/content-migration/zhu-yuanzhang.md` —— 东方朱元璋
- `docs/content-migration/csd20.md` —— 合同志 + 主题曲，含媒体上传清单

录完之前 `/works` 在生产上是空的。旧链接 `/project/*` 的重定向已经生效，会落到一个还没有内容的页面——在意这段窗口期的话，先录 `csd20` 与 `zhu-yuanzhang` 两条再上前端。

`event` 的 10 条既有数据也要逐条改 `category`（枚举已换成 `devlog` / `announcement` / `release`），映射表在清单里。

---

## 已知遗留

**代码整洁**
- `useProductByTitle` 已无生产调用方（`csd20.vue` 删了），函数与其测试仍在
- `ContentBlocks.vue` 与 `EventDetail.vue` 各有一份动态区渲染。合并需要先搬 `EventDetail` 的 scoped 样式，而它零测试覆盖——终审判定可以带着合并
- `embedding.pdf-embed` 在 `EventDetail.vue` 里从未被渲染（`v-if` 链里没有它），既有缺陷
- `event.category` 徽标显示英文原值（`devlog` / `release`），站内已有 `statusLabel` / `typeLabel` 的现成模式可套

**行为**
- `/works` 页签切换会重复请求：`useStrapiResource` 监听的 getter 每次求值返回新对象，连 `other → all` 这种参数逐字节相同的切换也会重发并闪一下骨架。正确性无碍
- `/works` 未做分页，硬编码 `limit: 100`

**尚未验证**
- 窄屏走查；`site` / `publication` 两类 detail 区块的渲染

---

## 这一轮计划出的错

延续本项目的模式，又是一批，共性依然是**从静态假设推断，而不去看实际输出**：

1. 六个作品组件的 scoped 样式在计划里被逐字重复了六遍（开工前自查发现，抽成 `detail-shared.css`）
2. `useWorkNews` 的 `limit` 漏了 `toValue`，而计划自己的全局约束里就写着「不能用裸 Ref 做真值判断」——在 `useWorkList` 上守住了，隔壁函数上漏了
3. `assets-src/csd20related/` 早已存在（上一轮资源优化放的母版），计划里的整目录 `git mv` 会套成两层
4. 内容录入清单没有 `featured` / `order` / `startDate` 三列，编辑照着填会产出三个排序键全为常量的记录，`/works` 顺序随机
5. `featured` 被定义为「首页精选」，但 `featuredOnly` 参数零生产调用方——有测试、没人用
6. `/works` 在整个应用里没有入口链接，只能手打 URL
7. 唯一有新逻辑的地方（`WorkList` 的页签映射与过滤）没走「抽成纯函数再测」这条自己定的规矩
8. `WORK_TYPES` / `WORK_STATUSES` 是死导出，那条测试只断言常量等于它下面两行写的字面量

第 4–8 条全是终审才抓到的，而且全部是**跨 Task 边界**的：schema 在 Task 1、composable 在 Task 2、消费方在 Task 3/6、录入清单在 Task 6，每个单独看都对，缝在中间掉下去了。单 Task 复审在结构上不可能发现它们——这正是全分支终审的价值所在。

第 8 条的修法最有价值：现在那条测试直接读 `strapi-backend/.../work/schema.json`，断言前后端枚举一致。往 Strapi 里加个 `status` 值，测试立刻变红（已实测验证）。以前加了不会有任何失败，徽标只会悄悄消失。
