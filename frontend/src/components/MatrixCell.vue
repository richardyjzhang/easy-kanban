<!-- 矩阵单格：最多展示 3 条任务，超出显示「+N」；空白处点击打开格子抽屉。 -->
<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { computed } from 'vue'

import TaskChip from './TaskChip.vue'
import type { Task } from '../types'

const props = withDefaults(
  defineProps<{
    tasks: Task[]
    max?: number
    emptyRow?: boolean
    emptyCol?: boolean
    selected?: boolean
  }>(),
  { max: 3, emptyRow: false, emptyCol: false, selected: false },
)

const emit = defineEmits<{
  open: []
  create: []
  edit: [task: Task]
}>()

const visibleTasks = computed(() => props.tasks.slice(0, props.max))
const hiddenCount = computed(() => Math.max(0, props.tasks.length - props.max))
</script>

<template>
  <div
    class="matrix-cell"
    :class="{ 'is-empty-row': emptyRow, 'is-empty-col': emptyCol, 'is-selected': selected }"
    @click="emit('open')"
  >
    <button type="button" class="cell-add" title="在此格新建任务" @click.stop="emit('create')">
      <n-icon :component="AddOutline" :size="14" />
    </button>

    <div class="cell-stack">
      <task-chip
        v-for="task in visibleTasks"
        :key="task.id"
        :task="task"
        @open="emit('edit', $event)"
      />
      <button
        v-if="hiddenCount > 0"
        type="button"
        class="cell-more"
        :title="`还有 ${hiddenCount} 条任务`"
        @click.stop="emit('open')"
      >
        +{{ hiddenCount }}
      </button>
      <span v-if="!tasks.length" class="cell-none">—</span>
    </div>
  </div>
</template>

<style scoped>
.matrix-cell {
  position: relative;
  min-width: 0;
  padding: 6px 8px 8px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.matrix-cell:hover {
  background: #fbfcff;
}

.matrix-cell.is-empty-row,
.matrix-cell.is-empty-col {
  background: #fffdf3;
  outline: 1px dashed rgba(240, 160, 32, 0.45);
  outline-offset: -4px;
}

.matrix-cell.is-selected {
  box-shadow: inset 0 0 0 2px var(--primary);
}

.cell-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cell-none {
  display: block;
  padding: 2px 6px;
  color: var(--text-faint);
  font-size: 12px;
}

.cell-more {
  align-self: flex-start;
  margin-left: 7px;
  padding: 1px 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.cell-more:hover {
  background: var(--primary-soft);
}

.cell-add {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.15s ease,
    color 0.15s ease;
}

.matrix-cell:hover .cell-add,
.cell-add:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.cell-add:hover {
  color: var(--primary);
}
</style>
