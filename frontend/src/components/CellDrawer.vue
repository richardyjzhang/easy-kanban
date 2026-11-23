<!-- 格子抽屉（D1）：该人员在该项目下的全部任务 + 新建入口。 -->
<script setup lang="ts">
import { NButton, NDrawer, NDrawerContent, NEmpty, NIcon, NSpace } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { computed, reactive } from 'vue'

import TaskListPanel from './TaskListPanel.vue'
import { messageOfError } from '../api/client'
import { NEXT_STATUS } from '../constants'
import { dialog, message } from '../feedback'
import { useDataStore } from '../stores/data'
import type { Person, Project, Task, TaskInput } from '../types'

const props = withDefaults(
  defineProps<{
    open: boolean
    person: Person | null
    project: Project | null
    tasks: Task[]
    /** 当前是否处于日期筛选中，用于解释格子与抽屉的条数差异。 */
    filtered?: boolean
  }>(),
  { filtered: false },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [task: Task]
  create: []
}>()

const data = useDataStore()

// 正在切换状态的任务，防止快速连点产生错序。
const busy = reactive(new Set<number>())
const busyIds = computed(() => Array.from(busy))

const title = computed(() => {
  if (!props.person || !props.project) return '格子任务'
  return `${props.person.name} · ${props.project.name}`
})

const subtitle = computed(() => {
  if (!props.tasks.length) return '这个格子里还没有任务。'
  const prefix = props.filtered ? '格子按日期筛选显示，这里列出全部任务。' : '按时间排序。'
  return `共 ${props.tasks.length} 条任务，${prefix}`
})

/** 关闭抽屉。 */
function close(): void {
  emit('update:open', false)
}

/** 处理抽屉自身的关闭事件（遮罩、ESC、关闭按钮）。 */
function handleShow(value: boolean): void {
  if (!value) close()
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
  <n-drawer :show="open" :width="480" placement="right" @update:show="handleShow">
    <n-drawer-content :native-scrollbar="false" closable>
      <template #header>
        <div class="drawer-head">
          <h2>{{ title }}</h2>
          <p>{{ subtitle }}</p>
        </div>
      </template>

      <task-list-panel
        v-if="tasks.length"
        :tasks="tasks"
        :people="data.people"
        :projects="data.projects"
        :busy-ids="busyIds"
        :show-context="false"
        @edit="emit('edit', $event)"
        @delete="askDelete"
        @cycle="cycleStatus"
      />
      <n-empty v-else description="还没有任务">
        <template #extra>
          <n-button type="primary" :disabled="!project" @click="emit('create')">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            新建任务
          </n-button>
        </template>
      </n-empty>

      <template #footer>
        <n-space justify="end">
          <n-button type="primary" :disabled="!project" @click="emit('create')">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            新建任务
          </n-button>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.drawer-head h2 {
  font-size: 17px;
  font-weight: 650;
}

.drawer-head p {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 400;
}
</style>
