<!-- H5 矩阵页（P4）：单行顶栏、日期筛选、转置、首列吸附与全屏格子弹层。
     与 PC 共用数据层和矩阵轴工具，但不提供拖拽；改归属在任务弹层里完成。 -->
<script setup lang="ts">
import { NButton, NEmpty, NIcon, NSpin } from 'naive-ui'
import {
  AddOutline,
  ChevronDownOutline,
  RefreshOutline,
  SwapHorizontalOutline,
} from '@vicons/ionicons5'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import MobileCellSheet from '../components/MobileCellSheet.vue'
import MobileFilterSheet from '../components/MobileFilterSheet.vue'
import MobileMatrix from '../components/MobileMatrix.vue'
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
import type { MatrixCellKey } from '../types/matrix'
import type { Task } from '../types'

const data = useDataStore()
const router = useRouter()

const filter = ref<FilterState>({ preset: 'this-week', custom: null })
const transposed = ref(false)
const filterOpen = ref(false)

// 当前打开的格子；始终以人员 × 项目表示，转置不影响它。
const activeCell = ref<MatrixCellKey | null>(null)
const cellSheetOpen = ref(false)

const taskModalOpen = ref(false)
const editingTask = ref<Task | null>(null)

interface CreateDefaults {
  personId: number
  projectId: number
  startDate: string | null
  endDate: string | null
  title: string
}

const createDefaults = ref<CreateDefaults | null>(null)

// 快速新建（D3）复用 PC 的轻量弹层，只收标题。
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

const countByPerson = computed(() => countTasksByPerson(matrixTasks.value))
const countByProject = computed(() => countTasksByProject(matrixTasks.value))

/** 未指派任务总数（含已完成、不受日期筛选影响）：「待分配」行是否压缩看它。 */
const pendingTaskCount = computed(() => {
  const id = data.systemPerson?.id
  if (!id) return 0
  return data.tasks.filter((task) => task.person_id === id).length
})

const personAxes = computed(() =>
  buildPersonAxes(data.activePeople, countByPerson.value, pendingTaskCount.value),
)
const projectAxes = computed(() => buildProjectAxes(data.activeProjects, countByProject.value))

const rows = computed(() => (transposed.value ? projectAxes.value : personAxes.value))
const cols = computed(() => (transposed.value ? personAxes.value : projectAxes.value))

// 「待分配」不算真实人员，空状态以它之外的人数判断。
const realPeople = computed(() => data.activePeople.filter((person) => !person.is_system))

/** 顶栏筛选按钮文案：自定义但还没选日期时显示「自定义」。 */
const filterLabel = computed(() => {
  if (filter.value.preset === 'custom' && !filter.value.custom) return '自定义'
  return formatRangeLabel(range.value)
})

/** 矩阵没有任务时的提示文案与操作。 */
const emptyState = computed<{ description: string; action: 'create' | 'show-all' | null }>(() => {
  if (!data.tasks.length) {
    return { description: '矩阵里还没有任务，点任意格子即可新建', action: 'create' }
  }
  if (filter.value.preset !== 'all') {
    return {
      description: `当前筛选（${formatRangeLabel(range.value)}）下没有任务，可查看全部`,
      action: 'show-all',
    }
  }
  return { description: '矩阵里没有可展示的任务（现有任务都在已归档的人员或项目下）', action: null }
})

/** 格子弹层里的人员对象。 */
const activePerson = computed(() =>
  activeCell.value ? (data.personMap.get(activeCell.value.personId) ?? null) : null,
)

/** 格子弹层里的项目对象。 */
const activeProject = computed(() =>
  activeCell.value ? (data.projectMap.get(activeCell.value.projectId) ?? null) : null,
)

// 约定：弹层展示该格的全部任务，不受日期筛选影响；格子里的「+N」只统计筛选结果。
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
  cellSheetOpen.value = true
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
  taskModalOpen.value = true
}

/** 在某个格子打开快速新建（D3）：只填标题，回车即落库。 */
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
  taskModalOpen.value = true
}

/** 从格子弹层底部的新建入口进入快速新建；弹层保持打开，保存后列表立即更新。 */
function createFromCell(): void {
  const cell = activeCell.value
  if (cell) openQuickCreate(cell.personId, cell.projectId)
}

/** 空状态里的「新建任务」：默认挂到待分配与第一个项目。 */
function createFirstTask(): void {
  const personId = data.systemPerson?.id ?? data.activePeople[0]?.id
  const projectId = data.activeProjects[0]?.id
  if (personId && projectId) openQuickCreate(personId, projectId)
}

