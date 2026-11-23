// Naive UI 主题：深蓝主色 + 统一的圆角与字体。

import type { GlobalThemeOverrides } from 'naive-ui'

/** 主色（深蓝）。 */
export const PRIMARY = '#1E3A8A'
export const PRIMARY_HOVER = '#1E40AF'
export const PRIMARY_PRESSED = '#172554'
export const PRIMARY_SUPPL = '#1D4ED8'

export const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif'

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: PRIMARY,
    primaryColorHover: PRIMARY_HOVER,
    primaryColorPressed: PRIMARY_PRESSED,
    primaryColorSuppl: PRIMARY_SUPPL,
    fontFamily: FONT_FAMILY,
    fontSize: '14px',
    borderRadius: '8px',
    bodyColor: '#f4f6fb',
  },
}
