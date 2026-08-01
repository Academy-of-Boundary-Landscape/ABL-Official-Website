<template>
  <div class="home-view container">
    <section class="page-header flex flex-col items-center text-center gap-4 lg:flex-row lg:gap-8">
      <div>
        <h1 class="title">境界景观学会</h1>
        <p class="subtitle">In search of the vacua where phantasm resides.</p>
      </div>
    </section>

    <!-- page:home 记录存在时渲染，不存在则整块不渲染。
         定位陈述由社团方自行撰写，本轮不写文案，只留口子。 -->
    <ContentBlocks v-if="homeBlocks.length" :blocks="homeBlocks" />

    <AsyncBoundary
      :loading="worksLoading"
      :error="worksError"
      :empty="worksEmpty"
      empty-text=">> 暂无作品。"
      @retry="refreshWorks"
    >
      <WorkHero v-if="heroWork" :work="heroWork" />
      <div v-if="gridWorks.length" class="work-grid">
        <WorkCard v-for="work in gridWorks" :key="work.id" :work="work" />
      </div>
      <RouterLink to="/works" class="section-more-link">&gt;&gt; 查看全部作品</RouterLink>
    </AsyncBoundary>

    <TechSection title="最新动态 / NEWS">
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
        <RouterLink to="/news" class="section-more-link">&gt;&gt; 查看全部动态</RouterLink>
      </AsyncBoundary>
    </TechSection>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import EventCard from '@/components/EventCard.vue'
import TechSection from '@/components/TechSection.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import WorkHero from '@/components/work/WorkHero.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import { useWorkList } from '@/composables/useWorks'
import { useEvents } from '@/composables/useEvents'
import { usePageBySlug } from '@/composables/usePages'

// 排序第一条占大图位（featured:desc, order:desc, startDate:desc），
// 其余走网格。featured 的职责由此具体化为「谁占大图位」。
// limit 7 = hero 占一条 + 网格 6 条，正好铺满两行三列；同时不把全部 11
// 条作品里的 9 条都堆在首页，给 /works 留下继续点进去看的理由。
const {
  data: works,
  loading: worksLoading,
  error: worksError,
  isEmpty: worksEmpty,
  refresh: refreshWorks,
} = useWorkList({ limit: 7 })

const heroWork = computed(() => works.value?.[0] ?? null)
const gridWorks = computed(() => (works.value ?? []).slice(1))

const {
  data: recentEvents,
  loading: eventsLoading,
  error: eventsError,
  isEmpty: eventsEmpty,
  refresh: refreshEvents,
} = useEvents({ limit: 3 })

// page:home 缺失时 data 为 null，homeBlocks 为空数组，整块不渲染
const { data: homePage } = usePageBySlug('home')
const homeBlocks = computed(() => homePage.value?.body ?? [])
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

/* --- 作品网格（移动优先） --- */
.work-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

@screen sm {
  .work-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@screen lg {
  .work-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* --- 最新动态 --- */
.events-compact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* --- 区块末尾的终端风"更多"入口，风格照 WorkDetail.vue 里 >> 前缀的写法 --- */
.section-more-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--color-accent);
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
  text-decoration: none;
}

.section-more-link:hover {
  text-decoration: underline;
}
</style>
