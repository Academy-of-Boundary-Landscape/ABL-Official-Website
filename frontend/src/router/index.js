// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/recruitment',
      name: 'recruitment',
      component: () => import('../views/RecruitmentView.vue'),
    },
    {
      path: '/project/zhu-yuanzhang', // 定义一个清晰的URL
      name: 'zhu-yuanzhang',
      component: () => import('../views/zyzView.vue'),
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductList.vue'),
    },
    {
      path: '/products/:slug', // 路径中包含一个名为 "slug" 的动态参数
      name: 'ProductDetail',
      component: () => import('../views/ProductDetail.vue'),
      // Vue Router 会自动将URL中的 slug 部分作为参数传递给组件
    },
    {
      path: '/events',
      name: 'EventList',
      component: () => import('../views/EventList.vue'),
    },
    {
      path: '/events/:slug',
      name: 'EventDetail',
      component: () => import('../views/EventDetail.vue'),
    },
    {
      path: '/project/csd20',
      name: 'csd20',
      component: () => import('../views/projects/csd20.vue'),
    },
    {
      path: '/project/csd20/music',
      name: 'csd20music',
      component: () => import('../views/projects/csd20music.vue'),
    },
  ],
})

// 部署后 chunk 文件名会变，已打开的旧页面点击导航会请求到不存在的 chunk。
// 动态 import 失败时 vue-router 会静默中止导航——点击看起来毫无反应。
// 这里捕获该错误并整页重载，让用户拿到新版本。
router.onError((err) => {
  const message = err?.message ?? ''
  if (
    /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(
      message,
    )
  ) {
    window.location.reload()
  }
})

export default router
