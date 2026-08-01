/**
 * 旧路径 → 新路径。
 *
 * 站外有引用（通贩页、QQ 群、GitHub README、以及 docs/content-migration/
 * 里指导作者写的 /products/csd20 链接），这些路径不能直接删掉变 404。
 *
 * 写成纯数据是为了能在 Node 环境下用桩组件构造 router 验证跳转行为，
 * 而不是只断言路由数组的结构——本项目吃过结构性守卫的亏。
 */
export const LEGACY_REDIRECTS = {
  '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
  '/project/csd20': '/works/csd20',
  // 主题曲页已并入作品页（音乐是 body 里的一个 audio-embed 块）
  '/project/csd20/music': '/works/csd20',
  '/events': '/news',
  '/events/:slug': '/news/:slug',
  '/recruitment': '/join',
  '/products': '/archive/products',
  '/products/:slug': '/archive/products/:slug',
}

// vue-router 的字符串式 redirect 不会自动把动态段的实际值带过去——
// 会直接落到字面量 /news/:slug 上。带 :slug 的条目需要写成重定向函数，
// 从 to.params 里取出实际值拼回目标路径。
const paramRedirect = (redirect) => (to) => {
  let target = redirect
  for (const [key, value] of Object.entries(to.params)) {
    target = target.replace(`:${key}`, value)
  }
  return target
}

export const redirectRoutes = () =>
  Object.entries(LEGACY_REDIRECTS).map(([path, redirect]) => ({
    path,
    redirect: path.includes(':') ? paramRedirect(redirect) : redirect,
  }))

export default redirectRoutes
