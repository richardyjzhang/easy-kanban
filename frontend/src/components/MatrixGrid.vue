<!-- 矩阵网格：行列渲染、表头吸附、空行／空列标记、行列拖拽排序。
     行与列统一用 MatrixAxis 表示，转置只交换两者，不改任何数据。 -->
<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { LockClosedOutline } from '@vicons/ionicons5'
import { computed, ref } from 'vue'

import ColorDot from './ColorDot.vue'
import MatrixCell from './MatrixCell.vue'
import { cellKey } from '../utils/matrix'
import type { MatrixAxis, MatrixAxisKind, MatrixCellKey } from '../types/matrix'
import type { Task } from '../types'

const props = withDefaults(
  defineProps<{
    rows: MatrixAxis[]
    cols: MatrixAxis[]
    cells: Map<string, Task[]>
    selected?: MatrixCellKey | null
  }>(),
  { selected: null },
)

const emit = defineEmits<{
  openCell: [personId: number, projectId: number]
  createTask: [personId: number, projectId: number]
  editTask: [task: Task]
  reorder: [kind: MatrixAxisKind, ids: number[]]
}>()

// 尺寸与 docs/PAGES.md 一致：人员列 180px、格子 170px。
const ROW_HEAD_WIDTH = 180
const CELL_WIDTH = 170

const scrollEl = ref<HTMLElement | null>(null)

const gridStyle = computed(() => ({
  gridTemplateColumns: `${ROW_HEAD_WIDTH}px repeat(${Math.max(props.cols.length, 1)}, ${CELL_WIDTH}px)`,
}))

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

/** 该格是否为当前打开的格子。 */
function cellIsSelected(row: MatrixAxis, col: MatrixAxis): boolean {
  if (!props.selected) return false
  const coord = coordOf(row, col)
  return (
    props.selected.personId === coord.personId && props.selected.projectId === coord.projectId
  )
}

/** 打开格子抽屉。 */
function openCell(row: MatrixAxis, col: MatrixAxis): void {
  const coord = coordOf(row, col)
  emit('openCell', coord.personId, coord.projectId)
}

/** 在格子里新建任务。 */
function createInCell(row: MatrixAxis, col: MatrixAxis): void {
  const coord = coordOf(row, col)
  emit('createTask', coord.personId, coord.projectId)
}

/** 编辑某条任务。 */
function editTask(task: Task): void {
  emit('editTask', task)
}

// 拖拽排序：只允许拖动表头，系统人员「待分配」固定在第一位。
const dragRow = ref<MatrixAxis | null>(null)
const dragCol = ref<MatrixAxis | null>(null)
const dropRowId = ref<number | null>(null)
const dropRowAfter = ref(false)
const dropColId = ref<number | null>(null)
const dropColAfter = ref(false)

/** 结束拖拽，清空全部拖拽态。 */
function resetDrag(): void {
  dragRow.value = null
  dragCol.value = null
  dropRowId.value = null
  dropRowAfter.value = false
  dropColId.value = null
  dropColAfter.value = false
}

/** 记录被拖动的行头。 */
function startRowDrag(event: DragEvent, row: MatrixAxis): void {
  if (row.isSystem) {
    event.preventDefault()
    return
  }
  dragRow.value = row
  dragCol.value = null
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(row.id))
  }
}

/** 记录被拖动的列头。 */
function startColDrag(event: DragEvent, col: MatrixAxis): void {
  if (col.isSystem) {
    event.preventDefault()
    return
  }
  dragCol.value = col
  dragRow.value = null
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(col.id))
  }
}

/** 行头上方经过：按指针在行的上半／下半决定插到前面还是后面。 */
function overRow(event: DragEvent, row: MatrixAxis): void {
  if (!dragRow.value || row.isSystem || dragRow.value.id === row.id) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropRowId.value = row.id
  dropRowAfter.value = event.clientY > rect.top + rect.height / 2
}

/** 列头上方经过：按指针在列的前半／后半决定插到前面还是后面。 */
function overCol(event: DragEvent, col: MatrixAxis): void {
  if (!dragCol.value || col.isSystem || dragCol.value.id === col.id) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropColId.value = col.id
  dropColAfter.value = event.clientX > rect.left + rect.width / 2
}

/** 落到行头：把整行移动到目标行之前或之后。 */
function dropOnRow(row: MatrixAxis): void {
  const source = dragRow.value
  const kind = source?.kind
  const after = dropRowAfter.value
  resetDrag()
  if (!source || !kind || source.id === row.id || row.isSystem) return

  const ids = props.rows.filter((item) => !item.isSystem).map((item) => item.id)
  if (!moveTo(ids, source.id, row.id, after)) return
  emit('reorder', kind, ids)
}

/** 落到列头：把整列移动到目标列之前或之后。 */
function dropOnCol(col: MatrixAxis): void {
  const source = dragCol.value
  const kind = source?.kind
  const after = dropColAfter.value
  resetDrag()
  if (!source || !kind || source.id === col.id || col.isSystem) return

  const ids = props.cols.filter((item) => !item.isSystem).map((item) => item.id)
  if (!moveTo(ids, source.id, col.id, after)) return
  emit('reorder', kind, ids)
}

