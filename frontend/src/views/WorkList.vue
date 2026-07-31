<template>
  <div class="work-list-view container">
    <header class="page-header">
      <h1 class="section-title">作品 // Works</h1>
      <p class="page-lead">为了做二创游戏，我们造了做二创游戏的工具，然后把工具开源给了所有人。</p>
    </header>

    <nav class="type-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="type-tab"
        :class="{ 'is-active': activeType === tab.value }"
        @click="activeType = tab.value"
      >
        {{ tab.label }}
      </button>
    </nav>

    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      empty-text=">> 该分类下暂无作品。"
      @retry="refresh"
    >
      <div class="work-grid">
        <WorkCard v-for="work in data" :key="work.id" :work="work" />
      </div>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWorkList } from '@/composables/useWorks'
import { typeLabel } from '@/utils/work'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import WorkCard from '@/components/work/WorkCard.vue'

// site 与 publication 合并进"其他"：各自只有个位数条目，单独开页签是空架子
const activeType = ref('all')

const tabs = computed(() => [
  { value: 'all', label: '全部' },
  { value: 'game', label: typeLabel('game') },
  { value: 'tool', label: typeLabel('tool') },
  { value: 'other', label: '其他' },
])

// "其他"要一次拿 site 与 publication 两类，用 $in 而不是 $eq，
// 所以这里不能直接把 activeType 交给 useWorkList 的 workType。
const workType = computed(() => (activeType.value === 'other' ? 'all' : activeType.value))

const { data: rawData, loading, error, refresh } = useWorkList({ workType })

const data = computed(() => {
  const list = rawData.value ?? []
  if (activeType.value !== 'other') return list
  return list.filter((w) => w?.workType === 'site' || w?.workType === 'publication')
})

// isEmpty 要看前端过滤之后的结果，不是资源层的原始列表——
// 否则"其他"页签在过滤光时会误判为非空，渲染出一个空网格。
const isEmpty = computed(() => !loading.value && !error.value && data.value.length === 0)
</script>

<style scoped>
.page-lead {
  color: var(--color-text-muted);
  max-width: 42rem;
  line-height: 1.8;
}

.type-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.type-tab {
  padding: 0.4rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.type-tab:hover {
  color: var(--color-heading);
  border-color: var(--color-hover-border);
}

.type-tab.is-active {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.work-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* 移动优先：窄屏单列，sm 起两列，lg 起三列 */
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
</style>
