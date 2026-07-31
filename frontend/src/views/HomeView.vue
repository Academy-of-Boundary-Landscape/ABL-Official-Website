<template>
  <div class="home-view container">
    <!-- 头部：更紧凑的标题 -->
    <section class="page-header flex flex-col items-center text-center gap-4 lg:flex-row lg:text-left lg:gap-8">
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
    <section class="events-conventions-grid grid gap-4 my-4 grid-cols-1 lg:grid-cols-[1.8fr_1.2fr]">
      <!-- 左侧：事件列表 -->
      <TechSection title="最新动态 / EVENTS" custom-class="event-section">
        <AsyncBoundary
          :loading="eventsLoading"
          :error="eventsError"
          :empty="eventsEmpty"
          empty-text=">> 暂无最新动态。"
          @retry="refreshEvents"
        >
          <div class="events-compact-list">
            <EventCard v-for="event in recentEvents" :key="event.id" :event="event" />
          </div>
        </AsyncBoundary>
      </TechSection>

      <!-- 右侧：展会 Timeline -->
      <TechSection title="近期展会 / EXP" custom-class="convention-section">
        <div class="timeline-wrapper">
          <AsyncBoundary
            :loading="conventionsLoading"
            :error="conventionsError"
            :empty="conventionsEmpty"
            skeleton="text"
            empty-text=">> 暂无即将参加的展会。"
            @retry="refreshConventions"
          >
            <n-timeline>
              <n-timeline-item
                v-for="conv in upcomingConventions"
                :key="conv.id"
                type="info"
                :title="conv.name"
                :content="'QQ群: ' + conv.qqgroup"
                :time="conv.date"
              />
            </n-timeline>
          </AsyncBoundary>
        </div>
      </TechSection>
    </section>

    <!-- 主布局：制品与介绍 -->
    <div class="main-layout grid gap-5 mt-5 grid-cols-1 lg:grid-cols-[280px_1fr]">
      <!-- 左侧：最新制品 (侧边栏) -->
      <aside class="sidebar">
        <TechSection title="最新制品" custom-class="sidebar-content">
          <AsyncBoundary
            :loading="productsLoading"
            :error="productsError"
            :empty="productsEmpty"
            skeleton="list"
            empty-text=">> 暂无新品发布。"
            @retry="refreshProducts"
          >
            <div class="products-list">
              <ProductCard v-for="product in recentProducts" :key="product.id" :product="product" />
            </div>
          </AsyncBoundary>
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
import { NTimeline, NTimelineItem, NDivider } from 'naive-ui'
import ProjectsBar from '@/components/ProjectsBar.vue'
import ProductCard from '@/components/ProductCard.vue'
import EventCard from '@/components/EventCard.vue'
import TechSection from '@/components/TechSection.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import { useProducts } from '@/composables/useProducts'
import { useEvents } from '@/composables/useEvents'
import { useConventions } from '@/composables/useConventions'

const {
  data: recentProducts,
  loading: productsLoading,
  error: productsError,
  isEmpty: productsEmpty,
  refresh: refreshProducts,
} = useProducts({ limit: 3 })

const {
  data: recentEvents,
  loading: eventsLoading,
  error: eventsError,
  isEmpty: eventsEmpty,
  refresh: refreshEvents,
} = useEvents({ limit: 3 })

const {
  data: upcomingConventions,
  loading: conventionsLoading,
  error: conventionsError,
  isEmpty: conventionsEmpty,
  refresh: refreshConventions,
} = useConventions({ upcoming: true, limit: 4 })
</script>

<style scoped>
/* --- 全局紧凑化定义 --- */
.home-view {
  padding-bottom: 50px;
}

/* --- Header 优化 --- */
.page-header {
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
  font-family: var(--font-family-mono);
  opacity: 0.7;
}

/* --- 事件与展会 2栏布局 --- */
.events-compact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-wrapper {
  padding: 10px 5px;
}

/* 微调 Timeline 样式以适应深色背景
 * 保留（未按 Task 9 Step 3 删除）：themeOverrides.Timeline（theme.js）目前不足以完全接管这两条规则——
 * - titleFontSize 与 Naive UI 期望的 key（titleFontSizeMedium）不一致，覆盖未生效；
 * - 标题 font-weight:600 无对应的 themeOverrides 字段，全局 fontWeightStrong 默认是 500；
 * - meta 的 font-family（这里用于展会日期的等宽字体）在 Naive UI 里完全没有暴露主题变量。
 * 删除会导致标题变细、展会日期从等宽字体变回正文字体，是可感知的视觉回退。
 * 本批次不允许改动 theme.js（超出 HomeView.vue 范围），故保留 :deep，留给 Task 3 后续修正。
 */
:deep(.n-timeline-item-content__title) {
  font-size: 0.9rem !important;
  font-weight: 600;
  color: #efefef;
}
:deep(.n-timeline-item-content__meta) {
  font-size: 0.75rem !important;
  color: var(--color-accent) !important;
  font-family: var(--font-family-mono);
}

/* --- 主内容布局 --- */
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
  font-family: var(--font-family-mono);
}

.floating-recruit-btn {
  position: fixed;
  /* --- 响应式处理：以下 7 项窄屏为默认值，lg: 断点覆盖为桌面值（原 @media (max-width: 992px) 内容） --- */
  right: 10px;
  top: auto;
  bottom: 84px;
  transform: none;
  writing-mode: horizontal-tb;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
  padding: 0.48rem 0.72rem;
  z-index: 30;
  text-orientation: mixed;
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
  transform: translateX(-2px);
  border-color: #9ac0ff;
  border-left-color: #b09dff;
  border-right-color: #b09dff;
  box-shadow:
    0 0 20px rgba(114, 186, 255, 0.32),
    0 0 40px rgba(170, 126, 255, 0.22),
    inset 0 0 24px rgba(132, 176, 255, 0.12);
}

/* 桌面（lg 及以上，1024px+）覆盖：原 @media (max-width: 992px) 之外的默认桌面值，
   现归并到 992px→1024px（接受微差），改写为 UnoCSS 移动优先断点 */
@screen lg {
  .floating-recruit-btn {
    right: 24px;
    top: 56%;
    bottom: auto;
    transform: translateY(-50%);
    writing-mode: vertical-rl;
    letter-spacing: 0.16em;
    font-size: 0.8rem;
    padding: 0.72rem 0.82rem;
  }

  .floating-recruit-btn:hover {
    transform: translateY(-50%) translateX(-2px);
  }
}
</style>
