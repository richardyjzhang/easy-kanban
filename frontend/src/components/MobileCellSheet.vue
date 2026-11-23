<!-- H5 格子弹层（D1）：底部全屏 sheet，展示该人员在该项目下的全部任务。
     弹层内可新建、编辑、切换状态与删除；关闭后回到矩阵。 -->
<script setup lang="ts">
import { NButton, NDrawer, NDrawerContent, NIcon, NSpace } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { computed } from 'vue'

import MobileTaskList from './MobileTaskList.vue'
import { messageOfError } from '../api/client'
import { dialog, message } from '../feedback'
import { useDataStore } from '../stores/data'
import type { Person, Project, Task } from '../types'

const props = withDefaults(
  defineProps<{
    open: boolean
    person: Person | null
    project: Project | null
    tasks: Task[]
    /** 当前是否处于日期筛选中，用于解释格子与弹层的条数差异。 */
    filtered?: boolean
  }>(),
  { filtered: false },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [task: Task]
  create: []
  cycle: [task: Task]
}>()

const data = useDataStore()

const title = computed(() => {
  if (!props.person || !props.project) return '格子任务'
  return `${props.person.name} · ${props.project.name}`
})

const subtitle = computed(() => {
  if (!props.tasks.length) return '这个格子里还没有任务。'
  const prefix = props.filtered ? '格子按日期筛选显示，这里列出全部任务。' : '按时间排序。'
  return `共 ${props.tasks.length} 条任务，${prefix}`
})

/** 关闭弹层。 */
function close(): void {
  emit('update:open', false)
}

/** 打开删除确认；删除成功后列表由 store 驱动更新。 */
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
  <n-drawer
    :show="open"
    placement="bottom"
    height="100%"
    :bordered="false"
    class="cell-sheet"
    @update:show="(value) => !value && close()"
  >
    <n-drawer-content
      :title="title"
      closable
      :native-scrollbar="false"
      :footer-style="{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }"
    >
      <p class="sheet-sub">{{ subtitle }}</p>

      <mobile-task-list
        v-if="tasks.length"
        :tasks="tasks"
        :busy-ids="data.statusBusyIds"
        @edit="emit('edit', $event)"
        @cycle="emit('cycle', $event)"
        @delete="askDelete"
      />
      <div v-else class="sheet-empty">
        <p>这里还没有任务。</p>
        <p class="sheet-empty-sub">点下方「新建任务」添加第一条。</p>
      </div>

      <template #footer>
        <n-space justify="space-between">
          <n-button @click="close">关闭</n-button>
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
.sheet-sub {
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 12px;
}

.sheet-empty {
  padding: 48px 0;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.sheet-empty-sub {
  margin-top: 6px;
  color: var(--text-faint);
  font-size: 12px;
}
</style>
