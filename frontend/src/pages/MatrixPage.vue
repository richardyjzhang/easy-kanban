<!-- PC 矩阵页（M3）：日期筛选、行列转置、空行／空列标记、行列拖拽排序，
     以及格内快速新建、任务拖拽改归属、状态点切换与「待分配」窄行。 -->
<script setup lang="ts">
import { NButton, NCard, NEmpty, NIcon, NSpace, NSpin } from 'naive-ui'
import { AddOutline, RefreshOutline, SwapHorizontalOutline } from '@vicons/ionicons5'
import { computed, h, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import CellModal from '../components/CellModal.vue'
import FilterBar from '../components/FilterBar.vue'
import MatrixGrid from '../components/MatrixGrid.vue'
import QuickCreateModal from '../components/QuickCreateModal.vue'
import TaskModal from '../components/TaskModal.vue'
import { messageOfError } from '../api/client'
import { message } from '../feedback'
import { useDataStore } from '../stores/data'
import { formatRangeLabel, resolveRange, taskInRange } from '../utils/dateRange'
import type { FilterState } from '../utils/dateRange'
import {
  buildPersonAxes,
  buildProjectAxes,
  countTasksByPerson,
  countTasksByProject,
  groupTasksByCell,
} from '../utils/matrix'
import { sortTasksForCell } from '../utils/taskOrder'
import { toTaskInput } from '../utils/task'
import type { MatrixCellKey } from '../types/matrix'
import type { Task } from '../types'

const data = useDataStore()
const router = useRouter()

const filter = ref<FilterState>({ preset: 'this-week', custom: null })
const transposed = ref(false)
const gridRef = ref<InstanceType<typeof MatrixGrid> | null>(null)

// 当前打开的格子；始终以人员 × 项目表示，转置不影响它。
const activeCell = ref<MatrixCellKey | null>(null)
const cellModalOpen = ref(false)

const taskModalOpen = ref(false)
// 从格子弹窗点「编辑／新建」时收起格子，任务弹窗关闭后再回到那个格子。
const reopenCell = ref(false)
const editingTask = ref<Task | null>(null)

interface CreateDefaults {
  personId: number
  projectId: number
  startDate: string | null
  endDate: string | null
  title: string
}

const createDefaults = ref<CreateDefaults | null>(null)

// 快速新建（D3）单独一层，只收标题；「更多字段」再切到完整表单。
const quickOpen = ref(false)
const quickDefaults = ref<CreateDefaults | null>(null)

onMounted(() => {
  // 错误已写入 store，页面会展示重试入口。
  data.load().catch(() => {})
})

/** 当前生效的日期区间；null 表示不筛选。 */
const range = computed(() => resolveRange(filter.value.preset, filter.value.custom))

/** 先按日期筛选，再剔除已归档人员／项目下的任务。 */
const matrixTasks = computed(() => {
  const personIds = new Set(data.activePeople.map((person) => person.id))
  const projectIds = new Set(data.activeProjects.map((project) => project.id))
  return data.tasks.filter(
    (task) =>
      personIds.has(task.person_id) &&
      projectIds.has(task.project_id) &&
      taskInRange(task, range.value),
  )
})

/** 按格子分组，值已按 R7 排序。 */
const cells = computed(() => groupTasksByCell(matrixTasks.value))

/** 当前筛选下每行／每列的任务数，用于空行／空列标记。 */
const countByPerson = computed(() => countTasksByPerson(matrixTasks.value))
const countByProject = computed(() => countTasksByProject(matrixTasks.value))

/** 未指派任务总数（含已完成、不受日期筛选影响）：「待分配」行是否压缩看它。 */
const pendingTaskCount = computed(() => {
  const id = data.systemPerson?.id
  if (!id) return 0
  return data.tasks.filter((task) => task.person_id === id).length
})

/** 人员轴：系统人员「待分配」固定排在第一行，为空时压缩成窄行。 */
const personAxes = computed(() =>
  buildPersonAxes(data.activePeople, countByPerson.value, pendingTaskCount.value),
)

// 「待分配」不算真实人员，人员管理列表和矩阵空状态都以它之外的人数判断。
const realPeople = computed(() => data.activePeople.filter((person) => !person.is_system))

const projectAxes = computed(() =>
  buildProjectAxes(data.activeProjects, countByProject.value),
)

const rows = computed(() => (transposed.value ? projectAxes.value : personAxes.value))
const cols = computed(() => (transposed.value ? personAxes.value : projectAxes.value))

const summary = computed(() => {
  if (!data.loaded) return '正在加载数据…'
  if (!realPeople.value.length || !data.activeProjects.length) return '还没有可展示的矩阵'
  const scope = filter.value.preset === 'all' ? '全部任务' : formatRangeLabel(range.value)
  return `${realPeople.value.length} 人 × ${data.activeProjects.length} 个项目 · ${scope} · ${matrixTasks.value.length} 条任务`
})

/** 矩阵没有任务时的顶部提示文案与操作。 */
const emptyState = computed<{ description: string; action: 'create' | 'show-all' | null }>(() => {
  if (!data.tasks.length) {
    return { description: '矩阵里还没有任务，点任意格子的「+」即可在对应人员与项目下新建', action: 'create' }
  }
  if (filter.value.preset !== 'all') {
    return {
      description: `当前筛选（${formatRangeLabel(range.value)}）下没有任务，可查看全部`,
      action: 'show-all',
    }
  }
  return { description: '矩阵里没有可展示的任务（现有任务都在已归档的人员或项目下）', action: null }
})

/** 格子弹窗里的人员对象。 */
const activePerson = computed(() =>
  activeCell.value ? (data.personMap.get(activeCell.value.personId) ?? null) : null,
)

/** 格子弹窗里的项目对象。 */
const activeProject = computed(() =>
  activeCell.value ? (data.projectMap.get(activeCell.value.projectId) ?? null) : null,
)

// 约定：弹窗展示该格的全部任务，不受日期筛选影响；格子里的「+N」只统计筛选结果。
const activeCellTasks = computed(() => {
  const cell = activeCell.value
  if (!cell) return []
  return sortTasksForCell(
    data.tasks.filter(
      (task) => task.person_id === cell.personId && task.project_id === cell.projectId,
    ),
  )
})

/** 打开某个格子。 */
function openCell(personId: number, projectId: number): void {
  activeCell.value = { personId, projectId }
  cellModalOpen.value = true
}

/** 快速新建弹层里的人员对象。 */
const quickPerson = computed(() =>
  quickDefaults.value ? (data.personMap.get(quickDefaults.value.personId) ?? null) : null,
)

/** 快速新建弹层里的项目对象。 */
const quickProject = computed(() =>
  quickDefaults.value ? (data.projectMap.get(quickDefaults.value.projectId) ?? null) : null,
)

/** 默认日期取当前筛选范围；「全部」时不填日期。 */
function defaultDates(): { startDate: string | null; endDate: string | null } {
  const current = range.value
  return current
    ? { startDate: current.start, endDate: current.end }
    : { startDate: null, endDate: null }
}

/** 在某个格子打开完整新建表单；标题可由快速新建带过来。 */
function openCreate(personId: number, projectId: number, title = ''): void {
  editingTask.value = null
  createDefaults.value = { personId, projectId, title, ...defaultDates() }
  openTaskModal()
}

/** 在某个格子打开快速新建（D3）：只填标题。 */
function openQuickCreate(personId: number, projectId: number): void {
  quickDefaults.value = { personId, projectId, title: '', ...defaultDates() }
  quickOpen.value = true
}

/** 快速新建点「更多字段」：收起轻量层，切到完整表单，标题保留。 */
function handleQuickMore(title: string): void {
  const target = quickDefaults.value
  quickOpen.value = false
  if (!target) return
  openCreate(target.personId, target.projectId, title)
}

/** 编辑任务。 */
function openEdit(task: Task): void {
  editingTask.value = task
  openTaskModal()
}

/** 打开任务弹窗：两个居中弹窗不叠着显示，先收起格子弹窗并记下是否要回来。 */
function openTaskModal(): void {
  reopenCell.value = cellModalOpen.value
  cellModalOpen.value = false
  taskModalOpen.value = true
}

/** 任务弹窗关闭后，若当初是从格子弹窗进来的就回到那个格子。 */
function handleTaskModalOpen(value: boolean): void {
  taskModalOpen.value = value
  if (!value && reopenCell.value && activeCell.value) {
    reopenCell.value = false
    cellModalOpen.value = true
  }
}

/** 从格子弹窗底部的新建入口进入完整表单。 */
function createFromCell(): void {
  const cell = activeCell.value
  if (cell) openCreate(cell.personId, cell.projectId)
}

/** 空状态里的「新建任务」：默认挂到待分配与第一个项目。 */
function createFirstTask(): void {
  const personId = data.systemPerson?.id ?? data.activePeople[0]?.id
  const projectId = data.activeProjects[0]?.id
  if (personId && projectId) openQuickCreate(personId, projectId)
}

/** 格子定位文案，用于拖拽后的提示。 */
function cellLabel(personId: number, projectId: number): string {
  const person = data.personMap.get(personId)
  const project = data.projectMap.get(projectId)
  const personName = person?.is_system ? '待分配' : (person?.name ?? '未知人员')
  return `${personName} · ${project?.name ?? '未知项目'}`
}

/** 拖拽改归属：只改人员与项目，日期与状态保持原样。 */
async function handleMoveTask(task: Task, personId: number, projectId: number): Promise<void> {
  try {
    await data.updateTask(task.id, {
      ...toTaskInput(task),
      person_id: personId,
      project_id: projectId,
    })
    showMoveToast(task, personId, projectId)
  } catch (cause) {
    message.error(messageOfError(cause))
  }
}

/** 拖拽成功后的 toast：5 秒内可撤销，撤销即把人员／项目改回去。 */
function showMoveToast(task: Task, personId: number, projectId: number): void {
  let toast: { destroy: () => void } | null = null
  let undone = false

  const undo = async (): Promise<void> => {
    const current = data.tasks.find((item) => item.id === task.id)
    if (!current) return
    try {
      await data.updateTask(task.id, {
        ...toTaskInput(current),
        person_id: task.person_id,
        project_id: task.project_id,
      })
      message.success('已撤销移动')
    } catch (cause) {
      message.error(messageOfError(cause))
    }
  }

  toast = message.success(
    () =>
      h('span', { class: 'undo-toast' }, [
        h(
          'span',
          { class: 'undo-toast-text' },
          `「${task.title}」已移到 ${cellLabel(personId, projectId)}`,
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'undo-toast-action',
            onClick: () => {
              if (undone) return
              undone = true
              toast?.destroy()
              void undo()
            },
          },
          '撤销',
        ),
      ]),
    { duration: 5000, keepAliveOnHover: true },
  )
}

