import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useEvents, useEvent } from '@/composables/useEvents'
import { useProducts, useProduct, useProductsByIds } from '@/composables/useProducts'
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
})
