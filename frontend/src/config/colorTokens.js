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
