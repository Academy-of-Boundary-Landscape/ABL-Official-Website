import { computed, toValue } from 'vue'
import { useStrapiList } from './useStrapiResource'

export function normalizeProjects(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.filter((item) => item && typeof item.title === 'string' && item.title.length > 0)
}

export function useProjects({ limit } = {}) {
  const list = useStrapiList('projects', () => ({
    populate: 'coverImage',
    sort: 'date:desc',
    ...(limit ? { 'pagination[limit]': toValue(limit) } : {}),
  }))

  return { ...list, data: computed(() => normalizeProjects(list.data.value)) }
}
