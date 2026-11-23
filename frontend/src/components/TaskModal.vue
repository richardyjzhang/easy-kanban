<!-- 任务弹窗（D2）：新建/编辑任务，关闭前检查未保存修改。 -->
<script setup lang="ts">
import { NButton, NModal, NSpace } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import TaskForm from './TaskForm.vue'
import { ApiError, messageOfError } from '../api/client'
import { dialog, message } from '../feedback'
import { useDataStore } from '../stores/data'
import type { Person, Project, Task } from '../types'

const props = defineProps<{
  open: boolean
  task: Task | null
  defaultPersonId?: number
  defaultProjectId?: number
  defaultTitle?: string
  defaultStartDate?: string | null
  defaultEndDate?: string | null
  /** H5 用全屏 sheet 形态，PC 保持居中弹窗。 */
  sheet?: boolean
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const data = useDataStore()

const formRef = ref<InstanceType<typeof TaskForm> | null>(null)
const dirty = ref(false)
const saving = ref(false)
const serverErrors = ref<Record<string, string>>({})

const title = computed(() => (props.task ? '编辑任务' : '新建任务'))

// H5 铺满视口，PC 维持 560px 居中；只改外观，表单与保存逻辑共用一份。
const modalStyle = computed(() =>
  props.sheet
    ? { width: '100vw', height: '100dvh', maxHeight: 'none', borderRadius: '0', margin: '0' }
    : { width: 'min(560px, 94vw)' },
)

// 人员下拉默认只给在册人员；若任务原本指向已归档人员，补进选项以保留当前值。
const personOptions = computed<Person[]>(() => {
  const list = [...data.activePeople]
  const currentId = props.task?.person_id
  if (currentId && !list.some((person) => person.id === currentId)) {
    const archived = data.people.find((person) => person.id === currentId)
    if (archived) list.push(archived)
  }
  return list
})

// 项目下拉同理：归档项目补成「已归档」选项，避免编辑时值显示为空。
const projectOptions = computed<Project[]>(() => {
  const list = [...data.activeProjects]
  const currentId = props.task?.project_id
  if (currentId && !list.some((project) => project.id === currentId)) {
    const archived = data.projects.find((project) => project.id === currentId)
    if (archived) list.push(archived)
  }
  return list
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    serverErrors.value = {}
    dirty.value = false
  },
)

/** 关闭弹窗。 */
function close(): void {
  emit('update:open', false)
}

/** 请求关闭；有未保存内容时先确认。 */
function requestClose(): void {
  if (saving.value) return
  if (!dirty.value) {
    close()
    return
  }
  dialog.warning({
    title: '放弃修改？',
    content: '当前填写的内容还没有保存，关闭后会丢失。',
    positiveText: '放弃修改',
    negativeText: '继续编辑',
    onPositiveClick: () => {
      close()
    },
  })
}

/** 处理弹窗自身的关闭事件（遮罩、ESC、关闭按钮）。 */
function handleShow(value: boolean): void {
  if (!value) requestClose()
}

/** 校验并提交任务，服务端字段错误回填到表单。 */
async function save(): Promise<void> {
  if (saving.value) return
  const input = formRef.value?.validate()
  if (!input) return

  saving.value = true
  serverErrors.value = {}
  try {
    if (props.task) {
      await data.updateTask(props.task.id, input)
      message.success('任务已更新')
    } else {
      await data.createTask(input)
      message.success('任务已创建')
    }
    dirty.value = false
    close()
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 400 && Object.keys(cause.details).length > 0) {
      serverErrors.value = cause.details
    }
    message.error(messageOfError(cause))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <n-modal
    :show="open"
    preset="card"
    class="task-modal"
    :class="{ 'is-sheet': sheet }"
    :bordered="false"
    :style="modalStyle"
    :mask-closable="!saving"
    closable
    @update:show="handleShow"
  >
    <template #header>
      <div class="modal-head">
        <h2>{{ title }}</h2>
        <p>{{ task ? '修改后立即生效，没有额外的保存副本。' : '先记下来，其余字段之后再补。' }}</p>
      </div>
    </template>

    <div class="modal-body">
      <TaskForm
        ref="formRef"
        :key="
          task?.id ??
          `new-${defaultPersonId ?? 0}-${defaultProjectId ?? 0}-${defaultTitle ?? ''}-${defaultStartDate ?? ''}-${defaultEndDate ?? ''}`
        "
        :task="task"
        :people="personOptions"
        :projects="projectOptions"
        :default-person-id="defaultPersonId ?? data.systemPerson?.id ?? 0"
        :default-project-id="defaultProjectId ?? 0"
        :default-title="defaultTitle ?? ''"
        :default-start-date="defaultStartDate ?? null"
        :default-end-date="defaultEndDate ?? null"
        :server-errors="serverErrors"
        :disabled="saving"
        @dirty="dirty = $event"
      />
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button :disabled="saving" @click="requestClose">取消</n-button>
        <n-button
          type="primary"
          :loading="saving"
          :disabled="projectOptions.length === 0"
          @click="save"
        >
          保存
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

/* 窄屏 / 矮窗口时表单在弹窗内部滚动，避免底部按钮被挤出视口。 */
.modal-body {
  max-height: 64vh;
  overflow: auto;
}

/* H5 全屏 sheet：头部、内容、底部按钮纵向排满视口，表单在中间滚动。 */
.task-modal.is-sheet {
  display: flex;
  flex-direction: column;
}

.task-modal.is-sheet :deep(.n-card__content) {
  flex: 1 1 auto;
  overflow: auto;
}

.task-modal.is-sheet .modal-body {
  max-height: none;
  overflow: visible;
}
</style>
