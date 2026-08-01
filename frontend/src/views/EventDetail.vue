<template>
  <div class="event-detail-view container">
    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="notFound"
      skeleton="text"
      empty-text=">> 该事件不存在或已被删除。"
      @retry="refresh"
    >
      <article>
        <section class="page-header">
          <router-link to="/news" class="back-button">&lt; 返回动态列表</router-link>
          <h1 class="title">// {{ event.title }}</h1>
          <div class="subtitle-wrapper">
            <span class="category-badge">{{ event.category }}</span>
            <p class="subtitle">>> 发布于: {{ event.date }}</p>
          </div>
        </section>

        <!--
          ↓↓↓ 核心改动：移除两栏布局，改为单栏布局 ↓↓↓
        -->
        <div class="tech-box dynamic-content-area">
          <div v-for="(component, index) in event.mainContent" :key="index">
            <!-- 渲染 Markdown 段落 -->
            <div
              v-if="component.__component === 'content-block.content-block'"
              v-html="renderMarkdown(component.contentMd)"
              class="markdown-block"
            ></div>

            <!--
              ↓↓↓ 核心改动：当遇到制品引用块时，在当前位置横向渲染所有关联制品 ↓↓↓
            -->
            <div
              v-if="
                component.__component === 'embedding.product-embed' &&
                component.products &&
                component.products.length > 0
              "
              class="product-embed-block"
            >
              <div class="horizontal-scroll-wrapper">
                <!-- 循环渲染 ProductCard，用批量补全后的完整数据（原块只带 id） -->
                <ProductCard
                  v-for="product in resolveEmbeddedProducts(component)"
                  :key="product.id"
                  :product="product"
                  class="embedded-product-card"
                />
              </div>
            </div>

            <!--考虑嵌入链接的情况-->
            <div v-if="component.__component === 'embedding.link-embed'" class="link-embed-block">
              <a :href="component.linkContent" target="_blank" rel="noopener" class="external-link">
                {{ component.linkName || component.linkContent }}
              </a>
            </div>
            <!--考虑嵌入iframe的情况-->
            <div
              v-if="component.__component === 'embedding.iframe-embed'"
              class="iframe-embed-block"
            >
              <iframe
                :src="component.iframeContent"
                frameborder="0"
                class="embedded-iframe"
                allowfullscreen
              ></iframe>
            </div>
            <!--考虑嵌入一个可下载的文件和它的名称的情况-->
            <div
              v-if="
                component.__component === 'embedding.file-embed' &&
                component.File &&
                component.File.length > 0
              "
              class="file-embed-block"
            >
              <a
                :href="getFileUrl(component.File[0])"
                :download="component.FileName || component.File[0].name || '下载文件'"
                class="external-link"
                @click.prevent="
                  downloadFile(
                    component.File[0],
                    component.FileName || component.File[0].name || '下载文件',
                  )
                "
              >
                {{ component.FileName || component.File[0].name || '下载文件' }}
              </a>
            </div>
          </div>
        </div>
      </article>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import ProductCard from '@/components/ProductCard.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import { getStrapiMedia } from '@/composables/strapi'
import { useEvent } from '@/composables/useEvents'
import { useProductsByIds } from '@/composables/useProducts'

const route = useRoute()
const { data: event, loading, error, notFound, refresh } = useEvent(() => route.params.slug)

// useEvent(getter) 已经自动处理换 slug 后的重新拉取；这里单独保留滚动重置这个
// 与拉取数据无关的副作用（ProductDetail.vue 的路由 watch 也这样做，保持两个详情页一致）
watch(
  () => route.params.slug,
  () => window.scrollTo(0, 0),
  { immediate: true },
)

// 动态区里的 embedding.product-embed 块只带 id（oneToMany 关系 products），需要二次批量补全
const embeddedProductIds = computed(() => {
  const blocks = event.value?.mainContent ?? []
  return blocks
    .filter((b) => b.__component === 'embedding.product-embed')
    .flatMap((b) => b.products ?? [])
    .map((p) => p.id)
})

const { byId: productsById } = useProductsByIds(embeddedProductIds)

// 模板里读取补全后的 product：用批量请求回来的完整数据替换掉只有 id 的占位对象
const resolveEmbeddedProducts = (component) =>
  (component.products ?? []).map((p) => productsById.value[p.id]).filter(Boolean)

//在获取可下载文件的url时，应该调用这个函数
const getFileUrl = (file) => {
  return getStrapiMedia(file)
}
const downloadFile = (file, filename) => {
  const url = getStrapiMedia(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 渲染Markdown的辅助函数 (保持不变)
const renderMarkdown = (markdownText) => {
  return marked(markdownText || '')
}
</script>

<style scoped>
/* --- 布局与通用样式 --- */
.event-detail-view {
  --md-surface: rgba(15, 24, 38, 0.78);
  --md-surface-strong: rgba(18, 30, 48, 0.92);
  --md-border: rgba(76, 201, 255, 0.24);
  --md-glow: rgba(76, 201, 255, 0.18);
  --md-code-bg: rgba(9, 14, 24, 0.92);
}

.u-tech-panel {
  border: 1px solid var(--md-border);
  background: var(--md-surface);
  box-shadow:
    inset 0 0 0 1px rgba(76, 201, 255, 0.06),
    0 0 14px rgba(76, 201, 255, 0.08);
  border-radius: 10px;
}

.u-tech-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--md-border);
  border-left: 3px solid var(--color-accent);
  border-radius: 8px;
  background: var(--md-surface);
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.u-tech-link:hover {
  color: var(--color-heading);
  background: var(--md-surface-strong);
  box-shadow:
    0 0 0 1px rgba(76, 201, 255, 0.24) inset,
    0 0 14px var(--md-glow);
  transform: translateY(-1px);
}

.dynamic-content-area {
  padding: 1rem; /* 窄屏默认值；桌面（md 及以上）见下方 @screen md 覆盖 */
  max-width: 1200px; /* 限制主内容区的最大宽度以保证可读性 */
  margin: 0 auto; /* 居中 */
}

.markdown-block,
.product-embed-block {
  margin-bottom: 2rem;
}

.markdown-block {
  padding: 0.9rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
}

.dynamic-content-area > div:last-child {
  margin-bottom: 0;
}

/* --- 嵌入制品块的核心样式 --- */
.horizontal-scroll-wrapper {
  display: flex;
  gap: 1.5rem;
  /* 关键：启用横向滚动 */
  overflow-x: auto;
  padding: 1rem 0.5rem; /* 为卡片上下和滚动条留出空间 */
  /* 美化滚动条 (适用于 Webkit 内核浏览器, 如 Chrome, Safari) */
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: var(--color-background);
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-accent);
  }
}

