<!-- src/components/SiteHeader.vue -->
<template>
  <n-layout-header bordered class="site-header">
    <div class="branding-bar container">
      <RouterLink to="/" class="logo" @click="closeDrawer">
        <img src="@/assets/images/abl_logo.webp" alt="境界景观学会 Logo" />
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
import { ref, h, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NLayoutHeader, NMenu, NButton, NIcon, NDrawer, NDrawerContent } from 'naive-ui'

const route = useRoute()

// 控制移动端抽屉
const showDrawer = ref(false)

// 当前激活的菜单项。菜单 key 与路由 path 的映射见下方 ROUTE_KEY_MAP。
const activeKey = ref('')

const ROUTE_KEY_MAP = {
  '/': 'home',
  '/works': 'works',
  '/news': 'news',
  '/join': 'join',
  '/about': 'about',
}

// 直接输入 URL 或刷新页面时，没有任何点击事件触发 v-model:value，菜单项
// 不会高亮；用 watch 把 activeKey 和当前路由同步起来，immediate 覆盖首次渲染。
watch(
  () => route.path,
  (path) => {
    activeKey.value = ROUTE_KEY_MAP[path] ?? ''
  },
  { immediate: true },
)

// 菜单选项：没有任何响应式依赖（不依赖 works 数据等），不需要 computed
const menuOptions = [
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
        { to: '/works', class: 'menu-link' },
        {
          default: () => '作品 // Works',
        },
      ),
    key: 'works',
  },
  {
    label: () =>
      h(
        RouterLink,
        { to: '/news', class: 'menu-link' },
        {
          default: () => '动态 // News',
        },
      ),
    key: 'news',
  },
  {
    label: () =>
      h(
        RouterLink,
        { to: '/join', class: 'menu-link' },
        {
          default: () => '加入我们 // Join',
        },
      ),
    key: 'join',
  },
  {
    label: () =>
      h(
        RouterLink,
        { to: '/about', class: 'menu-link' },
        {
          default: () => '关于 // About',
        },
      ),
    key: 'about',
  },
]

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
  padding: 0.35rem 0; /* 窄屏默认值；桌面（md 及以上）见下方 @screen md 覆盖 */
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
  gap: 1rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  text-decoration: none;
}

.logo img {
  height: 3rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
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
  font-size: 1.35rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
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
  font-size: 0.7rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  color: var(--color-text);
  opacity: 0.8;
  margin-top: 0.1rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
}

/* 桌面端导航：窄屏默认隐藏；桌面见下方 @screen md 覆盖 */
.desktop-nav {
  flex: 1;
  display: none;
  justify-content: center;
}

/* 移动端菜单按钮：窄屏默认显示；桌面见下方 @screen md 覆盖 */
.mobile-menu-btn {
  display: flex;
  color: var(--color-text);
}

/* 菜单链接样式 */
:deep(.menu-link) {
  color: inherit;
  text-decoration: none;
}

/* Naive UI 菜单样式覆盖
   注：原来这里还有一条 `:deep(.n-menu) { background-color: transparent !important; }`。
   查过 naive-ui 的 Menu 主题源码（node_modules/naive-ui/lib/menu/styles/light.js，
   dark 主题直接复用它），Menu 自身的 self.color 默认就是 '#0000'（全透明），
   我们的 themeOverrides.Menu 从未覆盖过这个 color 字段，所以这条规则从写下的
   那天起就没有产生过任何实际效果，删掉不会有任何视觉变化。 */

/* 以下三处 :deep(.n-menu-item*) 把下划线（border-bottom）、发光文字阴影
   （text-shadow）与文字颜色耦合在一起，是这个站点特有的"选中/悬停发光下划线"
   效果。Naive 的 Menu 主题变量里没有 border-bottom / text-shadow 这类字段，
   只把颜色部分单独搬进 themeOverrides 会把同一个视觉效果的颜色来源拆成两处
   （一处在 theme.js，一处在这里的 text-shadow 硬编码色值），维护成本反而更高，
   所以整体保留在这里而不拆分。*/
:deep(.n-menu-item) {
  font-size: 1rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
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

/* 响应式设计（移动优先：上方为窄屏默认值，md 及以上覆盖为桌面值） */
@screen md {
  .branding-bar {
    padding: 0.45rem 0;
  }

  .logo {
    gap: 0.8rem;
  }

  .logo img {
    height: 5.1rem;
  }

  .site-title {
    font-size: 2.25rem;
  }

  .site-subtitle {
    font-size: 0.88rem;
    margin-top: 0.15rem;
  }

  .desktop-nav {
    display: flex;
  }

  .mobile-menu-btn {
    display: none;
  }

  :deep(.n-menu-item) {
    font-size: 0.86rem;
  }
}
</style>
