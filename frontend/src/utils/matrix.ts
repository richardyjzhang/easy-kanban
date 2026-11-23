// 矩阵索引工具：把任务按「人员 × 项目」分组，键与转置无关。

import { sortTasksForCell } from './taskOrder'
import type { Task } from '../types'

/** 格子的统一键：始终用 personId + projectId，转置只改渲染方向。 */
export function cellKey(personId: number, projectId: number): string {
  return `${personId}:${projectId}`
}

/** 按格子分组并按 R7 排序；没有任务的格子不会出现在结果里。 */
export function groupTasksByCell(tasks: Task[]): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>()
  for (const task of tasks) {
    const key = cellKey(task.person_id, task.project_id)
    const list = grouped.get(key)
    if (list) list.push(task)
    else grouped.set(key, [task])
  }
  for (const [key, list] of grouped) grouped.set(key, sortTasksForCell(list))
  return grouped
}
