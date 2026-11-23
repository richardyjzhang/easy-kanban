// 格子内任务排序规则（R7）：已完成置底、开始日升序、日期不全排后、同序按创建时间。

import type { Task } from '../types'

/** 比较两个任务的展示顺序。 */
function compareTasks(a: Task, b: Task): number {
  const aDone = a.status === 'done' ? 1 : 0
  const bDone = b.status === 'done' ? 1 : 0
  if (aDone !== bDone) return aDone - bDone

  const aStart = a.start_date ?? '9999-12-31'
  const bStart = b.start_date ?? '9999-12-31'
  if (aStart !== bStart) return aStart < bStart ? -1 : 1

  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1
  return a.id - b.id
}

/** 返回排序后的新数组，不改动入参。 */
export function sortTasksForCell(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasks)
}
