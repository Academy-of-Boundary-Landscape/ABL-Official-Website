<!-- src/components/ProductCard.vue -->
<template>
  <router-link v-if="product" :to="`/products/${product.slug}`" class="product-card tech-box">
    
    <div class="card-image-wrapper">
      <img 
        v-if="coverImageUrl" 
        :src="coverImageUrl" 
        :alt="product.title"
        class="card-image"
      >
      <!-- 如果没有图片，显示一个占位符 -->
      <div v-else class="image-placeholder"></div>
    </div>

    <div class="card-content">
      <h3>{{ product.title }}</h3>
      <div class="card-footer">
        <span class="category-badge">{{ product.category }}</span>
        <span class="release-date">{{ formattedDate }}</span>
      </div>
    </div>

  </router-link>
</template>

<script setup>
import { computed } from 'vue';
// --- 关键改动 1: 引入 getStrapiMedia，不再需要 apiClient ---
import { getStrapiMedia } from '@/composables/strapi'; // 确保路径正确

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
});

// --- 关键改动 2: 使用 getStrapiMedia 简化 URL 获取逻辑 ---
const coverImageUrl = computed(() => {
  // 直接将 Strapi 返回的 coverImage 对象传给帮助函数
  // 无论是获取 small 格式还是原始格式，都由 getStrapiMedia 内部处理
  return getStrapiMedia(props.product?.coverImage);
});

// --- 无需改动: 日期格式化逻辑非常棒，保持原样 ---
const formattedDate = computed(() => {
  const dateString = props.product?.releaseDate;
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return dateString;
  }
});
</script>


<style scoped>
/* 样式部分无需修改，你的样式写得很好 */
.product-card {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 0;
  overflow: hidden;
  border-radius: 8px; /* 建议给卡片本身也加一个圆角，与图片/内容区域协调 */
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2); /* 增加悬停阴影 */
}

.card-image-wrapper {
  width: 100%;
  height: 200px;
  background-color: #1a1a1a;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .card-image {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
}

.card-content {
  padding: 1rem; /* 稍微增加内边距 */
}

.card-content h3 {
  font-size: 1.1rem; /* 稍微增大标题 */
  margin: 0 0 0.75rem 0; /* 增加标题和下方的间距 */
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.category-badge {
  display: inline-block;
  background-color: rgba(var(--color-accent-rgb), 0.1);
  color: var(--color-accent);
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.release-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>