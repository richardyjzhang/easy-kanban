// 终端判断：入口路由按 UA 分流到 PC 与 H5 两套布局。

const MOBILE_PATTERN = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|Windows Phone/i

/** 当前是否应当使用 H5 布局。iPadOS 的 UA 与桌面 Safari 相同，用触点数补一刀。 */
export function isMobileView(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (MOBILE_PATTERN.test(ua)) return true
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}

/** 登录成功后与入口页的默认落点。 */
export function defaultRoute(): string {
  return isMobileView() ? '/m' : '/pc'
}
