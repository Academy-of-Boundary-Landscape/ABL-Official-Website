import { toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

/** 列表页 / 首页共用。search 可以是 ref 或普通值。 */
export function useEvents({ limit, search } = {}, options = {}) {
  return useStrapiList(
    'events',
    () => {
      const keyword = String(toValue(search) ?? '').trim()
      const lim = toValue(limit)
      return {
        populate: 'coverImage',
        sort: 'date:desc',
        ...(lim ? { 'pagination[limit]': lim } : {}),
        ...(keyword ? { filters: { title: { $containsi: keyword } } } : {}),
      }
    },
    options,
  )
}

/** 详情页。mainContent 是动态区，必须深度 populate 才能拿到嵌入块。 */
export function useEvent(slug) {
  return useStrapiOne('events', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: { mainContent: { populate: '*' } },
  }))
}
