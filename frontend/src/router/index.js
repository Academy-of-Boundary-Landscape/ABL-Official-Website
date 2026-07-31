// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
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
