<template>
  <span class="status-badge-group">
    <span v-if="label" class="status-badge" :class="`is-${status}`">{{ label }}</span>
    <span v-if="recruiting" class="status-badge is-recruiting">招募中</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { statusLabel } from '@/utils/work'

const props = defineProps({
  status: { type: String, default: '' },
  recruiting: { type: Boolean, default: false },
})

// 未知状态时 statusLabel 返回空串，整个徽标不渲染
const label = computed(() => statusLabel(props.status))
</script>

<style scoped>
.status-badge-group {
  display: inline-flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border: 1px solid currentColor;
  color: var(--color-text-muted);
}

.is-planned {
  color: var(--color-text-muted);
}
.is-in-development {
  color: var(--color-warning);
}
.is-released,
.is-maintained {
  color: var(--color-success);
}
.is-ended,
.is-discontinued {
  color: var(--color-text-subtle);
}
.is-recruiting {
  color: var(--color-accent);
}
</style>
