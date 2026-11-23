<!-- 矩阵格子里的单条任务：状态点 + 标题 + 日期区间，点击进入任务抽屉。 -->
<script setup lang="ts">
import { computed } from 'vue'

import StatusDot from './StatusDot.vue'
import { formatDateRange } from '../utils/format'
import type { Task } from '../types'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{ open: [task: Task] }>()

const done = computed(() => props.task.status === 'done')
const dateLabel = computed(() => formatDateRange(props.task.start_date, props.task.end_date))
</script>

<template>
  <button
    type="button"
    class="task-chip"
    :class="{ done }"
    :title="`${task.title} · ${dateLabel}`"
    @click.stop="emit('open', task)"
  >
    <span class="chip-row">
      <StatusDot :status="task.status" :size="7" />
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
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.task-chip:hover {
  background: var(--surface-muted);
}

.chip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.chip-title {
  overflow: hidden;
  color: var(--text);
  font-size: 12px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-date {
  padding-left: 13px;
  color: var(--text-faint);
  font-size: 11px;
  line-height: 15px;
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
