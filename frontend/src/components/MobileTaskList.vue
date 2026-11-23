<!-- H5 任务列表：格子弹层里使用，按时间排序，点一行进入编辑。
     状态点与 PC 一样可直接切换，删除走二次确认（由父组件处理）。 -->
<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { computed } from 'vue'

import StatusDot from './StatusDot.vue'
import { NEXT_STATUS, STATUS_META } from '../constants'
import { formatDateRange, todayISO } from '../utils/format'
import { sortTasksForCell } from '../utils/taskOrder'
import type { Task } from '../types'

const props = withDefaults(
  defineProps<{
    tasks: Task[]
    busyIds?: number[]
  }>(),
  { busyIds: () => [] },
)

const emit = defineEmits<{
  edit: [task: Task]
  cycle: [task: Task]
  delete: [task: Task]
}>()

// 约定：格子内排序规则与其他视图一致（R7）。
const sortedTasks = computed(() => sortTasksForCell(props.tasks))

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
  return `当前「${STATUS_META[task.status].label}」，点击切换为「${STATUS_META[NEXT_STATUS[task.status]].label}」`
}
</script>

<template>
  <div class="m-task-list">
    <article
      v-for="task in sortedTasks"
      :key="task.id"
      class="m-task-row"
      @click="emit('edit', task)"
    >
      <button
        type="button"
        class="m-task-status"
        :class="{ busy: isBusy(task.id) }"
        :title="cycleTitle(task)"
        @click.stop="emit('cycle', task)"
      >
        <StatusDot :status="task.status" :size="8" />
        <span>{{ STATUS_META[task.status].label }}</span>
      </button>

      <div class="m-task-main">
        <p class="m-task-title" :class="{ done: task.status === 'done' }">{{ task.title }}</p>
        <p class="m-task-meta">
          <span :class="{ overdue: isOverdue(task) }">{{ formatDateRange(task.start_date, task.end_date) }}</span>
          <span v-if="task.note" class="m-task-note"> · {{ task.note }}</span>
        </p>
      </div>

      <div class="m-task-actions">
        <n-button text type="primary" size="small" title="编辑" @click.stop="emit('edit', task)">
          <template #icon>
            <n-icon :component="CreateOutline" />
          </template>
        </n-button>
        <n-button text type="error" size="small" title="删除" @click.stop="emit('delete', task)">
          <template #icon>
            <n-icon :component="TrashOutline" />
          </template>
        </n-button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.m-task-list {
  display: flex;
  flex-direction: column;
}

.m-task-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.m-task-row:last-child {
  border-bottom: 0;
}

.m-task-row:active {
  background: var(--surface-muted);
}

.m-task-status {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  margin-top: 1px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}

.m-task-status.busy {
  opacity: 0.55;
  cursor: progress;
}

.m-task-main {
  flex: 1;
  min-width: 0;
}

.m-task-title {
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-task-title.done {
  color: var(--text-faint);
  text-decoration: line-through;
}

.m-task-meta {
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-task-meta .overdue {
  color: var(--danger);
}

.m-task-note {
  color: var(--text-faint);
}

.m-task-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
}
</style>
