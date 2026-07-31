import { describe, it, expect } from 'vitest'
import { getStrapiMedia } from '@/composables/strapi'

describe('getStrapiMedia', () => {
  const MEDIA = import.meta.env.VITE_MEDIA_BASE_URL || import.meta.env.VITE_STRAPI_URL || ''

  it('相对路径前面拼上媒体域名', () => {
    expect(getStrapiMedia({ url: '/uploads/a.jpg' })).toBe(`${MEDIA}/uploads/a.jpg`)
  })

  it('识别 v5 的 attributes.url 形状', () => {
    expect(getStrapiMedia({ attributes: { url: '/uploads/b.jpg' } })).toBe(`${MEDIA}/uploads/b.jpg`)
  })

  it('识别 v4 的 data.attributes.url 形状', () => {
    expect(getStrapiMedia({ data: { attributes: { url: '/uploads/c.jpg' } } })).toBe(
      `${MEDIA}/uploads/c.jpg`,
    )
  })

  it('绝对 URL 原样返回，不做拼接', () => {
    expect(getStrapiMedia({ url: 'https://cdn.example.com/d.jpg' })).toBe(
      'https://cdn.example.com/d.jpg',
    )
    expect(getStrapiMedia({ url: 'http://cdn.example.com/e.jpg' })).toBe(
      'http://cdn.example.com/e.jpg',
    )
  })

  it('传入 null / undefined / 空对象时返回 null，不抛错', () => {
    expect(getStrapiMedia(null)).toBeNull()
    expect(getStrapiMedia(undefined)).toBeNull()
    expect(getStrapiMedia({})).toBeNull()
  })
})
