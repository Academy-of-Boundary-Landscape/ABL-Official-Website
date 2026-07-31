import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useWorkList, useWorkBySlug, useWorkNews } from '@/composables/useWorks'

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

describe('useWorkList', () => {
  it('固定带 coverImage 与三级排序——精选优先、手工序次之、开始时间兜底', async () => {
    const { stop } = withScope(() => useWorkList())
    await flush()
    expect(pathOf()).toBe('/works')
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('featured:desc,order:desc,startDate:desc')
    expect(paramsOf().filters).toBeUndefined()
    stop()
  })

  it('workType 映射到 filters，"all" 与空值不产生过滤', async () => {
    const workType = ref('all')
    const { stop } = withScope(() => useWorkList({ workType }))
    await flush()
    expect(paramsOf().filters).toBeUndefined()

    workType.value = 'game'
    await flush()
    expect(paramsOf(1).filters).toEqual({ workType: { $eq: 'game' } })

    workType.value = ''
    await flush()
    expect(paramsOf(2).filters).toBeUndefined()
    stop()
  })

  it('limit 映射到 pagination[limit]，ref(0) 不应发送——不能用裸 Ref 做真值判断', async () => {
    const { stop } = withScope(() => useWorkList({ limit: ref(0) }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBeUndefined()
    stop()

    const s2 = withScope(() => useWorkList({ limit: 6 }))
    await flush()
    expect(paramsOf(1)['pagination[limit]']).toBe(6)
    s2.stop()
  })
})

describe('useWorkBySlug', () => {
  it('按 slug 过滤，并深挖 body 与 details 两个动态区', async () => {
    const { stop } = withScope(() => useWorkBySlug('new-game'))
    await flush()
    expect(pathOf()).toBe('/works')
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'new-game' } })
    // 动态区内层的媒体（游戏截图）不深挖就取不到
    expect(paramsOf().populate).toEqual({
      coverImage: true,
      staff: true,
      recruitingRoles: true,
      body: { populate: '*' },
      details: { populate: '*' },
    })
    stop()
  })

  it('slug 变化会重新请求', async () => {
    const slug = ref('a')
    const { stop } = withScope(() => useWorkBySlug(slug))
    await flush()
    slug.value = 'b'
    await flush()
    expect(paramsOf(1).filters).toEqual({ slug: { $eq: 'b' } })
    stop()
  })
})

describe('useWorkNews', () => {
  it('按关联作品的 slug 过滤 events，日期倒序', async () => {
    const { stop } = withScope(() => useWorkNews('thtk-studio'))
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().filters).toEqual({ relatedWork: { slug: { $eq: 'thtk-studio' } } })
    expect(paramsOf().sort).toBe('date:desc')
    expect(paramsOf()['pagination[limit]']).toBe(10)
    stop()
  })

  it('slug 为空时不发请求——详情页数据还没落地时不能先打一发无过滤的全量查询', async () => {
    const { stop } = withScope(() => useWorkNews(ref('')))
    await flush()
    expect(get).not.toHaveBeenCalled()
    stop()
  })

  it('limit 必须 toValue 解包，ref(5) 不能原样塞进参数', async () => {
    const { stop } = withScope(() => useWorkNews('work-slug', ref(5)))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBe(5)
    stop()
  })
})
