<!-- 矩阵网格：行列渲染、表头吸附、空行／空列标记、行列拖拽排序。
     行与列统一用 MatrixAxis 表示，转置只交换两者，不改任何数据。
     任务卡片本身也能拖动：拖到另一格即改人员／项目归属，拖回「待分配」即取消指派。 -->
<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { LockClosedOutline } from '@vicons/ionicons5'
import { computed, onBeforeUnmount, ref } from 'vue'

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
  cycleStatus: [task: Task]
  moveTask: [task: Task, personId: number, projectId: number]
  reorder: [kind: MatrixAxisKind, ids: number[]]
}>()

// 尺寸与 docs/PAGES.md 一致：人员列 180px、格子 170px；
// 「待分配」行／列为空时压缩，但仍留在网格里接住拖拽。
const ROW_HEAD_WIDTH = 180
const CELL_WIDTH = 170
const ROW_HEIGHT = 120
const HEADER_HEIGHT = 56
const COMPACT_WIDTH = 140
const COMPACT_HEIGHT = 48

const scrollEl = ref<HTMLElement | null>(null)
const matrixEl = ref<HTMLElement | null>(null)

const gridStyle = computed(() => {
  const columns = props.cols.map((col) => `${col.compact ? COMPACT_WIDTH : CELL_WIDTH}px`)
  const rows = props.rows.map((row) =>
    row.compact ? `${COMPACT_HEIGHT}px` : `minmax(${ROW_HEIGHT}px, auto)`,
  )
  return {
    gridTemplateColumns: `${ROW_HEAD_WIDTH}px ${
      columns.length ? columns.join(' ') : `${CELL_WIDTH}px`
    }`,
    gridTemplateRows: [`${HEADER_HEIGHT}px`, ...rows].join(' '),
  }
})

