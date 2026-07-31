<template>
  <!-- 加载态：骨架屏形状要贴合内容，通用转圈会让列表页布局跳动 -->
  <div v-if="loading" class="async-boundary-state">
    <n-skeleton v-if="skeleton === 'list'" text :repeat="3" style="height: 96px" />
    <n-skeleton v-else-if="skeleton === 'text'" text :repeat="6" />
    <p v-else class="async-boundary-hint">{{ loadingText }}</p>
  </div>

  <!-- 错误态：文案沿用站点的终端风格，并提供重试 -->
  <div v-else-if="error" class="status-box error async-boundary-error">
    <p>&gt;&gt; [错误] {{ error.message }}</p>
    <n-button size="small" ghost class="mt-3" @click="emit('retry')">&gt;&gt; 重试</n-button>
  </div>

  <!-- 空态 -->
  <div v-else-if="empty" class="status-box">
    <n-empty :description="emptyText" />
  </div>

  <slot v-else />
</template>

<script setup>
import { NSkeleton, NEmpty, NButton } from 'naive-ui'

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: Object, default: null },
  empty: { type: Boolean, default: false },
  skeleton: { type: String, default: 'list' },
  loadingText: { type: String, default: '>> 正在获取最新情报...' },
  emptyText: { type: String, default: '>> 当前没有内容。' },
})

const emit = defineEmits(['retry'])
</script>

<style scoped>
.async-boundary-state {
  margin: 2rem 0;
}

.async-boundary-hint {
  text-align: center;
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
}

.async-boundary-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
</style>
