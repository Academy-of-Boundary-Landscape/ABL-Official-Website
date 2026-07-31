<template>
  <div class="csd20musicView">
    <section class="page-header">
      <div class="header-content">
        <h1 class="title">梦违科学世纪20周年主题曲</h1>
        <p class="subtitle">纪念专辑 · 官方音乐试听与下载</p>
      </div>
    </section>

    <div class="main-layout">
      <!-- 左侧：音乐播放器与下载 -->
      <aside class="sidebar">
        <div class="tech-box">
          <h2 class="box-title">主题曲试听</h2>
          <audio :src="musicUrl" controls style="width: 100%; margin-bottom: 1rem"></audio>
        </div>
      </aside>

      <!-- 右侧：音乐介绍 -->
      <main class="main-content">
        <div class="tech-box">
          <h1>音乐简介</h1>
          <p>
            这首曲子，原曲《童祭》给我留下了很深的印象，于是在梦违20周年纪念册当中，用这首进行二创，作为特典nfc的附赠曲。
          </p>
          <p>欢迎大家试听和下载，也欢迎在社团交流群分享你的感受与建议！</p>
        </div>
        <hr class="divider" />
        <div class="tech-box">
          <h2>制作信息</h2>
          <ul>
            <li><strong>曲名：</strong> 梦祀之始</li>
            <li><strong>作曲：</strong> Tama_Evans</li>
            <li><strong>作者qq：</strong> 1730515208</li>
            <li><strong>时长：</strong> 3分33秒</li>
            <li><strong>发行时间：</strong> 2025年秋</li>
          </ul>
        </div>
      </main>
    </div>

    <div style="height: 40px"></div>

    <section class="tech-box">
      <h2 class="box-title">作者寄语</h2>
      <p>
        这首是我在喜欢东方和喜欢秘封时期所作出的第一首无偿曲子，献给大家。在这首曲子，首次试了试混响，也尽可能加入更多的音色，然后又保持原曲《童祭》的那种偏隆重的感觉。第一部分开头到变调之前主要简单的修改了原曲，加入了更为和谐的吉他部分。在第二部分变调之后，将曲子升华，带入了重逢新生的感觉。
        这首曲子同时也包含着我对秘封和音乐编写的热爱，很高兴参与这次梦违20周年纪念册活动。我希望能够认识很多喜欢东方音乐的，也同时希望全国有更多秘封爱好者，能携手共进，一同创作下去！
        新手作曲，请大佬多多包涵，如果您还有什么更好的建议（针对这个曲子），请留言于邮箱。
      </p>
    </section>
  </div>
</template>

<script setup>
import musicUrl from '@/assets/images/csd20related/csd20_theme.mp3'
</script>
