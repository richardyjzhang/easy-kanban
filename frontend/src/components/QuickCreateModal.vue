<!-- 快速新建（D3）：只填标题，人员／项目／日期已由格子带入，回车即保存。
     「更多字段」切到完整任务表单，已输入的标题会带过去。 -->
<script setup lang="ts">
import { NButton, NInput, NModal } from 'naive-ui'
import { computed, nextTick, ref, watch } from 'vue'

import { messageOfError } from '../api/client'
import { message } from '../feedback'
import { useDataStore } from '../stores/data'
import { formatDateRange } from '../utils/format'
import type { Person, Project } from '../types'

const props = defineProps<{
  open: boolean
  person: Person | null
  project: Project | null
  startDate: string | null
  endDate: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  more: [title: string]
}>()

const data = useDataStore()

const title = ref('')
const saving = ref(false)
const error = ref('')
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

const personLabel = computed(() => {
  if (!props.person) return '未选择人员'
  return props.person.is_system ? `${props.person.name}（未指派）` : props.person.name
})

const context = computed(() => {
  const project = props.project?.name ?? '未选择项目'
  return `${personLabel.value} · ${project}`
})

const dateLabel = computed(() => formatDateRange(props.startDate, props.endDate))

const canSave = computed(
  () => title.value.trim().length > 0 && Boolean(props.person && props.project) && !saving.value,
)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    title.value = ''
    error.value = ''
    saving.value = false
    void nextTick(focusTitle)
  },
)

/** 弹层完全展开后再聚焦，动画过程中 focus 才不会丢。 */
function focusTitle(): void {
  inputRef.value?.focus()
}

/** 关闭弹层。 */
function close(): void {
  if (saving.value) return
  emit('update:open', false)
}

/** 处理弹窗自身的关闭事件（遮罩、ESC、关闭按钮）。 */
function handleShow(value: boolean): void {
  if (!value) close()
}

/** 回车提交；输入法组字过程中的回车留给输入法。 */
function onEnter(event: KeyboardEvent): void {
  if (event.isComposing) return
  event.preventDefault()
  void save()
}

/** 保存快速任务；日期为空就不写日期，交由后续补全。 */
async function save(): Promise<void> {
  if (!canSave.value || !props.person || !props.project) return

  saving.value = true
  error.value = ''
  try {
    const task = await data.createTask({
      title: title.value.trim(),
      person_id: props.person.id,
      project_id: props.project.id,
      start_date: props.startDate,
      end_date: props.endDate,
      status: 'todo',
      note: '',
    })
    message.success(`已新建「${task.title}」`)
    emit('update:open', false)
  } catch (cause) {
    error.value = messageOfError(cause)
    message.error(error.value)
  } finally {
    saving.value = false
  }
}

/** 切到完整表单，把当前标题一起带过去。 */
function openMore(): void {
  if (saving.value) return
  emit('more', title.value.trim())
}
</script>

<template>
  <n-modal
    :show="open"
    preset="card"
    class="quick-create"
    :bordered="false"
    :style="{ width: 'min(480px, 94vw)' }"
    :mask-closable="!saving"
    closable
    @update:show="handleShow"
    @after-enter="focusTitle"
  >
    <template #header>
      <div class="modal-head">
        <h2>快速新建</h2>
        <p>{{ context }} · {{ dateLabel }}</p>
      </div>
    </template>

    <div class="quick-body">
      <n-input
        ref="inputRef"
        v-model:value="title"
        :maxlength="120"
        placeholder="输入任务标题，回车创建"
        :status="error ? 'error' : undefined"
        :disabled="saving"
        @keydown.enter="onEnter"
      />
      <p class="quick-hint">
        日期默认取当前筛选范围；需要填写人员、日期或备注时点「更多字段」。
      </p>
      <p v-if="error" class="quick-error">{{ error }}</p>
    </div>

    <template #footer>
      <div class="quick-footer">
        <n-button text type="primary" :disabled="saving" @click="openMore">更多字段</n-button>
        <div class="footer-actions">
          <n-button :disabled="saving" @click="close">取消</n-button>
          <n-button type="primary" :loading="saving" :disabled="!canSave" @click="save">
            创建
          </n-button>
        </div>
      </div>
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

.quick-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-hint {
  color: var(--text-faint);
  font-size: 12px;
  line-height: 1.5;
}

.quick-error {
  color: var(--danger);
  font-size: 12px;
}

.quick-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
