<template>
  <n-card :bordered="false" class="projects-bar">
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
            <a
              v-if="project.link && isExternalLink(project.link)"
              :href="project.link"
              class="slide-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              查看项目
            </a>
            <RouterLink
              v-else-if="project.link"
              :to="toInternalProjectPath(project.link)"
              class="slide-link"
            >
              查看项目
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
          {{ currentProject.content || '暂无项目介绍。' }}
        </p>
      </div>

      <div v-else class="project-empty">暂无项目可展示。</div>
    </div>
  </n-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { NCard, NCarousel } from 'naive-ui'
import { apiClient, getStrapiMedia } from '@/composables/strapi'

const projects = ref([])
const currentIndex = ref(0)

const statusLabels = {
  preview: '预告',
  ongoing: '进行中',
  ended: '已结束',
  continuous: '持续更新',
}

const currentProject = computed(() => projects.value[currentIndex.value])

const isExternalLink = (link = '') => /^https?:\/\//i.test(link)

const toInternalProjectPath = (link = '') => {
  if (!link) return '/project'
  if (link.startsWith('/')) return link
  return `/project/${link}`
}

const normalizeProjects = (items = []) =>
  items
    .map((item) => {
      const attrs = item?.attributes || item
      return {
        id: item?.id ?? attrs?.id ?? attrs?.documentId ?? attrs?.title,
        title: attrs?.title || '未命名项目',
        date: attrs?.date || '',
        content: attrs?.content || '',
        link: attrs?.link || '',
        nowStatus: attrs?.nowStatus || '',
        nowStatusLabel: statusLabels[attrs?.nowStatus] || attrs?.nowStatus || '',
        coverUrl: getStrapiMedia(attrs?.coverImage),
      }
    })
    .filter((project) => project.title)

const fetchProjects = async () => {
  try {
    const response = await apiClient.get('/projects', {
      params: {
        sort: 'date:desc',
        'pagination[limit]': 6,
        populate: 'coverImage',
      },
    })

    const data = response.data?.data || response.data || []
    projects.value = normalizeProjects(data)
    currentIndex.value = 0
  } catch (error) {
    console.error('无法获取项目数据:', error)
    projects.value = []
  }
}

onMounted(fetchProjects)
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
  height: 280px;
}

.carousel-slide {
  position: relative;
  height: 280px;
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
  padding: 1.4rem;
  color: #fff;
  max-width: 70%;
}

.slide-content h3 {
  margin: 0.25rem 0 0.45rem;
  font-size: 1.65rem;
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
  padding: 1.1rem 1.25rem;
  color: #f5f7ff;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
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

@media (max-width: 768px) {
  .projects-carousel,
  .carousel-slide {
    height: 190px;
  }

  .slide-content {
    max-width: 100%;
    padding: 1rem;
  }

  .slide-content h3 {
    font-size: 1.15rem;
  }

  .project-summary {
    padding: 0.9rem;
  }

  .summary-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
