import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  WORK_TYPES,
  WORK_STATUSES,
  DETAIL_COMPONENT_BY_TYPE,
  typeLabel,
  statusLabel,
  resolveDetailBlock,
  parsePlatforms,
  tabToWorkType,
  filterByTab,
} from '@/utils/work'

// 读 Strapi 的 work schema.json 而不是静态 import 它：跨 frontend/strapi-backend
// 目录边界的静态 import 会撞上 Vite dev server 的 fs.allow 边界（在某些工作区
// 布局下会被拒绝），readFileSync + import.meta.url 是不依赖那道边界的可靠方式。
const workSchemaPath = fileURLToPath(
  new URL(
    '../../../../strapi-backend/src/api/work/content-types/work/schema.json',
    import.meta.url,
  ),
)
const workSchema = JSON.parse(readFileSync(workSchemaPath, 'utf-8'))

describe('常量', () => {
  it('四种作品类型与六种状态，顺序即列表页与后台的展示顺序', () => {
    expect(WORK_TYPES).toEqual(['game', 'tool', 'site', 'publication'])
    expect(WORK_STATUSES).toEqual([
      'planned',
      'in-development',
      'released',
      'maintained',
      'ended',
      'discontinued',
    ])
  })
})

describe('前后端枚举漂移守卫', () => {
  it('WORK_TYPES 与 Strapi work.workType 的 enum 一致——漂移了就去改 strapi-backend/src/api/work/content-types/work/schema.json 或同步 utils/work.js', () => {
    expect(WORK_TYPES).toEqual(workSchema.attributes.workType.enum)
  })

  it('WORK_STATUSES 与 Strapi work.workStatus 的 enum 一致——漂移了就去改 schema.json 或同步 utils/work.js', () => {
    expect(WORK_STATUSES).toEqual(workSchema.attributes.workStatus.enum)
  })

  it('DETAIL_COMPONENT_BY_TYPE 的四个组件标识与 Strapi work.details 动态区的 components 一致——漂移了就去改 schema.json 或同步 utils/work.js', () => {
    expect(Object.values(DETAIL_COMPONENT_BY_TYPE).sort()).toEqual(
      [...workSchema.attributes.details.components].sort(),
    )
  })
})

describe('typeLabel / statusLabel', () => {
  it('四种类型都有中文标签', () => {
    expect(typeLabel('game')).toBe('游戏')
    expect(typeLabel('tool')).toBe('工具')
    expect(typeLabel('site')).toBe('活动站')
    expect(typeLabel('publication')).toBe('出版物')
  })

  it('六种状态都有中文标签', () => {
    expect(statusLabel('planned')).toBe('构思中')
    expect(statusLabel('in-development')).toBe('开发中')
    expect(statusLabel('released')).toBe('已发布')
    expect(statusLabel('maintained')).toBe('持续维护')
    expect(statusLabel('ended')).toBe('已结束')
    expect(statusLabel('discontinued')).toBe('已停止')
  })

  it('未知值不抛错——后台加了新枚举值而前端没跟上时，页面不能白屏', () => {
    expect(typeLabel('nonsense')).toBe('作品')
    expect(typeLabel(undefined)).toBe('作品')
    expect(statusLabel('nonsense')).toBe('')
    expect(statusLabel(null)).toBe('')
  })
})

describe('resolveDetailBlock', () => {
  const gameBlock = { __component: 'work.game-detail', engine: 'thcrap' }
  const toolBlock = { __component: 'work.tool-detail', repoUrl: 'https://example.com' }

  it('取出与 workType 匹配的那一块', () => {
    expect(resolveDetailBlock([gameBlock], 'game')).toBe(gameBlock)
    expect(resolveDetailBlock([toolBlock], 'tool')).toBe(toolBlock)
  })

  it('动态区里挂了不匹配的组件时返回 null，详情页降级为只渲染 body', () => {
    expect(resolveDetailBlock([toolBlock], 'game')).toBeNull()
  })

  it('挂了多个组件时只认匹配的那个——schema 的 max:1 若失效，前端仍然确定', () => {
    expect(resolveDetailBlock([toolBlock, gameBlock], 'game')).toBe(gameBlock)
  })

  it('预告态：动态区为空、为 null、字段缺失都返回 null 而不抛错', () => {
    expect(resolveDetailBlock([], 'game')).toBeNull()
    expect(resolveDetailBlock(null, 'game')).toBeNull()
    expect(resolveDetailBlock(undefined, 'game')).toBeNull()
    expect(resolveDetailBlock([gameBlock], undefined)).toBeNull()
    expect(resolveDetailBlock([null, gameBlock], 'game')).toBe(gameBlock)
  })
})

describe('parsePlatforms', () => {
  it('半角逗号、全角逗号、顿号、空格都能分隔', () => {
    expect(parsePlatforms('Windows,Android')).toEqual(['Windows', 'Android'])
    expect(parsePlatforms('Windows，Android')).toEqual(['Windows', 'Android'])
    expect(parsePlatforms('Windows、Android')).toEqual(['Windows', 'Android'])
    expect(parsePlatforms('Windows Android')).toEqual(['Windows', 'Android'])
  })

  it('混合使用多种分隔符', () => {
    expect(parsePlatforms('Windows, Android、iOS')).toEqual(['Windows', 'Android', 'iOS'])
  })

  it('空值与全分隔符返回空数组，不返回 [""]', () => {
    expect(parsePlatforms('')).toEqual([])
    expect(parsePlatforms(null)).toEqual([])
    expect(parsePlatforms(undefined)).toEqual([])
    expect(parsePlatforms(' , , ')).toEqual([])
  })
})

describe('tabToWorkType', () => {
  it('"other" 映射到 "all"——它对应 site+publication 两类，不是单一 workType', () => {
    expect(tabToWorkType('other')).toBe('all')
  })

  it('其余页签原样返回', () => {
    expect(tabToWorkType('all')).toBe('all')
    expect(tabToWorkType('game')).toBe('game')
    expect(tabToWorkType('tool')).toBe('tool')
  })
})

describe('filterByTab', () => {
  const game = { workType: 'game' }
  const tool = { workType: 'tool' }
  const site = { workType: 'site' }
  const publication = { workType: 'publication' }
  const list = [game, tool, site, publication]

  it('"other" 只保留 site 与 publication', () => {
    expect(filterByTab(list, 'other')).toEqual([site, publication])
  })

  it('"all" / "game" / "tool" 原样返回，不做前端过滤——过滤已经在服务端完成', () => {
    expect(filterByTab(list, 'all')).toEqual(list)
    expect(filterByTab(list, 'game')).toEqual(list)
    expect(filterByTab(list, 'tool')).toEqual(list)
  })

  it('空列表返回空数组', () => {
    expect(filterByTab([], 'other')).toEqual([])
    expect(filterByTab([], 'all')).toEqual([])
  })

  it('null/undefined 列表返回空数组，不抛错', () => {
    expect(filterByTab(null, 'other')).toEqual([])
    expect(filterByTab(undefined, 'other')).toEqual([])
    expect(filterByTab(null, 'all')).toEqual([])
    expect(filterByTab(undefined, 'game')).toEqual([])
  })
})
