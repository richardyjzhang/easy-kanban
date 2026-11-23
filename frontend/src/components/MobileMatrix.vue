<!-- H5 矩阵网格：首列吸附、横向滚动、每格 1 条任务。
     与 PC 共用同一套轴数据，但 H5 不提供行列拖拽排序与任务拖拽改归属。 -->
<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { LockClosedOutline } from '@vicons/ionicons5'
import { computed } from 'vue'

import ColorDot from './ColorDot.vue'
import MobileCell from './MobileCell.vue'
import { cellKey } from '../utils/matrix'
import type { MatrixAxis, MatrixAxisKind, MatrixCellKey } from '../types/matrix'
import type { Task } from '../types'

const props = defineProps<{
  rows: MatrixAxis[]
  cols: MatrixAxis[]
  cells: Map<string, Task[]>
}>()

const emit = defineEmits<{
  openCell: [personId: number, projectId: number]
  editTask: [task: Task]
  cycleStatus: [task: Task]
}>()

// 尺寸与 docs/PAGES.md 一致：人员列 96px、格子 120px；「待分配」为空时压缩。
const HEAD_WIDTH = 96
const CELL_WIDTH = 120
const ROW_HEIGHT = 64
const HEADER_HEIGHT = 42
const COMPACT_HEIGHT = 40

const gridStyle = computed(() => {
  const columns = props.cols.map(() => `${CELL_WIDTH}px`)
  const rows = props.rows.map((row) =>
    row.compact ? `${COMPACT_HEIGHT}px` : `${ROW_HEIGHT}px`,
  )
  return {
    gridTemplateColumns: `${HEAD_WIDTH}px ${columns.length ? columns.join(' ') : `${CELL_WIDTH}px`}`,
    gridTemplateRows: [`${HEADER_HEIGHT}px`, ...rows].join(' '),
  }
})

const axesLabel = computed(
  () => `${axisLabel(props.rows[0]?.kind)} × ${axisLabel(props.cols[0]?.kind)}`,
)

/** 轴类型的显示文案。 */
function axisLabel(kind: MatrixAxisKind | undefined): string {
  if (kind === 'person') return '人'
  if (kind === 'project') return '项目'
  return ''
}

/** 把行列坐标还原成「人员 × 项目」，与转置方向无关。 */
function coordOf(row: MatrixAxis, col: MatrixAxis): MatrixCellKey {
  return {
    personId: row.kind === 'person' ? row.id : col.id,
    projectId: row.kind === 'project' ? row.id : col.id,
  }
}

/** 取某格的任务；cells 已按 R7 排好序。 */
function tasksAt(row: MatrixAxis, col: MatrixAxis): Task[] {
  const coord = coordOf(row, col)
  return props.cells.get(cellKey(coord.personId, coord.projectId)) ?? []
}

/** 打开格子弹层。 */
function openCell(row: MatrixAxis, col: MatrixAxis): void {
  const coord = coordOf(row, col)
  emit('openCell', coord.personId, coord.projectId)
}

/** 编辑某条任务。 */
function editTask(task: Task): void {
  emit('editTask', task)
}

/** 点击状态点循环切换状态。 */
function cycleTask(task: Task): void {
  emit('cycleStatus', task)
}
</script>

<template>
  <div class="m-matrix-scroll">
    <div class="m-matrix" :style="gridStyle">
      <div class="m-corner">{{ axesLabel }}</div>

      <div
        v-for="col in cols"
        :key="`col-${col.id}`"
        class="m-col-head"
        :class="{ 'is-system': col.isSystem }"
      >
        <ColorDot :color="col.color" :size="7" />
        <span class="m-head-name">{{ col.name }}</span>
        <n-icon v-if="col.isSystem" :component="LockClosedOutline" :size="12" class="m-head-lock" />
        <span v-if="col.isSystem" class="m-pending-count" :title="`${col.count} 条未指派任务`">
          {{ col.count }}
        </span>
        <span v-else-if="col.empty" class="m-empty-dot" title="该列在当前筛选下没有任务"></span>
      </div>

      <template v-for="row in rows" :key="`row-${row.id}`">
        <div
          class="m-row-head"
          :class="{ 'is-system': row.isSystem, 'is-compact': row.compact }"
        >
          <ColorDot :color="row.color" :size="7" />
          <span class="m-head-name">{{ row.name }}</span>
          <n-icon v-if="row.isSystem" :component="LockClosedOutline" :size="12" class="m-head-lock" />
          <span v-if="row.isSystem" class="m-pending-count" :title="`${row.count} 条未指派任务`">
            {{ row.count }}
          </span>
          <span v-else-if="row.empty" class="m-empty-dot" title="该行在当前筛选下没有任务"></span>
        </div>

        <mobile-cell
          v-for="col in cols"
          :key="`cell-${row.id}-${col.id}`"
          :task="tasksAt(row, col)[0] ?? null"
          :extra="Math.max(0, tasksAt(row, col).length - 1)"
          :empty-row="row.empty"
          :empty-col="col.empty"
          @open="openCell(row, col)"
          @edit="editTask"
          @cycle="cycleTask"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.m-matrix-scroll {
  height: calc(100dvh - 132px);
  min-height: 260px;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}

.m-matrix {
  display: grid;
  width: max-content;
  min-width: 100%;
}

.m-corner {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.m-col-head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 0 8px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-muted);
  font-size: 12px;
  font-weight: 600;
}

.m-row-head {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 6px 7px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  font-size: 12px;
  font-weight: 600;
}

.m-row-head.is-system,
.m-col-head.is-system {
  color: var(--text-muted);
}

.m-row-head.is-compact {
  padding-top: 2px;
  padding-bottom: 2px;
}

.m-head-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-head-lock {
  flex: none;
  color: var(--text-faint);
}

/* 「待分配」行头的未指派数量；窄屏只留数字，免得挤掉姓名。 */
.m-pending-count {
  flex: none;
  margin-left: auto;
  padding: 0 3px;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.14);
  color: var(--text-muted);
  font-size: 10px;
  line-height: 15px;
  font-variant-numeric: tabular-nums;
}

/* 空行／空列在窄屏上不再塞文字，只留一个暖色小点。 */
.m-empty-dot {
  flex: none;
  width: 5px;
  height: 5px;
  margin-left: auto;
  border-radius: 50%;
  background: #f0a020;
}
</style>
