<template>
  <div class="event-list-view container">
    <!-- 1. 页面头部，复用全局 .page-header 样式 -->
    <section class="page-header">
      <h1 class="title">// 社团动态与通知</h1>
      <p class="subtitle">>> Latest updates, announcements, and news from the club.</p>
    </section>
    <div class="controls-wrapper tech-box">
      <div class="search-group">
        <n-input v-model:value="searchTerm" placeholder="搜索事件标题..." clearable />
      </div>
    </div>

    <!-- 2. 加载/错误/空态统一交给 AsyncBoundary；skeleton="none" 保留原有的终端风格提示文案 -->
    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      skeleton="none"
      empty-text=">> 当前没有新的动态。"
      @retry="refresh"
    >
      <!-- 3. 事件列表容器 -->
      <div
        class="event-list-container grid-cols-1 gap-[0.65rem] sm:gap-[0.9rem] sm:grid-cols-[repeat(auto-fill,minmax(260px,320px))]"
      >
        <EventCard v-for="event in events" :key="event.slug" :event="event" />
      </div>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NInput } from 'naive-ui'
import EventCard from '@/components/EventCard.vue' // 引入我们创建的 EventCard 组件
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import { useEvents } from '@/composables/useEvents'

const searchTerm = ref('')
const {
  data: events,
  loading,
  error,
  isEmpty,
  refresh,
} = useEvents({ search: searchTerm }, { debounce: 300 })
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

/* 事件卡片的垂直列表容器
 * 断点相关的 grid-template-columns / gap 已移至模板的 UnoCSS 工具类（移动优先，sm: 为桌面覆盖）
 */
.event-list-container {
  display: grid;
  justify-content: center;
  max-width: 1120px;
  margin: 0 auto;
}

:deep(.event-list-container .event-card) {
  width: 100%;
}

/* 页面主体容器 */
.event-list-view {
  padding-bottom: 30px; /* 底部留出一些空间 */
}
</style>
