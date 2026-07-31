import { toValue } from 'vue'
import { useStrapiList } from './useStrapiResource'

/** 本地时区（站点用户在 UTC+8）的 YYYY-MM-DD，避免 UTC 午夜前后把"今天"算成"昨天"。 */
const today = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function useConventions({ upcoming = false, limit } = {}) {
  return useStrapiList('conventions', () => {
    const isUpcoming = toValue(upcoming)
    const lim = toValue(limit)
    return {
      sort: isUpcoming ? 'date:asc' : 'date:desc',
      ...(isUpcoming ? { 'filters[date][$gte]': today() } : {}),
      ...(lim ? { 'pagination[limit]': lim } : {}),
    }
  })
}
