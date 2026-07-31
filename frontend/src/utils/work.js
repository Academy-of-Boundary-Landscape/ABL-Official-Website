export const WORK_TYPES = ['game', 'tool', 'site', 'publication']

export const WORK_STATUSES = [
  'planned',
  'in-development',
  'released',
  'maintained',
  'ended',
  'discontinued',
]

const TYPE_LABELS = {
  game: '游戏',
  tool: '工具',
  site: '活动站',
  publication: '出版物',
}

const STATUS_LABELS = {
  planned: '构思中',
  'in-development': '开发中',
  released: '已发布',
  maintained: '持续维护',
  ended: '已结束',
  discontinued: '已停止',
}

// 导出以供 work.spec.js 直接与 Strapi schema.json 的 details.components 比对，
// 防止后端加/改/删类型专属组件时前端悄悄漏配。
export const DETAIL_COMPONENT_BY_TYPE = {
  game: 'work.game-detail',
  tool: 'work.tool-detail',
  site: 'work.site-detail',
  publication: 'work.publication-detail',
}

/** 未知类型回落到通用字样，不返回空串——卡片上的类型位不能是空白 */
export const typeLabel = (workType) => TYPE_LABELS[workType] ?? '作品'

/** 未知状态回落到空串——徽标整个不渲染，比显示 "undefined" 好 */
export const statusLabel = (status) => STATUS_LABELS[status] ?? ''

/**
 * 从 details 动态区里挑出与 workType 匹配的那一块。
 *
 * schema 已用 max:1 限制至多挂一个组件，但这里不依赖那条约束：
 * 后台可能挂错类型（游戏条目挂了 toolDetail），也可能 max 键在某个
 * Strapi 版本上失效。任何异常情况一律返回 null，详情页降级为只渲染 body。
 */
export const resolveDetailBlock = (details, workType) => {
  const expected = DETAIL_COMPONENT_BY_TYPE[workType]
  if (!expected || !Array.isArray(details)) return null
  return details.find((block) => block?.__component === expected) ?? null
}

/** 平台是自由文本，允许半角/全角逗号、顿号、空格混用 */
export const parsePlatforms = (raw) =>
  String(raw ?? '')
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)

/**
 * 列表页页签到 useWorkList 的 workType 参数的映射。
 * "other"（其他：活动站 + 出版物）不是后端能一次 $eq 过滤出的单一类型，
 * 所以映射到 "all"，由 filterByTab 在前端二次收窄。
 */
export const tabToWorkType = (tab) => (tab === 'other' ? 'all' : tab)

/**
 * "其他"页签在前端过滤出 site / publication 两类；其余页签原样返回列表
 * （过滤已经由 useWorkList 的 workType filters 在服务端完成）。
 * list 为 null/undefined 时返回空数组，调用方不必自己再兜底。
 */
export const filterByTab = (list, tab) => {
  const safeList = Array.isArray(list) ? list : []
  if (tab !== 'other') return safeList
  return safeList.filter((w) => w?.workType === 'site' || w?.workType === 'publication')
}
