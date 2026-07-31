<!-- src/views/ProductList.vue -->
<template>
  <div class="product-list-view container">
    <section class="page-header">
      <h1 class="title">// 社团制品一览</h1>
      <p class="subtitle">>> Accessing archive of all released products.</p>
    </section>

    <div class="controls-wrapper tech-box">
      <CategoryFilter :categories="categories" v-model="selectedCategory" />
      <div class="search-group">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="搜索制品标题..."
          class="search-input"
        />
      </div>
      <button @click="toggleSortOrder" class="sort-button">排序: {{ sortButtonText }}</button>
    </div>

    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      empty-text=">> 没有符合条件的制品。"
      @retry="refresh"
    >
      <div class="product-grid">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProducts } from '@/composables/useProducts'
import ProductCard from '@/components/ProductCard.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

// --- 状态管理 ---
// 默认值沿用改造前的“全部”，保持 CategoryFilter 初始展示不变
// （useProducts 里 category 为空字符串或 '全部' 都不会附加过滤条件，两者等价）
const selectedCategory = ref('全部')
const searchTerm = ref('')
const sortOrder = ref('desc')

const {
  data: products,
  loading,
  error,
  isEmpty,
  refresh,
} = useProducts(
  {
    category: selectedCategory,
    search: searchTerm,
    sort: () => `releaseDate:${sortOrder.value}`,
  },
  { debounce: 300 },
)

// 分类去重：拉一份较大的全量制品列表，前端 Set 去重。
// 按 spec 第 5 节，本轮只做搬迁，不改这个已知低效的算法。
const { data: categorySource } = useProducts({ limit: 200 })
const categories = computed(() => [
  '全部',
  ...new Set((categorySource.value ?? []).map((p) => p.category).filter(Boolean)),
])

// --- 用户交互处理 ---
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const sortButtonText = computed(() => {
  return sortOrder.value === 'desc' ? '最新发布' : '最早发布'
})
</script>

<style scoped>
/* 样式部分保持完全不变 */
/* 从 main.css 移回本页（仅 1 处使用，不需要占据全局命名空间） */
.product-list-view.container {
  max-width: 1800px; /* 或更大，根据需要调整 */
  margin: 0 auto;
  padding: 0 2rem;
}

.controls-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 4rem;
  padding: 1.5rem;
}

.search-group {
  flex-grow: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  border-color: var(--color-accent);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  padding-bottom: 80px;
}

.sort-button {
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  white-space: nowrap; /* 防止文字换行 */
}

.sort-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
