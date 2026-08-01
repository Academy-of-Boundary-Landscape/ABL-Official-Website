<template>
  <n-card :bordered="false" class="projects-bar">
    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      empty-text=">> 暂无作品。"
      @retry="refresh"
    >
      <div class="carousel-shell">
        <n-carousel
          v-model:current-index="currentIndex"
          :autoplay="projects.length > 1"
          :interval="6000"
          show-arrow
          dots-type="line"
          class="projects-carousel"
        >
          <div
            v-for="project in projects"
            :key="project.id"
            class="carousel-slide"
            :style="{
              backgroundImage: project.coverUrl ? `url(${project.coverUrl})` : undefined,
            }"
          >
            <div class="slide-overlay"></div>
            <div class="slide-content">
              <span v-if="project.nowStatus" class="status-chip">
                {{ project.nowStatusLabel }}
              </span>
              <h3>{{ project.title }}</h3>
              <p v-if="project.date">{{ project.date }}</p>
              <RouterLink v-if="project.link" :to="project.link" class="slide-link">
                查看作品
              </RouterLink>
            </div>
          </div>
        </n-carousel>

        <div v-if="currentProject" class="project-summary">
          <div class="summary-header">
            <h4>{{ currentProject.title }}</h4>
            <span v-if="currentProject.date" class="summary-date">{{ currentProject.date }}</span>
          </div>
          <p class="summary-content">
            {{ currentProject.content || '暂无作品介绍。' }}
          </p>
        </div>

        <div v-else class="project-empty">暂无作品可展示。</div>
      </div>
    </AsyncBoundary>
  </n-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { NCard, NCarousel } from 'naive-ui'
import { getStrapiMedia } from '@/composables/strapi'
import { useWorkList } from '@/composables/useWorks'
import { statusLabel } from '@/utils/work'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

const { data: rawProjects, loading, error, isEmpty, refresh } = useWorkList({ limit: 6 })

const projects = computed(() =>
  rawProjects.value.map((item) => ({
    id: item.id,
    title: item.title || '未命名作品',
    date: item.startDate || '',
    content: item.summary || '',
    // work 一律有 slug，站内路径可以直接拼，不再需要额外的路径拼接辅助函数
    link: `/works/${item.slug}`,
    nowStatus: item.workStatus || '',
    nowStatusLabel: statusLabel(item.workStatus),
    coverUrl: getStrapiMedia(item.coverImage),
  })),
)

const currentIndex = ref(0)
const currentProject = computed(() => projects.value[currentIndex.value])

// 数据刷新后列表长度可能变化，重置到第一张避免索引越界
watch(projects, () => {
  currentIndex.value = 0
})
</script>

<style scoped>
.projects-bar {
  padding: 0;
  overflow: hidden;
  background-color: #1b1f27;
}

.carousel-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.projects-carousel {
  height: 190px; /* 窄屏默认值；桌面（md 及以上）见下方 @screen md 覆盖 */
}

.carousel-slide {
  position: relative;
  height: 190px; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  background-color: #202534;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  border-radius: 14px;
  overflow: hidden;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(8, 10, 15, 0.92), rgba(8, 10, 15, 0.35));
}

.slide-content {
  position: relative;
  z-index: 1;
  padding: 1rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  color: #fff;
  max-width: 100%; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
}

.slide-content h3 {
  margin: 0.25rem 0 0.45rem;
  font-size: 1.15rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  letter-spacing: 0.02em;
}

.slide-content p {
  margin: 0;
  opacity: 0.85;
}

.slide-link {
  display: inline-flex;
  align-items: center;
  margin-top: 0.8rem;
  padding: 0.42rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  backdrop-filter: blur(6px);
  transition: background 0.2s ease;
}

.slide-link:hover {
  background: rgba(255, 255, 255, 0.24);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.project-summary {
  background: #242a35;
  border-radius: 16px;
  padding: 0.9rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  color: #f5f7ff;
}

.summary-header {
  display: flex;
  flex-direction: column; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  justify-content: space-between;
  align-items: flex-start; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  gap: 1rem;
  margin-bottom: 0.4rem;
}

.summary-header h4 {
  margin: 0;
  font-size: 1.05rem;
}

.summary-date {
  font-size: 0.8rem;
  opacity: 0.7;
}

.summary-content {
  margin: 0;
  opacity: 0.9;
  white-space: pre-line;
}

.project-empty {
  padding: 1.5rem;
  border-radius: 12px;
  background: #242a35;
  color: #cbd5f5;
  text-align: center;
}

/* 移动优先：上方为窄屏默认值，md 及以上覆盖为桌面值 */
@screen md {
  .projects-carousel,
  .carousel-slide {
    height: 280px;
  }

  .slide-content {
    max-width: 70%;
    padding: 1.4rem;
  }

  .slide-content h3 {
    font-size: 1.65rem;
  }

  .project-summary {
    padding: 1.1rem 1.25rem;
  }

  .summary-header {
    flex-direction: row;
    align-items: baseline;
  }
}
</style>
