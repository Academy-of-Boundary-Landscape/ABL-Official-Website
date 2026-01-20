// src/composables/strapi.js

import axios from 'axios';

// 1. 从环境变量中读取 API 的基础 URL。
//    这是唯一正确的方式，它会根据 .env.production 或 .env.development 自动切换。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

// 2. 创建 axios 实例，并直接使用完整的、绝对的 API 基础 URL。
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// 3. 修改 getStrapiMedia 帮助函数，使其始终使用完整的 Strapi URL。
export const getStrapiMedia = (mediaObject) => {
  // 适配 Strapi v4 的数据结构 (通常图片在 data.attributes.url)
  const imageUrl = mediaObject?.data?.attributes?.url || mediaObject?.attributes?.url || mediaObject?.url;

  if (!imageUrl) {
    return null;
  }
  
  // 如果 URL 已经是绝对路径 (http:// 或 https://)，则直接返回
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // 否则，拼接基础 URL 和 Strapi 返回的相对路径 (例如 /uploads/image.jpeg)
  return `${STRAPI_URL}${imageUrl}`;
};