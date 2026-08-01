<template>
  <div class="about-view container">
    <section class="page-header">
      <h1 class="section-title">关于 // About</h1>
    </section>

    <AsyncBoundary
      :loading="pageLoading"
      :error="pageError"
      :empty="pageNotFound"
      skeleton="text"
      empty-text=">> 关于页正文尚未录入。"
      @retry="refreshPage"
    >
      <ContentBlocks v-if="blocks.length" :blocks="blocks" />
    </AsyncBoundary>

    <section class="about-timeline">
      <h2 class="detail-subtitle">我们走过的路</h2>
      <AsyncBoundary
        :loading="timelineLoading"
        :error="timelineError"
        :empty="timelineEmpty"
        skeleton="text"
        empty-text=">> 暂无记录。"
        @retry="refreshTimeline"
      >
        <ul class="timeline-list">
          <li v-for="item in timeline" :key="item.key" class="timeline-item">
            <span class="timeline-date">{{ item.date || '——' }}</span>
            <span class="timeline-label" :class="`is-${item.kind}`">{{ item.label }}</span>
            <RouterLink v-if="item.to" :to="item.to" class="timeline-title">
              {{ item.title }}
            </RouterLink>
            <span v-else class="timeline-title">{{ item.title }}</span>
          </li>
        </ul>
      </AsyncBoundary>
    </section>

    <section class="about-archive">
      <h2 class="detail-subtitle">存档</h2>
      <p class="about-archive-note">
        社团已停止周边贩售与展会出摊。历史制品保留在
        <RouterLink to="/archive/products">制品归档</RouterLink>。
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import { usePageBySlug } from '@/composables/usePages'
import { useConventions } from '@/composables/useConventions'
import { useWorkList } from '@/composables/useWorks'
import { mergeTimeline } from '@/utils/timeline'

const {
  data: page,
  loading: pageLoading,
  error: pageError,
  notFound: pageNotFound,
  refresh: refreshPage,
} = usePageBySlug('about')
const blocks = computed(() => page.value?.body ?? [])

// 展会全量（9 条），作品全量（11 条）——规模远小于分页上限，不做分页
const {
  data: conventions,
  loading: convLoading,
  error: convError,
  refresh: refreshConventions,
} = useConventions({ limit: 100 })
const {
  data: works,
  loading: worksLoading,
  error: worksError,
  refresh: refreshWorks,
} = useWorkList({ limit: 100 })

const timeline = computed(() => mergeTimeline(conventions.value, works.value))
const timelineLoading = computed(() => convLoading.value || worksLoading.value)
const timelineError = computed(() => convError.value || worksError.value)
// isEmpty 要看合并后的结果，不是任一来源的原始列表
const timelineEmpty = computed(
  () => !timelineLoading.value && !timelineError.value && timeline.value.length === 0,
)
const refreshTimeline = () => {
  refreshConventions()
  refreshWorks()
}
</script>

<style scoped>
.detail-subtitle {
  font-size: 1.1rem;
  color: var(--color-heading);
  margin: 0 0 1rem;
}

.about-timeline,
.about-archive {
  margin: 3rem 0;
}

.timeline-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.timeline-item {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.25rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.timeline-date {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.timeline-label {
  justify-self: start;
  padding: 0.1rem 0.5rem;
  border: 1px solid currentColor;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
}

.timeline-label.is-convention {
  color: var(--color-text-subtle);
}

.timeline-label.is-work {
  color: var(--color-accent);
}

.timeline-title {
  color: var(--color-text);
  text-decoration: none;
}

a.timeline-title:hover {
  color: var(--color-accent);
}

.about-archive-note {
  color: var(--color-text-muted);
  line-height: 1.8;
}

.about-archive-note a {
  color: var(--color-accent);
}

/* 移动优先：窄屏三行堆叠，md 起一行三列 */
@screen md {
  .timeline-item {
    grid-template-columns: 7rem 5rem 1fr;
    align-items: center;
    gap: 1rem;
  }
}
</style>
