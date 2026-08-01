<!-- src/views/ArchiveProductList.vue -->
<template>
  <div class="archive-product-list-view container">
    <section class="page-header">
      <h1 class="section-title">制品归档 // Archive</h1>
      <p class="archive-note">
        &gt;&gt; 社团已停止周边贩售与展会出摊。以下为历史制品存档，仅供查阅。
      </p>
    </section>

    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      empty-text=">> 归档中暂无制品。"
      @retry="refresh"
    >
      <div class="product-grid">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { useProducts } from '@/composables/useProducts'
import ProductCard from '@/components/ProductCard.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

// 15 条制品远小于分页上限，不做分页；默认排序 releaseDate:desc 正是归档需要的
const { data: products, loading, error, isEmpty, refresh } = useProducts({ limit: 100 })
</script>

<style scoped>
.archive-note {
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* 移动优先：窄屏单列，sm 起两列，lg 起三列 */
@screen sm {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@screen lg {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
