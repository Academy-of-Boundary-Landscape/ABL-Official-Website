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
  // （container / tech-box / page-header / section-title）。
  // card-base 仍被 ProductCard.vue / EventCard.vue 引用，不能直接删——
  // 已原样迁移为 main.css 中的 .card-base 规则（见该文件），此处不再重复定义。
  shortcuts: {},
  // 光删掉上面的同名 shortcut 不够：presetUno 自带一个内置的 `container` 规则
  // （响应式断点阶梯 max-width），会在 shortcut 让位后顶上来接管 `.container`；
  // presetAttributify 还会为 tech-box / page-header / section-title 生成
  // `[tech-box=""]` 这类属性选择器变体。main.css 里的 `.container` 等四个类
  // 是手写全局类，且 uno.css 在 main.js 里晚于 main.css 引入、二者选择器权重
  // 相同（0,1,0），后引入的 UnoCSS 规则会赢。用 blocklist 显式挡掉这四个类名，
  // 让 UnoCSS 对它们完全不生成 CSS，main.css 的实现才真正生效
  // （诊断过程：构建后 diff dist 里的 uno.css，发现 .container 被内置 container
  // 规则的响应式 max-width 阶梯覆盖，见 C1 修复报告）。
  blocklist: ['container', 'tech-box', 'page-header', 'section-title'],
  rules: [
    [
      'text-shadow-glow',
      { 'text-shadow': `0 2px 8px ${colorTokens.glowCyan}, 0 0 2px ${colorTokens.accent}` },
    ],
  ],
})
