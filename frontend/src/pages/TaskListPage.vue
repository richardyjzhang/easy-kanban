<!-- 任务录入页（M1）：筛选、列表、任务抽屉与删除确认。
     M2 起 /pc 会替换成矩阵视图，这里用到的 TaskForm / TaskListPanel / TaskDrawer 会被格子抽屉复用。 -->
<script setup lang="ts">
import { NButton, NCard, NEmpty, NIcon, NInput, NSelect, NSpace, NSpin } from 'naive-ui'
import { AddOutline, RefreshOutline, SearchOutline } from '@vicons/ionicons5'
import { computed, onMounted, reactive, ref } from 'vue'

import TaskDrawer from '../components/TaskDrawer.vue'
import TaskListPanel from '../components/TaskListPanel.vue'
import { messageOfError } from '../api/client'
import { NEXT_STATUS, STATUS_META, TASK_STATUSES } from '../constants'
import { dialog, message } from '../feedback'
import { useDataStore } from '../stores/data'
import type { Task, TaskInput } from '../types'

const data = useDataStore()

const filters = reactive({
  keyword: '',
  status: 'all',
  personId: 'all',
  projectId: 'all',
})

const drawerOpen = ref(false)
const editing = ref<Task | null>(null)

// 正在切换状态的任务，防止快速连点产生错序。
const busy = reactive(new Set<number>())
const busyIds = computed(() => Array.from(busy))

const statusOptions = TASK_STATUSES.map((status) => ({
  label: STATUS_META[status].label,
  value: status,
}))

const personFilterOptions = computed(() => [
  { label: '全部人员', value: 'all' },
  ...data.activePeople.map((person) => ({
    label: person.is_system ? '待分配' : person.name,
    value: String(person.id),
  })),
])

const projectFilterOptions = computed(() => [
  { label: '全部项目', value: 'all' },
  ...data.activeProjects.map((project) => ({
    label: project.name,
    value: String(project.id),
  })),
])

const filteredTasks = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return data.tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.personId !== 'all' && String(task.person_id) !== filters.personId) return false
    if (filters.projectId !== 'all' && String(task.project_id) !== filters.projectId) return false
    if (keyword) {
      const haystack = `${task.title}\n${task.note}`.toLowerCase()
      if (!haystack.includes(keyword)) return false
    }
    return true
  })
})

const hasFilters = computed(
  () =>
    filters.keyword.trim() !== '' ||
    filters.status !== 'all' ||
    filters.personId !== 'all' ||
    filters.projectId !== 'all',
)

const doingCount = computed(() => data.tasks.filter((task) => task.status === 'doing').length)
const doneCount = computed(() => data.tasks.filter((task) => task.status === 'done').length)

const summary = computed(() => {
  if (!data.tasks.length) return '还没有任务'
  const filtered = hasFilters.value ? ` · 当前筛选 ${filteredTasks.value.length} 条` : ''
  return `共 ${data.tasks.length} 条 · 进行中 ${doingCount.value} · 已完成 ${doneCount.value}${filtered}`
})

onMounted(() => {
  // 错误已写入 store，页面会展示重试入口。
  data.load().catch(() => {})
})

/** 处理状态筛选。 */
function setStatusFilter(value: unknown): void {
  filters.status = typeof value === 'string' ? value : 'all'
}

/** 处理人员筛选。 */
function setPersonFilter(value: unknown): void {
  filters.personId = typeof value === 'string' ? value : 'all'
}

/** 处理项目筛选。 */
function setProjectFilter(value: unknown): void {
  filters.projectId = typeof value === 'string' ? value : 'all'
}

/** 手动重试拉取全量数据。 */
function reload(): void {
  data.load(true).catch(() => {})
}

/** 清空全部筛选条件。 */
function resetFilters(): void {
  filters.keyword = ''
  filters.status = 'all'
  filters.personId = 'all'
  filters.projectId = 'all'
}

/** 打开新建任务抽屉。 */
function openCreate(): void {
  editing.value = null
  drawerOpen.value = true
}

/** 打开编辑任务抽屉。 */
function openEdit(task: Task): void {
  editing.value = task
  drawerOpen.value = true
}

/** 把任务对象转成接口需要的全量输入。 */
function toInput(task: Task): TaskInput {
  return {
    title: task.title,
    person_id: task.person_id,
    project_id: task.project_id,
    start_date: task.start_date,
    end_date: task.end_date,
    status: task.status,
    note: task.note,
  }
}

/** 点击状态点循环切换状态（约定走全量 PUT）。 */
async function cycleStatus(task: Task): Promise<void> {
  if (busy.has(task.id)) return
  busy.add(task.id)
  try {
    await data.updateTask(task.id, { ...toInput(task), status: NEXT_STATUS[task.status] })
  } catch (cause) {
    message.error(messageOfError(cause))
  } finally {
    busy.delete(task.id)
  }
}

/** 打开删除任务确认。 */
function askDelete(task: Task): void {
  dialog.warning({
    title: '删除任务',
    content: `确定删除「${task.title}」吗？删除后不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await data.deleteTask(task.id)
        message.success('任务已删除')
      } catch (cause) {
        message.error(messageOfError(cause))
        return false
      }
    },
  })
}
</script>

<template>
  <div class="task-page">
    <header class="page-head">
      <div>
        <h1>任务</h1>
        <p class="page-sub">{{ summary }}</p>
      </div>
      <n-button type="primary" @click="openCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新建任务
      </n-button>
    </header>

    <n-card :bordered="false" size="small" class="filter-card">
      <n-space align="center" :size="10" :wrap="true">
        <n-input
          v-model:value="filters.keyword"
          class="filter-search"
          placeholder="搜索标题或备注"
          clearable
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>

        <n-select
          :value="filters.status"
          :options="statusOptions"
          class="filter-select"
          @update:value="setStatusFilter"
        />
        <n-select
          :value="filters.personId"
          :options="personFilterOptions"
          class="filter-select"
          @update:value="setPersonFilter"
        />
        <n-select
          :value="filters.projectId"
          :options="projectFilterOptions"
          class="filter-select"
          @update:value="setProjectFilter"
        />

        <n-button quaternary :disabled="!hasFilters" @click="resetFilters">清除筛选</n-button>
      </n-space>
    </n-card>

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

    <n-card v-else-if="!data.tasks.length" :bordered="false">
      <n-empty description="还没有任务">
        <template #extra>
          <n-button type="primary" @click="openCreate">新建第一条任务</n-button>
        </template>
      </n-empty>
    </n-card>

    <n-card v-else-if="!filteredTasks.length" :bordered="false">
      <n-empty description="没有符合筛选条件的任务">
        <template #extra>
          <n-button @click="resetFilters">清除筛选</n-button>
        </template>
      </n-empty>
    </n-card>

    <task-list-panel
      v-else
      :tasks="filteredTasks"
      :people="data.people"
      :projects="data.projects"
      :busy-ids="busyIds"
      @edit="openEdit"
      @delete="askDelete"
      @cycle="cycleStatus"
    />

    <task-drawer
      v-model:open="drawerOpen"
      :task="editing"
      :default-person-id="data.systemPerson?.id"
      :default-project-id="data.activeProjects[0]?.id"
    />
  </div>
</template>

<style scoped>
.task-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-card {
  border-radius: 12px;
}

.filter-search {
  width: 260px;
}

.filter-select {
  width: 140px;
}

.filter-card :deep(.n-card__content) {
  padding: 12px 14px;
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

@media (max-width: 860px) {
  .filter-search,
  .filter-select {
    width: 100%;
  }
}
</style>
