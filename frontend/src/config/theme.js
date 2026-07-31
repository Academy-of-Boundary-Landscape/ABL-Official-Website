import { darkTheme } from 'naive-ui'
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
    successColor: colors.success,
    warningColor: colors.warning,
    errorColor: colors.error,
    textColorBase: colors.text,
    textColor1: colors.heading,
    textColor2: colors.textMuted,
    textColor3: colors.textSubtle,
    textColorDisabled: colors.textDisabled,
    dividerColor: colors.divider,
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
    textColorGhostFocus: colors.weakText,
    border: `1px solid ${colors.borderSoft}`,
    borderHover: `1px solid ${colors.accent}`,
    borderPressed: `1px solid ${colors.accentStrong}`,
    borderFocus: `1px solid ${colors.accent}`,
    borderDisabled: `1px solid ${colors.borderSoft}`,
    color: colors.surface,
    colorHover: colors.surfaceRaised,
    colorPressed: colors.surfacePressed,
    colorFocus: colors.surfaceRaised,
    colorDisabled: colors.surface,
    colorGhost: overlay.transparent,
    colorGhostHover: overlay.medium,
    colorGhostPressed: overlay.strong,
    colorGhostFocus: overlay.medium,
    colorGhostDisabled: overlay.transparent,
    colorStrong: colors.accent,
    colorStrongHover: colors.accentHover,
    colorStrongPressed: colors.accentStrong,
    colorStrongFocus: colors.accentHover,
    colorStrongDisabled: colors.surface,
    textColorStrong: colors.surfaceSunken,
    textColorStrongHover: colors.surfaceSunken,
    textColorStrongPressed: colors.surfaceSunken,
    textColorStrongFocus: colors.surfaceSunken,
    textColorStrongDisabled: colors.weakTextDisabled,
    colorWeak: colors.surface,
    colorWeakHover: colors.surfaceRaised,
    colorWeakPressed: colors.surfacePressed,
    colorWeakFocus: colors.surfaceRaised,
    colorWeakDisabled: colors.surface,
    textColorWeak: colors.weakText,
    textColorWeakHover: colors.heading,
    textColorWeakPressed: colors.heading,
    textColorWeakFocus: colors.heading,
    textColorWeakDisabled: colors.weakTextDisabled,
    boxShadow: `0 2px 10px ${colors.glowCyanSoft}`,
    boxShadowHover: `0 6px 18px ${colors.glowCyan}`,
    boxShadowPressed: `0 2px 10px ${colors.glowCyanSoft}`,
    boxShadowFocus: `0 2px 10px ${colors.glowCyanSoft}`,
  },
  // 卡片组件
  Card: {
    color: colors.surface,
    colorModal: colors.surface,
    colorTarget: colors.surface,
    colorEmbeddedModal: colors.surface,
    colorEmbedded: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: '0px',
    boxShadow: shadow.card,
    boxShadowHover: shadow.cardHover,
  },
  // 菜单组件
  Menu: {
    itemColorActive: overlay.soft,
    itemTextColorActive: colors.heading,
    itemColorHover: overlay.faint,
    itemTextColorHover: colors.heading,
    arrowColor: colors.menuArrow,
    arrowColorHover: colors.accent,
    arrowColorActive: colors.accent,
    arrowColorChildActive: colors.accent,
    itemColorActiveCollapsed: colors.accent,
    itemTextColorActiveCollapsed: colors.surfaceSunken,
    borderRadius: '0px',
  },
  // 标签组件
  Tag: {
    border: `1px solid ${colors.borderSoft}`,
    color: colors.surface,
    textColor: colors.weakText,
    colorBordered: overlay.transparent,
    colorStrong: colors.accent,
    textColorStrong: colors.surfaceSunken,
    borderRadius: '0px',
  },
  // 输入框组件
  Input: {
    color: colors.surface,
    colorFocus: colors.surface,
    border: `1px solid ${colors.borderSoft}`,
    borderHover: `1px solid ${colors.accent}`,
    borderFocus: `1px solid ${colors.accent}`,
    boxShadowFocus: `0 0 0 2px ${colors.glowCyan}`,
    caretColor: colors.accent,
    placeholderColor: colors.inputPlaceholder,
    textColor: colors.weakText,
    borderRadius: '0px',
  },
  // 下拉菜单组件
  Dropdown: {
    color: colors.surface,
    optionColorHover: overlay.soft,
    optionColorActive: overlay.strong,
    dividerColor: colors.borderSoft,
    boxShadow: shadow.dropdown,
    borderRadius: '0px',
  },
  // 分页组件
  Pagination: {
    itemBorder: `1px solid ${colors.borderSoft}`,
    itemBorderHover: `1px solid ${colors.accent}`,
    itemBorderActive: `1px solid ${colors.accent}`,
    itemColor: colors.surface,
    itemColorHover: colors.surfaceRaised,
    itemColorActive: colors.accent,
    itemTextColor: colors.weakText,
    itemTextColorHover: colors.accent,
    itemTextColorActive: colors.surfaceSunken,
    buttonBorder: `1px solid ${colors.borderSoft}`,
    buttonBorderHover: `1px solid ${colors.accent}`,
    buttonColor: colors.surface,
    buttonColorHover: colors.surfaceRaised,
    borderRadius: '0px',
  },
  // 布局组件
  Layout: {
    color: colors.surfaceSunken,
    headerColor: colors.surface,
    footerColor: colors.surface,
    siderColor: colors.surface,
  },
  // 骨架屏组件
  Skeleton: {
    color: colors.surface,
    colorEnd: colors.surfaceRaised,
  },
  // 空状态组件
  // 注：全站当前无 n-empty 消费者（AsyncBoundary 已改回终端风纯文本，见
  // components/AsyncBoundary.vue），这份配置暂无实际生效场景，保留供日后
  // 若有页面重新引入 n-empty 时使用，避免误判为正在生效的配置。
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
  // 时间线组件
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
}

export default { theme, themeOverrides }
