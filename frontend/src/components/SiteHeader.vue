<!-- src/components/SiteHeader.vue -->
<template>
  <header class="site-header">
    <!-- 1. 顶部品牌区域 -->
    <div class="branding-bar">
      <RouterLink to="/" class="logo" @click="closeMenu">
        <img src="@/assets/images/abl_logo.png" alt="境界景观学会 Logo">
        
        <!-- ↓↓↓ 关键修改：将标题和副标题包裹在一个div中 ↓↓↓ -->
        <div class="title-group">
          <span class="site-title">境界景观学会</span>
          <p class="site-subtitle">Academy of Boundary Landscape</p>
        </div>

      </RouterLink>

      <!-- 汉堡菜单按钮 -->
      <button class="menu-toggle" @click="toggleMenu" :class="{ 'is-active': isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
<nav class="main-nav" :class="{ 'is-open': isMenuOpen }">
      <div class="nav-links">
        <RouterLink to="/" @click="closeMenu">主页//Home</RouterLink>
        <RouterLink to="/events" @click="closeMenu">动态//Events</RouterLink>
        <RouterLink to="/products" @click="closeMenu">制品//Products</RouterLink>
        <RouterLink to="/recruitment" @click="closeMenu">招募//Join</RouterLink>
        <!-- 把 Project 菜单放到 nav-links 里 -->
        <div 
          class="nav-dropdown"
          @mouseenter="showProjectMenu = true"
          @mouseleave="showProjectMenu = false"
          @click="showProjectMenu = !showProjectMenu"
        >
          <span class="dropdown-title">企划//Project</span>
          <div v-if="showProjectMenu" class="dropdown-menu">
            <RouterLink to="/project/csd20" @click="closeMenu">梦违科学世纪20周年</RouterLink>
            <RouterLink to="/project/zhu-yuanzhang" @click="closeMenu">东方朱元璋</RouterLink>
            <a href="https://hourai2025.secret-sealing.club" target="_blank" rel="noopener" @click="closeMenu">蓬莱人形20周年</a>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

// 控制移动端菜单的开关状态
const isMenuOpen = ref(false)

// 控制 Project 下拉菜单的显示状态
const showProjectMenu = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// 在点击链接后关闭菜单
const closeMenu = () => {
  isMenuOpen.value = false
  showProjectMenu.value = false
}
</script>
<style scoped>
/* ==========================================================================
   1. Main Header Container
   ========================================================================== */
.site-header {
  position: static;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}


/* ==========================================================================
   2. Top Branding Bar
   ========================================================================== */
.branding-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  background: var(--color-background);
  backdrop-filter: blur(10px);
}


/* ==========================================================================
   3. Component Styling ("Logo + Title Group" & Nav Bar)
   ========================================================================== */

/* --- Logo 容器 --- */
.logo {
  display: flex;
  /* 关键修改：改为flex-end，让子项的底部对齐 */
  align-items: flex-end;
  gap: 2rem;
  text-decoration: none;
}

/* --- Logo 图片 --- */
.logo img {
  height: 8rem;
  width: auto;
  object-fit: contain;
}

/* --- (新增) 标题与副标题的容器 --- */
.title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 确保内部文本左对齐 */
}

/* --- Logo 右侧的主标题 --- */
.site-title {
  font-family: var(--font-family-heading);
  font-size: 3.5rem;
  color: var(--color-heading);
  font-weight: bold;
  text-shadow: 0 0 5px rgb(0,0,0);
  line-height: 1.1; /* 减小行高，使其更紧凑 */
}

/* --- (新增) 副标题 --- */
.site-subtitle {
  font-family: var(--font-family-body);
  font-size: 1.2rem;
  color: var(--color-text);
  opacity: 0.8; /* 让副标题稍微不那么突出 */
  margin-top: 0.5rem; /* 与主标题的间距 */
}

/* --- 底部导航条 (保持不变) --- */
.main-nav {
  width: 100%;
  background-color: #1D232C;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.nav-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem; /* 原2.5rem，减小间距 */
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.4rem 1.2rem; /* 原0.8rem 2rem，减小上下和左右间距 */
}
.main-nav a {
  font-family: var(--font-family-body);
  color: var(--color-text);
  font-size: 0.92rem; /* 原1rem，稍微调小 */
  padding: 0.3rem 0; /* 原0.5rem 0，减小上下内边距 */
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
}
.main-nav a:hover {
  color: var(--color-accent);
}
.main-nav a.router-link-exact-active {
  color: var(--color-accent);
  border-color: var(--color-accent);
}


/* ==========================================================================
   4. Mobile & Responsive Design
   ========================================================================== */

/* --- 汉堡菜单按钮 --- */
.menu-toggle {
  display: none;
  background: transparent; border: none; cursor: pointer; z-index: 1001;
  flex-direction: column; justify-content: space-around; width: 30px;
  height: 24px; padding: 0;
}
.menu-toggle span {
  width: 100%; height: 3px; background-color: #fff; border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.menu-toggle.is-active span:nth-child(1) { transform: rotate(45deg) translate(7px, 7px); }
.menu-toggle.is-active span:nth-child(2) { opacity: 0; }
.menu-toggle.is-active span:nth-child(3) { transform: rotate(-45deg) translate(6px, -6px); }


/* --- 移动端视图 --- */
@media (max-width: 768px) {
  .branding-bar {
    padding: 1.5rem 1rem;
  }
  .logo {
    gap: 1rem; /* 减小移动端Logo和文字的间距 */
  }
  .logo img {
    height: 4rem; /* 减小移动端Logo大小 */
  }
  .site-title {
    font-size: 1.8rem;
  }
  .site-subtitle {
    font-size: 0.8rem;
    margin-top: 0.2rem;
  }

  /* ... 其余移动端样式保持不变 ... */
  .main-nav { display: none; }
  .menu-toggle { display: flex; }
  .main-nav.is-open {
    display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
    background: rgba(13, 13, 13, 0.9); backdrop-filter: blur(15px);
    transform: translateX(0);
    .nav-links { flex-direction: column; gap: 2rem; }
    a { font-size: 1.8rem; }
  }
  .main-nav {
    transform: translateX(100%); transition: transform 0.4s ease-in-out;
  }
}
.nav-dropdown {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.dropdown-title {
  font-family: var(--font-family-body);
  color: var(--color-text);
  font-size: 1rem;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.dropdown-title:hover {
  color: var(--color-accent);
}

.dropdown-menu {
  position: absolute;
  top: 2.2rem;
  left: 0;
  min-width: 140px;
  background: #23283a;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border-radius: 6px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
}

.dropdown-menu a {
  color: var(--color-text);
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  text-decoration: none;
  transition: background 0.2s;
  border-bottom: none;
}

.dropdown-menu a:hover {
  background: var(--color-accent);
  color: #fff;
}

/* 移动端下拉菜单适配 */
@media (max-width: 768px) {
  .nav-dropdown {
    width: 100%;
  }
  .dropdown-menu {
    position: static;
    box-shadow: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
  }
  .dropdown-menu a {
    font-size: 1.2rem;
    padding: 0.8rem 2rem;
  }
}
</style>