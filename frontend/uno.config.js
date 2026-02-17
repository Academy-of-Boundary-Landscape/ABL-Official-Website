import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(), // 可选：支持 <div text="sm gray-500">
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }), // 可选：i-carbon:xxx
  ],
  transformers: [transformerDirectives()],
  theme: {
    colors: {
      // 与现有 CSS 变量对齐
      primary: '#1EB5E8',
      background: '#2F333D',
      text: '#EAEAEA',
      heading: '#FFFFFF',
      border: '#444444',
      'border-hover': '#1EB5E8',
      box: '#21252E',
    },
    breakpoints: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1600px',
    },
  },
  shortcuts: {
    // 通用组件类
    'tech-box':
      'border-l-3 border-r-3 border-primary bg-box p-6 transition-all hover:shadow-lg hover:shadow-primary/30',
    'card-base': 'rounded-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'page-header': 'text-center my-10 sm:my-20',
    'section-title': 'mb-6 text-xl text-primary border-b border-primary pb-2',
  },
  rules: [
    // 自定义规则
    ['text-shadow-glow', { 'text-shadow': '0 2px 8px rgba(30, 181, 232, 0.25), 0 0 2px #1EB5E8' }],
  ],
})
