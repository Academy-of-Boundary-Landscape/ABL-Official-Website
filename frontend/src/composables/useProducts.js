import { computed, toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

export function useProducts({ limit, category, search, sort } = {}, options = {}) {
  return useStrapiList(
    'products',
    () => {
      const cat = String(toValue(category) ?? '').trim()
      const keyword = String(toValue(search) ?? '').trim()
      const lim = toValue(limit)
      const filters = {}
      if (cat && cat !== '全部') filters.category = { $eq: cat }
      if (keyword) filters.title = { $containsi: keyword }
      return {
        populate: 'coverImage',
        sort: toValue(sort) || 'releaseDate:desc',
        ...(lim ? { 'pagination[limit]': lim } : {}),
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
 * 临时方案：csd20 页面按标题硬匹配制品。
 * 后台改一个字这里就会空。正确做法是给该制品一个稳定的 slug 或标识字段，
 * 需要改 Strapi Content-Type 与生产库既有内容，本轮不做。
 * 见 docs/superpowers/specs/2026-07-31-frontend-upgrade-design.md 第 5 节。
 */
export function useProductByTitle(title) {
  return useStrapiOne('products', () => ({
    filters: { title: { $eq: toValue(title) } },
    populate: 'coverImage',
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

  // isEmpty 要看裁剪后的 picked，不是原始 list.data——否则原始池非空但裁剪结果为空时会误判非空。
  const isEmpty = computed(
    () => !list.loading.value && !list.error.value && picked.value.length === 0,
  )

  return { ...list, data: picked, isEmpty }
}
