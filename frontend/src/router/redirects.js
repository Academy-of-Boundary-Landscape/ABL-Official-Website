/**
 * 旧 /project/* 路径 → 新 /works/* 路径。
 *
 * 站外有引用（通贩页、QQ 群、GitHub README），这些路径不能直接删掉变 404。
 * 写成纯数据是为了能在 Node 环境下用桩组件构造 router 验证跳转行为，
 * 而不是只断言路由数组的结构。
 */
export const LEGACY_REDIRECTS = {
  '/project/zhu-yuanzhang': '/works/zhu-yuanzhang',
  '/project/csd20': '/works/csd20',
  // 主题曲页已并入作品页（音乐是 body 里的一个 audio-embed 块），
  // 所以这两条指向同一个目标。深链粒度变粗是统一形式的代价。
  '/project/csd20/music': '/works/csd20',
}

export const redirectRoutes = () =>
  Object.entries(LEGACY_REDIRECTS).map(([path, redirect]) => ({ path, redirect }))

export default redirectRoutes
