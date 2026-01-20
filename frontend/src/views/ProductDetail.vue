<template>
  <div class="product-detail-view container">
    <!-- Loading and Error States -->
    <div v-if="loading" class="status-box">
        <p>>> 正在从深层档案馆调取数据...</p>
    </div>
    <div v-if="error" class="status-box error">
        <p>>> [错误] 数据检索失败: {{ error }}</p>
    </div>

    <!-- Main Content, rendered only when product data is available -->
    <article v-if="product">
      
      <!-- Page Header using the global style -->
      <section class="page-header">
        <router-link to="/products" class="back-button">&lt; 返回制品列表</router-link>
        <h1 class="title">// {{ product.title }}</h1>
        <p class="subtitle">>> 制品编号: {{ product.storageId }} // 发布于: {{ product.releaseDate }}</p>
      </section>

      <!-- Main layout: a two-column grid inside a tech-box -->
      <div class="tech-box content-wrapper">
        
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
          <div v-if="product.purchaseLinks && product.purchaseLinks.length" class="purchase-section">
            <h4 class="purchase-title">// 通贩地址</h4>
            <a v-for="link in product.purchaseLinks" 
               :key="link.id" 
               :href="link.url" 
               target="_blank" 
               class="purchase-link"
               :class="{ 'disabled': !link.isAvailable }"
            >
              {{ link.isAvailable ? `前往 ${link.platform}` : `${link.platform} (已完售)` }}
            </a>
          </div>
          

        </aside>
      </div>
      <section v-if="recommendedProducts.length > 0" class="recommendation-section">
        <h2 class="section-title">其他社团制品推荐</h2>
        <div class="product-grid">
          <!-- 复用 ProductCard 组件来展示推荐制品 -->
          <ProductCard
            v-for="recProduct in recommendedProducts"
            :key="recProduct.id"
            :product="recProduct"
          />
        </div>
      </section>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
// ⬇️ 关键修改 1：同时导入 apiClient 和 getStrapiMedia ⬇️
import { apiClient, getStrapiMedia } from '@/composables/strapi.js';
import { marked } from 'marked';
import ProductCard from '@/components/ProductCard.vue';

const route = useRoute();
const product = ref(null);
const loading = ref(true);
const error = ref(null);
const recommendedProducts = ref([]);

const parsedDescription = computed(() => {
  return product.value && product.value.description ? marked(product.value.description) : '';
});

const fetchProductData = async (slug) => {
  loading.value = true;
  error.value = null;
  recommendedProducts.value = [];

  try {
    // ⬇️ 关键修改 2：将 product.value 的赋值从 responseData[0] 改为 responseData[0].attributes ⬇️
    // 这是 Strapi v4 的标准数据结构，可以使后续代码更简洁
    const response = await apiClient.get(`/products?filters[slug][$eq]=${slug}&populate=*`);
    const responseData = response.data.data;
    if (responseData.length === 0) {
      throw new Error('档案不存在或已被删除');
    }
    // 将整个对象（包括 id 和 attributes）赋给 product
    product.value = responseData[0];
    
    // 在主数据加载成功后，去获取推荐数据
    await fetchRecommendedProducts(product.value.id);

  } catch (e) {
    error.value = e.message;
    console.error("获取制品数据失败:", e);
  } finally {
    loading.value = false;
  }
};

const fetchRecommendedProducts = async (currentProductId) => {
  try {
    const countResponse = await apiClient.get('/products?pagination[pageSize]=1');
    const total = countResponse.data.meta?.pagination?.total;
    if (!total || total <= 1) return;

    const allIdsResp = await apiClient.get('/products', {
      params: {
        fields: ['id'],
        'filters[id][$ne]': currentProductId,
        'pagination[pageSize]': total
      }
    });
    const allIds = allIdsResp.data.data.map(item => item.id);
    const limit = 4;
    const shuffled = allIds.sort(() => Math.random() - 0.5);
    const pickedIds = shuffled.slice(0, Math.min(limit, shuffled.length));

    if (pickedIds.length === 0) return;

    const response = await apiClient.get('/products', {
      params: {
        populate: 'coverImage',
        'filters[id][$in]': pickedIds
      }
    });
    recommendedProducts.value = response.data.data;
  } catch (e) {
    console.error("获取推荐制品失败:", e);
  }
};

// ⬇️ 关键修改 3：重写 getCoverFormatUrl 函数 ⬇️
// 让它使用从 strapi.js 导入的 getStrapiMedia 函数
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

// 监视路由参数变化
watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) {
      fetchProductData(newSlug);
      window.scrollTo(0, 0);
    }
  },
  { immediate: true } // 添加 immediate: true，这样 onMounted 的调用就不再需要了
);

// onMounted(() => {
//   fetchProductData(route.params.slug);
// });

</script>

<style scoped>
/* Main Layout: Two-column grid for desktop */
.content-wrapper {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); /* Flexible 2:1 ratio */
  gap: 1.5rem;
}
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
/* Sidebar styles */
.sidebar {
  position: sticky; /* Make the sidebar "stick" on scroll */
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

.purchase-section {
  margin-top: 1.5rem;
}

.purchase-title, .tracklist-title {
  color: var(--color-heading);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.purchase-link {
  display: block;
  margin-bottom: 0.75rem;
  padding: 0.8rem 1rem;
  background-color: rgba(var(--color-accent-rgb), 0.1);
  border: 1px solid var(--color-border);
  color: var(--color-accent);
  text-align: center;
  text-decoration: none;
  transition: all 0.2s ease;
}
.purchase-link:hover {
  background-color: var(--color-accent);
  color: var(--color-background);
  border-color: var(--color-accent);
}
.purchase-link.disabled {
  background-color: var(--color-background-mute);
  color: var(--color-text-muted);
  border-color: var(--color-border);
  cursor: not-allowed;
}
.purchase-link.disabled:hover {
  background-color: var(--color-background-mute);
  color: var(--color-text-muted);
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

/* Responsive Design for smaller screens */
@media (max-width: 768px) { /* A wider breakpoint for better layout on tablets */
  .content-wrapper {
    grid-template-columns: 1fr; /* Switch to a single column layout */
  }
  .sidebar {
    grid-row: 1; /* Move the sidebar to the top */
    position: static; /* Reset sticky positioning */
    margin-bottom: 3rem;
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