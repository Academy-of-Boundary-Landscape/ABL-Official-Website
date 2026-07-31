import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useStrapiList, useStrapiOne, normalizeStrapiError } from '@/composables/useStrapiResource'

/** 在 effectScope 里跑 composable，返回结果与销毁函数。 */
const withScope = (fn) => {
  const scope = effectScope()
  const result = scope.run(fn)
  return { result, stop: () => scope.stop() }
}

const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

const okList = (items, meta = null) => ({ data: { data: items, meta } })

let get

beforeEach(() => {
  get = vi.spyOn(apiClient, 'get')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('normalizeStrapiError', () => {
  it('取消的请求不算错误', () => {
    expect(normalizeStrapiError({ code: 'ERR_CANCELED' })).toBeNull()
  })

  it('403 提示 Public 权限未开', () => {
    const err = normalizeStrapiError({ response: { status: 403 } })
    expect(err.status).toBe(403)
    expect(err.message).toContain('权限')
  })

  it('404 提示内容不存在', () => {
    expect(normalizeStrapiError({ response: { status: 404 } }).message).toContain('不存在')
  })

  it('无响应时归为连接失败', () => {
    const err = normalizeStrapiError({ message: 'Network Error' })
    expect(err.status).toBeNull()
    expect(err.message).toContain('连接')
  })
})

describe('useStrapiList', () => {
  it('解包 v5 响应的 data.data，并保留 meta', async () => {
    get.mockResolvedValue(okList([{ id: 1 }], { pagination: { total: 1 } }))
    const { result, stop } = withScope(() => useStrapiList('events'))
    await flush()
    expect(result.data.value).toEqual([{ id: 1 }])
    expect(result.meta.value).toEqual({ pagination: { total: 1 } })
    expect(result.loading.value).toBe(false)
    expect(result.error.value).toBeNull()
    stop()
  })

  it('请求路径为 /资源名，params 原样透传', async () => {
    get.mockResolvedValue(okList([]))
    const { stop } = withScope(() =>
      useStrapiList('events', { populate: 'coverImage', sort: 'date:desc' }),
    )
    await flush()
    expect(get).toHaveBeenCalledWith(
      '/events',
      expect.objectContaining({
        params: { populate: 'coverImage', sort: 'date:desc' },
      }),
    )
    stop()
  })

  it('空数组时 isEmpty 为真，加载中不算空', async () => {
    get.mockResolvedValue(okList([]))
    const { result, stop } = withScope(() => useStrapiList('events'))
    expect(result.loading.value).toBe(true)
    expect(result.isEmpty.value).toBe(false)
    await flush()
    expect(result.isEmpty.value).toBe(true)
    stop()
  })

  it('请求失败时暴露归一化的 error，且 loading 收尾', async () => {
    get.mockRejectedValue({ response: { status: 403 } })
    const { result, stop } = withScope(() => useStrapiList('events'))
    await flush()
    expect(result.error.value.status).toBe(403)
    expect(result.loading.value).toBe(false)
    expect(result.isEmpty.value).toBe(false)
    stop()
  })

  it('params 是 getter 时，变化会触发重新请求', async () => {
    get.mockResolvedValue(okList([]))
    const search = ref('')
    const { stop } = withScope(() => useStrapiList('events', () => ({ search: search.value })))
    await flush()
    expect(get).toHaveBeenCalledTimes(1)

    search.value = 'abc'
    await flush()
    expect(get).toHaveBeenCalledTimes(2)
    expect(get.mock.calls[1][1].params).toEqual({ search: 'abc' })
    stop()
  })

  it('每次请求都带 AbortSignal', async () => {
    get.mockResolvedValue(okList([]))
    const { stop } = withScope(() => useStrapiList('events'))
    await flush()
    expect(get.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    stop()
  })

  it('作用域销毁后，迟到的响应不再写回状态', async () => {
    let resolve
    get.mockReturnValue(new Promise((r) => (resolve = r)))
    const { result, stop } = withScope(() => useStrapiList('events'))
    stop()
    resolve(okList([{ id: 99 }]))
    await flush()
    expect(result.data.value).toEqual([])
    stop()
  })

  it('refresh 会重新发起请求', async () => {
    get.mockResolvedValue(okList([]))
    const { result, stop } = withScope(() => useStrapiList('events'))
    await flush()
    await result.refresh()
    expect(get).toHaveBeenCalledTimes(2)
    stop()
  })
})

describe('useStrapiOne', () => {
  it('取列表首项作为结果', async () => {
    get.mockResolvedValue(okList([{ id: 7, title: 'x' }]))
    const { result, stop } = withScope(() => useStrapiOne('events', { 'filters[slug][$eq]': 'a' }))
    await flush()
    expect(result.data.value).toEqual({ id: 7, title: 'x' })
    expect(result.notFound.value).toBe(false)
    stop()
  })

  it('结果为空时 notFound 为真', async () => {
    get.mockResolvedValue(okList([]))
    const { result, stop } = withScope(() => useStrapiOne('events', {}))
    await flush()
    expect(result.data.value).toBeNull()
    expect(result.notFound.value).toBe(true)
    stop()
  })

  it('出错时 notFound 不为真——错误与空要分得开', async () => {
    get.mockRejectedValue({ response: { status: 500 } })
    const { result, stop } = withScope(() => useStrapiOne('events', {}))
    await flush()
    expect(result.notFound.value).toBe(false)
    expect(result.error.value.status).toBe(500)
    stop()
  })
})
