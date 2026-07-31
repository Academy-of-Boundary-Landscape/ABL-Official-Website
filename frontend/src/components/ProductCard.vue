<!-- src/components/ProductCard.vue -->
<template>
  <n-card
    :bordered="false"
    class="product-card card-base cursor-pointer"
    hoverable
    @click="navigateToDetail"
    :content-style="{ padding: '0' }"
  >
    <!-- 使用 content-style="{ padding: '0' }" 彻底接管内边距控制 -->
    <template #cover>
      <div class="card-image-wrapper">
        <img v-if="coverImageUrl" :src="coverImageUrl" :alt="product.title" class="card-image" />
        <div v-else class="image-placeholder"></div>
      </div>
    </template>

    <div class="card-content">
      <h3 :title="product.title">{{ product.title }}</h3>
      <div class="card-footer">
        <!-- 尺寸改为 tiny 更紧凑 -->
        <n-tag type="info" size="tiny" round :bordered="false">
          {{ product.category }}
        </n-tag>
        <span class="release-date">{{ formattedDate }}</span>
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
  product: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

const coverImageUrl = computed(() => {
  return getStrapiMedia(props.product?.coverImage)
})

const formattedDate = computed(() => {
  const dateString = props.product?.releaseDate
  if (!dateString) return ''
  try {
    return new Date(dateString).toISOString().split('T')[0]
  } catch {
    return dateString
  }
})

const navigateToDetail = () => {
  if (props.product?.slug) {
    router.push(`/products/${props.product.slug}`)
  }
}
</script>

<style scoped>
.product-card {
  background-color: #21252e;
  transition: all 0.3s ease;
  overflow: hidden;
  border-radius: 8px;
}

.card-image-wrapper {
  width: 100%;
  height: 120px; /* 窄屏默认值；桌面见下方 @screen sm 覆盖 */
  background-color: #1a1a1a;
  overflow: hidden;
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

.card-content {
  padding: 8px; /* 窄屏默认值；桌面见下方 @screen sm 覆盖 */
}

.card-content h3 {
  font-size: 0.8rem; /* 窄屏默认值；桌面见下方 @screen sm 覆盖 */
  margin: 0 0 6px 0;
  color: var(--color-heading, #fff);
  line-height: 1.25; /* 紧凑行高 */
  min-height: 2.4em; /* 窄屏默认值；桌面见下方 @screen sm 覆盖，保证两行的高度占位，防止对齐错乱 */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 依然保留两行截断，支持长名字 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.release-date {
  font-size: 0.7rem; /* 字号从 0.75 缩小到 0.7 */
  color: var(--color-text, #999);
  opacity: 0.7;
  white-space: nowrap;
}

/* 覆盖 Naive UI Tag 的小字号 */
:deep(.n-tag) {
  font-size: 0.65rem;
  height: 18px;
  padding: 0 6px;
}

/* 响应式设计（移动优先：上方为窄屏默认值，sm 及以上覆盖为桌面值） */
@screen sm {
  .card-image-wrapper {
    height: 140px; /* 原 160px→140px 的紧凑高度 */
  }

  .card-content {
    padding: 10px 10px 8px 10px;
  }

  .card-content h3 {
    font-size: 0.875rem;
    min-height: 2.5em;
  }
}
</style>
