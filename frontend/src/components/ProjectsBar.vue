<template>
  <div class="projects-bar-container">

    <!-- 项目一：同人游戏 (内部跳转) -->
    <RouterLink
      to="/project/zhu-yuanzhang"
      class="project-strip"
      :style="{ backgroundImage: `url(${gameThumb})` }"
    >
      <div class="strip-overlay"></div>
      <div class="strip-content">
        <h3>东方朱元璋</h3>
        <p>一个《东方天空璋》完整的魔改版本同人，在这里持续更新</p>
      </div>
    </RouterLink>

    <!-- 项目二：外部网站 (新标签页打开) -->
    <a
      href="https://hourai2025.secret-sealing.club"
      target="_blank"
      rel="noopener noreferrer"
      class="project-strip"
      :style="{ backgroundImage: `url(${externalThumb})` }"
    >
      <div class="strip-overlay"></div>
      <div class="strip-content">
        <h3>2025蓬莱日接力</h3>
        <p>纪念2025.08.11《蓬莱人形》发售23周年的接力创作活动，点击访问项目独立站点。</p>
      </div>
    </a>

    <!-- 如果你还有更多项目，可以继续在这里添加 <RouterLink> 或 <a> -->

  </div>
</template>

<script setup>
// 我们不再需要数据文件，只需要导入图片资源
import { RouterLink } from 'vue-router';
import gameThumb from '@/assets/images/zyz_title.png';
import externalThumb from '@/assets/images/hourai_poster.png';
</script>

<!-- 这里的样式几乎可以完全复用，无需修改 -->
<style scoped>
.projects-bar-container {
  display: flex;
  width: 100%;
  height: 300px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.project-strip {
  position: relative;
  flex: 1;
  height: 100%;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  cursor: pointer;
  transition: flex 0.7s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.project-strip:hover {
  flex: 5;
}

.strip-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(13, 13, 13, 0.7);
  transition: background-color 0.5s ease;
}

.project-strip:hover .strip-overlay {
  background-color: rgba(13, 13, 13, 0.4);
}

.strip-content {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  color: #fff;
  z-index: 2;
  transition: all 0.5s ease;
  transform: translateY(20px);
  opacity: 0;
}

.project-strip:hover .strip-content {
  transform: translateY(0);
  opacity: 1;
}

.strip-content h3 {
  font-size: 1.8rem;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
}

.strip-content p {
  max-width: 300px;
  margin-top: 0.5rem;
  font-family: var(--font-family-body);
}

/* 为了在收缩状态下显示标题，我们可以给标题添加一个不同的样式 */
.project-strip h3 {
  writing-mode: vertical-rl;
  position: absolute;
  top: 2rem;
  left: 1rem;
  opacity: 0.8;
  transition: all 0.5s ease;
}

.project-strip:hover h3 {
  writing-mode: horizontal-tb;
  top: auto;
  bottom: 4rem;
  left: 2rem;
  opacity: 1;
}
</style>