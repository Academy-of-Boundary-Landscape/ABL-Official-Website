<!-- src/views/ProductList.vue -->
<template>
  <div class="product-list-view container">

    <section class="page-header">
      <h1 class="title">// 社团制品一览</h1>
      <p class="subtitle"> >> Accessing archive of all released products.</p>
    </section>

    <div class="controls-wrapper tech-box">
      <!-- 
        ↓↓↓ 改动点 ↓↓↓
        这里的 v-for 现在循环的是从API获取的 categories 状态
      -->
      <CategoryFilter 
        :categories="categories"
        v-model="activeCategory"
      />
      <div class="search-group">
        <input 
          type="text"
          v-model="searchTerm"
          placeholder="搜索制品标题..."
          class="search-input"
        >
      </div>
      <button @click="toggleSortOrder" class="sort-button">
        排序: {{ sortButtonText }}
      </button>
    </div>

    <!-- 加载、错误、网格、无结果提示等部分，保持完全不变 -->
    <div v-if="loading" class="status-box">
      <p>>> 正在检索数据，请稍候...</p>
    </div>
    <div v-if="error" class="status-box error">
      <p>>> [错误] 无法获取制品列表: {{ error }}</p>
    </div>
    <div v-if="!loading && products.length > 0" class="product-grid">
      <ProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
      />
    </div>
    <div v-if="!loading && products.length === 0 && !error" class="status-box">
        <p>>> 未找到符合条件的制品。</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'; // <-- 引入 computed
import { apiClient } from '@/composables/strapi';
import ProductCard from '@/components/ProductCard.vue';
import CategoryFilter from '@/components/CategoryFilter.vue';
// --- 状态管理 ---
const products = ref([]);
const loading = ref(true); // 初始加载状态
const error = ref(null);

const searchTerm = ref('');
const activeCategory = ref('全部');
const debounceTimer = ref(null);

// ↓↓↓ 改动点 ↓↓↓
// categories 现在是一个空的 ref，将由API填充
const categories = ref(['全部']); 
const sortOrder = ref('desc'); 
// --- 核心数据获取函数 ---

// 新增：专门用于获取分类列表的函数
const fetchCategories = async () => {
  try {
    // 假设数据是扁平化的，直接获取
    const response = await apiClient.get('/products?fields[0]=category');
    const responseData = response.data.data || response.data; // 兼容两种响应结构
    
    // 从返回的对象数组中提取 category 字段
    const allCats = responseData.map(item => item.category);
    
    // 使用 Set 数据结构进行去重，然后转换为数组
    const uniqueCats = [...new Set(allCats)];
    
    // 将去重后的分类列表追加到 categories ref 中
    categories.value.push(...uniqueCats);

  } catch (e) {
    console.error('获取分类失败:', e);
    // 这里可以选择不把错误显示给用户，因为即使分类加载失败，制品列表依然可以工作
  }
};


// fetchProducts 函数保持完全不变
const fetchProducts = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = {
      populate: 'coverImage',
      sort: `releaseDate:${sortOrder.value}`, 
      filters: { '$and': [] }
    };
    if (activeCategory.value !== '全部') {
      params.filters['$and'].push({ category: { '$eq': activeCategory.value } });
    }
    if (searchTerm.value.trim() !== '') {
      params.filters['$and'].push({ title: { '$containsi': searchTerm.value.trim() } });
    }
    const response = await apiClient.get('/products', { params });
    products.value = response.data.data || response.data;
  } catch (e) {
    error.value = '连接超时或服务器错误。';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// --- 用户交互处理 ---


// watch 监听部分保持完全不变
watch(activeCategory, fetchProducts);
watch(searchTerm, () => {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    fetchProducts();
  }, 300);
});

// ↓↓↓ 新增：切换排序顺序的函数 ↓↓↓
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
};

// ↓↓↓ 新增：一个计算属性，用于动态显示按钮文本 ↓↓↓
const sortButtonText = computed(() => {
  return sortOrder.value === 'desc' ? '最新发布' : '最早发布';
});

// --- 生命周期钩子 ---
// ↓↓↓ 改动点 ↓↓↓
// onMounted 现在需要做两件事：获取分类 和 获取初始制品
watch(sortOrder, fetchProducts);
onMounted(async () => {
  // 使用 Promise.all 并行执行两个请求，可以稍微提升加载速度
  await Promise.all([
    fetchCategories(), // 获取分类
    fetchProducts()    // 获取初始的、未经过滤的制品列表
  ]);
});

</script>

<style scoped>
/* 样式部分保持完全不变 */
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