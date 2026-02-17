<!-- src/components/EventCard.vue -->
<template>
  <n-card
    :bordered="false"
    :class="['event-card card-base', { urgent: event.isUrgent }]"
    content-style="padding: 0"
    hoverable
    @click="navigateToDetail"
    class="cursor-pointer"
  >
    <div class="event-layout">
      <div class="media-column">
        <div v-if="coverImageUrl" class="image-container">
          <img :src="coverImageUrl" :alt="event.title" class="cover-image" />
        </div>
        <div v-else class="image-placeholder">
          <span class="placeholder-badge">{{ placeholderBadge }}</span>
          <span class="placeholder-label">NO PREVIEW</span>
        </div>
      </div>

      <div class="content-column">
        <div class="content-container">
          <div class="content-header">
            <n-tag
              :type="event.isUrgent ? 'default' : 'info'"
              :class="{ 'urgent-tag': event.isUrgent }"
              size="small"
              round
            >
              {{ event.category }}
            </n-tag>
            <span class="release-date">{{ formattedDate }}</span>
          </div>
          <h3 class="event-title">{{ event.title }}</h3>
        </div>
      </div>
    </div>
  </n-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NTag } from 'naive-ui'
import { getStrapiMedia } from '@/composables/strapi'

const props = defineProps({
  event: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      title: '加载中...',
      eventType: '通知',
      date: new Date().toISOString(),
      isUrgent: false,
      coverImage: null,
    }),
  },
})

const router = useRouter()

// 计算封面图片 URL
const coverImageUrl = computed(() => {
  return getStrapiMedia(props.event?.coverImage)
})

// 格式化日期
const formattedDate = computed(() => {
  const dateString = props.event?.date
  if (!dateString) return ''
  try {
    return new Date(dateString).toISOString().split('T')[0]
  } catch {
    console.error('Invalid date format:', dateString)
    return dateString
  }
})

const placeholderBadge = computed(() => {
  const source = props.event?.title || props.event?.category || 'E'
  const normalized = String(source).trim()
  if (!normalized) return 'E'
  return normalized.charAt(0).toUpperCase()
})

// 导航到详情页
const navigateToDetail = () => {
  if (props.event?.slug) {
    router.push(`/events/${props.event.slug}`)
  }
}
</script>

<style scoped>
.event-card {
  --event-card-height: 112px;
  --event-media-width: 140px;
  background-color: #21252e;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-left: 3px solid #ffffff;
  border-right: 3px solid #ffffff;
  border-radius: 0 !important;
  clip-path: polygon(
    0 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
  transition: all 0.3s ease;
  overflow: hidden;
}

.event-layout {
  display: grid;
  grid-template-columns: var(--event-media-width) minmax(0, 1fr);
  height: var(--event-card-height);
  position: relative;
}

.event-layout::before,
.event-layout::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  opacity: 0.75;
  transition: all 0.25s ease;
  pointer-events: none;
}

.event-layout::before {
  top: -1px;
  left: -1px;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
}

.event-layout::after {
  right: -1px;
  bottom: -1px;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
}

.media-column {
  width: 100%;
  height: var(--event-card-height);
}

.content-column {
  min-width: 0;
  display: flex;
  align-items: center;
  height: var(--event-card-height);
}

.event-card.urgent {
  border: 1px solid rgba(76, 201, 255, 0.5);
  border-left-color: rgba(76, 201, 255, 0.8);
  border-right-color: rgba(76, 201, 255, 0.8);
  background:
    linear-gradient(135deg, rgba(16, 28, 44, 0.95), rgba(12, 21, 34, 0.92)),
    radial-gradient(circle at 90% 10%, rgba(76, 201, 255, 0.18), transparent 55%);
  box-shadow:
    0 0 0 1px rgba(76, 201, 255, 0.18) inset,
    0 0 18px rgba(30, 167, 255, 0.22),
    0 0 36px rgba(30, 167, 255, 0.12);
}

.event-card.urgent::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(
    110deg,
    rgba(76, 201, 255, 0.14),
    transparent 35%,
    transparent 65%,
    rgba(76, 201, 255, 0.12)
  );
  mix-blend-mode: screen;
}

.event-card.urgent .event-layout::before,
.event-card.urgent .event-layout::after {
  border-color: rgba(76, 201, 255, 0.9);
}

.image-container {
  width: 100%;
  height: var(--event-card-height);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.02);
  transition: transform 0.3s ease;
}

.event-card:hover .cover-image {
  transform: scale(1.08);
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.32rem;
  position: relative;
  width: 100%;
  height: var(--event-card-height);
  background:
    radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.08), transparent 62%),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.03) 0,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px,
      transparent 14px
    ),
    linear-gradient(135deg, rgba(18, 22, 30, 0.98), rgba(10, 13, 20, 0.95));
}

.image-placeholder::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.placeholder-badge {
  width: 34px;
  height: 34px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.placeholder-label {
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.56rem;
  letter-spacing: 0.16em;
}

.content-container {
  padding: 0.5rem 0.6rem 0.5rem 0.65rem;
  width: 100%;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  gap: 0.3rem;
  flex-wrap: nowrap;
}

.event-title {
  font-size: 0.9rem;
  color: var(--color-heading);
  margin: 0;
  line-height: 1.3;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.release-date {
  font-size: 0.68rem;
  color: var(--color-text);
  opacity: 0.8;
  white-space: nowrap;
  flex-shrink: 0;
}

:deep(.n-tag) {
  font-size: 0.64rem;
  line-height: 1.1;
  padding: 0 0.25rem;
}

:deep(.n-tag.urgent-tag) {
  color: #dff4ff;
  background: rgba(76, 201, 255, 0.18);
  border: 1px solid rgba(76, 201, 255, 0.45);
  box-shadow: 0 0 10px rgba(76, 201, 255, 0.18);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .event-card {
    --event-card-height: 92px;
    --event-media-width: 108px;
  }

  .event-layout {
    grid-template-columns: var(--event-media-width) minmax(0, 1fr);
  }

  .event-title {
    font-size: 0.82rem;
  }
}
</style>
