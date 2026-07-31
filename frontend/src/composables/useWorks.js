import { toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

/**
 * 作品列表。排序语义：精选置顶 → 手工序 → 开始时间。
 * sort 用逗号分隔的字符串而不是数组：axios 会把数组序列化成 sort[]=…，
 * Strapi 认的是 sort=a:desc,b:desc。
 *
 * @param {Object} params - 筛选与分页参数
 * @param {string|Ref<string>} params.workType - 作品类型，为 "all" 或空时不过滤
 * @param {boolean} params.featuredOnly - 仅显示精选
 * @param {number|Ref<number>} params.limit - 分页限制
 * @param {Object} options - 往 useStrapiList 的 options 透传（debounce / immediate）
 */
export function useWorkList({ workType, featuredOnly, limit } = {}, options = {}) {
  return useStrapiList(
    'works',
    () => {
      const t = String(toValue(workType) ?? '').trim()
      const lim = toValue(limit)
      const filters = {}
      if (t && t !== 'all') filters.workType = { $eq: t }
      if (toValue(featuredOnly)) filters.featured = { $eq: true }
      return {
        populate: 'coverImage',
        sort: 'featured:desc,order:desc,startDate:desc',
        ...(lim ? { 'pagination[limit]': lim } : {}),
        ...(Object.keys(filters).length ? { filters } : {}),
      }
    },
    options,
  )
}

/**
 * 作品详情。body 与 details 是动态区，内层还有媒体（游戏截图）与
 * 可重复组件（下载渠道），不写 { populate: '*' } 深挖就只能拿到组件外壳。
 */
export function useWorkBySlug(slug) {
  return useStrapiOne('works', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: {
      coverImage: true,
      staff: true,
      recruitingRoles: true,
      body: { populate: '*' },
      details: { populate: '*' },
    },
  }))
}

/**
 * 某个作品的开发日志与发布动态。
 * slug 为空时不发请求：详情页先取 work 再取 news，slug 落地前发出去的
 * 请求会因为 filters 里带 undefined 被 axios 丢弃，变成一次无过滤的全量查询。
 */
export function useWorkNews(slug, limit = 10) {
  return useStrapiList(
    'events',
    () => ({
      filters: { relatedWork: { slug: { $eq: toValue(slug) } } },
      populate: 'coverImage',
      sort: 'date:desc',
      // 与 useWorkList 一致必须 toValue：调用方传 ref 时，裸 Ref 会被原样
      // 塞进查询参数，请求悄悄失真。默认值是普通数字，所以这个坑平时不会暴露。
      'pagination[limit]': toValue(limit),
    }),
    { immediate: Boolean(toValue(slug)) },
  )
}
