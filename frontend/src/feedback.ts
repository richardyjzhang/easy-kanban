// 全局反馈：在组件外也能用的 message / dialog（沿用同一套深蓝主题）。

import { createDiscreteApi, dateZhCN, zhCN } from 'naive-ui'

import { themeOverrides } from './theme'

export const { message, dialog } = createDiscreteApi(['message', 'dialog'], {
  configProviderProps: {
    themeOverrides,
    locale: zhCN,
    dateLocale: dateZhCN,
  },
})
