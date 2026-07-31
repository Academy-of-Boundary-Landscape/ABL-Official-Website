<template>
  <RouterLink :to="`/works/${work.slug}`" class="work-card">
    <div class="work-card-media">
      <img v-if="coverUrl" :src="coverUrl" :alt="work.title" loading="lazy" />
      <!-- 预告态：新作品往往还没有封面，这里必须撑住卡片高度 -->
      <div v-else class="work-card-placeholder">
        <span>{{ typeText }}</span>
      </div>
    </div>

    <div class="work-card-body">
      <div class="work-card-meta">
        <span class="work-card-type">{{ typeText }}</span>
        <StatusBadge :status="work.status" :recruiting="Boolean(work.recruiting)" />
      </div>
      <h3 class="work-card-title">{{ work.title }}</h3>
      <p class="work-card-summary">{{ work.summary }}</p>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getStrapiMedia } from '@/composables/strapi'
import { typeLabel } from '@/utils/work'
import StatusBadge from '@/components/work/StatusBadge.vue'

const props = defineProps({
  work: { type: Object, required: true },
})

const coverUrl = computed(() => getStrapiMedia(props.work?.coverImage))
const typeText = computed(() => typeLabel(props.work?.workType))
</script>

<style scoped>
.work-card {
  display: flex;
  flex-direction: column;
  background: var(--color-box-strong);
  border: 1px solid var(--color-border-soft);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.work-card:hover {
  border-color: var(--color-hover-border);
  box-shadow: 0 0 16px var(--color-box-glow);
}

.work-card-media {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.work-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 无封面时的占位：与图片同样的宽高比，卡片高度不塌 */
.work-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-sunken);
  color: var(--color-text-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
  letter-spacing: 0.2em;
}

.work-card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.work-card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.work-card-type {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  color: var(--color-text-subtle);
}

.work-card-title {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-heading);
}

.work-card-summary {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
}
</style>
