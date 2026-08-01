import { describe, it, expect } from 'vitest'
import { mergeTimeline } from '@/utils/timeline'

const conv = (name, date) => ({ id: `c${name}`, name, date })
const work = (title, startDate, workType = 'tool', slug = title) => ({
  id: `w${title}`,
  title,
  startDate,
  workType,
  slug,
})

describe('mergeTimeline', () => {
  it('两个来源按日期倒序混排', () => {
    const out = mergeTimeline(
      [conv('北京tho', '2025-11-08'), conv('武汉tho', '2025-10-04')],
      [work('摊盒', '2026-01-24'), work('csd20', '2025-09-13', 'publication')],
    )
    expect(out.map((x) => x.title)).toEqual(['摊盒', '北京tho', '武汉tho', 'csd20'])
  })

  it('展会标「出展」，作品标其类型中文名', () => {
    const out = mergeTimeline([conv('北京tho', '2025-11-08')], [work('摊盒', '2026-01-24')])
    expect(out[0]).toMatchObject({ kind: 'work', label: '工具', to: '/works/摊盒' })
    expect(out[1]).toMatchObject({ kind: 'convention', label: '出展', to: null })
  })

  it('缺日期的条目排在最后，不抛错', () => {
    const out = mergeTimeline([conv('无日期展会', null)], [work('有日期', '2025-01-01')])
    expect(out.map((x) => x.title)).toEqual(['有日期', '无日期展会'])
  })

  it('同日期时展会排在作品之前——那天先出展，才有后来的产出', () => {
    const out = mergeTimeline([conv('同日展会', '2025-05-05')], [work('同日作品', '2025-05-05')])
    expect(out.map((x) => x.kind)).toEqual(['convention', 'work'])
  })

  it('任一来源为空、两个都为空、传 null 都返回数组而不抛错', () => {
    expect(mergeTimeline([], [work('只有作品', '2025-01-01')])).toHaveLength(1)
    expect(mergeTimeline([conv('只有展会', '2025-01-01')], [])).toHaveLength(1)
    expect(mergeTimeline([], [])).toEqual([])
    expect(mergeTimeline(null, undefined)).toEqual([])
  })

  it('每个条目有稳定且唯一的 key，供 v-for 使用', () => {
    const out = mergeTimeline(
      [conv('展会', '2025-01-01')],
      [work('作品', '2025-01-01')],
    )
    const keys = out.map((x) => x.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true)
  })

  it('脏数据（null 条目、缺 title）被跳过而不是渲染成空行', () => {
    const out = mergeTimeline([null, conv('正常', '2025-01-01')], [{ id: 'x', startDate: '2025-02-02' }])
    expect(out.map((x) => x.title)).toEqual(['正常'])
  })
})
