import { computed, toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

export function useProducts({ limit, category, search } = {}, options = {}) {
  return useStrapiList(
    'products',
    () => {
      const cat = String(toValue(category) ?? '').trim()
      const keyword = String(toValue(search) ?? '').trim()
      const filters = {}
      if (cat && cat !== '全部') filters.category = { $eq: cat }
      if (keyword) filters.title = { $containsi: keyword }
      return {
        populate: 'coverImage',
        sort: 'releaseDate:desc',
        ...(limit ? { 'pagination[limit]': toValue(limit) } : {}),
        ...(Object.keys(filters).length ? { filters } : {}),
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

  return { ...list, byId }
}

/** ProductDetail 的推荐位。行为与改造前一致：排除当前条目后随机取若干。 */
export function useRecommendedProducts(excludeId, count = 3) {
  const list = useStrapiList('products', () => ({
    populate: 'coverImage',
    'filters[id][$ne]': toValue(excludeId),
    'pagination[limit]': 50,
  }))

  const picked = computed(() => {
    const pool = [...(list.data.value ?? [])]
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, count)
  })

  return { ...list, data: picked }
}
