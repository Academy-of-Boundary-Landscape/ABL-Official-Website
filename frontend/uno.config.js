import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  transformerDirectives,
} from 'unocss'
import { colorTokens, toCssVarName } from './src/config/colorTokens.js'

// 颜色由 colorTokens 派生：--color-text-muted → text-muted → class="text-text-muted"
const colors = Object.fromEntries(
  Object.entries(colorTokens).map(([key, value]) => [toCssVarName(key).replace('--color-', ''), value]),
)

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  transformers: [transformerDirectives()],
  theme: {
    colors,
    breakpoints: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1600px',
    },
  },
  // 与 main.css 中真实存在且在用的全局类同名的 shortcut 已全部移除
  // （container / tech-box / page-header / section-title），
  // card-base 无人引用一并删除。此处刻意留空。
  shortcuts: {},
  rules: [
    [
      'text-shadow-glow',
      { 'text-shadow': `0 2px 8px ${colorTokens.glowCyan}, 0 0 2px ${colorTokens.accent}` },
    ],
  ],
})
