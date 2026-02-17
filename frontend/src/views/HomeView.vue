<template>
  <div class="home-view container">
    <!-- 头部：更紧凑的标题 -->
    <section class="page-header">
      <div class="header-content">
        <h1 class="title">境界景观学会</h1>
        <p class="subtitle">In search of the vacua where phantasm resides.</p>
      </div>
    </section>

    <!-- 项目展示 -->
    <TechSection title="社团线上项目" custom-class="projects-top-section">
      <ProjectsBar />
    </TechSection>

    <!-- 最新动态 & 展会 (关键修改区) -->
    <section v-if="recentEvents.length > 0" class="events-conventions-grid">
      <!-- 左侧：事件列表 -->
      <TechSection title="最新动态 / EVENTS" custom-class="event-section">
        <div class="events-compact-list">
          <EventCard v-for="event in recentEvents" :key="event.id" :event="event" />
        </div>
      </TechSection>

      <!-- 右侧：展会 Timeline -->
      <TechSection title="近期展会 / EXP" custom-class="convention-section">
        <div class="timeline-wrapper">
          <n-timeline v-if="upcomingConventions.length > 0">
            <n-timeline-item
              v-for="conv in upcomingConventions"
              :key="conv.id"
              type="info"
              :title="conv.name"
              :content="'QQ群: ' + conv.qqgroup"
              :time="conv.date"
            />
          </n-timeline>
          <p v-else class="empty-text">暂无即将参加的展会</p>
        </div>
      </TechSection>
    </section>

    <!-- 主布局：制品与介绍 -->
    <div class="main-layout">
      <!-- 左侧：最新制品 (侧边栏) -->
      <aside class="sidebar">
        <TechSection title="最新制品" custom-class="sidebar-content">
          <div v-if="recentProducts.length > 0" class="products-list">
            <ProductCard v-for="product in recentProducts" :key="product.id" :product="product" />
          </div>
          <p v-else class="empty-text">暂无新品发布</p>
        </TechSection>
      </aside>

      <!-- 右侧：主内容区 -->
      <main class="main-content">
        <TechSection title="基本介绍 / INTRODUCTION" custom-class="intro-section" :show-dot="false">
          <div class="article-body">
            <p>
              <strong>境界景观学会</strong>
              是一个秘封组(广义)中心的东方project同人社团，创立于2025年8月8日。
            </p>
            <p>
              结合专业本领与跨学科研究，探索新奇的创作形式。社团官网本身亦是“境界观测”的项目成果之一。
            </p>
          </div>

          <n-divider dashed />

          <h3 class="subsection-title">联系我们 / CONTACT</h3>
          <div class="contact-grid">
            <div class="contact-item"><span>QQ群:</span> 748966747</div>
            <div class="contact-item"><span>Email:</span> contact@secret-sealing.club</div>
          </div>

          <n-divider dashed />

          <h3 class="subsection-title">社团设定 / SETTINGS</h3>
          <div class="article-body setting-text">
            <p>
              “境界景观学会”是一个多元宇宙研究实体，由无数时间线中的“宇佐见莲子”与“玛艾露贝莉·赫恩”构成。
            </p>
            <p class="highlight">
              我们的核心理论建立在<strong>“境界景观”（Boundary Landscape）</strong
              >假说之上：境界本身是一种独立于时空的物理自由度。
            </p>
            <p>
              正如“弦景观”中海量的真空构型，每一种“境界真空构型”对应一个独特的平行宇宙。我们在不同宇宙间实现了“穿梭”，并联合起来构建境界的系统性理论。
            </p>
          </div>
        </TechSection>
      </main>
    </div>

    <router-link to="/recruitment" class="floating-recruit-btn">加入我们</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '@/composables/strapi'
import { NTimeline, NTimelineItem, NDivider } from 'naive-ui'
import ProjectsBar from '@/components/ProjectsBar.vue'
import ProductCard from '@/components/ProductCard.vue'
import EventCard from '@/components/EventCard.vue'
import TechSection from '@/components/TechSection.vue'

const recentProducts = ref([])
const recentEvents = ref([])
const upcomingConventions = ref([])

