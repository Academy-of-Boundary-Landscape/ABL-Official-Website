# 前端地基收敛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `frontend/` 中并存的多套调色板、8 处各自为政的数据请求、三种错误处理风格，收敛成单一真相源，并为纯逻辑层建立测试防线。

**Architecture:** `colorTokens.js` 成为唯一颜色源，向 CSS 变量 / Naive `themeOverrides` / UnoCSS theme 三路投影，由守卫测试锁死不许漂移。数据访问收敛到 `useStrapiResource` 底座 + 每资源一层薄封装，页面不再直接碰 `apiClient` 和 `populate`。加载 / 空 / 错误三态由 `AsyncBoundary` 统一承载。

**Tech Stack:** Vue 3.5 + Vite 7 + Naive UI 2.43 + UnoCSS + axios + Vitest 3

**依据 spec:** `docs/superpowers/specs/2026-07-31-frontend-upgrade-design.md`

## Global Constraints

- 所有命令在 `frontend/` 目录下执行，除非另有说明。
- 不做视觉重塑。颜色归并时以 `colorTokens.js` 为准，允许微差；不得借机重新设计配色。
- 保留站点现有终端风格文案（`>> 正在获取最新情报...`、`>> [错误] 无法连接至情报服务器`），不采用 Naive UI 默认英文文案。
- Strapi 响应按 v5 处理（`response.data.data`），不再保留 v4 兼容分支。
- 测试只覆盖纯逻辑（composable、工具函数、配置守卫）。不引入 jsdom，不测组件渲染与样式。
- composable 一律用 `onScopeDispose` 而非 `onUnmounted` 做清理——前者在 `effectScope` 中即可测试，无需挂载组件。
- 每个 Task 结束时提交一次，commit message 用仓库现有风格（`type: :emoji: 中文描述`）。
- 阶段 3（页面迁移）每个页面一个 commit。
- 不在本计划内处理：视觉重塑、包体积与图片压缩、自托管字体、`csd20.vue` 标题硬匹配、`ProductList` 全量拉取去重算法、`project` 缺 slug 字段。详见 spec 第 5 节。

---

## 文件结构

**新建：**

| 文件 | 职责 |
|---|---|
| `vitest.config.js` | Vitest 配置，复用 vite 的 `@` alias |
| `src/composables/useStrapiResource.js` | 数据层底座：请求、三态、取消、错误归一 |
| `src/composables/useEvents.js` | event 资源封装（列表 + 单条） |
| `src/composables/useProducts.js` | product 资源封装（列表 + 单条 + 按 id 批量 + 推荐） |
| `src/composables/useProjects.js` | project 资源封装，内含 `normalizeProjects` |
| `src/composables/useConventions.js` | convention 资源封装 |
| `src/components/AsyncBoundary.vue` | 加载 / 空 / 错误三态统一呈现 |
| `scripts/sync-css-tokens.js` | 由 `colorTokens.js` 生成 `base.css` 的 `:root` 颜色块 |
| `src/composables/__tests__/*.spec.js` | 数据层与工具函数测试 |
| `src/config/__tests__/tokens.spec.js` | 配置守卫测试 |

**修改：**

| 文件 | 改动 |
|---|---|
| `src/config/colorTokens.js` | 扩充 token；删手写 `cssVariableMap`，改自动派生 |
| `src/config/theme.js` | 清除全部字面量颜色，一律引用 token |
| `uno.config.js` | colors 由 `colorTokens` 生成；删 4 个冲突 shortcut 及 `card-base` |
| `src/assets/base.css` | `:root` 颜色块改为脚本生成；字体 `@import` 移出 |
| `src/assets/main.css` | 硬编码色改 token；删 `.main-title`；`.status-box` 迁入组件后删除 |
| `index.html` | 删 0 引用字体，接手 Orbitron / Space Grotesk |
| 9 个页面 + `ProjectsBar` / `SiteHeader` | 接入数据层与 `AsyncBoundary`；断点翻转 |

---

# 阶段 0：测试基建与颜色单一源

## Task 1: 引入 Vitest 并为 `getStrapiMedia` 建立测试

`getStrapiMedia` 被全站依赖却没有任何测试。这个 Task 同时验证测试基建可用。

**Files:**
- Create: `frontend/vitest.config.js`
- Create: `frontend/src/composables/__tests__/strapi.spec.js`
- Modify: `frontend/package.json`（scripts + devDependency）

**Interfaces:**
- Consumes: `getStrapiMedia(mediaObject)` from `src/composables/strapi.js`（已存在，本 Task 不改动其实现）
- Produces: `npm run test` / `npm run test:watch` 两个脚本，供后续所有 Task 使用

- [ ] **Step 1: 安装 Vitest**

```bash
cd frontend && npm install -D vitest@^3
```

- [ ] **Step 2: 创建 Vitest 配置**

`frontend/vitest.config.js`：

```js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.js'],
  },
})
```

`environment: 'node'` 是刻意的——本计划不测组件渲染，不需要 jsdom。

- [ ] **Step 3: 添加 npm scripts**

在 `frontend/package.json` 的 `scripts` 中加入两行：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 写 `getStrapiMedia` 的测试**

`frontend/src/composables/__tests__/strapi.spec.js`：

```js
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
```

- [ ] **Step 5: 运行测试**

Run: `cd frontend && npm run test`
Expected: 5 个用例全部 PASS。若报 `Cannot find package 'vitest'`，回到 Step 1。

- [ ] **Step 6: 提交**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.js frontend/src/composables/__tests__/strapi.spec.js
git commit -m "test: :white_check_mark: 引入 Vitest 并覆盖 getStrapiMedia"
```

---

## Task 2: 扩充 colorTokens 并改为自动派生 CSS 变量

现状：`cssVariableMap` 手写映射漏了 8 个 token，导致 `var(--color-text-muted)` 被用 5 次却从未定义。

**Files:**
- Modify: `frontend/src/config/colorTokens.js`
- Create: `frontend/src/config/__tests__/tokens.spec.js`

**Interfaces:**
- Produces:
  - `colorTokens`（对象，键为 camelCase）
  - `toCssVarName(tokenKey)` → `'--color-kebab-case'`
  - `deriveCssVariables()` → `{ '--color-x': '#value', ... }`，覆盖 `colorTokens` 全部键
  - `applyColorTokensToCssVars()`（保留原名，内部改用 `deriveCssVariables`）

- [ ] **Step 1: 写失败的测试**

`frontend/src/config/__tests__/tokens.spec.js`：

```js
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm run test -- tokens`
Expected: FAIL，`toCssVarName is not a function`（目前 `colorTokens.js` 未导出它）。

- [ ] **Step 3: 重写 colorTokens.js**

整份替换 `frontend/src/config/colorTokens.js`：

```js
export const colorTokens = {
  // --- 页面与表面层级 ---
  background: '#000000',
  box: '#050505',
  boxStrong: '#0a0a0a',
  surface: '#0a0f1a',
  surfaceRaised: '#0d1220',
  surfaceSunken: '#050810',
  surfacePressed: '#141c2a',

  // --- 文字 ---
  text: '#e0e0e0',
  heading: '#ffffff',
  textMuted: '#b0b0b0',
  textSubtle: '#808080',
  textDisabled: '#606060',
  weakText: '#eef2f8',
  weakTextDisabled: '#626a76',
  inputPlaceholder: '#7c8593',
  menuArrow: '#bcc4d0',
  onAccent: '#050810',

  // --- 主色 ---
  accent: '#00a8ff',
  accentHover: '#33b8ff',
  accentStrong: '#0077cc',
  accentRgb: '0, 168, 255',

  // --- 边框 ---
  border: '#ffffff',
  borderHover: '#ffffff',
  borderSoft: '#1b202a',
  divider: '#1a1a1a',

  // --- 辉光 ---
  borderGlow: 'rgba(255, 255, 255, 0.6)',
  accentGlow: 'rgba(0, 168, 255, 0.5)',
  boxGlow: 'rgba(255, 255, 255, 0.08)',
  glowCyan: 'rgba(89, 216, 255, 0.18)',
  glowCyanSoft: 'rgba(89, 216, 255, 0.12)',

  // --- hover 态的蓝紫描边（原散落在 main.css 与 HomeView） ---
  hoverBorder: '#9ac0ff',
  hoverBorderAccent: '#b09dff',
  hoverCorner: '#a5b6ff',

  // --- 语义色 ---
  success: '#28c445',
  warning: '#f0a020',
  error: '#e88080',
  errorStrong: '#ff5252',
}

/** camelCase → --color-kebab-case */
export const toCssVarName = (tokenKey) =>
  `--color-${tokenKey.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`

/**
 * 由 colorTokens 全量派生 CSS 变量。
 * 刻意不保留手写映射表——手写映射曾漏掉 8 个 token，
 * 导致 var(--color-text-muted) 被使用 5 次却从未定义。
 */
export const deriveCssVariables = () =>
  Object.fromEntries(Object.entries(colorTokens).map(([key, value]) => [toCssVarName(key), value]))

export const applyColorTokensToCssVars = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  Object.entries(deriveCssVariables()).forEach(([cssVar, value]) => {
    root.style.setProperty(cssVar, value)
  })
}
```

注意 `cssVariableMap` 被移除。若有文件 import 它，Step 5 会暴露。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm run test -- tokens`
Expected: 4 个用例全部 PASS。

- [ ] **Step 5: 确认没有遗留引用**

Run: `cd frontend && grep -rn "cssVariableMap" src/ uno.config.js`
Expected: 无输出。有输出则说明还有文件引用了被删的导出，就地改为 `deriveCssVariables`。

- [ ] **Step 6: 构建自检与对比度确认**

Run: `cd frontend && npm run build`
Expected: 构建成功。

Run: `cd frontend && npm run dev`

**这是 `var(--color-text-muted)` 第一次真正生效**——改造前它被使用 5 次却从未定义，那几处文字渲染的是继承色。现在它会解析为 `#b0b0b0` 落在纯黑底上。

