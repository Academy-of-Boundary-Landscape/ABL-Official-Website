import { computed, toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

/**
 * 制品列表。归档页不筛选、不搜索、不排序——那些是贩售运营功能，
 * 而贩售已经停止。默认排序 releaseDate:desc 保留，归档正需要它。
 */
export function useProducts({ limit } = {}, options = {}) {
  return useStrapiList(
    'products',
    () => {
      const lim = toValue(limit)
      return {
        populate: 'coverImage',
        sort: 'releaseDate:desc',
        ...(lim ? { 'pagination[limit]': lim } : {}),
      }
    },
    options,
  )
}

export function useProduct(slug) {
  return useStrapiOne('products', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: '*',
  }))
}

/**
 * EventDetail 的动态区里 product 嵌入块只带 id，需要二次批量补全。
 * 用 $in 一次取回，不要在循环里逐个请求。
 */
export function useProductsByIds(ids) {
  const list = useStrapiList(
    'products',
    () => ({
      filters: { id: { $in: toValue(ids) ?? [] } },
      populate: 'coverImage',
    }),
    { immediate: (toValue(ids) ?? []).length > 0 },
  )

  const byId = computed(() =>
    Object.fromEntries((list.data.value ?? []).map((item) => [item.id, item])),
  )

  // id 列表为空时尚未发起请求，不能算"查无结果"——避免在 ids 到来前闪一下空态。
  const isEmpty = computed(() => (toValue(ids)?.length ?? 0) > 0 && list.isEmpty.value)

  return { ...list, byId, isEmpty }
}
