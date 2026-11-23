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

/** 把 Date 转成本地时区的 YYYY-MM-DD。 */
export function dateToISO(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** 把 YYYY-MM-DD 转成本地零点的时间戳。 */
export function dateToTimestamp(value: string | null): number | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day).getTime()
}

/** 把时间戳转回本地日期字符串。 */
export function timestampToDate(value: number | null): string | null {
  if (value === null) return null
  const date = new Date(value)
  return dateToISO(date)
}

/** 返回本地时区的今天，用于判断任务是否逾期。 */
export function todayISO(): string {
  return dateToISO(new Date())
}
