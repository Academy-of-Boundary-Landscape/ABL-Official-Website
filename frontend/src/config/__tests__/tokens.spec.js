import { describe, it, expect } from 'vitest'
import { colorTokens, toCssVarName, deriveCssVariables } from '@/config/colorTokens'

describe('CSS 变量派生', () => {
  it('camelCase 转成 --color-kebab-case', () => {
    expect(toCssVarName('background')).toBe('--color-background')
    expect(toCssVarName('textMuted')).toBe('--color-text-muted')
    expect(toCssVarName('surfaceRaised')).toBe('--color-surface-raised')
    expect(toCssVarName('accentRgb')).toBe('--color-accent-rgb')
  })

  it('派生结果覆盖 colorTokens 的每一个键——不允许再出现漏映射', () => {
    const derived = deriveCssVariables()
    const missing = Object.keys(colorTokens).filter((k) => !(toCssVarName(k) in derived))
    expect(missing).toEqual([])
    expect(Object.keys(derived)).toHaveLength(Object.keys(colorTokens).length)
  })

  it('派生的值与 token 原值一致', () => {
    const derived = deriveCssVariables()
    for (const [key, value] of Object.entries(colorTokens)) {
      expect(derived[toCssVarName(key)]).toBe(value)
    }
  })

  it('曾经漏掉的那批 token 现在都有对应变量', () => {
    const derived = deriveCssVariables()
    for (const name of [
      '--color-text-muted',
      '--color-text-subtle',
      '--color-text-disabled',
      '--color-border-soft',
      '--color-input-placeholder',
    ]) {
      expect(derived[name]).toBeTruthy()
    }
  })
})

import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

const readSource = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf-8')

describe('配置守卫：theme.js 不得出现字面量颜色', () => {
  it('themeOverrides 配置项只能引用 token 或文件顶部的叠加层常量', () => {
    const source = readSource('../theme.js')
    // 只扫 themeOverrides 之后的部分。文件顶部允许有一个集中的叠加层常量块
    // （白色蒙版、阴影），那些值在 colorTokens 里没有语义对应物，
    // 集中在顶部十来行比散在 190 行配置中好管。守卫要挡的是「配置项里内联颜色」。
    const start = source.indexOf('export const themeOverrides')
    expect(start, 'theme.js 中找不到 themeOverrides 导出').toBeGreaterThan(-1)

    const code = source
      .slice(start)
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n')

    const hex = code.match(/#[0-9a-fA-F]{3,8}\b/g) || []
    const rgba = code.match(/rgba?\(\s*\d+/g) || []

    expect({ hex, rgba }).toEqual({ hex: [], rgba: [] })
  })
})

import unoConfig from '../../../uno.config.js'

describe('配置守卫：uno.config.js 与 colorTokens 同源', () => {
  it('Uno 的颜色取自 colorTokens，不得手抄', () => {
    const unoColors = unoConfig.theme.colors
    for (const [key, value] of Object.entries(unoColors)) {
      // Uno 的键是 kebab-case，反查回 token 值
      const match = Object.entries(colorTokens).find(([tokenKey]) =>
        toCssVarName(tokenKey) === `--color-${key}`,
      )
      expect(match, `uno 颜色 "${key}" 在 colorTokens 中没有对应项`).toBeTruthy()
      expect(value).toBe(match[1])
    }
  })

  it('不再定义与 main.css 全局类同名的 shortcut', () => {
    const shortcutNames = Object.keys(unoConfig.shortcuts || {})
    const conflicts = ['container', 'tech-box', 'page-header', 'section-title']
    expect(shortcutNames.filter((n) => conflicts.includes(n))).toEqual([])
  })
})
