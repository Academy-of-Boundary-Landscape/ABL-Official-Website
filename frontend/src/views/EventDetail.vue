<template>
  <div class="event-detail-view container">
    <div v-if="loading" class="status-box">
      <p>>> 正在加载事件详情...</p>
    </div>
    <div v-if="error" class="status-box error">
      <p>>> [错误] 无法获取事件数据: {{ error }}</p>
    </div>

    <article v-if="event">
      
      <section class="page-header">
        <router-link to="/events" class="back-button">&lt; 返回动态列表</router-link>
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
            v-if="component.__component === 'embedding.product-embed' && component.products && component.products.length > 0"
            class="product-embed-block"
          >
            <div class="horizontal-scroll-wrapper">
              <!-- 循环渲染 ProductCard -->
              <ProductCard 
                v-for="product in component.products" 
                :key="product.id" 
                :product="product" 
                class="embedded-product-card"
              />
            </div>
          </div>

          <!--考虑嵌入链接的情况-->
          <div 
            v-if="component.__component === 'embedding.link-embed'"
            class="link-embed-block"
          >
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
              v-if="component.__component === 'embedding.file-embed' && component.File && component.File.length > 0"
              class="file-embed-block"
            >
              <a 
                :href="getFileUrl(component.File[0])"
                :download="component.FileName || component.File[0].name || '下载文件'"
                class="external-link"
                @click.prevent="downloadFile(component.File[0], component.FileName || component.File[0].name || '下载文件')"
              >
                {{ component.FileName || component.File[0].name || '下载文件' }}
              </a>
            </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '@/composables/strapi';
import { marked } from 'marked';
import ProductCard from '@/components/ProductCard.vue';

const route = useRoute();
const event = ref(null);
const loading = ref(true);
const error = ref(null);
import { getStrapiMedia } from '@/composables/strapi'
//在获取可下载文件的url时，应该调用这个函数
const getFileUrl = (file) => {
  return getStrapiMedia(file);
}
const downloadFile = (file, filename) => {
  const url = getStrapiMedia(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 渲染Markdown的辅助函数 (保持不变)
const renderMarkdown = (markdownText) => {
  return marked(markdownText || '');
};

// 获取事件数据的主函数
const fetchEventData = async (slug) => {
  loading.value = true;
  error.value = null;

  try {
    // --- 步骤 1: 第一次请求，使用能正常工作的 populate: '*' ---
    const initialResponse = await apiClient.get(`/events?filters[slug][$eq]=${slug}`, {
      params: {
        populate: {
          mainContent: { populate: '*' }
        }
      }
    });

    const initialData = initialResponse.data.data?.[0] || initialResponse.data?.[0];
    if (!initialData) throw new Error('该事件不存在或已被删除');

    // --- 步骤 2: 提取所有不完整的 Product ID ---
    const productIdsToFetch = [];
    if (initialData.mainContent) {
      for (const component of initialData.mainContent) {
        if (component.__component === 'embedding.product-embed' && component.products) {
          for (const product of component.products) {
            productIdsToFetch.push(product.id);
          }
        }
      }
    }
    console.log(productIdsToFetch)

    // --- 步骤 3: 如果有需要，发送第二次请求 ---
    if (productIdsToFetch.length > 0) {
      const productsResponse = await apiClient.get('/products', {
        params: {
          filters: {
            id: { '$in': productIdsToFetch }
          },
          populate: 'coverImage'
        }
      });
      const fullProductsData = productsResponse.data.data || productsResponse.data;

     

      // --- 步骤 4: 数据合并 ---
      // 创建一个以ID为键的Map，方便快速查找
      const fullProductsMap = new Map(fullProductsData.map(p => [p.id, p]));

      // 遍历原始数据，用完整数据替换掉不完整的数据
      for (const component of initialData.mainContent) {
        if (component.__component === 'embedding.product-embed' && component.products) {
          component.products = component.products.map(p => fullProductsMap.get(p.id) || p);
        }
      }
    }

    // 最后，将处理好的完整数据赋值给 ref
    event.value = initialData;

  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

// 路由监听 (保持不变)
watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) {
      fetchEventData(newSlug);
      window.scrollTo(0, 0);
    }
  },
  { immediate: true }
);

</script>

<style scoped>
/* --- 布局与通用样式 --- */
.dynamic-content-area {
  padding: 2.5rem;
  max-width: 1200px; /* 限制主内容区的最大宽度以保证可读性 */
  margin: 0 auto;   /* 居中 */
}

.markdown-block,
.product-embed-block {
  margin-bottom: 2rem;
}
.dynamic-content-area > div:last-child {
  margin-bottom: 0;
}

/* --- 嵌入制品块的核心样式 --- */
.product-embed-block {
  /* 为横向滚动区域提供一个容器 */
}

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
  width: 220px; /* 与 ProductList 中设置的宽度保持一致 */
}


/* --- Markdown 渲染样式 (保持不变) --- */
:deep(.markdown-block p) {
  line-height: 1.8;
  margin-bottom: 1.5rem;
}
:deep(.markdown-block h2) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}
/* ... 其他Markdown样式 ... */
/*链接嵌入样式*/
.link-embed-block .external-link {
  display: inline-block;
  padding: 0.5rem 1.2rem;
  border: 2px solid var(--color-accent);
  border-radius: 0 8px 8px 0;
  background: var(--color-background);
  color: var(--color-accent);
  font-weight: 500;
  text-decoration: none;
  transition: 
    background 0.2s,
    color 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
  box-shadow: 2px 2px 0 var(--color-accent), 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
}
.link-embed-block .external-link:hover {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
  box-shadow: 4px 4px 0 var(--color-accent), 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px) scale(1.03);
}

.iframe-embed-block .embedded-iframe {
  width: 100%;
  min-height: 300px;
  max-height: 60vh;
  aspect-ratio: 16 / 9;
  border: 2px solid #fff;
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s;
  display: block;
}
.iframe-embed-block .embedded-iframe:hover {
  border-color: var(--color-accent);
}
.file-embed-block .external-link {
  display: inline-block;
  padding: 0.5rem 1.2rem;
  border: 2px solid var(--color-accent);
  border-radius: 0 8px 8px 0;
  background: var(--color-background);
  color: var(--color-accent);
  font-weight: 500;
  text-decoration: none;
  transition: 
    background 0.2s,
    color 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
  box-shadow: 2px 2px 0 var(--color-accent), 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  margin-top: 1rem;
}
.file-embed-block .external-link:hover {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
  box-shadow: 4px 4px 0 var(--color-accent), 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px) scale(1.03);
}
</style>