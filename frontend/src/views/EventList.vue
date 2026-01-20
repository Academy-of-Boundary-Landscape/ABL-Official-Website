<template>
  <div class="event-list-view container">

    <!-- 1. 页面头部，复用全局 .page-header 样式 -->
    <section class="page-header">
      <h1 class="title">// 社团动态与通知</h1>
      <p class="subtitle"> >> Latest updates, announcements, and news from the club.</p>
    </section>
    <div class="controls-wrapper tech-box">
      <div class="search-group">
        <input 
          type="text"
          v-model="searchTerm"
          placeholder="搜索事件标题..."
          class="search-input"
        >
      </div>
    </div>
    <!-- 2. 加载与错误状态处理，复用全局 .status-box 样式 -->
    <div v-if="loading" class="status-box">
      <p>>> 正在获取最新情报...</p>
    </div>
    <div v-if="error" class="status-box error">
      <p>>> [错误] 无法连接至情报服务器: {{ error }}</p>
    </div>

    <!-- 3. 事件列表容器 -->
    <div v-if="events.length" class="event-list-container">
      <!-- 
        循环使用 EventCard 组件。
        注意这里没有复杂的过滤或搜索，如果需要可以后续添加。
      -->
      <EventCard 
        v-for="event in events" 
        :key="event.slug" 
        :event="event" 
      />
    </div>
    
    <!-- 4. 无结果提示 -->
    <div v-if="!loading && events.length === 0 && !error" class="status-box">
        <p>>> 当前没有新的动态。</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch} from 'vue';
import { apiClient } from '@/composables/strapi';
import EventCard from '@/components/EventCard.vue'; // 引入我们创建的 EventCard 组件

// --- 状态管理 ---
const events = ref([]);
const loading = ref(true);
const error = ref(null);
const searchTerm = ref('');
const debounceTimer = ref(null);
// --- 核心数据获取函数 ---
const fetchEvents = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = {
      populate: 'coverImage',
      sort: 'date:desc',
      filters: { '$and': [] }
    };
    // 新增：搜索条件
    if (searchTerm.value.trim() !== '') {
      params.filters['$and'].push({ title: { '$containsi': searchTerm.value.trim() } });
    }
    const response = await apiClient.get('/events', { params });
    events.value = response.data.data || response.data;
  } catch (e) {
    error.value = '连接超时或服务器错误。';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 监听搜索关键词变化，防抖处理
watch(searchTerm, () => {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    fetchEvents();
  }, 300);
});

onMounted(fetchEvents);
</script>

<style scoped>
/*
  这个页面的样式非常简洁，因为它大量复用了全局样式和子组件样式。
*/
.controls-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
}

.search-group {
  flex-grow: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.3rem 0.5rem;
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

/* 事件卡片的垂直列表容器 */
.event-list-container {
  display: grid;
  gap: 0.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面主体容器 */
.event-list-view {
  padding-bottom: 30px; /* 底部留出一些空间 */
}


</style>