/** 点击格子里的状态点循环切换；写库失败时由 store 回滚并提示。 */
async function handleCycleStatus(task: Task): Promise<void> {
  try {
    await data.cycleTaskStatus(task.id)
  } catch (cause) {
    message.error(messageOfError(cause))
  }
}

/** 切到「全部」筛选。 */
function showAll(): void {
  filter.value = { preset: 'all', custom: null }
}

/** 手动重试拉取全量数据。 */
function reload(): void {
  data.load(true).catch(() => {})
}

/** 去设置页补人员或项目。 */
function goSettings(): void {
  void router.push('/pc/settings')
}

/** 转置：行列互换，滚动位置按交换后的方向恢复。 */
async function toggleTranspose(): Promise<void> {
  const before = gridRef.value?.readScroll()
  transposed.value = !transposed.value
  await nextTick()
  if (before) gridRef.value?.applyScroll({ top: before.left, left: before.top })
}

/** 保存拖拽后的行列顺序，失败时由 store 回滚并提示。 */
async function handleReorder(kind: 'person' | 'project', ids: number[]): Promise<void> {
  try {
    if (kind === 'person') await data.reorderPeople(ids)
    else await data.reorderProjects(ids)
  } catch (cause) {
    message.error(messageOfError(cause))
  }
}
</script>

