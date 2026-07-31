import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { LEGACY_REDIRECTS, redirectRoutes } from '@/router/redirects'

// 桩组件：只为让路由能匹配，避免加载真实 .vue 及其 Naive UI 依赖
const Stub = { render: () => null }

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      ...redirectRoutes(),
      { path: '/works', name: 'works', component: Stub },
      { path: '/works/:slug', name: 'WorkDetail', component: Stub },
    ],
  })

describe('旧路径重定向', () => {
  it('三条 /project/* 旧路径都有映射，音乐页并入作品页', () => {
    expect(LEGACY_REDIRECTS).toEqual({
      '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
      '/project/csd20': '/works/csd20',
      '/project/csd20/music': '/works/csd20',
    })
  })

  it.each(Object.entries(LEGACY_REDIRECTS))('%s 会真的跳到 %s', async (from, to) => {
    const router = makeRouter()
    await router.push(from)
    expect(router.currentRoute.value.path).toBe(to)
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
