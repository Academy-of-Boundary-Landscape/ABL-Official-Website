import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useEvents, useEvent } from '@/composables/useEvents'
import { useProducts, useProduct, useProductsByIds } from '@/composables/useProducts'
import { useConventions } from '@/composables/useConventions'

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

let get
const paramsOf = (call = 0) => get.mock.calls[call][1].params
const pathOf = (call = 0) => get.mock.calls[call][0]

beforeEach(() => {
  get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: [], meta: null } })
})
afterEach(() => vi.restoreAllMocks())

describe('useEvents', () => {
  it('固定带上 coverImage 与按日期倒序——页面不需要自己写 populate', async () => {
    const { stop } = withScope(() => useEvents())
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('date:desc')
    stop()
  })

  it('limit 映射到 Strapi 的 pagination[limit]', async () => {
    const { stop } = withScope(() => useEvents({ limit: 3 }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBe(3)
    stop()
  })

  it('limit 为 ref(0) 时不应该发送 pagination[limit]——不能用裸 Ref 做真值判断', async () => {
    const { stop } = withScope(() => useEvents({ limit: ref(0) }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBeUndefined()
    stop()
  })

  it('search 映射到标题模糊匹配，空搜索不产生 filters', async () => {
    const search = ref('')
    const { stop } = withScope(() => useEvents({ search }))
    await flush()
    expect(paramsOf().filters).toBeUndefined()

    search.value = '合同志'
    await flush()
    expect(paramsOf(1).filters).toEqual({ title: { $containsi: '合同志' } })
    stop()
  })
})

describe('useEvent', () => {
  it('按 slug 查询并深度 populate 动态区', async () => {
    const { stop } = withScope(() => useEvent('my-event'))
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'my-event' } })
    expect(paramsOf().populate).toEqual({ mainContent: { populate: '*' } })
    stop()
  })

  it('slug 通过 params 传递而非拼接 URL——特殊字符不会破坏请求', async () => {
    const { stop } = withScope(() => useEvent('a&b=c'))
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().filters.slug.$eq).toBe('a&b=c')
    stop()
  })
})

describe('useProducts', () => {
  it('固定 coverImage 与按发布日倒序', async () => {
    const { stop } = withScope(() => useProducts())
    await flush()
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('releaseDate:desc')
    stop()
  })

  it('limit 为 ref(0) 时不应该发送 pagination[limit]——不能用裸 Ref 做真值判断', async () => {
    const { stop } = withScope(() => useProducts({ limit: ref(0) }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBeUndefined()
    stop()
  })
})

describe('useProduct', () => {
  it('按 slug 查询并 populate 全部关联', async () => {
    const { stop } = withScope(() => useProduct('cd-01'))
    await flush()
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'cd-01' } })
    expect(paramsOf().populate).toBe('*')
    stop()
  })
})

describe('useProductsByIds', () => {
  it('用 $in 一次批量取回，避免 N+1', async () => {
    const { stop } = withScope(() => useProductsByIds([3, 5, 8]))
    await flush()
    expect(get).toHaveBeenCalledTimes(1)
    expect(paramsOf().filters).toEqual({ id: { $in: [3, 5, 8] } })
    expect(paramsOf().populate).toBe('coverImage')
    stop()
  })

  it('id 列表为空时根本不发请求', async () => {
    const { stop } = withScope(() => useProductsByIds([]))
    await flush()
    expect(get).not.toHaveBeenCalled()
    stop()
  })

  it('id 列表初始为空、之后填充时会发起请求——immediate 只在 setup 时判定一次，靠 params watcher 补上', async () => {
    const ids = ref([])
    const { stop } = withScope(() => useProductsByIds(ids))
    await flush()
    expect(get).not.toHaveBeenCalled()

    ids.value = [1, 2]
    await flush()
    expect(get).toHaveBeenCalledTimes(1)
    expect(paramsOf().filters).toEqual({ id: { $in: [1, 2] } })
    stop()
  })

  it('id 列表为空时 isEmpty 不应为真——还没发起请求，不是查无结果', async () => {
    const { result, stop } = withScope(() => useProductsByIds([]))
    await flush()
    expect(result.isEmpty.value).toBe(false)
    stop()
  })

  it('byId 按 id 建立索引', async () => {
    get.mockResolvedValueOnce({
      data: {
        data: [
          { id: 3, title: 'a' },
          { id: 5, title: 'b' },
        ],
        meta: null,
      },
    })
    const { result, stop } = withScope(() => useProductsByIds([3, 5]))
    await flush()
    expect(result.byId.value).toEqual({
      3: { id: 3, title: 'a' },
      5: { id: 5, title: 'b' },
    })
    stop()
  })
})

describe('useConventions', () => {
  it('upcoming 为真时只取今天及以后的，按日期升序', async () => {
    const { stop } = withScope(() => useConventions({ upcoming: true, limit: 4 }))
    await flush()
    expect(pathOf()).toBe('/conventions')
    expect(paramsOf().sort).toBe('date:asc')
    expect(paramsOf()['filters[date][$gte]']).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(paramsOf()['pagination[limit]']).toBe(4)
    stop()
  })

  it('upcoming 为假时不加日期过滤', async () => {
    const { stop } = withScope(() => useConventions())
    await flush()
    expect(paramsOf()['filters[date][$gte]']).toBeUndefined()
    stop()
  })

  it('upcoming 为 ref(false) 时，排序与过滤条件必须一致——不能一处判裸 Ref 一处判 toValue', async () => {
    const { stop } = withScope(() => useConventions({ upcoming: ref(false) }))
    await flush()
    expect(paramsOf().sort).toBe('date:desc')
    expect(paramsOf()['filters[date][$gte]']).toBeUndefined()
    stop()
  })

  it('limit 为 ref(0) 时不应该发送 pagination[limit]——不能用裸 Ref 做真值判断', async () => {
    const { stop } = withScope(() => useConventions({ limit: ref(0) }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBeUndefined()
    stop()
  })
})
