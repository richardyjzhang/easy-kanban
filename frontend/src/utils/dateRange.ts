// 日期范围筛选工具：预设周范围、自定义范围与「区间有交集」判断。

import { dateToISO, formatShortDate, timestampToDate } from './format'
import type { Task } from '../types'

export type FilterPreset = 'this-week' | 'next-week' | 'all' | 'custom'

export interface DateRange {
  start: string
  end: string
}

/** 矩阵顶部的筛选状态，纯前端状态，不写库。 */
export interface FilterState {
  preset: FilterPreset
  custom: DateRange | null
}

/** 筛选项：本周、下周、全部、自定义。 */
export const FILTER_PRESETS: { value: FilterPreset; label: string }[] = [
  { value: 'this-week', label: '本周' },
  { value: 'next-week', label: '下周' },
  { value: 'all', label: '全部' },
  { value: 'custom', label: '自定义' },
]

/** 一周从周一开始；offsetWeeks 为 0 表示本周，1 表示下周。 */
export function weekRange(offsetWeeks = 0): DateRange {
  const today = new Date()
  const weekday = (today.getDay() + 6) % 7
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - weekday + offsetWeeks * 7,
  )
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  return { start: dateToISO(monday), end: dateToISO(sunday) }
}

/** 把筛选状态解析成实际生效的区间；返回 null 表示不筛选。 */
export function resolveRange(preset: FilterPreset, custom: DateRange | null): DateRange | null {
  if (preset === 'this-week') return weekRange(0)
  if (preset === 'next-week') return weekRange(1)
  if (preset === 'custom') return custom
  return null
}

/** 约定：日期不全的任务没有可归属的周次，任何筛选下都显示；日期齐全时按区间有交集判断。 */
export function taskInRange(
  task: Pick<Task, 'start_date' | 'end_date'>,
  range: DateRange | null,
): boolean {
  if (!range) return true
  if (!task.start_date || !task.end_date) return true
  return task.start_date <= range.end && task.end_date >= range.start
}

/** 区间显示文案：「11/17–11/23」，不筛选时显示「全部」。 */
export function formatRangeLabel(range: DateRange | null): string {
  if (!range) return '全部'
  return `${formatShortDate(range.start)}–${formatShortDate(range.end)}`
}

/** 把日期选择器的 [起, 止] 时间戳转成区间。 */
export function timestampsToRange(value: [number, number] | null): DateRange | null {
  if (!value) return null
  const start = timestampToDate(value[0])
  const end = timestampToDate(value[1])
  if (!start || !end) return null
  return { start, end }
}
