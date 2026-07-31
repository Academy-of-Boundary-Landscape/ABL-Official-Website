<template>
  <div class="product-detail-view container">
    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="notFound"
      skeleton="text"
      empty-text=">> 档案不存在或已被删除。"
      @retry="refresh"
    >
    <!-- Main Content, rendered only when product data is available -->
    <article v-if="product">

      <!-- Page Header using the global style -->
      <section class="page-header">
        <router-link to="/products" class="back-button">&lt; 返回制品列表</router-link>
        <h1 class="title">// {{ product.title }}</h1>
        <p class="subtitle">>> 制品编号: {{ product.storageId }} // 发布于: {{ product.releaseDate }}</p>
      </section>

      <!-- Main layout: a two-column grid inside a tech-box -->
      <div
        class="tech-box content-wrapper grid gap-6 grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        
        <!-- Left Column: Main Content -->
        <div class="main-content">
          
          <!-- Product Description (rendered from Markdown) -->
          <section class="description" v-html="parsedDescription"></section>

          <!-- Specifications (handles different component types) -->
          <!-- Staff/Credits List (from repeatable component) -->
          <section v-if="product.productStaff && product.productStaff.length">
            <h3 class="section-title">制作人员</h3>
            <ul class="staff-list">
              <li v-for="credit in product.productStaff" :key="credit.id">
                <strong>{{ credit.role }}:</strong> {{ credit.name }}
              </li>
            </ul>
          </section>

        </div>
        
        <!-- Right Column: Sidebar with key info -->
        <aside class="sidebar">
          
          <!-- Cover Image with WebP Optimization -->
            <div class="cover-image-container" v-if="getCoverFormatUrl()">
            <img 
              :src="getCoverFormatUrl()" 
              :alt="product.title"
            />
            </div>

          <!-- Key Metadata -->
            <div class="meta-data">
            <p><strong>制品分类:</strong> {{ product.category }}</p>
            <p><strong>首发活动:</strong> {{ product.releaseEvent }}</p>
            <p><strong>通常价格:</strong> {{ product.price ? `${product.price} CNY` : 'N/A' }}</p>
            <p><strong>当前状态:</strong> 
              <span 
              v-if="product.available === true" 
              style="color: #27ae60; font-weight: bold;"
              > 有库存</span>
              <span 
              v-else-if="product.available === false" 
              style="color: #e74c3c; font-weight: bold;"
              > 无库存</span>
              <span 
              v-else 
              style="color: #f1c40f; font-weight: bold;"
              > 未知</span>
            </p>
            </div>
        </aside>
      </div>
      <section v-if="recommended.length > 0" class="recommendation-section">
        <h2 class="section-title">其他社团制品推荐</h2>
        <div class="product-grid">
          <!-- 复用 ProductCard 组件来展示推荐制品 -->
          <ProductCard
            v-for="recProduct in recommended"
            :key="recProduct.id"
            :product="recProduct"
          />
        </div>
      </section>
    </article>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getStrapiMedia } from '@/composables/strapi.js';
import { marked } from 'marked';
import ProductCard from '@/components/ProductCard.vue';
import AsyncBoundary from '@/components/AsyncBoundary.vue';
import { useProduct, useRecommendedProducts } from '@/composables/useProducts';

const route = useRoute();
const {
  data: product,
  loading,
  error,
  notFound,
  refresh,
} = useProduct(() => route.params.slug);

// 推荐位：排除当前条目后随机取 4 条，与改造前的 fetchRecommendedProducts 行为一致
const { data: recommended } = useRecommendedProducts(
  computed(() => product.value?.id),
  4,
);

const parsedDescription = computed(() => {
  return product.value && product.value.description ? marked(product.value.description) : '';
});

// getStrapiMedia 已经能处理 v4/v5 两种媒体形状，这里只保留尺寸挑选逻辑
const getCoverFormatUrl = (size = 'large') => {
  // 直接从 product.value.coverImage 获取数据（不是 attributes.coverImage.data）
  const coverImageObject = product.value?.coverImage;
  if (!coverImageObject) {
    console.log("没有封面图数据");
    return null;
  }

  // Strapi 格式字段：small, medium, thumbnail。没有 large，优先 medium，其次 small，最后原图
  let imageUrl = null;
  if (size === 'large' && coverImageObject.formats?.medium) {
    imageUrl = coverImageObject.formats.medium.url;
  } else if (size === 'small' && coverImageObject.formats?.small) {
    imageUrl = coverImageObject.formats.small.url;
  } else if (coverImageObject.formats?.[size]) {
    imageUrl = coverImageObject.formats[size].url;
  } else {
    // 回退到原图
    imageUrl = coverImageObject.url;
  }

  return getStrapiMedia({ url: imageUrl });
};

// useProduct(getter) 已经自动处理换 slug 后的重新拉取；这里单独保留滚动重置这个
// 与拉取数据无关的副作用（EventDetail.vue 的路由 watch 也这样做，保持两个详情页一致）
watch(
  () => route.params.slug,
  () => window.scrollTo(0, 0),
  { immediate: true },
);
</script>

<style scoped>
/* Main Layout: Two-column grid for desktop
 * display/grid-template-columns/gap 已移至模板的 UnoCSS 工具类（移动优先，md: 为桌面覆盖） */
.section-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}
.section-title::before {
  content: "// ";
  color: var(--color-accent);
}
/* Sidebar styles（窄屏默认：置顶单栏堆叠；桌面见下方 @screen md 覆盖） */
.sidebar {
  grid-row: 1; /* 窄屏下移到内容上方 */
  position: static; /* 窄屏重置 sticky */
  margin-bottom: 3rem;
  top: 2rem;
  height: fit-content; /* Ensure it doesn't overflow */
}

.cover-image-container img {
  width: 100%;
  display: block;
  border: 1px solid var(--color-border);
}

.meta-data {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
}
.meta-data p {
  margin: 0 0 0.75rem 0;
}
.meta-data p:last-child {
  margin-bottom: 0;
}

.tracklist-title {
  color: var(--color-heading);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

/* Main Content Area styles */
.main-content section {
  margin-bottom: 3rem;
}


.staff-list {
  list-style: none;
  padding: 0;
}
.staff-list li {
  margin-bottom: 0.75rem;
  border-left: 3px solid var(--color-accent);
  padding-left: 1rem;
}
.spec-list p {
  margin-bottom: 0.5rem;
}

/* Styling for content rendered via v-html */
:deep(.description p),
:deep(.tracklist ul),
:deep(.tracklist ol),
:deep(.tracklist p) {
  line-height: 1.8;
  margin-bottom: 1.5rem;
}
:deep(.tracklist ul),
:deep(.tracklist ol) {
  padding-left: 2rem;
}

/* Responsive Design（移动优先：上方为窄屏默认值，md 及以上覆盖为桌面双栏值） */
@screen md {
  .sidebar {
    grid-row: auto; /* 恢复源码顺序placement，与 main-content 并排 */
    position: sticky; /* Make the sidebar "stick" on scroll */
    margin-bottom: 0;
  }
}

.back-button {
  display: inline-block;
  margin-bottom: 2rem;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}
.back-button:hover {
  color: var(--color-accent);
}

/* ↓↓↓ 新增：推荐栏位的样式 ↓↓↓ */
.recommendation-section {
  margin-top: 5rem;
  padding-top: 3rem;
  border-top: 1px solid var(--color-border);
}

.recommendation-section .section-title {
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1.8rem;
  border-bottom: none; /* 推荐区标题不需要下划线 */
}

/* 复用 ProductList 的网格布局 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}
</style>