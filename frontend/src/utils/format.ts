// 业务日期格式化工具。日期统一按 YYYY-MM-DD 字符串处理，不做时区换算。

/** 把 YYYY-MM-DD 显示成 MM/DD，空值显示为短横线。 */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—'
  const parts = value.split('-')
  if (parts.length !== 3) return value
  return `${parts[1]}/${parts[2]}`
}

/** 把起止日格式化成「11/20–11/26」；只有一端时给出「起」「至」提示。 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return '—'
  if (start && end) return `${formatShortDate(start)}–${formatShortDate(end)}`
  if (start) return `${formatShortDate(start)} 起`
  return `至 ${formatShortDate(end)}`
}

/** 把服务端时间戳裁剪成「YYYY-MM-DD HH:MM」用于展示。 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 16)
}

/** 返回本地时区的今天，用于判断任务是否逾期。 */
export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