/** 当前所有格子里的任务索引，拖拽时按 id 取回任务对象。 */
const taskById = computed(() => {
  const index = new Map<number, Task>()
  for (const list of props.cells.values()) {
    for (const task of list) index.set(task.id, task)
  }
  return index
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

/** 该格是否为当前打开的格子。 */
function cellIsSelected(row: MatrixAxis, col: MatrixAxis): boolean {
  if (!props.selected) return false
  const coord = coordOf(row, col)
  return (
    props.selected.personId === coord.personId && props.selected.projectId === coord.projectId
  )
}

/** 打开格子弹窗。 */
function openCell(row: MatrixAxis, col: MatrixAxis): void {
  const coord = coordOf(row, col)
  emit('openCell', coord.personId, coord.projectId)
}

/** 在格子里新建任务。 */
function createInCell(row: MatrixAxis, col: MatrixAxis): void {
  const coord = coordOf(row, col)
  emit('createTask', coord.personId, coord.projectId)
}

/** 编辑某条任务；刚拖拽结束时吞掉尾随的 click，避免误开弹窗。 */
function editTask(task: Task): void {
  if (suppressTaskClick) return
  emit('editTask', task)
}

/** 点击格子里的状态点循环切换状态。 */
function cycleTask(task: Task): void {
  emit('cycleStatus', task)
}

/** 该格是否为任务拖拽的落点。 */
function cellIsDropTarget(row: MatrixAxis, col: MatrixAxis): boolean {
  const target = taskDrag.value?.target
  if (!target) return false
  const coord = coordOf(row, col)
  return target.personId === coord.personId && target.projectId === coord.projectId
}

// 拖拽排序：拖动行头／列头时整行／整列浮起，落点处撑开一段插入间隙。
// 用 Pointer Events 自绘拖拽，才能让整条轴跟着指针走并做间隙动画；原生 DnD 只能拖一个表头。
const GAP_PX = 18
const DRAG_THRESHOLD = 4
const EDGE_PX = 56
const EDGE_SPEED = 18

/** 拖拽方向；注意别和轴的 kind（person／project）混用。 */
type DragOrientation = 'row' | 'col'

interface PendingDrag {
  orientation: DragOrientation
  axis: MatrixAxis
  index: number
  pointerId: number
  startX: number
  startY: number
  head: HTMLElement
}

interface AxisDrag {
  orientation: DragOrientation
  axis: MatrixAxis
  index: number
  pointerId: number
  /** 指针在浮起的那一行／列内的偏移，保证拖动时手感不跳。 */
  offsetX: number
  offsetY: number
  ghost: HTMLElement
  /** 插入落点：插到第几行／列之前；等于长度表示插到末尾。 */
  gapIndex: number | null
  /** 落点在矩阵内部坐标里的位置（行拖拽是 y，列拖拽是 x）。 */
  gapPos: number
}

interface GhostAnchor {
  el: HTMLElement
  left: number
  top: number
}

const drag = ref<AxisDrag | null>(null)
let pending: PendingDrag | null = null
const pointer = { x: 0, y: 0 }
let scrollRaf = 0

/** 被拖动的表头本身淡化，原位置留成一个「空位」。 */
function isDragSource(orientation: DragOrientation, axis: MatrixAxis): boolean {
  return drag.value?.orientation === orientation && drag.value.axis.id === axis.id
}

/** 落点之后的整条轴向上／向右让出间隙，形成「插进去」的位置。 */
function rowShift(index: number): number {
  const state = drag.value
  if (!state || state.orientation !== 'row' || state.gapIndex === null) return 0
  return index >= state.gapIndex ? GAP_PX : 0
}

function colShift(index: number): number {
  const state = drag.value
  if (!state || state.orientation !== 'col' || state.gapIndex === null) return 0
  return index >= state.gapIndex ? GAP_PX : 0
}

function axisTransform(x: number, y: number): string {
  return `translate3d(${x}px, ${y}px, 0)`
}

/** 行头／列头／格子的实时位移。 */
function rowStyle(index: number): Record<string, string> | undefined {
  const y = rowShift(index)
  return y ? { transform: axisTransform(0, y) } : undefined
}

function colStyle(index: number): Record<string, string> | undefined {
  const x = colShift(index)
  return x ? { transform: axisTransform(x, 0) } : undefined
}

function cellStyle(rowIndex: number, colIndex: number): Record<string, string> | undefined {
  const x = colShift(colIndex)
  const y = rowShift(rowIndex)
  const state = drag.value
  const faded = state
    ? state.orientation === 'row'
      ? rowIndex === state.index
      : colIndex === state.index
    : false
  if (!x && !y && !faded) return undefined

  const style: Record<string, string> = {}
  if (x || y) style.transform = axisTransform(x, y)
  if (faded) style.opacity = '0.16'
  return style
}

/** 插入指示线的绝对定位（矩阵内容坐标）。 */
const dropLineStyle = computed<Record<string, string>>(() => {
  const state = drag.value
  const style: Record<string, string> = {}
  if (!state || state.gapIndex === null) return style
  if (state.orientation === 'row') {
    style.top = `${state.gapPos}px`
    style.left = '0px'
    style.right = '0px'
  } else {
    style.top = '0px'
    style.bottom = '0px'
    style.left = `${state.gapPos}px`
  }
  return style
})

/** 按下表头：先记下候选，移动超过阈值才真正开始拖拽。 */
function onHeadPointerDown(
  event: PointerEvent,
  orientation: DragOrientation,
  axis: MatrixAxis,
  index: number,
): void {
  if (axis.isSystem || event.button !== 0 || !event.isPrimary) return
  if (pending || drag.value) return
  event.preventDefault()

  const head = event.currentTarget as HTMLElement
  pending = {
    orientation,
    axis,
    index,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    head,
  }
  pointer.x = event.clientX
  pointer.y = event.clientY
  head.setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('blur', onWindowBlur)
}

function onPointerMove(event: PointerEvent): void {
  if (pending && event.pointerId !== pending.pointerId) return
  if (drag.value && event.pointerId !== drag.value.pointerId) return
  pointer.x = event.clientX
  pointer.y = event.clientY

  if (pending) {
    const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY)
    if (distance < DRAG_THRESHOLD) return
    beginDrag(pending, event.clientX, event.clientY)
  }

  const state = drag.value
  if (!state) return
  if (state.orientation === 'row') state.ghost.style.top = `${event.clientY - state.offsetY}px`
  else state.ghost.style.left = `${event.clientX - state.offsetX}px`
  updateDropTarget()
}

/** 开始拖拽：克隆整行／整列做成浮层，并进入让位状态。 */
function beginDrag(start: PendingDrag, pointerX: number, pointerY: number): void {
  pending = null
  const ghost = buildGhost(start.orientation, start.axis)
  if (!ghost) {
    stopListening()
    return
  }

  const state: AxisDrag = {
    orientation: start.orientation,
    axis: start.axis,
    index: start.index,
    pointerId: start.pointerId,
    offsetX: pointerX - ghost.left,
    offsetY: pointerY - ghost.top,
    ghost: ghost.el,
    gapIndex: null,
    gapPos: 0,
  }
  drag.value = state

  if (start.orientation === 'row') state.ghost.style.top = `${pointerY - state.offsetY}px`
  else state.ghost.style.left = `${pointerX - state.offsetX}px`

  document.body.classList.add('is-axis-dragging')
  updateDropTarget()
  startAutoScroll()
}

/** 把整行／整列的表头和格子克隆到一个固定定位的浮层里。 */
function buildGhost(orientation: DragOrientation, axis: MatrixAxis): GhostAnchor | null {
  const matrix = matrixEl.value
  const scroller = scrollEl.value
  if (!matrix || !scroller) return null

  const matrixRect = matrix.getBoundingClientRect()
  const scrollRect = scroller.getBoundingClientRect()
  const headSelector =
    orientation === 'row'
      ? `.row-head[data-row-id="${axis.id}"]`
      : `.col-head[data-col-id="${axis.id}"]`
  const head = matrix.querySelector<HTMLElement>(headSelector)
  if (!head) return null
  const headRect = head.getBoundingClientRect()

  const el = document.createElement('div')
  el.className = `axis-ghost axis-ghost--${orientation}`

  let left: number
  let top: number
  let width: number
  let height: number
  if (orientation === 'row') {
    // 只截取滚动视口内可见的一段，避免浮层横向溢出屏幕。
    left = Math.max(matrixRect.left, scrollRect.left)
    top = headRect.top
    width = Math.max(Math.min(matrixRect.right, scrollRect.right) - left, 1)
    height = headRect.height
  } else {
    left = headRect.left
    top = Math.max(matrixRect.top, scrollRect.top)
    width = headRect.width
    height = Math.max(Math.min(matrixRect.bottom, scrollRect.bottom) - top, 1)
  }

  el.style.left = `${left}px`
  el.style.top = `${top}px`
  el.style.width = `${width}px`
  el.style.height = `${height}px`

  const selector =
    orientation === 'row'
      ? `.row-head[data-row-id="${axis.id}"], .matrix-cell[data-row-id="${axis.id}"]`
      : `.col-head[data-col-id="${axis.id}"], .matrix-cell[data-col-id="${axis.id}"]`
  const parts = Array.from(matrix.querySelectorAll<HTMLElement>(selector))

  for (const part of parts) {
    const rect = part.getBoundingClientRect()
    if (!rect.width || !rect.height) continue
    if (orientation === 'row') {
      if (rect.right <= left || rect.left >= left + width) continue
    } else if (rect.bottom <= top || rect.top >= top + height) {
      continue
    }

    const clone = part.cloneNode(true) as HTMLElement
    clone.style.position = 'absolute'
    clone.style.margin = '0'
    clone.style.left = `${rect.left - left}px`
    clone.style.top = `${rect.top - top}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.boxSizing = 'border-box'
    clone.style.transform = 'none'
    clone.style.opacity = '1'
    clone.style.pointerEvents = 'none'
    el.appendChild(clone)
  }

  document.body.appendChild(el)
  window.requestAnimationFrame(() => el.classList.add('is-lifted'))
  return { el, left, top }
}

/**
 * 计算插入落点。用 offsetTop／offsetLeft 而不是 getBoundingClientRect，
 * 因为后者会把「让位」的 transform 也算进去，导致落点跟着抖动。
 */
function updateDropTarget(): void {
  const state = drag.value
  const matrix = matrixEl.value
  if (!state || !matrix) return

  const matrixRect = matrix.getBoundingClientRect()
  const rowMode = state.orientation === 'row'
  const axisList = rowMode ? props.rows : props.cols
  const firstMovable = axisList.findIndex((item) => !item.isSystem)
  if (firstMovable < 0) {
    state.gapIndex = null
    return
  }

  const heads = Array.from(
    matrix.querySelectorAll<HTMLElement>(
      rowMode ? '.row-head[data-row-id]' : '.col-head[data-col-id]',
    ),
  )
  const coordinate = rowMode ? pointer.y - matrixRect.top : pointer.x - matrixRect.left

  let gapIndex = axisList.length
  let gapPos = 0
  for (let index = firstMovable; index < axisList.length; index += 1) {
    const head = heads[index]
    if (!head) continue
    const start = rowMode ? head.offsetTop : head.offsetLeft
    const size = rowMode ? head.offsetHeight : head.offsetWidth
    if (coordinate < start + size / 2) {
      gapIndex = index
      gapPos = start
      break
    }
    gapPos = start + size
  }

  state.gapIndex = gapIndex
  state.gapPos = gapPos
}

function onPointerUp(event: PointerEvent): void {
  if (drag.value && event.pointerId !== drag.value.pointerId) return
  if (pending && event.pointerId !== pending.pointerId) return
  const state = drag.value
  if (state) commitDrop(state)
  else resetDrag()
}

function onPointerCancel(): void {
  resetDrag()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') resetDrag()
}

function onWindowBlur(): void {
  resetDrag()
}

/** 松手：按落点算出新的 id 顺序；顺序没变就不发请求。 */
function commitDrop(state: AxisDrag): void {
  const list = state.orientation === 'row' ? props.rows : props.cols
  const gapIndex = state.gapIndex
  const sourceId = state.axis.id
  const kind = state.axis.kind
  resetDrag()
  if (gapIndex === null) return

  const ids = list.filter((item) => !item.isSystem).map((item) => item.id)
  const from = ids.indexOf(sourceId)
  if (from < 0) return

  const before = ids.join(',')
  ids.splice(from, 1)
  let insertAt = 0
  for (let index = 0; index < gapIndex && index < list.length; index += 1) {
    const item = list[index]
    if (!item.isSystem && item.id !== sourceId) insertAt += 1
  }
  if (insertAt > ids.length) insertAt = ids.length
  ids.splice(insertAt, 0, sourceId)

  if (ids.join(',') === before) return
  emit('reorder', kind, ids)
}

/** 拖到视口边缘时自动滚动，才能把行拖到屏幕外的位置。 */
function startAutoScroll(): void {
  if (scrollRaf) return
  scrollRaf = window.requestAnimationFrame(stepAutoScroll)
}

function stepAutoScroll(): void {
  scrollRaf = 0
  const scroller = scrollEl.value
  const state = drag.value
  if (!scroller || !state) return

  const rect = scroller.getBoundingClientRect()
  const insideX = pointer.x >= rect.left && pointer.x <= rect.right
  const insideY = pointer.y >= rect.top && pointer.y <= rect.bottom
  let dx = 0
  let dy = 0

  if (insideY) {
    if (pointer.x < rect.left + EDGE_PX) {
      dx = -edgeSpeed(rect.left + EDGE_PX - pointer.x)
    } else if (pointer.x > rect.right - EDGE_PX) {
      dx = edgeSpeed(pointer.x - (rect.right - EDGE_PX))
    }
  }
  if (insideX) {
    if (pointer.y < rect.top + EDGE_PX) {
      dy = -edgeSpeed(rect.top + EDGE_PX - pointer.y)
    } else if (pointer.y > rect.bottom - EDGE_PX) {
      dy = edgeSpeed(pointer.y - (rect.bottom - EDGE_PX))
    }
  }

  if (dx || dy) {
    scroller.scrollLeft += dx
    scroller.scrollTop += dy
    updateDropTarget()
  }
  scrollRaf = window.requestAnimationFrame(stepAutoScroll)
}

function edgeSpeed(distance: number): number {
  return Math.max(2, Math.min(EDGE_SPEED, Math.round(distance / 3)))
}

function stopListening(): void {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('blur', onWindowBlur)
}

/** 结束拖拽：浮层淡出、清掉让位与监听。 */
function resetDrag(): void {
  const state = drag.value
  pending = null
  drag.value = null

  if (state) {
    const ghost = state.ghost
    ghost.classList.remove('is-lifted')
    ghost.classList.add('is-dropping')
    window.setTimeout(() => ghost.remove(), 180)
  }
  if (scrollRaf) {
    window.cancelAnimationFrame(scrollRaf)
    scrollRaf = 0
  }
  document.body.classList.remove('is-axis-dragging')
  stopListening()
}

onBeforeUnmount(() => {
  resetDrag()
  resetTaskDrag()
})

// 任务拖拽：按住任务卡片移动超过阈值后浮起，落点所在格即新的归属。
// 和行列拖拽一样用 Pointer Events 自绘，才能同时控制浮层、落点高亮与边缘滚动。
interface PendingTaskDrag {
  task: Task
  pointerId: number
  startX: number
  startY: number
  chip: HTMLElement
}

interface TaskDrag {
  task: Task
  pointerId: number
  /** 指针在浮起卡片内的偏移，保证拖动时手感不跳。 */
  offsetX: number
  offsetY: number
  ghost: HTMLElement
  sourceEl: HTMLElement
  /** 落点格子；null 表示松手会取消这次拖拽。 */
  target: MatrixCellKey | null
}

const taskDrag = ref<TaskDrag | null>(null)
let pendingTask: PendingTaskDrag | null = null
let taskScrollRaf = 0
/** 拖拽结束后浏览器还会补一个 click，用它吞掉，避免顺手打开任务弹窗。 */
let suppressTaskClick = false

/** 按下任务卡片：先只记候选，移动超过阈值才算拖拽。 */
function onTaskPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || !event.isPrimary) return
  if (pending || drag.value || pendingTask || taskDrag.value) return

  const target = event.target as HTMLElement | null
  // 状态点是独立操作，不参与拖拽。
  if (target?.closest('.chip-status')) return
  const chip = target?.closest<HTMLElement>('.task-chip')
  if (!chip) return

  const task = taskById.value.get(Number(chip.dataset.taskId))
  if (!task) return

  pendingTask = {
    task,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    chip,
  }
  pointer.x = event.clientX
  pointer.y = event.clientY
  window.addEventListener('pointermove', onTaskPointerMove)
  window.addEventListener('pointerup', onTaskPointerUp)
  window.addEventListener('pointercancel', onTaskPointerCancel)
  window.addEventListener('keydown', onTaskKeyDown)
  window.addEventListener('blur', onTaskWindowBlur)
}

function onTaskPointerMove(event: PointerEvent): void {
  if (pendingTask && event.pointerId !== pendingTask.pointerId) return
  if (taskDrag.value && event.pointerId !== taskDrag.value.pointerId) return
  pointer.x = event.clientX
  pointer.y = event.clientY

  if (pendingTask) {
    const distance = Math.hypot(
      event.clientX - pendingTask.startX,
      event.clientY - pendingTask.startY,
    )
    if (distance < DRAG_THRESHOLD) return
    beginTaskDrag(pendingTask, event.clientX, event.clientY)
    pendingTask = null
  }

  const state = taskDrag.value
  if (!state) return
  state.ghost.style.transform = `translate3d(${event.clientX - state.offsetX}px, ${
    event.clientY - state.offsetY
  }px, 0)`
  updateTaskTarget()
}

/** 开始拖任务：克隆卡片做浮层，原卡片淡出，并启动边缘滚动。 */
function beginTaskDrag(start: PendingTaskDrag, pointerX: number, pointerY: number): void {
  const rect = start.chip.getBoundingClientRect()
  const ghost = start.chip.cloneNode(true) as HTMLElement
  ghost.classList.add('task-ghost')
  ghost.style.width = `${rect.width}px`
  ghost.style.height = `${rect.height}px`
  ghost.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`
  document.body.appendChild(ghost)

  const state: TaskDrag = {
    task: start.task,
    pointerId: start.pointerId,
    offsetX: pointerX - rect.left,
    offsetY: pointerY - rect.top,
    ghost,
    sourceEl: start.chip,
    target: null,
  }
  taskDrag.value = state
  start.chip.style.opacity = '0.28'

  window.requestAnimationFrame(() => ghost.classList.add('is-lifted'))
  document.body.classList.add('is-task-dragging')
  updateTaskTarget()
  startTaskAutoScroll()
}

/** 按指针位置找落点格子，再还原成「人员 × 项目」，转置时同样成立。 */
function updateTaskTarget(): void {
  const state = taskDrag.value
  if (!state) return

  const element = document.elementFromPoint(pointer.x, pointer.y) as HTMLElement | null
  const cell = element?.closest<HTMLElement>('.matrix-cell')
  if (!cell) {
    state.target = null
    return
  }

  const row = props.rows.find((item) => item.id === Number(cell.dataset.rowId))
  const col = props.cols.find((item) => item.id === Number(cell.dataset.colId))
  state.target = row && col ? coordOf(row, col) : null
}

function onTaskPointerUp(event: PointerEvent): void {
  if (taskDrag.value && event.pointerId !== taskDrag.value.pointerId) return
  if (pendingTask && event.pointerId !== pendingTask.pointerId) return

  const state = taskDrag.value
  if (!state) {
    resetTaskDrag()
    return
  }

  const target = state.target
  const task = state.task
  const moved =
    target !== null &&
    (target.personId !== task.person_id || target.projectId !== task.project_id)
  resetTaskDrag()
  if (!moved || !target) return

  suppressTaskClick = true
  window.setTimeout(() => {
    suppressTaskClick = false
  }, 0)
  emit('moveTask', task, target.personId, target.projectId)
}

function onTaskPointerCancel(): void {
  resetTaskDrag()
}

function onTaskKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') resetTaskDrag()
}

function onTaskWindowBlur(): void {
  resetTaskDrag()
}

/** 拖到视口边缘时自动滚动，才能把任务放到屏幕外的格子里。 */
function startTaskAutoScroll(): void {
  if (taskScrollRaf) return
  taskScrollRaf = window.requestAnimationFrame(stepTaskAutoScroll)
}

function stepTaskAutoScroll(): void {
  taskScrollRaf = 0
  const scroller = scrollEl.value
  if (!scroller || !taskDrag.value) return

  const rect = scroller.getBoundingClientRect()
  const insideX = pointer.x >= rect.left && pointer.x <= rect.right
  const insideY = pointer.y >= rect.top && pointer.y <= rect.bottom
  let dx = 0
  let dy = 0

  if (insideY) {
    if (pointer.x < rect.left + EDGE_PX) {
      dx = -edgeSpeed(rect.left + EDGE_PX - pointer.x)
    } else if (pointer.x > rect.right - EDGE_PX) {
      dx = edgeSpeed(pointer.x - (rect.right - EDGE_PX))
    }
  }
  if (insideX) {
    if (pointer.y < rect.top + EDGE_PX) {
      dy = -edgeSpeed(rect.top + EDGE_PX - pointer.y)
    } else if (pointer.y > rect.bottom - EDGE_PX) {
      dy = edgeSpeed(pointer.y - (rect.bottom - EDGE_PX))
    }
  }

  if (dx || dy) {
    scroller.scrollLeft += dx
    scroller.scrollTop += dy
    updateTaskTarget()
  }
  taskScrollRaf = window.requestAnimationFrame(stepTaskAutoScroll)
}

function stopTaskListening(): void {
  window.removeEventListener('pointermove', onTaskPointerMove)
  window.removeEventListener('pointerup', onTaskPointerUp)
  window.removeEventListener('pointercancel', onTaskPointerCancel)
  window.removeEventListener('keydown', onTaskKeyDown)
  window.removeEventListener('blur', onTaskWindowBlur)
}

/** 结束任务拖拽：原卡片恢复、浮层淡出、清掉落点高亮。 */
function resetTaskDrag(): void {
  const state = taskDrag.value
  pendingTask = null
  taskDrag.value = null

  if (state) {
    state.sourceEl.style.opacity = ''
    const ghost = state.ghost
    ghost.classList.remove('is-lifted')
    ghost.classList.add('is-dropping')
    window.setTimeout(() => ghost.remove(), 160)
  }
  if (taskScrollRaf) {
    window.cancelAnimationFrame(taskScrollRaf)
    taskScrollRaf = 0
  }
  document.body.classList.remove('is-task-dragging')
  stopTaskListening()
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
    <div ref="matrixEl" class="matrix" :style="gridStyle" @pointerdown="onTaskPointerDown">
      <div class="corner">
        <span class="corner-label">{{ axesLabel }}</span>
      </div>

      <div
        v-if="drag && drag.gapIndex !== null"
        class="axis-drop-line"
        :class="`is-${drag.orientation}`"
        :style="dropLineStyle"
      />

      <div
        v-for="(col, colIndex) in cols"
        :key="`col-${col.id}`"
        class="col-head"
        :class="{
          'is-system': col.isSystem,
          'is-drag-source': isDragSource('col', col),
        }"
        :data-col-id="col.id"
        :style="colStyle(colIndex)"
        :title="
          col.isSystem
            ? `系统人员固定在第一列，当前 ${col.count} 条未指派任务`
            : '拖动整列调整顺序'
        "
        @pointerdown="onHeadPointerDown($event, 'col', col, colIndex)"
      >
        <color-dot :color="col.color" :size="8" />
        <span class="head-name">{{ col.name }}</span>
        <n-icon v-if="col.isSystem" :component="LockClosedOutline" class="head-lock" />
        <span
          v-if="col.isSystem"
          class="pending-count"
          :title="`${col.count} 条未指派任务`"
        >
          {{ col.count }} 条
        </span>
        <span v-else-if="col.empty" class="empty-tag">无任务</span>
      </div>

      <template v-for="(row, rowIndex) in rows" :key="`row-${row.id}`">
        <div
          class="row-head"
          :class="{
            'is-system': row.isSystem,
            'is-drag-source': isDragSource('row', row),
          }"
          :data-row-id="row.id"
          :style="rowStyle(rowIndex)"
          :title="
            row.isSystem
              ? `系统人员固定在第一行，当前 ${row.count} 条未指派任务`
              : '拖动整行调整顺序'
          "
          @pointerdown="onHeadPointerDown($event, 'row', row, rowIndex)"
        >
          <ColorDot :color="row.color" :size="8" />
          <span class="head-name">{{ row.name }}</span>
          <n-icon v-if="row.isSystem" :component="LockClosedOutline" class="head-lock" />
          <span
            v-if="row.isSystem"
            class="pending-count"
            :title="`${row.count} 条未指派任务`"
          >
            {{ row.count }} 条
          </span>
          <span v-else-if="row.empty" class="empty-tag">无任务</span>
        </div>

        <matrix-cell
          v-for="(col, colIndex) in cols"
          :key="`cell-${row.id}-${col.id}`"
          :data-row-id="row.id"
          :data-col-id="col.id"
          :style="cellStyle(rowIndex, colIndex)"
          :tasks="tasksAt(row, col)"
          :empty-row="row.empty"
          :empty-col="col.empty"
          :selected="cellIsSelected(row, col)"
          :compact="row.compact || col.compact"
          :drop-target="cellIsDropTarget(row, col)"
          @open="openCell(row, col)"
          @create="createInCell(row, col)"
          @edit="editTask"
          @cycle="cycleTask"
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
  position: relative;
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
  touch-action: none;
  transition:
    transform 0.18s cubic-bezier(0.22, 0.61, 0.36, 1),
    background-color 0.15s ease,
    opacity 0.15s ease;
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

