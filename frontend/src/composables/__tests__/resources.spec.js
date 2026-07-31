import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useEvents, useEvent } from '@/composables/useEvents'
import {
  useProducts,
  useProduct,
  useProductsByIds,
  useRecommendedProducts,
} from '@/composables/useProducts'
import { useProjects, normalizeProjects } from '@/composables/useProjects'
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

  it('category 为「全部」或空时不加过滤条件', async () => {
    const { stop } = withScope(() => useProducts({ category: '' }))
    await flush()
    expect(paramsOf().filters).toBeUndefined()
    stop()
  })

  it('指定 category 时加等值过滤', async () => {
    const { stop } = withScope(() => useProducts({ category: '音乐' }))
    await flush()
    expect(paramsOf().filters).toEqual({ category: { $eq: '音乐' } })
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

describe('useRecommendedProducts', () => {
  it('排除当前条目并带 50 条上限', async () => {
    const { stop } = withScope(() => useRecommendedProducts(42))
    await flush()
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf()['filters[id][$ne]']).toBe(42)
    expect(paramsOf()['pagination[limit]']).toBe(50)
    stop()
  })

  it('结果按 count 截断，随机顺序通过 stub Math.random 保持确定性', async () => {
    get.mockResolvedValueOnce({
      data: {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
        meta: null,
      },
    })
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { result, stop } = withScope(() => useRecommendedProducts(0, 2))
    await flush()
    // Math.random 恒为 0 时，Fisher-Yates 洗牌把每一步的 j 都定为 0，
    // 结果是确定的 [2, 3, 4, 5, 1]，截断到 count=2 后是 [2, 3]。
    expect(result.data.value).toEqual([{ id: 2 }, { id: 3 }])
    stop()
  })

  it('count 为 0 时，isEmpty 反映裁剪后的结果而非原始数据——原始池非空也应判空', async () => {
    get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }, { id: 2 }], meta: null },
    })
    const { result, stop } = withScope(() => useRecommendedProducts(0, 0))
    await flush()
    expect(result.data.value).toEqual([])
    expect(result.isEmpty.value).toBe(true)
    stop()
  })
})

describe('useProjects', () => {
  it('固定 coverImage 与按日期倒序', async () => {
    const { stop } = withScope(() => useProjects({ limit: 6 }))
    await flush()
    expect(pathOf()).toBe('/projects')
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('date:desc')
    expect(paramsOf()['pagination[limit]']).toBe(6)
    stop()
  })

  it('limit 为 ref(0) 时不应该发送 pagination[limit]——不能用裸 Ref 做真值判断', async () => {
    const { stop } = withScope(() => useProjects({ limit: ref(0) }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBeUndefined()
    stop()
  })

  it('脏数据被 normalizeProjects 过滤光后，isEmpty 要反映过滤后的结果而非原始 list.data', async () => {
    get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }, { id: 2 }], meta: null }, // 均无 title，会被过滤成空
    })
    const { result, stop } = withScope(() => useProjects())
    await flush()
    expect(result.data.value).toEqual([])
    expect(result.isEmpty.value).toBe(true)
    stop()
  })
})

describe('normalizeProjects', () => {
  it('过滤掉没有 title 的脏数据', () => {
    expect(normalizeProjects([{ id: 1, title: 'A' }, { id: 2 }, null])).toEqual([
      { id: 1, title: 'A' },
    ])
  })

  it('输入非数组时返回空数组，不抛错', () => {
    expect(normalizeProjects(null)).toEqual([])
    expect(normalizeProjects(undefined)).toEqual([])
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
