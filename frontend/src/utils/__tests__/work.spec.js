import { describe, it, expect } from 'vitest'
import {
  WORK_TYPES,
  WORK_STATUSES,
  typeLabel,
  statusLabel,
  resolveDetailBlock,
  parsePlatforms,
} from '@/utils/work'

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
