<!-- 矩阵格子里的单条任务：状态点 + 标题 + 日期区间。
     点标题进入任务弹窗，点状态点在四态之间循环切换（无需打开弹窗）。 -->
<script setup lang="ts">
import { computed } from 'vue'

import StatusDot from './StatusDot.vue'
import { NEXT_STATUS, STATUS_META } from '../constants'
import { formatDateRange } from '../utils/format'
import type { Task } from '../types'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{ open: [task: Task]; cycle: [task: Task] }>()

const done = computed(() => props.task.status === 'done')
const dateLabel = computed(() => formatDateRange(props.task.start_date, props.task.end_date))
const cycleTitle = computed(() => {
  const current = STATUS_META[props.task.status].label
  const next = STATUS_META[NEXT_STATUS[props.task.status]].label
  return `当前「${current}」，点击切换为「${next}」`
})
</script>

<template>
  <button
    type="button"
    class="task-chip"
    :class="{ done }"
    :title="`${task.title} · ${dateLabel}`"
    :data-task-id="task.id"
    :data-task-person-id="task.person_id"
    :data-task-project-id="task.project_id"
    @click.stop="emit('open', task)"
  >
    <span class="chip-row">
      <span
        class="chip-status"
        role="button"
        tabindex="0"
        :title="cycleTitle"
        @click.stop="emit('cycle', task)"
        @keydown.enter.stop.prevent="emit('cycle', task)"
        @keydown.space.stop.prevent="emit('cycle', task)"
      >
        <StatusDot :status="task.status" :size="7" />
      </span>
      <span class="chip-title">{{ task.title }}</span>
    </span>
    <span class="chip-date">{{ dateLabel }}</span>
  </button>
</template>

<style scoped>
.task-chip {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 3px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: grab;
  touch-action: none;
  user-select: none;
  transition: background-color 0.15s ease;
}

.task-chip:hover {
  background: var(--surface-muted);
}

.task-chip:active {
  cursor: grabbing;
}

/* 已完成任务在格子里置底并带淡绿底，和未完成的条目在扫视时能分开。 */
.task-chip.done {
  background: rgba(24, 160, 88, 0.07);
}

.task-chip.done:hover {
  background: rgba(24, 160, 88, 0.12);
}

.chip-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

/* 状态点命中区域比色点本身大一点，免得每次都要精确点到 7px。 */
.chip-status {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: -3px;
  border-radius: 4px;
  cursor: pointer;
}

.chip-status:hover {
  background: var(--primary-soft);
}

.chip-status:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.chip-title {
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-date {
  padding-left: 16px;
  color: var(--text-faint);
  font-size: 12px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.task-chip.done .chip-title {
  color: var(--text-faint);
  text-decoration: line-through;
}

.task-chip.done .chip-date {
  color: var(--text-faint);
}
</style>