<template>
  <div class="matrix-page">
    <header class="page-head">
      <div>
        <h1>矩阵</h1>
        <p class="page-sub">{{ summary }}</p>
      </div>

      <div class="head-tools">
        <filter-bar v-model="filter" />
        <n-button
          secondary
          class="transpose-button"
          :title="transposed ? '转回「人 × 项目」' : '转成「项目 × 人」'"
          @click="toggleTranspose"
        >
          <template #icon>
            <span class="transpose-icon" :class="{ rotated: transposed }">
              <n-icon :component="SwapHorizontalOutline" />
            </span>
          </template>
          {{ transposed ? '项目 × 人' : '人 × 项目' }}
        </n-button>
      </div>
    </header>

    <n-card v-if="data.loading && !data.loaded" :bordered="false">
      <div class="state"><n-spin size="small" /><span>正在加载数据…</span></div>
    </n-card>

    <n-card v-else-if="data.error && !data.loaded" :bordered="false">
      <n-empty description="数据加载失败">
        <template #extra>
          <n-space vertical align="center" :size="12">
            <span class="muted">{{ data.error }}</span>
            <n-button type="primary" @click="reload">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
              重试
            </n-button>
          </n-space>
        </template>
      </n-empty>
    </n-card>

    <n-card v-else-if="!realPeople.length || !data.activeProjects.length" :bordered="false">
      <n-empty
        :description="
          !realPeople.length
            ? '还没有人员，先在设置里添加成员'
            : '还没有项目，先在设置里创建项目'
        "
      >
        <template #extra>
          <n-button type="primary" @click="goSettings">去设置</n-button>
        </template>
      </n-empty>
    </n-card>

    <template v-else>
      <!-- 有人员／项目就渲染整个矩阵框架；当前筛选下没有任务时只在顶部挂提示，不替换网格。 -->
      <div v-if="!matrixTasks.length" class="matrix-hint">
        <span class="hint-text">{{ emptyState.description }}</span>
        <n-button
          v-if="emptyState.action === 'create'"
          type="primary"
          size="small"
          @click="createFirstTask"
        >
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
          新建任务
        </n-button>
        <n-button v-else-if="emptyState.action === 'show-all'" size="small" @click="showAll">
          查看全部
        </n-button>
        <n-button v-else size="small" @click="goSettings">去设置</n-button>
      </div>

      <matrix-grid
        ref="gridRef"
        :rows="rows"
        :cols="cols"
        :cells="cells"
        :selected="activeCell"
        @open-cell="openCell"
        @create-task="openQuickCreate"
        @edit-task="openEdit"
        @cycle-status="handleCycleStatus"
        @move-task="handleMoveTask"
        @reorder="handleReorder"
      />
    </template>

    <quick-create-modal
      v-model:open="quickOpen"
      :person="quickPerson"
      :project="quickProject"
      :start-date="quickDefaults?.startDate ?? null"
      :end-date="quickDefaults?.endDate ?? null"
      @more="handleQuickMore"
    />

    <cell-modal
      v-model:open="cellModalOpen"
      :person="activePerson"
      :project="activeProject"
      :tasks="activeCellTasks"
      :filtered="Boolean(range)"
      @edit="openEdit"
      @create="createFromCell"
    />

    <task-modal
      :open="taskModalOpen"
      :task="editingTask"
      :default-person-id="createDefaults?.personId"
      :default-project-id="createDefaults?.projectId"
      :default-title="createDefaults?.title"
      :default-start-date="createDefaults?.startDate"
      :default-end-date="createDefaults?.endDate"
      @update:open="handleTaskModalOpen"
    />
  </div>
</template>

<style scoped>
.matrix-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.head-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.transpose-icon {
  display: inline-flex;
  transition: transform 0.25s ease;
}

.transpose-icon.rotated {
  transform: rotate(90deg);
}

.transpose-button {
  flex: none;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 13px;
}

.matrix-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 13px;
}

.hint-text {
  flex: 1 1 auto;
  min-width: 0;
}

@media (max-width: 1100px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .head-tools {
    justify-content: flex-start;
  }
}
</style>