/** 点击状态点循环切换；写库失败时由 store 回滚并提示。 */
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
  void router.push('/m/settings')
}

/** 转置：行列互换，只改呈现，不动数据。 */
function toggleTranspose(): void {
  transposed.value = !transposed.value
}
</script>

<template>
  <div class="m-matrix-page">
    <header class="m-bar">
      <h1 class="m-bar-title">矩阵</h1>
      <div class="m-bar-tools">
        <button type="button" class="m-filter-btn" @click="filterOpen = true">
          <span>{{ filterLabel }}</span>
          <n-icon :component="ChevronDownOutline" :size="14" />
        </button>
        <n-button
          quaternary
          circle
          size="small"
          :title="transposed ? '转回「人 × 项目」' : '转成「项目 × 人」'"
          @click="toggleTranspose"
        >
          <template #icon>
            <span class="m-transpose" :class="{ rotated: transposed }">
              <n-icon :component="SwapHorizontalOutline" :size="19" />
            </span>
          </template>
        </n-button>
      </div>
    </header>

    <div v-if="data.loading && !data.loaded" class="m-state">
      <n-spin size="small" />
      <span>正在加载数据…</span>
    </div>

    <div v-else-if="data.error && !data.loaded" class="m-state m-state--column">
      <n-empty description="数据加载失败">
        <template #extra>
          <span class="m-muted">{{ data.error }}</span>
          <n-button type="primary" size="small" @click="reload">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            重试
          </n-button>
        </template>
      </n-empty>
    </div>

    <div v-else-if="!realPeople.length || !data.activeProjects.length" class="m-state m-state--column">
      <n-empty
        :description="
          !realPeople.length ? '还没有人员，先在设置里添加成员' : '还没有项目，先在设置里创建项目'
        "
      >
        <template #extra>
          <n-button type="primary" size="small" @click="goSettings">去设置</n-button>
        </template>
      </n-empty>
    </div>

    <template v-else>
      <!-- 当前筛选没有任务时只挂提示，矩阵框架照常渲染。 -->
      <div v-if="!matrixTasks.length" class="m-hint">
        <span>{{ emptyState.description }}</span>
        <n-button
          v-if="emptyState.action === 'create'"
          type="primary"
          size="tiny"
          @click="createFirstTask"
        >
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
          新建任务
        </n-button>
        <n-button v-else-if="emptyState.action === 'show-all'" size="tiny" @click="showAll">
          查看全部
        </n-button>
        <n-button v-else size="tiny" @click="goSettings">去设置</n-button>
      </div>

      <mobile-matrix
        :rows="rows"
        :cols="cols"
        :cells="cells"
        @open-cell="openCell"
        @edit-task="openEdit"
        @cycle-status="handleCycleStatus"
      />
    </template>

    <mobile-filter-sheet v-model:open="filterOpen" v-model="filter" />

    <mobile-cell-sheet
      v-model:open="cellSheetOpen"
      :person="activePerson"
      :project="activeProject"
      :tasks="activeCellTasks"
      :filtered="Boolean(range)"
      @edit="openEdit"
      @cycle="handleCycleStatus"
      @create="createFromCell"
    />

    <quick-create-modal
      v-model:open="quickOpen"
      :person="quickPerson"
      :project="quickProject"
      :start-date="quickDefaults?.startDate ?? null"
      :end-date="quickDefaults?.endDate ?? null"
      @more="handleQuickMore"
    />

    <task-modal
      v-model:open="taskModalOpen"
      sheet
      :task="editingTask"
      :default-person-id="createDefaults?.personId"
      :default-project-id="createDefaults?.projectId"
      :default-title="createDefaults?.title"
      :default-start-date="createDefaults?.startDate"
      :default-end-date="createDefaults?.endDate"
    />
  </div>
</template>

<style scoped>
.m-matrix-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 10px 0;
}

.m-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 44px;
  padding: 0 2px;
}

.m-bar-title {
  flex: none;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.m-bar-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.m-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 168px;
  padding: 5px 9px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: pointer;
}

.m-filter-btn span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.m-filter-btn:active {
  background: var(--surface-muted);
}

.m-transpose {
  display: inline-flex;
  transition: transform 0.25s ease;
}

.m-transpose.rotated {
  transform: rotate(90deg);
}

.m-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  padding: 24px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
}

.m-state--column {
  flex-direction: column;
}

.m-muted {
  color: var(--text-muted);
  font-size: 12px;
}

.m-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 12px;
}

.m-hint span {
  flex: 1 1 160px;
  min-width: 0;
}
</style>
