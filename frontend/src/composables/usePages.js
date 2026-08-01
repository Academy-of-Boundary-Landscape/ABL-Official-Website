import { toValue } from 'vue'
import { useStrapiOne } from './useStrapiResource'

/**
 * 按 slug 取一条 page 记录（`about` / `join` / `home`）。
 *
 * 页面必须容忍记录不存在：社团方是分批录入的，缺了某条时对应区块
 * 降级为空态或整块不渲染，而不是让整页崩掉。notFound 就是给这个用的。
 */
export function usePageBySlug(slug) {
  return useStrapiOne('pages', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: { body: { populate: '*' } },
  }))
}