.col-head.is-drag-source,
.row-head.is-drag-source {
  opacity: 0.16;
}

.col-head.is-drag-source:hover,
.row-head.is-drag-source:hover {
  background: var(--surface-muted);
}

/* 插入指示线：行拖拽是一条横线，列拖拽是一条竖线，随落点平滑滑动。 */
.axis-drop-line {
  position: absolute;
  z-index: 4;
  border-radius: 999px;
  background: var(--primary);
  box-shadow:
    0 0 0 4px rgba(30, 58, 138, 0.08),
    0 0 16px rgba(30, 58, 138, 0.3);
  pointer-events: none;
  transition:
    top 0.14s cubic-bezier(0.22, 0.61, 0.36, 1),
    left 0.14s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.axis-drop-line.is-row {
  height: 2px;
}

.axis-drop-line.is-col {
  width: 2px;
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

.pending-count {
  flex: none;
  margin-left: auto;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.14);
  color: var(--text-muted);
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

<!-- 拖拽浮层是运行时克隆出来的 DOM，拿不到 scoped 的 data-v 属性，必须放全局样式。 -->
<style>
.axis-ghost {
  position: fixed;
  z-index: 70;
  overflow: hidden;
  border-radius: 10px;
  background: var(--surface);
  box-shadow:
    0 18px 44px rgba(15, 23, 42, 0.18),
    0 4px 12px rgba(15, 23, 42, 0.1);
  opacity: 0;
  outline: 1px solid var(--border-strong);
  pointer-events: none;
  transform: translate3d(0, 4px, 0) scale(0.985);
  transition:
    opacity 0.14s ease,
    transform 0.18s cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: transform, opacity;
}

.axis-ghost--col {
  transform: translate3d(4px, 0, 0) scale(0.985);
}

.axis-ghost.is-lifted {
  opacity: 1;
  transform: translate3d(0, -2px, 0) scale(1.01);
}

.axis-ghost--col.is-lifted {
  transform: translate3d(-2px, 0, 0) scale(1.01);
}

.axis-ghost.is-dropping {
  opacity: 0;
  transform: translate3d(0, 2px, 0) scale(0.99);
  transition-duration: 0.12s;
}

body.is-axis-dragging,
body.is-axis-dragging * {
  cursor: grabbing !important;
  user-select: none !important;
}

/* 任务卡片的拖拽浮层。位置由内联 transform 控制，这里只管外观与淡入淡出。 */
.task-ghost {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 75;
  margin: 0;
  border-radius: 6px;
  background: var(--surface);
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.18),
    0 2px 8px rgba(15, 23, 42, 0.08);
  opacity: 0;
  outline: 1px solid var(--border-strong);
  pointer-events: none;
  transition: opacity 0.12s ease;
  will-change: transform, opacity;
}

.task-ghost.is-lifted {
  opacity: 1;
}

.task-ghost.is-dropping {
  opacity: 0;
  transition-duration: 0.1s;
}

body.is-task-dragging,
body.is-task-dragging * {
  cursor: grabbing !important;
  user-select: none !important;
}
</style>
