<!-- src/components/EventCard.vue -->
<template>
  <!-- 
    ↓↓↓ 核心改动：将根元素从 <div> 替换为 <router-link> ↓↓↓
    我们为 :to 属性动态绑定了目标URL，假设详情页的路由是 /events/:id。
    所有之前的 class 和 :class 绑定都移动到这里。
  -->
  <router-link 
    :to="`/events/${event.slug}`" 
    class="event-card-wrapper tech-box" 
    :class="{ urgent: event.isUrgent }"
  >
    
    <!-- 卡片内部的 HTML 结构保持完全不变 -->
    <div class="event-card-inner">
      <div v-if="coverImageUrl" class="image-container">
        <img :src="coverImageUrl" :alt="event.title" class="cover-image">
      </div>
      <div class="content-container">
        <div class="content-header">
          <span class="category-badge">{{ event.category }}</span>
          <span class="release-date">{{ formattedDate }}</span>
        </div>
        <h3 class="event-title">{{ event.title }}</h3>
      </div>
    </div>

  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { apiClient,getStrapiMedia } from '@/composables/strapi';

const props = defineProps({
  event: {
    type: Object,
    required: true,
    default: () => ({
      id: 0, // <-- 为默认对象添加 id
      title: '加载中...',
      eventType: '通知',
      date: new Date().toISOString(),
      isUrgent: false,
      coverImage: null
    })
  }
});

// 计算属性 coverImageUrl 保持不变
const coverImageUrl = computed(() => {
  // 直接将 Strapi 返回的 coverImage 对象传给帮助函数
  // 无论是获取 small 格式还是原始格式，都由 getStrapiMedia 内部处理
  console.log(props.event?.converImage)
  return getStrapiMedia(props.event?.coverImage);
});


// 计算属性 formattedDate 保持不变
const formattedDate = computed(() => {
  const dateString = props.event?.date;
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
/* 外部容器，应用了 .tech-box */
.event-card-wrapper {
  display: block; /* 让链接表现得像一个块级元素 */
  text-decoration: none; /* 去除下划线 */
  color: inherit; /* 继承父元素的文字颜色 */
  
  /* --- 以下是您原有的样式 --- */
  width: 100%;
  padding: 1rem;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  cursor: pointer;
}
.event-card-wrapper {
  background-color: #000 !important; /* 强制黑色背景 */
  /* 其他原有样式保持不变 */
}

.event-card-wrapper:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(var(--color-border-rgb), 0.3);
}

/* 紧急状态高亮 */
.event-card-wrapper.urgent {
  border-width: 2px;
  border-color: var(--color-accent);
  box-shadow: 0 0 20px rgba(var(--color-accent-rgb), 0.5);
}
.event-card-wrapper.urgent .category-badge {
  background-color: var(--color-accent);
  color: var(--color-box);
}

/* 内部 flex 容器 */
.event-card-inner {
  display: flex;
  align-items: center; /* 垂直居中 */
  gap: 1.5rem; /* 图片和内容之间的间距 */
}

/* 左侧图片容器 */
.image-container {
  width: 120px; /* 固定图片宽度 */
  height: 80px; /* 固定图片高度 */
  flex-shrink: 0; /* 防止图片在 flex 布局中被压缩 */
  overflow: hidden;
  border-radius: 4px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 右侧内容容器 */
.content-container {
  flex-grow: 1; /* 占据剩余的所有空间 */
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.event-title {
  font-size: 1.2rem;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.5;
  /* (可选) 多行文本溢出显示省略号，如果标题很长 */
  /*
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  */
}

/* 复用 ProductCard 的样式，并可以进行微调 */
.category-badge {
  display: inline-block;
  background-color: rgba(var(--color-accent-rgb), 0.1);
  color: var(--color-accent);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.release-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>