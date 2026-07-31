import { computed, toValue } from 'vue'
import { useStrapiList } from './useStrapiResource'

export function normalizeProjects(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.filter((item) => item && typeof item.title === 'string' && item.title.length > 0)
}

export function useProjects({ limit } = {}) {
  const list = useStrapiList('projects', () => {
    const lim = toValue(limit)
    return {
      populate: 'coverImage',
      sort: 'date:desc',
      ...(lim ? { 'pagination[limit]': lim } : {}),
    }
  })

  const data = computed(() => normalizeProjects(list.data.value))
  // isEmpty 要看过滤脏数据之后的 data，不是原始 list.data——否则脏数据被过滤光时会误判非空。
  const isEmpty = computed(
    () => !list.loading.value && !list.error.value && data.value.length === 0,
  )

  return { ...list, data, isEmpty }
}