/* 针对嵌入的 ProductCard 进行微调 */
.embedded-product-card {
  /* 关键：防止卡片被压缩，保持其原始设定的最小宽度 */
  flex-shrink: 0;
  width: 220px; /* 与制品卡片的设定宽度保持一致 */
}

/* --- Markdown 渲染样式（科技化 + 原子化） --- */
:deep(.markdown-block) {
  border: 1px solid var(--md-border);
  background: linear-gradient(145deg, rgba(14, 23, 36, 0.82), rgba(10, 16, 26, 0.72));
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(76, 201, 255, 0.06);
}

:deep(.markdown-block > *:first-child) {
  margin-top: 0;
}

:deep(.markdown-block > *:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-block p) {
  line-height: 1.85;
  letter-spacing: 0.01em;
  color: var(--color-text);
  margin-bottom: 1rem;
}

:deep(.markdown-block h1),
:deep(.markdown-block h2),
:deep(.markdown-block h3),
:deep(.markdown-block h4) {
  margin-top: 1.6rem;
  margin-bottom: 0.8rem;
  color: var(--color-heading);
  letter-spacing: 0.04em;
  text-shadow: 0 0 10px rgba(76, 201, 255, 0.2);
}

:deep(.markdown-block h2),
:deep(.markdown-block h3) {
  border-left: 3px solid var(--color-accent);
  padding-left: 0.7rem;
}

:deep(.markdown-block ul),
:deep(.markdown-block ol) {
  margin: 0.8rem 0 1rem 1.2rem;
  padding-left: 0.3rem;
}

:deep(.markdown-block li) {
  margin-bottom: 0.35rem;
  line-height: 1.75;
}

:deep(.markdown-block blockquote) {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border-left: 3px solid var(--color-accent);
  border-radius: 6px;
  color: #d8ecff;
  background: rgba(76, 201, 255, 0.08);
}

:deep(.markdown-block hr) {
  border: none;
  height: 1px;
  margin: 1.2rem 0;
  background: linear-gradient(90deg, transparent, rgba(76, 201, 255, 0.55), transparent);
}

:deep(.markdown-block a) {
  color: var(--color-accent);
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}

:deep(.markdown-block a:hover) {
  color: var(--color-heading);
}

:deep(.markdown-block code) {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  border: 1px solid rgba(76, 201, 255, 0.28);
  border-radius: 5px;
  padding: 0.1rem 0.35rem;
  color: #c8f0ff;
  background: rgba(8, 14, 24, 0.78);
}

:deep(.markdown-block pre) {
  margin: 1rem 0;
  border-radius: 8px;
  border: 1px solid var(--md-border);
  background: var(--md-code-bg);
  box-shadow: 0 0 0 1px rgba(76, 201, 255, 0.08) inset;
  overflow-x: auto;
}

:deep(.markdown-block pre code) {
  display: block;
  border: none;
  background: transparent;
  padding: 0.8rem 0.9rem;
}

:deep(.markdown-block table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.95rem;
}

:deep(.markdown-block th),
:deep(.markdown-block td) {
  border: 1px solid var(--md-border);
  padding: 0.55rem 0.65rem;
}

:deep(.markdown-block th) {
  color: var(--color-heading);
  background: rgba(76, 201, 255, 0.12);
}

:deep(.markdown-block img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--md-border);
  box-shadow: 0 0 14px rgba(76, 201, 255, 0.1);
}

/*链接嵌入样式*/
.link-embed-block .external-link,
.file-embed-block .external-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--md-border);
  border-left: 3px solid var(--color-accent);
  border-radius: 8px;
  background: var(--md-surface);
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
  box-shadow: 0 0 0 1px rgba(76, 201, 255, 0.08) inset;
  cursor: pointer;
}

.link-embed-block .external-link:hover,
.file-embed-block .external-link:hover {
  color: var(--color-heading);
  background: var(--md-surface-strong);
  box-shadow:
    0 0 0 1px rgba(76, 201, 255, 0.24) inset,
    0 0 14px var(--md-glow);
  transform: translateY(-1px);
}

.iframe-embed-block .embedded-iframe {
  width: 100%;
  min-height: 300px;
  max-height: 60vh;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--md-border);
  border-radius: 8px;
  background: #0d1420;
  box-sizing: border-box;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  display: block;
}
.iframe-embed-block .embedded-iframe:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 12px var(--md-glow);
}

.file-embed-block .external-link {
  margin-top: 1rem;
}

/* 移动优先：上方为窄屏默认值，md 及以上覆盖为桌面值 */
@screen md {
  .dynamic-content-area {
    padding: 2.5rem;
  }

  .markdown-block {
    padding: 1.2rem 1.25rem;
  }
}
</style>
