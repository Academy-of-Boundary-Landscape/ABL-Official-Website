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

  <!-- 空态：终端风纯文本，与 error 分支的 `>>` 前缀文案一致，不用 n-empty 的居中图标 -->
  <div v-else-if="empty" class="status-box">
    <p>{{ emptyText }}</p>
  </div>

  <slot v-else />
</template>

<script setup>
import { NSkeleton, NButton } from 'naive-ui'

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

/* 原 main.css 里全局的 .status-box / .status-box.error，
   使用点已全部收进本组件，随迁移一起搬过来。
   背景/边框/辉光四处都是半透明的字面量值，直接换成不透明的既有 token 会
   丢失 alpha（背景变实心方块、辉光变色）——改用下面四个专门保留原始
   半透明数值的 token，渲染结果与原 main.css 字节级一致。 */
.status-box {
  text-align: center;
  margin: 4rem 0;
  padding: 2rem;
  font-size: 1.2rem;
  color: var(--color-heading);
  border: 1px solid var(--color-border);
  background: var(--color-surface-translucent);
  box-shadow: 0 0 12px var(--color-box-glow-strong);
  border-radius: 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.status-box.error {
  color: var(--color-error-strong);
  border-color: var(--color-error-border);
  box-shadow: 0 0 20px var(--color-error-glow);
}
</style>
