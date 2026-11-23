// 矩阵索引工具：把任务按「人员 × 项目」分组，键与转置无关。

import { sortTasksForCell } from './taskOrder'
import type { MatrixAxis } from '../types/matrix'
import type { Person, Project, Task } from '../types'

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

/** 统计每个人员在当前筛选下的任务数。 */
export function countTasksByPerson(tasks: Task[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const task of tasks) {
    counts.set(task.person_id, (counts.get(task.person_id) ?? 0) + 1)
  }
  return counts
}

/** 统计每个项目在当前筛选下的任务数。 */
export function countTasksByProject(tasks: Task[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const task of tasks) {
    counts.set(task.project_id, (counts.get(task.project_id) ?? 0) + 1)
  }
  return counts
}

/** 人员轴：系统人员「待分配」固定排在第一行，为空时压缩成窄行。 */
export function buildPersonAxes(
  people: Person[],
  counts: Map<number, number>,
  pendingTaskCount: number,
): MatrixAxis[] {
  return people.map((person) => {
    const count = person.is_system ? pendingTaskCount : (counts.get(person.id) ?? 0)
    return {
      id: person.id,
      kind: 'person',
      name: person.name,
      color: person.color,
      isSystem: person.is_system,
      // 系统人员行不参与空行标记，只按未指派总数决定是否压缩。
      empty: !person.is_system && count === 0,
      count,
      compact: person.is_system && count === 0,
    }
  })
}

/** 项目轴：每个项目一列，当前筛选下没有任务即标记为空列。 */
export function buildProjectAxes(
  projects: Project[],
  counts: Map<number, number>,
): MatrixAxis[] {
  return projects.map((project) => {
    const count = counts.get(project.id) ?? 0
    return {
      id: project.id,
      kind: 'project',
      name: project.name,
      color: project.color,
      isSystem: false,
      empty: count === 0,
      count,
      compact: false,
    }
  })
}
