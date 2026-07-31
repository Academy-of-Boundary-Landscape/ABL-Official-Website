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
