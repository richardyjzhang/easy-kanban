<!-- H5 矩阵单格：最多展示 1 条任务标题，超出显示「+N」。
     点空白处打开全屏格子弹层，任务标题进入任务编辑；H5 不提供格内新建按钮。 -->
<script setup lang="ts">
import StatusDot from './StatusDot.vue'
import type { Task } from '../types'

const props = withDefaults(
  defineProps<{
    task: Task | null
    /** 同格剩余任务数，用于显示「+N」。 */
    extra?: number
    emptyRow?: boolean
    emptyCol?: boolean
  }>(),
  { extra: 0, emptyRow: false, emptyCol: false },
)

const emit = defineEmits<{
  open: []
  edit: [task: Task]
  cycle: [task: Task]
}>()

/** 状态点点击切换；与 PC 一致，不打开任务弹窗。 */
function cycle(): void {
  if (props.task) emit('cycle', props.task)
}
</script>

<template>
  <div
    class="m-cell"
    :class="{ 'is-empty-row': emptyRow, 'is-empty-col': emptyCol }"
    @click="emit('open')"
  >
    <div v-if="task" class="m-task" @click.stop="emit('edit', task)">
      <button
        type="button"
        class="m-status"
        :title="`切换「${task.title}」的状态`"
        @click.stop="cycle"
      >
        <StatusDot :status="task.status" :size="7" />
      </button>
      <span class="m-title" :class="{ done: task.status === 'done' }">{{ task.title }}</span>
    </div>

    <button
      v-if="extra > 0"
      type="button"
      class="m-more"
      :title="`还有 ${extra} 条任务`"
      @click.stop="emit('open')"
    >
      +{{ extra }}
    </button>
    <span v-else-if="!task" class="m-none">—</span>
  </div>
</template>

<style scoped>
.m-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  padding: 6px 8px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
}

.m-cell:active {
  background: var(--surface-muted);
}

.m-cell.is-empty-row,
.m-cell.is-empty-col {
  background: #fffdf3;
  outline: 1px dashed rgba(240, 160, 32, 0.45);
  outline-offset: -4px;
}

.m-task {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.m-status {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: -3px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
}

.m-status:active {
  background: var(--primary-soft);
}

.m-title {
  overflow: hidden;
  color: var(--text);
  font-size: 12px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-title.done {
  color: var(--text-faint);
  text-decoration: line-through;
}

.m-more {
  align-self: flex-start;
  padding: 0 3px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 11px;
  line-height: 15px;
  cursor: pointer;
}

.m-none {
  color: var(--text-faint);
  font-size: 12px;
}
</style>
