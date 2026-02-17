<!-- src/components/SiteHeader.vue -->
<template>
  <n-layout-header bordered class="site-header">
    <div class="branding-bar container">
      <RouterLink to="/" class="logo" @click="closeDrawer">
        <img src="@/assets/images/abl_logo.png" alt="境界景观学会 Logo" />
        <div class="title-group">
          <span class="site-title">境界景观学会</span>
          <p class="site-subtitle">Academy of Boundary Landscape</p>
        </div>
      </RouterLink>

      <!-- 桌面端菜单 -->
      <div class="desktop-nav">
        <n-menu
          v-model:value="activeKey"
          mode="horizontal"
          :options="menuOptions"
          @update:value="handleMenuSelect"
        />
      </div>

      <!-- 移动端菜单按钮 -->
      <n-button text class="mobile-menu-btn" @click="showDrawer = true">
        <template #icon>
          <n-icon :size="24">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </n-icon>
        </template>
      </n-button>
    </div>

    <!-- 移动端抽屉菜单 -->
    <n-drawer v-model:show="showDrawer" :width="280" placement="right">
      <n-drawer-content :native-scrollbar="false" title="导航菜单">
        <n-menu
          v-model:value="activeKey"
          mode="vertical"
          :options="menuOptions"
          @update:value="handleMobileMenuSelect"
        />
      </n-drawer-content>
    </n-drawer>
  </n-layout-header>
</template>

<script setup>
import { ref, h, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { NLayoutHeader, NMenu, NButton, NIcon, NDrawer, NDrawerContent } from 'naive-ui'
import { apiClient } from '@/composables/strapi'

// 控制移动端抽屉
const showDrawer = ref(false)

// 当前激活的菜单项
const activeKey = ref('')

const projectMenuChildren = ref([])

const isExternalLink = (link = '') => /^https?:\/\//i.test(link)

const toInternalProjectPath = (link = '') => {
  if (!link) return '/project'
  if (link.startsWith('/')) return link
  return `/project/${link}`
}

const normalizeProjects = (items = []) =>
  items
    .map((item) => {
      const attrs = item?.attributes || item
      return {
        id: item?.id ?? attrs?.id ?? attrs?.documentId ?? attrs?.title,
        title: attrs?.title || '',
        link: attrs?.link || '',
      }
    })
    .filter((project) => project.title && project.link)

const buildProjectMenuChildren = (projects = []) =>
  projects.map((project, index) => {
    const key = `project-${project.id ?? index}`

    if (isExternalLink(project.link)) {
      return {
        key,
        label: () =>
          h(
            'a',
            {
              href: project.link,
              class: 'menu-link',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            project.title,
          ),
      }
    }

    return {
      key,
      label: () =>
        h(
          RouterLink,
          { to: toInternalProjectPath(project.link), class: 'menu-link' },
          {
            default: () => project.title,
          },
        ),
    }
  })

const fetchProjectMenu = async () => {
  try {
    const response = await apiClient.get('/projects', {
      params: {
        sort: 'date:desc',
        'pagination[limit]': 20,
      },
    })

    const data = response.data?.data || response.data || []
    const projects = normalizeProjects(data)
    projectMenuChildren.value = buildProjectMenuChildren(projects)
  } catch (error) {
    console.error('无法获取导航项目菜单:', error)
    projectMenuChildren.value = []
  }
}

// 菜单选项
const menuOptions = computed(() => [
  {
    label: () =>
      h(
        RouterLink,
        { to: '/', class: 'menu-link' },
        {
          default: () => '主页 // Home',
        },
      ),
    key: 'home',
  },
  {
    label: () =>
      h(
        RouterLink,
        { to: '/events', class: 'menu-link' },
        {
          default: () => '动态 // Events',
        },
      ),
    key: 'events',
  },
  {
    label: () =>
      h(
        RouterLink,
        { to: '/products', class: 'menu-link' },
        {
          default: () => '制品 // Products',
        },
      ),
    key: 'products',
  },
  {
    label: () =>
      h(
        RouterLink,
        { to: '/recruitment', class: 'menu-link' },
        {
          default: () => '招募 // Join',
        },
      ),
    key: 'recruitment',
  },
  {
    label: '企划 // Project',
    key: 'project',
    children:
      projectMenuChildren.value.length > 0
        ? projectMenuChildren.value
        : [
            {
              label: '暂无项目',
              key: 'project-empty',
              disabled: true,
            },
          ],
  },
])

// 桌面端菜单选择处理
const handleMenuSelect = () => {
  // 菜单项点击后会自动通过 RouterLink 导航
}

// 移动端菜单选择处理
const handleMobileMenuSelect = () => {
  closeDrawer()
}

// 关闭抽屉
const closeDrawer = () => {
  showDrawer.value = false
}

onMounted(fetchProjectMenu)
</script>

<style scoped>
.site-header {
  background: linear-gradient(180deg, #0a0f1a 0%, #050810 100%);
  box-shadow:
    0 4px 12px rgba(5, 8, 16, 0.8),
    0 0 30px rgba(61, 180, 230, 0.1);
  border-bottom: 1px solid rgba(61, 180, 230, 0.2);
}

.branding-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.45rem 0;
  position: relative;
}

.branding-bar::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(61, 180, 230, 0.3), transparent);
}

/* Logo 容器 */
.logo {
  display: flex;
  align-items: flex-end;
  gap: 0.8rem;
  text-decoration: none;
}

.logo img {
  height: 5.1rem;
  width: auto;
  object-fit: contain;
}

.title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.site-title {
  font-family: var(--font-family-heading);
  font-size: 2.25rem;
  color: var(--color-heading);
  font-weight: bold;
  text-shadow:
    0 0 8px rgba(61, 180, 230, 0.4),
    0 0 16px rgba(13, 139, 201, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.8);
  line-height: 1.1;
  letter-spacing: 2px;
}

.site-subtitle {
  font-family: var(--font-family-body);
  font-size: 0.88rem;
  color: var(--color-text);
  opacity: 0.8;
  margin-top: 0.15rem;
}

/* 桌面端导航 */
.desktop-nav {
  flex: 1;
  display: flex;
  justify-content: center;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
}

/* 菜单链接样式 */
:deep(.menu-link) {
  color: inherit;
  text-decoration: none;
}

/* Naive UI 菜单样式覆盖 */
:deep(.n-menu) {
  background-color: transparent !important;
}

:deep(.n-menu-item) {
  font-size: 0.86rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

:deep(.n-menu-item:hover) {
  color: var(--color-accent) !important;
  text-shadow: 0 0 10px rgba(61, 180, 230, 0.5);
}

:deep(.n-menu-item.n-menu-item--selected) {
  color: var(--color-accent) !important;
  border-bottom-color: var(--color-accent);
  text-shadow: 0 0 10px rgba(61, 180, 230, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .branding-bar {
    padding: 0.35rem 0;
  }

  .logo {
    gap: 1rem;
  }

  .logo img {
    height: 3rem;
  }

  .site-title {
    font-size: 1.35rem;
  }

  .site-subtitle {
    font-size: 0.7rem;
    margin-top: 0.1rem;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
    color: var(--color-text);
  }

  :deep(.n-menu-item) {
    font-size: 1rem;
  }
}
</style>
