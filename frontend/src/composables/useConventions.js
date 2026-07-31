import { toValue } from 'vue'
import { useStrapiList } from './useStrapiResource'

const today = () => new Date().toISOString().slice(0, 10)

export function useConventions({ upcoming = false, limit } = {}) {
  return useStrapiList('conventions', () => ({
    sort: upcoming ? 'date:asc' : 'date:desc',
    ...(toValue(upcoming) ? { 'filters[date][$gte]': today() } : {}),
    ...(limit ? { 'pagination[limit]': toValue(limit) } : {}),
  }))
}