/** 把 sourceId 移动到 targetId 之前／之后；顺序没变时返回 false。 */
function moveTo(ids: number[], sourceId: number, targetId: number, after: boolean): boolean {
  const before = ids.join(',')
  const from = ids.indexOf(sourceId)
  if (from < 0 || ids.indexOf(targetId) < 0) return false

  ids.splice(from, 1)
  const target = ids.indexOf(targetId)
  ids.splice(after ? target + 1 : target, 0, sourceId)
  return ids.join(',') !== before
}

/** 读取当前滚动位置，转置后按交换后的方向恢复。 */
function readScroll(): { top: number; left: number } {
  return { top: scrollEl.value?.scrollTop ?? 0, left: scrollEl.value?.scrollLeft ?? 0 }
}

/** 恢复滚动位置。 */
function applyScroll(position: { top: number; left: number }): void {
  const el = scrollEl.value
  if (!el) return
  el.scrollTop = position.top
  el.scrollLeft = position.left
}

defineExpose({ readScroll, applyScroll })
</script>

<template>
  <div ref="scrollEl" class="matrix-scroll">
    <div class="matrix" :style="gridStyle" @dragend="resetDrag">
      <div class="corner">
        <span class="corner-label">{{ axesLabel }}</span>
      </div>

      <div
        v-for="col in cols"
        :key="`col-${col.id}`"
        class="col-head"
        :class="{
          'is-system': col.isSystem,
          'is-dragging': dragCol?.id === col.id,
          'drop-before': dropColId === col.id && !dropColAfter,
          'drop-after': dropColId === col.id && dropColAfter,
        }"
        :draggable="!col.isSystem"
        :title="col.isSystem ? '系统人员固定在第一列' : '拖动可调整列顺序'"
        @dragstart="startColDrag($event, col)"
        @dragover="overCol($event, col)"
        @drop="dropOnCol(col)"
      >
        <ColorDot :color="col.color" :size="8" />
        <span class="head-name">{{ col.name }}</span>
        <n-icon v-if="col.isSystem" :component="LockClosedOutline" class="head-lock" />
        <span v-if="col.empty" class="empty-tag">无任务</span>
      </div>

      <template v-for="row in rows" :key="`row-${row.id}`">
        <div
          class="row-head"
          :class="{
            'is-system': row.isSystem,
            'is-dragging': dragRow?.id === row.id,
            'drop-before': dropRowId === row.id && !dropRowAfter,
            'drop-after': dropRowId === row.id && dropRowAfter,
          }"
          :draggable="!row.isSystem"
          :title="row.isSystem ? '系统人员固定在第一行' : '拖动可调整行顺序'"
          @dragstart="startRowDrag($event, row)"
          @dragover="overRow($event, row)"
          @drop="dropOnRow(row)"
        >
          <ColorDot :color="row.color" :size="8" />
          <span class="head-name">{{ row.name }}</span>
          <n-icon v-if="row.isSystem" :component="LockClosedOutline" class="head-lock" />
          <span v-if="row.empty" class="empty-tag">无任务</span>
        </div>

        <matrix-cell
          v-for="col in cols"
          :key="`cell-${row.id}-${col.id}`"
          :tasks="tasksAt(row, col)"
          :empty-row="row.empty"
          :empty-col="col.empty"
          :selected="cellIsSelected(row, col)"
          @open="openCell(row, col)"
          @create="createInCell(row, col)"
          @edit="editTask"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.matrix-scroll {
  max-height: calc(100vh - 252px);
  min-height: 360px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.matrix {
  display: grid;
  width: max-content;
  min-width: 100%;
  grid-template-rows: 56px;
  grid-auto-rows: minmax(120px, auto);
}

.corner {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.col-head,
.row-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  user-select: none;
}

.col-head {
  position: sticky;
  top: 0;
  z-index: 3;
  padding: 0 12px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-muted);
  font-weight: 600;
}

.row-head {
  position: sticky;
  left: 0;
  z-index: 2;
  padding: 10px 14px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  font-weight: 600;
  cursor: grab;
}

.col-head {
  cursor: grab;
}

.col-head.is-system,
.row-head.is-system {
  cursor: default;
}

.col-head.is-system .head-name,
.row-head.is-system .head-name {
  color: var(--text-muted);
}

.col-head:hover,
.row-head:hover {
  background: var(--primary-soft);
}

.col-head.is-dragging,
.row-head.is-dragging {
  opacity: 0.45;
}

.col-head.drop-before,
.row-head.drop-before {
  box-shadow: inset 0 2px 0 var(--primary);
}

.col-head.drop-after,
.row-head.drop-after {
  box-shadow: inset 0 -2px 0 var(--primary);
}

.head-name {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head-lock {
  flex: none;
  color: var(--text-faint);
  font-size: 13px;
}

.empty-tag {
  flex: none;
  margin-left: auto;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(240, 160, 32, 0.16);
  color: #a5731a;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 860px) {
  .matrix-scroll {
    max-height: calc(100vh - 300px);
  }
}
</style>
