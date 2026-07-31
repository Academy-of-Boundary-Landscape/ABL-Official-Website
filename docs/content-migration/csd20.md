# 梦违科学世纪20周年合同志 · 内容迁移稿

来源：`frontend/src/views/projects/csd20.vue` 与 `csd20music.vue`（均已删除）。

录入目标：`work` 集合，`slug` = `csd20`，`workType` = `publication`，`status` = `ended`。

## 需要上传的媒体（现存于 `frontend/assets-src/csd20related/`）

| 文件 | 用途 |
|---|---|
| `csd_20_title.webp` | 封面 → `coverImage` |
| `宣传图12.webp`、`宣传图10.webp` | `body` 的 Markdown 块里引用 |
| `csd20_theme.mp3` | `body` 的 `audioEmbed` 块，`trackName` 填「梦祀之始」 |

## body 建议结构

1. `contentBlock`：合同志介绍（抄自 `csd20.vue`），中间用 Markdown 图片语法插入两张宣传图
2. `contentBlock`：一行 Markdown 链接指向制品页。**`/products/csd20` 只是猜测，不是事实**——
   `product.slug` 是没有 `targetField` 的 `uid`，每条记录的 slug 都是后台手工填的，不保证等于标题
   的 slug 化形式（这正是被删掉的 `csd20.vue` 当初按标题硬匹配、而不是按 slug 查找的原因，见
   `frontend/src/composables/useProducts.js` 里的相关注释）。**录入前请先去 Strapi 后台的
   product 集合里找到「梦违科学世纪20周年合同志」这条记录，复制它的真实 `slug` 字段值，
   拼成 `/products/<真实slug>` 再填进链接。** 另外这个链接是 Markdown 块的一部分，`body`
   经 `v-html` 渲染，点击站内链接会触发整页重载而不是路由跳转——这是站内既有行为，不是这条链接
   独有的问题，此处只是提醒不要误判成 bug。
3. `audioEmbed`：主题曲《梦祀之始》
4. `contentBlock`：音乐简介 + 制作信息 + 作者寄语（抄自 `csd20music.vue`）

---

## 页面标题 / 副标题（来自 csd20.vue）

- 标题：梦违科学世纪20周年合同志
- 副标题：20th Anniversary of Changeability of Strange Dream

## 画册简介（来自 csd20.vue）

本画册是为纪念梦违科学世纪专辑发布20周年所做，里面收录了二十余位画师的精美作品。非常感谢各位画师的支持与参与。

画册不仅包含精美的插画，还附有部分作品的创作思路、设定说明，以及作者的感言。希望能为同好们带来视觉与精神上的双重享受。

## 画册信息（来自 csd20.vue，原为一个 ul 列表）

- 名称：梦违科学世纪20th合同志
- 主催：Renko_1055
- 画师：廻、靈、Crodelia、含烟、Arster_ 茶盒、幼月 73、白桦树 AYA、前方路口请左转、4qw5、梅子、KINGDOM、青团、雪玲、降旗原、七年藤、火球子、Interboat、Bwaity、兜转、雷花啤酒、3 皮君、早景 zaojing、木亚措
- 页数：40P 全彩
- 发行时间：2025年秋

## 购买与联系方式（来自 csd20.vue）

如需购买或了解更多信息，请加入社团交流群：748966747
或邮件联系：contact@secret-sealing.club

## 画册部分作品预览（来自 csd20.vue）

预览图（渲染顺序）：

1. `宣传图12.webp`（alt：预览1）
2. `宣传图10.webp`（alt：预览2）

## 音乐简介（来自 csd20music.vue）

这首曲子，原曲《童祭》给我留下了很深的印象，于是在梦违20周年纪念册当中，用这首进行二创，作为特典nfc的附赠曲。

欢迎大家试听和下载，也欢迎在社团交流群分享你的感受与建议！

## 制作信息（来自 csd20music.vue，原为一个 ul 列表）

- 曲名：梦祀之始
- 作曲：Tama_Evans
- 作者QQ：1730515208
- 时长：3分33秒
- 发行时间：2025年秋

## 作者寄语（来自 csd20music.vue，逐字抄录，不摘要）

这首是我在喜欢东方和喜欢秘封时期所作出的第一首无偿曲子，献给大家。在这首曲子，首次试了试混响，也尽可能加入更多的音色，然后又保持原曲《童祭》的那种偏隆重的感觉。第一部分开头到变调之前主要简单的修改了原曲，加入了更为和谐的吉他部分。在第二部分变调之后，将曲子升华，带入了重逢新生的感觉。
这首曲子同时也包含着我对秘封和音乐编写的热爱，很高兴参与这次梦违20周年纪念册活动。我希望能够认识很多喜欢东方音乐的，也同时希望全国有更多秘封爱好者，能携手共进，一同创作下去！
新手作曲，请大佬多多包涵，如果您还有什么更好的建议（针对这个曲子），请留言于邮箱。
