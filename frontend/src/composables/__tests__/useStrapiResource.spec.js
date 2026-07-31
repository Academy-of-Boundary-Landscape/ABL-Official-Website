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

  it('竞态：后发请求先返回时，早先请求的迟到响应不会覆盖新状态', async () => {
    const search = ref('a')
    let resolveA
    let resolveB
    get.mockImplementationOnce(() => new Promise((r) => (resolveA = r)))
    const { result, stop } = withScope(() => useStrapiList('events', () => ({ q: search.value })))
    // 此时请求 A（q=a）已同步发出但尚未 resolve。
    expect(get).toHaveBeenCalledTimes(1)

    get.mockImplementationOnce(() => new Promise((r) => (resolveB = r)))
    search.value = 'b'
    await flush() // watcher 触发 refresh -> 发出请求 B，并 abort 掉 A 的 controller
    expect(get).toHaveBeenCalledTimes(2)

    // B 先返回。
    resolveB(okList([{ id: 2 }]))
    await flush()
    expect(result.data.value).toEqual([{ id: 2 }])

    // A 后返回——它的 signal 已被 abort，不应该覆盖 B 写入的状态。
    resolveA(okList([{ id: 1 }]))
    await flush()
    expect(result.data.value).toEqual([{ id: 2 }])
    stop()
  })
})

describe('useStrapiList - debounce', () => {
  it('短时间内多次参数变化只合并成一次请求', async () => {
    vi.useFakeTimers()
    get.mockResolvedValue(okList([]))
    const search = ref('')
    const { stop } = withScope(() =>
      useStrapiList('events', () => ({ q: search.value }), { debounce: 200 }),
    )
    await flush()
    expect(get).toHaveBeenCalledTimes(1) // 初次 immediate 请求不受 debounce 影响

    search.value = 'a'
    await flush()
    search.value = 'ab'
    await flush()
    search.value = 'abc'
    await flush()
    expect(get).toHaveBeenCalledTimes(1) // 计时器还没到期，尚未真正发出新请求

    await vi.advanceTimersByTimeAsync(200)
    expect(get).toHaveBeenCalledTimes(2) // 三次参数变化只换来 1 次新请求
    expect(get.mock.calls[1][1].params).toEqual({ q: 'abc' })
    stop()
  })

  it('设置了 debounce 时，refresh() 仍立即发起请求，不排队等待', async () => {
    vi.useFakeTimers()
    get.mockResolvedValue(okList([]))
    const { result, stop } = withScope(() => useStrapiList('events', {}, { debounce: 200 }))
    await flush()
    expect(get).toHaveBeenCalledTimes(1)

    await result.refresh()
    expect(get).toHaveBeenCalledTimes(2) // 不需要等待 200ms
    stop()
  })

  it('销毁时若有排队中的 debounce 定时器，销毁后不再发起请求', async () => {
    vi.useFakeTimers()
    get.mockResolvedValue(okList([]))
    const search = ref('')
    const { stop } = withScope(() =>
      useStrapiList('events', () => ({ q: search.value }), { debounce: 200 }),
    )
    await flush()
    expect(get).toHaveBeenCalledTimes(1)

    search.value = 'a'
    await flush() // watcher 触发 refresh，排队等待 200ms 的定时器还没到期
    stop() // 在定时器触发前销毁作用域

    await vi.advanceTimersByTimeAsync(500)
    expect(get).toHaveBeenCalledTimes(1) // 定时器应已被 onScopeDispose 清除，不会再发请求
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
