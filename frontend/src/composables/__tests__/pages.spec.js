import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { usePageBySlug } from '@/composables/usePages'

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

describe('usePageBySlug', () => {
  it('按 slug 过滤并深挖 body 动态区', async () => {
    const { stop } = withScope(() => usePageBySlug('about'))
    await flush()
    expect(pathOf()).toBe('/pages')
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'about' } })
    // 动态区内层的媒体（音频、文件）不深挖就取不到
    expect(paramsOf().populate).toEqual({ body: { populate: '*' } })
    stop()
  })

  it('slug 变化会重新请求', async () => {
    const slug = ref('about')
    const { stop } = withScope(() => usePageBySlug(slug))
    await flush()
    slug.value = 'join'
    await flush()
    expect(paramsOf(1).filters).toEqual({ slug: { $eq: 'join' } })
    stop()
  })

  it('记录不存在时 notFound 为真而不是抛错——页面要能降级', async () => {
    const { result, stop } = withScope(() => usePageBySlug('nope'))
    await flush()
    expect(result.notFound.value).toBe(true)
    expect(result.data.value).toBeNull()
    stop()
  })
})