Run: `cd frontend && grep -rn "color-text-muted" src/`

逐个访问这几处所在的页面，确认文字可读。若偏暗，调 `colorTokens.js` 里 `textMuted` 的值（单一源，改一处三路同时生效），不要在页面里单独覆盖。

- [ ] **Step 7: 提交**

```bash
git add frontend/src/config/colorTokens.js frontend/src/config/__tests__/tokens.spec.js
git commit -m "refactor: :art: colorTokens 扩充并改为自动派生 CSS 变量"
```

---

## Task 3: 清除 theme.js 中的字面量颜色

现状：`theme.js` 里硬编码 `#0a0f1a` 19 次、`#050810` 8 次、`#0d1220` 7 次，以及 `rgba(89,216,255,…)` 辉光，与 `colorTokens` 完全脱节。

**Files:**
- Modify: `frontend/src/config/theme.js`
- Modify: `frontend/src/config/__tests__/tokens.spec.js`（追加守卫测试）

**Interfaces:**
- Consumes: `colorTokens` 中 Task 2 新增的 `surface` / `surfaceRaised` / `surfaceSunken` / `surfacePressed` / `onAccent` / `divider` / `glowCyan` / `glowCyanSoft` / `success` / `warning` / `error`
- Produces: `theme` 与 `themeOverrides` 导出不变，仅内部实现改动

- [ ] **Step 1: 追加守卫测试**

在 `frontend/src/config/__tests__/tokens.spec.js` 末尾追加：

```js
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm run test -- tokens`
Expected: FAIL，`hex` 数组里列出 `#0a0f1a`、`#050810`、`#0d1220`、`#141c2a`、`#28C445`、`#F0A020`、`#E88080`、`#dfe5ee`、`#1a1a1a` 等。

- [ ] **Step 3: 替换 theme.js 中的字面量**

逐项替换（`colors` 即 `colorTokens`）：

| 原字面量 | 替换为 |
|---|---|
| `'#0a0f1a'` | `colors.surface` |
| `'#0d1220'` | `colors.surfaceRaised` |
| `'#050810'` | `colors.surfaceSunken` |
| `'#141c2a'` | `colors.surfacePressed` |
| `'#1a1a1a'`（dividerColor） | `colors.divider` |
| `'#28C445'` | `colors.success` |
| `'#F0A020'` | `colors.warning` |
| `'#E88080'` | `colors.error` |
| `'#dfe5ee'`（textColorGhostFocus） | `colors.weakText` |
| `'#626a76'`（textColorStrongDisabled） | `colors.weakTextDisabled` |
| `'rgba(89, 216, 255, 0.12)'` | `colors.glowCyanSoft` |
| `'rgba(89, 216, 255, 0.18)'` | `colors.glowCyan` |

`rgba(255,255,255,0.04/0.06/0.08/0.12)` 与 `rgba(5,8,16,0.7/0.85)` 这类叠加层，在 `colorTokens` 中没有对应语义 token。处理方式：在 `theme.js` 顶部定义一个由 token 拼出的局部常量块，不引入新 token：

```js
import { colorTokens as colors } from './colorTokens'

// 叠加层：白色蒙版与阴影，由基础色拼出，不额外增加 token
const overlay = {
  faint: 'rgba(255, 255, 255, 0.04)',
  soft: 'rgba(255, 255, 255, 0.06)',
  medium: 'rgba(255, 255, 255, 0.08)',
  strong: 'rgba(255, 255, 255, 0.12)',
  transparent: 'rgba(0, 0, 0, 0)',
}
const shadow = {
  card: '0 2px 14px rgba(5, 8, 16, 0.7)',
  cardHover: '0 6px 20px rgba(5, 8, 16, 0.85)',
  dropdown: '0 6px 20px rgba(5, 8, 16, 0.85)',
}
```

这样字面量集中在文件顶部两个常量里，而不是散在 190 行配置中。守卫测试只扫 `themeOverrides` 之后的部分，因此顶部常量块不会触发失败。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm run test -- tokens`
Expected: 全部 PASS。仍失败则说明 `themeOverrides` 里还有漏改的字面量，按报错列出的值继续替换。

- [ ] **Step 5: 补上缺失的 Timeline 配置**

`themeOverrides` 目前没有 `Timeline`，这是 `HomeView.vue` 用 `:deep(.n-timeline-item-content__title)` 硬改的原因。追加：

```js
  Timeline: {
    titleFontSize: '0.9rem',
    titleTextColor: colors.weakText,
    contentFontSize: '0.8rem',
    contentTextColor: colors.textMuted,
    metaTextColor: colors.accent,
    circleBorder: `2px solid ${colors.borderSoft}`,
    iconColorInfo: colors.accent,
    lineColor: colors.borderSoft,
  },
```

`HomeView` 里那两处 `:deep` 在 Task 9 迁移该页面时再删——本 Task 只补配置，不动页面，保证改动可独立回滚。

- [ ] **Step 6: 目视确认没走样**

Run: `cd frontend && npm run dev`
打开 http://localhost:5173 ，确认按钮、卡片、菜单、输入框、首页时间线与改前一致。Naive 组件底色应仍是深藏青而非纯黑——本 Task 是等价替换，任何肉眼可见的变化都说明映射错了。

- [ ] **Step 7: 提交**

```bash
git add frontend/src/config/theme.js frontend/src/config/__tests__/tokens.spec.js
git commit -m "refactor: :art: theme.js 清除字面量颜色并补齐 Timeline 配置"
```

---

## Task 4: uno.config.js 与 colorTokens 同源，解除 shortcut 命名冲突

现状：`uno.config.js` 的 colors 是上一版设计（`#2F333D` 灰底 + `#1EB5E8`），与纯黑主题不搭——这正是 UnoCSS 装了却全站只有 4 处命中的原因。同时其 shortcuts 定义了 `container` / `tech-box` / `page-header` / `section-title`，与 `main.css` 中真实使用的同名全局类冲突。

**Files:**
- Modify: `frontend/uno.config.js`
- Modify: `frontend/src/config/__tests__/tokens.spec.js`（追加守卫）

**Interfaces:**
- Consumes: `colorTokens`、`toCssVarName`
- Produces: Uno 可用的颜色类 `text-accent` / `bg-surface` / `border-soft` 等，取值与 CSS 变量完全一致

- [ ] **Step 1: 追加守卫测试**

在 `frontend/src/config/__tests__/tokens.spec.js` 末尾追加：

```js
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm run test -- tokens`
Expected: FAIL。第一个用例报 `uno 颜色 "primary" 在 colorTokens 中没有对应项`；第二个用例报冲突名未清空。

- [ ] **Step 3: 重写 uno.config.js**

整份替换 `frontend/uno.config.js`：

```js
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm run test -- tokens`
Expected: 全部 PASS。

- [ ] **Step 5: 确认没有页面在用被删的 shortcut**

Run: `cd frontend && grep -rn "card-base" src/`
Expected: 无输出。若有输出，说明该类实际有人用，需在 `main.css` 中补一个同名类而非直接删——回到本步骤前先处理。

- [ ] **Step 6: 构建 + 目视**

Run: `cd frontend && npm run build && npm run dev`
Expected: 构建通过；页面观感不变（此时页面尚未使用原子类，本 Task 属于纯配置修正）。

- [ ] **Step 7: 提交**

```bash
git add frontend/uno.config.js frontend/src/config/__tests__/tokens.spec.js
git commit -m "refactor: :art: uno.config 与 colorTokens 同源并解除 shortcut 命名冲突"
```

---

## Task 5: base.css 的 `:root` 颜色块改为脚本生成

现状：`base.css` 的 `:root` 静态硬编码 13 个 CSS 变量，与 `applyColorTokensToCssVars()` 运行时注入的是同一批——同一份调色板在代码里存在两遍，目前恰好一致。静态块不能直接删（删掉会在 JS 执行前出现无色闪烁），因此改为由脚本生成 + 守卫测试锁定。

**Files:**
- Create: `frontend/scripts/sync-css-tokens.js`
- Modify: `frontend/src/assets/base.css`
- Modify: `frontend/package.json`（新增 script）
- Modify: `frontend/src/config/__tests__/tokens.spec.js`（追加守卫）

**Interfaces:**
- Consumes: `deriveCssVariables()`
- Produces: `npm run tokens:sync`；`base.css` 中以 `/* == AUTO-GENERATED …` 标记的块

- [ ] **Step 1: 写生成脚本**

`frontend/scripts/sync-css-tokens.js`：

```js
// 由 colorTokens.js 生成 base.css 中的 :root 颜色块。
// 用法: npm run tokens:sync
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { deriveCssVariables } from '../src/config/colorTokens.js'

const BEGIN =
  '/* == AUTO-GENERATED FROM src/config/colorTokens.js — 勿手改，改后跑 npm run tokens:sync == */'
const END = '/* == END AUTO-GENERATED == */'

export const renderBlock = () => {
  const lines = Object.entries(deriveCssVariables()).map(([name, value]) => `  ${name}: ${value};`)
  return [BEGIN, ':root {', ...lines, '}', END].join('\n')
}

export const syncCssTokens = () => {
  const cssPath = fileURLToPath(new URL('../src/assets/base.css', import.meta.url))
  const source = readFileSync(cssPath, 'utf-8')
  const begin = source.indexOf(BEGIN)
  const end = source.indexOf(END)

  if (begin === -1 || end === -1) {
    console.error('base.css 中找不到 AUTO-GENERATED 标记块，请先手动插入标记后重试。')
    process.exit(1)
  }

  writeFileSync(cssPath, source.slice(0, begin) + renderBlock() + source.slice(end + END.length))
  console.log('base.css 的 :root 颜色块已同步。')
}

// 只有被直接执行时才写文件。守卫测试会 import 本模块取 renderBlock()，
// 若在顶层写文件，跑一次测试就会改动源文件——那是自证成功的假测试。
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncCssTokens()
}
```

- [ ] **Step 2: 添加 npm script**

在 `frontend/package.json` 的 `scripts` 中加入：

