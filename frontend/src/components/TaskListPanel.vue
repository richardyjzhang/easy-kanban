<!-- 任务列表：表格展示、状态点击循环、编辑/删除入口。 -->
<script setup lang="ts">
import { NButton, NIcon, NSpace, NTable, NTag } from 'naive-ui'
import { CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { computed } from 'vue'

import StatusDot from './StatusDot.vue'
import { NEXT_STATUS, STATUS_META } from '../constants'
import { formatDateRange, todayISO } from '../utils/format'
import { sortTasksForCell } from '../utils/taskOrder'
import type { Person, Project, Task, TaskStatus } from '../types'

const props = withDefaults(
  defineProps<{
    tasks: Task[]
    people: Person[]
    projects: Project[]
    busyIds?: number[]
    /** 格子抽屉里人员、项目已由标题给出，隐藏这两列。 */
    showContext?: boolean
  }>(),
  { busyIds: () => [], showContext: true },
)

const emit = defineEmits<{
  edit: [task: Task]
  delete: [task: Task]
  cycle: [task: Task]
}>()

const personMap = computed(() => new Map(props.people.map((person) => [person.id, person])))
const projectMap = computed(() => new Map(props.projects.map((project) => [project.id, project])))

/** 状态对应的标签样式。 */
const TAG_TYPE: Record<TaskStatus, 'default' | 'info' | 'error' | 'success'> = {
  todo: 'default',
  doing: 'info',
  blocked: 'error',
  done: 'success',
}

// 约定：格子内排序规则与其他视图一致（R7）。
const sortedTasks = computed(() => sortTasksForCell(props.tasks))

/** 取人员姓名，找不到时给出兜底文案。 */
function personName(id: number): string {
  return personMap.value.get(id)?.name ?? '未知人员'
}

/** 判断该人员是否为系统「待分配」。 */
function isPending(id: number): boolean {
  return personMap.value.get(id)?.is_system ?? false
}

/** 取项目名称；已归档项目做标记。 */
function projectName(id: number): string {
  const project = projectMap.value.get(id)
  if (!project) return '未知项目'
  return project.archived_at ? `${project.name}（已归档）` : project.name
}

/** 该行是否正在提交状态切换。 */
function isBusy(id: number): boolean {
  return props.busyIds.includes(id)
}

/** 判断任务是否已逾期：有截止日、未完成、且截止日早于今天。 */
function isOverdue(task: Task): boolean {
  return task.status !== 'done' && Boolean(task.end_date) && (task.end_date as string) < todayISO()
}

/** 生成状态按钮的悬浮提示。 */
function cycleTitle(task: Task): string {
  return `切换为「${STATUS_META[NEXT_STATUS[task.status]].label}」`
}
</script>

<template>
  <n-table
    :bordered="false"
    :single-line="false"
    size="small"
    class="task-table"
    :class="{ compact: !showContext }"
  >
    <thead>
      <tr>
        <th class="col-status">状态</th>
        <th>任务</th>
        <th v-if="showContext" class="col-person">人员</th>
        <th v-if="showContext" class="col-project">项目</th>
        <th class="col-date">日期</th>
        <th class="col-actions">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="task in sortedTasks"
        :key="task.id"
        class="task-row"
        @click="emit('edit', task)"
      >
        <td>
          <n-tag
            :type="TAG_TYPE[task.status]"
            :bordered="false"
            size="small"
            class="status-tag"
            :class="{ busy: isBusy(task.id) }"
            :title="cycleTitle(task)"
            @click.stop="emit('cycle', task)"
          >
            <span class="status-inner">
              <StatusDot :status="task.status" :size="7" />
              {{ STATUS_META[task.status].label }}
            </span>
          </n-tag>
        </td>
        <td>
          <div class="task-title" :class="{ done: task.status === 'done' }">{{ task.title }}</div>
          <div v-if="task.note" class="task-note">{{ task.note }}</div>
        </td>
        <td v-if="showContext">
          <span :class="{ pending: isPending(task.person_id) }">{{ personName(task.person_id) }}</span>
        </td>
        <td v-if="showContext">{{ projectName(task.project_id) }}</td>
        <td class="col-date">
          <span :class="{ overdue: isOverdue(task) }">
            {{ formatDateRange(task.start_date, task.end_date) }}
          </span>
        </td>
        <td class="col-actions">
          <n-space justify="end" :size="8">
            <n-button text type="primary" size="small" @click.stop="emit('edit', task)">
              <template #icon>
                <n-icon :component="CreateOutline" />
              </template>
              编辑
            </n-button>
            <n-button text type="error" size="small" @click.stop="emit('delete', task)">
              <template #icon>
                <n-icon :component="TrashOutline" />
              </template>
              删除
            </n-button>
          </n-space>
        </td>
      </tr>
    </tbody>
  </n-table>
</template>

<style scoped>
.task-table {
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
}

.task-table :deep(th) {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-muted);
}

.task-table :deep(td) {
  padding-top: 11px;
  padding-bottom: 11px;
}

.task-row {
  cursor: pointer;
}

.task-row:hover :deep(td) {
  background: #fafbff;
}

.col-status {
  width: 108px;
}

.col-person {
  width: 128px;
}

.col-project {
  width: 168px;
}

.col-date {
  width: 132px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.col-actions {
  width: 150px;
  text-align: right;
}

.status-tag {
  cursor: pointer;
  user-select: none;
}

.status-tag.busy {
  cursor: progress;
  opacity: 0.6;
}

.status-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.task-title {
  font-weight: 500;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-title.done {
  color: var(--text-faint);
  text-decoration: line-through;
}

.task-note {
  margin-top: 2px;
  max-width: 460px;
  color: var(--text-faint);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending {
  color: var(--text-muted);
}

.pending::before {
  content: '⏳ ';
  font-size: 11px;
}

.overdue {
  color: var(--danger);
}

/* 格子抽屉里宽度有限，压缩固定列，把空间留给任务标题。 */
.task-table.compact :deep(th),
.task-table.compact :deep(td) {
  padding-left: 8px;
  padding-right: 8px;
}

.task-table.compact .col-status {
  width: 86px;
}

.task-table.compact .col-date {
  width: 104px;
  font-size: 12px;
}

.task-table.compact .col-actions {
  width: 124px;
}

.task-table.compact .task-note {
  max-width: 220px;
}

@media (max-width: 900px) {
  .col-project {
    width: 120px;
  }

  .task-note {
    max-width: 220px;
  }
}
</style>
