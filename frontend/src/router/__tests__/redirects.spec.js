import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { LEGACY_REDIRECTS } from '@/router/redirects'
import { routes as realRoutes } from '@/router/routes'

// 桩组件：只为让路由能匹配，避免加载真实 .vue 及其 Naive UI 依赖
const Stub = { render: () => null }

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    // 用真实路由表，只把组件换成桩：重定向的目标必须对着真实的
    // routes.js 验证，否则改了路由名而测试照绿，这条约束等于没守。
    // realRoutes 里已经包含 ...redirectRoutes()，不要再额外展开一次。
    // 惰性 () => import() 组件被替换成桩后永不执行，Node 环境下安全。
    routes: realRoutes.map((r) => (r.component ? { ...r, component: Stub } : r)),
  })

describe('旧路径重定向', () => {
  it('八条旧路径都有映射', () => {
    expect(LEGACY_REDIRECTS).toEqual({
      '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
      '/project/csd20': '/works/csd20',
      '/project/csd20/music': '/works/csd20',
      '/events': '/news',
      '/events/:slug': '/news/:slug',
      '/recruitment': '/join',
      '/products': '/archive/products',
      '/products/:slug': '/archive/products/:slug',
    })
  })

  const literal = Object.entries(LEGACY_REDIRECTS).filter(([from]) => !from.includes(':'))
  it.each(literal)('%s 会真的跳到 %s', async (from, to) => {
    const router = makeRouter()
    await router.push(from)
    expect(router.currentRoute.value.path).toBe(to)
    // 只比对 path 字符串不够：目标路径若在 routes.js 里不存在，vue-router
    // 仍会把 currentRoute.path 设成这个未匹配的字符串（matched 为空数组），
    // 字符串比对照样通过。必须额外断言真的匹配到了路由记录，否则这条
    // 用例测不出"重定向目标路径改名/消失"这类回归。
    expect(router.currentRoute.value.matched.length).toBeGreaterThan(0)
  })

  it('带 :slug 的重定向要把参数带过去，不能落到字面量 :slug 上', async () => {
    const router = makeRouter()
    await router.push('/events/thtk-studio-pub')
    expect(router.currentRoute.value.path).toBe('/news/thtk-studio-pub')
    expect(router.currentRoute.value.params.slug).toBe('thtk-studio-pub')
    expect(router.currentRoute.value.matched.length).toBeGreaterThan(0)

    await router.push('/products/csd20')
    expect(router.currentRoute.value.path).toBe('/archive/products/csd20')
    expect(router.currentRoute.value.params.slug).toBe('csd20')
    expect(router.currentRoute.value.matched.length).toBeGreaterThan(0)
  })

  it('重定向后不是 404——匹配到了真实路由记录', async () => {
    const router = makeRouter()
    await router.push('/project/csd20')
    expect(router.currentRoute.value.matched.length).toBeGreaterThan(0)
  })

  it('所有作品都落到同一条通用路由——主站没有作品专属页面', async () => {
    const router = makeRouter()
    for (const slug of ['csd20', 'zhu-yuanzhang', 'new-game']) {
      await router.push(`/works/${slug}`)
      expect(router.currentRoute.value.name).toBe('WorkDetail')
    }
  })
})
