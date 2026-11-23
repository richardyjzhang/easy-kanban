// 前端常量：色板、状态元数据与约定的系统人员名称。

import type { TaskStatus } from './types'

/** 约定：颜色只能来自固定色板，不能随意增删。 */
export const PALETTE = [
  '#5B8FF9',
  '#61DDAA',
  '#65789B',
  '#F6BD16',
  '#7262FD',
  '#78D3F8',
  '#9661BC',
  '#F6903D',
] as const

/** 系统内置的未指派人员名称。 */
export const PENDING_NAME = '待分配'

/** 约定：任务状态只有四态。 */
export const TASK_STATUSES: TaskStatus[] = ['todo', 'doing', 'blocked', 'done']

/** 每个状态的显示文案与色点颜色。 */
export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: '未开始', color: '#9AA4B2' },
  doing: { label: '进行中', color: '#3D6FE4' },
  blocked: { label: '阻塞', color: '#E5484D' },
  done: { label: '已完成', color: '#1F9D55' },
}

/** 约定：点击状态色点按「未开始 → 进行中 → 阻塞 → 已完成 → 未开始」循环。 */
export const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'doing',
  doing: 'blocked',
  blocked: 'done',
  done: 'todo',
}
