<!-- 格子弹窗（D1）：该人员在该项目下的全部任务 + 新建入口。
     居中 Modal 而非右侧抽屉，宽度随内容在 880–1200px 间自适应，
     任务表因此可以保留人员／项目列与正常列宽。 -->
<script setup lang="ts">
import { NButton, NIcon, NModal, NSpace } from 'naive-ui'
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
    /** 当前是否处于日期筛选中，用于解释格子与弹窗的条数差异。 */
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

// 内容自适应：任务少时收窄，列多时铺开；880px 是六列的最小可用宽度，窄屏退回 94vw。
const modalStyle = computed(() => ({
  width: 'fit-content',
  minWidth: 'min(880px, 94vw)',
  maxWidth: 'min(1200px, 94vw)',
}))

/** 关闭弹窗。 */
function close(): void {
  emit('update:open', false)
}

/** 处理弹窗自身的关闭事件（遮罩、ESC、关闭按钮）。 */
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
  <n-modal
    :show="open"
    preset="card"
    class="cell-modal"
    :bordered="false"
    :style="modalStyle"
    closable
    @update:show="handleShow"
  >
    <template #header>
      <div class="modal-head">
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
    </template>

    <div class="modal-body">
      <task-list-panel
        v-if="tasks.length"
        :tasks="tasks"
        :people="data.people"
        :projects="data.projects"
        :busy-ids="busyIds"
        @edit="emit('edit', $event)"
        @delete="askDelete"
        @cycle="cycleStatus"
      />
      <p v-else class="modal-empty">点下方「新建任务」添加第一条。</p>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="close">关闭</n-button>
        <n-button type="primary" :disabled="!project" @click="emit('create')">
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
          新建任务
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.modal-head h2 {
  font-size: 17px;
  font-weight: 650;
}

.modal-head p {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 400;
}

/* 任务多时弹窗内部滚动，避免整页被撑高。 */
.modal-body {
  max-height: 60vh;
  overflow: auto;
}

/* 空格子只给一行提示，点击入口统一放在 footer，避免中间多出一颗重复的按钮。 */
.modal-empty {
  padding: 24px 0;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
