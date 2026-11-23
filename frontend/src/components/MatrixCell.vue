<!-- 矩阵单格：最多展示 3 条任务，超出显示「+N」；空白处点击打开格子弹窗。
     hover 右上角的「+」是快速新建入口，只填标题即可落库。 -->
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
    /** 「待分配」行没有任务时压缩成窄行，但仍要能接住拖拽。 */
    compact?: boolean
    /** 任务拖拽经过时的落点高亮。 */
    dropTarget?: boolean
  }>(),
  {
    max: 3,
    emptyRow: false,
    emptyCol: false,
    selected: false,
    compact: false,
    dropTarget: false,
  },
)

const emit = defineEmits<{
  open: []
  create: []
  edit: [task: Task]
  cycle: [task: Task]
}>()

const visibleTasks = computed(() => props.tasks.slice(0, props.max))
const hiddenCount = computed(() => Math.max(0, props.tasks.length - props.max))
</script>

<template>
  <div
    class="matrix-cell"
    :class="{
      'is-empty-row': emptyRow && !compact,
      'is-empty-col': emptyCol,
      'is-selected': selected,
      'is-compact': compact,
      'is-drop-target': dropTarget,
    }"
    @click="emit('open')"
  >
    <button type="button" class="cell-add" title="快速新建任务" @click.stop="emit('create')">
      <n-icon :component="AddOutline" :size="14" />
    </button>

    <div class="cell-stack">
      <task-chip
        v-for="task in visibleTasks"
        :key="task.id"
        :task="task"
        @open="emit('edit', $event)"
        @cycle="emit('cycle', $event)"
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
      <span v-if="compact && !tasks.length" class="cell-drop-hint">拖入</span>
      <span v-else-if="!tasks.length" class="cell-none">—</span>
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
  transition:
    background-color 0.15s ease,
    transform 0.18s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.15s ease;
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

/* 「待分配」为空时压缩成窄行：内容居中，留一条「拖入」提示继续当落点。 */
.matrix-cell.is-compact {
  display: flex;
  align-items: center;
  padding: 4px 8px;
}

.matrix-cell.is-compact .cell-stack {
  width: 100%;
}

.matrix-cell.is-drop-target {
  background: var(--primary-soft);
  box-shadow: inset 0 0 0 2px var(--primary);
}

.matrix-cell.is-compact.is-drop-target {
  background: var(--primary-soft);
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

.cell-drop-hint {
  display: block;
  padding: 2px 6px;
  color: var(--text-faint);
  font-size: 11px;
  text-align: center;
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
  z-index: 1;
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

.matrix-cell.is-compact .cell-add {
  top: 2px;
  right: 2px;
}
</style>
