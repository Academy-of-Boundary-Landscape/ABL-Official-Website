import { ref, computed, watch, toValue, onScopeDispose } from 'vue'
import { apiClient } from './strapi'

const STATUS_MESSAGE = {
  403: '没有访问权限（Strapi 未开放该接口的 Public 权限）',
  404: '请求的内容不存在',
  500: '服务器内部错误',
}

/**
 * 把 axios 抛出的各种形态归一成 { status, message }。
 * 被 AbortController 取消的请求不是错误，返回 null。
 */
export const normalizeStrapiError = (e) => {
  if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return null
  const status = e?.response?.status ?? null
  const message =
    STATUS_MESSAGE[status] ?? (status ? `请求失败（HTTP ${status}）` : '连接超时或服务器错误。')
  const normalized = { status, message }
  // 原始 axios 错误（含 Strapi 的 error.details）不能就这么丢掉——之前 8 个
  // call site 各自 console.error 过原始错误，归一化之后这条观测能力消失了。
  // 用非可枚举属性挂载，不出现在 JSON.stringify / 默认对象展开里，
  // 也不会污染依赖 { status, message } 两个字段做相等比较的既有测试。
  Object.defineProperty(normalized, 'cause', { value: e, enumerable: false })
  return normalized
}

export function useStrapiList(resource, params = {}, options = {}) {
  const { debounce = 0, immediate = true } = options

  const data = ref([])
  const meta = ref(null)
  const loading = ref(immediate)
  const error = ref(null)

  const isEmpty = computed(
    () => !loading.value && !error.value && Array.isArray(data.value) && data.value.length === 0,
  )

  let controller = null
  let timer = null
  let disposed = false

  const run = async () => {
    if (disposed) return
    controller?.abort()
    controller = new AbortController()
    const mine = controller

    loading.value = true
    error.value = null

    try {
      const res = await apiClient.get(`/${resource}`, {
        params: toValue(params),
        signal: mine.signal,
      })
      if (mine.signal.aborted || disposed) return
      data.value = res.data?.data ?? []
      meta.value = res.data?.meta ?? null
    } catch (e) {
      if (mine.signal.aborted || disposed) return
      const normalized = normalizeStrapiError(e)
      if (normalized) {
        // 开发库是空的，这些错误路径第一次真正跑起来大概率是在生产环境——
        // 把原始 axios 错误打到控制台，不能让排障时只剩一句归一化文案可看。
        console.error(`[strapi] GET /${resource} 失败：`, e)
        error.value = normalized
      }
    } finally {
      if (!mine.signal.aborted && !disposed) loading.value = false
    }
  }

  const refresh = () => {
    if (!debounce) return run()
    clearTimeout(timer)
    return new Promise((resolve) => {
      timer = setTimeout(() => resolve(run()), debounce)
    })
  }

  watch(
    () => toValue(params),
    () => refresh(),
    { deep: true },
  )

  if (immediate) run()

  onScopeDispose(() => {
    disposed = true
    controller?.abort()
    clearTimeout(timer)
  })

  return { data, meta, loading, error, isEmpty, refresh: run }
}

export function useStrapiOne(resource, params = {}) {
  const list = useStrapiList(resource, params)
  const data = computed(() => list.data.value?.[0] ?? null)
  const notFound = computed(
    () => !list.loading.value && !list.error.value && list.data.value?.length === 0,
  )
  return {
    data,
    loading: list.loading,
    error: list.error,
    notFound,
    refresh: list.refresh,
  }
}
