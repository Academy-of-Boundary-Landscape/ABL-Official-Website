export const colorTokens = {
  background: '#000000',
  box: '#050505',
  boxStrong: '#0a0a0a',

  text: '#e0e0e0',
  heading: '#ffffff',
  textMuted: '#b0b0b0',
  textSubtle: '#808080',
  textDisabled: '#606060',

  accent: '#00a8ff',
  accentHover: '#33b8ff',
  accentStrong: '#0077cc',
  accentRgb: '0, 168, 255',

  border: '#ffffff',
  borderHover: '#ffffff',
  borderSoft: '#1b202a',
  borderGlow: 'rgba(255, 255, 255, 0.6)',
  accentGlow: 'rgba(0, 168, 255, 0.5)',
  boxGlow: 'rgba(255, 255, 255, 0.08)',

  inputPlaceholder: '#7c8593',
  menuArrow: '#bcc4d0',
  weakText: '#eef2f8',
  weakTextDisabled: '#626a76',
}

export const cssVariableMap = {
  '--color-background': 'background',
  '--color-text': 'text',
  '--color-heading': 'heading',
  '--color-accent': 'accent',
  '--color-accent-strong': 'accentStrong',
  '--color-accent-rgb': 'accentRgb',
  '--color-accent-glow': 'accentGlow',
  '--color-border': 'border',
  '--color-border-hover': 'borderHover',
  '--color-border-glow': 'borderGlow',
  '--color-box': 'box',
  '--color-box-strong': 'boxStrong',
  '--color-box-glow': 'boxGlow',
}

export const applyColorTokensToCssVars = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  Object.entries(cssVariableMap).forEach(([cssVar, tokenKey]) => {
    root.style.setProperty(cssVar, colorTokens[tokenKey])
  })
}
