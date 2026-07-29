// src/composables/strapi.js

import axios from 'axios'

// 1. 从环境变量中读取 API 的基础 URL。
//    这是唯一正确的方式，它会根据 .env.production 或 .env.development 自动切换。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL
// 给图片资源配置单独的URL，方便CDN部署时调整。默认使用 STRAPI_URL。
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || STRAPI_URL
// 2. 创建 axios 实例，并直接使用完整的、绝对的 API 基础 URL。
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// 3. 修改 getStrapiMedia 帮助函数，使其始终使用完整的 Strapi URL。
export const getStrapiMedia = (mediaObject) => {
  const imageUrl =
    mediaObject?.data?.attributes?.url || mediaObject?.attributes?.url || mediaObject?.url

  if (!imageUrl) return null

  // 绝对 URL 直接返回（比如你未来换 OSS/外链）
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  // ✅ 相对路径一律走 MEDIA_BASE_URL（例如 https://img.../uploads/xxx.jpg）
  return `${MEDIA_BASE_URL}${imageUrl}`
}
