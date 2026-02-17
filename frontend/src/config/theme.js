import { darkTheme } from 'naive-ui'
import { colorTokens as colors } from './colorTokens'

/**
 * Naive UI 主题配置
 * 与项目现有 CSS 变量保持一致
 */
export const theme = darkTheme

/**
 * Naive UI 主题覆盖配置
 * 黑底 + 白框 + 亮蓝点缀
 */
export const themeOverrides = {
  common: {
    primaryColor: colors.accent,
    primaryColorHover: colors.accentHover,
    primaryColorPressed: colors.accentStrong,
    primaryColorSuppl: colors.accent,
    infoColor: colors.accent,
    infoColorHover: colors.accentHover,
    infoColorPressed: colors.accentStrong,
    successColor: '#28C445',
    warningColor: '#F0A020',
    errorColor: '#E88080',
    textColorBase: colors.text,
    textColor1: colors.heading,
    textColor2: colors.textMuted,
    textColor3: colors.textSubtle,
    textColorDisabled: colors.textDisabled,
    dividerColor: '#1a1a1a',
    borderColor: colors.border,
    cardColor: colors.box,
    modalColor: colors.box,
    bodyColor: colors.background,
    tableHeaderColor: colors.box,
    tableHeaderTextColor: colors.heading,
    borderRadius: '0px',
    fontSize: '16px',
    lineHeight: '1.5',
    fontFamily:
      '"Space Grotesk", "Hiragino Sans GB", "WenQuanYi Micro Hei", "Microsoft YaHei", sans-serif',
  },
  // 按钮组件
  Button: {
    textColor: colors.heading,
    textColorText: colors.heading,
    textColorGhost: colors.text,
    textColorGhostPressed: colors.weakText,
    textColorGhostFocus: '#dfe5ee',
    border: `1px solid ${colors.borderSoft}`,
    borderHover: `1px solid ${colors.accent}`,
    borderPressed: `1px solid ${colors.accentStrong}`,
    borderFocus: `1px solid ${colors.accent}`,
    borderDisabled: `1px solid ${colors.borderSoft}`,
    color: '#0a0f1a',
    colorHover: '#0d1220',
    colorPressed: '#141c2a',
    colorFocus: '#0d1220',
    colorDisabled: '#0a0f1a',
    colorGhost: 'rgba(0, 0, 0, 0)',
    colorGhostHover: 'rgba(255, 255, 255, 0.08)',
    colorGhostPressed: 'rgba(255, 255, 255, 0.12)',
    colorGhostFocus: 'rgba(255, 255, 255, 0.08)',
    colorGhostDisabled: 'rgba(0, 0, 0, 0)',
    colorStrong: colors.accent,
    colorStrongHover: colors.accentHover,
    colorStrongPressed: colors.accentStrong,
    colorStrongFocus: colors.accentHover,
    colorStrongDisabled: '#0a0f1a',
    textColorStrong: '#050810',
    textColorStrongHover: '#050810',
    textColorStrongPressed: '#050810',
    textColorStrongFocus: '#050810',
    textColorStrongDisabled: '#626a76',
    colorWeak: '#0a0f1a',
    colorWeakHover: '#0d1220',
    colorWeakPressed: '#141c2a',
    colorWeakFocus: '#0d1220',
    colorWeakDisabled: '#0a0f1a',
    textColorWeak: colors.weakText,
    textColorWeakHover: colors.heading,
    textColorWeakPressed: colors.heading,
    textColorWeakFocus: colors.heading,
    textColorWeakDisabled: colors.weakTextDisabled,
    boxShadow: '0 2px 10px rgba(89, 216, 255, 0.12)',
    boxShadowHover: '0 6px 18px rgba(89, 216, 255, 0.18)',
    boxShadowPressed: '0 2px 10px rgba(89, 216, 255, 0.12)',
    boxShadowFocus: '0 2px 10px rgba(89, 216, 255, 0.12)',
  },
  // 卡片组件
  Card: {
    color: '#0a0f1a',
    colorModal: '#0a0f1a',
    colorTarget: '#0a0f1a',
    colorEmbeddedModal: '#0a0f1a',
    colorEmbedded: '#0a0f1a',
    borderColor: colors.borderSoft,
    borderRadius: '0px',
    boxShadow: '0 2px 14px rgba(5, 8, 16, 0.7)',
    boxShadowHover: '0 6px 20px rgba(5, 8, 16, 0.85)',
  },
  // 菜单组件
  Menu: {
    itemColorActive: 'rgba(255, 255, 255, 0.06)',
    itemTextColorActive: colors.heading,
    itemColorHover: 'rgba(255, 255, 255, 0.04)',
    itemTextColorHover: colors.heading,
    arrowColor: colors.menuArrow,
    arrowColorHover: colors.accent,
    arrowColorActive: colors.accent,
    arrowColorChildActive: colors.accent,
    itemColorActiveCollapsed: colors.accent,
    itemTextColorActiveCollapsed: '#050810',
    borderRadius: '0px',
  },
  // 标签组件
  Tag: {
    border: `1px solid ${colors.borderSoft}`,
    color: '#0a0f1a',
    textColor: colors.weakText,
    colorBordered: 'rgba(0, 0, 0, 0)',
    colorStrong: colors.accent,
    textColorStrong: '#050810',
    borderRadius: '0px',
  },
  // 输入框组件
  Input: {
    color: '#0a0f1a',
    colorFocus: '#0a0f1a',
    border: `1px solid ${colors.borderSoft}`,
    borderHover: `1px solid ${colors.accent}`,
    borderFocus: `1px solid ${colors.accent}`,
    boxShadowFocus: '0 0 0 2px rgba(89, 216, 255, 0.18)',
    caretColor: colors.accent,
    placeholderColor: colors.inputPlaceholder,
    textColor: colors.weakText,
    borderRadius: '0px',
  },
  // 下拉菜单组件
  Dropdown: {
    color: '#0a0f1a',
    optionColorHover: 'rgba(255, 255, 255, 0.06)',
    optionColorActive: 'rgba(255, 255, 255, 0.1)',
    dividerColor: colors.borderSoft,
    boxShadow: '0 6px 20px rgba(5, 8, 16, 0.85)',
    borderRadius: '0px',
  },
  // 分页组件
  Pagination: {
    itemBorder: `1px solid ${colors.borderSoft}`,
    itemBorderHover: `1px solid ${colors.accent}`,
    itemBorderActive: `1px solid ${colors.accent}`,
    itemColor: '#0a0f1a',
    itemColorHover: '#0d1220',
    itemColorActive: colors.accent,
    itemTextColor: colors.weakText,
    itemTextColorHover: colors.accent,
    itemTextColorActive: '#050810',
    buttonBorder: `1px solid ${colors.borderSoft}`,
    buttonBorderHover: `1px solid ${colors.accent}`,
    buttonColor: '#0a0f1a',
    buttonColorHover: '#0d1220',
    borderRadius: '0px',
  },
  // 布局组件
  Layout: {
    color: '#050810',
    headerColor: '#0a0f1a',
    footerColor: '#0a0f1a',
    siderColor: '#0a0f1a',
  },
  // 骨架屏组件
  Skeleton: {
    color: '#080d18',
    colorEnd: '#0d1220',
  },
  // 空状态组件
  Empty: {
    iconColor: colors.inputPlaceholder,
    textColor: colors.menuArrow,
    extraTextColor: colors.inputPlaceholder,
  },
  // 加载组件
  Spin: {
    color: colors.accent,
    textColor: colors.weakText,
  },
}

export default { theme, themeOverrides }
