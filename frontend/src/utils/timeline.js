import { typeLabel } from './work'

/**
 * 把展会与作品混排成一条社团时间线，按日期倒序。
 *
 * 为什么合并两个来源：社团已经不出摊了，about 页上单挂一串展会记录读者
 * 不知道该作何感想。两条线混在一起，转型叙事会自己浮现——越往下越是展会，
 * 越往上越是作品。
 *
 * 缺日期的条目排在最后而不是抛错：Strapi 里 date 字段可空，
 * 生产数据里真的有 qqgroup 为 "None" 这类脏值，日期同理不能假设一定有。
 */
export const mergeTimeline = (conventions, works) => {
  const items = []

  for (const c of Array.isArray(conventions) ? conventions : []) {
    if (!c?.name) continue
    items.push({
      key: `convention-${c.id}`,
      date: c.date ?? null,
      kind: 'convention',
      title: c.name,
      label: '出展',
      to: null,
    })
  }

  for (const w of Array.isArray(works) ? works : []) {
    if (!w?.title) continue
    items.push({
      key: `work-${w.id}`,
      date: w.startDate ?? null,
      kind: 'work',
      title: w.title,
      label: typeLabel(w.workType),
      to: w.slug ? `/works/${w.slug}` : null,
    })
  }

  // 缺日期的排最后；同日期时展会在前——那天先出展，才有后来的产出
  return items.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.kind === b.kind ? 0 : a.kind === 'convention' ? -1 : 1
  })
}