```json
"tokens:sync": "node scripts/sync-css-tokens.js"
```

- [ ] **Step 3: 改造 base.css**

字体 `@import` 本 Task 保持原位不动——它要到 Task 20 才挪进 `index.html`。提前删会让整个页面迁移阶段的目视对照都在错误字体下进行。

把 `:root { … }` 中的**颜色变量部分**替换为标记块，保留字体变量：

```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600&family=Space+Grotesk:wght@400;500;600&display=swap');

/* == AUTO-GENERATED FROM src/config/colorTokens.js — 勿手改，改后跑 npm run tokens:sync == */
:root {
}
/* == END AUTO-GENERATED == */

:root {
  --font-family-body:
    'Space Grotesk', 'Hiragino Sans GB', 'WenQuanYi Micro Hei', 'Microsoft YaHei', sans-serif;
  --font-family-heading:
    'Orbitron', 'Hiragino Sans GB', 'WenQuanYi Micro Hei', 'Microsoft YaHei', sans-serif;
  --font-family-mono: 'Roboto Mono', 'Courier New', Courier, monospace;
}
```

`--font-family-mono` 是新增的——`main.css` 与页面中有 4 处裸写 `monospace` / `Courier New`，Task 20 统一到这个变量。

- [ ] **Step 4: 运行生成脚本**

Run: `cd frontend && npm run tokens:sync`
Expected: 输出「base.css 的 :root 颜色块已同步。」，且 `git diff src/assets/base.css` 显示标记块内被填入全部 token（数量应等于 `colorTokens` 的键数，远多于原来的 13 个）。

- [ ] **Step 5: 追加守卫测试**

在 `frontend/src/config/__tests__/tokens.spec.js` 末尾追加：

```js
import { renderBlock } from '../../../scripts/sync-css-tokens.js'

describe('配置守卫：base.css 与 colorTokens 同步', () => {
  it('base.css 中的生成块与当前 colorTokens 一致', () => {
    const css = readSource('../../assets/base.css')
    expect(css).toContain(renderBlock())
  })

  it('生成块之外不再有手写的 --color-* 定义', () => {
    const css = readSource('../../assets/base.css')
    const outside = css.slice(css.indexOf('/* == END AUTO-GENERATED == */'))
    expect(outside.match(/--color-[a-z-]+\s*:/g)).toBeNull()
  })
})
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd frontend && npm run test -- tokens`
Expected: 全部 PASS。第二个用例若失败，说明 `:root` 之外还有手写颜色变量残留，删掉即可。

- [ ] **Step 7: 目视确认**

Run: `cd frontend && npm run dev`
Expected: 页面观感与改前一致。`base.css` 现在定义的变量比原来多（新增了 surface / hover 等），但没有任何选择器在用它们，所以不应有可见变化。

- [ ] **Step 8: 提交**

```bash
git add frontend/scripts/sync-css-tokens.js frontend/src/assets/base.css frontend/package.json frontend/src/config/__tests__/tokens.spec.js
git commit -m "refactor: :art: base.css 颜色变量改为由 colorTokens 生成"
```

---

# 阶段 1：数据层

## Task 6: `useStrapiResource` 底座

**Files:**
- Create: `frontend/src/composables/useStrapiResource.js`
- Create: `frontend/src/composables/__tests__/useStrapiResource.spec.js`

**Interfaces:**
- Consumes: `apiClient` from `@/composables/strapi`
- Produces（后续所有资源封装依赖这三个导出，签名不得更改）：
  - `normalizeStrapiError(e)` → `{ status: number|null, message: string } | null`（被取消的请求返回 `null`）
  - `useStrapiList(resource: string, params?: object|Ref|(() => object), options?: { debounce?: number, immediate?: boolean })` → `{ data: Ref<Array>, meta: Ref<object|null>, loading: Ref<boolean>, error: Ref<object|null>, isEmpty: ComputedRef<boolean>, refresh: () => Promise<void> }`
  - `useStrapiOne(resource: string, params?: object|Ref|(() => object))` → `{ data: Ref<object|null>, loading: Ref<boolean>, error: Ref<object|null>, notFound: ComputedRef<boolean>, refresh: () => Promise<void> }`

- [ ] **Step 1: 写失败的测试**

`frontend/src/composables/__tests__/useStrapiResource.spec.js`：

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useStrapiList, useStrapiOne, normalizeStrapiError } from '@/composables/useStrapiResource'

/** 在 effectScope 里跑 composable，返回结果与销毁函数。 */
const withScope = (fn) => {
  const scope = effectScope()
  const result = scope.run(fn)
  return { result, stop: () => scope.stop() }
}

const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

const okList = (items, meta = null) => ({ data: { data: items, meta } })

let get

