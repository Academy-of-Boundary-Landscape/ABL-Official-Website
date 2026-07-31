<template>
  <div class="zyzView">
    <section class="page-header">
      <div class="header-content">
        <h1 class="title">东方朱元璋</h1>
        <p class="subtitle">Hidden Guillotine in Nine Kindreds</p>
      </div>
    </section>

    <div class="gallery">
      <!-- 你可以在这里放游戏的截图 -->
      <img src="@/assets/images/zyz_title.png" alt="游戏截图1">
      <img src="@/assets/images/zyz_screenshot.png" alt="游戏截图2">
    </div>

    <div class="content-section">
      <h2>// 游戏介绍</h2>
      <p>本游戏是东方天空璋的恶搞向魔改二创模组《东方朱元璋》，这个魔改修改了游戏几乎所有的UI和艺术设计，目前完成了博丽灵梦(蓝玉)线路1到6面的原创对话剧情</p>
      <p>当前版本号为洪武-乙，在之后会进行更新，请关注我们</p>
    </div>

    <div class="content-section">
      <h2>// 制作名单</h2>
      <el>
        <li>魔改：Renko_1055</li>
        <li>UI设计和修改：Renko_1055</li>
        <li>立绘与自机点阵：SBT-GB</li>
        <li>历史考据和指导：OneFan</li>
        <li>魔改工具：thtk & thcrap</li>
      </el>
    </div>
    <div class="content-section">
      <h2>// 关于作品</h2>
      <p>
      本游戏是东方天空璋的恶搞向魔改二创模“东方朱元璋”，我们利用thtk系列的解包工具，基于thcrap对原作进行魔改。
      并在2025年7月6日初次部署于南京的东方project同人展会的stg环节。经现场和内测反馈，这是该模组第一次更新，修复了一些游戏bug，微调部分内容。
      </p>

      <p>
      在《东方天空璋》发布之后, 社区内有一些网友玩梗称作品boss可能是“朱元璋”(因为按照惯例,东方系列boss名字很有可能包含标题相同的字)，
      经诸多同好在网络上一些时间的讨论和二次创作之后,伟大的BounceTigger老师制作了一个恶搞向的二创模组,
       以“东方朱元璋”为名, 在2018年8月和10月分别发布了两个版本,包含了一面和二面的内容。
      </p>
      <p>
      我在最近一年了解到基于thtk工具的东方原作魔改技术, 并在同人社区诸位同好的指导下进行了研究学习。
      在2025年上半年，我偶然看到了BounceTigger老师最初的“东方朱元璋”二创模组，并计划与合作者们开发一个完整版的《东方朱元璋》
      伟大的OneFan老师与SBT-GB老师分别提供了历史指导和人物立绘绘制，为这个项目做出了巨大的贡献。
      </p>

      <p>
      我们希望这个模组能给大家带来欢乐(确实很欢乐), 也希望大家能够在游戏中感受到一些历史文化的趣味性。
      但请注意, 本模组并不旨在严肃地讨论历史事件或人物, 而是以娱乐和二次创作的方式来呈现。
      我个人并不是明初历史的专家，因而实际上，剧情中出现的角色形象实际上是“历史人物meme的集合”(详情可见游戏剧情)，
      所以在制作过程中，很多地方都只是为了娱乐而进行的恶搞和二创。我们希望玩家能够以轻松的心态来玩这个游戏，而不是将其与现实历史事件和人物进行直接关联。
      </p>
    </div>
    
    <div class="download-section">
      <h2>// 游戏下载</h2>
      <a href="https://pan.baidu.com/s/17TUVFo3Fcj7SalQU1L6hLg?pwd=1055" class="download-button" target="_blank">
        百度网盘下载游戏 提取码：1055
      </a>
      <p class="notice">游戏资源较大，请耐心等待。下载链接为网盘资源。</p>
      <a href="https://www.bilibili.com/video/BV1q3MQzLERR" class="bilibili-button" target="_blank">
        观看游戏宣传视频
      </a>
    </div>


  </div>
</template>

<style scoped>
.game-project-view h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--color-text);
  margin-bottom: 3rem;
  font-style: italic;
}

.gallery img {
  max-width: 100%;
  border: 1px solid var(--color-border);
  margin-bottom: 3rem;
}

.content-section {
  margin-bottom: 3rem;
}

.content-section h2 {
  font-size: 2rem;
  color: var(--color-accent);
  margin-bottom: 1.5rem;
}

.content-section p {
  line-height: 1.8;
}

.content-section ul {
  list-style: none;
  padding-left: 0;
}

.content-section li::before {
  content: '>';
  margin-right: 1rem;
  color: var(--color-accent);
}

.download-section {
  text-align: center;
  padding: 2rem;
  border: 1px dashed var(--color-border);
}

.download-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background-color: var(--color-accent);
  color: var(--color-background);
  font-family: var(--font-family-heading);
  font-size: 1.5rem;
  text-shadow: none;
  border: 2px solid var(--color-accent);
  transition: all 0.3s ease;
}

.download-button:hover {
  background-color: transparent;
  color: var(--color-accent);
  box-shadow: 0 0 20px var(--color-accent);
}
.gallery img {
  width: 30%; /* 调整图片宽度以适应容器 */
  margin: 5px; /* 图片之间的间距 */
  border-radius: 8px; /* 可选：圆角效果 */
  box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* 可选：阴影效果 */
}

.gallery {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}
.notice {
  margin-top: 1rem;
  font-size: 0.9rem;
  /* var(--vt-c-white-soft) 是脚手架遗留变量，从未被定义过，一直是空转 */
  color: var(--color-text-muted);
}
</style>