const fetchRecentData = async () => {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const [productsResponse, eventsResponse, conventionResponse] = await Promise.all([
      apiClient.get('/products', {
        params: { sort: 'releaseDate:desc', 'pagination[limit]': 3, populate: 'coverImage' },
      }),
      apiClient.get('/events', {
        params: { sort: 'date:desc', 'pagination[limit]': 3, populate: 'coverImage' },
      }),
      apiClient.get('/conventions', {
        params: { sort: 'date:asc', 'filters[date][$gte]': today, 'pagination[limit]': 4 },
      }),
    ])
    recentProducts.value = productsResponse.data.data || []
    recentEvents.value = eventsResponse.data.data || []
    upcomingConventions.value = conventionResponse.data.data || []
  } catch (error) {
    console.error('无法获取主页动态数据:', error)
  }
}

onMounted(fetchRecentData)
</script>

<style scoped>
/* --- 全局紧凑化定义 --- */
.home-view {
  padding-bottom: 50px;
}

/* --- Header 优化 --- */
.page-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin: 40px 0 30px; /* 缩小间距 */
}
.page-header::before,
.page-header::after {
  content: '';
  flex-grow: 1;
  height: 1px; /* 细线条更有科技感 */
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
}
.page-header .title {
  font-size: 2.2rem; /* 减小标题 */
  letter-spacing: 4px;
  margin-bottom: 0.2rem;
}
.page-header .subtitle {
  font-size: 0.85rem;
  font-family: 'Courier New', Courier, monospace;
  opacity: 0.7;
}

/* --- 事件与展会 2栏布局 --- */
.events-conventions-grid {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  gap: 16px;
  margin: 16px 0;
}

.events-compact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-wrapper {
  padding: 10px 5px;
}

/* 微调 Timeline 样式以适应深色背景 */
:deep(.n-timeline-item-content__title) {
  font-size: 0.9rem !important;
  font-weight: 600;
  color: #efefef;
}
:deep(.n-timeline-item-content__meta) {
  font-size: 0.75rem !important;
  color: var(--color-accent) !important;
  font-family: monospace;
}

/* --- 主内容布局 --- */
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr; /* 固定左侧宽度 */
  gap: 20px;
  margin-top: 20px;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-body {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #ccc;
}

.subsection-title {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--color-accent);
}

.setting-text {
  font-size: 0.88rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 4px;
}

.highlight {
  color: var(--color-accent);
  border-left: 2px solid var(--color-accent);
  padding-left: 10px;
  margin: 10px 0;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  font-family: monospace;
}

.empty-text {
  font-size: 0.8rem;
  opacity: 0.5;
  text-align: center;
  padding: 20px;
}

.floating-recruit-btn {
  position: fixed;
  right: 24px;
  top: 56%;
  transform: translateY(-50%);
  z-index: 30;
  padding: 0.72rem 0.82rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.16em;
  font-size: 0.8rem;
  color: var(--color-heading);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-left: 3px solid #ffffff;
  border-right: 3px solid #ffffff;
  background: linear-gradient(135deg, rgba(10, 15, 26, 0.92), rgba(5, 8, 16, 0.92));
  clip-path: polygon(
    0 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.16),
    inset 0 0 10px rgba(255, 255, 255, 0.06);
  transition:
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.floating-recruit-btn:hover {
  transform: translateY(-50%) translateX(-2px);
  border-color: #9ac0ff;
  border-left-color: #b09dff;
  border-right-color: #b09dff;
  box-shadow:
    0 0 20px rgba(114, 186, 255, 0.32),
    0 0 40px rgba(170, 126, 255, 0.22),
    inset 0 0 24px rgba(132, 176, 255, 0.12);
}

/* --- 响应式处理 --- */
@media (max-width: 992px) {
  .events-conventions-grid,
  .main-layout {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .floating-recruit-btn {
    right: 10px;
    top: auto;
    bottom: 84px;
    transform: none;
    writing-mode: horizontal-tb;
    letter-spacing: 0.08em;
    font-size: 0.74rem;
    padding: 0.48rem 0.72rem;
  }

  .floating-recruit-btn:hover {
    transform: translateX(-2px);
  }
}
</style>