beforeEach(() => {
  get = vi.spyOn(apiClient, 'get')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('normalizeStrapiError', () => {
  it('取消的请求不算错误', () => {
    expect(normalizeStrapiError({ code: 'ERR_CANCELED' })).toBeNull()
  })

  it('403 提示 Public 权限未开', () => {
    const err = normalizeStrapiError({ response: { status: 403 } })
    expect(err.status).toBe(403)
    expect(err.message).toContain('权限')
  })

  it('404 提示内容不存在', () => {
    expect(normalizeStrapiError({ response: { status: 404 } }).message).toContain('不存在')
  })

  it('无响应时归为连接失败', () => {
    const err = normalizeStrapiError({ message: 'Network Error' })
    expect(err.status).toBeNull()
    expect(err.message).toContain('连接')
  })
})

describe('useStrapiList', () => {
  it('解包 v5 响应的 data.data，并保留 meta', async () => {
    get.mockResolvedValue(okList([{ id: 1 }], { pagination: { total: 1 } }))
    const { result, stop } = withScope(() => useStrapiList('events'))
    await flush()
    expect(result.data.value).toEqual([{ id: 1 }])
    expect(result.meta.value).toEqual({ pagination: { total: 1 } })
    expect(result.loading.value).toBe(false)
    expect(result.error.value).toBeNull()
    stop()
  })

  it('请求路径为 /资源名，params 原样透传', async () => {
    get.mockResolvedValue(okList([]))
    const { stop } = withScope(() =>
      useStrapiList('events', { populate: 'coverImage', sort: 'date:desc' }),
    )
    await flush()
    expect(get).toHaveBeenCalledWith(
      '/events',
      expect.objectContaining({
        params: { populate: 'coverImage', sort: 'date:desc' },
      }),
    )
    stop()
  })

  it('空数组时 isEmpty 为真，加载中不算空', async () => {
    get.mockResolvedValue(okList([]))
    const { result, stop } = withScope(() => useStrapiList('events'))
    expect(result.loading.value).toBe(true)
    expect(result.isEmpty.value).toBe(false)
    await flush()
    expect(result.isEmpty.value).toBe(true)
    stop()
  })

  it('请求失败时暴露归一化的 error，且 loading 收尾', async () => {
    get.mockRejectedValue({ response: { status: 403 } })
    const { result, stop } = withScope(() => useStrapiList('events'))
    await flush()
    expect(result.error.value.status).toBe(403)
    expect(result.loading.value).toBe(false)
    expect(result.isEmpty.value).toBe(false)
    stop()
  })

  it('params 是 getter 时，变化会触发重新请求', async () => {
    get.mockResolvedValue(okList([]))
    const search = ref('')
    const { stop } = withScope(() => useStrapiList('events', () => ({ search: search.value })))
    await flush()
    expect(get).toHaveBeenCalledTimes(1)

    search.value = 'abc'
    await flush()
    expect(get).toHaveBeenCalledTimes(2)
    expect(get.mock.calls[1][1].params).toEqual({ search: 'abc' })
    stop()
  })

  it('每次请求都带 AbortSignal', async () => {
    get.mockResolvedValue(okList([]))
    const { stop } = withScope(() => useStrapiList('events'))
    await flush()
    expect(get.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    stop()
  })

  it('作用域销毁后，迟到的响应不再写回状态', async () => {
    let resolve
    get.mockReturnValue(new Promise((r) => (resolve = r)))
    const { result, stop } = withScope(() => useStrapiList('events'))
    stop()
    resolve(okList([{ id: 99 }]))
    await flush()
    expect(result.data.value).toEqual([])
    stop()
  })

  it('refresh 会重新发起请求', async () => {
    get.mockResolvedValue(okList([]))
    const { result, stop } = withScope(() => useStrapiList('events'))
    await flush()
    await result.refresh()
    expect(get).toHaveBeenCalledTimes(2)
    stop()
  })
})

describe('useStrapiOne', () => {
  it('取列表首项作为结果', async () => {
    get.mockResolvedValue(okList([{ id: 7, title: 'x' }]))
    const { result, stop } = withScope(() => useStrapiOne('events', { 'filters[slug][$eq]': 'a' }))
    await flush()
    expect(result.data.value).toEqual({ id: 7, title: 'x' })
    expect(result.notFound.value).toBe(false)
    stop()
  })

  it('结果为空时 notFound 为真', async () => {
    get.mockResolvedValue(okList([]))
    const { result, stop } = withScope(() => useStrapiOne('events', {}))
    await flush()
    expect(result.data.value).toBeNull()
    expect(result.notFound.value).toBe(true)
    stop()
  })

  it('出错时 notFound 不为真——错误与空要分得开', async () => {
    get.mockRejectedValue({ response: { status: 500 } })
    const { result, stop } = withScope(() => useStrapiOne('events', {}))
    await flush()
    expect(result.notFound.value).toBe(false)
    expect(result.error.value.status).toBe(500)
    stop()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm run test -- useStrapiResource`
Expected: FAIL，`Failed to resolve import "@/composables/useStrapiResource"`。

- [ ] **Step 3: 实现底座**

`frontend/src/composables/useStrapiResource.js`：

```js
import { ref, computed, watch, toValue, onScopeDispose } from 'vue'
import { apiClient } from './strapi'

const STATUS_MESSAGE = {
  403: '没有访问权限（Strapi 未开放该接口的 Public 权限）',
  404: '请求的内容不存在',
  500: '服务器内部错误',
}

/**
 * 把 axios 抛出的各种形态归一成 { status, message }。
 * 被 AbortController 取消的请求不是错误，返回 null。
 */
export const normalizeStrapiError = (e) => {
  if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return null
  const status = e?.response?.status ?? null
  const message =
    STATUS_MESSAGE[status] ??
    (status ? `请求失败（HTTP ${status}）` : '连接超时或服务器错误。')
  return { status, message }
}

export function useStrapiList(resource, params = {}, options = {}) {
  const { debounce = 0, immediate = true } = options

  const data = ref([])
  const meta = ref(null)
  const loading = ref(immediate)
  const error = ref(null)

  const isEmpty = computed(
    () => !loading.value && !error.value && Array.isArray(data.value) && data.value.length === 0,
  )

  let controller = null
  let timer = null
  let disposed = false

  const run = async () => {
    if (disposed) return
    controller?.abort()
    controller = new AbortController()
    const mine = controller

    loading.value = true
    error.value = null

    try {
      const res = await apiClient.get(`/${resource}`, {
        params: toValue(params),
        signal: mine.signal,
      })
      if (mine.signal.aborted || disposed) return
      data.value = res.data?.data ?? []
      meta.value = res.data?.meta ?? null
    } catch (e) {
      if (mine.signal.aborted || disposed) return
      const normalized = normalizeStrapiError(e)
      if (normalized) error.value = normalized
    } finally {
      if (!mine.signal.aborted && !disposed) loading.value = false
    }
  }

  const refresh = () => {
    if (!debounce) return run()
    clearTimeout(timer)
    return new Promise((resolve) => {
      timer = setTimeout(() => resolve(run()), debounce)
    })
  }

  watch(() => toValue(params), () => refresh(), { deep: true })

  if (immediate) run()

  onScopeDispose(() => {
    disposed = true
    controller?.abort()
    clearTimeout(timer)
  })

  return { data, meta, loading, error, isEmpty, refresh: run }
}

export function useStrapiOne(resource, params = {}) {
  const list = useStrapiList(resource, params)
  const data = computed(() => list.data.value?.[0] ?? null)
  const notFound = computed(
    () => !list.loading.value && !list.error.value && list.data.value?.length === 0,
  )
  return {
    data,
    loading: list.loading,
    error: list.error,
    notFound,
    refresh: list.refresh,
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm run test -- useStrapiResource`
Expected: 全部 PASS（4 + 8 + 3 = 15 个用例）。

`useStrapiOne` 返回的 `data` 是 computed 而非 ref——测试中 `result.data.value` 读取方式不变，但调用方不能对它赋值。这是有意的。

- [ ] **Step 5: 全量测试**

Run: `cd frontend && npm run test`
Expected: 全部 PASS，无回归。

- [ ] **Step 6: 提交**

```bash
git add frontend/src/composables/useStrapiResource.js frontend/src/composables/__tests__/useStrapiResource.spec.js
git commit -m "feat: :sparkles: 新增 useStrapiResource 数据层底座"
```

---

## Task 7: 四个资源封装

把 `populate` / `sort` / `filters` 这些 Strapi 约定钉死在资源层，页面从此不碰。

**Files:**
- Create: `frontend/src/composables/useEvents.js`
- Create: `frontend/src/composables/useProducts.js`
- Create: `frontend/src/composables/useProjects.js`
- Create: `frontend/src/composables/useConventions.js`
- Create: `frontend/src/composables/__tests__/resources.spec.js`

**Interfaces:**
- Consumes: `useStrapiList` / `useStrapiOne`（签名见 Task 6）
- Produces：
  - `useEvents({ limit?, search? })` / `useEvent(slug)`
  - `useProducts({ limit?, category?, search? })` / `useProduct(slug)` / `useProductsByIds(ids)` / `useRecommendedProducts(excludeId)`
  - `useProjects({ limit? })` / `normalizeProjects(rawList)`
  - `useConventions({ upcoming?, limit? })`
  - 所有列表型返回值与 `useStrapiList` 一致；`useEvent` / `useProduct` 与 `useStrapiOne` 一致

- [ ] **Step 1: 写失败的测试**

`frontend/src/composables/__tests__/resources.spec.js`：

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { apiClient } from '@/composables/strapi'
import { useEvents, useEvent } from '@/composables/useEvents'
import { useProducts, useProduct, useProductsByIds } from '@/composables/useProducts'
import { useProjects, normalizeProjects } from '@/composables/useProjects'
import { useConventions } from '@/composables/useConventions'

const withScope = (fn) => {
  const scope = effectScope()
  const result = scope.run(fn)
  return { result, stop: () => scope.stop() }
}
const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

let get
const paramsOf = (call = 0) => get.mock.calls[call][1].params
const pathOf = (call = 0) => get.mock.calls[call][0]

beforeEach(() => {
  get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: [], meta: null } })
})
afterEach(() => vi.restoreAllMocks())

describe('useEvents', () => {
  it('固定带上 coverImage 与按日期倒序——页面不需要自己写 populate', async () => {
    const { stop } = withScope(() => useEvents())
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('date:desc')
    stop()
  })

  it('limit 映射到 Strapi 的 pagination[limit]', async () => {
    const { stop } = withScope(() => useEvents({ limit: 3 }))
    await flush()
    expect(paramsOf()['pagination[limit]']).toBe(3)
    stop()
  })

  it('search 映射到标题模糊匹配，空搜索不产生 filters', async () => {
    const search = ref('')
    const { stop } = withScope(() => useEvents({ search }))
    await flush()
    expect(paramsOf().filters).toBeUndefined()

    search.value = '合同志'
    await flush()
    expect(paramsOf(1).filters).toEqual({ title: { $containsi: '合同志' } })
    stop()
  })
})

describe('useEvent', () => {
  it('按 slug 查询并深度 populate 动态区', async () => {
    const { stop } = withScope(() => useEvent('my-event'))
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'my-event' } })
    expect(paramsOf().populate).toEqual({ mainContent: { populate: '*' } })
    stop()
  })

  it('slug 通过 params 传递而非拼接 URL——特殊字符不会破坏请求', async () => {
    const { stop } = withScope(() => useEvent('a&b=c'))
    await flush()
    expect(pathOf()).toBe('/events')
    expect(paramsOf().filters.slug.$eq).toBe('a&b=c')
    stop()
  })
})

describe('useProducts', () => {
  it('固定 coverImage 与按发布日倒序', async () => {
    const { stop } = withScope(() => useProducts())
    await flush()
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('releaseDate:desc')
    stop()
  })

  it('category 为「全部」或空时不加过滤条件', async () => {
    const { stop } = withScope(() => useProducts({ category: '' }))
    await flush()
    expect(paramsOf().filters).toBeUndefined()
    stop()
  })

  it('指定 category 时加等值过滤', async () => {
    const { stop } = withScope(() => useProducts({ category: '音乐' }))
    await flush()
    expect(paramsOf().filters).toEqual({ category: { $eq: '音乐' } })
    stop()
  })
})

describe('useProduct', () => {
  it('按 slug 查询并 populate 全部关联', async () => {
    const { stop } = withScope(() => useProduct('cd-01'))
    await flush()
    expect(paramsOf().filters).toEqual({ slug: { $eq: 'cd-01' } })
    expect(paramsOf().populate).toBe('*')
    stop()
  })
})

describe('useProductsByIds', () => {
  it('用 $in 一次批量取回，避免 N+1', async () => {
    const { stop } = withScope(() => useProductsByIds([3, 5, 8]))
    await flush()
    expect(get).toHaveBeenCalledTimes(1)
    expect(paramsOf().filters).toEqual({ id: { $in: [3, 5, 8] } })
    expect(paramsOf().populate).toBe('coverImage')
    stop()
  })

  it('id 列表为空时根本不发请求', async () => {
    const { stop } = withScope(() => useProductsByIds([]))
    await flush()
    expect(get).not.toHaveBeenCalled()
    stop()
  })
})

describe('useProjects', () => {
  it('固定 coverImage 与按日期倒序', async () => {
    const { stop } = withScope(() => useProjects({ limit: 6 }))
    await flush()
    expect(pathOf()).toBe('/projects')
    expect(paramsOf().populate).toBe('coverImage')
    expect(paramsOf().sort).toBe('date:desc')
    expect(paramsOf()['pagination[limit]']).toBe(6)
    stop()
  })
})

describe('normalizeProjects', () => {
  it('过滤掉没有 title 的脏数据', () => {
    expect(normalizeProjects([{ id: 1, title: 'A' }, { id: 2 }, null])).toEqual([
      { id: 1, title: 'A' },
    ])
  })

  it('输入非数组时返回空数组，不抛错', () => {
    expect(normalizeProjects(null)).toEqual([])
    expect(normalizeProjects(undefined)).toEqual([])
  })
})

describe('useConventions', () => {
  it('upcoming 为真时只取今天及以后的，按日期升序', async () => {
    const { stop } = withScope(() => useConventions({ upcoming: true, limit: 4 }))
    await flush()
    expect(pathOf()).toBe('/conventions')
    expect(paramsOf().sort).toBe('date:asc')
    expect(paramsOf()['filters[date][$gte]']).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(paramsOf()['pagination[limit]']).toBe(4)
    stop()
  })

  it('upcoming 为假时不加日期过滤', async () => {
    const { stop } = withScope(() => useConventions())
    await flush()
    expect(paramsOf()['filters[date][$gte]']).toBeUndefined()
    stop()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm run test -- resources`
Expected: FAIL，四个模块都无法解析。

- [ ] **Step 3: 实现 useEvents.js**

```js
import { toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

/** 列表页 / 首页共用。search 可以是 ref 或普通值。 */
export function useEvents({ limit, search } = {}, options = {}) {
  return useStrapiList(
    'events',
    () => {
      const keyword = String(toValue(search) ?? '').trim()
      return {
        populate: 'coverImage',
        sort: 'date:desc',
        ...(limit ? { 'pagination[limit]': toValue(limit) } : {}),
        ...(keyword ? { filters: { title: { $containsi: keyword } } } : {}),
      }
    },
    options,
  )
}

/** 详情页。mainContent 是动态区，必须深度 populate 才能拿到嵌入块。 */
export function useEvent(slug) {
  return useStrapiOne('events', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: { mainContent: { populate: '*' } },
  }))
}
```

- [ ] **Step 4: 实现 useProducts.js**

```js
import { computed, toValue } from 'vue'
import { useStrapiList, useStrapiOne } from './useStrapiResource'

export function useProducts({ limit, category, search } = {}, options = {}) {
  return useStrapiList(
    'products',
    () => {
      const cat = String(toValue(category) ?? '').trim()
      const keyword = String(toValue(search) ?? '').trim()
      const filters = {}
      if (cat && cat !== '全部') filters.category = { $eq: cat }
      if (keyword) filters.title = { $containsi: keyword }
      return {
        populate: 'coverImage',
        sort: 'releaseDate:desc',
        ...(limit ? { 'pagination[limit]': toValue(limit) } : {}),
        ...(Object.keys(filters).length ? { filters } : {}),
      }
    },
    options,
  )
}

export function useProduct(slug) {
  return useStrapiOne('products', () => ({
    filters: { slug: { $eq: toValue(slug) } },
    populate: '*',
  }))
}

/**
 * EventDetail 的动态区里 product 嵌入块只带 id，需要二次批量补全。
 * 用 $in 一次取回，不要在循环里逐个请求。
 */
export function useProductsByIds(ids) {
  const list = useStrapiList(
    'products',
    () => ({
      filters: { id: { $in: toValue(ids) ?? [] } },
      populate: 'coverImage',
    }),
    { immediate: (toValue(ids) ?? []).length > 0 },
  )

  const byId = computed(() =>
    Object.fromEntries((list.data.value ?? []).map((item) => [item.id, item])),
  )

  return { ...list, byId }
}

/** ProductDetail 的推荐位。行为与改造前一致：排除当前条目后随机取若干。 */
export function useRecommendedProducts(excludeId, count = 3) {
  const list = useStrapiList('products', () => ({
    populate: 'coverImage',
    'filters[id][$ne]': toValue(excludeId),
    'pagination[limit]': 50,
  }))

  const picked = computed(() => {
    const pool = [...(list.data.value ?? [])]
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, count)
  })

  return { ...list, data: picked }
}
```

`useRecommendedProducts` 把原来的两次往返（先 `pageSize=1` 拿 total，再拉全部 id）合并成一次带上限的请求。行为差异：原实现从全量池中抽，新实现从最近 50 条中抽。当前制品总数远小于 50，无可见差异。

- [ ] **Step 5: 实现 useProjects.js**

```js
import { computed, toValue } from 'vue'
import { useStrapiList } from './useStrapiResource'

export function normalizeProjects(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.filter((item) => item && typeof item.title === 'string' && item.title.length > 0)
}

export function useProjects({ limit } = {}) {
  const list = useStrapiList('projects', () => ({
    populate: 'coverImage',
    sort: 'date:desc',
    ...(limit ? { 'pagination[limit]': toValue(limit) } : {}),
  }))

  return { ...list, data: computed(() => normalizeProjects(list.data.value)) }
}
```

- [ ] **Step 6: 实现 useConventions.js**

```js
import { toValue } from 'vue'
import { useStrapiList } from './useStrapiResource'

const today = () => new Date().toISOString().slice(0, 10)

export function useConventions({ upcoming = false, limit } = {}) {
  return useStrapiList('conventions', () => ({
    sort: upcoming ? 'date:asc' : 'date:desc',
    ...(toValue(upcoming) ? { 'filters[date][$gte]': today() } : {}),
    ...(limit ? { 'pagination[limit]': toValue(limit) } : {}),
  }))
}
```

- [ ] **Step 7: 运行测试确认通过**

Run: `cd frontend && npm run test -- resources`
Expected: 全部 PASS。若 `useProductsByIds` 空列表用例失败（仍发了请求），检查 `immediate` 的取值时机。

- [ ] **Step 8: 全量测试**

Run: `cd frontend && npm run test`
Expected: 全部 PASS。

- [ ] **Step 9: 提交**

```bash
git add frontend/src/composables/useEvents.js frontend/src/composables/useProducts.js frontend/src/composables/useProjects.js frontend/src/composables/useConventions.js frontend/src/composables/__tests__/resources.spec.js
git commit -m "feat: :sparkles: 新增 event/product/project/convention 四个资源封装"
```

---

# 阶段 2：统一状态呈现

## Task 8: `AsyncBoundary` 组件

**Files:**
- Create: `frontend/src/components/AsyncBoundary.vue`
- Modify: `frontend/src/assets/main.css`（`.status-box` 相关样式迁入组件后删除——**本 Task 先不删**，见 Step 5）

**Interfaces:**
- Consumes: `error` 对象形状 `{ status, message }`（Task 6 定义）
- Produces: 组件 `<AsyncBoundary>`
  - props: `loading: Boolean`、`error: Object|null`、`empty: Boolean`、`skeleton: 'list'|'text'|'none'`（默认 `'list'`）、`emptyText: String`、`loadingText: String`
  - emits: `retry`
  - 默认插槽渲染内容

- [ ] **Step 1: 实现组件**

`frontend/src/components/AsyncBoundary.vue`：

```vue
<template>
  <!-- 加载态：骨架屏形状要贴合内容，通用转圈会让列表页布局跳动 -->
  <div v-if="loading" class="async-boundary-state">
    <n-skeleton v-if="skeleton === 'list'" text :repeat="3" style="height: 96px" />
    <n-skeleton v-else-if="skeleton === 'text'" text :repeat="6" />
    <p v-else class="async-boundary-hint">{{ loadingText }}</p>
  </div>

  <!-- 错误态：文案沿用站点的终端风格，并提供重试 -->
  <div v-else-if="error" class="status-box error async-boundary-error">
    <p>&gt;&gt; [错误] {{ error.message }}</p>
    <n-button size="small" ghost class="mt-3" @click="emit('retry')">&gt;&gt; 重试</n-button>
  </div>

  <!-- 空态 -->
  <div v-else-if="empty" class="status-box">
    <n-empty :description="emptyText" />
  </div>

  <slot v-else />
</template>

<script setup>
import { NSkeleton, NEmpty, NButton } from 'naive-ui'

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: Object, default: null },
  empty: { type: Boolean, default: false },
  skeleton: { type: String, default: 'list' },
  loadingText: { type: String, default: '>> 正在获取最新情报...' },
  emptyText: { type: String, default: '>> 当前没有内容。' },
})

const emit = defineEmits(['retry'])
</script>

<style scoped>
.async-boundary-state {
  margin: 2rem 0;
}

.async-boundary-hint {
  text-align: center;
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
}

.async-boundary-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
</style>
```

`.status-box` 与 `.status-box.error` 仍来自 `main.css` 的全局定义——组件复用它们以保持外观完全一致。

- [ ] **Step 2: 写一个临时的验证页面路由**

不要为了验证去临时改任何现有页面——现有页面的 `error` 还是旧的字符串形态（`AsyncBoundary` 期望 `{ message }` 对象），临时接上会得到 `undefined` 文案，验证结果不可信，还容易忘记改回去。

改为新建一个只在开发期存在的临时组件 `frontend/src/components/__AsyncBoundaryDemo.vue`：

```vue
<template>
  <div class="container" style="padding: 4rem 0">
    <n-space vertical size="large">
      <n-button @click="state = 'loading'">加载态</n-button>
      <n-button @click="state = 'error'">错误态</n-button>
      <n-button @click="state = 'empty'">空态</n-button>
      <n-button @click="state = 'ok'">正常内容</n-button>

      <AsyncBoundary
        :loading="state === 'loading'"
        :error="state === 'error' ? { status: 500, message: '连接超时或服务器错误。' } : null"
        :empty="state === 'empty'"
        @retry="state = 'ok'"
      >
        <div class="tech-box">正常内容渲染在这里</div>
      </AsyncBoundary>
    </n-space>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NButton, NSpace } from 'naive-ui'
import AsyncBoundary from './AsyncBoundary.vue'

const state = ref('loading')
</script>
```

在 `src/router/index.js` 中临时加一条路由 `{ path: '/__demo', component: () => import('@/components/__AsyncBoundaryDemo.vue') }`。

- [ ] **Step 3: 三态目视验证**

Run: `cd frontend && npm run dev`，访问 http://localhost:5173/__demo

依次点击四个按钮，确认：

- 加载态：骨架屏出现，占位高度接近真实卡片，不产生明显布局跳动
- 错误态：显示 `>> [错误] 连接超时或服务器错误。` 与重试按钮，外观与站点其他位置的 `.status-box.error` 一致
- 重试：点击后切到正常内容
- 空态：显示 `>> 当前没有内容。`，`n-empty` 的图标与文字颜色跟深色背景协调

- [ ] **Step 4: 删除临时验证代码**

删除 `frontend/src/components/__AsyncBoundaryDemo.vue`，并移除 `src/router/index.js` 中的 `/__demo` 路由。

Run: `cd frontend && grep -rn "__demo\|__AsyncBoundaryDemo" src/`
Expected: 无输出。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/AsyncBoundary.vue
git commit -m "feat: :sparkles: 新增 AsyncBoundary 统一加载/空/错误三态"
```

- [ ] **Step 6: 确认 `.status-box` 暂不删除**

Run: `cd frontend && grep -rn "status-box" src/`
Expected: `main.css` 中的定义与各页面的使用都还在。`.status-box` 要等到 Task 18（全部页面迁移完）才能从 `main.css` 删除，否则中间态页面会掉样式。

---

# 阶段 3：页面迁移

> 每个页面一个 commit。每页改完立刻 `npm run dev` 目视对照，确认与改前一致后再进入下一页。
>
> **前两个页面（Task 9、10）是检查点**：若 `useStrapiResource` 的接口设计有问题会在此暴露，此时返工成本是两个文件而非九个。发现问题应回到 Task 6 修底座并补测试，而不是在页面里绕开。

## Task 9: 迁移 HomeView

**Files:**
- Modify: `frontend/src/views/HomeView.vue`

**Interfaces:**
- Consumes: `useProducts`、`useEvents`、`useConventions`、`AsyncBoundary`

- [ ] **Step 1: 替换 script 块的数据获取**

删除 `HomeView.vue` 中 `fetchRecentData` 整个函数、三个 `ref` 声明与 `onMounted` 调用（约第 100–134 行），替换为：

```js
import { NTimeline, NTimelineItem, NDivider } from 'naive-ui'
import ProjectsBar from '@/components/ProjectsBar.vue'
import ProductCard from '@/components/ProductCard.vue'
import EventCard from '@/components/EventCard.vue'
import TechSection from '@/components/TechSection.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import { useProducts } from '@/composables/useProducts'
import { useEvents } from '@/composables/useEvents'
import { useConventions } from '@/composables/useConventions'

const {
  data: recentProducts,
  loading: productsLoading,
  error: productsError,
  isEmpty: productsEmpty,
  refresh: refreshProducts,
} = useProducts({ limit: 3 })

const {
  data: recentEvents,
  loading: eventsLoading,
  error: eventsError,
  isEmpty: eventsEmpty,
  refresh: refreshEvents,
} = useEvents({ limit: 3 })

const {
  data: upcomingConventions,
  loading: conventionsLoading,
  error: conventionsError,
  isEmpty: conventionsEmpty,
  refresh: refreshConventions,
} = useConventions({ upcoming: true, limit: 4 })
```

注意 `import { ref, onMounted } from 'vue'` 与 `import { apiClient } from '@/composables/strapi'` 两行一并删除。

- [ ] **Step 2: 三个区块各包一个 AsyncBoundary**

这是本页最关键的一点：**三个独立边界，不是整页一个**。首页并行请求三个接口，整页共用状态会导致展会接口挂掉时连带最新制品和社团介绍一起消失。

事件区块（原第 17–23 行的 `v-if="recentEvents.length > 0"` 条件整体删除，改由 boundary 管）：

```vue
<TechSection title="最新动态 / EVENTS" custom-class="event-section">
  <AsyncBoundary
    :loading="eventsLoading"
    :error="eventsError"
    :empty="eventsEmpty"
    empty-text=">> 暂无最新动态。"
    @retry="refreshEvents"
  >
    <div class="events-compact-list">
      <EventCard v-for="event in recentEvents" :key="event.id" :event="event" />
    </div>
  </AsyncBoundary>
</TechSection>
```

展会区块：

```vue
<TechSection title="近期展会 / EXP" custom-class="convention-section">
  <div class="timeline-wrapper">
    <AsyncBoundary
      :loading="conventionsLoading"
      :error="conventionsError"
      :empty="conventionsEmpty"
      skeleton="text"
      empty-text=">> 暂无即将参加的展会。"
      @retry="refreshConventions"
    >
      <n-timeline>
        <n-timeline-item
          v-for="conv in upcomingConventions"
          :key="conv.id"
          type="info"
          :title="conv.name"
          :content="'QQ群: ' + conv.qqgroup"
          :time="conv.date"
        />
      </n-timeline>
    </AsyncBoundary>
  </div>
</TechSection>
```

制品区块同理，`skeleton="list"`，`empty-text=">> 暂无新品发布。"`，`@retry="refreshProducts"`。原来的 `<p v-else class="empty-text">` 两处删除。

- [ ] **Step 3: 删掉被 themeOverrides 接管的 :deep**

Task 3 已给 `themeOverrides` 补上 `Timeline` 配置。删除 `HomeView.vue` 样式块中的：

```css
:deep(.n-timeline-item-content__title) { … }
:deep(.n-timeline-item-content__meta) { … }
```

同时删除已无引用的 `.empty-text` 规则。

- [ ] **Step 4: 目视对照**

Run: `cd frontend && npm run dev`
Expected: 首页三个区块的内容、间距、时间线字号与颜色应与改前一致。若时间线标题字号或颜色变了，回到 Task 3 的 `Timeline` 配置调整，而不是把 `:deep` 加回来。

- [ ] **Step 5: 故障隔离验证**

在 Strapi Admin 中把 Public 角色对 `convention` 的 `find` 权限临时取消，刷新首页。
Expected: 只有「近期展会」区块显示错误态与重试按钮，最新动态、最新制品、社团介绍照常渲染。验证完把权限改回来。

这一步验证的是本次改造对首页最实质的改进——改造前该场景下 `fetchRecentData` 的 `Promise.all` 会整体 reject，三个区块全部空白且无任何提示。

- [ ] **Step 6: 提交**

```bash
git add frontend/src/views/HomeView.vue
git commit -m "refactor: :recycle: HomeView 接入数据层与分区块状态边界"
```

---

## Task 10: 迁移 EventDetail

496 行，全项目最长，且含动态区二次批量拉取。

**Files:**
- Modify: `frontend/src/views/EventDetail.vue`

**Interfaces:**
- Consumes: `useEvent(slug)`、`useProductsByIds(ids)`、`AsyncBoundary`

- [ ] **Step 1: 替换主数据获取**

把按 slug 取 event 的逻辑（含拼接 URL 的那句 `apiClient.get(\`/events?filters[slug][$eq]=${slug}\`, …)`）替换为：

```js
import { useRoute } from 'vue-router'
import { computed, watch, ref } from 'vue'
import { useEvent } from '@/composables/useEvents'
import { useProductsByIds } from '@/composables/useProducts'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

const route = useRoute()
const {
  data: event,
  loading,
  error,
  notFound,
  refresh,
} = useEvent(() => route.params.slug)
```

`useEvent` 接受 getter，路由参数变化时会自动重新请求——原实现需要手写 `watch(() => route.params.slug, …)`，可一并删除。

- [ ] **Step 2: 替换动态区的 product 补全**

原实现遍历 `mainContent` 收集 product id 后再发一次请求。改为：

```js
// 动态区里的 product 嵌入块只带 id，需要二次补全
const embeddedProductIds = computed(() => {
  const blocks = event.value?.mainContent ?? []
  return blocks
    .filter((b) => b.__component === 'embedding.product-embed' && b.product?.id)
    .map((b) => b.product.id)
})

const { byId: productsById } = useProductsByIds(embeddedProductIds)
```

模板中原先读取补全后 product 的地方改为 `productsById[block.product.id]`。

**实施提示：** `__component` 的确切值需在实施时以实际数据为准。执行 `curl -s 'http://localhost:1337/api/events?populate[mainContent][populate]=*' | head -c 2000` 查看真实的 `__component` 字符串，按实际值填写，不要照抄本行。

- [ ] **Step 3: 包上 AsyncBoundary**

整页内容包一层（详情页不同于首页，主数据拿不到就没有可展示的东西，整页边界是正确的）：

```vue
<AsyncBoundary
  :loading="loading"
  :error="error"
  :empty="notFound"
  skeleton="text"
  empty-text=">> 该事件不存在或已被删除。"
  @retry="refresh"
>
  <!-- 原有详情内容 -->
</AsyncBoundary>
```

原先 `throw new Error('该事件不存在或已被删除')` 的分支删除——`notFound` 已经表达了这个语义，且区分了「不存在」与「请求失败」。

- [ ] **Step 4: 目视对照**

Run: `cd frontend && npm run dev`
访问一个真实存在的事件详情页，确认正文、动态区嵌入的制品卡片、图片都正常。再访问一个不存在的 slug（如 `/events/does-not-exist`），确认显示的是空态文案而非错误态。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/views/EventDetail.vue
git commit -m "refactor: :recycle: EventDetail 接入数据层，动态区改批量补全"
```

- [ ] **Step 6: 检查点复盘**

前两个页面迁移完毕。回答三个问题后再继续：

1. `useStrapiResource` 的返回值是否够用？有没有在页面里写了绕开底座的代码？
2. `AsyncBoundary` 的 props 是否够用？有没有为了特殊需求而在页面里重新实现三态？
3. 资源封装的参数形状是否自然？有没有出现「为了迁就封装而扭曲页面逻辑」？

若任一答案为「否」，回到 Task 6 或 Task 7 修改底座并补测试，然后重做这两个页面。此时成本最低。

---

## Task 11: 迁移 EventList

**Files:**
- Modify: `frontend/src/views/EventList.vue`

- [ ] **Step 1: 替换数据获取与防抖**

删除 `fetchEvents`、`debounceTimer`、`watch(searchTerm, …)` 全部逻辑，替换为：

```js
import { ref } from 'vue'
import EventCard from '@/components/EventCard.vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import { useEvents } from '@/composables/useEvents'

const searchTerm = ref('')
const { data: events, loading, error, isEmpty, refresh } = useEvents(
  { search: searchTerm },
  { debounce: 300 },
)
```

手写的 `clearTimeout` + `setTimeout` 防抖由底座的 `debounce` 选项接管。

- [ ] **Step 2: 搜索框换成 Naive 组件**

按三层分工，有交互状态的控件归 Naive。把原生 `<input class="search-input">` 换成：

```vue
<n-input v-model:value="searchTerm" placeholder="搜索事件标题..." clearable />
```

并 `import { NInput } from 'naive-ui'`。删除 scoped 样式中的 `.search-input` 及其 `::placeholder` / `:focus` 规则——这些已由 `themeOverrides.Input` 统一。

- [ ] **Step 3: 三段状态 DOM 换成 AsyncBoundary**

```vue
<AsyncBoundary
  :loading="loading"
  :error="error"
  :empty="isEmpty"
  empty-text=">> 当前没有新的动态。"
  @retry="refresh"
>
  <div class="event-list-container">
    <EventCard v-for="event in events" :key="event.slug" :event="event" />
  </div>
</AsyncBoundary>
```

- [ ] **Step 4: 目视对照**

Run: `cd frontend && npm run dev`
确认列表渲染、搜索防抖（连续输入只在停顿后发一次请求，可在 Network 面板确认）、清空搜索恢复全量。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/views/EventList.vue
git commit -m "refactor: :recycle: EventList 接入数据层，搜索框换用 n-input"
```

---

## Task 12: 迁移 ProductList

**Files:**
- Modify: `frontend/src/views/ProductList.vue`

- [ ] **Step 1: 替换数据获取**

```js
import { ref } from 'vue'
import { useProducts } from '@/composables/useProducts'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

const selectedCategory = ref('')
const searchTerm = ref('')
const { data: products, loading, error, isEmpty, refresh } = useProducts(
  { category: selectedCategory, search: searchTerm },
  { debounce: 300 },
)
```

- [ ] **Step 2: 分类列表保持现有实现**

分类去重目前是拉全量 products 后在前端 `Set`。按 spec 第 5 节，本轮**只做搬迁不改算法**。把该请求改为走底座：

```js
const { data: categorySource } = useProducts({ limit: 200 })
const categories = computed(() => [
  '全部',
  ...new Set((categorySource.value ?? []).map((p) => p.category).filter(Boolean)),
])
```

- [ ] **Step 3: 三段状态 DOM 换成 AsyncBoundary**，`empty-text=">> 没有符合条件的制品。"`

- [ ] **Step 4: 目视对照 + 提交**

Run: `cd frontend && npm run dev`，确认分类筛选与搜索联动正常。

```bash
git add frontend/src/views/ProductList.vue
git commit -m "refactor: :recycle: ProductList 接入数据层"
```

---

## Task 13: 迁移 ProductDetail

**Files:**
- Modify: `frontend/src/views/ProductDetail.vue`

- [ ] **Step 1: 替换主数据获取**

删除拼接 URL 的 `apiClient.get(\`/products?filters[slug][$eq]=${slug}&populate=*\`)`（slug 未编码问题随之修复）：

```js
import { useRoute } from 'vue-router'
import { useProduct, useRecommendedProducts } from '@/composables/useProducts'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

const route = useRoute()
const { data: product, loading, error, notFound, refresh } = useProduct(() => route.params.slug)
```

- [ ] **Step 2: 替换推荐位**

删除 `fetchRecommendedProducts` 整个函数（含先取 total 再取 id 的两次往返）：

```js
import { computed } from 'vue'
const { data: recommended } = useRecommendedProducts(computed(() => product.value?.id))
```

- [ ] **Step 3: 包 AsyncBoundary**，`skeleton="text"`，`empty-text=">> 档案不存在或已被删除。"`

原 `throw new Error('档案不存在或已被删除')` 删除。

- [ ] **Step 4: 目视对照 + 提交**

确认详情页正文、图片、推荐位都正常，访问不存在的 slug 显示空态。

```bash
git add frontend/src/views/ProductDetail.vue
git commit -m "refactor: :recycle: ProductDetail 接入数据层，推荐位合并为单次请求"
```

---

## Task 14: 迁移 ProjectsBar 与 SiteHeader

两者请求同一个 `/projects` 且各有一份 `normalizeProjects`，必须一起改。

**Files:**
- Modify: `frontend/src/components/ProjectsBar.vue`
- Modify: `frontend/src/components/SiteHeader.vue`

- [ ] **Step 1: ProjectsBar 换用 useProjects**

删除其中的 `apiClient.get('/projects', …)`、本地 `normalizeProjects` 定义与静默 catch：

```js
import { useProjects } from '@/composables/useProjects'
import AsyncBoundary from '@/components/AsyncBoundary.vue'

const { data: projects, loading, error, isEmpty, refresh } = useProjects({ limit: 6 })
```

轮播内容包一层 `AsyncBoundary`，`empty-text=">> 暂无线上项目。"`。**这修掉了一处静默失败**——改造前接口挂了此处只有 `console.error`，页面一片空白且用户无从知晓。

- [ ] **Step 2: SiteHeader 换用 useProjects**

同样删除本地 `apiClient.get` 与 `normalizeProjects`：

```js
import { useProjects } from '@/composables/useProjects'
const { data: projects } = useProjects({ limit: 20 })
const projectMenuChildren = computed(() => buildProjectMenuChildren(projects.value))
```

`buildProjectMenuChildren` 保留在 `SiteHeader.vue`——它是菜单结构的构造逻辑，不属于数据层。

导航菜单不加 `AsyncBoundary`：菜单项加载失败时应静默降级为空菜单，在导航栏里弹错误框反而更糟。这是有意的例外，与其他位置的处理不同。

- [ ] **Step 3: 处理穿透 Naive 内部类的 `:deep`**

`SiteHeader.vue` 中有 4 处 `:deep(.n-menu*)`，`EventCard.vue` 与 `ProductCard.vue` 各有 `:deep(.n-tag)`。这些穿透的是 Naive 的内部 BEM 类名，属于组件库实现细节，升级小版本就可能改名。

逐个判断（spec 风险 3 的处理方式，不强行清零）：

- 能用 `themeOverrides.Menu` / `themeOverrides.Tag` 干净表达的，把样式搬进 `theme.js` 并删除 `:deep`
- 搬过去后外观明显走样的，保留 `:deep` 原样，并在其上方加一行注释说明为何保留

`themeOverrides` 里 `Menu` 与 `Tag` 已有基础配置（Task 3 未改动其内容），本步骤是在其上补充这几处 `:deep` 表达的样式。

**注意**：`SiteHeader.vue` 中还有一处 `:deep(.menu-link)`——那穿透的是自有类而非 Naive 内部类，属正当用法，保留不动。

- [ ] **Step 4: 确认两处 normalizeProjects 已删净**

Run: `cd frontend && grep -rn "normalizeProjects" src/`
Expected: 只在 `src/composables/useProjects.js` 与其测试中出现。

- [ ] **Step 5: 目视对照 + 提交**

确认首页项目轮播、导航栏项目下拉菜单都正常。

```bash
git add frontend/src/components/ProjectsBar.vue frontend/src/components/SiteHeader.vue
git commit -m "refactor: :recycle: ProjectsBar 与 SiteHeader 共用 useProjects，修复静默失败"
```

---

## Task 15: 迁移 RecruitmentView、zyzView

这两个页面无数据请求，只做样式层面的对齐。

**Files:**
- Modify: `frontend/src/views/RecruitmentView.vue`
- Modify: `frontend/src/views/zyzView.vue`

- [ ] **Step 1: 硬编码颜色改 token**

在两个文件的 `<style scoped>` 中查找字面量颜色：

Run: `cd frontend && grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(" src/views/RecruitmentView.vue src/views/zyzView.vue`

逐个替换为对应的 `var(--color-*)`。对照表（取最接近的 token，允许微差）：

| 字面量 | 替换为 |
|---|---|
| `#ccc` / `#cccccc` | `var(--color-text)` |
| `#efefef` | `var(--color-weak-text)` |
| `#fff` / `#ffffff` | `var(--color-heading)` |
| `#b0b0b0` 附近的灰 | `var(--color-text-muted)` |
| `rgba(0,0,0,0.2)` 类的凹陷底 | `var(--color-surface-sunken)` |
| `#9ac0ff` | `var(--color-hover-border)` |
| `#b09dff` | `var(--color-hover-border-accent)` |

未在表中的颜色保留原样，并在 commit message 中列出，供后续判断是否需要新增 token。

- [ ] **Step 2: 目视对照 + 提交**

```bash
git add frontend/src/views/RecruitmentView.vue frontend/src/views/zyzView.vue
git commit -m "refactor: :art: RecruitmentView 与 zyzView 颜色改用 token"
```

---

## Task 16: 迁移 csd20 与 csd20music

**Files:**
- Modify: `frontend/src/views/projects/csd20.vue`
- Modify: `frontend/src/views/projects/csd20music.vue`

- [ ] **Step 1: csd20 的制品请求走资源层**

现状是按标题字符串硬匹配。**按 spec 第 5 节，本轮保持硬匹配不变**，只把请求收进资源层。在 `useProducts.js` 中追加一个明确标注为临时方案的导出：

```js
/**
 * 临时方案：csd20 页面按标题硬匹配制品。
 * 后台改一个字这里就会空。正确做法是给该制品一个稳定的 slug 或标识字段，
 * 需要改 Strapi Content-Type 与生产库既有内容，本轮不做。
 * 见 docs/superpowers/specs/2026-07-31-frontend-upgrade-design.md 第 5 节。
 */
export function useProductByTitle(title) {
  return useStrapiOne('products', () => ({
    filters: { title: { $eq: toValue(title) } },
    populate: 'coverImage',
  }))
}
```

`csd20.vue` 中改为：

```js
import { useProductByTitle } from '@/composables/useProducts'
const { data: csd20Product } = useProductByTitle('梦违科学世纪20周年合同志')
```

删除原来的静默 catch。

- [ ] **Step 2: 两个文件的硬编码颜色改 token**，对照表同 Task 15。

- [ ] **Step 3: 目视对照 + 提交**

访问 `/project/csd20` 与 `/project/csd20/music`，确认制品卡片与音乐播放正常。

```bash
git add frontend/src/views/projects/csd20.vue frontend/src/views/projects/csd20music.vue frontend/src/composables/useProducts.js
git commit -m "refactor: :recycle: csd20 系列页面接入数据层"
```

---

## Task 17: 确认 apiClient 已无直接调用

**Files:**
- Modify: 视检查结果而定

- [ ] **Step 1: 全项目检查**

Run: `cd frontend && grep -rn "apiClient" src/ --include=*.vue`
Expected: 无输出。所有 `apiClient` 引用应只存在于 `src/composables/` 下。

Run: `cd frontend && grep -rn "populate" src/ --include=*.vue`
Expected: 无输出。页面不应再出现 `populate`。

Run: `cd frontend && grep -rn "response.data" src/ --include=*.vue`
Expected: 无输出。v4/v5 兼容分支应已全部消失。

- [ ] **Step 2: 有残留则补迁**

任何输出都说明有页面绕开了数据层。逐个迁到对应的资源封装；若缺少合适的封装，在 `src/composables/` 中补一个并补测试，不要在页面里直接用 `apiClient`。

- [ ] **Step 3: 全量测试 + 构建**

Run: `cd frontend && npm run test && npm run build`
Expected: 全部通过。

- [ ] **Step 4: 提交（若有改动）**

```bash
git add -A frontend/src
git commit -m "refactor: :recycle: 清理残留的 apiClient 直接调用"
```

---

## Task 18: 删除 `.status-box` 全局类

所有页面迁移完毕，`.status-box` 的使用点已全部收进 `AsyncBoundary`。

**Files:**
- Modify: `frontend/src/assets/main.css`
- Modify: `frontend/src/components/AsyncBoundary.vue`

- [ ] **Step 1: 确认使用点只剩组件内部**

Run: `cd frontend && grep -rn "status-box" src/`
Expected: 只有 `main.css` 的定义与 `AsyncBoundary.vue` 的使用。若还有页面在用，回到对应 Task 补完迁移。

- [ ] **Step 2: 把样式搬进组件**

把 `main.css` 中 `.status-box` 与 `.status-box.error` 两条规则（约 211–228 行）整体剪切到 `AsyncBoundary.vue` 的 `<style scoped>` 中，并把其中的字面量颜色改为 token：

```css
.status-box {
  text-align: center;
  margin: 4rem 0;
  padding: 2rem;
  font-size: 1.2rem;
  color: var(--color-heading);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: 0 0 12px var(--color-box-glow);
  border-radius: 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.status-box.error {
  color: var(--color-error-strong);
  border-color: var(--color-error);
  box-shadow: 0 0 20px var(--color-accent-glow);
}
```

- [ ] **Step 3: 目视对照 + 提交**

确认加载态与错误态外观不变。

```bash
git add frontend/src/assets/main.css frontend/src/components/AsyncBoundary.vue
git commit -m "refactor: :art: status-box 样式迁入 AsyncBoundary"
```

---

# 阶段 4：断点翻转

## Task 19: 手写媒体查询改用 UnoCSS 断点

**这是整轮改造最容易埋 bug 的一步**：现状是 `max-width` 桌面优先，UnoCSS 是 `min-width` 移动优先，`md:` 含义正好相反。写反了在桌面端看着完全正常，只在窄屏炸。因此本 Task 独立成步，且验收强制要求缩窗口。

**Files:**
- Modify: 含媒体查询的全部 `.vue` 文件（共 11 处媒体查询）

- [ ] **Step 1: 列出全部媒体查询**

Run: `cd frontend && grep -rn "@media" src/ --include=*.vue --include=*.css`

现有分布：`768px`×6、`640px`×3、`992px`×1、`980px`×1、`(hover: hover)`×1。

`992px` 与 `980px` 是同一意图的两次手写，一并归到 `lg`（1024px），接受微差。`(hover: hover) and (pointer: fine)` 保留不动——它不是尺寸断点。

- [ ] **Step 2: 逐个翻转**

翻转规则（以 `HomeView.vue` 为例）：

```css
/* 改前：桌面是默认，窄屏覆盖 */
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
}
@media (max-width: 992px) {
  .main-layout { grid-template-columns: 1fr; }
}
```

```vue
<!-- 改后：窄屏是默认，宽屏用 lg: 覆盖 -->
<div class="main-layout grid gap-5 mt-5 grid-cols-1 lg:grid-cols-[280px_1fr]">
```

对应的 scoped CSS 规则删除。**逐个文件改，改一个立刻验一个**，不要批量改完再验。

映射表：

| 原断点 | Uno 前缀 | 含义翻转 |
|---|---|---|
| `@media (max-width: 640px)` | 默认样式 + `sm:` 覆盖 | 640px 以下的样式变成默认值 |
| `@media (max-width: 768px)` | 默认样式 + `md:` 覆盖 | 768px 以下的样式变成默认值 |
| `@media (max-width: 980px)` / `(max-width: 992px)` | 默认样式 + `lg:` 覆盖 | 归并到 1024px |

- [ ] **Step 3: 每改一个文件立即窄屏验证**

Run: `cd frontend && npm run dev`

在 DevTools 中依次切到 375px（手机）、768px（平板）、1440px（桌面）三个宽度，确认该页面布局与改前一致。特别注意首页的 `.events-conventions-grid` 与 `.main-layout` 两处双栏布局在窄屏应堆叠为单栏。

- [ ] **Step 4: 九个页面全量窄屏走查**

全部文件改完后，在 375px 宽度下依次访问：`/`、`/events`、`/events/<某个真实 slug>`、`/products`、`/products/<某个真实 slug>`、`/recruitment`、`/project/zhu-yuanzhang`、`/project/csd20`、`/project/csd20/music`。

Expected: 无横向滚动条，无内容溢出，无文字重叠。

- [ ] **Step 5: 提交**

```bash
git add -A frontend/src
git commit -m "refactor: :art: 手写媒体查询改用 UnoCSS 移动优先断点"
```

---

# 阶段 5：清理

## Task 20: 死代码、字体与文档收尾

**Files:**
- Modify: `frontend/src/assets/base.css`
- Modify: `frontend/src/assets/main.css`
- Modify: `frontend/index.html`
- Modify: `frontend/src/views/ProductList.vue`
- Modify: `UPGRADE_TODO.md`

- [ ] **Step 1: 删除死类 `.main-title`**

Run: `cd frontend && grep -rn "main-title" src/`
Expected: 只有 `base.css` 中的定义，0 处使用。确认后删除 `base.css` 中 `.main-title` 规则（约 160–165 行）。

若 grep 有使用点，说明状况已变，跳过本步骤并在 commit message 中说明。

- [ ] **Step 2: `.product-list-view` 移回页面**

`main.css` 中的 `.product-list-view.container` 规则仅 1 处使用却占据全局命名空间。剪切到 `ProductList.vue` 的 `<style scoped>` 中：

```css
.product-list-view.container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 2rem;
}
```

- [ ] **Step 3: 字体收拾**

`index.html` 中删除加载 Jost 与 Roboto Mono 的 `<link>`（第 10 行），改为加载真正在用的两个字体：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600&family=Roboto+Mono&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
```

同时删除 `base.css` 第 1 行的 `@import url(…)`——它现在由上面的 `<link>` 接管，少一轮阻塞渲染的往返。

Roboto Mono 重新加回来是因为 `--font-family-mono` 会用到它。

- [ ] **Step 4: 等宽字体统一到 token**

Run: `cd frontend && grep -rn "monospace\|Courier New" src/`

把找到的 4 处（`HomeView.vue` 的 `.page-header .subtitle` 与 `.contact-grid`，以及其余两处）统一改为：

```css
font-family: var(--font-family-mono);
```

`--font-family-mono` 已在 Task 5 中定义。

- [ ] **Step 5: main.css 剩余硬编码颜色改 token**

Run: `cd frontend && grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(" src/assets/main.css`

按 Task 15 的对照表替换。`.tech-box` 的 hover 辉光 `rgba(114,186,255,…)` 与 `rgba(170,126,255,…)` 保留原样——它们是多层阴影的组合值，拆成 token 反而更难读，属于 spec 2.4 节明确留给 scoped CSS 的特效范畴。但 `#9ac0ff` / `#b09dff` / `#a5b6ff` 三个描边色改为 `var(--color-hover-border)` / `var(--color-hover-border-accent)` / `var(--color-hover-corner)`。

- [ ] **Step 6: 重写 UPGRADE_TODO.md**

原文件 66 项未完成中，以下应直接删除（已由本轮改造消解）：

- 所有 `n-spin` / `n-empty` / 骨架屏相关条目 → 已由 `AsyncBoundary` 统一覆盖
- 「优化响应式布局」「优化响应式断点」→ 已由 Task 19 完成
- 「保留必要的 CSS 变量」「定义统一的颜色系统」→ 已由 Task 2–5 完成
- 「将 `.container` 转换为 UnoCSS 工具类」「将 `.tech-box` 转换为 UnoCSS shortcut」→ 已明确决定不做（保留 `main.css` 实现，见 spec 2.4）

剩余条目按「目标」而非「手段」重述。例如把「使用 `n-pagination` 实现分页」改为「制品列表超过一屏时需要分页——当前全量渲染」，把「使用 `n-breadcrumb` 添加面包屑导航」改为「详情页需要返回列表的导航路径」。

在文件顶部加一段说明，指向本轮的 spec 与 plan。

- [ ] **Step 7: 全量验证**

Run: `cd frontend && npm run test && npm run build && npm run lint`
Expected: 测试全绿、构建成功、lint 无错误。

Run: `cd frontend && npm run dev`
在 375px 与 1440px 两个宽度下把九个页面再走一遍。

- [ ] **Step 8: 提交**

```bash
git add -A frontend UPGRADE_TODO.md
git commit -m "chore: :fire: 清理死代码、收拾字体加载并重写 UPGRADE_TODO"
```

---

## 完成标准

全部 Task 完成后，下列命令应满足：

```bash
cd frontend

npm run test          # 全绿，含 4 条配置守卫
npm run build         # 成功
npm run lint          # 无错误

grep -rn "apiClient" src/ --include=*.vue          # 无输出
grep -rn "populate" src/ --include=*.vue           # 无输出
grep -rn "cssVariableMap" src/                     # 无输出
grep -rn "card-base" src/                          # 无输出
grep -c "@media" src/**/*.vue                      # 仅剩 (hover: hover) 一处
```

配置守卫测试覆盖的四条不变量，是这轮改造真正留下的东西：

1. CSS 变量派生结果覆盖 `colorTokens` 全部键
2. `themeOverrides` 中不出现字面量颜色
3. `uno.config.js` 的 colors 与 `colorTokens` 同源
4. `base.css` 的生成块与 `colorTokens` 同步

有了它们，「三套调色板各自漂移」这件事无法复发。
