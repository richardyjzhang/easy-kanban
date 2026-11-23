// 任务对象与接口入参之间的转换：全量 PUT 需要把七个可编辑字段都带上。

import type { Task, TaskInput } from '../types'

/** 把任务对象转成接口需要的全量输入，忽略 id 与时间戳。 */
export function toTaskInput(task: Task): TaskInput {
  return {
    title: task.title,
    person_id: task.person_id,
    project_id: task.project_id,
    start_date: task.start_date,
    end_date: task.end_date,
    status: task.status,
    note: task.note,
  }
}
